/**
 * ============================================================
 * ListaItensComanda.tsx
 * ============================================================
 * PAPEL: Lista e edita itens já confirmados na comanda da mesa.
 * QUEM USA: GerenciarComanda.tsx.
 * O QUE FAZ:
 *   - Altera quantidade (+/-) e recalcula valor_total.
 *   - Remove item e limpa entradas relacionadas em por_pessoa.
 *   - Exibe observação embutida no nome: "Produto (obs)".
 * ============================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Comanda } from '@/types/restaurant';

interface ListaItensComandaProps {
  comanda: Comanda;
  onComandaAtualizada: (comanda: Comanda) => void | Promise<unknown>;
}

const ListaItensComanda = ({ comanda, onComandaAtualizada }: ListaItensComandaProps) => {
  const { toast } = useToast();

  // ── Handlers ──

  /** Ajusta quantidade e propaga o delta no valor_total da comanda. */
  const alterarQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;

    const comandaAtualizada = { ...comanda };
    const item = comandaAtualizada.itens[index];
    const diferencaQuantidade = novaQuantidade - item.quantidade;
    
    item.quantidade = novaQuantidade;
    comandaAtualizada.valor_total += (item.valor_unitario * diferencaQuantidade);

    onComandaAtualizada(comandaAtualizada);
  };

  /**
   * Remove o item, subtrai do total e limpa referências em por_pessoa (split).
   */
  const removerItem = (index: number) => {
    const comandaAtualizada = { ...comanda };
    const item = comandaAtualizada.itens[index];
    
    comandaAtualizada.valor_total -= (item.valor_unitario * item.quantidade);
    comandaAtualizada.itens.splice(index, 1);

    const itemsParaRemover = comandaAtualizada.por_pessoa.filter(itemPessoa => 
      itemPessoa.includes(item.produto_nome)
    );
    itemsParaRemover.forEach(itemRemover => {
      const indexPessoa = comandaAtualizada.por_pessoa.indexOf(itemRemover);
      if (indexPessoa !== -1) {
        comandaAtualizada.por_pessoa.splice(indexPessoa, 1);
      }
    });

    onComandaAtualizada(comandaAtualizada);

    toast({
      title: "Item removido",
      description: `${item.produto_nome} foi removido da mesa ${comanda.mesa}`,
    });
  };

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens da Mesa {comanda.mesa}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {comanda.itens.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
          ) : (
            comanda.itens.map((item, index) => {
              // Extrair nome do produto e observações
              const nomeCompleto = item.produto_nome;
              const temObservacao = nomeCompleto.includes('(') && nomeCompleto.includes(')');
              const nomeProduto = temObservacao ? nomeCompleto.split('(')[0].trim() : nomeCompleto;
              const observacao = temObservacao ? nomeCompleto.split('(')[1].replace(')', '').trim() : null;

              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{nomeProduto}</p>
                    {observacao && (
                      <p className="text-xs text-primary italic mb-1">Obs: {observacao}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      R$ {item.valor_unitario.toFixed(2)} x {item.quantidade} = R$ {(item.valor_unitario * item.quantidade).toFixed(2)}
                    </p>
                    {item.garcom && (
                      <p className="text-xs text-gray-500">Garçom: {item.garcom}</p>
                    )}
                    {comanda.split_ativo && (
                      <p className="text-xs text-blue-600">
                        {comanda.por_pessoa.find(itemPessoa => itemPessoa.includes(item.produto_nome))?.split(':')[0]}
                      </p>
                    )}
                  </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alterarQuantidade(index, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantidade}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alterarQuantidade(index, item.quantidade + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListaItensComanda;
