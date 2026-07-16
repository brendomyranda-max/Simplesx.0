import {
  ConfiguracaoImpressao,
  ConfigImpressaoCozinha,
  ImpressoraDisponivel,
  StatusImpressora,
  SERVIDOR_IMPRESSAO_PADRAO,
  CHAVE_CONFIG_IMPRESSAO,
  CHAVE_CONFIG_COZINHA,
  CONFIG_IMPRESSAO_PADRAO,
  CONFIG_COZINHA_PADRAO,
} from "@/types/printing";
import { NativePrinterManager } from "./printing/printers/nativePrinter";

export type {
  ConfiguracaoImpressao,
  ConfigImpressaoCozinha,
  ImpressoraDisponivel,
  StatusImpressora,
};
export {
  SERVIDOR_IMPRESSAO_PADRAO,
  CHAVE_CONFIG_IMPRESSAO,
  CHAVE_CONFIG_COZINHA,
  CONFIG_IMPRESSAO_PADRAO,
  CONFIG_COZINHA_PADRAO,
};

function normalizarConfig(
  parcial?: Partial<ConfiguracaoImpressao> | null
): ConfiguracaoImpressao {
  return {
    ...CONFIG_IMPRESSAO_PADRAO,
    ...(parcial || {}),
    impressora: parcial?.impressora?.trim() || "",
    servidorUrl: (parcial?.servidorUrl || SERVIDOR_IMPRESSAO_PADRAO).replace(
      /\/$/,
      ""
    ),
  };
}

/** Carrega a configuração salva na interface do Gerenciador de Impressoras */
export function carregarConfiguracaoImpressao(): ConfiguracaoImpressao {
  try {
    const raw = localStorage.getItem(CHAVE_CONFIG_IMPRESSAO);
    if (!raw) return { ...CONFIG_IMPRESSAO_PADRAO };
    return normalizarConfig(JSON.parse(raw) as Partial<ConfiguracaoImpressao>);
  } catch {
    return { ...CONFIG_IMPRESSAO_PADRAO };
  }
}

/** Salva a configuração escolhida na interface */
export function salvarConfiguracaoImpressao(
  config: ConfiguracaoImpressao
): ConfiguracaoImpressao {
  const normalizada = normalizarConfig(config);
  localStorage.setItem(CHAVE_CONFIG_IMPRESSAO, JSON.stringify(normalizada));
  return normalizada;
}

export function carregarConfigCozinha(): ConfigImpressaoCozinha {
  try {
    const raw = localStorage.getItem(CHAVE_CONFIG_COZINHA);
    if (!raw) return { ...CONFIG_COZINHA_PADRAO };
    return { ...CONFIG_COZINHA_PADRAO, ...JSON.parse(raw) };
  } catch {
    return { ...CONFIG_COZINHA_PADRAO };
  }
}

export function salvarConfigCozinha(
  config: ConfigImpressaoCozinha
): ConfigImpressaoCozinha {
  const normalizada = { ...CONFIG_COZINHA_PADRAO, ...config };
  localStorage.setItem(CHAVE_CONFIG_COZINHA, JSON.stringify(normalizada));
  return normalizada;
}

export function temImpressoraConfigurada(
  config?: ConfiguracaoImpressao
): boolean {
  const c = config || carregarConfiguracaoImpressao();
  return Boolean(c.impressora);
}

/** Escaneia impressoras instaladas no computador (servidor local CUPS) */
export async function escanearImpressoras(
  servidorUrl?: string
): Promise<{
  impressoras: ImpressoraDisponivel[];
  padrao: string | null;
  erro?: string;
}> {
  const base = (
    servidorUrl ||
    carregarConfiguracaoImpressao().servidorUrl ||
    SERVIDOR_IMPRESSAO_PADRAO
  ).replace(/\/$/, "");

  try {
    const resposta = await fetch(`${base}/impressoras`, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });
    const dados = await resposta.json();

    if (!dados.sucesso) {
      return {
        impressoras: [],
        padrao: null,
        erro: dados.erro || "Falha ao escanear impressoras",
      };
    }

    return {
      impressoras: (dados.impressoras || []) as ImpressoraDisponivel[],
      padrao: dados.padrao ?? null,
    };
  } catch {
    return {
      impressoras: [],
      padrao: null,
      erro:
        "Servidor de impressão offline. Na pasta do projeto rode: npm run server",
    };
  }
}

export class GerenciadorImpressao {
  private static instancia: GerenciadorImpressao;

  public static obterInstancia(): GerenciadorImpressao {
    if (!GerenciadorImpressao.instancia) {
      GerenciadorImpressao.instancia = new GerenciadorImpressao();
    }
    return GerenciadorImpressao.instancia;
  }

  private async imprimirViaServidor(
    conteudo: string,
    config: ConfiguracaoImpressao
  ): Promise<{ ok: boolean; erro?: string }> {
    const base = config.servidorUrl || SERVIDOR_IMPRESSAO_PADRAO;

    try {
      const resposta = await fetch(`${base}/imprimir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo,
          impressora: config.impressora || undefined,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const retorno = await resposta.json();
      if (retorno.sucesso) {
        return { ok: true };
      }
      return { ok: false, erro: retorno.erro || "Servidor recusou a impressão" };
    } catch {
      return {
        ok: false,
        erro: "Servidor de impressão offline (npm run server)",
      };
    }
  }

  /**
   * Imprime usando a impressora salva na interface.
   * Fallback: diálogo nativo do navegador se o servidor estiver offline.
   */
  public async imprimir(
    conteudo: string,
    titulo: string,
    configParcial?: Partial<ConfiguracaoImpressao>
  ): Promise<boolean> {
    const config = normalizarConfig({
      ...carregarConfiguracaoImpressao(),
      ...configParcial,
    });

    if (!config.impressora) {
      console.warn(
        "Nenhuma impressora configurada. Abra Impressora e salve uma."
      );
      return false;
    }

    const viaServidor = await this.imprimirViaServidor(conteudo, config);
    if (viaServidor.ok) {
      return true;
    }

    console.warn(viaServidor.erro);
    // Fallback: diálogo do navegador (usuário ainda pode escolher impressora do SO)
    const nativo = await NativePrinterManager.imprimir(conteudo, titulo, config);
    if (nativo) return true;

    NativePrinterManager.abrirParaImpressaoManual(conteudo, titulo, config);
    return true;
  }
}
