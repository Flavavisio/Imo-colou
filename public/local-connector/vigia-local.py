#!/usr/bin/env python3
"""Vigia Cloud: diagnóstico RTSP local. Não grava nem envia vídeo."""
import argparse
import datetime
import getpass
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.parse import quote
import uuid

NETWORKS = tuple(ipaddress.ip_network(n) for n in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'))

def validate(config):
    if config.get('format') != 'vigia-local-config-v1':
        raise ValueError('Formato de configuração inválido.')
    uuid.UUID(config['cameraId'])
    ip = ipaddress.ip_address(config['host'])
    if ip.version != 4 or not any(ip in n for n in NETWORKS):
        raise ValueError('Usa o IPv4 privado da câmara na tua rede local.')
    port = config.get('port')
    if type(port) is not int or not 1 <= port <= 65535:
        raise ValueError('Porta inválida.')
    path = config.get('path', '')
    if (not isinstance(path, str) or not path.startswith('/') or len(path) > 300
            or re.search(r'[\s@\\]|://|(?:[?&])(?:user(?:name)?|pass(?:word)?|pwd|token|auth)=', path, re.I)):
        raise ValueError('Indica apenas o caminho RTSP, sem utilizador, password ou token.')
    return config

def probe(config, username, password, executable=None):
    config = validate(config)
    result = {'format': 'vigia-local-report-v1', 'cameraId': config['cameraId'],
              'host': config['host'], 'port': config['port'], 'path': config['path'],
              'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
              'status': 'failed', 'reason': 'connection_failed', 'codec': 'unknown', 'width': 0, 'height': 0}
    executable = executable or shutil.which('ffprobe')
    if not executable:
        result.update(status='tool_missing', reason='ffprobe_missing')
        return result
    auth = (quote(username, safe='') + ':' + quote(password, safe='') + '@') if username else ''
    uri = 'rtsp://' + auth + config['host'] + ':' + str(config['port']) + config['path']
    # O URL secreto é lido de um ficheiro temporário privado, não dos argumentos do processo.
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.txt', delete=False) as stream:
            temp_path = stream.name
            if os.name != 'nt':
                os.chmod(temp_path, 0o600)
            stream.write(uri)
        command = [executable, '-v', 'error', '-rtsp_transport', 'tcp', '-/i', temp_path,
                   '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height', '-of', 'json']
        output = subprocess.run(command, capture_output=True, timeout=20, check=False)
        if output.returncode != 0:
            # Não devolver stderr: pode conter credenciais do URL.
            if b'Option not found' in output.stderr or b'Unrecognized option' in output.stderr:
                result['reason'] = 'ffprobe_update_required'
            return result
        streams = json.loads(output.stdout).get('streams', [])
        if streams:
            stream = streams[0]
            width, height = int(stream.get('width', 0)), int(stream.get('height', 0))
            if not (0 < width <= 32768 and 0 < height <= 32768):
                return result
            codec = {'h264': 'H.264', 'hevc': 'H.265'}.get(stream.get('codec_name'), 'other')
            result.update(status='stream_found', reason='stream_detected', codec=codec, width=width, height=height)
    except subprocess.TimeoutExpired:
        result['reason'] = 'timeout'
    except (OSError, ValueError, TypeError, KeyError):
        result['reason'] = 'probe_failed'
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass
    return result

def main():
    parser = argparse.ArgumentParser(description='Teste local de vídeo RTSP; não grava nem envia imagens.')
    parser.add_argument('--config', required=True, help='Configuração JSON descarregada da Vigia Cloud')
    parser.add_argument('--output', default='vigia-relatorio.json')
    args = parser.parse_args()
    try:
        config_path=Path(args.config)
        if config_path.stat().st_size>8192:
            raise ValueError('Configuração demasiado grande.')
        config=validate(json.loads(config_path.read_text(encoding='utf-8-sig')))
        output_path=Path(args.output)
        if output_path.exists():
            raise ValueError('O ficheiro de saída já existe. Escolhe outro nome com --output.')
        print('Diagnóstico local. As credenciais não são enviadas para a aplicação.')
        username=input('Utilizador da câmara (Enter se não houver): ').strip()
        password=getpass.getpass('Password da câmara: ') if username else ''
        result=probe(config,username,password)
        with output_path.open('x',encoding='utf-8') as out:
            json.dump(result,out,ensure_ascii=False,indent=2)
        print('Resultado:',result['status'],'/',result['reason'])
        print('Importa o relatório JSON na área Ligações da Vigia Cloud.')
        print('Este teste não valida eventos ONVIF nem gravação cloud.')
    except (ValueError,KeyError,TypeError,OSError):
        print('Configuração inválida ou erro de ficheiro. Confirma os campos e a pasta de saída.')
        raise SystemExit(1)

if __name__ == '__main__':
    main()
