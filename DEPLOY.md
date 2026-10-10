# Deploy (Vercel + Neon)

O Home Hub roda na **Vercel** (front estático + API Express como função serverless, no mesmo domínio) com o banco PostgreSQL no **Neon**. Os dois têm plano gratuito.

## Como fica a segurança

- **Login obrigatório**: toda a API (`/api/*`) exige sessão, exceto o próprio login.
- **Sem cadastro público**: o primeiro usuário é criado a partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` quando o banco ainda não tem nenhum usuário. Outros usuários ou trocas de senha são feitos pelo terminal (veja abaixo).
- **Senhas** guardadas com hash `scrypt` (sal aleatório, comparação em tempo constante). Mínimo de 10 caracteres.
- **Sessões** com token aleatório de 256 bits em cookie `HttpOnly`, `Secure`, `SameSite=Strict`; o banco guarda só o hash SHA-256 do token. Expiram em `SESSION_TTL_DAYS` (padrão 30 dias). Logout apaga a sessão no servidor.
- **Força bruta**: 10 tentativas de login erradas por IP a cada 15 minutos (contadas por instância da função; veja as observações).
- **CSRF**: além do `SameSite=Strict`, toda requisição que altera dados precisa do cabeçalho `X-Requested-With: HomeHub`.
- **HTTPS** automático da Vercel, com HSTS e cabeçalhos de segurança (CSP, X-Frame-Options etc.) definidos no `vercel.json`.
- **Banco** no Neon, com conexão sempre criptografada (`sslmode=require`).
- **Erros** em produção não devolvem detalhes internos (mensagens do Prisma etc.) ao navegador; eles vão só para o log.
- **Segredos** só em variáveis de ambiente (painel da Vercel; `.env` local fica fora do git).

## Passo a passo

1. **Banco:** crie um projeto no [Neon](https://neon.tech) (região São Paulo, `sa-east-1`, se disponível). O jeito mais fácil é pela integração Neon da Vercel (Marketplace → Neon), que já cria `DATABASE_URL` (conexão com pool) e `DATABASE_URL_UNPOOLED` (direta, usada nas migrações) no projeto.
   Sem a integração, defina à mão:
   - `DATABASE_URL`: string **com pool** do Neon (host com `-pooler`), terminando em `?sslmode=require&pgbouncer=true&connection_limit=1`
   - `DATABASE_URL_UNPOOLED`: string **direta** (sem `-pooler`), com `?sslmode=require`
2. **Projeto na Vercel:** importe o repositório `delkz/home-hub`. Deixe o *Root Directory* na raiz; o `vercel.json` já define instalação, build e saída. Se a Vercel perguntar o framework, escolha *Other*.
3. **Variáveis de ambiente** (Settings → Environment Variables, ambiente *Production*):
   - `NODE_ENV=production`
   - `ADMIN_EMAIL`, `ADMIN_NAME` e `ADMIN_PASSWORD` (mínimo de 10 caracteres)
   - `SESSION_TTL_DAYS=30` (opcional)
4. **Deploy.** O build gera o Prisma Client, aplica as migrações no banco e compila o front. No primeiro acesso, a API cria o usuário inicial. Entre em `https://<seu-projeto>.vercel.app` e depois **remova `ADMIN_PASSWORD`** das variáveis.

Observações:
- Cada deploy aplica migrações pendentes no banco configurado. Se usar deploys de *preview*, configure um banco (ou branch do Neon) separado para o ambiente *Preview*.
- O limite de tentativas de login fica na memória de cada instância da função, então pode ser contornado por quem distribui tentativas entre instâncias. Use uma senha longa e única.
- Para criar usuários ou trocar a senha, rode na sua máquina, apontando para o banco do Neon:
  ```bash
  cd apps/api && npm install
  DATABASE_URL="<string direta do Neon>" npm run user:set-password -- voce@email.com "Seu Nome"
  ```
- Dados de exemplo e categorias padrão (opcional): `DATABASE_URL="<string direta>" npm run prisma:seed` em `apps/api`.
- Backup: o Neon guarda histórico com restauração por ponto no tempo. Para uma cópia sua: `pg_dump "<string direta>" | gzip > homehub-$(date +%F).sql.gz`.

## Desenvolvimento local

O `docker-compose.yml` é o ambiente de desenvolvimento (`docker compose up -d`). Ele cria o usuário `admin@homehub.local` / `troque-esta-senha` (ou o que estiver em `ADMIN_EMAIL` / `ADMIN_PASSWORD`) e agora publica o banco e a API só em `127.0.0.1`.
