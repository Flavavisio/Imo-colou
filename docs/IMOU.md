# Integração Imou

## Estado atual

A consulta de equipamentos Imou está ativa através da Supabase Edge Function `imou-devices`.

- O frontend envia App ID, App Secret, região e página por HTTPS.
- As credenciais existem apenas em memória durante a área Ligações.
- App Secret e access token não são guardados em localStorage, tabelas ou logs da aplicação.
- A Edge Function valida o JWT Supabase e só permite Super Admin ou Revendedor owner/admin/operator.
- O browser recebe apenas equipamentos, modelo, estado e canais.
- A associação Device ID + Channel é persistida na tabela `cameras`.

## Protocolo

Implementação alinhada com o cliente oficial atual `Imou-OpenPlatform/Py-Imou-Open-Api`:

- gateways Europa / América / Singapura;
- `/openapi/accessToken`;
- `/openapi/listDeviceDetailsByPage`;
- assinatura MD5 de `time:<time>,nonce:<nonce>,appSecret:<secret>`;
- token apenas no pedido seguinte ao accessToken.

## Ainda por validar com hardware

A consulta deve ser testada posteriormente com a IPC-C22E real. A associação na plataforma não é prova de que a câmara suporta todos os tipos de evento, alarm push ou clips cloud.

## Não implementado ainda

- registo automático de callback Imou;
- receção de alarmes;
- clips e thumbnails;
- player;
- downloads;
- retenção automática.
