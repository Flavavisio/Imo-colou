# Vigia Cloud — integração Imou

## Regra principal

O frontend estático **não pode** conter o App Secret da Imou.

Como `app.js` é público no browser, qualquer chamada Imou que exija segredo deve passar por uma camada server-side.

## Arquitetura recomendada

Frontend:

`index.html / app.js`

↓

Supabase Edge Function:

`/functions/v1/imou`

↓

API Imou Cloud

## No frontend

Pode ser guardado:
- Device ID;
- Channel ID;
- nome/modelo;
- associação à câmara.

Não pode ser guardado:
- App Secret;
- passwords;
- tokens administrativos permanentes.

## Edge Function

Responsabilidades futuras:
- receber pedido autenticado;
- validar o utilizador/tenant;
- ler App ID/App Secret de secrets da função;
- autenticar na Imou;
- consultar dispositivos/canais;
- receber ou processar eventos conforme a API;
- devolver apenas dados necessários ao frontend.

## Estado atual

O cadastro de câmaras Imou existe.

Ainda falta:
- Edge Function Imou real;
- teste com câmara real;
- receção automática de eventos;
- clips por evento;
- player/download;
- notificações.
