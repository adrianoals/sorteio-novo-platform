Perfeito — abaixo vai o **PRD refeito** já assumindo **Next.js como base**, com **duas áreas** (Admin SaaS e Cliente/Tenant) e com **escopo reduzido para o MVP Fase 01 = somente configuração via Admin** (sem checkout/login do cliente no MVP).

---

# PRD — SorteioNovo V2 (SaaS White-label) — MVP Fase 01 (Admin / Config)

## 1) Visão do produto

O **SorteioNovo V2** será uma plataforma **SaaS white-label** construída em **Next.js** que permite administrar múltiplos **condomínios/empreendimentos (tenants)** dentro de um único sistema.

A plataforma terá, no produto final:

* **Área Admin (plataforma):** controla todos os condomínios, configura módulos/regras, dados e eventos.
* **Área Cliente (tenant):** o cliente cria login, contrata um plano/produto e administra somente o seu condomínio.

**No MVP Fase 01**, será entregue **apenas a Área Admin**, focada em:

* **Cadastro e configuração** de condomínios (tenant)
* **Cadastro/importação** de apartamentos/vagas/blocos (dados base)
* **Configuração do tipo de sorteio** por condomínio
* **Base pronta** para Fase 02 (sorteio simples) e, depois, área do cliente + checkout

---

## 2) Objetivos e sucesso

### Objetivos do MVP (Fase 01)

1. Permitir que o **Admin** cadastre e configure **N condomínios** sem duplicar código.
2. Unificar a estrutura de dados em um **core** (sem “1 app por condomínio”).
3. Permitir **gestão de dados** (aptos/vagas/blocos) por condomínio com validações.
4. Preparar a arquitetura para Fase 02 (sorteio simples) e Fase 03 (área cliente + compra + permissões).

### Métricas de sucesso (MVP)

* Criar um condomínio completo (config + dados) em **< 20 minutos**.
* Importar aptos/vagas via CSV/Excel e validar duplicidades com feedback claro.
* Estrutura multi-tenant funcionando: dados de um condomínio não “vazam” para outro.
* Reduzir esforço de adicionar um novo condomínio para **zero código** (somente admin UI).

---

## 3) Escopo

### Em escopo (MVP Fase 01 — Admin)

* **Admin Auth (interno)**: login do administrador da plataforma.
* **CRUD de Condomínios (Tenants)**: criar/editar/ativar/desativar.
* **Configuração do condomínio** (feature flags e regras base):

  * usa bloco? usa subsolo?
  * tipos de vaga suportados (simples/dupla)
  * vagas especiais habilitadas (PNE/idoso — somente como configuração no MVP)
  * tipo de sorteio pretendido (S1/S2/S3…) **apenas setável**
* **CRUD de dados por condomínio**:

  * blocos (opcional)
  * apartamentos (com “direitos”)
  * vagas (com tipo / especial / subsolo opcional)
* **Importação** (CSV/Excel) de apartamentos e vagas
* **Validações/sanidade** (pré-sorteio):

  * duplicidades
  * faltas de vagas por direito
  * consistência de blocos/subsolos
* **Auditoria básica**: log de ações admin (quem alterou o quê)

### Fora de escopo (MVP Fase 01)

* Execução do sorteio (vem na Fase 02)
* Export Excel e QR Code (Fase 02 ou 03)
* Área do cliente (login do cliente / tenant) — vem **depois** do sorteio simples
* Compra/checkout/assinatura
* Multi-domínio por tenant

---

## 4) Personas

### Admin da Plataforma

* Cria condomínios
* Configura módulos/regras
* Cadastra dados (ou importa)
* Valida que está tudo pronto para rodar sorteio futuramente

### Cliente do Condomínio (futuro)

* Criaria conta e contrataria produto
* Veria e administraria apenas seus dados
* Rodaria sorteio e exportaria resultados

---

## 5) Arquitetura (produto / módulos)

### Frontend

* **Next.js (App Router)**:

  * `/admin` (área interna)
  * futuramente `/app` (área do cliente/tenant)

### Backend (no contexto Next)

* API via **Route Handlers** (`/app/api/...`) ou Backend separado (futuro).
* No MVP: route handlers bastam.

### Banco

* PostgreSQL (pode ser Supabase/Postgres gerenciado)
* Multi-tenant por `tenant_id` em todas as entidades.

### Conceito-chave

* Tudo pertence a um `tenant` (condomínio).
* Admin enxerga todos os tenants.

---

## 6) Modelo de dados (MVP)

### Tenant (Condomínio / Empreendimento)

* `id`
* `name`
* `slug`
* `status` (active/inactive)
* `branding` (logo_url, primary_color, etc.) — **opcional no MVP**
* `config` (JSON):

  * `has_blocks: boolean`
  * `has_basement: boolean`
  * `basements: string[]` (ex.: ["S1","S2","Térreo"])
  * `enabled_features: { pne: boolean, idoso: boolean, ... }`
  * `intended_draw_type: "S1" | "S2" | "S3" | ...`

### Block (opcional)

* `id`
* `tenant_id`
* `name` / `code`

### Apartment

* `id`
* `tenant_id`
* `block_id` (nullable)
* `number` (string)
* `rights` (enum ou JSON):

  * ex.: `simple`, `double`, `two_simple`, `car`, `moto` (deixa extensível)
* `attributes` (JSON) — extras

### ParkingSpot (Vaga)

* `id`
* `tenant_id`
* `block_id` (nullable)
* `number`
* `basement` (nullable)
* `spot_type` (simple/double)
* `special_type` (normal/pne/idoso/visitor…) — opcional no MVP
* `attributes` (JSON)

