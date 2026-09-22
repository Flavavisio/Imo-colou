# Vigia Cloud Recorder

Worker de gravação **apenas por evento**.

## Fluxo

1. O callback Imou cria um evento e um `clip_job`.
2. O worker reclama um job de forma atómica.
3. Obtém App Secret encriptado via Supabase Vault.
4. Pede à Imou um RTSP cloud temporário através de `getStreamUrl`.
5. FFmpeg grava apenas a duração do evento (por defeito 30 s).
6. O MP4 é enviado para o bucket privado `event-clips`.
7. O evento passa para `clip_ready`.

Não existe gravação contínua e não existe pre-roll neste modelo.

## Requisitos

- Python 3.11+
- FFmpeg instalado
- `pip install -r requirements.txt`
- Variáveis de ambiente de `.env.example`

Nunca colocar a `SUPABASE_SECRET_KEY` no frontend ou no GitHub.

## Arranque

```bash
python recorder/worker.py
```

Para produção deve correr como serviço (Docker/systemd/etc.) num host sempre ligado.
