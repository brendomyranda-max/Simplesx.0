/**
 * ============================================================
 * DividirConta.tsx
 * ============================================================
 * PAPEL: Modal de divisão de conta + gorjeta no fechamento da mesa.
 * QUEM USA: GerenciarComanda.tsx (ao clicar "Fechar Mesa").
 * O QUE FAZ:
 *   - Calcula gorjeta % e total com gorjeta.
 *   - Divisão igual (n pessoas) ou valores personalizados por pessoa.
 *   - onConfirmar devolve DivisaoConta para gerar a VendaDia.
 * NOTA: Interface DivisaoConta local espelha a de types/restaurant.
 * ============================================================
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Users, Percent } from 'lucide-react';

interface DividirContaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valorTotal: number;
  onConfirmar: (divisao: DivisaoConta) => void;
}

/** Payload de divisão confirmado no fechamento (exportado para o pai). */
export interface DivisaoConta {
  tipo: 'igual' | 'personalizado';
  pessoas: number;
  porcentagemGarcom: number;
  divisaoPersonalizada?: { pessoa: string; valor: number }[];
}

const DividirConta = ({ open, onOpenChange, valorTotal, onConfirmar }: DividirContaProps) => {
  // ── Estado do formulário de divisão ──
  const [tipoDivisao, setTipoDivisao] = useState<'igual' | 'personalizado'>('igual');
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [porcentagemGarcom, setPorcentagemGarcom] = useState(10);
  const [divisaoPersonalizada, setDivisaoPersonalizada] = useState<{ pessoa: string; valor: number }[]>([]);

  // ── Derivados financeiros ──
  const valorGarcom = (valorTotal * porcentagemGarcom) / 100;
  const valorComGarcom = valorTotal + valorGarcom;
  const valorPorPessoa = valorComGarcom / numeroPessoas;

  // ── Handlers divisão personalizada ──
  const adicionarPessoa = () => {
    setDivisaoPersonalizada([...divisaoPersonalizada, { pessoa: `Pessoa ${divisaoPersonalizada.length + 1}`, valor: 0 }]);
  };

  const atualizarValorPessoa = (index: number, valor: number) => {
    const novasDivisoes = [...divisaoPersonalizada];
    novasDivisoes[index].valor = valor;
    setDivisaoPersonalizada(novasDivisoes);
  };

  const removerPessoa = (index: number) => {
    setDivisaoPersonalizada(divisaoPersonalizada.filter((_, i) => i !== index));
  };

  // Diferença deve ser ~0 para habilitar confirmação no modo personalizado
  const totalPersonalizado = divisaoPersonalizada.reduce((acc, div) => acc + div.valor, 0);
  const diferenca = valorComGarcom - totalPersonalizado;

  const handleConfirmar = () => {
    const divisao: DivisaoConta = {
      tipo: tipoDivisao,
      pessoas: tipoDivisao === 'igual' ? numeroPessoas : divisaoPersonalizada.length,
      porcentagemGarcom,
      divisaoPersonalizada: tipoDivisao === 'personalizado' ? divisaoPersonalizada : undefined
    };
    onConfirmar(divisao);
  };

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Dividir Conta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da conta */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Valor da conta:</p>
                  <p className="font-semibold">R$ {valorTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gorjeta ({porcentagemGarcom}%):</p>
                  <p className="font-semibold">R$ {valorGarcom.toFixed(2)}</p>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-gray-600">Total com gorjeta:</p>
                  <p className="font-bold text-lg">R$ {valorComGarcom.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Porcentagem do garçom */}
          <div>
            <Label htmlFor="gorjeta" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Gorjeta do Garçom (%)
            </Label>
            <Input
              id="gorjeta"
              type="number"
              min="0"
              max="100"
              value={porcentagemGarcom}
              onChange={(e) => setPorcentagemGarcom(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          {/* Tipo de divisão */}
          <div>
            <Label>Tipo de Divisão</Label>
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
                    className="w-24"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={tipoDivisao === 'personalizado' && Math.abs(diferenca) > 0.01}
          >
            Confirmar Divisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DividirConta;
