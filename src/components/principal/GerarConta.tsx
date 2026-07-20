/**
 * ============================================================
 * GerarConta.tsx
 * ============================================================
 * PAPEL: Modal para pré-visualizar/imprimir a conta da mesa.
 * QUEM USA: GerenciarComanda.tsx ("Gerar Conta").
 * O QUE FAZ:
 *   - Calcula subtotal, gorjeta (0–13%) e divisão da conta.
 *   - Gera texto da conta e imprime ("Só Imprimir" ou "Gerar e Imprimir").
 *   - Não fecha a mesa — apenas emite a conta para o cliente.
 * ============================================================
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Printer, Calculator, Users } from 'lucide-react';
import { Comanda } from '@/types/restaurant';
import { useToast } from '@/hooks/use-toast';
import {
  GerenciadorImpressao,
  carregarConfiguracaoImpressao,
  temImpressoraConfigurada,
} from '@/utils/impressao';

interface GerarContaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comanda: Comanda;
  onGerarConta: (porcentagem: number, tipoDivisao: 'igual' | 'personalizado', divisaoPersonalizada?: { pessoa: string; valor: number }[]) => void;
}

const GerarConta = ({ open, onOpenChange, comanda, onGerarConta }: GerarContaProps) => {
  // ── Estado local ──
  const [porcentagemGarcom, setPorcentagemGarcom] = useState(10);
  const [tipoDivisao, setTipoDivisao] = useState<'igual' | 'personalizado'>('igual');
  const [numeroPessoas, setNumeroPessoas] = useState(comanda.pessoas);
  const [divisaoPersonalizada, setDivisaoPersonalizada] = useState<{ pessoa: string; valor: number }[]>([]);
  const { toast } = useToast();

  // ── Totais derivados ──
  const valorTotal = comanda.itens.reduce((total, item) => total + (item.valor_unitario * item.quantidade), 0);
  const valorGorjeta = (valorTotal * porcentagemGarcom) / 100;
  const valorComGorjeta = valorTotal + valorGorjeta;
  const valorPorPessoa = valorComGorjeta / numeroPessoas;

  // ── Handlers divisão personalizada ──
  const adicionarPessoa = () => {
    setDivisaoPersonalizada([
      ...divisaoPersonalizada, 
      { pessoa: `Pessoa ${divisaoPersonalizada.length + 1}`, valor: 0 }
    ]);
  };

  const atualizarValorPessoa = (index: number, valor: number) => {
    const novasDivisoes = [...divisaoPersonalizada];
    novasDivisoes[index].valor = valor;
    setDivisaoPersonalizada(novasDivisoes);
  };

  const removerPessoa = (index: number) => {
    setDivisaoPersonalizada(divisaoPersonalizada.filter((_, i) => i !== index));
  };

  const totalPersonalizado = divisaoPersonalizada.reduce((acc, div) => acc + div.valor, 0);
  const diferenca = valorComGorjeta - totalPersonalizado;

  /** Texto monoespaçado da conta (itens, gorjeta, divisão). */
  const gerarConteudoConta = (): string => {
    const dataHora = new Date().toLocaleString('pt-BR');
    let conteudo = `
=================================
         CONTA - MESA ${comanda.mesa}
=================================
Data/Hora: ${dataHora}
Garçom: ${comanda.garcom || 'N/A'}
Pessoas: ${tipoDivisao === 'igual' ? numeroPessoas : divisaoPersonalizada.length}
---------------------------------
ITENS CONSUMIDOS:
`;

    comanda.itens.forEach((item) => {
      const subtotal = item.valor_unitario * item.quantidade;
      const nomeCompleto = item.produto_nome;
      const temObservacao =
        nomeCompleto.includes('(') && nomeCompleto.includes(')');
      const nomeProduto = temObservacao
        ? nomeCompleto.split('(')[0].trim()
        : nomeCompleto;
      const observacao = temObservacao
        ? nomeCompleto.split('(')[1].replace(')', '').trim()
        : null;

      conteudo += `
${nomeProduto}
${item.quantidade}x R$ ${item.valor_unitario.toFixed(2)} = R$ ${subtotal.toFixed(2)}`;

      if (observacao) {
        conteudo += `
*** Obs: ${observacao} ***`;
      }

      if (item.garcom) {
        conteudo += `
(Lançado por: ${item.garcom})`;
      }

      conteudo += `
`;
    });

    conteudo += `
---------------------------------
Subtotal: R$ ${valorTotal.toFixed(2)}
Gorjeta (${porcentagemGarcom}%): R$ ${valorGorjeta.toFixed(2)}
TOTAL: R$ ${valorComGorjeta.toFixed(2)}
---------------------------------
`;

    if (tipoDivisao === 'igual') {
      conteudo += `
DIVISÃO IGUAL:
${numeroPessoas} pessoas
Valor por pessoa: R$ ${valorPorPessoa.toFixed(2)}
`;
    } else {
      conteudo += `
DIVISÃO PERSONALIZADA:
`;
      divisaoPersonalizada.forEach((div) => {
        conteudo += `${div.pessoa}: R$ ${div.valor.toFixed(2)}
`;
      });
    }

    conteudo += `
=================================
`;
    return conteudo;
  };

  /** Imprime a conta na impressora configurada. */
  const imprimirConta = async () => {
    if (!temImpressoraConfigurada()) {
      toast({
        title: 'Impressora não configurada',
        description: 'Configure em Impressora, escaneie e salve uma impressora',
        variant: 'destructive',
      });
      return false;
    }

    const config = carregarConfiguracaoImpressao();
    const sucesso = await GerenciadorImpressao.obterInstancia().imprimir(
      gerarConteudoConta(),
      `Conta Mesa ${comanda.mesa}`,
      config
    );

    if (sucesso) {
      toast({
        title: 'Conta enviada para impressão',
        description: `Mesa ${comanda.mesa} → ${config.impressora} · R$ ${valorComGorjeta.toFixed(2)}`,
      });
    } else {
      toast({
        title: 'Erro na impressão',
        description: 'Verifique a impressora e o servidor',
        variant: 'destructive',
      });
    }

    return sucesso;
  };

  /** Notifica o pai e imprime (não fecha a mesa). */
  const handleConfirmar = async () => {
    onGerarConta(
      porcentagemGarcom,
      tipoDivisao,
      tipoDivisao === 'personalizado' ? divisaoPersonalizada : undefined
    );
    await imprimirConta();
  };

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gerar Conta - Mesa {comanda.mesa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo da conta */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Valor dos itens:</p>
                  <p className="font-semibold">R$ {valorTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gorjeta ({porcentagemGarcom}%):</p>
                  <p className="font-semibold">R$ {valorGorjeta.toFixed(2)}</p>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-gray-600">Total da conta:</p>
                  <p className="font-bold text-lg text-green-600">R$ {valorComGorjeta.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ajustar porcentagem */}
          <div>
            <Label htmlFor="porcentagem">Porcentagem do Garçom (0% - 13%)</Label>
            <Input
              id="porcentagem"
              type="number"
              min="0"
              max="13"
              step="0.5"
              value={porcentagemGarcom}
              onChange={(e) => setPorcentagemGarcom(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          {/* Tipo de divisão */}
          <div>
            <Label>Como dividir a conta?</Label>
            <Select value={tipoDivisao} onValueChange={(value: 'igual' | 'personalizado') => setTipoDivisao(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="igual">Dividir Igualmente</SelectItem>
                <SelectItem value="personalizado">Valores Personalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divisão igual */}
          {tipoDivisao === 'igual' && (
            <div>
              <Label htmlFor="pessoas" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Número de Pessoas
              </Label>
              <Input
                id="pessoas"
                type="number"
                min="1"
                value={numeroPessoas}
                onChange={(e) => setNumeroPessoas(Math.max(1, Number(e.target.value)))}
                className="mt-1"
              />
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Cada pessoa paga: <span className="font-bold">R$ {valorPorPessoa.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Divisão personalizada */}
          {tipoDivisao === 'personalizado' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Valores por Pessoa</Label>
                <Button onClick={adicionarPessoa} size="sm">
                  Adicionar Pessoa
                </Button>
              </div>
              
              {divisaoPersonalizada.map((divisao, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome da pessoa"
                    value={divisao.pessoa}
                    onChange={(e) => {
                      const novasDivisoes = [...divisaoPersonalizada];
                      novasDivisoes[index].pessoa = e.target.value;
                      setDivisaoPersonalizada(novasDivisoes);
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor"
                    value={divisao.valor || ''}
                    onChange={(e) => atualizarValorPessoa(index, Number(e.target.value))}
                    className="w-32"
                  />
                  <Button
                    onClick={() => removerPessoa(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    Remover
                  </Button>
                </div>
              ))}

              {divisaoPersonalizada.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Total atribuído: R$ {totalPersonalizado.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">
                    Diferença: <span className={diferenca === 0 ? 'text-green-600' : 'text-red-600'}>
                      R$ {diferenca.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => void imprimirConta()}
              variant="outline"
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Só Imprimir
            </Button>
            <Button 
              onClick={() => void handleConfirmar()}
              disabled={tipoDivisao === 'personalizado' && Math.abs(diferenca) > 0.01}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Gerar e Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerarConta;
