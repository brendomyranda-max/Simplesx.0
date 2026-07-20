/**
 * ============================================================
 * ProductFormTypes.ts
 * ============================================================
 * PAPEL: Tipos do formulário de cadastro de produto (gestor).
 * QUEM USA: CadastroProduto.tsx e ProductForm.tsx.
 * O QUE FAZ:
 *   - ProductFormData: campos do form (valores em string nos inputs).
 *   - ProductFormErrors: mapa opcional de erros de validação por campo.
 * ============================================================
 */

/** Estado do formulário — strings para inputs controlados. */
export interface ProductFormData {
  nome: string;
  valor: string;
  cmv: string;
  categoria: string;
  /** Comentários/opções rápidas sugeridas ao lançar o item */
  comentarios: string[];
}

/** Erros de validação por campo (se a UI exibir). */
export interface ProductFormErrors {
  nome?: string;
  valor?: string;
  cmv?: string;
}
