# Vigia Cloud — arquitetura estática

## Frontend

O `main` já não usa React/Next/Vinext.

A aplicação é servida diretamente por:

- `index.html`
- `styles.css`
- `app.js`

Não existe build step obrigatório.

## Autenticação

O `app.js` liga diretamente ao Supabase Auth usando a publishable key.

Após login:
1. valida a sessão;
2. confirma presença em `platform_admins`;
3. carrega `workspace_snapshots`;
4. aplica RLS no Supabase.

## Dados

Nesta fase o Super Admin usa `workspace_snapshots` para preservar o contrato da v6.

As tabelas normalizadas já existem e serão ligadas módulo a módulo.

## Rollback

A aplicação React anterior está preservada em:

`archive/react-v6-before-html`

## Validação

GitHub Actions valida:
- existência de `index.html`, `styles.css` e `app.js`;
- sintaxe de `app.js`;
- sintaxe do conector local JavaScript.
