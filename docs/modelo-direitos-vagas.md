# Modelo de direitos e vagas (especificação)

**Implementado:** direitos como lista (`rights` JSON no apartamento), vagas travadas (`apartment_id` na vaga), restrições opcionais (`allowed_subsolos`, `allowed_blocks`). Motor S1 usa demanda pendente e vagas não atribuídas.

---

Documento que descreve o desenho genérico de **direitos do apartamento**, **restrições opcionais** e **vagas travadas (fixas)**. Objetivo: cobrir vários cenários de condomínios sem regras hardcoded por cliente.

---

## 1. Contexto

- **Vagas** têm características fixas: tipo (simples/dupla), categoria (normal, PNE, idoso), subsolo, bloco. Cada vaga é um registro com esses atributos.
- **Apartamentos** têm regras variáveis: podem ter um ou vários direitos, combinações (ex.: PNE + simples), e opcionalmente restrições de “onde” podem concorrer (subsolo/bloco).
- O sistema precisa permitir ainda **vagas travadas**: uma vaga pode estar pré-atribuída a um apartamento e não entrar no sorteio. Um apartamento pode ter travas parciais (só parte dos direitos já tem vaga fixa) ou totais.

Tudo isso deve ser representado por **dados e configuração**, não por código específico por condomínio.

---

## 2. Direitos do apartamento

### 2.1 Múltiplos direitos

Um apartamento pode ter **vários direitos** — ou seja, pode concorrer a mais de um tipo de vaga. Exemplos:

- Só direito a vaga simples.
- Direito a vaga dupla **e** vaga simples (as duas possibilidades).
- Direito a vaga PNE **e** vaga simples (uma ou outra, conforme sorteio).

Cada “direito” é um **tipo** (ou tipo + categoria) de vaga pelo qual o apartamento pode pleitear. No modelo, o apartamento guarda uma **lista** de direitos (ex.: `[simples, dupla]` ou `[simples, PNE]`), não um único valor.

### 2.2 Restrições opcionais (onde concorrer)

Além dos tipos de vaga, pode existir regra de **onde** o apartamento concorre:

- **Subsolo:** o apartamento só pode pleitear vagas de determinados subsolos (ex.: só “Subsolo 1”) ou “qualquer subsolo” (sem restrição).
- **Bloco:** o apartamento só pode pleitear vagas de determinados blocos (ex.: só “Bloco A”) ou “qualquer bloco” (sem restrição).

Quando não há restrição, o apartamento concorre a qualquer vaga que bata com um dos seus direitos. Quando há, o sorteio só considera vagas que atendam **ao mesmo tempo** o tipo de direito e o subsolo/bloco permitido.

**Resumo:** direitos = “a que tipos de vaga posso concorrer”; restrições = “apenas em quais subsolos/blocos”.

---

## 3. Vagas travadas (fixas)

### 3.1 Conceito

Uma **vaga travada** é uma vaga já **atribuída** a um apartamento. Essa vaga:

- **Não entra no sorteio** — fica reservada para aquele apartamento.
- Deve ser **compatível** com os direitos do apartamento (ex.: não travar uma vaga dupla para um apartamento que só tem direito a simples).

### 3.2 Múltiplos direitos e travas parciais/totais

Quando o apartamento tem mais de um direito (ex.: 1 dupla + 1 simples), cada “slot” pode estar:

- **Travado:** já existe uma vaga específica atribuída a ele para aquele tipo de direito.
- **No sorteio:** esse slot ainda será preenchido pelo sorteio.

Exemplos:

- **Ambas travadas:** a dupla e a simples já estão atribuídas ao apartamento → nenhuma delas entra no sorteio.
- **Só uma travada:** a dupla está fixa; a simples entra no sorteio.
- **Nenhuma travada:** as duas são definidas pelo sorteio.

Ou seja: o sistema deve permitir **travas parciais ou totais** por apartamento, respeitando sempre os direitos (quantidade e tipo).

### 3.3 Regras de consistência

- Só é permitido **travar** uma vaga para um apartamento se:
  - o **tipo/categoria** da vaga for um dos direitos do apartamento, e
  - não ultrapassar a **quantidade** daquele direito (ex.: não travar duas vagas duplas se o apartamento tem direito a apenas uma dupla).
