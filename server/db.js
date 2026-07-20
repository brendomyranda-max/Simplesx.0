/**
 * ============================================================
 * db.js — SQLite (better-sqlite3)
 * ============================================================
 * Persistência do POS: produtos, categorias, mesas, comandas,
 * vendas e despesas.
 *
 * Produtos NÃO vêm de array em memória/seed: cada produto é uma
 * linha em `produtos` e cada observação automática é uma linha em
 * `produto_comentarios` (manipuláveis pelo gestor via API).
 * ============================================================
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "restaurante.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ──────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    valor REAL NOT NULL,
    cmv REAL NOT NULL,
    imagem TEXT DEFAULT '',
    categoria TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS produto_comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id TEXT NOT NULL,
    texto TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    cor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mesas (
    numero INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'disponivel',
    comanda_id TEXT
  );

  CREATE TABLE IF NOT EXISTS comandas (
    id TEXT PRIMARY KEY,
    mesa INTEGER NOT NULL,
    valor_total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'aberta',
    pessoas INTEGER NOT NULL DEFAULT 1,
    split_ativo INTEGER NOT NULL DEFAULT 0,
    por_pessoa TEXT DEFAULT '[]',
    garcom TEXT
  );

  CREATE TABLE IF NOT EXISTS itens_comanda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comanda_id TEXT NOT NULL,
    produto_nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_unitario REAL NOT NULL,
    garcom TEXT,
    FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vendas (
    id TEXT PRIMARY KEY,
    total_bruto REAL NOT NULL,
    total_liquido REAL NOT NULL,
    total_custo REAL NOT NULL,
    valor_gorjeta REAL DEFAULT 0,
    porcentagem_gorjeta REAL DEFAULT 0,
    divisao_conta TEXT,
    data TEXT NOT NULL,
    garcom_fechamento TEXT
  );

  CREATE TABLE IF NOT EXISTS itens_venda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venda_id TEXT NOT NULL,
    produto_nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_unitario REAL NOT NULL,
    garcom TEXT,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    tipo TEXT NOT NULL,
    itens TEXT,
    mesa INTEGER,
    data TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_produto_comentarios_produto
    ON produto_comentarios(produto_id, ordem);
`);

// ── Migração: tira JSON de comentários da tabela produtos ───

function migrarProdutosSemArrayJson() {
  const colunas = db.prepare("PRAGMA table_info(produtos)").all().map((c) => c.name);

  // Banco antigo tinha coluna `comentarios` com JSON string '[]'
  if (colunas.includes("comentarios")) {
    console.log("[db] Migrando produtos: comentários saem de JSON e viram tabela própria");

    db.exec(`
      CREATE TABLE IF NOT EXISTS produtos_v2 (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        valor REAL NOT NULL,
        cmv REAL NOT NULL,
        imagem TEXT DEFAULT '',
        categoria TEXT NOT NULL
      );
    `);

    // Usuário pediu para apagar todos os produtos e cadastrar pela app
    db.exec("DELETE FROM produto_comentarios");
    db.exec("DELETE FROM produtos");
    db.exec("DELETE FROM produtos_v2");

    db.exec("DROP TABLE produtos");
    db.exec("ALTER TABLE produtos_v2 RENAME TO produtos");

    console.log("[db] Produtos limpos. Cadastre um a um pelo gestor — ficam no SQLite.");
  }
}

migrarProdutosSemArrayJson();

// ── Seed mínimo (somente mesas; produtos NÃO são seedados) ──

function seedMesasSeVazio() {
  const countMesas = db.prepare("SELECT COUNT(*) AS c FROM mesas").get().c;

  if (countMesas === 0) {
    const insertMesa = db.prepare(
      "INSERT INTO mesas (numero, status, comanda_id) VALUES (?, 'disponivel', NULL)"
    );
    const tx = db.transaction(() => {
      for (let i = 1; i <= 100; i++) insertMesa.run(i);
    });
    tx();
    console.log("[db] Seed: 100 mesas criadas");
  }
}

seedMesasSeVazio();

// ── Helpers de mapeamento ───────────────────────────────────

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getComentariosProduto(produtoId) {
  return db
    .prepare(
      "SELECT texto FROM produto_comentarios WHERE produto_id = ? ORDER BY ordem ASC, id ASC"
    )
    .all(produtoId)
    .map((r) => r.texto);
}

function salvarComentariosProduto(produtoId, comentarios) {
  db.prepare("DELETE FROM produto_comentarios WHERE produto_id = ?").run(produtoId);

  const lista = Array.isArray(comentarios)
    ? comentarios.map((c) => String(c).trim()).filter((c) => c !== "")
    : [];

  if (lista.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO produto_comentarios (produto_id, texto, ordem)
    VALUES (?, ?, ?)
  `);

  lista.forEach((texto, ordem) => {
    insert.run(produtoId, texto, ordem);
  });
}

function mapProduto(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    valor: row.valor,
    cmv: row.cmv,
    imagem: row.imagem || "",
    categoria: row.categoria,
    comentarios: getComentariosProduto(row.id),
  };
}

function mapCategoria(row) {
  if (!row) return null;
  return { id: row.id, nome: row.nome, cor: row.cor };
}

function mapMesa(row) {
  if (!row) return null;
  return {
    numero: row.numero,
    status: row.status,
    comanda_id: row.comanda_id || undefined,
  };
}

function mapItem(row) {
  return {
    produto_nome: row.produto_nome,
    quantidade: row.quantidade,
    valor_unitario: row.valor_unitario,
    garcom: row.garcom || undefined,
  };
}

function getItensComanda(comandaId) {
  return db
    .prepare(
      "SELECT produto_nome, quantidade, valor_unitario, garcom FROM itens_comanda WHERE comanda_id = ? ORDER BY id"
    )
    .all(comandaId)
    .map(mapItem);
}

function mapComanda(row) {
  if (!row) return null;
  return {
    id: row.id,
    mesa: row.mesa,
    itens: getItensComanda(row.id),
    valor_total: row.valor_total,
    status: row.status,
    pessoas: row.pessoas,
    split_ativo: !!row.split_ativo,
    por_pessoa: parseJson(row.por_pessoa, []),
    garcom: row.garcom || undefined,
  };
}

function mapVenda(row) {
  if (!row) return null;
  const itens = db
    .prepare(
      "SELECT produto_nome, quantidade, valor_unitario, garcom FROM itens_venda WHERE venda_id = ? ORDER BY id"
    )
    .all(row.id)
    .map(mapItem);

  return {
    id: row.id,
    itens,
    total_bruto: row.total_bruto,
    total_liquido: row.total_liquido,
    total_custo: row.total_custo,
    valor_gorjeta: row.valor_gorjeta || 0,
    porcentagem_gorjeta: row.porcentagem_gorjeta || 0,
    divisao_conta: parseJson(row.divisao_conta, undefined),
    data: new Date(row.data),
    garcom_fechamento: row.garcom_fechamento || undefined,
  };
}

function mapDespesa(row) {
  if (!row) return null;
  return {
    id: row.id,
    descricao: row.descricao,
    valor: row.valor,
    tipo: row.tipo,
    itens: parseJson(row.itens, undefined),
    mesa: row.mesa ?? undefined,
    data: new Date(row.data),
  };
}

// ── Repositórios ────────────────────────────────────────────

export const repo = {
  // Produtos — cada um é linha real no SQLite (não array)
  listarProdutos() {
    return db
      .prepare("SELECT * FROM produtos ORDER BY categoria, nome")
      .all()
      .map(mapProduto);
  },

  obterProduto(id) {
    return mapProduto(db.prepare("SELECT * FROM produtos WHERE id = ?").get(id));
  },

  criarProduto(produto) {
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO produtos (id, nome, valor, cmv, imagem, categoria)
        VALUES (@id, @nome, @valor, @cmv, @imagem, @categoria)
      `).run({
        id: produto.id,
        nome: produto.nome,
        valor: produto.valor,
        cmv: produto.cmv,
        imagem: produto.imagem || "",
        categoria: produto.categoria || "Sem categoria",
      });

      salvarComentariosProduto(produto.id, produto.comentarios || []);
    });
    tx();
    return this.obterProduto(produto.id);
  },

  atualizarProduto(id, dados) {
    const atual = this.obterProduto(id);
    if (!atual) return null;

    const next = { ...atual, ...dados, id };

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE produtos SET
          nome = @nome,
          valor = @valor,
          cmv = @cmv,
          imagem = @imagem,
          categoria = @categoria
        WHERE id = @id
      `).run({
        id,
        nome: next.nome,
        valor: next.valor,
        cmv: next.cmv,
        imagem: next.imagem || "",
        categoria: next.categoria || "Sem categoria",
      });

      if (Object.prototype.hasOwnProperty.call(dados, "comentarios")) {
        salvarComentariosProduto(id, dados.comentarios || []);
      }
    });
    tx();
    return this.obterProduto(id);
  },

  removerProduto(id) {
    // CASCADE remove linhas de produto_comentarios
    const info = db.prepare("DELETE FROM produtos WHERE id = ?").run(id);
    return info.changes > 0;
  },

  /** Apaga todo o cardápio (produtos + observações). Mesas/vendas intactas. */
  limparProdutos() {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM produto_comentarios").run();
      db.prepare("DELETE FROM produtos").run();
    });
    tx();
    return true;
  },

  // Categorias
  listarCategorias() {
    return db.prepare("SELECT * FROM categorias ORDER BY nome").all().map(mapCategoria);
  },

  criarCategoria(categoria) {
    db.prepare("INSERT INTO categorias (id, nome, cor) VALUES (@id, @nome, @cor)").run(categoria);
    return mapCategoria(db.prepare("SELECT * FROM categorias WHERE id = ?").get(categoria.id));
  },

  removerCategoria(id) {
    const info = db.prepare("DELETE FROM categorias WHERE id = ?").run(id);
    return info.changes > 0;
  },

  // Mesas
  listarMesas() {
    return db.prepare("SELECT * FROM mesas ORDER BY numero").all().map(mapMesa);
  },

  // Comandas
  listarComandas() {
    return db.prepare("SELECT * FROM comandas ORDER BY mesa").all().map(mapComanda);
  },

  obterComanda(id) {
    return mapComanda(db.prepare("SELECT * FROM comandas WHERE id = ?").get(id));
  },

  abrirMesa(comanda) {
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO comandas (id, mesa, valor_total, status, pessoas, split_ativo, por_pessoa, garcom)
        VALUES (@id, @mesa, @valor_total, @status, @pessoas, @split_ativo, @por_pessoa, @garcom)
      `).run({
        id: comanda.id,
        mesa: comanda.mesa,
        valor_total: comanda.valor_total || 0,
        status: comanda.status || "aberta",
        pessoas: comanda.pessoas || 1,
        split_ativo: comanda.split_ativo ? 1 : 0,
        por_pessoa: JSON.stringify(comanda.por_pessoa || []),
        garcom: comanda.garcom || null,
      });

      if (Array.isArray(comanda.itens) && comanda.itens.length > 0) {
        const insertItem = db.prepare(`
          INSERT INTO itens_comanda (comanda_id, produto_nome, quantidade, valor_unitario, garcom)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const item of comanda.itens) {
          insertItem.run(
            comanda.id,
            item.produto_nome,
            item.quantidade,
            item.valor_unitario,
            item.garcom || null
          );
        }
      }

      db.prepare(
        "UPDATE mesas SET status = 'ocupada', comanda_id = ? WHERE numero = ?"
      ).run(comanda.id, comanda.mesa);
    });
    tx();
    return this.obterComanda(comanda.id);
  },

  atualizarComanda(comanda) {
    const existente = this.obterComanda(comanda.id);
    if (!existente) return null;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE comandas SET
          mesa = @mesa,
          valor_total = @valor_total,
          status = @status,
          pessoas = @pessoas,
          split_ativo = @split_ativo,
          por_pessoa = @por_pessoa,
          garcom = @garcom
        WHERE id = @id
      `).run({
        id: comanda.id,
        mesa: comanda.mesa,
        valor_total: comanda.valor_total || 0,
        status: comanda.status,
        pessoas: comanda.pessoas || 1,
        split_ativo: comanda.split_ativo ? 1 : 0,
        por_pessoa: JSON.stringify(comanda.por_pessoa || []),
        garcom: comanda.garcom || null,
      });

      db.prepare("DELETE FROM itens_comanda WHERE comanda_id = ?").run(comanda.id);

      const insertItem = db.prepare(`
        INSERT INTO itens_comanda (comanda_id, produto_nome, quantidade, valor_unitario, garcom)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of comanda.itens || []) {
        insertItem.run(
          comanda.id,
          item.produto_nome,
          item.quantidade,
          item.valor_unitario,
          item.garcom || null
        );
      }
    });
    tx();
    return this.obterComanda(comanda.id);
  },

  fecharComanda(venda, comandaId, mesaNumero) {
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO vendas (
          id, total_bruto, total_liquido, total_custo, valor_gorjeta,
          porcentagem_gorjeta, divisao_conta, data, garcom_fechamento
        ) VALUES (
          @id, @total_bruto, @total_liquido, @total_custo, @valor_gorjeta,
          @porcentagem_gorjeta, @divisao_conta, @data, @garcom_fechamento
        )
      `).run({
        id: venda.id,
        total_bruto: venda.total_bruto,
        total_liquido: venda.total_liquido,
        total_custo: venda.total_custo,
        valor_gorjeta: venda.valor_gorjeta || 0,
        porcentagem_gorjeta: venda.porcentagem_gorjeta || 0,
        divisao_conta: venda.divisao_conta ? JSON.stringify(venda.divisao_conta) : null,
        data: new Date(venda.data || Date.now()).toISOString(),
        garcom_fechamento: venda.garcom_fechamento || null,
      });

      const insertItem = db.prepare(`
        INSERT INTO itens_venda (venda_id, produto_nome, quantidade, valor_unitario, garcom)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of venda.itens || []) {
        insertItem.run(
          venda.id,
          item.produto_nome,
          item.quantidade,
          item.valor_unitario,
          item.garcom || null
        );
      }

      db.prepare("UPDATE comandas SET status = 'fechada' WHERE id = ?").run(comandaId);
      db.prepare(
        "UPDATE mesas SET status = 'disponivel', comanda_id = NULL WHERE numero = ?"
      ).run(mesaNumero);
    });
    tx();
    return mapVenda(db.prepare("SELECT * FROM vendas WHERE id = ?").get(venda.id));
  },

  excluirMesa(comandaId, mesaNumero, despesa) {
    const tx = db.transaction(() => {
      if (despesa) {
        db.prepare(`
          INSERT INTO despesas (id, descricao, valor, tipo, itens, mesa, data)
          VALUES (@id, @descricao, @valor, @tipo, @itens, @mesa, @data)
        `).run({
          id: despesa.id,
          descricao: despesa.descricao,
          valor: despesa.valor,
          tipo: despesa.tipo,
          itens: despesa.itens ? JSON.stringify(despesa.itens) : null,
          mesa: despesa.mesa ?? mesaNumero,
          data: new Date(despesa.data || Date.now()).toISOString(),
        });
      }

      db.prepare("DELETE FROM itens_comanda WHERE comanda_id = ?").run(comandaId);
      db.prepare("DELETE FROM comandas WHERE id = ?").run(comandaId);
      db.prepare(
        "UPDATE mesas SET status = 'disponivel', comanda_id = NULL WHERE numero = ?"
      ).run(mesaNumero);
    });
    tx();
    return true;
  },

  fecharMesaVazia(comandaId, mesaNumero) {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM itens_comanda WHERE comanda_id = ?").run(comandaId);
      db.prepare("DELETE FROM comandas WHERE id = ?").run(comandaId);
      db.prepare(
        "UPDATE mesas SET status = 'disponivel', comanda_id = NULL WHERE numero = ?"
      ).run(mesaNumero);
    });
    tx();
    return true;
  },

  // Vendas
  listarVendas() {
    return db
      .prepare("SELECT * FROM vendas ORDER BY data DESC")
      .all()
      .map(mapVenda);
  },

  // Despesas
  listarDespesas() {
    return db
      .prepare("SELECT * FROM despesas ORDER BY data DESC")
      .all()
      .map(mapDespesa);
  },

  criarDespesa(despesa) {
    db.prepare(`
      INSERT INTO despesas (id, descricao, valor, tipo, itens, mesa, data)
      VALUES (@id, @descricao, @valor, @tipo, @itens, @mesa, @data)
    `).run({
      id: despesa.id,
      descricao: despesa.descricao,
      valor: despesa.valor,
      tipo: despesa.tipo,
      itens: despesa.itens ? JSON.stringify(despesa.itens) : null,
      mesa: despesa.mesa ?? null,
      data: new Date(despesa.data || Date.now()).toISOString(),
    });
    return mapDespesa(db.prepare("SELECT * FROM despesas WHERE id = ?").get(despesa.id));
  },
};

export default db;
