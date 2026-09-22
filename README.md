# Vigia Cloud

Plataforma white label de videovigilância por eventos.

## Stack atual

O frontend principal é agora **HTML + CSS + JavaScript puro**:

- `index.html` — entrada da aplicação;
- `styles.css` — UI/UX responsivo;
- `app.js` — autenticação, navegação, CRUD e ligação ao Supabase;
- `public/local-connector/vigia-local.js` — diagnóstico RTSP local em JavaScript/Node;
- `supabase/` — schema e migrações PostgreSQL/RLS.

Não existe React, Next, Tailwind, shadcn ou etapa de build no `main`.

A versão React/Vinext original ficou preservada em:

`archive/react-v6-before-html`

## Funcionalidades no frontend estático

- login Supabase;
- Super Admin;
- dashboard;
- revendedores;
- clientes;
- instalações;
- câmaras;
- planos;
- planos por câmara;
- licenças e trial;
- carteiras e previsão comercial;
- alertas;
- marca própria;
- importação/exportação JSON;
- calculadora de armazenamento;
- configuração Imou/RTSP;
- layout mobile/responsivo.

## Supabase

Projeto: `tegwpmtylwivktuuktpo`

Super Admin atual:

`flavio.rosa87@icloud.com`

O browser utiliza apenas a **publishable key**. Chaves secretas/service-role e credenciais Imou nunca devem ser colocadas no `app.js`.

## Imou

A área de configuração existe, mas o `App Secret` tem de ser tratado numa Supabase Edge Function ou outro backend seguro. A receção automática de eventos, clips, player, downloads e notificações continua como fase seguinte.

## Rede local / RTSP

O browser não deve receber credenciais RTSP. O diagnóstico local está em:

`public/local-connector/vigia-local.js`

Requer Node.js 22+ e ffprobe.

## Validação

GitHub Actions executa automaticamente:

`node --check app.js`

e

`node --check public/local-connector/vigia-local.js`

em cada alteração ao `main`.
