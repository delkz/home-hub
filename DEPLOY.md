# Deploy em servidor remoto

Este guia sobe o Home Hub em um servidor (VPS) com HTTPS automático e login obrigatório.

## Como fica a segurança

- **Login obrigatório**: toda a API (`/api/*`) exige sessão, exceto o próprio login.
- **Sem cadastro público**: o primeiro usuário é criado a partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` quando o banco ainda não tem nenhum usuário. Outros usuários ou trocas de senha são feitos pelo terminal (veja abaixo).
- **Senhas** guardadas com hash `scrypt` (sal aleatório, comparação em tempo constante). Mínimo de 10 caracteres.
- **Sessões** com token aleatório de 256 bits em cookie `HttpOnly`, `Secure`, `SameSite=Strict`; o banco guarda só o hash SHA-256 do token. Expiram em `SESSION_TTL_DAYS` (padrão 30 dias). Logout apaga a sessão no servidor.
- **Força bruta**: 10 tentativas de login erradas por IP a cada 15 minutos.
- **CSRF**: além do `SameSite=Strict`, toda requisição que altera dados precisa do cabeçalho `X-Requested-With: HomeHub`.
- **HTTPS** com certificado Let's Encrypt automático via Caddy, redirecionamento HTTP→HTTPS, HSTS e cabeçalhos de segurança (CSP, X-Frame-Options etc.).
- **Rede**: só o Caddy (portas 80/443) fica exposto. API e PostgreSQL ficam numa rede Docker interna, sem portas publicadas.
- **Erros** em produção não devolvem detalhes internos (mensagens do Prisma etc.) ao navegador; eles vão só para o log.
- **Segredos** só em variáveis de ambiente (`.env`, fora do git).

## Pré-requisitos

1. Um servidor Linux com Docker e o plugin Docker Compose.
2. Um domínio (ou subdomínio) com registro DNS `A` apontando para o IP do servidor.
3. Portas 80 e 443 liberadas no firewall. Recomendado fechar o resto, por exemplo com `ufw`:
   ```bash
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
   ```

## Primeira instalação

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

### Dados de exemplo (opcional)

O seed cria as categorias padrão e alguns itens de exemplo:

```bash
docker compose -f docker-compose.prod.yml exec api npm run prisma:seed
```

## Usuários e senhas

Criar um usuário ou redefinir a senha (encerra todas as sessões daquele usuário):

```bash
docker compose -f docker-compose.prod.yml exec api npm run user:set-password -- voce@email.com "Seu Nome"
```

A senha é pedida no terminal sem aparecer na tela.

## Atualizar

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backup

O banco fica no volume Docker `postgres_data`. Faça backups regulares e guarde-os fora do servidor:

```bash
# gerar
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > homehub-$(date +%F).sql.gz

# restaurar
gunzip -c homehub-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

Um `cron` diário com o comando de geração já resolve o básico.

## Desenvolvimento local

O `docker-compose.yml` continua sendo o ambiente de desenvolvimento. Ele cria o usuário `admin@homehub.local` / `troque-esta-senha` (ou o que estiver em `ADMIN_EMAIL` / `ADMIN_PASSWORD`) e agora publica o banco e a API só em `127.0.0.1`.
