import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Printer,
  Trash2,
  Plus,
  Minus,
  ChefHat,
  Send,
} from "lucide-react";
import { ItemComanda } from "@/types/restaurant";
import { useToast } from "@/hooks/use-toast";
import {
  GerenciadorImpressao,
  carregarConfiguracaoImpressao,
  temImpressoraConfigurada,
} from "@/utils/impressao";
import GerenciadorImpressora from "./GerenciadorImpressora";
import ImpressaoCozinha from "./ImpressaoCozinha";

interface CarrinhoTemporarioProps {
  itens: ItemComanda[];
  onAtualizarItem: (index: number, quantidade: number) => void;
  onRemoverItem: (index: number) => void;
  onConfirmarPedido: () => void;
  onLimparCarrinho: () => void;
  onEnviarEVoltar?: () => void;
  mesaNumero: number;
  garcomNome: string;
}

const CarrinhoTemporario = ({
  itens,
  onAtualizarItem,
  onRemoverItem,
  onConfirmarPedido,
  onLimparCarrinho,
  onEnviarEVoltar,
  mesaNumero,
  garcomNome,
}: CarrinhoTemporarioProps) => {
  const { toast } = useToast();
  const [imprimindo, setImprimindo] = useState(false);
  const [modalCozinha, setModalCozinha] = useState(false);

  const calcularTotal = () => {
    return itens.reduce(
      (total, item) => total + item.valor_unitario * item.quantidade,
      0
    );
  };

  const gerarConteudoComanda = (): string => {
    const dataHora = new Date().toLocaleString("pt-BR");
    let conteudo = `=================================
     COMANDA - MESA ${mesaNumero}
=================================
Data/Hora: ${dataHora}
Garcom: ${garcomNome}
---------------------------------
ITENS SOLICITADOS:
`;

    itens.forEach((item) => {
      const subtotal = item.valor_unitario * item.quantidade;
      const nomeCompleto = item.produto_nome;
      const temObservacao =
        nomeCompleto.includes("(") && nomeCompleto.includes(")");
      const nomeProduto = temObservacao
        ? nomeCompleto.split("(")[0].trim()
        : nomeCompleto;
      const observacao = temObservacao
        ? nomeCompleto.split("(")[1].replace(")", "").trim()
        : null;

      conteudo += `
${nomeProduto}
Qtd: ${item.quantidade} x R$ ${item.valor_unitario.toFixed(2)} = R$ ${subtotal.toFixed(2)}`;

      if (observacao) {
        conteudo += `
*** OBS: ${observacao} ***`;
      }
    });

    conteudo += `

---------------------------------
TOTAL: R$ ${calcularTotal().toFixed(2)}

*** PEDIDO PARA PRODUCAO ***
=================================`;

    return conteudo;
  };

  const imprimirComanda = async () => {
    if (itens.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de imprimir",
        variant: "destructive",
      });
      return false;
    }

    if (!temImpressoraConfigurada()) {
      toast({
        title: "Impressora não configurada",
        description: "Clique em Impressora, escaneie e salve uma impressora",
        variant: "destructive",
      });
      return false;
    }

    setImprimindo(true);

    try {
      const config = carregarConfiguracaoImpressao();
      const sucesso = await GerenciadorImpressao.obterInstancia().imprimir(
        gerarConteudoComanda(),
        `Comanda Mesa ${mesaNumero}`,
        config
      );

      if (sucesso) {
        toast({
          title: "Comanda enviada para impressão",
          description: `Mesa ${mesaNumero} → ${config.impressora}`,
        });
      } else {
        toast({
          title: "Erro na impressão",
          description: "Verifique a impressora e se o servidor está rodando",
          variant: "destructive",
        });
      }

      return sucesso;
    } catch {
      toast({
        title: "Erro na impressão",
        description: "Verifique se sua impressora está conectada",
        variant: "destructive",
      });
      return false;
    } finally {
      setImprimindo(false);
    }
  };

  const confirmarEImprimir = async () => {
    if (itens.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de confirmar",
        variant: "destructive",
      });
      return;
    }

    const impressaoOk = await imprimirComanda();

    if (impressaoOk) {
      onConfirmarPedido();
      toast({
        title: "Pedido confirmado e enviado!",
        description: `Mesa ${mesaNumero} - Comanda impressa para produção`,
      });
    }
  };

  if (itens.length === 0) {
    return (
      <div className="mt-4 flex justify-center">
        <GerenciadorImpressora />
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Carrinho Temporário ({itens.length} itens)
          </div>
          <GerenciadorImpressora />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {itens.map((item, index) => {
          const nomeCompleto = item.produto_nome;
          const temObservacao =
            nomeCompleto.includes("(") && nomeCompleto.includes(")");
          const nomeProduto = temObservacao
            ? nomeCompleto.split("(")[0].trim()
            : nomeCompleto;
          const observacao = temObservacao
            ? nomeCompleto.split("(")[1].replace(")", "").trim()
            : null;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{nomeProduto}</p>
                {observacao && (
                  <p className="text-xs text-primary italic">Obs: {observacao}</p>
                )}
                <p className="text-xs text-gray-600">
                  R$ {item.valor_unitario.toFixed(2)} x {item.quantidade} = R${" "}
                  {(item.valor_unitario * item.quantidade).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAtualizarItem(index, item.quantidade - 1)}
                  disabled={item.quantidade <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantidade}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAtualizarItem(index, item.quantidade + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoverItem(index)}
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t">
          <p className="font-bold text-right">
            Total: R$ {calcularTotal().toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            onClick={() => setModalCozinha(true)}
            variant="outline"
            className="flex items-center gap-2"
            disabled={imprimindo}
          >
            <ChefHat className="h-4 w-4" />
            Cozinha Custom
          </Button>
          <Button
            onClick={() => void imprimirComanda()}
            variant="outline"
            disabled={imprimindo}
          >
            <Printer className="h-4 w-4 mr-2" />
            {imprimindo ? "Imprimindo..." : "Imprimir Rápido"}
          </Button>
        </div>

        <Button
          onClick={async () => {
            const ok = await imprimirComanda();
            if (ok) {
              onConfirmarPedido();
              toast({
                title: "Pedidos enviados!",
                description: `Mesa ${mesaNumero} — voltando para o painel de mesas`,
              });
              onEnviarEVoltar?.();
            }
          }}
          className="w-full bg-success hover:bg-success/90 text-success-foreground"
          disabled={imprimindo}
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {imprimindo ? "Enviando..." : "Enviar Pedidos"}
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => void confirmarEImprimir()}
            variant="outline"
            className="flex-1"
            disabled={imprimindo}
          >
            <Printer className="h-4 w-4 mr-2" />
            {imprimindo ? "Processando..." : "Confirmar (ficar na mesa)"}
          </Button>
          <Button onClick={onLimparCarrinho} variant="destructive" size="sm">
            Limpar
          </Button>
        </div>

        <ImpressaoCozinha
          isOpen={modalCozinha}
          onClose={() => setModalCozinha(false)}
          itens={itens}
          mesaNumero={mesaNumero}
          garcomNome={garcomNome}
        />
      </CardContent>
    </Card>
  );
};

export default CarrinhoTemporario;
