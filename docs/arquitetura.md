# Arquitetura — SorteioNovo V2

Referência de decisões de infra, ambiente e banco. Baseado nas respostas em `docs/future/questions.md`.

---

## 1. Visão geral

- **Stack:** Next.js (App Router), TypeScript, PostgreSQL, Drizzle (ORM).
- **Deploy:** Vercel (front + API routes); banco externo (Postgres).
- **Multi-tenant:** Todas as entidades com `tenant_id`; dados isolados por condomínio.
- **Auth (Admin):** NextAuth ou equivalente no ecossistema Next — não usar Supabase Auth.

---

## 2. Ambiente de desenvolvimento

- **Docker:** Apenas **Postgres** em container. Next.js roda no host com `npm run dev` (hot reload, debug simples).
- **Postgres:** Versão **16** (tag `postgres:16-alpine` no `docker-compose`).
- **Fluxo:** Quem clona o repo sobe o banco com `docker-compose up -d` e depois `npm run dev`. Ver `docs/desenvolvimento-local.md` (ou README) para passos completos: clone, `.env.example`, migrations, seed.
- **Seed (opcional):** Comando tipo `npm run db:seed` para popular 1 tenant + apartamentos/vagas mínimos; quem quiser ambiente limpo não roda.

*(Doc detalhada de “como rodar o projeto” fica em `docs/desenvolvimento-local.md` ou seção equivalente no README.)*

---

## 3. Banco de dados e camada de dados

- **Só PostgreSQL.** Conexão via **connection string** (`DATABASE_URL`); nenhuma feature específica de provedor.
- **ORM:** **Drizzle.** Schema em TypeScript, um arquivo por tabela; sintaxe próxima de SQL; leve.
- **Estrutura de schema sugerida:** `src/db/schema/` com um arquivo por entidade:
  - `tenants.ts`, `blocks.ts`, `apartments.ts`, `parking_spots.ts`, `draws.ts`, `audit_logs.ts`
  - `index.ts` exportando tudo para o Drizzle.
- **Multi-tenant:** Todas as tabelas com `tenant_id`; queries sempre filtradas por tenant.
- Modelo de dados detalhado: ver `docs/prd.md` (seção 6).

---

## 4. Desacoplamento do banco

- A aplicação deve funcionar em **qualquer Postgres**; trocar de provedor = trocar a **connection string**.
- **Não usar:** Supabase Auth, Realtime, Storage, Edge Functions. Auth via NextAuth (ou similar).
- **Supabase:** Apenas uma opção de hospedagem do Postgres — não dependência de plataforma.
- **Ambientes:** Dev = Postgres em Docker (local). Produção = Postgres onde quiser (ex.: Supabase). Desenvolvimento não depende do banco de produção.

---

## 5. Deploy (Vercel)

- **O quê:** Só **front + API routes** na Vercel; Postgres externo (ex.: Supabase). Sem serverless chamando outro backend.
- **Variáveis de ambiente:** Listadas em `.env.example` na raiz. Em produção configurar no **Vercel dashboard** (Settings → Environment Variables).
- **Domínio:** Configurar depois; em dev usar `*.vercel.app`.

---

## 6. Supabase (uso real)

- **Uso no MVP:** Apenas **Postgres gerenciado** (connection string). Sem Auth, Storage ou Realtime do Supabase.
- **Plano gratuito:** Atende para o uso atual (só banco). Limites relevantes = projeto free do Postgres.

---

## 7. Variáveis de ambiente

| Variável           | Obrigatória | Onde configurar | Observação |
|--------------------|-------------|------------------|------------|
| `DATABASE_URL`     | Sim         | `.env` local; Vercel em prod | Postgres. Local: ex. `postgresql://user:pass@localhost:5432/sorteionovo`. Supabase: connection string do projeto. |
| `NEXTAUTH_SECRET`  | Sim (quando Auth existir) | `.env`; Vercel em prod | Gerar: `openssl rand -base64 32` |
| `NEXTAUTH_URL`     | Sim (quando Auth existir) | `.env`; Vercel em prod | Dev: `http://localhost:3000`. Prod: URL do app (configurar depois). |

Arquivo de referência: **`.env.example`** na raiz (copiar para `.env` e preencher; nunca commitar `.env`).

---

## 8. Referências

- Decisões detalhadas: `docs/future/questions.md`
- Produto e modelo de dados: `docs/prd.md`
- Como rodar em dev: `docs/desenvolvimento-local.md` (ou README)
