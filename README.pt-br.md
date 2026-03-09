# SorteioNovo V2

🇺🇸 [Read in English](README.md)

Plataforma SaaS multi-tenant para gestão de condomínios e sorteio de vagas de garagem. Administradores configuram condomínios, importam dados de apartamentos e vagas, executam sorteios randomizados e compartilham resultados publicamente via QR codes.

Desenvolvido para **SorteioNovo** por **XNAP**.

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Banco de dados:** PostgreSQL com Drizzle ORM
- **Autenticação:** NextAuth 5 (provider de credenciais, sessões JWT)
- **Estilização:** Tailwind CSS 4
- **Validação:** Zod 4
- **Cache no cliente:** SWR
- **Processamento de dados:** Importação e exportação CSV/Excel, geração de QR codes

## Funcionalidades

- **Isolamento multi-tenant** — toda consulta filtrada por `tenant_id`
- **Configuração de condomínio** — blocos, subsolos, flags de acessibilidade PNE/idoso, tipo de sorteio
- **Gestão de apartamentos e vagas** — CRUD completo com importação em massa via CSV/Excel e validação
- **Motor de sorteio (S1)** — alocação randomizada de vagas com seeds auditáveis
- **Pré-atribuição** — vagas podem ser pré-atribuídas e excluídas do sorteio
- **Verificações de consistência** — detecção de duplicatas, validação de dados faltantes, relatórios
- **Página pública de resultados** — resultados compartilháveis via URL do condomínio e QR codes
- **Exportação Excel** — download dos resultados do sorteio em planilha
- **Log de auditoria** — todas as ações administrativas rastreadas com atribuição de usuário

## Estrutura do Projeto

```
src/
├── app/
│   ├── admin/
│   │   ├── (with-header)/       # Páginas admin com navegação
│   │   │   └── tenants/[id]/    # Detalhe do condomínio com abas
│   │   ├── (clean)/             # Layout mínimo (execução de sorteio, resultados)
│   │   └── login/               # Autenticação
│   ├── api/
│   │   ├── admin/tenants/[id]/  # Endpoints REST (CRUD + importação + sorteios)
│   │   ├── draws/[slug]/        # API pública de resultados
│   │   └── health/              # Health check
│   └── [slug]/                  # Páginas públicas (resultados via QR)
├── db/
│   ├── schema/                  # Schema Drizzle (um arquivo por entidade)
│   └── migrations/              # Migrações auto-geradas
├── lib/
│   ├── draw-engine-s1.ts        # Algoritmo de sorteio
│   ├── import-apartments.ts     # Importação CSV/Excel de apartamentos
│   ├── import-spots.ts          # Importação CSV/Excel de vagas
│   ├── validations/             # Schemas Zod
│   └── swr.ts                   # Configuração do fetcher SWR
└── auth.ts                      # Configuração NextAuth
```

## Como Começar

### Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL local)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/sorteio-novo-platform.git
cd sorteio-novo-platform

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Suba o PostgreSQL
docker-compose up -d

# Execute as migrações
npm run db:migrate

# (Opcional) Popule com dados de exemplo
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`. Login admin em `/admin/login`.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Executar build de produção |
| `npm run lint` | Executar ESLint |
| `npm run db:generate` | Gerar migração a partir de alterações no schema |
| `npm run db:migrate` | Aplicar migrações pendentes |
| `npm run db:studio` | Abrir Drizzle Studio (navegador do banco) |
| `npm run db:seed` | Popular banco local com dados de teste |

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Principais variáveis:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | String de conexão PostgreSQL |
| `NEXTAUTH_SECRET` | Sim | Secret aleatório para assinatura de sessão |
| `NEXTAUTH_URL` | Sim | URL da aplicação (`http://localhost:3000` para dev) |
| `DB_POOL_MAX` | Não | Tamanho do pool de conexões (padrão: 5 prod / 10 dev) |

---

Desenvolvido com desenvolvimento assistido por IA usando [Claude Code](https://claude.ai/code).
