# Vigia Cloud — entrega do código v6

Versão: b665698f788f97b11ce71767fa43e428bfc7367b
App publicada: https://vigia-cloud.flowy-mouse-8040.chatgpt.site
GitHub pretendido: https://github.com/Flavavisio/Imo-colou
Supabase pretendido: https://tegwpmtylwivktuuktpo.supabase.co

## Conteúdo
Código React/TypeScript/Vinext, estilos, componentes, APIs, esquema D1,
migração, testes, configurações, lockfile e ferramenta Python de diagnóstico RTSP.
Inclui gestão comercial, licenças, marcas, consulta Imou e associação de câmaras.

## Estado real
- Autenticação atual: ChatGPT/Sites. Os perfis Admin e Cliente são pré-visualizações.
- Dados atuais: D1; logótipos: R2. Não inclui exportação dos dados nem dos logótipos guardados.
- Supabase ainda não integrado. Conta Super Admin ainda não criada.
- Transferência para o GitHub pretendido ainda não confirmada.
- Não implementados: receção automática de eventos, gravação cloud, player,
  download de clips, notificações e faturação automática.
- Consulta Imou validada com testes simulados, não com conta/câmara reais.
- Ferramenta local testa RTSP pontualmente; não grava nem envia vídeo.

## Instalar e verificar
Node.js >=22.13.0 e pnpm na versão indicada em package.json.
Na pasta vigia-cloud:
    pnpm install --frozen-lockfile
    pnpm exec tsc --noEmit
    node --experimental-vm-modules --experimental-strip-types --test tests/*.test.mjs
    pnpm build

Para execução fora de Sites é necessário configurar D1/R2 e adaptar a autenticação.
Não confiar em cabeçalhos de identidade fornecidos pelo navegador: os cabeçalhos
atuais só são fiáveis atrás do dispatcher autenticado de Sites.
O README original descreve o ambiente de alojamento.
Dependências instaladas e ficheiros de compilação não são incluídos.

## Próxima fase
1. Verificar estado atual do GitHub e Supabase antes de escrever.
2. Transferir o código preservando ficheiros existentes e a identidade do Site.
3. Implementar Auth e autorização real com isolamento entre revendedores/clientes.
4. Ativar Super Admin flavio.rosa87@gmail.com com definição segura da password.
5. Migrar dados e logótipos de forma explícita, com cópia de segurança.
6. Testar a C22E e implementar eventos/gravação após validar capacidades e permissões.

As falhas dos conectores impediram a configuração remota; este ZIP não a substitui.
