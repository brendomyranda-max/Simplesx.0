/**
 * ============================================================
 * ProductForm.tsx
 * ============================================================
 * PAPEL: Formulário presentacional de cadastro de produto.
 * QUEM USA: CadastroProduto.tsx.
 * O QUE FAZ:
 *   - Campos nome, valor, CMV, categoria e comentários.
 *   - Controlado: mudanças via onFormDataChange; submit via onSubmit.
 * ============================================================
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, Tag } from 'lucide-react';
import { Categoria } from '@/types/restaurant';
import { ProductFormData } from '../types/ProductFormTypes';
import CommentsManager from './CommentsManager';

interface ProductFormProps {
  formData: ProductFormData;
  categorias: Categoria[];
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProductForm = ({ formData, categorias, onFormDataChange, onSubmit }: ProductFormProps) => {
  const { nome, valor, cmv, categoria, comentarios } = formData;

  // ── Render ──
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Nome do produto */}
      <div>
        <Label htmlFor="nome">Nome do Produto *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => onFormDataChange({ nome: e.target.value })}
          placeholder="Ex: Hambúrguer Artesanal"
          required
        />
      </div>

      {/* Preço de venda e custo (CMV) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valor" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Valor de Venda (R$) *
          </Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => onFormDataChange({ valor: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="cmv" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            CMV (R$) *
          </Label>
          <Input
            id="cmv"
            type="number"
            step="0.01"
            value={cmv}
            onChange={(e) => onFormDataChange({ cmv: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Categoria opcional (fallback "Sem categoria" no submit do pai) */}
      <div>
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Categoria (opcional)
        </Label>
        <Select value={categoria} onValueChange={(value) => onFormDataChange({ categoria: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.nome}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cat.cor }}
                  />
                  {cat.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Se não selecionada, será definida como "Sem categoria"
        </p>
      </div>

      {/* Comentários automáticos (opções rápidas na comanda) */}
      <CommentsManager
        comentarios={comentarios}
        onComentariosChange={(novosComentarios) => onFormDataChange({ comentarios: novosComentarios })}
      />

      <Button type="submit" className="w-full bg-primary/50 hover:bg-primary/90">
        <Plus className="h-4 w-4 mr-2" />
        Cadastrar Produto
      </Button>
    </form>
  );
};

export default ProductForm;
