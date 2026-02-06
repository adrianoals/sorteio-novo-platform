# Fase 02 – Fluxo de assembleia (baseado no Sky View / Django)

**Status: implementado.** O fluxo descrito abaixo está em uso: página do sorteio (admin), motor S1, resultado com pré-atribuídos, export Excel (ExcelJS, colunas por config), QR Code, página pública por draw, aba Sorteios no admin, impressão/PDF.

---

Objetivo: o sistema é usado **em assembleia de condomínio** (por quem conduz a reunião). A **página do sorteio** (botão Sortear, GIF, resultado, exportar, QR Code) tem **acesso restrito**; apenas a **página do resultado** (consultada pelo morador via link ou QR Code) é **pública**. Tanto a página do sorteio quanto a página do resultado (QR Code) devem se **basear no projeto anterior** (Sky View / Django) em layout e fluxo.

---

## Fluxo extraído do Sky View (Django)

### 1. Página do Sorteio (`sky-view-sorteio/`)
- **Antes de sortear:** botão **"Iniciar"** (POST).
- **Após clicar:** backend executa o sorteio (limpa resultado anterior, aloca vagas fixas → duplas → simples), grava em tabela `Sorteio`, guarda horário na sessão e redireciona para a mesma URL (GET).
- **Após o sorteio:** na mesma página aparecem:
  - Um **GIF de loading** (carro / "sorteando…").
  - A **lista de resultados** (Apartamento | Vaga | Subsolo | Tipo).
  - Botão **Exportar para Excel**.
  - **QR Code** estático que leva à página de consulta do resultado.

### 2. Exportar Excel (`sky-view-excel`)
- Download da planilha com resultado (apartamento, vaga, subsolo, tipo).

### 3. Página de resultado (QR Code) (`sky-view-qrcode`)
- **Pública:** morador acessa por link ou QR Code.
- Dropdown **"Selecione seu apartamento"** → ao filtrar, mostra as vagas sorteadas para aquele apartamento.

### 4. Zerar (`sky-view-zerar/`)
- POST apaga todos os registros de `Sorteio` e redireciona para a página do sorteio (para rodar de novo).

---

## Adaptação para o V2 (Next.js, multi-tenant)

Cada condomínio é um **tenant** identificado pelo **slug** (ex.: `sky-view`). A **página do sorteio** e a **página do resultado (QR Code)** devem se **basear no projeto anterior** (Sky View / Django) em layout e fluxo.

### Quem acessa o quê (implementação)

- **Página do sorteio:** apenas **quem está logado no admin desse condomínio** pode acessar. É essa pessoa que executa o sorteio na assembleia, vê o resultado, exporta a planilha e divulga o QR Code. Começar com esse critério (mesmo login do painel admin do tenant).
- **Página pública:** para o público, **apenas a página do resultado** (consultar por apartamento via link ou QR Code). Sem login. Nada mais é exposto ao público.
- **Relatórios (exportar planilha, etc.):** quem **envia** ou **gera** o relatório é quem executa o sorteio — ou seja, o **admin**. O morador (público) só consulta o resultado na página pública; não exporta planilha. Entendido assim na implementação.

### Rotas

| Rota (exemplo) | Acesso | Uso |
|----------------|--------|-----|
| `/[slug]/sorteio` ou `/sorteio/[slug]` | **Restrito** | Página do sorteio (assembleia): botão Sortear, GIF, resultado, exportar, QR Code. Basear em `sky_view_sorteio`. |
| `/[slug]/resultado/[drawId]` | **Pública** | Página **daquele** sorteio (URL fixa do QR Code). Lista + filtro por apartamento. Basear em `sky_view_qrcode`. |
| `/[slug]/resultado` (sem id) | **Pública** | Opcional; mostra o último sorteio (entrada genérica). |

### Fluxo na página do sorteio (assembleia) — acesso restrito

- Página **não é pública**: só **quem está logado no admin desse condomínio** acessa. Quem executa o sorteio é o admin; quem exporta relatórios e divulga o QR Code também é o admin. Basear no projeto anterior: `sky_view_sorteio` (Sky View).

1. **Estado inicial (ainda não sorteou):**
   - Título do condomínio.
   - Botão **"Sortear"**.

2. **Usuário clica em "Sortear":**
   - **Imediatamente:** mostrar **GIF** de loading (ex.: carro roxo em movimento).  
     Arquivo já disponível: `public/gifsorteio/sorteio-gif.gif`.
   - Em background: chamar **API POST** que executa o motor S1, persiste o resultado (tabela de sorteio/draw) e retorna sucesso + dados do resultado (ou só sucesso e depois GET do resultado).

3. **Quando a API terminar:**
   - Esconder o GIF.
   - Mostrar na **mesma página** o **resultado**: tabela/listagem (Apartamento, Vaga, Localização, Tipo).
   - Mostrar também:
     - Botão/link **Exportar planilha** (Excel ou CSV).
     - **QR Code** que leva para a **página pública daquele sorteio** (veja seção abaixo).

4. **Exportar planilha:**
   - Endpoint ou download que gera arquivo a partir do último resultado do tenant (igual ao `sky_view_excel`).

