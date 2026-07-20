/**
 * ============================================================
 * index.js — Servidor API + impressão
 * ============================================================
 * Porta 3001. SQLite para produtos/comandas/vendas/despesas.
 * Mantém rotas de impressão CUPS.
 * ============================================================
 */

import express from "express";
import cors from "cors";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { repo } from "./db.js";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Helpers ─────────────────────────────────────────────────

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function err(res, status, message) {
  return res.status(status).json({ sucesso: false, erro: message });
}

// ═══════════════════════════════════════════════════════════
// API — Estado completo (bootstrap do frontend)
// ═══════════════════════════════════════════════════════════

app.get("/api/estado", (_req, res) => {
  try {
    res.json({
      sucesso: true,
      produtos: repo.listarProdutos(),
      categorias: repo.listarCategorias(),
      mesas: repo.listarMesas(),
      comandas: repo.listarComandas(),
      vendas: repo.listarVendas(),
      despesas: repo.listarDespesas(),
    });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// API — Produtos (gestor cadastra → banco)
// ═══════════════════════════════════════════════════════════

app.get("/api/produtos", (_req, res) => {
  try {
    res.json({ sucesso: true, produtos: repo.listarProdutos() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.post("/api/produtos", (req, res) => {
  try {
    const { nome, valor, cmv, categoria, comentarios, imagem } = req.body || {};

    if (!nome || valor == null || cmv == null) {
      return err(res, 400, "Nome, valor e CMV são obrigatórios");
    }

    const comentariosLimpos = Array.isArray(comentarios)
      ? comentarios.filter((c) => c && String(c).trim() !== "").map((c) => String(c).trim())
      : [];

    const produto = repo.criarProduto({
      id: req.body.id || id(),
      nome: String(nome).trim(),
      valor: Number(valor),
      cmv: Number(cmv),
      categoria: categoria || "Sem categoria",
      imagem: imagem || "",
      comentarios: comentariosLimpos,
    });

    res.status(201).json({ sucesso: true, produto });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

app.put("/api/produtos/:id", (req, res) => {
  try {
    const produto = repo.atualizarProduto(req.params.id, req.body || {});
    if (!produto) return err(res, 404, "Produto não encontrado");
    res.json({ sucesso: true, produto });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.delete("/api/produtos/:id", (req, res) => {
  try {
    const ok = repo.removerProduto(req.params.id);
    if (!ok) return err(res, 404, "Produto não encontrado");
    res.json({ sucesso: true });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// API — Categorias
// ═══════════════════════════════════════════════════════════

app.get("/api/categorias", (_req, res) => {
  try {
    res.json({ sucesso: true, categorias: repo.listarCategorias() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.post("/api/categorias", (req, res) => {
  try {
    const { nome, cor } = req.body || {};
    if (!nome) return err(res, 400, "Nome da categoria é obrigatório");

    const categoria = repo.criarCategoria({
      id: req.body.id || id(),
      nome: String(nome).trim(),
      cor: cor || "#6366f1",
    });
    res.status(201).json({ sucesso: true, categoria });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return err(res, 400, "Já existe uma categoria com esse nome");
    }
    err(res, 500, e.message);
  }
});

app.delete("/api/categorias/:id", (req, res) => {
  try {
    const ok = repo.removerCategoria(req.params.id);
    if (!ok) return err(res, 404, "Categoria não encontrada");
    res.json({ sucesso: true });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// API — Mesas
// ═══════════════════════════════════════════════════════════

app.get("/api/mesas", (_req, res) => {
  try {
    res.json({ sucesso: true, mesas: repo.listarMesas() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// API — Comandas / pedidos
// ═══════════════════════════════════════════════════════════

app.get("/api/comandas", (_req, res) => {
  try {
    res.json({ sucesso: true, comandas: repo.listarComandas() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.get("/api/comandas/:id", (req, res) => {
  try {
    const comanda = repo.obterComanda(req.params.id);
    if (!comanda) return err(res, 404, "Comanda não encontrada");
    res.json({ sucesso: true, comanda });
  } catch (e) {
    err(res, 500, e.message);
  }
});

/** Abre mesa + cria comanda no banco */
app.post("/api/comandas", (req, res) => {
  try {
    const body = req.body || {};
    if (!body.mesa) return err(res, 400, "Número da mesa é obrigatório");

    const comanda = repo.abrirMesa({
      id: body.id || id(),
      mesa: Number(body.mesa),
      itens: body.itens || [],
      valor_total: body.valor_total || 0,
      status: "aberta",
      pessoas: body.pessoas || 1,
      split_ativo: !!body.split_ativo,
      por_pessoa: body.por_pessoa || [],
      garcom: body.garcom || null,
    });

    res.status(201).json({
      sucesso: true,
      comanda,
      mesas: repo.listarMesas(),
      comandas: repo.listarComandas(),
    });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

/** Atualiza comanda (lançar pedidos / itens) */
app.put("/api/comandas/:id", (req, res) => {
  try {
    const comanda = repo.atualizarComanda({ ...req.body, id: req.params.id });
    if (!comanda) return err(res, 404, "Comanda não encontrada");
    res.json({ sucesso: true, comanda });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

/**
 * Fecha comanda: grava venda (bruto, líquido, CMV, gorjeta %) e libera mesa.
 * Body: { venda, mesa }
 */
app.post("/api/comandas/:id/fechar", (req, res) => {
  try {
    const { venda, mesa } = req.body || {};
    if (!venda) return err(res, 400, "Dados da venda são obrigatórios");

    const comanda = repo.obterComanda(req.params.id);
    if (!comanda) return err(res, 404, "Comanda não encontrada");
    if (comanda.status === "fechada") return err(res, 400, "Comanda já está fechada");

    const mesaNumero = mesa ?? comanda.mesa;
    const vendaSalva = repo.fecharComanda(
      {
        ...venda,
        id: venda.id || id(),
        data: venda.data || new Date().toISOString(),
      },
      req.params.id,
      mesaNumero
    );

    res.json({
      sucesso: true,
      venda: vendaSalva,
      mesas: repo.listarMesas(),
      comandas: repo.listarComandas(),
      vendas: repo.listarVendas(),
    });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

/**
 * Cancela mesa com itens: despesa de CMV + remove comanda.
 * Body: { mesa, despesa? } — se despesa omitida, calcula CMV no servidor.
 */
app.post("/api/comandas/:id/excluir", (req, res) => {
  try {
    const comanda = repo.obterComanda(req.params.id);
    if (!comanda) return err(res, 404, "Comanda não encontrada");

    const mesaNumero = req.body?.mesa ?? comanda.mesa;
    let despesa = req.body?.despesa;

    if (!despesa && comanda.itens.length > 0) {
      const produtos = repo.listarProdutos();
      const valorCMV = comanda.itens.reduce((total, item) => {
        const produto = produtos.find(
          (p) => p.nome === item.produto_nome || item.produto_nome.startsWith(p.nome)
        );
        return total + (produto?.cmv || 0) * item.quantidade;
      }, 0);

      despesa = {
        id: id(),
        descricao: `Cancelamento Mesa ${mesaNumero}`,
        valor: valorCMV,
        tipo: "cancelamento_mesa",
        itens: comanda.itens,
        mesa: mesaNumero,
        data: new Date().toISOString(),
      };
    }

    repo.excluirMesa(req.params.id, mesaNumero, despesa);

    res.json({
      sucesso: true,
      despesa: despesa || null,
      mesas: repo.listarMesas(),
      comandas: repo.listarComandas(),
      despesas: repo.listarDespesas(),
    });
  } catch (e) {
    console.error(e);
    err(res, 500, e.message);
  }
});

/** Fecha mesa vazia sem venda */
app.post("/api/comandas/:id/fechar-vazia", (req, res) => {
  try {
    const comanda = repo.obterComanda(req.params.id);
    if (!comanda) return err(res, 404, "Comanda não encontrada");

    const mesaNumero = req.body?.mesa ?? comanda.mesa;
    repo.fecharMesaVazia(req.params.id, mesaNumero);

    res.json({
      sucesso: true,
      mesas: repo.listarMesas(),
      comandas: repo.listarComandas(),
    });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// API — Vendas e despesas (gestor / relatórios)
// ═══════════════════════════════════════════════════════════

app.get("/api/vendas", (_req, res) => {
  try {
    res.json({ sucesso: true, vendas: repo.listarVendas() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.get("/api/despesas", (_req, res) => {
  try {
    res.json({ sucesso: true, despesas: repo.listarDespesas() });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════
// Impressão CUPS (legado)
// ═══════════════════════════════════════════════════════════

async function listarImpressorasSistema() {
  let stdout = "";
  try {
    const result = await execFileAsync("lpstat", ["-p", "-d"], {
      timeout: 10000,
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
    });
    stdout = result.stdout || "";
  } catch (erro) {
    stdout = erro.stdout || "";
    if (!stdout && erro.stderr) {
      throw new Error(erro.stderr.toString().trim() || "Falha ao listar impressoras");
    }
  }

  const impressoras = [];
  for (const linha of stdout.split("\n")) {
    const matchEn = linha.match(/^printer\s+(\S+)\s+(.+)$/i);
    const matchPt = linha.match(/^impressora\s+(\S+)\s+(.+)$/i);
    const match = matchEn || matchPt;
    if (match) {
      const nome = match[1];
      const resto = match[2].toLowerCase();
      const status =
        resto.includes("idle") || resto.includes("inativa") || resto.includes("pronta")
          ? "pronta"
          : resto.includes("disabled") || resto.includes("desabilitada")
            ? "desabilitada"
            : resto.includes("printing") || resto.includes("imprimindo")
              ? "imprimindo"
              : "disponivel";
      impressoras.push({ nome, status, descricao: match[2].trim() });
    }
  }

  let padrao = null;
  const matchPadraoEn = stdout.match(/system default destination:\s*(\S+)/i);
  const matchPadraoPt = stdout.match(/destino padr[aã]o do sistema:\s*(\S+)/i);
  if (matchPadraoEn) padrao = matchPadraoEn[1];
  if (matchPadraoPt) padrao = matchPadraoPt[1];

  return { impressoras, padrao };
}

function imprimirComLp(conteudo, impressora) {
  return new Promise((resolve, reject) => {
    const args = impressora ? ["-d", impressora] : [];
    const processo = spawn("lp", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    processo.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    processo.on("error", reject);
    processo.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `lp finalizou com código ${code}`));
    });
    processo.stdin.write(conteudo, "utf8");
    processo.stdin.end();
  });
}

app.get("/impressoras", async (_req, res) => {
  try {
    const { impressoras, padrao } = await listarImpressorasSistema();
    res.json({ sucesso: true, impressoras, padrao });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      impressoras: [],
      padrao: null,
      erro: erro.message || "Não foi possível escanear impressoras",
    });
  }
});

app.get("/status", (_req, res) => {
  res.json({ ok: true, servico: "api+impressao", porta: PORT, banco: "sqlite" });
});

app.post("/imprimir", async (req, res) => {
  const { conteudo, impressora } = req.body || {};
  if (!conteudo || typeof conteudo !== "string") {
    return res.status(400).json({ sucesso: false, erro: "Conteúdo da impressão é obrigatório" });
  }
  try {
    if (impressora) {
      const { impressoras } = await listarImpressorasSistema();
      if (!impressoras.some((p) => p.nome === impressora)) {
        return res.status(400).json({
          sucesso: false,
          erro: `Impressora "${impressora}" não encontrada. Escaneie novamente.`,
        });
      }
    }
    await imprimirComLp(conteudo, impressora || undefined);
    res.json({ sucesso: true, impressora: impressora || "padrao" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message || "Falha ao imprimir" });
  }
});

// ── Bootstrap ───────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor API + impressão em http://0.0.0.0:${PORT}`);
  console.log("  GET  /api/estado          — carrega tudo do SQLite");
  console.log("  POST /api/produtos        — cria produto (linha em produtos)");
  console.log("  PUT  /api/produtos/:id    — atualiza produto + observações");
  console.log("  DELETE /api/produtos/:id  — remove produto do banco");
  console.log("  POST /api/comandas        — abrir mesa / lançar pedidos");
  console.log("  POST /api/comandas/:id/fechar — venda bruto/líquido/gorjeta");
  console.log("  GET  /impressoras | POST /imprimir");
  console.log(`  Banco: SQLite (${repo.listarProdutos().length} produtos)`);
});
