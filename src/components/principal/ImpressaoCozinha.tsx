/**
 * ============================================================
 * ImpressaoCozinha.tsx
 * ============================================================
 * PAPEL: Modal de layout customizado do ticket de cozinha.
 * QUEM USA: CarrinhoTemporario ("Cozinha Custom").
 * O QUE FAZ:
 *   - Configura quais campos exibir (horário, mesa, garçom, obs).
 *   - Cabeçalho/rodapé personalizados e tamanho de fonte.
 *   - Preview em tempo real e impressão do pedido.
 * ============================================================
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChefHat, Printer, Settings, Eye } from "lucide-react";
import { ItemComanda } from "@/types/restaurant";
import { useToast } from "@/hooks/use-toast";
import {
  GerenciadorImpressao,
  ConfigImpressaoCozinha,
  carregarConfigCozinha,
  salvarConfigCozinha,
  carregarConfiguracaoImpressao,
  temImpressoraConfigurada,
  CONFIG_COZINHA_PADRAO,
} from "@/utils/impressao";

interface ImpressaoCozinhaProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemComanda[];
  mesaNumero: number;
  garcomNome: string;
}

const ImpressaoCozinha = ({
  isOpen,
  onClose,
  itens,
  mesaNumero,
  garcomNome,
}: ImpressaoCozinhaProps) => {
  // ── Estado local ──
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigImpressaoCozinha>({
    ...CONFIG_COZINHA_PADRAO,
  });
  const [imprimindo, setImprimindo] = useState(false);

  // Carrega preferências de layout ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      setConfig(carregarConfigCozinha());
    }
  }, [isOpen]);

  // ── Geração do ticket ──

  /** Formata uma linha de item (qtd, nome, observação opcional). */
  const gerarLinhaItem = (item: ItemComanda): string => {
    const nomeCompleto = item.produto_nome;
    const temObservacao =
      nomeCompleto.includes("(") && nomeCompleto.includes(")");
    const nomeProduto = temObservacao
      ? nomeCompleto.split("(")[0].trim()
      : nomeCompleto;
    const observacao = temObservacao
      ? nomeCompleto.split("(")[1].replace(")", "").trim()
      : null;

    let linha = `${item.quantidade}x ${nomeProduto}\n`;
    if (config.mostrarObservacoes && observacao) {
      linha += `   >>> ${observacao} <<<\n`;
    }
    linha += "\n";
    return linha;
  };

  /** Monta o texto completo do pedido conforme switches de layout. */
  const gerarConteudoPedido = (): string => {
    const hora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    let conteudo = "";

    if (config.incluirCabecalho && config.cabecalhoPersonalizado) {
      conteudo += `${config.cabecalhoPersonalizado}\n`;
      conteudo += "=".repeat(config.cabecalhoPersonalizado.length) + "\n\n";
    }

    if (config.mostrarHorario) conteudo += `HORARIO: ${hora}\n`;
    if (config.mostrarMesa) conteudo += `MESA: ${mesaNumero}\n`;
    if (config.mostrarGarcom && garcomNome) {
      conteudo += `GARCOM: ${garcomNome}\n`;
    }

    conteudo += "\n" + "-".repeat(30) + "\n\n";

    itens.forEach((item) => {
      conteudo += gerarLinhaItem(item);
    });

    if (config.incluirRodape && config.rodapePersonalizado) {
      conteudo += "\n" + "-".repeat(30) + "\n";
      conteudo += config.rodapePersonalizado + "\n";
    }

    return conteudo;
  };

  // ── Handlers ──

  /** Imprime o pedido usando impressora do app + fonte do layout cozinha. */
  const imprimirPedido = async () => {
    if (!temImpressoraConfigurada()) {
      toast({
        title: "Impressora não configurada",
        description: "Configure em Impressora antes de imprimir",
        variant: "destructive",
      });
      return;
    }

    setImprimindo(true);

    try {
      const impressoraConfig = carregarConfiguracaoImpressao();
      const tamanhoFonte =
        config.tamanhoFonte === "pequeno"
          ? "8px"
          : config.tamanhoFonte === "medio"
            ? "10px"
            : "12px";

      const sucesso = await GerenciadorImpressao.obterInstancia().imprimir(
        gerarConteudoPedido(),
        `Pedido Cozinha - Mesa ${mesaNumero}`,
        { ...impressoraConfig, tamanhoFonte }
      );

      if (sucesso) {
        toast({
          title: "Pedido enviado para cozinha!",
          description: `Mesa ${mesaNumero} → ${impressoraConfig.impressora}`,
        });
        onClose();
      } else {
        toast({
          title: "Erro na impressão",
          description: "Verifique a impressora e o servidor",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro na impressão",
        description: "Verifique se a impressora está conectada",
        variant: "destructive",
      });
    } finally {
      setImprimindo(false);
    }
  };

  /** Persiste preferências de layout de cozinha no localStorage. */
  const salvarConfiguracao = () => {
    salvarConfigCozinha(config);
    toast({
      title: "Configuração salva!",
      description: "Preferências de layout da cozinha salvas",
    });
  };

  const previewConteudo = gerarConteudoPedido();
  const impressoraAtiva = carregarConfiguracaoImpressao().impressora;

  // ── Render: config (esq.) + preview (dir.) ──
  return (
    <Dialog open={isOpen} onOpenChange={(aberto) => { if (!aberto) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Impressão para Cozinha - Mesa {mesaNumero}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna de configuração do layout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Layout do pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {impressoraAtiva && (
                <p className="text-xs text-muted-foreground rounded-md bg-muted p-2">
                  Impressora: <strong>{impressoraAtiva}</strong> (definida em
                  Gerenciar Impressora)
                </p>
              )}

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Informações a incluir:</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="horario">Mostrar horário</Label>
                  <Switch
                    id="horario"
                    checked={config.mostrarHorario}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, mostrarHorario: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mesa">Mostrar mesa</Label>
                  <Switch
                    id="mesa"
                    checked={config.mostrarMesa}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, mostrarMesa: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="garcom">Mostrar garçom</Label>
                  <Switch
                    id="garcom"
                    checked={config.mostrarGarcom}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, mostrarGarcom: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="observacoes">Mostrar observações</Label>
                  <Switch
                    id="observacoes"
                    checked={config.mostrarObservacoes}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, mostrarObservacoes: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Formatação:</h4>
                <div>
                  <Label>Tamanho da fonte</Label>
                  <Select
                    value={config.tamanhoFonte}
                    onValueChange={(value: "pequeno" | "medio" | "grande") =>
                      setConfig({ ...config, tamanhoFonte: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeno">Pequeno</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Textos personalizados:</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cabecalho">Incluir cabeçalho</Label>
                  <Switch
                    id="cabecalho"
                    checked={config.incluirCabecalho}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, incluirCabecalho: checked })
                    }
                  />
                </div>

                {config.incluirCabecalho && (
                  <div>
                    <Label>Texto do cabeçalho</Label>
                    <Input
                      value={config.cabecalhoPersonalizado}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          cabecalhoPersonalizado: e.target.value,
                        })
                      }
                      placeholder="Digite o cabeçalho..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="rodape">Incluir rodapé</Label>
                  <Switch
                    id="rodape"
                    checked={config.incluirRodape}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, incluirRodape: checked })
                    }
                  />
                </div>

                {config.incluirRodape && (
                  <div>
                    <Label>Texto do rodapé</Label>
                    <Input
                      value={config.rodapePersonalizado}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rodapePersonalizado: e.target.value,
                        })
                      }
                      placeholder="Digite o rodapé..."
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={salvarConfiguracao}
                variant="outline"
                className="w-full"
              >
                Salvar Layout
              </Button>
            </CardContent>
          </Card>

          {/* Coluna de preview + ações de impressão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Preview do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {previewConteudo}
                </pre>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => void imprimirPedido()}
                  disabled={imprimindo || itens.length === 0}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {imprimindo ? "Imprimindo..." : "Imprimir Pedido"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImpressaoCozinha;
