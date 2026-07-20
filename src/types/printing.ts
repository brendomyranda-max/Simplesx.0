/**
 * ============================================================
 * printing.ts
 * ============================================================
 * PAPEL: Tipos e constantes de configuração de impressão (POS).
 * QUEM USA: utils/impressao, formatters/html, nativePrinter,
 *           GerenciadorImpressora, ImpressaoCozinha, GerarConta.
 * O QUE FAZ:
 *   - Define status CUPS e impressoras detectadas no PC.
 *   - Configuração de impressão (impressora, servidor, layout térmico).
 *   - Preferências do ticket de cozinha.
 *   - Chaves de localStorage e valores padrão.
 * ============================================================
 */

// ── Status reportado pelo CUPS ao escanear impressoras ──
/** Status reportado pelo CUPS ao escanear impressoras */
export type StatusImpressora =
  | "pronta"
  | "desabilitada"
  | "imprimindo"
  | "disponivel";

// ── Impressora detectada no computador (via servidor local) ──
/** Impressora detectada no computador (via servidor local) */
export interface ImpressoraDisponivel {
  nome: string;
  status: StatusImpressora;
  descricao?: string;
}

/**
 * Configuração de impressão salva pelo Gerenciador de Impressoras
 * (localStorage). Toda impressão do app usa estes dados.
 */
export interface ConfiguracaoImpressao {
  /** Nome da impressora CUPS escolhida na interface */
  impressora: string;
  /** URL do servidor local de impressão */
  servidorUrl: string;
  largura: string;
  altura: string;
  tamanhoFonte: string;
  margens: string;
}

/** Preferências de layout do ticket de cozinha (independente da impressora) */
export interface ConfigImpressaoCozinha {
  mostrarHorario: boolean;
  mostrarMesa: boolean;
  mostrarGarcom: boolean;
  mostrarObservacoes: boolean;
  tamanhoFonte: "pequeno" | "medio" | "grande";
  incluirCabecalho: boolean;
  cabecalhoPersonalizado: string;
  incluirRodape: boolean;
  rodapePersonalizado: string;
}

// ── Constantes: servidor padrão e chaves de persistência ──
export const SERVIDOR_IMPRESSAO_PADRAO = "http://localhost:3001";
export const CHAVE_CONFIG_IMPRESSAO = "configuracao-impressao";
export const CHAVE_CONFIG_COZINHA = "config-impressao-cozinha";

/** Defaults de papel térmico / layout usados na 1ª configuração */
export const CONFIG_IMPRESSAO_PADRAO: ConfiguracaoImpressao = {
  impressora: "",
  servidorUrl: SERVIDOR_IMPRESSAO_PADRAO,
  largura: "80mm",
  altura: "200mm",
  tamanhoFonte: "9px",
  margens: "1mm",
};

/** Defaults do ticket de cozinha (textos e campos visíveis) */
export const CONFIG_COZINHA_PADRAO: ConfigImpressaoCozinha = {
  mostrarHorario: true,
  mostrarMesa: true,
  mostrarGarcom: true,
  mostrarObservacoes: true,
  tamanhoFonte: "medio",
  incluirCabecalho: true,
  cabecalhoPersonalizado: "*** PEDIDO COZINHA ***",
  incluirRodape: true,
  rodapePersonalizado: "--- BOM TRABALHO! ---",
};
