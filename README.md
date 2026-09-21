# Vigia Cloud

Plataforma white label de videovigilância por eventos.

## Estado deste repositório

A aplicação publicada existe fora deste repositório e o respetivo código-fonte ainda não foi recuperado para GitHub. Por isso, este repositório **não contém uma recriação da app**.

Neste momento contém apenas a fundação Supabase já aplicada ao projeto `Cloud`:

- autenticação via Supabase Auth;
- isolamento multi-tenant por RLS;
- Super Admin → Revendedores → Clientes → Instalações → Câmaras;
- bootstrap seguro do Super Admin `flavio.rosa87@gmail.com` após confirmação da conta;
- tipos TypeScript gerados a partir do schema.

## Regra de migração

Não substituir D1/R2 nem dados existentes sem comparação e validação. A migração será incremental depois de o source real da versão publicada ser recuperado.

## Supabase

Project ref: `tegwpmtylwivktuuktpo`

URL: `https://tegwpmtylwivktuuktpo.supabase.co`

As chaves secretas nunca devem ser colocadas neste repositório.
