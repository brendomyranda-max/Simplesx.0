# Sistema Restaurante (POS)

Aplicação web de ponto de venda para restaurante: mesas, comandas, cardápio, garçons, fechamento de conta e impressão térmica via CUPS.

Stack: **React 19 + TypeScript + Vite + Tailwind + shadcn/ui**.  
Dados salvos no **localStorage** do navegador (sem backend de banco).  
Impressão: **servidor Node local** (`server/impressora.js`) falando com o **CUPS** do Linux.

---

## Como rodar

```bash
# 1) Dependências (uma vez)
npm install

# 2) App web (porta 8080)
npm run dev

# 3) Servidor de impressão (porta 3001) — em outro terminal
npm run server
```

No app: botão **Impressora** → **Escanear** → escolher impressora → **Salvar**.

| Comando        | O que faz                          |
|----------------|------------------------------------|
| `npm run dev`  | Sobe o frontend Vite               |
| `npm run server` | Sobe o servidor CUPS de impressão |
| `npm run build`  | Gera pasta `dist/` para produção |
| `npm run preview`| Serve o build localmente          |
| `npm run lint`   | ESLint no código                   |

---

## Ordem de pastas e o que cada uma faz

Leia de cima para baixo: é a ordem em que o app “nasce” e se organiza.

```
projetinho/
│
├── index.html                 # HTML mínimo; o Vite injeta o React no #root
├── package.json               # Dependências e scripts npm
├── vite.config.ts             # Config do Vite: porta 8080, alias @ → src/
├── tailwind.config.ts         # Tema Tailwind / design tokens
├── postcss.config.js          # PostCSS (Tailwind)
├── tsconfig*.json             # Configuração TypeScript
├── components.json            # Config do shadcn/ui
├── eslint.config.js           # Regras de lint
├── public/                    # Arquivos estáticos (logo, robots.txt)
│
├── server/                    # ── BACKEND LOCAL DE IMPRESSÃO ──
│   └── impressora.js          # Express: lista impressoras CUPS e imprime com lp
│
└── src/                       # ── CÓDIGO DO FRONTEND ──
    ├── main.tsx               # ENTRADA: monta o React na página
    ├── App.tsx                # Rotas, providers (toast, query, tooltip)
    ├── App.css / index.css    # Estilos globais
    ├── vite-env.d.ts          # Tipos do Vite
    │
    ├── pages/                 # Telas (rotas)
    │   ├── Index.tsx          # Tela principal: abas Principal + Gestor
    │   └── NotFound.tsx       # 404
    │
    ├── types/                 # Contratos de dados (TypeScript)
    │   ├── restaurant.ts      # Produto, Mesa, Comanda, Venda, Despesa…
    │   └── printing.ts        # Config impressora, layout cozinha
    │
    ├── hooks/                 # Lógica reutilizável (estado + efeitos)
    │   ├── useRestaurantData.ts  # Coração dos dados (localStorage)
    │   ├── useLocalStorage.ts    # Persistência genérica no browser
    │   ├── use-toast.ts          # Toasts (notificações)
    │   └── use-mobile.tsx        # Detecta tela mobile
    │
    ├── utils/                 # Funções utilitárias (não são UI)
    │   ├── impressao.ts       # Gerenciador de impressão + save/load config
    │   └── printing/
    │       ├── formatters/
    │       │   └── html.ts    # Monta HTML/CSS do ticket (fallback browser)
    │       └── printers/
    │           └── nativePrinter.ts  # window.print via iframe/janela
    │
    ├── lib/
    │   └── utils.ts           # Helper cn() (merge de classes Tailwind)
    │
    └── components/            # Componentes de interface
        ├── Header.tsx         # Topo: logo e título do sistema
        │
        ├── principal/         # ── ABA “PRINCIPAL” (operação do salão) ──
        │   ├── SelecionarMesa.tsx      # Grade de mesas para escolher
        │   ├── AbrirMesa.tsx           # Abre comanda em mesa livre
        │   ├── MesasAbertas.tsx        # Lista comandas abertas
        │   ├── FiltroGarcom.tsx        # Nome do garçom + filtro “meus”
        │   ├── GerenciarComanda.tsx    # Tela da mesa aberta (núcleo do salão)
        │   ├── MesaHeader.tsx          # Cabeçalho da comanda (mesa, total…)
        │   ├── AdicionarProduto.tsx    # Catálogo para lançar itens
        │   ├── CarrinhoTemporario.tsx  # Carrinho antes de confirmar pedido
        │   ├── ListaItensComanda.tsx   # Itens já lançados na mesa
        │   ├── ModalObservacoes.tsx    # Observações no produto (ex: sem cebola)
        │   ├── DividirConta.tsx        # Divisão da conta (pessoas)
        │   ├── GerarConta.tsx          # Gorjeta, divisão e impressão da conta
        │   ├── GerenciadorImpressora.tsx # UI: escanear/salvar impressora
        │   └── ImpressaoCozinha.tsx    # Ticket customizado da cozinha
        │
        ├── gestor/            # ── ABA “GESTOR” (admin / backoffice) ──
        │   ├── CadastroProduto.tsx     # Cadastrar produto no cardápio
        │   ├── CadastroMesas.tsx       # Visual/gestão de mesas
        │   ├── GerenciarCategorias.tsx # Categorias do cardápio
        │   ├── ListaProdutos.tsx       # Lista/edita produtos
        │   ├── VendasDia.tsx           # Vendas do dia
        │   ├── DespesasDia.tsx         # Despesas (ex: cancelamento)
        │   ├── RelatoriosAvancados.tsx # Relatórios / gráficos
        │   ├── components/
        │   │   ├── ProductForm.tsx     # Formulário de produto
        │   │   └── CommentsManager.tsx # Comentários rápidos do produto
        │   └── types/
        │       └── ProductFormTypes.ts # Tipos do form de produto
        │
        └── ui/                # ── shadcn/ui (componentes genéricos) ──
            │                  # Button, Dialog, Tabs, Input, Card, etc.
            │                  # NÃO contêm regra de negócio do restaurante.
            └── ...
```

