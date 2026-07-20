/**
 * ============================================================
 * nativePrinter.ts
 * ============================================================
 * PAPEL: Fallback de impressão pelo navegador (sem servidor CUPS).
 * QUEM USA: GerenciadorImpressao em utils/impressao.ts.
 * O QUE FAZ:
 *   - imprimir: iframe oculto + window.print().
 *   - abrirParaImpressaoManual: nova aba com auto-print.
 * ============================================================
 */

import { ConfiguracaoImpressao } from "@/types/printing";
import { HTMLFormatter } from "../formatters/html";

/** Fallback: diálogo de impressão do navegador (quando o servidor CUPS está offline) */
export class NativePrinterManager {
  /**
   * Cria iframe off-screen, escreve o HTML do ticket e dispara print().
   * Remove o iframe após atraso para o diálogo carregar.
   */
  public static async imprimir(
    conteudo: string,
    titulo: string,
    config?: Partial<ConfiguracaoImpressao>
  ): Promise<boolean> {
    try {
      const largura = config?.largura || "80mm";
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = largura;
      iframe.style.height = "auto";

      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        return false;
      }

      doc.open();
      doc.write(HTMLFormatter.gerarHTMLCompleto(conteudo, titulo, config));
      doc.close();

      // Aguarda renderização antes de abrir o diálogo de impressão
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 2000);
      }, 500);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Abre nova janela com o ticket e chama print() via script embutido.
   * Usado quando o iframe falha (ex.: bloqueio de popup/iframe).
   */
  public static abrirParaImpressaoManual(
    conteudo: string,
    titulo: string,
    config?: Partial<ConfiguracaoImpressao>
  ): void {
    const novaJanela = window.open("", "_blank");
    if (!novaJanela) return;

    novaJanela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titulo}</title>
          <meta charset="utf-8">
          ${HTMLFormatter.gerarEstilosImpressao(config)}
        </head>
        <body>
          <pre>${conteudo}</pre>
          <script>
            setTimeout(function () { window.print(); }, 800);
          </script>
        </body>
      </html>
    `);
    novaJanela.document.close();
  }
}
