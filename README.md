# Sorteio Novo Platform

🇧🇷 [Leia em Português](README.pt-br.md)

Multi-tenant SaaS platform for managing condominiums and running parking spot lottery draws. Administrators configure tenants, import apartment and parking spot data, execute randomized draws, and share results publicly via QR codes.

Built for **SorteioNovo** by **XNAP**.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** NextAuth 5 (Credentials provider, JWT sessions)
- **Styling:** Tailwind CSS 4
- **Validation:** Zod 4
- **Client caching:** SWR
- **Data processing:** CSV/Excel import & export, QR code generation

## Features

- **Multi-tenant isolation** — every query scoped by `tenant_id`
- **Tenant configuration** — blocks, basements, PNE/elderly accessibility flags, draw type selection
- **Apartment & parking spot management** — full CRUD with bulk CSV/Excel import and validation
- **Draw engine (S1)** — randomized parking spot allocation with auditable random seeds
- **Pre-assignment support** — spots can be pre-assigned and excluded from draws
- **Sanity checks** — duplicate detection, missing data validation, consistency reports
- **Public results page** — shareable draw results via tenant slug URL and QR codes
- **Excel export** — download draw results as spreadsheets
- **Audit logging** — all admin actions tracked with user attribution

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── (with-header)/       # Admin pages with navigation
│   │   │   └── tenants/[id]/    # Tenant detail with tabbed UI
│   │   ├── (clean)/             # Minimal layout (draw execution, results)
│   │   └── login/               # Authentication
│   ├── api/
│   │   ├── admin/tenants/[id]/  # REST endpoints (CRUD + import + draws)
│   │   ├── draws/[slug]/        # Public draw result API
│   │   └── health/              # Health check
│   └── [slug]/                  # Public tenant pages (results via QR)
├── db/
│   ├── schema/                  # Drizzle schema (one file per entity)
│   └── migrations/              # Auto-generated migrations
├── lib/
│   ├── draw-engine-s1.ts        # Draw algorithm
│   ├── import-apartments.ts     # CSV/Excel apartment import
│   ├── import-spots.ts          # CSV/Excel parking spot import
│   ├── validations/             # Zod schemas
│   └── swr.ts                   # SWR fetcher config
└── auth.ts                      # NextAuth configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sorteio-novo-platform.git
cd sorteio-novo-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start PostgreSQL
docker-compose up -d

# Run database migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`. Admin login at `/admin/login`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed` | Seed local database with test data |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for session signing |
| `NEXTAUTH_URL` | Yes | Application URL (`http://localhost:3000` for dev) |
| `DB_POOL_MAX` | No | Connection pool size (default: 5 prod / 10 dev) |

---

Built with AI-assisted development using [Claude Code](https://claude.ai/code).
