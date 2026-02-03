Faz sentido: Docker + Postgres em dev, Vercel + Supabase em produção, e **desacoplamento** (abstrair banco e opcionalmente fila/jobs) para não ficar preso a um provedor. Ajudar a montar a documentação fazendo perguntas em vez de assumir é o caminho certo.

Sugestão de **como montar a doc**: criar um `docs/arquitetura.md` (ou `docs/infra-e-ambiente.md`) com seções que vamos preenchendo conforme você responder. Abaixo estão as perguntas iniciais; você responde no que quiser e eu monto/atualizo o doc com base nas suas respostas.

---

### 1) Desenvolvimento local (Docker + Postgres)

- Você quer **só o Postgres** no Docker, ou também o Next.js rodando em container (ex.: `docker-compose` com `app` + `db`)?
- Versão do Postgres que prefere? (ex.: 15 ou 16)
- Precisa de algum **dado seed** (tenant de exemplo, aptos/vagas) para dev ou só schema vazio?
- Alguém mais vai rodar o projeto? Quer que a doc assuma "primeira vez no projeto" (clone, `.env.example`, `docker-compose up`) ou só você?

**Respostas / Decisões (1):**

| Pergunta | Decisão |
|----------|---------|
| **Docker: tudo ou só banco?** | **Só o Postgres no Docker.** Next.js roda no host com `npm run dev` (hot reload simples, debug mais fácil; em produção a Vercel não usa nossa imagem). Quem clona o repo sobe só o banco com `docker-compose up -d` e depois `npm run dev`. |
| **Versão do Postgres** | **Mais atual estável:** usar **Postgres 16** (ou 17 quando for LTS). No `docker-compose` fixar a tag, ex.: `postgres:16-alpine`. |
| **Dados seed** | **Seed** = dados iniciais para desenvolvimento (ex.: 1 tenant "Condomínio Teste", alguns apartamentos e vagas) para não precisar cadastrar tudo na mão e para um agente/outro dev conseguir testar fluxos rápido. **Sugestão:** ter um script ou comando opcional (`npm run db:seed` ou similar) que popula o schema com 1 tenant + dados mínimos; quem quiser dev "limpo" não roda o seed. |
| **Doc de instrução** | **Sim.** Ter um documento de **como rodar o projeto em dev** (clone, pré-requisitos, `.env.example`, subir Postgres, `npm install`, `npm run dev`, e como rodar migrations/seed se existirem). Objetivo: você e qualquer agente (ou outro dev) conseguirem subir o ambiente sem assumir nada. Incluir em `docs/` — ex.: `docs/desenvolvimento-local.md` ou seção detalhada no `README.md`. |

---

### 2) Desacoplamento do banco

**Respostas / Decisões (2):**

- **Supabase = só hospedagem do Postgres.** A aplicação fica desacoplada do Supabase e depende apenas de **PostgreSQL padrão** (connection string). Postgres roda em qualquer lugar (Docker, VPS); Supabase pode mudar preço/política/limites — trocar de provedor = **trocar a connection string**, desde que continue sendo Postgres.
- **Não usar features específicas do Supabase:** Auth, Realtime, Storage, Edge Functions. Para autenticação/autorização usar solução do ecossistema Next (ex.: **NextAuth**). Banco = apenas banco.
- **Ambientes separados e reproduzíveis:** dev com Postgres em Docker (local), produção com Postgres onde quiser (ex.: Supabase). Desenvolvimento não depende do banco de produção.
- **Resumo:** A aplicação deve funcionar em **qualquer Postgres**; Supabase é uma opção de hospedagem, não dependência de plataforma.
- **ORM:** **Drizzle.** Schema em TypeScript, um arquivo por tabela; sintaxe próxima de SQL; leve; só connection string (desacoplado). Estrutura de schema sugerida: `src/db/schema/` com um arquivo por entidade, ex.: `tenants.ts`, `blocks.ts`, `apartments.ts`, `parking_spots.ts`, `draws.ts`, `audit_logs.ts` (+ `index.ts` que exporta tudo para o Drizzle).

