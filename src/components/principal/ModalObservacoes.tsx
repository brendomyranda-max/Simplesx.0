/**
 * ============================================================
 * ModalObservacoes.tsx
 * ============================================================
 * PAPEL: Modal para quantidade e observações ao lançar produto.
 * QUEM USA: AdicionarProduto.tsx.
 * O QUE FAZ:
 *   - Define quantidade.
 *   - Mostra só as observações cadastradas no produto (SQLite).
 *   - Se o produto não tiver observações, não mostra chips prontos.
 *   - Permite observação personalizada digitada na hora.
 * ============================================================
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { Produto } from '@/types/restaurant';

interface ModalObservacoesProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onConfirmar: (quantidade: number, observacao?: string) => void;
}

const ModalObservacoes = ({ isOpen, onClose, produto, onConfirmar }: ModalObservacoesProps) => {
  // ── Estado local ──
  const [quantidade, setQuantidade] = useState(1);
  const [observacaoPersonalizada, setObservacaoPersonalizada] = useState('');
  const [observacoesSelecionadas, setObservacoesSelecionadas] = useState<string[]>([]);

  // Somente observações salvas no banco para ESTE produto (sem lista genérica)
  const observacoesDoProduto = (produto?.comentarios || [])
    .map((c) => String(c).trim())
    .filter(Boolean);

  // ── Handlers ──

  /** Toggle de chip de observação do produto. */
  const handleObservacaoClick = (obs: string) => {
    if (observacoesSelecionadas.includes(obs)) {
      setObservacoesSelecionadas((prev) => prev.filter((o) => o !== obs));
    } else {
      setObservacoesSelecionadas((prev) => [...prev, obs]);
    }
  };

  const adicionarObservacaoPersonalizada = () => {
    const texto = observacaoPersonalizada.trim();
    if (texto && !observacoesSelecionadas.includes(texto)) {
      setObservacoesSelecionadas((prev) => [...prev, texto]);
      setObservacaoPersonalizada('');
    }
  };

  const removerObservacao = (obs: string) => {
    setObservacoesSelecionadas((prev) => prev.filter((o) => o !== obs));
  };

  /** Junta observações em string separada por vírgula e confirma. */
  const handleConfirmar = () => {
    const observacaoFinal =
      observacoesSelecionadas.length > 0
        ? observacoesSelecionadas.join(', ')
        : undefined;

    onConfirmar(quantidade, observacaoFinal);
    handleClose();
  };

  /** Reseta estado e fecha o modal. */
  const handleClose = () => {
    setQuantidade(1);
    setObservacaoPersonalizada('');
    setObservacoesSelecionadas([]);
    onClose();
  };

  if (!produto) return null;

  // ── Render ──
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ao Carrinho</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produto Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium">{produto.nome}</h3>
            <p className="text-sm text-gray-600">R$ {produto.valor.toFixed(2)}</p>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="h-8 w-8 p-0"
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantidade(quantidade + 1)}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Só chips do produto; se vazio, não mostra lista pré-salva */}
          {observacoesDoProduto.length > 0 ? (
            <div className="space-y-2">
              <Label>Observações do produto</Label>
              <div className="flex flex-wrap gap-2">
                {observacoesDoProduto.map((obs) => (
                  <Badge
                    key={`prod-${obs}`}
                    variant={observacoesSelecionadas.includes(obs) ? 'default' : 'secondary'}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => handleObservacaoClick(obs)}
                  >
                    {obs}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Este produto não tem observações cadastradas. Use o campo abaixo se precisar de alguma.
            </p>
          )}

          {/* Observação Personalizada (sempre disponível na hora do pedido) */}
          <div className="space-y-2">
            <Label>Observação personalizada</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma observação..."
                value={observacaoPersonalizada}
                onChange={(e) => setObservacaoPersonalizada(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionarObservacaoPersonalizada()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={adicionarObservacaoPersonalizada}
                disabled={!observacaoPersonalizada.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Observações Selecionadas */}
          {observacoesSelecionadas.length > 0 && (
            <div className="space-y-2">
              <Label>Observações selecionadas</Label>
              <div className="flex flex-wrap gap-2">
                {observacoesSelecionadas.map((obs) => (
                  <Badge key={obs} variant="secondary" className="flex items-center gap-1">
                    {obs}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removerObservacao(obs)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 border-t">
            <p className="font-medium text-right">
              Total: R$ {(produto.valor * quantidade).toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>
            Adicionar ao Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalObservacoes;
