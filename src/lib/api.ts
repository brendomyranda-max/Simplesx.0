/**
 * ============================================================
 * api.ts — Cliente HTTP do backend SQLite
 * ============================================================
 * Todas as operações do POS passam por /api/* (proxy Vite → :3001).
 * ============================================================
 */

import type {
  Produto,
  Categoria,
  Mesa,
  Comanda,
  VendaDia,
  Despesa,
} from '@/types/restaurant';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || data?.sucesso === false) {
    throw new ApiError(data?.erro || `Erro HTTP ${res.status}`, res.status);
  }

  return data as T;
}

export interface EstadoCompleto {
  sucesso: boolean;
  produtos: Produto[];
  categorias: Categoria[];
  mesas: Mesa[];
  comandas: Comanda[];
  vendas: VendaDia[];
  despesas: Despesa[];
}

export const api = {
  carregarEstado: () => request<EstadoCompleto>('/estado'),

  // Produtos
  listarProdutos: () =>
    request<{ sucesso: boolean; produtos: Produto[] }>('/produtos'),

  criarProduto: (produto: Omit<Produto, 'id'> & { id?: string }) =>
    request<{ sucesso: boolean; produto: Produto }>('/produtos', {
      method: 'POST',
      body: JSON.stringify(produto),
    }),

  atualizarProduto: (id: string, dados: Partial<Produto>) =>
    request<{ sucesso: boolean; produto: Produto }>(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),

  removerProduto: (id: string) =>
    request<{ sucesso: boolean }>(`/produtos/${id}`, { method: 'DELETE' }),

  // Categorias
  criarCategoria: (categoria: Omit<Categoria, 'id'> & { id?: string }) =>
    request<{ sucesso: boolean; categoria: Categoria }>('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoria),
    }),

  removerCategoria: (id: string) =>
    request<{ sucesso: boolean }>(`/categorias/${id}`, { method: 'DELETE' }),

  // Comandas
  abrirMesa: (comanda: Comanda) =>
    request<{
      sucesso: boolean;
      comanda: Comanda;
      mesas: Mesa[];
      comandas: Comanda[];
    }>('/comandas', {
      method: 'POST',
      body: JSON.stringify(comanda),
    }),

  atualizarComanda: (comanda: Comanda) =>
    request<{ sucesso: boolean; comanda: Comanda }>(`/comandas/${comanda.id}`, {
      method: 'PUT',
      body: JSON.stringify(comanda),
    }),

  fecharComanda: (comandaId: string, venda: VendaDia, mesa: number) =>
    request<{
      sucesso: boolean;
      venda: VendaDia;
      mesas: Mesa[];
      comandas: Comanda[];
      vendas: VendaDia[];
    }>(`/comandas/${comandaId}/fechar`, {
      method: 'POST',
      body: JSON.stringify({ venda, mesa }),
    }),

  excluirMesa: (comandaId: string, mesa: number, despesa?: Despesa) =>
    request<{
      sucesso: boolean;
      despesa: Despesa | null;
      mesas: Mesa[];
      comandas: Comanda[];
      despesas: Despesa[];
    }>(`/comandas/${comandaId}/excluir`, {
      method: 'POST',
      body: JSON.stringify({ mesa, despesa }),
    }),

  fecharMesaVazia: (comandaId: string, mesa: number) =>
    request<{
      sucesso: boolean;
      mesas: Mesa[];
      comandas: Comanda[];
    }>(`/comandas/${comandaId}/fechar-vazia`, {
      method: 'POST',
      body: JSON.stringify({ mesa }),
    }),
};
