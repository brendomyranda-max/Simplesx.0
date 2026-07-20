/**
 * ============================================================
 * AdicionarProduto.tsx
 * ============================================================
 * PAPEL: Catálogo para lançar produtos no carrinho da mesa.
 * QUEM USA: GerenciarComanda.tsx.
 * O QUE FAZ:
 *   - Busca por nome e filtro por categoria.
 *   - Adição rápida ao carrinho ou com observações (ModalObservacoes).
 *   - Não grava na comanda direto — usa onAdicionarAoCarrinho.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, ShoppingCart, MessageSquare } from 'lucide-react';
import { Produto, Comanda } from '@/types/restaurant';
import { useToast } from '@/hooks/use-toast';
import ModalObservacoes from './ModalObservacoes';

interface AdicionarProdutoProps {
  produtos: Produto[];
  comanda: Comanda;
  onProdutoAdicionado: (comanda: Comanda) => void;
  onSairMesa: () => void;
  onAdicionarAoCarrinho?: (produto: Produto, quantidade: number, comentario?: string, garcom?: string) => void;
}

const AdicionarProduto = ({
  produtos,
  comanda,
  onSairMesa,
  onAdicionarAoCarrinho,
}: AdicionarProdutoProps) => {
  // ── Estado local: busca, categoria e modal de observações ──
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  const [modalObservacoes, setModalObservacoes] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const { toast } = useToast();

  // Categorias distintas derivadas do cardápio
  const categorias = [...new Set(produtos.map(p => p.categoria))].sort();

  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria === categoriaSelecionada;
    return matchBusca && matchCategoria;
  });

  // ── Handlers ──

  const abrirModalObservacoes = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalObservacoes(true);
  };

  const handleConfirmarModal = (quantidade: number, observacao?: string) => {
    if (!produtoSelecionado) return;
    adicionarProdutoAoCarrinho(produtoSelecionado, quantidade, observacao);
  };

  /** Encaminha para o carrinho da comanda (pai), com garçom da mesa. */
  const adicionarProdutoAoCarrinho = (produto: Produto, quantidade: number = 1, comentario?: string) => {
    if (onAdicionarAoCarrinho) {
      onAdicionarAoCarrinho(produto, quantidade, comentario, comanda.garcom);
    } else {
      toast({ title: 'Carrinho indisponível', variant: 'destructive' });
    }
  };

  // ── Card de produto na lista ──
  const renderProduto = (produto: Produto) => (
    <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium">{produto.nome}</h4>
        <p className="text-sm text-muted-foreground">R$ {produto.valor.toFixed(2)}</p>
        <Badge variant="secondary" className="text-xs">
          {produto.categoria}
        </Badge>
      </div>
      <div className="flex gap-1">
        {/* Adição rápida (qtd 1, sem obs) */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => adicionarProdutoAoCarrinho(produto)}
          title="Adicionar ao carrinho"
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
        {/* Abre modal de qtd + observações */}
        <Button
          size="sm"
          onClick={() => abrirModalObservacoes(produto)}
          title="Adicionar com observações"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Produtos - Mesa {comanda.mesa}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="busca" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="busca">Buscar Produtos</TabsTrigger>
            <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          </TabsList>

          {/* Aba busca: input + até 10 resultados */}
          <TabsContent value="busca" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome do produto..."
                  className="pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {produtosFiltrados.slice(0, 10).map(renderProduto)}
              {produtosFiltrados.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum produto encontrado
                </p>
              )}
            </div>
          </TabsContent>

          {/* Aba categorias: select + lista completa filtrada */}
          <TabsContent value="categorias" className="space-y-4">
            <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {produtosFiltrados.map(renderProduto)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <ModalObservacoes
        isOpen={modalObservacoes}
        onClose={() => setModalObservacoes(false)}
        produto={produtoSelecionado}
        onConfirmar={handleConfirmarModal}
      />
    </Card>
  );
};

export default AdicionarProduto;
