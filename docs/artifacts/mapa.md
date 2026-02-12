Segue a **análise do Sorteio_Novo** (projeto Django legado) para você usar como base na V2. A V2 (sorteioNovo-V2) já está em desenvolvimento; para o estado atual do produto e do fluxo, ver `docs/prd.md` e `docs/regras-de-negocio.md`.

---

# Análise do projeto Sorteio_Novo

## 1. Visão geral

- **Stack:** Django 5, Python, PostgreSQL (Supabase), Bootstrap/Tailwind, openpyxl, WeasyPrint, qrcode.
- **Deploy:** Docker, Gunicorn, Hostinger, domínio `sn.sorteionovo.com.br`.
- **Objetivo:** Sistema de **sorteio de vagas de garagem** para condomínios/empreendimentos. Cada “cliente” é um app Django com nome do empreendimento.

---

## 2. Estrutura atual: um app por empreendimento

Cada empreendimento é um app Django isolado com seus próprios models, views, URLs e templates:

| App | Padrão | Observações |
|-----|--------|-------------|
| **alvorada, buriti, gran_vitta, harmonia_class, helborsorteio, la_corunha, passaros, sky_view, splendore** | “Simples” | Sorteio em lote + Excel + QR Code + Zerar |
| **fatto_passion** | “Com fixos” | Vagas fixas (mapeamento apt→vaga) + sorteio v2 |
| **arthur, ventura** | “Com presença” | Presença, prioridade, filtrar, sorteio por apartamento, final (ausentes) |
| **tres_coelhos** | “Avançado” | PNE, idoso, subsolo, duplas de apartamentos, duplas de vagas, configurações |
| **la_corunha** | “Carro/Moto” | Direito por tipo (carro/moto), vagas por tipo |

**Problemas dessa estrutura:**

- Código repetido entre apps (sorteio, excel, zerar, qrcode).
- Cada novo empreendimento = novo app + migrations + URLs + templates.
- Lógica de negócio espalhada (ex.: regras de PNE/vaga dupla em cada view).
- Difícil evoluir regras globais (ex.: novo tipo de sorteio) sem tocar em vários apps.
- **Arthur** usa `Bloco` na view mas o model `Bloco` está só no app **Ventura** → bug de referência.

---

## 3. Modelos de dados (por tipo de app)

### 3.1 Padrão comum (maioria)

- **Apartamento:** `numero`, às vezes `direito_vaga_dupla`, `is_pne`, `direito_duas_vagas_livres`, etc.
- **Vaga:** `numero`, `subsolo`, `tipo_vaga` (Simples/Dupla), às vezes `is_pne`, choices de subsolo.
- **Sorteio:** `apartamento` (FK), `vaga` (FK), `data_sorteio`.

### 3.2 Variações

- **Arthur:** `Apartamento` com `numero_apartamento`, `presenca`, `prioridade`; `Sorteio` com OneToOne em vez de FK (1 apt ↔ 1 vaga). **Sem** model `Bloco` (view referencia indevidamente).
- **Ventura:** `Bloco`; Apartamento e Vaga ligados a Bloco; mesmo padrão OneToOne no Sorteio.
- **La Corunha:** Apartamento com `tipo_vaga_direito` (Carro/Moto); Vaga com `tipo_vaga`, `is_carro`, `is_moto`.
- **Tres Coelhos:** `Apartamento` (subsolo, is_pne, is_idoso, apenas_dupla, apenas_livre); `Vaga` (tipo DUPLA/LIVRE, especial NORMAL/PNE/IDOSO, `dupla_com` auto-referência); `DuplaApartamentos`; `SorteioDupla` além de `Sorteio`.

Conclusão: não existe um “modelo único” de Apartamento/Vaga; cada app adapta campos e relações. Para V2 white-label isso vira **um núcleo comum + configuração por empreendimento** (campos extras, regras).

---

## 4. Funcionalidades por “persona”

### 4.1 Fluxo “simples” (ex.: Alvorada)

1. **Sorteio** – POST limpa `Sorteio`, separa aptos (vaga dupla x simples), embaralha, associa apt→vaga, grava sessão (horário conclusão).
2. **Excel** – Abre modelo xlsx do empreendimento, preenche com resultados, devolve download.
3. **QR Code** – Página com filtro por apartamento e exibição do resultado do sorteio para aquele apt.
4. **Zerar** – Confirmação e `Sorteio.objects.all().delete()`.

### 4.2 Fluxo “com presença” (Arthur / Ventura)

1. **Presença** – Marcar presença e prioridade por apartamento (form POST).
2. **Filtrar** – Listar presentes / ausentes.
3. **Sorteio por apartamento** – Sortear um apt (prioritários primeiro), usuário escolhe vaga, grava um `Sorteio`.
4. **Final** – Sorteio em lote para ausentes com vagas restantes; limpa sorteios de ausentes e realoca.
5. **Aleatório** – Sorteio em lote sem presença (como o “simples”).
6. **Excel, Zerar, QR Code** – Idéia igual, com detalhes específicos (ex.: bloco no Ventura).

### 4.3 Fluxo “avançado” (Tres Coelhos)

- Sorteio por **subsolo**, **PNE** (vaga fixa PNE por subsolo + sobras em vagas livres), **duplas de apartamentos** e **sorteio de duplas**.
- Telas: configurar PNE, configurar duplas, resultado, Excel específico.
- Regras de negócio complexas e hardcoded (ex.: IDs de vagas PNE).