---

## Fluxo de inicialização (ordem em que o código roda)

```
1. index.html
      └─ carrega o bundle do Vite

2. src/main.tsx
      └─ createRoot(#root).render(<App />)
      └─ importa index.css (Tailwind)

3. src/App.tsx
      ├─ QueryClientProvider (React Query)
      ├─ TooltipProvider
      ├─ Toaster / Sonner (notificações)
      └─ BrowserRouter
            ├─ rota "/"  → pages/Index.tsx
            └─ rota "*"  → pages/NotFound.tsx

4. pages/Index.tsx
      ├─ useRestaurantData()  → carrega produtos, mesas, comandas… do localStorage
      ├─ <Header />
      └─ Tabs
            ├─ "Principal" → fluxo de mesas/comandas
            └─ "Gestor"    → cadastros e relatórios
```

---

## Fluxo do salão (aba Principal)

```
[FiltroGarcom] ── garçom atual + filtro “só meus pedidos”
       │
       ▼
[SelecionarMesa] ── clique numa mesa
       │
       ├─ mesa LIVRE ──► [AbrirMesa] ── cria Comanda ──► abrirMesa()
       │                                                      │
       └─ mesa OCUPADA ──────────────────────────────────────┤
                                                              ▼
                                                    [GerenciarComanda]
                                                              │
              ┌───────────────────────────────────────────────┼──────────────────┐
              ▼                                               ▼                  ▼
     [AdicionarProduto]                            [ListaItensComanda]    [GerarConta]
              │                                               │                  │
              ▼                                               │                  ▼
     [CarrinhoTemporario]                                     │         fecharComanda()
              │                                               │         + impressão conta
              ├─ Imprimir / Enviar pedido                     │
              ├─ [GerenciadorImpressora]                      │
              └─ [ImpressaoCozinha]                           │
                                                              │
                                              [DividirConta] / cancelar mesa
```

### Estados de navegação em `Index.tsx` (`modo`)

| `modo`           | Tela exibida        | Significado                          |
|------------------|---------------------|--------------------------------------|
| `selecionar`     | SelecionarMesa      | Escolher mesa                        |
| `abrir`          | AbrirMesa           | Mesa livre → abrir comanda           |
| `gerenciar`      | GerenciarComanda    | Mesa com comanda ativa               |
| `mesas-abertas`  | MesasAbertas        | Lista rápida de comandas abertas     |

