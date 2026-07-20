/**
 * ============================================================
 * RelatoriosAvancados.tsx
 * ============================================================
 * PAPEL: Relatórios gerenciais com filtros de período e garçom.
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Filtra vendas por intervalo de datas e garçom de fechamento.
 *   - Ranking top 10 produtos, performance por garçom e KPIs.
 *   - Abas de visualização e opção de exportação (se implementada).
 * ============================================================
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, Users, DollarSign, Download, Calendar } from 'lucide-react';
import { VendaDia } from '@/types/restaurant';

interface RelatoriosAvancadosProps {
  vendas: VendaDia[];
}

const RelatoriosAvancados = ({ vendas }: RelatoriosAvancadosProps) => {
  // ── Filtros de relatório ──
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroGarcom, setFiltroGarcom] = useState('todos');

  // ── Dados derivados (memoizados) ──

  // Filtrar vendas por período e garçom
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.data);
      const inicio = dataInicio ? new Date(dataInicio) : new Date('2000-01-01');
      const fim = dataFim ? new Date(dataFim) : new Date();
      
      const dentroDataRange = dataVenda >= inicio && dataVenda <= fim;
      const garcomMatch = filtroGarcom === 'todos' || venda.garcom_fechamento === filtroGarcom;
      
      return dentroDataRange && garcomMatch;
    });
  }, [vendas, dataInicio, dataFim, filtroGarcom]);

  // Ranking de produtos mais vendidos (ignora sufixo de observação no nome)
  const rankingProdutos = useMemo(() => {
    const produtos = new Map();
    
    vendasFiltradas.forEach(venda => {
      venda.itens.forEach(item => {
        const nomeProduto = item.produto_nome.split('(')[0].trim();
        const existente = produtos.get(nomeProduto) || {
          nome: nomeProduto,
          quantidade: 0,
          receita: 0,
          custo: 0
        };
        
        existente.quantidade += item.quantidade;
        existente.receita += item.valor_unitario * item.quantidade;
        produtos.set(nomeProduto, existente);
      });
    });
    
    return Array.from(produtos.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [vendasFiltradas]);

  // Performance por garçom (receita, gorjetas, ticket médio)
  const performanceGarcom = useMemo(() => {
    const garcons = new Map();
    
    vendasFiltradas.forEach(venda => {
      const garcom = venda.garcom_fechamento || 'Não informado';
      const existente = garcons.get(garcom) || {
        nome: garcom,
        vendas: 0,
        receita: 0,
        gorjetas: 0,
        ticketMedio: 0
      };
      
      existente.vendas++;
      existente.receita += venda.total_liquido;
      existente.gorjetas += venda.valor_gorjeta || 0;
      
      garcons.set(garcom, existente);
    });
    
    // Calcular ticket médio
    garcons.forEach(garcom => {
      garcom.ticketMedio = garcom.vendas > 0 ? garcom.receita / garcom.vendas : 0;
    });
    
    return Array.from(garcons.values())
      .sort((a, b) => b.receita - a.receita);
  }, [vendasFiltradas]);

  // Estatísticas gerais do período filtrado
  const estatisticas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const receitaTotal = vendasFiltradas.reduce((acc, v) => acc + v.total_liquido, 0);
    const custoTotal = vendasFiltradas.reduce((acc, v) => acc + v.total_custo, 0);
    const gorjetaTotal = vendasFiltradas.reduce((acc, v) => acc + (v.valor_gorjeta || 0), 0);
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;
    const margemLucro = receitaTotal > 0 ? ((receitaTotal - custoTotal) / receitaTotal) * 100 : 0;
    
    return {
      totalVendas,
      receitaTotal,
      custoTotal,
      gorjetaTotal,
      ticketMedio,
      margemLucro,
      lucroLiquido: receitaTotal - custoTotal
    };
  }, [vendasFiltradas]);

  // Lista de garçons para filtro
  const garcons = useMemo(() => {
    const lista = new Set();
    vendas.forEach(venda => {
      if (venda.garcom_fechamento) {
        lista.add(venda.garcom_fechamento);
      }
    });
    return Array.from(lista);
  }, [vendas]);

  const exportarRelatorio = () => {
    const dados = {
      periodo: `${dataInicio || 'Início'} até ${dataFim || 'Hoje'}`,
      estatisticas,
      rankingProdutos,
      performanceGarcom
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // ── Render: filtros + abas (resumo / produtos / garçons) ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Relatórios Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros de período e garçom */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div>
            <Label>Garçom</Label>
            <Select value={filtroGarcom} onValueChange={setFiltroGarcom}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Garçons</SelectItem>
                {garcons.map((garcom: string) => (
                  <SelectItem key={garcom} value={garcom}>{garcom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={exportarRelatorio} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="garcons">Garçons</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* Resumo Geral */}
          <TabsContent value="resumo" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Vendas</span>
                  </div>
                  <p className="text-2xl font-bold">{estatisticas.totalVendas}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Receita</span>
                  </div>
                  <p className="text-2xl font-bold">R$ {estatisticas.receitaTotal.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Ticket Médio</span>
                  </div>
                  <p className="text-2xl font-bold">R$ {estatisticas.ticketMedio.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Margem</span>
                  </div>
                  <p className="text-2xl font-bold">{estatisticas.margemLucro.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ranking de Produtos */}
          <TabsContent value="produtos" className="space-y-4">
            <h3 className="text-lg font-semibold">🏆 Top 10 Produtos Mais Vendidos</h3>
            <div className="space-y-2">
              {rankingProdutos.map((produto, index) => (
                <div key={produto.nome} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{produto.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{produto.quantidade} vendidos</p>
                    <p className="text-sm text-gray-600">R$ {produto.receita.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Performance dos Garçons */}
          <TabsContent value="garcons" className="space-y-4">
            <h3 className="text-lg font-semibold">👨‍💼 Performance por Garçom</h3>
            <div className="space-y-2">
              {performanceGarcom.map((garcom, index) => (
                <div key={garcom.nome} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 3 ? "default" : "outline"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{garcom.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{garcom.vendas} vendas</p>
                    <p className="text-sm text-green-600">R$ {garcom.receita.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">
                      Ticket: R$ {garcom.ticketMedio.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Análise Financeira */}
          <TabsContent value="financeiro" className="space-y-4">
            <h3 className="text-lg font-semibold">💰 Análise Financeira Detalhada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Receitas e Custos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Receita Bruta:</span>
                    <span className="font-bold text-green-600">
                      R$ {estatisticas.receitaTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo Total (CMV):</span>
                    <span className="font-bold text-red-600">
                      R$ {estatisticas.custoTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Lucro Líquido:</span>
                    <span className="font-bold text-blue-600">
                      R$ {estatisticas.lucroLiquido.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margem de Lucro:</span>
                    <span className="font-bold">
                      {estatisticas.margemLucro.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gorjetas e Métricas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total em Gorjetas:</span>
                    <span className="font-bold text-purple-600">
                      R$ {estatisticas.gorjetaTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket Médio:</span>
                    <span className="font-bold">
                      R$ {estatisticas.ticketMedio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Vendas:</span>
                    <span className="font-bold">
                      {estatisticas.totalVendas} comandas
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RelatoriosAvancados;