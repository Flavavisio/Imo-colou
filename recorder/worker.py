#!/usr/bin/env python3
"""Vigia Cloud event recorder worker.

Claims pending event jobs from Supabase, requests a short-lived Imou cloud RTSP
URL, records only the configured event window with FFmpeg, uploads the MP4 to
the private event-clips bucket, and marks the event as clip_ready.

Required environment variables:
  SUPABASE_URL
  SUPABASE_SECRET_KEY

Optional:
  VIGIA_WORKER_ID
  FFMPEG_BIN
  POLL_SECONDS
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import time
import uuid
from typing import Any
from urllib.parse import quote

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
WORKER_ID = os.getenv("VIGIA_WORKER_ID", f"recorder-{uuid.uuid4()}")
FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")
POLL_SECONDS = float(os.getenv("POLL_SECONDS", "2"))

HOSTS = {
    "eu": "openapi-fk.easy4ip.com",
    "us": "openapi-or.easy4ip.com",
    "sg": "openapi-sg.easy4ip.com",
}
ALLOWED_HOSTS = set(HOSTS.values())


def supabase_headers(content_type: str = "application/json") -> dict[str, str]:
    headers = {"apikey": SUPABASE_SECRET_KEY, "Content-Type": content_type}
    # Legacy service_role keys are JWTs and also work in Authorization.
    if SUPABASE_SECRET_KEY.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {SUPABASE_SECRET_KEY}"
    return headers


def rpc(name: str, payload: dict[str, Any]) -> Any:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{name}",
        headers=supabase_headers(),
        data=json.dumps(payload),
        timeout=30,
    )
    r.raise_for_status()
    body = r.json()
    return body


def imou_call(
    host: str,
    endpoint: str,
    app_id: str,
    app_secret: str,
    params: dict[str, Any],
) -> dict[str, Any]:
    ts = round(time.time())
    nonce = uuid.uuid4().hex
    sign = hashlib.md5(
        f"time:{ts},nonce:{nonce},appSecret:{app_secret}".encode("utf-8")
    ).hexdigest()
    payload = {
        "system": {
            "ver": "1.0",
            "appId": app_id,
            "sign": sign,
            "time": ts,
            "nonce": nonce,
        },
        "params": params,
        "id": str(uuid.uuid4()),
    }
    r = requests.post(
        f"https://{host}/openapi/{endpoint}",
        headers={"Content-Type": "application/json", "Client-Type": "VigiaCloudRecorder"},
        json=payload,
        timeout=25,
        allow_redirects=False,
    )
    r.raise_for_status()
    result = r.json().get("result") or {}
    if str(result.get("code")) != "0":
        raise RuntimeError(f"Imou {endpoint} recusado: {result.get('code')}")
    data = result.get("data")
    if not isinstance(data, dict):
        raise RuntimeError(f"Resposta Imou {endpoint} incompleta")
    return data


def get_rtsp(job: dict[str, Any]) -> str:
    region = str(job["region"])
    host = HOSTS.get(region)
    if not host:
        raise RuntimeError("Região Imou inválida")

    auth = imou_call(host, "accessToken", job["app_id"], job["app_secret"], {})
    token = auth.get("accessToken")
    if not isinstance(token, str) or not token:
        raise RuntimeError("A Imou não devolveu accessToken")

    current_domain = auth.get("currentDomain")
    if current_domain:
        from urllib.parse import urlparse

        raw = str(current_domain)
        parsed = urlparse(raw if "://" in raw else f"https://{raw}")
        if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
            raise RuntimeError("Domínio Imou inesperado")
        host = parsed.hostname

    stream = imou_call(
        host,
        "getStreamUrl",
        job["app_id"],
        job["app_secret"],
        {
            "token": token,
            "deviceId": job["device_id"],
            "channelId": job["channel_id"] or "0",
            "streamId": 0,
        },
    )
    url = stream.get("url")
    if not isinstance(url, str) or not url.startswith("rtsp://"):
        raise RuntimeError("A Imou não devolveu um RTSP válido")
    return url


def record_clip(rtsp_url: str, seconds: int, output: pathlib.Path) -> None:
    cmd = [
        FFMPEG_BIN,
        "-hide_banner",
        "-loglevel",
        "warning",
        "-rtsp_transport",
        "tcp",
        "-i",
        rtsp_url,
        "-t",
        str(seconds),
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        "-y",
        str(output),
    ]
    subprocess.run(cmd, check=True, timeout=max(90, seconds + 60))
    if not output.exists() or output.stat().st_size < 1024:
        raise RuntimeError("FFmpeg não produziu um clip válido")


def upload_clip(job: dict[str, Any], path: pathlib.Path) -> str:
    object_path = f"{job['reseller_id']}/{job['event_id']}.mp4"
    with path.open("rb") as fh:
        headers = supabase_headers("video/mp4")
        headers["x-upsert"] = "true"
        r = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/event-clips/{quote(object_path, safe='/')}",
            headers=headers,
            data=fh,
            timeout=120,
        )
    r.raise_for_status()
    return object_path


def finish(job_id: str, ok: bool, clip_path: str | None = None, error: str | None = None) -> None:
    rpc(
        "vigia_finish_clip_job",
        {
            "p_job_id": job_id,
            "p_worker_id": WORKER_ID,
            "p_ok": ok,
            "p_clip_path": clip_path,
            "p_error": error,
        },
    )


def claim() -> dict[str, Any] | None:
    rows = rpc("vigia_claim_clip_job", {"p_worker_id": WORKER_ID})
    if not rows:
        return None
    job = rows[0]
    required = ("job_id", "event_id", "reseller_id", "camera_id", "device_id", "app_id", "region", "app_secret")
    if any(not job.get(k) for k in required):
        finish(job["job_id"], False, error="Credenciais/câmara incompletas")
        return None
    return job


def process(job: dict[str, Any]) -> None:
    with tempfile.TemporaryDirectory(prefix="vigia-clip-") as tmp:
        output = pathlib.Path(tmp) / "event.mp4"
        rtsp = get_rtsp(job)
        record_clip(rtsp, int(job.get("clip_seconds") or 30), output)
        object_path = upload_clip(job, output)
        finish(job["job_id"], True, clip_path=object_path)


def main() -> None:
    print(f"Vigia recorder iniciado: {WORKER_ID}", flush=True)
    while True:
        try:
            job = claim()
            if not job:
                time.sleep(POLL_SECONDS)
                continue
            try:
                process(job)
                print(f"clip concluído event={job['event_id']}", flush=True)
            except Exception as exc:
                finish(job["job_id"], False, error=str(exc))
                print(f"clip falhou event={job['event_id']}: {exc}", flush=True)
        except KeyboardInterrupt:
            break
        except Exception as exc:
            print(f"worker error: {exc}", flush=True)
            time.sleep(max(POLL_SECONDS, 5))


if __name__ == "__main__":
    main()
