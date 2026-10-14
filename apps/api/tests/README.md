# Testes da API

`auth.test.js` cobre o onboarding (criação da conta principal), o perfil, a troca de senha, o login e o logout contra um PostgreSQL real.

O teste **apaga usuários e sessões**, por isso só roda quando `TEST_DATABASE_URL` aponta para um banco descartável:

```sh
export TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/homehub_test
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
npm test
```

Sem `TEST_DATABASE_URL`, o teste é ignorado.

## A fazer

Os testes de estoque ainda não existem e são prioridade antes do v0.2 (a conta de quantidades é o produto):

- criar compra (`POST /api/purchases`): quantidades, movimentos de entrada e data da última compra
- criar movimentação (`POST /api/inventory/:id/movements`): saldo anterior/resultante
- cálculo de estoque baixo (`status` LOW/EMPTY a partir de `minQuantity`)
