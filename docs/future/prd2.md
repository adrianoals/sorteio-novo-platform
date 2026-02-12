Perfeito — dá pra encaixar isso muito bem no PRD, e sim: **“cadastrar e depois escolher plano”** vs **“pagar e depois entrar”** são dois modelos diferentes. Eu recomendo um híbrido simples (é o que mais converte e reduz atrito):

* **Cadastro → entra no painel → começa em modo teste (trial)**
* Quando ele quiser “rodar pra valer” (ou destravar limites), ele **faz upgrade e paga**.

Abaixo já vai um **PRD (Parte 2)** incorporando isso + créditos por sorteio + lock.

---

## PRD — Parte 2: Checkout/Trial + Créditos de Sorteio + Fluxo de Travamento

### 1) Objetivo

Permitir que o cliente:

1. crie uma conta e experimente o sistema em um **modo teste limitado**;
2. faça **upgrade/pagamento** para obter **créditos de sorteio**;
3. configure um condomínio/sorteio através de um **wizard**;
4. **trave** a configuração antes de executar;
5. execute o sorteio e depois acesse resultados em **read-only**.

---

### 2) Problemas que esta parte resolve

* **Reduz atrito**: usuário consegue “ver funcionando” sem pagar antes.
* **Evita burla**: execução real depende de crédito + travamento.
* **Escalabilidade**: uma conta pode gerenciar vários sorteios (cada um consumindo crédito).
* **Governança**: admin master consegue auditar tudo.

---

### 3) Personas

* **Cliente (Account Owner):** cria conta, testa, compra créditos, cria e executa sorteios.
* **Usuário Operacional (membro da conta):** (opcional no MVP) executa sorteios conforme permissões.
* **Admin Master (plataforma):** vê tudo, gerencia planos, créditos, exceções, auditoria.

---

### 4) Modelo de negócio e acesso

#### 4.1 Modelo recomendado: “Crédito por sorteio”

* O cliente compra **créditos** (1, 3, 5, 10…).
* **1 crédito = 1 sorteio executável** (vinculado a 1 condomínio/sorteio).
* Cada crédito tem **validade de uso** (ex.: 30/60/90 dias).

#### 4.2 Trial (teste) — “modo demonstrativo”

O usuário pode usar um modo teste com limites:

**Limites sugeridos do Trial**

* Máx. **10 apartamentos** e **10 vagas**
* Pode configurar regras básicas e ver validações
* Pode rodar um “**sorteio de demonstração**” (opcional), mas:

  * marca d’água
  * sem exportação
  * não gera resultado oficial/publicável
  * ou roda com dados “dummy” (você decide)

**O que o trial NÃO pode**

* publicar resultado oficial
* gerar link público oficial
* exportar PDF/Excel oficial
* executar sorteio “final” (se você quiser manter execução como paga)

> Recomendação prática: deixe o trial “legal de usar”, mas bloqueie tudo que gera valor real (resultado oficial/exportação).

---

### 5) Jornadas (fluxos)

#### 5.1 Fluxo A — Cadastro primeiro (recomendado)

1. Usuário se cadastra e entra no painel
2. Conta nasce em **TRIAL**
3. Usuário pode criar “Sorteio de teste” com limites
4. CTA: “Fazer upgrade para executar sorteio oficial / remover limites”
5. Usuário compra créditos e vira **PAID**
6. Pode criar sorteios reais vinculados a créditos

#### 5.2 Fluxo B — Pagar e entrar

1. Usuário escolhe plano e paga
2. Cria conta no checkout (ou após pagamento)
3. Entra no painel já com créditos

> Você pode oferecer os dois: “começar grátis” e “comprar agora”.

---

### 6) Fluxo do Sorteio (Wizard + Lock)

#### 6.1 Estados do sorteio

* **DRAFT:** editável
* **LOCKED:** travado (imutável)
* **FINALIZED:** sorteio executado
* **READ_ONLY:** apenas resultado/consulta

#### 6.2 Wizard do sorteio real (pago)

**Passo 1 — Nome do condomínio**

* input: nome
* confirmação: “Após travar, não poderá alterar.”

**Passo 2 — Dados e regras**

* unidades/apartamentos
* vagas
* regras (PNE, idoso, duplas, travas etc.)

**Passo 3 — Validações/Testes**

* botão “Validar dados”
* lista de erros e avisos

**Passo 4 — Data do sorteio**

* define data/hora (opcional)
* regra: não pode estar muito distante (ex.: >30 dias) sem plano premium/exceção

**Passo 5 — Revisão final**

* resumo completo
* checkbox de confirmação
* botão: **TRAVAR CONFIGURAÇÃO**

#### 6.3 Ao travar (LOCK)

* sistema grava snapshot do setup (setup_version)
* bloqueia alterações sensíveis (nome, listas, regras)
* registra evento de auditoria

#### 6.4 Execução

* botão “Executar sorteio”
* após execução:

  * gera resultado
  * marca como FINALIZED
  * consome o crédito (se ainda não consumiu na criação)

#### 6.5 Pós-sorteio

* acesso ao resultado permanece (read-only)
* exportação conforme plano
* link público (se existir) conforme plano

---

### 7) Regras de consumo do crédito (decisão importante)

Duas opções:

**Opção 1 — Consome no LOCK** (recomendado)

* Vantagem: impede “reservar infinitos sorteios” sem compromisso
* Se travou, o crédito já está comprometido

**Opção 2 — Consome na EXECUÇÃO**

* Vantagem: usuário pode preparar e travar sem gastar (mas pode gerar burla de volume)
* Mitigação: limitar quantos sorteios LOCKED sem execução por conta

> Eu recomendo **consumir no LOCK** e permitir “cancelar antes de executar” só via admin (ou com regras).

---

### 8) Admin Master (governança)

* visualizar contas, créditos, sorteios
* alterar status de conta (trial/paid/suspenso)
* liberar exceções:

  * extensão de validade
  * re-sorteio
  * desbloqueio (casos raros)
* auditoria de eventos por conta/sorteio

---

### 9) Requisitos Funcionais (RF)

* **RF-01**: Usuário pode criar conta (cadastro) e entrar no painel
* **RF-02**: Conta inicia em TRIAL com limites
* **RF-03**: Usuário pode comprar créditos e ativar conta PAID
* **RF-04**: Para criar sorteio real, precisa de crédito disponível
* **RF-05**: Wizard de criação/validação do sorteio
* **RF-06**: Travamento (LOCK) bloqueia edições sensíveis
* **RF-07**: Execução gera resultado e muda estado para FINALIZED
* **RF-08**: Pós-finalização: apenas read-only + exportações conforme plano
* **RF-09**: Auditoria de eventos (criar/editar/lock/execute/export)

---

### 10) Critérios de aceite (exemplos)

* Se conta estiver em TRIAL, não pode cadastrar >10 apartamentos.
* Se sorteio estiver LOCKED, não pode alterar nome/regras/listas.
* Se não houver crédito válido, não pode iniciar sorteio real.
* Ao executar, deve existir exatamente 1 setup_version travado associado.
* Resultado sempre referencia o setup_version que foi travado.

---

## Recomendação (minha opinião do produto)

Faça **Cadastro → Trial → Upgrade**.
Porque:

* aumenta conversão (a pessoa “vê valor” antes de pagar)
* dá confiança
* e você continua protegido com lock + crédito + limites.

---

Se você quiser, eu já sigo com:

* **modelo de dados** (tabelas/entidades e campos)
* **matriz de permissões** (trial vs pago)
* e **telas mínimas** do painel (Customer + Admin).
