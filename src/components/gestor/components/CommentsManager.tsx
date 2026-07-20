/**
 * ============================================================
 * CommentsManager.tsx
 * ============================================================
 * PAPEL: Editor de lista de comentários/opções rápidas do produto.
 * QUEM USA: ProductForm.tsx (cadastro de produto).
 * O QUE FAZ:
 *   - Adiciona, edita e remove strings de comentário.
 *   - Garante pelo menos um campo vazio visível na UI.
 *   - Esses textos viram sugestões ao lançar o item na comanda.
 * ============================================================
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, MessageSquare, X } from 'lucide-react';

interface CommentsManagerProps {
  comentarios: string[];
  onComentariosChange: (comentarios: string[]) => void;
}

const CommentsManager = ({ comentarios, onComentariosChange }: CommentsManagerProps) => {
  // Garantir que sempre temos pelo menos um campo de comentário
  const comentariosExibidos = comentarios.length === 0 ? [''] : comentarios;

  // ── Handlers ──

  const adicionarComentario = () => {
    onComentariosChange([...comentariosExibidos, '']);
  };

  const removerComentario = (index: number) => {
    const novosComentarios = comentariosExibidos.filter((_, i) => i !== index);
    onComentariosChange(novosComentarios);
  };

  const atualizarComentario = (index: number, valor: string) => {
    const novosComentarios = [...comentariosExibidos];
    novosComentarios[index] = valor;
    onComentariosChange(novosComentarios);
  };

  // ── Render ──
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comentários Automáticos
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarComentario}
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </div>
      
      <div className="space-y-2">
        {comentariosExibidos.map((comentario, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={comentario}
              onChange={(e) => atualizarComentario(index, e.target.value)}
              placeholder={`Comentário ${index + 1} (ex: Sem cebola, Ponto da carne, etc.)`}
              className="flex-1"
            />
            {comentariosExibidos.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removerComentario(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Os comentários aparecerão como opções rápidas ao adicionar o produto na comanda
      </p>
    </div>
  );
};

export default CommentsManager;
