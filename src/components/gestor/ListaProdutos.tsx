/**
 * ============================================================
 * ListaProdutos.tsx
 * ============================================================
 * PAPEL: Catálogo do cardápio lido do SQLite (com exclusão).
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Busca por nome/categoria.
 *   - Agrupa produtos em tabelas por categoria.
 *   - Exibe valor, CMV, margem e observações.
 *   - Remove produto do banco sob demanda.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, DollarSign, TrendingDown, Trash2 } from 'lucide-react';
import { Produto } from '@/types/restaurant';
import { useToast } from '@/hooks/use-toast';

interface ListaProdutosProps {
  produtos: Produto[];
  onProdutoRemovido?: (id: string) => void | Promise<void>;
}

const ListaProdutos = ({ produtos, onProdutoRemovido }: ListaProdutosProps) => {
  // ── Estado: filtro de busca ──
  const [busca, setBusca] = useState('');
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemover = async (produto: Produto) => {
    if (!onProdutoRemovido) return;
    if (!window.confirm(`Remover "${produto.nome}" do cardápio?`)) return;

    try {
      setRemovendoId(produto.id);
      await onProdutoRemovido(produto.id);
      toast({
        title: 'Produto removido',
        description: `${produto.nome} apagado do banco de dados`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err?.message || 'Falha ao apagar produto no banco',
        variant: 'destructive',
      });
    } finally {
      setRemovendoId(null);
    }
  };

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  // Agrupar produtos por categoria dinamicamente
  const categorias = [...new Set(produtos.map(p => p.categoria))].sort();
  
  const produtosPorCategoria = categorias.reduce((acc, categoria) => {
    acc[categoria] = produtosFiltrados.filter(produto => produto.categoria === categoria);
    return acc;
  }, {} as Record<string, Produto[]>);

  /** Cor de badge determinística a partir do nome da categoria. */
  const getCategoriaColor = (categoria: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-primary/10 text-foreground',
      'bg-gray-100 text-gray-800'
    ];
    const index = categoria.length % colors.length;
    return colors[index];
  };

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Lista de Produtos ({produtos.length} total)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar produto ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Uma tabela por categoria (só se houver produtos filtrados) */}
        <div className="space-y-6">
          {categorias.map((categoria) => {
            const produtosCategoria = produtosPorCategoria[categoria];
            
            if (produtosCategoria.length === 0) return null;

            return (
              <div key={categoria}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getCategoriaColor(categoria)}>
                    {categoria} ({produtosCategoria.length})
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">CMV</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        {onProdutoRemovido && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosCategoria.map((produto) => {
                        const margem = produto.valor > 0
                          ? ((produto.valor - produto.cmv) / produto.valor * 100)
                          : 0;
                        return (
                          <TableRow key={produto.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{produto.nome}</p>
                                {produto.imagem && (
                                  <p className="text-xs text-gray-500">Com imagem</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(produto.comentarios || []).length > 0 ? (
                                  produto.comentarios!.map((c, i) => (
                                    <Badge key={i} variant="outline" className="text-xs font-normal">
                                      {c}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-600">
                                  R$ {produto.valor.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TrendingDown className="h-3 w-3 text-red-600" />
                                <span className="text-red-600">
                                  R$ {produto.cmv.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${margem > 60 ? 'text-green-600' : margem > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {margem.toFixed(1)}%
                              </span>
                            </TableCell>
                            {onProdutoRemovido && (
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={removendoId === produto.id}
                                  onClick={() => handleRemover(produto)}
                                  title="Remover do banco"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
          
          {produtosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {busca ? 'Nenhum produto encontrado para esta busca' : 'Nenhum produto cadastrado'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListaProdutos;
