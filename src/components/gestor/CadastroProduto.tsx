/**
 * ============================================================
 * CadastroProduto.tsx
 * ============================================================
 * PAPEL: Container do formulário de cadastro de produtos (gestor).
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ:
 *   - Mantém estado do formulário (ProductFormData).
 *   - Valida campos, monta Produto e chama onProdutoAdicionado.
 *   - Delega UI para ProductForm + CommentsManager.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Produto, Categoria } from '@/types/restaurant';
import { ProductFormData } from './types/ProductFormTypes';
import ProductForm from './components/ProductForm';

interface CadastroProdutoProps {
  onProdutoAdicionado: (produto: Produto) => void | Promise<void | Produto>;
  categorias: Categoria[];
}

const CadastroProduto = ({ onProdutoAdicionado, categorias }: CadastroProdutoProps) => {
  // ── Estado do formulário (strings para inputs controlados) ──
  const [formData, setFormData] = useState<ProductFormData>({
    nome: '',
    valor: '',
    cmv: '',
    categoria: '',
    comentarios: []
  });
  
  const { toast } = useToast();

  // ── Handlers ──

  const handleFormDataChange = (data: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      cmv: '',
      categoria: '',
      comentarios: []
    });
  };

  /**
   * Valida obrigatórios, parseia números, filtra comentários vazios
   * e grava no SQLite via API (useRestaurantData.adicionarProduto).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { nome, valor, cmv, categoria, comentarios } = formData;

    if (!nome || !valor || !cmv) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Nome, Valor e CMV)",
        variant: "destructive"
      });
      return;
    }

    const comentariosFiltrados = comentarios.filter(c => c && c.trim() !== '');

    const novoProduto: Produto = {
      id: Date.now().toString(),
      nome,
      valor: parseFloat(valor),
      cmv: parseFloat(cmv),
      categoria: categoria || 'Sem categoria',
      comentarios: comentariosFiltrados.length > 0 ? comentariosFiltrados : undefined
    };

    try {
      await onProdutoAdicionado(novoProduto);
      resetForm();
      toast({
        title: "Produto cadastrado no banco!",
        description: `${nome} salvo com ${comentariosFiltrados.length} observação(ões) automática(s)`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar no banco",
        description: err?.message || "Falha ao gravar produto",
        variant: "destructive",
      });
    }
  };

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Cadastrar Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm
          formData={formData}
          categorias={categorias}
          onFormDataChange={handleFormDataChange}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
};

export default CadastroProduto;
