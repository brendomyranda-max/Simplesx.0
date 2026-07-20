/**
 * ============================================================
 * VendasDia.tsx
 * ============================================================
 * PAPEL: Dashboard simples de vendas com filtro por data.
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Agrega bruto, gorjeta, custo e líquido das vendas filtradas.
 *   - Lista cada venda com itens e totais.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Calendar, DollarSign, TrendingUp, Percent, Users } from 'lucide-react';
import { VendaDia } from '@/types/restaurant';

interface VendasDiaProps {
  vendas: VendaDia[];
}

const VendasDia = ({ vendas }: VendasDiaProps) => {
  // ── Filtro opcional por dia (YYYY-MM-DD) ──
  const [filtroData, setFiltroData] = useState('');

  const vendasFiltradas = vendas.filter(venda => {
    if (!filtroData) return true;
    return venda.data.toISOString().split('T')[0] === filtroData;
  });

  // Soma dos indicadores financeiros no período filtrado
  const totalVendas = vendasFiltradas.reduce((acc, venda) => ({
    bruto: acc.bruto + venda.total_bruto,
    custo: acc.custo + venda.total_custo,
    liquido: acc.liquido + venda.total_liquido,
    gorjeta: acc.gorjeta + (venda.valor_gorjeta || 0)
  }), { bruto: 0, custo: 0, liquido: 0, gorjeta: 0 });

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Vendas do Dia
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="filtro-data" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Filtrar por data:
          </Label>
          <Input
            id="filtro-data"
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="w-auto"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Cards de KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Total Bruto</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              R$ {totalVendas.bruto.toFixed(2)}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700">
              <Percent className="h-5 w-5" />
              <span className="font-medium">Gorjetas</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">
              R$ {totalVendas.gorjeta.toFixed(2)}
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Total Custos</span>
            </div>
            <p className="text-2xl font-bold text-red-800">
              R$ {totalVendas.custo.toFixed(2)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Lucro Líquido</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              R$ {totalVendas.liquido.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {vendasFiltradas.map((venda) => (
            <div key={venda.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {venda.data.toLocaleDateString('pt-BR')} - {venda.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {venda.itens.map((item, index) => (
                      <p key={index}>
                        {item.quantidade}x {item.produto_nome} - R$ {(item.valor_unitario * item.quantidade).toFixed(2)}
                      </p>
                    ))}
                  </div>
                  {venda.divisao_conta && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {venda.divisao_conta.tipo === 'igual' 
                            ? `Dividido entre ${venda.divisao_conta.pessoas} pessoas`
                            : `Divisão personalizada (${venda.divisao_conta.pessoas} pessoas)`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Percent className="h-3 w-3" />
                        <span>Gorjeta: {venda.porcentagem_gorjeta}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Bruto: R$ {venda.total_bruto.toFixed(2)}
                  </p>
                  {venda.valor_gorjeta && (
                    <p className="text-sm text-purple-600">
                      Gorjeta: R$ {venda.valor_gorjeta.toFixed(2)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Custo: R$ {venda.total_custo.toFixed(2)}
                  </p>
                  <p className="font-medium text-green-600">
                    Lucro: R$ {venda.total_liquido.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {vendasFiltradas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma venda encontrada para este período
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendasDia;