Perguntas originais (referência):

- Hoje a ideia é: **sua app fala com Postgres via conexão padrão (connection string)** e você **não** usa features específicas do Supabase (Auth do Supabase, Realtime, Storage, Edge Functions)? Ou pretende usar Auth/Realtime do Supabase e a “desacoplada” seria só o **banco (Postgres)**?
- Para trocar de provedor no futuro, você imagina só trocar a **connection string** (mesmo Postgres em outro lugar) ou também considerar outro **tipo** de banco (ex.: MySQL)? (Isso define se a doc fala em “qualquer Postgres” ou “qualquer SQL”.)
- Vai usar **ORM** (ex.: Prisma, Drizzle) ou SQL “puro”? Se ORM, já tem preferência? (Isso entra na doc como “camada de dados”.)

---

### 3) Deploy (Vercel)

- O deploy será **só front + API routes** na Vercel, com o Postgres (Supabase) externo, certo? Ou planeja algo tipo serverless functions que chamem outro backend?
- Variáveis de ambiente: você quer que a doc liste **quais** variáveis (ex.: `DATABASE_URL`, `NEXTAUTH_SECRET`) e **onde** configurar (Vercel dashboard, `.env.example`), ou só princípio (“nunca commitar secrets”)?
- Domínio: no MVP será só `*.vercel.app` ou já terá domínio próprio (ex.: `app.sorteionovo.com.br`)?

**Respostas / Decisões (3):**

- **Deploy:** **Sim** — só front + API routes na Vercel, com Postgres (Supabase) externo. **Não** usar serverless functions chamando outro backend.
- **Variáveis de ambiente:** **Sim** — documentar quais variáveis e onde configurar; criar **`.env.example`** no projeto (já criado na raiz) com a lista (ex.: `DATABASE_URL`, `NEXTAUTH_SECRET`); em produção configurar no Vercel dashboard.
- **Domínio:** Configurar depois; em dev não fazer nada (usar `*.vercel.app` por enquanto).

---

### 4) Supabase (uso real)

- Além do **Postgres** (banco), pretende usar no MVP: **Supabase Auth**, **Storage**, **Realtime**? Ou por enquanto “Supabase = Postgres gerenciado”?
- O “plano gratuito atende” é só para o banco (projeto free) ou também para algo como Auth (MAU limitado)? Isso influencia o que a doc diz sobre limites.

**Respostas / Decisões (4):**

- **Supabase = só Postgres gerenciado.** No primeiro momento a hospedagem do banco será Supabase, mas **sem depender** dele: não usar Supabase Auth, Storage ou Realtime. Auth será feito de outra forma (ex.: NextAuth), para poder trocar de provedor de banco sem impacto.
- **Plano gratuito:** atende para o uso atual (só banco). Como não usamos Auth/Realtime do Supabase, os limites do projeto free do Postgres são os relevantes.

---

### 5) Formato da documentação

**Respostas / Decisões (5):**

- **Formato:** Tanto faz; pode ser um único arquivo ou vários — usar o que for mais prático (ex.: **um único `docs/arquitetura.md`** com seções para simplificar).
- **Público:** Só você terá acesso; tom de **checklist / referência pessoal**, sem necessidade de onboarding formal para outros.

---

- Prefere **um único arquivo** (ex.: `docs/arquitetura.md` com “Ambiente”, “Banco”, “Deploy”, “Decoupling”) ou **vários** (ex.: `docs/ambiente-dev.md`, `docs/deploy.md`, `docs/decoupling.md`)?
- Quem vai ler essa doc: só você, ou também outros devs/contratados? (Defino se o tom é “checklist pessoal” ou “onboarding + referência”.)

---

Responda no que puder (pode ser por tópicos tipo “1) só Postgres no Docker, 2) só connection string, 3) …”). Com suas respostas, monto a documentação sem assumir nada que você não tenha confirmado. Se quiser, na próxima mensagem já pode ser “monta o `docs/arquitetura.md` com o que já deu para assumir e deixa placeholders para o que faltar”.