---

## 5. Front-end e assets

- **Templates:** `templates/sorteio_novo/` (bases comuns) e `templates/<app>/` (por empreendimento).
- **Bases:** `base.html` (Bootstrap + menu/footer), `base_tailwind.html`, `base_simples.html`.
- **Assets por empreendimento:** logo, QR Code estático, modelo Excel (ex.: `sorteioalvorada.xlsx`) em `setup/static/assets/`.
- **JS:** `app.js` global; apps como Arthur/Ventura têm `app_ventura.js`, `app_ng.js`, etc., para fluxos específicos.
- **Estilo:** Bootstrap 5, Tailwind em alguns templates, CSS em `setup/static/styles/`.

Ou seja: há reuso de layout, mas cada empreendimento ainda tem seus templates e assets próprios; para white-label isso vira “um layout + tema/config por cliente”.

---

## 6. Back-end e configuração

- **URLs:** Todas sob o mesmo `ROOT_URLCONF`; cada app expõe paths como `alvorada-sorteio/`, `sky-view-sorteio/`, etc. Sem prefixo por “tenant”.
- **Autenticação:** `@staff_member_required` em alguns fluxos (Arthur); outros sem proteção explícita nas views analisadas.
- **Sessão:** Usada para “sorteio iniciado” e “horário conclusão” (por app).
- **Banco:** Um único PostgreSQL; tabelas prefixadas pelo app (`alvorada_apartamento`, `sky_view_sorteio`, etc.).
- **Dados iniciais:** SQL em `*/database/*.sql` (pop) e migrations Django.

---

## 7. Pontos para a V2 (modular + white-label)

### 7.1 Domínio e termos

- **Empreendimento / Condomínio** = “tenant” ou “instância” do sistema.
- **Tipos de sorteio:** em lote, com presença (por apartamento + final), com PNE/idoso, com duplas, carro/moto, vagas fixas.
- **Entidades:** Empreendimento → Bloco (opcional) → Apartamento; Empreendimento → Vaga (tipos, subsolo, PNE, dupla); Sorteio = resultado (apt, vaga, data, tipo).

### 7.2 O que modularizar

- **Core único:** modelos base (Empreendimento, Bloco opcional, Apartamento, Vaga, Sorteio) com campos configuráveis ou extensíveis (ex.: JSON de “regras” ou flags por tipo de sorteio).
- **Regras de sorteio:** por “tipo de sorteio” (simples, vaga dupla, PNE, presença, duplas, carro/moto, fixos) como módulos ou serviços reutilizáveis, parametrizados pelo empreendimento.
- **Export Excel:** modelo base + mapeamento por empreendimento (colunas, layout) em config, não um xlsx fixo por app.
- **QR Code:** URL por empreendimento (e se quiser por sorteio/evento), com tema/branding configurável.
- **UI:** um conjunto de telas (sorteio, resultado, presença, config) que leem “quem é o empreendimento” e “qual tipo de sorteio” da config/rota, em vez de um app Django por cliente.

### 7.3 O que evitar na V2

- Evitar 1 app = 1 empreendimento (cresce mal e duplica código).
- Evitar regras e IDs hardcoded (ex.: PNE por ID de vaga); preferir config (subsolo, tipo “PNE”, etc.).
- Evitar referências cruzadas entre “apps” (como Bloco do Ventura usado no Arthur); tudo deve vir de um núcleo ou de config do tenant.

### 7.4 Stack do V2 (sorteioNovo-V2)

- **sorteioNovo-V2** já é Next.js (TS). Faz sentido manter front em Next e ter uma API (ex.: Next API Routes ou backend separado em Django/Fastify/Node) para:
  - CRUD de empreendimentos, blocos, apartamentos, vagas.
  - Execução de sorteios (por tipo).
  - Export Excel, geração de QR Code, “zerar”.
- Banco: um único schema com “tenant” = empreendimento (ou schema/DB por tenant se quiser multi-tenant forte).
- White-label: por empreendimento guardar nome, logo, cores, domínio (opcional), modelo Excel (ou template), e usar isso na UI e nos exports.

---

## 8. Resumo

| Aspecto | Sorteio_Novo atual | Sugestão para V2 |
|--------|---------------------|-------------------|
| **Estrutura** | 1 app Django por empreendimento | 1 core (API + modelos) + “config” por empreendimento |
| **Modelos** | Apartamento/Vaga/Sorteio diferentes por app | Modelo unificado + configuração (tipos de vaga, PNE, bloco, etc.) |
| **Regras de sorteio** | Lógica dentro de cada view | Módulos/serviços por “tipo de sorteio” reutilizáveis |
| **UI** | Templates por app, bases comuns | App único (Next) com tema/ branding por empreendimento |
| **Excel / QR** | Arquivo e layout por app | Template/config por empreendimento |
| **Deploy** | Um monólito, vários paths | Mesmo app, multi-tenant por empreendimento (e opcionalmente domínio) |

Com isso você tem um mapa claro do que o Sorteio_Novo faz hoje e de como reorganizar na V2 para ficar mais prático, modular e white-label. No próximo passo podemos desenhar a estrutura de pastas e os “módulos” (tipos de sorteio, config de empreendimento) só no papel, ainda sem criar arquivos, se quiser.