---

## Fluxo de impressão

```
UI (GerenciadorImpressora)
   │  salva ConfiguracaoImpressao no localStorage
   │  chave: "configuracao-impressao"
   ▼
Carrinho / Cozinha / Conta
   │  carregarConfiguracaoImpressao()
   ▼
GerenciadorImpressao.imprimir(conteudo, titulo, config)
   │
   ├─ 1) POST http://localhost:3001/imprimir
   │        body: { conteudo, impressora }
   │        └─ server/impressora.js → comando: lp -d NOME_IMPRESSORA
   │
   └─ 2) Se servidor offline → NativePrinterManager
            (iframe / janela + window.print do navegador)
```

Endpoints do servidor (`server/impressora.js`):

| Método | Rota            | Função                                      |
|--------|-----------------|---------------------------------------------|
| GET    | `/status`       | Health check                                |
| GET    | `/impressoras`  | Escaneia impressoras CUPS (`lpstat -p -d`)  |
| POST   | `/imprimir`     | Envia texto para `lp` (impressora escolhida)|

---

## Dados no localStorage

Tudo que o restaurante “lembra” fica no navegador:

| Chave                    | Conteúdo                                      |
|--------------------------|-----------------------------------------------|
| `produtos`               | Cardápio                                      |
| `categorias`             | Categorias do cardápio                        |
| `mesas`                  | Status das mesas (1–100 por padrão)           |
| `comandas`               | Comandas abertas/fechadas                     |
| `vendas`                 | Histórico de vendas do dia                    |
| `despesas`               | Despesas (ex: cancelamento de mesa)           |
| `configuracao-impressao` | Impressora + papel (GerenciadorImpressora)    |
| `config-impressao-cozinha` | Layout do ticket de cozinha                 |

Hook que gerencia a maior parte: `src/hooks/useRestaurantData.ts`.  
Helper genérico: `src/hooks/useLocalStorage.ts`.

---

## Tipos principais (`src/types/`)

### Restaurante (`restaurant.ts`)

| Tipo          | Uso |
|---------------|-----|
| `Produto`     | Item do cardápio (nome, valor, CMV, categoria, comentários) |
| `ItemComanda` | Linha na comanda (produto, qtd, valor, garçom que lançou) |
| `Comanda`     | Conta da mesa (itens, total, status, pessoas, garçom) |
| `Mesa`        | Número + status `disponivel` \| `ocupada` + `comanda_id` |
| `VendaDia`    | Registro ao fechar conta (totais, gorjeta, divisão) |
| `Despesa`     | Perda/custo (ex: cancelamento) |
| `Categoria`   | Nome + cor no cardápio |
| `DivisaoConta`| Como a conta foi dividida no fechamento |

### Impressão (`printing.ts`)

| Tipo / constante           | Uso |
|----------------------------|-----|
| `ConfiguracaoImpressao`    | Impressora salva + largura/fonte/margens |
| `ImpressoraDisponivel`     | Item da lista do scanner CUPS |
| `ConfigImpressaoCozinha`   | Layout do ticket de cozinha |
| `CONFIG_IMPRESSAO_PADRAO`  | Valores iniciais se nunca salvou |
| `CHAVE_CONFIG_IMPRESSAO`   | Chave no localStorage |

---

## Mapa rápido de cada arquivo de negócio

### Entrada e shell

| Arquivo | O que faz |
|---------|-----------|
| `main.tsx` | Ponto de entrada React |
| `App.tsx` | Providers + rotas |
| `pages/Index.tsx` | Orquestra abas Principal/Gestor e modos do salão |
| `Header.tsx` | Barra superior visual |

### Hooks

| Arquivo | O que faz |
|---------|-----------|
| `useRestaurantData.ts` | CRUD de produtos, mesas, comandas, vendas, despesas |
| `useLocalStorage.ts` | Lê/grava JSON no localStorage com estado React |
| `use-toast.ts` | API de notificações toast |
| `use-mobile.tsx` | Breakpoint mobile |

### Principal (salão)

