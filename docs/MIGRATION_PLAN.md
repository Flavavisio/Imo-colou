# Vigia Cloud — Plano de migração para Supabase

## Objetivo

Migrar a aplicação publicada para Supabase sem recriar a aplicação, sem apagar dados existentes e sem trocar D1/R2 antes de validar cada módulo.

## Fonte de verdade atual

A versão publicada do Vigia Cloud continua a ser a fonte de verdade funcional até o código-fonte da source version 6 ser recuperado.

Publicação conhecida:
- URL: https://vigia-cloud.flowy-mouse-8040.chatgpt.site
- Site project: appgprj_6ab07302c5648191b8b81500918a51b5
- Source version: 6
- Stack declarada: React/TypeScript, Vinext, D1 e R2

O GitHub estava vazio quando esta migração começou.

## Fase 1 — Fundação Supabase

Estado: concluída.

Implementado:
- Supabase Auth preparado;
- profiles;
- platform_admins;
- resellers;
- reseller_members;
- clients;
- client_members;
- installations;
- cameras;
- RLS em todas as tabelas públicas;
- hierarquia multi-tenant Super Admin → Revendedor → Cliente → Instalação → Câmara;
- bootstrap do Super Admin flavio.rosa87@icloud.com após confirmação da conta;
- tipos TypeScript gerados;
- nenhum seed de dados da app criado.

## Fase 2 — Recuperar o source real

Não iniciar alterações de frontend até recuperar a versão publicada.

Ao obter o source:
1. importar o source sem modificar comportamento;
2. fazer commit de baseline;
3. identificar acesso a D1 e R2;
4. mapear modelos existentes para o schema Supabase;
5. comparar campos antes de qualquer migração;
6. preservar IDs existentes quando tecnicamente possível.

## Fase 3 — Autenticação

Trocar o seletor de perfis de pré-visualização por autenticação real.

Fluxos:
- login;
- logout;
- recuperação/definição de password;
- sessão persistente;
- route guards;
- Super Admin;
- Admin de Revendedor;
- Cliente final.

Nunca usar user_metadata para autorização. A autorização deve depender do UUID do utilizador e das tabelas de membership/RLS.

## Fase 4 — Migração de dados por módulos

Ordem:
1. Revendedores
2. Clientes
3. Instalações
4. Câmaras
5. Planos, preços e licenças
6. Marca própria
7. Ligações Imou/RTSP
8. Eventos
9. Armazenamento

Para cada módulo:
- exportar dados do D1;
- comparar contagens e campos;
- importar para Supabase;
- validar leitura;
- validar escrita;
- validar isolamento entre tenants;
- só depois desligar o caminho antigo.

## Fase 5 — R2 / Storage

Não migrar logótipos ou gravações antes de inventariar objetos R2 existentes.

Separar pelo menos:
- branding/logótipos;
- clips de eventos;
- thumbnails;
- exports/downloads.

Os caminhos de Storage devem incluir tenant/reseller e entidades necessárias ao controlo de acesso.

## Fase 6 — Imou e eventos

Depois da autenticação e isolamento:
- credenciais Imou apenas no servidor;
- associação device/channel → camera;
- receção de eventos;
- criação de clip por evento;
- reprodução;
- download;
- retenção;
- notificações.

Não existe gravação contínua no modelo funcional do Vigia Cloud.

## Regras de segurança

- Nunca colocar secret key/service_role no browser.
- App ID/App Secret Imou nunca no frontend público.
- RLS ativa em todas as tabelas expostas.
- Nenhuma tabela deve usar apenas TO authenticated sem predicado de tenant.
- Alterações de tenant IDs têm de ser bloqueadas por FK/RLS.
- Testar acesso cruzado entre dois revendedores e dois clientes antes de produção.

## Critério para desligar D1/R2

D1/R2 só deixam de ser fonte de verdade quando:
- contagens batem;
- relações batem;
- login real funciona;
- RLS foi testada;
- o Super Admin vê tudo;
- cada Revendedor vê apenas o seu espaço;
- cada Cliente vê apenas o seu espaço;
- rollback foi documentado.
