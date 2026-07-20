/**
 * ============================================================
 * DespesasDia.tsx
 * ============================================================
 * PAPEL: Lista despesas registradas no dia atual.
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Filtra despesas com data = hoje.
 *   - Exibe total e detalhe (ex.: cancelamento de mesa + itens/CMV).
 * ============================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, DollarSign, Calendar } from 'lucide-react';
import { Despesa } from '@/types/restaurant';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DespesasDiaProps {
  despesas: Despesa[];
}

const DespesasDia = ({ despesas }: DespesasDiaProps) => {
  // ── Apenas despesas de hoje ──
  const despesasHoje = despesas.filter(despesa => {
    const hoje = new Date();
    const dataDespesa = despesa.data;
    return dataDespesa.toDateString() === hoje.toDateString();
  });

  const totalDespesas = despesasHoje.reduce((total, despesa) => total + despesa.valor, 0);

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Despesas do Dia
        </CardTitle>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-600">
            Total: R$ {totalDespesas.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {despesasHoje.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhuma despesa registrada hoje
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {despesasHoje.map((despesa) => (
              <div key={despesa.id} className="border rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-red-800">{despesa.descricao}</h4>
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Calendar className="h-3 w-3" />
                      {format(despesa.data, 'HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-700">
                      R$ {despesa.valor.toFixed(2)}
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {despesa.tipo === 'cancelamento_mesa' ? 'Cancelamento' : 'Outros'}
                    </Badge>
                  </div>
                </div>
                
                {/* Detalhe dos itens que geraram a despesa de CMV */}
                {despesa.itens && despesa.itens.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm font-medium text-red-700 mb-2">
                      Itens cancelados:
                    </p>
                    <div className="space-y-1">
                      {despesa.itens.map((item, index) => (
                        <div key={index} className="text-sm text-red-600 flex justify-between">
                          <span>{item.quantidade}x {item.produto_nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DespesasDia;