- Uma vaga atribuída a um apartamento **não** entra na pool de vagas do sorteio.
- Opcionalmente: validar restrições de subsolo/bloco também na hora de travar (ex.: só travar vaga do bloco A se o apartamento puder ter vaga no bloco A).

### 3.4 Sorteio

- **Vagas:** entram no sorteio apenas as vagas **não atribuídas** (não travadas).
- **Apartamentos:** para cada apartamento, considera-se a **demanda pendente** = direitos ainda não preenchidos por vaga travada. Só esses “slots” competem no sorteio.
- O matching (quem pode ganhar qual vaga) usa: tipo/categoria da vaga ∈ direitos do apartamento; subsolo/bloco da vaga dentro das restrições do apartamento (se houver).

---

## 4. Resumo do modelo (entidades e noções)

| Noção | Descrição |
|-------|-----------|
| **Vaga** | Atributos fixos: tipo (simples/dupla), categoria (normal, PNE, idoso…), subsolo, bloco. Pode ter **atribuição** a um apartamento (vaga travada). |
| **Apartamento** | **Direitos:** lista de tipos/categorias de vaga que pode pleitear. **Restrições (opcionais):** subsolos e/ou blocos em que pode concorrer (vazio = qualquer). Pode ter zero ou mais vagas já atribuídas (travadas). |
| **Atribuição (vaga travada)** | Relação vaga ↔ apartamento. Se existir, a vaga não entra no sorteio e conta como preenchimento de um “slot” de direito daquele apartamento. |
| **Sorteio** | Usa apenas vagas não atribuídas e a demanda pendente de cada apartamento (direitos menos vagas já travadas para ele). |

---

## 5. Próximos passos (implementação)

Quando for implementar:

1. **Apartamento:** evoluir de um único campo `rights` (string) para uma estrutura que permita **lista de direitos** (ex.: array ou tabela auxiliar) e campos opcionais de **restrição** (ex.: `allowed_subsolos`, `allowed_blocks` ou equivalente).
2. **Vaga:** garantir campo ou relação que indique **atribuição a apartamento** (ex.: `apartment_id` na vaga ou tabela `spot_assignments`). Se preenchido, a vaga é travada.
3. **Validações:** ao atribuir/travar uma vaga a um apartamento, validar tipo e quantidade contra os direitos e, se aplicável, restrições de subsolo/bloco.
4. **Sorteio:** usar apenas vagas sem atribuição e, por apartamento, demanda = direitos − vagas já atribuídas a ele.

Referência de discussão: conversa sobre “modelo genérico” e “vagas travadas” (direitos + restrições + travas parciais/totais).

---

## 6. Planilhas modelo (importação)

Para carregar apartamentos ou vagas em massa, o sistema oferece **planilhas modelo** em CSV. O usuário baixa o arquivo, preenche com os dados do condomínio e importa pela aba **Importações** (CSV ou Excel).

**Onde estão:** em `public/templates/`:

| Arquivo | Colunas | Conteúdo |
|---------|---------|----------|
| `modelo-apartamentos.csv` | numero, direitos, bloco | Número do apartamento (obrigatório), tipo de direito (simple, double, two_simple, car, moto), ID do bloco (opcional). Inclui linhas de exemplo. |
| `modelo-vagas.csv` | numero, tipo, especial, subsolo, bloco | Número da vaga (obrigatório), tipo (simple, double), especial (normal, pne, idoso, visitor), subsolo e bloco opcionais. Inclui linhas de exemplo. |

**Como usar:** na aba **Importações** do condomínio, selecione o tipo (Apartamentos ou Vagas) e clique em **"Baixar planilha modelo"**. O link aponta para o CSV correspondente. Baixe, preencha as linhas (pode editar no Excel ou LibreOffice e salvar como CSV ou .xlsx) e envie pelo formulário de importação.

**Observação:** a coluna **bloco** é opcional. Se o condomínio usa blocos, preencha com o **ID do bloco** (UUID), que pode ser consultado na aba **Blocos** do condomínio.