### AuditLog (MVP)

* `id`
* `actor_user_id`
* `action` (create/update/delete/import)
* `entity_type` (tenant/apartment/spot/block)
* `entity_id`
* `tenant_id` (opcional; útil)
* `payload` (JSON resumido)
* `created_at`

---

## 7) Requisitos funcionais (FR) — MVP

### Admin Auth

* **FR1** Admin deve conseguir logar e deslogar.
* **FR2** Rotas `/admin/*` devem ser protegidas.

### Gestão de Tenants

* **FR3** Admin consegue criar tenant com nome e slug.
* **FR4** Admin consegue ativar/desativar tenant.
* **FR5** Admin edita a configuração do tenant (flags e intended_draw_type).

### Blocos (opcional por tenant)

* **FR6** Se `has_blocks=true`, admin pode CRUD de blocos.

### Apartamentos

* **FR7** CRUD de apartamentos por tenant.
* **FR8** Campo “rights” obrigatório (mínimo: simples/dupla).
* **FR9** Validação: `number` não pode duplicar dentro do tenant (e bloco, se existir).

### Vagas

* **FR10** CRUD de vagas por tenant.
* **FR11** Validação: `number` não pode duplicar dentro do tenant (e subsolo/bloco conforme config).

### Importação

* **FR12** Admin pode importar apartamentos via CSV/Excel.
* **FR13** Admin pode importar vagas via CSV/Excel.
* **FR14** Import deve retornar relatório: inseridos / atualizados / rejeitados + motivo.

### Sanidade / Validações globais

* **FR15** “Check de prontidão” do tenant:

  * total aptos, total vagas
  * vagas por tipo vs aptos por direito
  * duplicidades
  * blocos/subsolos inválidos
* **FR16** Tela de “Status do tenant” mostrando pendências (warnings/errors).

### Auditoria

* **FR17** Logar ações relevantes do admin (CRUD/import).

---

## 8) Requisitos não funcionais (NFR)

* **NFR1 Segurança:** RBAC mínimo (admin platform).
* **NFR2 Consistência:** validações no backend (não confiar só no front).
* **NFR3 Performance:** import de ~200–500 linhas deve completar rápido e com feedback.
* **NFR4 Escalabilidade:** dados isolados por tenant (tabelas com `tenant_id`, índices).
* **NFR5 Manutenibilidade:** tipagem forte (TS), schemas de validação (Zod).

---

## 9) Telas do MVP (Admin)

### 9.1 Login Admin

* email/senha (ou provider)

### 9.2 Dashboard Admin

* lista de tenants
* busca por nome/slug
* status (ativo/inativo)
* botão “Criar tenant”

### 9.3 Tenant Details

* abas:

  * **Config**
  * **Blocos** (se habilitado)
  * **Apartamentos**
  * **Vagas**
  * **Importações**
  * **Status/Checks**

### 9.4 Importações

* upload arquivo
* escolher tipo (aptos/vagas)
* preview (opcional)
* resultado do import com erros

### 9.5 Status/Checks

* painel com:

  * “OK para sorteio simples?” (só sinalização)
  * warnings e erros

---

## 10) APIs (MVP) — contrato sugerido

* `POST /api/admin/auth/login`
* `POST /api/admin/tenants`
* `GET /api/admin/tenants`
* `GET /api/admin/tenants/:id`
* `PATCH /api/admin/tenants/:id`
* `POST /api/admin/tenants/:id/blocks`
* `POST /api/admin/tenants/:id/apartments/import`
* `POST /api/admin/tenants/:id/spots/import`
* `GET /api/admin/tenants/:id/checks`

---

## 11) Fases futuras (para manter no PRD como roadmap)

**Ordem intencional:** sorteio simples vem **antes** da área cliente — assim o produto entrega o valor central (rodar um sorteio) e valida o fluxo antes de construir o portal do cliente.

### Fase 02 — Sorteio (engines) — antes da área cliente

* engine **S1 (simples em lote)**: executar sorteio a partir dos dados configurados no Admin
* export Excel do resultado (opcional já na Fase 02)
* QR code / consulta pública do resultado (opcional)
* depois: S2 (presença), S3 (duplas/PNE), etc.

### Fase 03 — Área Cliente + Produto

* signup/login do cliente
* “comprar plano” (checkout)
* cliente gerencia apenas seu tenant e **roda sorteio** (reutilizando engines da Fase 02)
* permissões (owner/operator/viewer)

---

## 12) Critérios de aceitação (MVP)

* Admin cria tenant e consegue configurar `has_blocks/has_basement/intended_draw_type`.
* Admin cadastra/importa apartamentos e vagas e o sistema bloqueia duplicidades.
* Admin roda “Checks” e obtém lista clara do que falta/corrigir.
* Logs registram ações principais (pelo menos create/update/import).

---

## 13) Decisões importantes já alinhadas (para evitar retrabalho)

* Multi-tenant será por **tenant_id** (não por “app por condomínio”).
* Campos variáveis vão para **attributes/config JSON** (extensibilidade).
* A UI será **uma só** e muda por configuração do tenant.
* MVP Fase 01 = **somente admin/config**, sem sorteio. Fase 02 = sorteio simples (S1) **antes** da área cliente (Fase 03).

---

Se você quiser, eu também posso te entregar **um “PRD enxuto de 1 página”** (para colar no Notion) **e** um “backlog de MVP” em formato de épicos → stories → critérios de aceite (bem pronto pra Jira/Trello).
