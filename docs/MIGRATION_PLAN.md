# Vigia Cloud — estado da migração

## Estado atual

A versão React/Vinext v6 foi recuperada integralmente e preservada na branch:

`archive/react-v6-before-html`

O `main` foi convertido para frontend estático:

- `index.html`
- `styles.css`
- `app.js`

O backend de dados é Supabase.

## Supabase concluído

- Auth;
- Super Admin;
- profiles;
- platform_admins;
- resellers;
- reseller_members;
- clients;
- client_members;
- installations;
- cameras;
- plans;
- camera_plans;
- reseller_sale_prices;
- events;
- workspace_snapshots;
- RLS multi-tenant;
- limites de licença/trial.

Super Admin atual:

`flavio.rosa87@icloud.com`

## Persistência transitória

O frontend estático usa `workspace_snapshots` para manter compatibilidade com o modelo funcional da v6 enquanto a interface é estabilizada.

O snapshot está limitado por RLS ao Super Admin nesta fase.

## Próximas fases

1. Migrar cada módulo do snapshot para tabelas normalizadas.
2. Ativar contas independentes de revendedores.
3. Ativar contas de clientes.
4. Implementar Supabase Edge Function para Imou.
5. Receber eventos.
6. Gerar clips por evento.
7. Player, thumbnails e downloads.
8. Retenção e notificações.

## Segurança

- publishable key pode estar no browser;
- secret/service-role nunca no frontend;
- App Secret Imou nunca no frontend;
- credenciais RTSP nunca no frontend;
- RLS obrigatória para dados expostos;
- sem gravação contínua: apenas eventos.
