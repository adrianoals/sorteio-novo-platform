# Padronização das colunas da planilha exportada

## Problema

Condomínios diferentes usam dados diferentes:

- **Bloco:** tem condomínio com blocos (A, B, Torre 1…) e outro sem.
- **Localização:** tem condomínio com subsolo/local (Subsolo 1, P1…) e outro sem.

Se a planilha tiver sempre as mesmas colunas, quem não usa bloco/localização fica com coluna vazia; se tivermos colunas fixas mínimas, quem usa fica sem a coluna. O desafio é **padronizar a lógica** sem fixar o mesmo conjunto de colunas para todos.

---

## Fonte da verdade no app

O app já define por condomínio o que existe:

- **`tenant.config.has_blocks`** — condomínio usa blocos (aba Blocos, coluna Bloco em apartamentos/vagas).
- **`tenant.config.has_basement`** — condomínio usa localização/subsolo (coluna Localização nas vagas).

Ou seja: **não precisamos de nova configuração**; usamos a que já existe na aba Config.

---

## Ordem padrão das colunas (convenção única)

Definimos uma **ordem fixa** e **incluímos cada coluna opcional só quando o condomínio usa**:

| Ordem | Coluna      | Sempre? | Quando incluir        |
|-------|-------------|--------|------------------------|
| 1     | Apartamento | Sim    | sempre                 |
| 2     | Bloco       | Não    | `config.has_blocks`    |
| 3     | Vaga        | Sim    | sempre                 |
| 4     | Localização | Não    | `config.has_basement`  |
| 5     | Tipo        | Sim    | sempre                 |
| 6     | Especial    | Sim    | sempre                 |

Assim:

- Quem **não** tem bloco nem localização: 4 colunas — Apartamento, Vaga, Tipo, Especial.
- Quem tem **só** localização: 5 colunas — Apartamento, Vaga, Localização, Tipo, Especial.
- Quem tem **só** bloco: 5 colunas — Apartamento, Bloco, Vaga, Tipo, Especial.
- Quem tem **os dois**: 6 colunas — Apartamento, Bloco, Vaga, Localização, Tipo, Especial.

A ordem é sempre a mesma; só mudam as colunas que entram. Isso é **padrão único** e **previsível** para o usuário e para integrações (se um dia houver).

---

## Alternativas consideradas

### A) Colunas sempre fixas (todas as 6)

- Incluir sempre Apartamento, Bloco, Vaga, Localização, Tipo, Especial.
- Quem não usa bloco/localização: coluna fica vazia (ou "—").

**Prós:** planilha sempre igual; scripts/importação externa sempre veem as mesmas colunas.  
**Contras:** colunas vazias podem confundir; condomínio pequeno sem bloco recebe coluna "Bloco" sem uso.

### B) Definir colunas por config (recomendada)

- Usar `has_blocks` e `has_basement` do tenant para decidir se inclui Bloco e Localização.
- Ordem fixa como na tabela acima; colunas opcionais só aparecem quando o config está ativo.

**Prós:** planilha alinhada ao que o condomínio realmente usa; mesma lógica da tela (Config + abas). Sem colunas inúteis.  
**Contras:** número de colunas varia (4, 5 ou 6); quem fizer script externo precisa saber que pode ser 4 ou 6 colunas (ou sempre ler por nome de coluna).

### C) Detecção só por dados (sem config)

- Incluir Bloco se **no resultado do sorteio** existir pelo menos um apartamento/vaga com bloco preenchido; idem para Localização.

**Prós:** zero config.  
**Contras:** se por engano todos os dados estiverem sem bloco num sorteio, a coluna some; depende do dado daquele sorteio, não do “modelo” do condomínio. Menos estável que config.

### D) Config explícita de colunas da exportação

- Nova config, ex.: `export_columns: ["apartment", "block", "vaga", "localizacao", "tipo", "especial"]` por tenant.

**Prós:** máximo controle por condomínio.  
**Contras:** duplicação da decisão (já temos has_blocks / has_basement); mais um lugar para manter e explicar.

---

## Recomendação: alternativa B (config existente)

- **Padronizar** pela **ordem** e pelas **regras de inclusão**:
  - Ordem: Apartamento → [Bloco] → Vaga → [Localização] → Tipo → Especial.
  - Incluir Bloco se e só se `tenant.config.has_blocks === true`.
  - Incluir Localização se e só se `tenant.config.has_basement === true`.
- Na exportação (API):
  1. Carregar o tenant com `config` (has_blocks, has_basement).
  2. Buscar resultados do sorteio; se `has_blocks`, fazer join com `blocks` para obter nome do bloco (do apartamento e/ou da vaga — definir se exportamos bloco do apt., da vaga ou os dois; sugestão: **bloco do apartamento** na coluna Bloco, pois é o que identifica “onde mora”; vaga pode ter bloco diferente em alguns condomínios).
  3. Montar o array de objetos por linha só com as chaves das colunas que entram; gerar a planilha (ex.: `json_to_sheet` ou ExcelJS) com essa ordem.

Assim a planilha fica **padronizada** (mesma ordem e mesma regra para todos), mas **adaptada** a cada condomínio (só as colunas que fazem sentido).

---

## Detalhe: o que colocar na coluna “Bloco”

- **Opção 1:** Bloco do **apartamento** (onde o morador está). Mais comum para “identificar o apartamento”.
- **Opção 2:** Bloco da **vaga** (onde fica a vaga). Útil se as vagas forem por bloco.
- **Opção 3:** Duas colunas: “Bloco (ap.)” e “Bloco (vaga)” quando `has_blocks` e quando fizer sentido no negócio.

Sugestão inicial: **uma coluna “Bloco” com o bloco do apartamento**. Se no futuro algum condomínio precisar do bloco da vaga, podemos acrescentar coluna “Bloco (vaga)” ou tratar em uma segunda fase.

---

## Resumo para implementação

1. **Fonte da verdade:** `tenant.config.has_blocks` e `tenant.config.has_basement`.
2. **Ordem padrão:** Apartamento, [Bloco], Vaga, [Localização], Tipo, Especial (colunas entre [] opcionais).
3. **Export (API):** carregar tenant + config; buscar resultados com join em `blocks` quando `has_blocks`; montar linhas apenas com as chaves das colunas escolhidas; gerar Excel nessa ordem.
4. **Nome do arquivo / cabeçalho:** podem seguir a discussão anterior (nome com condomínio e data; primeira linha com título e data). A lógica das colunas acima é independente.

Quando quiser, podemos descer para o código da rota de export e da UI (ex.: tabela de resultado) para exibir Bloco/Localização condicionalmente igual à exportação.
