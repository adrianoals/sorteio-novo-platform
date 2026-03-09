# Sorteio Novo Platform

Aplicação web para gestão de condomínios e sorteio de vagas de garagem.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL
- Drizzle ORM
- NextAuth (credentials)

## Desenvolvimento local

1. Instale dependências:

```bash
npm install
```

2. Configure variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Suba o Postgres:

```bash
docker-compose up -d
```

4. Rode migrations:

```bash
npm run db:migrate
```

5. (Opcional) Rode seed:

```bash
npm run db:seed
```

6. Inicie o app:

```bash
npm run dev
```

App: `http://localhost:3000`  
Login admin: `http://localhost:3000/admin/login`

## Scripts úteis

- `npm run dev` - ambiente de desenvolvimento
- `npm run build` - build de produção
- `npm run start` - executar build
- `npm run lint` - lint do projeto
- `npm run db:generate` - gerar migration com Drizzle
- `npm run db:migrate` - aplicar migrations
- `npm run db:studio` - abrir Drizzle Studio
- `npm run db:seed` - popular base local

## Documentação

- `docs/desenvolvimento-local.md`
- `docs/arquitetura.md`
- `docs/prd.md`
- `docs/artifacts/mapa.md`
