# Problema Atual de Performance

## Contexto
- Sistema com uso baixo e base pequena (exemplo real: ~80 apartamentos / ~82 vagas).
- Mesmo com pouco volume, telas administrativas estão lentas em produção (Vercel + Supabase).
- A execução do sorteio em si está rápida; lentidão aparece principalmente no carregamento de telas/listagens.

## Sintomas observados
- Abas lentas: `Apartamentos`, `Vagas`, `Status` e `Sorteios`.
- Abertura da tela `Novo sorteio` também demora para carregar.
- Ação `Iniciar sorteio` responde rápido.
- Tempo percebido em telas de listagem: ~1 a 2 segundos (considerado ruim para o cenário atual).

## Hipótese principal
- Gargalo concentrado em abertura de telas/rotas de leitura (auth + queries + latência de infraestrutura), não no motor do sorteio.

## O que já foi feito

### 1) Ajustes de conexão e estabilidade
- `DATABASE_URL` ajustada para pooler do Supabase.
- Alternância entre modos de conexão (Session/Transaction) para testes.
- Ajustes no cliente Postgres:
  - `prepare: false`
  - pool configurável por `DB_POOL_MAX` (com uso em produção).
- Retry curto no `authorize` (login) para falhas transitórias de conexão.

### 2) Ajustes de carga nas telas
- Criação de endpoints de contexto para reduzir múltiplos requests:
  - `GET /api/admin/tenants/[id]/apartments/context`
  - `GET /api/admin/tenants/[id]/spots/context`
- Exclusão em lote movida para backend (menos chamadas em cascata no frontend).
- Redução de fetch duplicado em abas (`Status` e `Sorteios`).
- Tabs ajustadas para montagem sob demanda e preservação em memória (evita recarregar toda vez que troca de aba).

### 3) Ajustes de banco (migração de performance)
- Adição de índices para colunas críticas de filtro/join por `tenant_id` e rotas de sorteio/listagens.
- Migration criada para esse objetivo (`0006_swift_pool_indexes.sql`).

### 4) Outros pontos corrigidos no período
- Logout ajustado para sair direto sem tela intermediária.
- Correções de lint/typecheck e melhorias de consistência.

## Resultado após tentativas
- Apesar dos ajustes, a percepção de lentidão nas telas principais permaneceu.
- Melhoria prática insuficiente para a expectativa de UX.

## Conclusão atual
- No cenário atual, o problema não foi resolvido apenas com otimização de código.
- Existe forte indicativo de gargalo de infraestrutura/conectividade no stack atual (Vercel + Supabase pooler + condições de rede/região/compute), somado a overhead de auth/rotas de leitura.

## Situação de decisão
- O sistema continua funcional, porém com UX considerada lenta para uso comercial.
- Próxima decisão é estratégica (infra/arquitetura), não apenas incremental de código:
  - manter stack atual com novas tentativas de infra;
  - ou migrar backend de dados para outra estratégia (ex.: Postgres próprio/gerenciado com conexão direta estável);
  - ou refatorar para uso da API Supabase (maior esforço).

## Observação
- Este documento registra o estado atual e as ações já executadas para evitar retrabalho e facilitar a próxima decisão técnica.
