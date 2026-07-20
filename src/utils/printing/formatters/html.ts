/**
 * ============================================================
 * html.ts (formatters)
 * ============================================================
 * PAPEL: Gera HTML/CSS para impressão térmica via navegador.
 * QUEM USA: NativePrinterManager (fallback quando CUPS está offline).
 * O QUE FAZ:
 *   - Monta estilos @page e body com largura, fonte e margens da config.
 *   - Gera documento HTML completo com o conteúdo em <pre>.
 * ============================================================
 */

import { ConfiguracaoImpressao } from "@/types/printing";

/** Estilos e HTML para fallback de impressão pelo navegador */
export class HTMLFormatter {
  /**
   * CSS embutido para papel térmico (largura em mm, monospace, @media print).
   */
  public static gerarEstilosImpressao(
    config?: Partial<ConfiguracaoImpressao>
  ): string {
    const largura = config?.largura || "80mm";
    const altura = config?.altura || "200mm";
    const tamanhoFonte = config?.tamanhoFonte || "9px";
    const margens = config?.margens || "1mm";
    // Calcula área útil descontando margens laterais
    const larguraNum = parseInt(largura, 10) || 80;
    const margensNum = parseInt(margens, 10) || 1;
    const larguraConteudo = `${larguraNum - margensNum * 2}mm`;
    const fonteTitulo = `${(parseInt(tamanhoFonte, 10) || 9) + 1}px`;

    return `
      <style>
        @page {
          size: ${largura} ${altura};
          margin: 0;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: ${tamanhoFonte};
          margin: 0;
          padding: ${margens};
          line-height: 1.0;
          width: ${larguraConteudo};
          color: #000;
          background: #fff;
        }
        pre {
          white-space: pre-wrap;
          margin: 0;
          font-family: inherit;
          font-size: inherit;
        }
        @media print {
          body {
            margin: 0;
            padding: ${margens};
            font-size: ${tamanhoFonte};
          }
          @page {
            size: ${largura} ${altura === "auto" ? "auto" : altura};
            margin: 0;
          }
        }
        .titulo {
          text-align: center;
          font-weight: bold;
          margin-bottom: ${margens};
          font-size: ${fonteTitulo};
        }
      </style>
    `;
  }

  /**
   * Documento HTML completo pronto para document.write / iframe.print().
   */
  public static gerarHTMLCompleto(
    conteudo: string,
    titulo: string,
    config?: Partial<ConfiguracaoImpressao>
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titulo}</title>
          <meta charset="utf-8">
          ${this.gerarEstilosImpressao(config)}
        </head>
        <body>
          <pre>${conteudo}</pre>
        </body>
      </html>
    `;
  }
}
