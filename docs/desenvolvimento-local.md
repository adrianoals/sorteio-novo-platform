# Desenvolvimento local — SorteioNovo V2

Passos para rodar o projeto na sua máquina (ou para um agente ajudar no desenvolvimento).

## Pré-requisitos

- **Node.js** (LTS, ex.: 20+)
- **npm**
- **Docker** (para subir apenas o Postgres)

## 1. Clonar e instalar dependências

```bash
git clone <url-do-repo>
cd sorteioNovo-V2
npm install
```

## 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` e preencher:

- **`DATABASE_URL`** — Para o Postgres local (Docker), use algo como:
  - `postgresql://postgres:postgres@localhost:5432/sorteionovo`
  - (usuário/senha/porta/nome do banco devem bater com o `docker-compose.yml`.)
- **`NEXTAUTH_SECRET`** — Quando houver auth: `openssl rand -base64 32`
- **`NEXTAUTH_URL`** — Em dev: `http://localhost:3000`

Nunca commitar `.env`; o repositório já tem `.env.example` como referência.

## 3. Subir o banco (Postgres)

Na raiz do projeto:

```bash
docker-compose up -d
```

Isso sobe **apenas** o Postgres (versão 16). O Next.js **não** roda em Docker; rode no host com `npm run dev`.

Para ver os logs do container: `docker-compose logs -f`. Para parar: `docker-compose down`.

## 4. Migrations

Com o Postgres rodando e o `.env` preenchido:

```bash
npm run db:migrate
```

Isso aplica as migrations em `src/db/migrations/` e cria as tabelas no banco.

Para **gerar** uma nova migration após alterar o schema em `src/db/schema/`:

```bash
npm run db:generate
```

## 5. Seed (opcional)

Para popular com 1 tenant e dados mínimos de teste:

```bash
npm run db:seed
```

Quem quiser ambiente limpo pode pular este passo.

## 6. Rodar a aplicação

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Comandos úteis

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm run start` | Rodar o build de produção |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera migration a partir do schema (`src/db/schema/`) |
| `npm run db:migrate` | Aplica migrations no banco (Postgres deve estar rodando) |
| `npm run db:studio` | Abre Drizzle Studio para inspecionar dados |
| `npm run db:seed` | Popula 1 tenant + dados mínimos (opcional) |
| `docker-compose up -d` | Sobe o Postgres em background |
| `docker-compose down` | Para e remove o container do Postgres |

---

## Referências

- **Arquitetura e decisões:** `docs/arquitetura.md`
- **Regras para o agente (Cursor):** `.cursor/rules/project-guide.mdc`
