import express from "express";
import cors from "cors";
import { execFile, spawn } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

/**
 * Lista impressoras instaladas no CUPS (lpstat).
 * Funciona com saída em português e inglês.
 */
async function listarImpressorasSistema() {
  let stdout = "";
  try {
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

    processo.stdin.write(conteudo, "utf8");
    processo.stdin.end();
  });
}

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

app.get("/status", (_req, res) => {
  res.json({ ok: true, servico: "impressao", porta: PORT });
});

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor de impressão ativo em http://0.0.0.0:${PORT}`);
  console.log("  GET  /impressoras  — escaneia impressoras do computador");
  console.log("  POST /imprimir     — imprime (body: { conteudo, impressora? })");
});
