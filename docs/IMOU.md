# Integração Imou

## Estado atual

A integração Imou está preparada em quatro peças:

- `imou-devices`: consulta segura de equipamentos/canais;
- associação Device ID + Channel à tabela `cameras`;
- `imou-configure-callback`: ativa/desativa o callback oficial por revendedor;
- `imou-callback`: recebe alarmes e estados online/offline e grava metadados em `events`.

As funções de consulta/configuração exigem JWT Supabase. O webhook público não aceita JWT da Imou — a documentação oficial não define uma assinatura do callback — por isso o Vigia Cloud usa um token opaco aleatório por revendedor, guardado apenas como SHA-256. A URL/token nunca é devolvida ao browser.

## Credenciais

App ID e App Secret são introduzidos pelo utilizador autorizado e usados apenas em memória durante a consulta/configuração. Não são persistidos no browser, tabelas ou GitHub.

O access token Imou também é transitório.

## Eventos

Ao ativar eventos:
- é chamado `setMessageCallback` com `alarm,deviceStatus`;
- alarmes associados a Device ID + Channel conhecidos criam registos em `events`;
- online/offline atualiza `cameras.online_status`;
- o token de cloud recording recebido no push, quando existe, fica numa tabela fechada `imou_event_tokens`, sem acesso do browser;
- eventos duplicados são ignorados através de `provider_event_id`.

A Imou exige HTTP 200 no callback para continuar a enviar mensagens. Payloads válidos mas sem câmara associada são aceites e ignorados, evitando ciclos de retry.

## Segurança multi-tenant

- Uma App ID só pode ser configurada num revendedor.
- Super Admin pode configurar qualquer revendedor.
- Revendedor owner/admin pode ativar/desativar callbacks do próprio tenant.
- Revendedor operator pode consultar equipamentos e associá-los a câmaras, mas não gerir o callback.
- Cliente final não tem acesso às credenciais Imou.
- Segredos de callback e tokens de gravação não têm grants para anon/authenticated.

## Protocolo

A assinatura segue a especificação e o cliente oficial atual: MD5 de
`time:<time>,nonce:<nonce>,appSecret:<secret>`.

Gateways usados:
- Europa: `openapi-fk.easy4ip.com`
- América: `openapi-or.easy4ip.com`
- Singapura: `openapi-sg.easy4ip.com`

## Ainda por testar com hardware

A IPC-C22E real ainda deve validar:
- listagem da conta;
- canais devolvidos;
- tipos de alarme efetivamente enviados;
- presença de token de cloud recording;
- acesso a clip/snapshot disponível no plano Imou.

## Próxima fase

- obter clip por evento quando a API/conta o permitir;
- Storage de clips/thumbnails;
- player e download;
- retenção automática;
- notificações.
