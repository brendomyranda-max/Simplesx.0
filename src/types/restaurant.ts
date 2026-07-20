/**
 * ============================================================
 * restaurant.ts
 * ============================================================
 * PAPEL: Tipos de domínio do sistema de restaurante (POS).
 * QUEM USA: hooks (useRestaurantData), páginas (Index) e componentes
 *           principal/* e gestor/* em todo o app.
 * O QUE FAZ: Define interfaces TypeScript para produtos, mesas, comandas,
 *            itens, vendas, despesas, categorias e divisão de conta.
 *            Não contém lógica — apenas contratos de dados.
 * ============================================================
 */

// ── Produto do cardápio ──
export interface Produto {
  id: string;
  nome: string;
  valor: number;
  /** Custo da mercadoria vendida (CMV) — usado em relatórios de margem */
  cmv: number;
  imagem?: string;
  categoria: string;
  /** Observações/opções rápidas sugeridas ao lançar o item (ex.: "Sem cebola") */
  comentarios?: string[];
}

// ── Item lançado em uma comanda ──
export interface ItemComanda {
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  garcom?: string; // Adicionado para identificar quem lançou
}

// ── Comanda aberta/fechada vinculada a uma mesa ──
export interface Comanda {
  id: string;
  mesa: number;
  itens: ItemComanda[];
  valor_total: number;
  status: 'aberta' | 'fechada';
  /** Número de pessoas na mesa (para divisão de conta) */
  pessoas: number;
  split_ativo: boolean;
  /** Identificadores/nomes por pessoa quando há split */
  por_pessoa: string[];
  garcom?: string; // Garçom responsável pela mesa
}

// ── Como a conta foi dividida no fechamento ──
export interface DivisaoConta {
  tipo: 'igual' | 'personalizado';
  pessoas: number;
  porcentagemGarcom: number;
  divisaoPersonalizada?: { pessoa: string; valor: number }[];
  garcom_fechamento?: string; // Quem fechou a conta
}

// ── Venda registrada no dia (após fechar comanda) ──
export interface VendaDia {
  id: string;
  itens: ItemComanda[];
  total_bruto: number;
  total_liquido: number;
  total_custo: number;
  valor_gorjeta?: number;
  porcentagem_gorjeta?: number;
  divisao_conta?: DivisaoConta;
  data: Date;
  garcom_fechamento?: string;
}

// ── Despesa do dia (ex.: cancelamento de mesa com itens) ──
export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'cancelamento_mesa' | 'outros';
  itens?: ItemComanda[];
  mesa?: number;
  data: Date;
}

// ── Mesa física do salão ──
export interface Mesa {
  numero: number;
  status: 'disponivel' | 'ocupada';
  /** ID da comanda ativa quando ocupada */
  comanda_id?: string;
}

// ── Categoria de cardápio (com cor para UI) ──
export interface Categoria {
  id: string;
  nome: string;
  cor: string;
}
