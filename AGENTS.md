# Guia para o agente (Cursor)

O guia que o agente do Cursor usa para rodar o projeto e seguir as convenções está na **estrutura de regras do Cursor**, não só neste arquivo.

## Onde o agente encontra as instruções

- **`.cursor/rules/project-guide.mdc`** — Regra com `alwaysApply: true`: como rodar o projeto, estrutura, comandos e convenções. O Cursor carrega essa regra ao trabalhar no repositório.
- **`docs/desenvolvimento-local.md`** — Passo a passo completo para desenvolvimento local (clone, `.env`, Docker Postgres, `npm run dev`, migrations/seed quando existirem).

## Resumo rápido (para humanos)

- **Rodar o projeto:** Ver `docs/desenvolvimento-local.md`. Em resumo: `cp .env.example .env`, `docker-compose up -d`, `npm run dev`.
- **Estrutura:** Next.js App Router em `src/app/`; banco com Drizzle em `src/db/schema/`; documentação em `docs/`.
- **Documentação de produto/arquitetura:** `docs/prd.md`, `docs/arquitetura.md`, `docs/mapa.md`.

Este arquivo (`AGENTS.md`) é uma referência; a fonte que o agente usa de fato é `.cursor/rules/project-guide.mdc`.
