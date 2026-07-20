/**
 * ============================================================
 * impressora.js (server)
 * ============================================================
 * PAPEL: Servidor Express local que fala com o CUPS do sistema.
 * QUEM USA: Frontend via fetch (utils/impressao.ts) em localhost:3001.
 * O QUE FAZ:
 *   GET  /status       — healthcheck
 *   GET  /impressoras  — lista impressoras (lpstat -p -d)
 *   POST /imprimir     — envia texto para lp (-d nome)
 * FLUXO: npm run server → app escuta 0.0.0.0:3001 → CUPS imprime
 * REQUISITO: CUPS instalado (comandos lp / lpstat no PATH).
 * ============================================================
 */

import express from "express";
import cors from "cors";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3001;

// ── Middlewares ──
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ── Integração CUPS: listagem ──

/**
 * Lista impressoras instaladas no CUPS (lpstat).
 * Funciona com saída em português e inglês.
 */
async function listarImpressorasSistema() {
  let stdout = "";
  try {
    // LC_ALL=C força saída em inglês quando possível; ainda tratamos PT
    const result = await execFileAsync("lpstat", ["-p", "-d"], {
      timeout: 10000,
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
    });
    stdout = result.stdout || "";
  } catch (erro) {
    // lpstat retorna exit != 0 se não houver impressoras; ainda pode ter stdout
    stdout = erro.stdout || "";
    if (!stdout && erro.stderr) {
      throw new Error(erro.stderr.toString().trim() || "Falha ao listar impressoras");
    }
  }

  const impressoras = [];
  const linhas = stdout.split("\n");

  for (const linha of linhas) {
    // EN: "printer NAME is idle. enabled since..."
    // EN: "printer NAME disabled since..."
    // PT: "impressora NAME está inativa; habilitada desde..."
    const matchEn = linha.match(/^printer\s+(\S+)\s+(.+)$/i);
    const matchPt = linha.match(/^impressora\s+(\S+)\s+(.+)$/i);
    const match = matchEn || matchPt;

    if (match) {
      const nome = match[1];
      const resto = match[2].toLowerCase();
      // Mapeia texto CUPS → status normalizado do app
      const status =
        resto.includes("idle") || resto.includes("inativa") || resto.includes("pronta")
          ? "pronta"
          : resto.includes("disabled") || resto.includes("desabilitada")
            ? "desabilitada"
            : resto.includes("printing") || resto.includes("imprimindo")
              ? "imprimindo"
              : "disponivel";

      impressoras.push({
        nome,
        status,
        descricao: match[2].trim(),
      });
    }
  }

  // Destino padrão: EN "system default destination: X" / PT "destino padrão do sistema: X"
  let padrao = null;
  const matchPadraoEn = stdout.match(/system default destination:\s*(\S+)/i);
  const matchPadraoPt = stdout.match(/destino padr[aã]o do sistema:\s*(\S+)/i);
  if (matchPadraoEn) padrao = matchPadraoEn[1];
  if (matchPadraoPt) padrao = matchPadraoPt[1];

  return { impressoras, padrao };
}

// ── Integração CUPS: envio de job ──

/**
 * Envia `conteudo` para a fila CUPS via comando `lp`.
 * Se `impressora` for omitida, usa a padrão do sistema.
 */
function imprimirComLp(conteudo, impressora) {
  return new Promise((resolve, reject) => {
    const args = impressora ? ["-d", impressora] : [];
    const processo = spawn("lp", args, { stdio: ["pipe", "pipe", "pipe"] });

    let stderr = "";
    processo.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    processo.on("error", (erro) => {
      reject(erro);
    });

    processo.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `lp finalizou com código ${code}`));
      }
    });

    // Conteudo do ticket é texto puro (UTF-8) no stdin do lp
    processo.stdin.write(conteudo, "utf8");
    processo.stdin.end();
  });
}

// ── Rotas HTTP ──

/** GET /impressoras — escaneia impressoras e destino padrão */
app.get("/impressoras", async (_req, res) => {
  try {
    const { impressoras, padrao } = await listarImpressorasSistema();
    res.json({
      sucesso: true,
      impressoras,
      padrao,
    });
  } catch (erro) {
    console.error("Erro ao listar impressoras:", erro);
    res.status(500).json({
      sucesso: false,
      impressoras: [],
      padrao: null,
      erro: erro.message || "Não foi possível escanear impressoras",
    });
  }
});

/** GET /status — healthcheck simples */
app.get("/status", (_req, res) => {
  res.json({ ok: true, servico: "impressao", porta: PORT });
});

/**
 * POST /imprimir — body: { conteudo: string, impressora?: string }
 * Valida se a impressora existe (quando informada) e envia ao CUPS.
 */
app.post("/imprimir", async (req, res) => {
  const { conteudo, impressora } = req.body || {};

  if (!conteudo || typeof conteudo !== "string") {
    return res.status(400).json({
      sucesso: false,
      erro: "Conteúdo da impressão é obrigatório",
    });
  }

  try {
    // Se informou impressora, valida se existe no sistema
    if (impressora) {
      const { impressoras } = await listarImpressorasSistema();
      const existe = impressoras.some((p) => p.nome === impressora);
      if (!existe) {
        return res.status(400).json({
          sucesso: false,
          erro: `Impressora "${impressora}" não encontrada. Escaneie novamente.`,
        });
      }
    }

    await imprimirComLp(conteudo, impressora || undefined);
    console.log(
      impressora
        ? `Impressão enviada para: ${impressora}`
        : "Impressão enviada para a impressora padrão do sistema"
    );
    res.json({ sucesso: true, impressora: impressora || "padrao" });
  } catch (erro) {
    console.error("Erro CUPS:", erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message || "Falha ao imprimir",
    });
  }
});

// ── Bootstrap ──
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor de impressão ativo em http://0.0.0.0:${PORT}`);
  console.log("  GET  /impressoras  — escaneia impressoras do computador");
  console.log("  POST /imprimir     — imprime (body: { conteudo, impressora? })");
});
