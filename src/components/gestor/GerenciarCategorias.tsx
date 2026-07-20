/**
 * ============================================================
 * GerenciarCategorias.tsx
 * ============================================================
 * PAPEL: CRUD simples de categorias de cardápio (criar/listar/remover).
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Cria categoria com nome + cor (paleta fixa).
 *   - Impede nomes duplicados (case-insensitive).
 *   - Remove por id via callback do pai.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Categoria } from '@/types/restaurant';

interface GerenciarCategoriasProps {
  categorias: Categoria[];
  onCategoriaAdicionada: (categoria: Categoria) => void;
  onCategoriaRemovida: (id: string) => void;
}

const GerenciarCategorias = ({ categorias, onCategoriaAdicionada, onCategoriaRemovida }: GerenciarCategoriasProps) => {
  // ── Estado do formulário de nova categoria ──
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3B82F6');
  const { toast } = useToast();

  // Paleta de cores disponíveis para badge/UI
  const cores = [
    { nome: 'Azul', valor: '#3B82F6' },
    { nome: 'Verde', valor: '#10B981' },
    { nome: 'Vermelho', valor: '#EF4444' },
    { nome: 'Amarelo', valor: '#F59E0B' },
    { nome: 'Roxo', valor: '#8B5CF6' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Laranja', valor: '#F97316' },
    { nome: 'Cinza', valor: '#6B7280' }
  ];

  // ── Handlers ──

  /** Valida e adiciona categoria (nome único). */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da categoria",
        variant: "destructive"
      });
      return;
    }

    if (categorias.some(cat => cat.nome.toLowerCase() === nome.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome",
        variant: "destructive"
      });
      return;
    }

    const novaCategoria: Categoria = {
      id: Date.now().toString(),
      nome: nome.trim(),
      cor
    };

    onCategoriaAdicionada(novaCategoria);
    setNome('');
    setCor('#3B82F6');

    toast({
      title: "Sucesso!",
      description: "Categoria adicionada com sucesso",
    });
  };

  const removerCategoria = (id: string) => {
    onCategoriaRemovida(id);
    toast({
      title: "Categoria removida",
      description: "A categoria foi removida com sucesso",
    });
  };

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Gerenciar Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome-categoria">Nome da Categoria</Label>
            <Input
              id="nome-categoria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bebidas Geladas"
              required
            />
          </div>

          <div>
            <Label>Cor da Categoria</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {cores.map((corItem) => (
                <button
                  key={corItem.valor}
                  type="button"
                  onClick={() => setCor(corItem.valor)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    cor === corItem.valor ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: corItem.valor }}
                  title={corItem.nome}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary/50 hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Categoria
          </Button>
        </form>

        <div className="space-y-3">
          <h3 className="font-medium">Categorias Existentes ({categorias.length})</h3>
          {categorias.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma categoria personalizada</p>
          ) : (
            <div className="space-y-2">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <Badge style={{ backgroundColor: categoria.cor, color: 'white' }}>
                    {categoria.nome}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerCategoria(categoria.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GerenciarCategorias;
