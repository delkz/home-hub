# Deploy

Há três caminhos prontos:

- **Oracle Cloud Always Free (recomendado):** uma VM gratuita para sempre, onde o `docker-compose.prod.yml` sobe tudo junto (site, API e banco), igual ao ambiente local. Veja [Oracle Cloud](#oracle-cloud-always-free).
- **Qualquer servidor próprio (VPS) com Docker:** o mesmo stack em outro provedor. Veja [Servidor próprio](#servidor-próprio-vps).
- **Vercel + Neon:** sem servidor para manter, mas o banco fica num serviço separado (Neon). Veja [Vercel](#vercel--neon).

Netlify não tem suporte de primeira classe para uma API Express com Prisma, por isso a configuração pronta é para a Vercel.

## Como fica a segurança

- **Login obrigatório**: toda a API (`/api/*`) exige sessão, exceto o próprio login.
- **Sem cadastro público**: o primeiro usuário é criado a partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` quando o banco ainda não tem nenhum usuário. Outros usuários ou trocas de senha são feitos pelo terminal (veja abaixo).
- **Senhas** guardadas com hash `scrypt` (sal aleatório, comparação em tempo constante). Mínimo de 10 caracteres.
- **Sessões** com token aleatório de 256 bits em cookie `HttpOnly`, `Secure`, `SameSite=Strict`; o banco guarda só o hash SHA-256 do token. Expiram em `SESSION_TTL_DAYS` (padrão 30 dias). Logout apaga a sessão no servidor.
- **Força bruta**: 10 tentativas de login erradas por IP a cada 15 minutos.
- **CSRF**: além do `SameSite=Strict`, toda requisição que altera dados precisa do cabeçalho `X-Requested-With: HomeHub`.
- **HTTPS** automático (Vercel, ou Let's Encrypt via Caddy no VPS), redirecionamento HTTP→HTTPS, HSTS e cabeçalhos de segurança (CSP, X-Frame-Options etc.).
- **Rede (VPS)**: só o Caddy (portas 80/443) fica exposto. API e PostgreSQL ficam numa rede Docker interna, sem portas publicadas.
- **Erros** em produção não devolvem detalhes internos (mensagens do Prisma etc.) ao navegador; eles vão só para o log.
- **Segredos** só em variáveis de ambiente (`.env`, fora do git).

## Oracle Cloud (Always Free)

A conta Always Free da Oracle inclui uma VM ARM (até 4 CPUs e 24 GB de RAM) e 200 GB de disco sem custo. Ela roda o stack Docker inteiro.

1. **Conta:** crie em [cloud.oracle.com](https://cloud.oracle.com) (pede cartão só para verificação; nada é cobrado nos recursos *Always Free*). Escolha a região São Paulo ou Vinhedo.
2. **VM:** *Compute → Instances → Create instance*.
   - Imagem: **Ubuntu 24.04**; shape: **VM.Standard.A1.Flex** (ARM), por exemplo 2 OCPUs e 12 GB.
   - Envie sua chave SSH pública e anote o IP público.
   - Se aparecer "out of capacity", tente outro *availability domain* ou mais tarde.
3. **Liberar 80/443 na Oracle:** na sub-rede da VM, *Security List → Add Ingress Rules*: origem `0.0.0.0/0`, TCP, portas `80` e `443`.
4. **Liberar 80/443 na própria VM** (a imagem Ubuntu da Oracle bloqueia via iptables; não use `ufw` aqui):
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
5. **Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER   # saia e entre de novo no SSH
   ```
6. **Domínio grátis:** crie um subdomínio no [DuckDNS](https://www.duckdns.org) (ex.: `minhacasa.duckdns.org`) apontando para o IP da VM. Ele vai no `DOMAIN` do `.env`, e o Caddy emite o certificado HTTPS sozinho.
7. Siga a [primeira instalação](#primeira-instalação) abaixo.

Observações:
- A Oracle pode recuperar VMs *Always Free* que fiquem quase ociosas por 7 dias seguidos. Para evitar, converta a conta para *Pay As You Go* (continua sem custo enquanto você usar só recursos Always Free) e configure um alerta de orçamento de R$ 1.
- Faça o [backup](#backup) com `cron` e guarde uma cópia fora da VM.

## Vercel + Neon

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
- O limite de tentativas de login fica na memória de cada instância da função, então é mais fraco que no VPS. Use uma senha longa e única.
- Para criar usuários ou trocar a senha, rode na sua máquina, apontando para o banco do Neon:
  ```bash
  cd apps/api && npm install
  DATABASE_URL="<string direta do Neon>" npm run user:set-password -- voce@email.com "Seu Nome"
  ```
- Dados de exemplo e categorias padrão (opcional): `DATABASE_URL="<string direta>" npm run prisma:seed` em `apps/api`.
- Backup: o Neon guarda histórico com restauração por ponto no tempo. Para uma cópia sua: `pg_dump "<string direta>" | gzip > homehub-$(date +%F).sql.gz`.

## Servidor próprio (VPS)

Este caminho sobe tudo num servidor com Docker, HTTPS automático e login obrigatório.

### Pré-requisitos

1. Um servidor Linux com Docker e o plugin Docker Compose.
2. Um domínio (ou subdomínio) com registro DNS `A` apontando para o IP do servidor.
3. Portas 80 e 443 liberadas no firewall. Recomendado fechar o resto, por exemplo com `ufw`:
   ```bash
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
   ```

### Primeira instalação

```bash
git clone https://github.com/delkz/home-hub.git
cd home-hub
cp .env.production.example .env
chmod 600 .env
openssl rand -base64 32   # use como POSTGRES_PASSWORD
nano .env                 # preencha DOMAIN, POSTGRES_PASSWORD, ADMIN_EMAIL e ADMIN_PASSWORD

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f api
```

Quando o log mostrar `Created initial user ...`, abra `https://SEU_DOMINIO` e entre. Depois **apague `ADMIN_PASSWORD` do `.env`** (ele só é usado quando não existe nenhum usuário).

As migrações do banco rodam sozinhas sempre que a API inicia.

#### Dados de exemplo (opcional)

O seed cria as categorias padrão e alguns itens de exemplo:

```bash
docker compose -f docker-compose.prod.yml exec api npm run prisma:seed
```

### Usuários e senhas

Criar um usuário ou redefinir a senha (encerra todas as sessões daquele usuário):

```bash
docker compose -f docker-compose.prod.yml exec api npm run user:set-password -- voce@email.com "Seu Nome"
```

A senha é pedida no terminal sem aparecer na tela.

### Atualizar

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup

O banco fica no volume Docker `postgres_data`. Faça backups regulares e guarde-os fora do servidor:

```bash
# gerar
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > homehub-$(date +%F).sql.gz

# restaurar
gunzip -c homehub-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

Para um backup diário às 3h mantendo os últimos 14 dias, rode `crontab -e` e adicione (ajuste o caminho do projeto):

```cron
0 3 * * * cd $HOME/home-hub && mkdir -p backups && docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backups/homehub-$(date +\%F).sql.gz && find backups -name '*.sql.gz' -mtime +14 -delete
```

## Desenvolvimento local

O `docker-compose.yml` continua sendo o ambiente de desenvolvimento. Ele cria o usuário `admin@homehub.local` / `troque-esta-senha` (ou o que estiver em `ADMIN_EMAIL` / `ADMIN_PASSWORD`) e agora publica o banco e a API só em `127.0.0.1`.