| Arquivo | O que faz |
|---------|-----------|
| `SelecionarMesa.tsx` | UI da grade de mesas |
| `AbrirMesa.tsx` | Cria nova comanda (nº pessoas etc.) |
| `MesasAbertas.tsx` | Lista/filtra comandas abertas; fecha mesa vazia |
| `FiltroGarcom.tsx` | Input do nome do garçom e toggle “meus pedidos” |
| `GerenciarComanda.tsx` | Hub da mesa: adicionar itens, fechar, excluir, dividir |
| `MesaHeader.tsx` | Resumo da mesa no topo da comanda |
| `AdicionarProduto.tsx` | Busca/filtra produtos e adiciona ao carrinho |
| `CarrinhoTemporario.tsx` | Confirma/imprime/envia pedido |
| `ListaItensComanda.tsx` | Mostra e edita quantidades dos itens da comanda |
| `ModalObservacoes.tsx` | Observação no item (vai no nome entre parênteses) |
| `DividirConta.tsx` | Split da conta entre pessoas |
| `GerarConta.tsx` | Gorjeta, divisão e impressão do cupom da conta |
| `GerenciadorImpressora.tsx` | Escaneia, escolhe e salva impressora |
| `ImpressaoCozinha.tsx` | Preview e layout do pedido da cozinha |

### Gestor (admin)

| Arquivo | O que faz |
|---------|-----------|
| `CadastroProduto.tsx` | Cadastra produto novo |
| `ProductForm.tsx` | Campos do formulário de produto |
| `CommentsManager.tsx` | Comentários rápidos (ex: “sem gelo”) |
| `CadastroMesas.tsx` | Visão das mesas no gestor |
| `GerenciarCategorias.tsx` | CRUD de categorias |
| `ListaProdutos.tsx` | Lista cardápio cadastrado |
| `VendasDia.tsx` | Soma/lista vendas |
| `DespesasDia.tsx` | Soma/lista despesas |
| `RelatoriosAvancados.tsx` | Gráficos e análises |

### Impressão

| Arquivo | O que faz |
|---------|-----------|
| `utils/impressao.ts` | Load/save config + classe `GerenciadorImpressao` |
| `printing/formatters/html.ts` | HTML do ticket para fallback browser |
| `printing/printers/nativePrinter.ts` | Dispara `print()` do navegador |
| `server/impressora.js` | API Node + CUPS (`lp` / `lpstat`) |

### UI genérica

Pasta `components/ui/` = componentes **shadcn/ui** (Button, Dialog, Select…).  
São blocos visuais reutilizáveis; a regra de negócio está nas pastas `principal/`, `gestor/`, `hooks/` e `utils/`.

---

## Alias de importação

No código, `@/` aponta para `src/`:

```ts
import { useRestaurantData } from '@/hooks/useRestaurantData';
// = src/hooks/useRestaurantData.ts
```

Definido em `vite.config.ts` → `resolve.alias["@"]`.

---

## Conceitos de domínio

- **Mesa**: lugar físico (1…N). Status livre ou ocupada.
- **Comanda**: conta aberta ligada a uma mesa (`comanda_id` na mesa).
- **Item da comanda**: produto lançado (pode ter observação no nome).
- **Carrinho temporário**: itens ainda não confirmados na comanda.
- **Venda**: gerada ao **fechar** a conta (com gorjeta/divisão).
- **Despesa**: gerada ao **cancelar/excluir** mesa com itens (usa CMV).
- **CMV**: custo da mercadoria vendida (custo do produto).
- **Impressora salva**: nome CUPS escolhido na UI; usada em todas as impressões.

---

## Onde comentar no código

Cada arquivo de **negócio** começa com um bloco `/** ... */` explicando:

1. Qual o papel do arquivo  
2. Quem o chama  
3. O que ele expõe (componentes, funções, tipos)  
4. Detalhes importantes de fluxo  

Dentro do arquivo, seções marcadas com `// ── ... ──` separam responsabilidades (estado, handlers, render).

A pasta `components/ui/` não é re-comentada linha a linha (é biblioteca de UI de terceiros gerada pelo shadcn).

---

## Resumo em uma frase

**Index** decide a tela → **useRestaurantData** guarda o restaurante no browser → componentes **principal/** operam o salão → componentes **gestor/** administram o cardápio e o caixa → **impressao.ts + server/impressora.js** mandam o ticket para a impressora escolhida na interface.
# Simplesx.0
# Simplesx.0
