# Vigia Cloud — transição D1 → Supabase sem interrupção

A v6 original continua funcional em D1/R2. O código passa a suportar um segundo modo de execução sem obrigar a cortar o backend atual.

## Modos

### D1 (atual / fallback)
- `NEXT_PUBLIC_VIGIA_DATA_BACKEND=d1`
- `VIGIA_DATA_BACKEND=d1`
- autenticação do ChatGPT Sites
- dados em D1
- logótipos em R2

### Supabase (teste / futura produção)
- `NEXT_PUBLIC_VIGIA_DATA_BACKEND=supabase`
- `VIGIA_DATA_BACKEND=supabase`
- Supabase Auth por email + palavra-passe
- o utilizador define a própria palavra-passe na ativação
- confirmação de email pelo Supabase
- `flavio.rosa87@gmail.com` é promovido a Super Admin apenas depois da conta estar confirmada, através do bootstrap já configurado no banco
- o endpoint `/api/workspace` mantém o mesmo contrato da v6, mas passa a ler/escrever `workspace_snapshots`
- RLS limita o snapshot ao respetivo `auth.uid()` **e exige `platform_admin`** nesta fase transitória

## Porque existe `workspace_snapshots`

A v6 guarda toda a operação num único JSON D1. Trocar imediatamente o frontend para dezenas de tabelas normalizadas criaria risco desnecessário. O snapshot é uma camada transitória para validar primeiro:
1. Auth real;
2. sessões;
3. persistência Supabase;
4. concorrência por `revision`;
5. isolamento por utilizador.

Nesta fase apenas o Super Admin usa `workspace_snapshots`; contas de revendedor/cliente serão ligadas diretamente às tabelas normalizadas. Depois disso, cada módulo pode migrar para as tabelas normalizadas (`plans`, `camera_plans`, `resellers`, `clients`, `installations`, `cameras`, `reseller_sale_prices`, `events`) sem alterar de uma vez todo o frontend.

## Variáveis

Nunca colocar chaves secret/service-role no browser ou no repositório. O frontend usa apenas a publishable key, protegida por RLS.

## Imou

`App ID` e `App Secret` continuam fora do browser e fora da base de dados de configuração comum. A migração Supabase não altera esta regra.

## Cutover

Só alterar os dois valores `VIGIA_DATA_BACKEND` para `supabase` quando a conta Super Admin estiver ativada e o snapshot tiver sido validado. Até lá, a publicação atual continua em D1.