5. **Página pública de resultado (QR Code):**
   - **Única página pública.** Morador acessa por link ou QR Code, sem login.
   - Lista completa do sorteio + identificação (data/hora).
   - Filtro por número do apartamento (dropdown), para o morador ver "minha vaga".
   - Basear no projeto anterior: `sky_view_qrcode` (Sky View).

### Sorteios por data (histórico) — sem precisar zerar

- Cada vez que alguém clica em **Sortear**, o sistema **cria um novo registro de sorteio** com data/hora (ex.: tabela `draws`: `id`, `tenant_id`, `created_at`).
- **Não sobrescreve** o anterior: fica um **histórico** de sorteios por condomínio.
- Não é obrigatório zerar para rodar de novo: basta sortear de novo e nasce outro sorteio (outra data).
- **Zerar** (excluir um sorteio) fica como opção **somente no admin**, quando o condomínio realmente precisar apagar um registro (erro, teste, etc.).

### Aba no admin: Sorteios (ou "Último sorteio")

- No painel admin de cada condomínio, **nova aba** ao lado de Config, Blocos, Apartamentos, Vagas, Importações, Status: **Sorteios**.
- Nessa aba:
  - Listar os sorteios **por data** (mais recente primeiro), ou ao menos mostrar o **último sorteio** (data/hora, quantidade de atribuições).
  - Opção **Zerar** (excluir) um sorteio específico, com confirmação — para quando precisarem remover um resultado (teste, engano).
- Quem usa o admin vê o histórico e controla se quer manter ou apagar um sorteio.

### Página pública: identificar qual sorteio está sendo exibido

- Na **página pública de resultado** (acesso do morador / QR Code), a tela deve **deixar claro qual sorteio** está sendo mostrado.
- Exemplo: no topo da página, texto como **"Sorteio realizado em 15/01/2025 às 14h 30min"** (data/hora do `draw`).
- Comportamento sugerido:
  - **Por URL com id do sorteio:** rota tipo `/[slug]/resultado/[drawId]` — mostra sempre **aquele** sorteio. É essa URL que o QR Code deve usar (veja abaixo).
  - **Rota genérica** `/[slug]/resultado` (sem id): exibir o **último** sorteio (mais recente por data); no futuro pode ter seletor para escolher outro por data.
- Assim o morador e a assembleia sabem exatamente **qual evento de sorteio** está na tela.

### QR Code = link daquele sorteio (fixo)

- Quando o sorteio é **finalizado na assembleia**, aparece o **QR Code** para divulgar.
- Esse QR Code **tem que vir definido com o link daquele sorteio** — ou seja, a URL que aponta **só para aquele draw** (ex.: `https://app.../sorteio/sky-view/resultado/abc-123-uuid` ou `.../resultado/2025-01-15-1430`).
- **Por quê:** na hora da assembleia vocês divulgam o QR Code **daquele** sorteio que acabou de ser realizado. Quem escanear (na hora ou depois) deve cair na página que mostra **sempre esse mesmo evento** (com a data/hora "Sorteio realizado em 15/01/2025 às 14h 30min"), e não uma página genérica de "último sorteio" que pode mudar se rodarem outro sorteio no futuro.
- **Resumo:** QR Code exibido ao final do sorteio = URL fixa daquele sorteio (por `draw_id` ou identificador único). A rota pública de resultado deve aceitar esse id e exibir apenas esse draw.

---

## Resumo do que implementar (Fase 02)

1. **Modelo de dados:** tabela(s) para armazenar **cada sorteio por data** (ex.: `draws`: `id`, `tenant_id`, `created_at`; `draw_results`: `draw_id`, `apartment_id`, `spot_id`). Cada execução gera um novo `draw`, sem apagar os anteriores.
2. **Motor S1:** serviço/API que, dado um `tenant_id`, executa o sorteio (vagas não travadas, demanda pendente, restrições) e grava um **novo** `draw` + `draw_results`.
3. **Admin — aba Sorteios:** listar sorteios do tenant (por data); exibir último sorteio em destaque; opção **Zerar** (excluir) um sorteio com confirmação.
4. **Rotas:**
   - `/[slug]/sorteio` (**restrita**): página do sorteio (Sortear → GIF → resultado + exportar + QR Code). Basear em `sky_view_sorteio`. QR Code aponta para `/[slug]/resultado/[drawId]`.
   - `/[slug]/resultado/[drawId]` (**pública**): página **daquele** sorteio; **é a única página pública**. Identificação "Sorteio realizado em DD/MM/AAAA às HHh MMmin", lista e filtro por apartamento. Basear em `sky_view_qrcode`. **URL que vai no QR Code.**
   - `/[slug]/resultado` (sem id, **pública**): opcional; mostra o último sorteio.
5. **API:**  
   - POST executar sorteio → cria novo `draw`, retorna resultado.  
   - GET resultado (por `draw_id` ou "último" por tenant).  
   - GET export (Excel/CSV) de um sorteio específico (ex.: último ou por id).
6. **GIF:** usar `public/gifsorteio/sorteio-gif.gif` como loading entre o clique em "Sortear" e a exibição do resultado.

Com isso: histórico de sorteios por data, admin com aba para ver e eventualmente zerar, e página pública sempre identificando qual sorteio está sendo exibido.
