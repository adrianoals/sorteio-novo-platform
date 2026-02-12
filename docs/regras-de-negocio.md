# Regras de negócio — estado atual (por navegação)

Este documento descreve o comportamento real do sistema atual seguindo o caminho do usuário no produto.

## 1. Login admin (`/admin/login`)

- O acesso ao painel exige autenticação.
- Apenas usuário com `role = admin` pode acessar `/admin/*` e `/api/admin/*`.
- Sessão inválida ou ausente redireciona para login.

## 2. Dashboard de condomínios (`/admin`)

- O usuário autenticado vê lista de condomínios.
- Pode filtrar por nome/slug e por status (ativo/inativo).
- Pode criar, editar e excluir condomínios.

### Regras de condomínio

- `slug` é único.
- Status disponível: `active` ou `inactive`.
- Configurações por condomínio controlam comportamento das abas:
  - `has_blocks`
  - `has_basement`
  - `basements`
  - `enabled_features`
  - `intended_draw_type`
- Ao criar condomínio, o sistema registra quem criou (`created_by_user_id`) quando o usuário da sessão existe na tabela `users`.

## 3. Tela do condomínio (`/admin/tenants/[id]`)

As abas mudam conforme a configuração do condomínio.

### 3.1 Config

- Permite atualizar nome, slug, status e `config`.
- `slug` continua com regra de unicidade.

### 3.2 Blocos

- Só faz sentido quando `has_blocks = true`.
- CRUD de blocos por condomínio.

### 3.3 Apartamentos

- CRUD por condomínio.
- Número não pode duplicar no mesmo contexto (com bloco ou sem bloco).
- Cada apartamento precisa ter ao menos um direito (`rights`).
- Direitos aceitos no estado atual: `simple`, `double`, `moto`.
- Restrições opcionais:
  - `allowedSubsolos`
  - `allowedBlocks`

### 3.4 Vagas

- CRUD por condomínio.
- Vaga não pode duplicar pela combinação número + localização/bloco.
- Tipos de vaga: `simple` ou `double`.
- Tipo especial: `normal`, `pne`, `idoso`, `visitor`.
- Uma vaga pode ser pré-atribuída (`apartment_id`):
  - vaga pré-atribuída não entra no sorteio
  - atribuição valida compatibilidade entre direito do apartamento e tipo da vaga

### 3.5 Importações

- Importação de apartamentos e vagas por arquivo.
- Validações de formato e consistência são aplicadas no backend.

### 3.6 Status

- Mostra checagens de prontidão:
  - contagens
  - duplicidades
  - consistência de blocos/subsolos
  - avisos de falta de vagas para os direitos cadastrados

### 3.7 Sorteios (histórico)

- Lista sorteios do condomínio por data.
- Exibe quantidade de atribuições por sorteio.
- Permite excluir sorteio específico.

## 4. Execução do sorteio (`/admin/tenants/[id]/sorteio`)

- Apenas admin autenticado executa sorteio.
- O sorteio roda em transação:
  - cria `draw`
  - grava `draw_results`
  - se falhar, faz rollback
- O resultado retorna:
  - pares sorteados no draw
  - vagas pré-atribuídas já existentes (composição do resultado completo)
- O sorteio gera `random_seed` para auditabilidade.
- `executed_by_user_id` é salvo quando o usuário da sessão existe em `users`.

### Regras do motor S1

- Só considera vagas não atribuídas (`apartment_id` nulo).
- Calcula demanda pendente por apartamento:
  - direitos cadastrados
  - menos vagas já pré-atribuídas
- Faz matching por:
  - tipo de vaga compatível
  - subsolo permitido (se houver restrição)
  - bloco permitido (se houver restrição)

## 5. Resultado e consulta pública

- Resultado público por sorteio:
  - rota com slug + drawId
  - sem login
- Admin pode:
  - visualizar resultado detalhado
  - exportar planilha
  - imprimir
  - compartilhar QR Code

## 6. Auditoria e rastreabilidade

- Ações administrativas geram `audit_logs`:
  - criação, edição, exclusão, importação, sorteio
- Condomínio registra autoria explícita:
  - `tenants.created_by_user_id`
- Sorteio registra executor explícito:
  - `draws.executed_by_user_id`
- Quando o usuário da sessão não existe na tabela `users`, os campos de autoria explícita ficam `null`, mas a ação ainda é registrada em auditoria.
