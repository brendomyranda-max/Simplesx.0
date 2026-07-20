/**
 * ============================================================
 * useRestaurantData.ts
 * ============================================================
 * PAPEL: Hook central de estado do restaurante (fonte da verdade do POS).
 * QUEM USA: pages/Index.tsx (e indiretamente todos os componentes de UI).
 * O QUE FAZ:
 *   - Carrega e persiste produtos, categorias, mesas, comandas, vendas
 *     e despesas no banco SQLite via API (/api/*).
 *   - Expõe as mesmas ações de antes (abrir/fechar mesa, cadastrar
 *     produto com observações, fechar com cálculo bruto/líquido/gorjeta).
 * FLUXO: Index monta o hook → fetch /api/estado → UI chama ações
 *        → API grava no SQLite → state atualizado.
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Produto,
  Mesa,
  Comanda,
  VendaDia,
  Categoria,
  Despesa,
} from '@/types/restaurant';
import { api } from '@/lib/api';

function normalizarDatasVendas(vendas: VendaDia[]): VendaDia[] {
  return vendas.map((venda) => ({
    ...venda,
    data: typeof venda.data === 'string' ? new Date(venda.data) : new Date(venda.data),
  }));
}

function normalizarDatasDespesas(despesas: Despesa[]): Despesa[] {
  return despesas.map((despesa) => ({
    ...despesa,
    data:
      typeof despesa.data === 'string' ? new Date(despesa.data) : new Date(despesa.data),
  }));
}

export function useRestaurantData() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [vendas, setVendas] = useState<VendaDia[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  /** Carrega snapshot completo do SQLite. */
  const recarregar = useCallback(async () => {
    try {
      setErro(null);
      const estado = await api.carregarEstado();
      setProdutos(estado.produtos || []);
      setCategorias(estado.categorias || []);
      setMesas(estado.mesas || []);
      setComandas(estado.comandas || []);
      setVendas(normalizarDatasVendas(estado.vendas || []));
      setDespesas(normalizarDatasDespesas(estado.despesas || []));
    } catch (e: any) {
      console.error('Erro ao carregar estado do banco:', e);
      setErro(
        e?.message ||
          'Não foi possível conectar ao banco. Rode: npm run server'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // ── Ações de cadastro (gestor) — gravam no SQLite ──

  /** Cria produto no banco (valor, CMV, categoria e observações automáticas). */
  const adicionarProduto = async (produto: Produto) => {
    const { produto: criado } = await api.criarProduto(produto);
    setProdutos((prev) => [...prev, criado]);
    return criado;
  };

  /** Atualiza produto e observações no SQLite. */
  const atualizarProduto = async (id: string, dados: Partial<Produto>) => {
    const { produto: atualizado } = await api.atualizarProduto(id, dados);
    setProdutos((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
    return atualizado;
  };

  /** Remove produto (e suas observações) do SQLite. */
  const removerProduto = async (id: string) => {
    await api.removerProduto(id);
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  const adicionarCategoria = async (categoria: Categoria) => {
    const { categoria: criada } = await api.criarCategoria(categoria);
    setCategorias((prev) => [...prev, criada]);
    return criada;
  };

  const removerCategoria = async (id: string) => {
    await api.removerCategoria(id);
    setCategorias((prev) => prev.filter((cat) => cat.id !== id));
  };

  // ── Ações de comanda / mesa (principal) ──

  /** Atualiza itens da comanda no banco (lançamento de pedidos). */
  const atualizarComanda = async (comandaAtualizada: Comanda) => {
    const { comanda } = await api.atualizarComanda(comandaAtualizada);
    setComandas((prev) => prev.map((c) => (c.id === comanda.id ? comanda : c)));
    return comanda;
  };

  /**
   * Fecha comanda: grava venda (bruto, líquido, custo, gorjeta %) e libera mesa.
   */
  const fecharComanda = async (
    venda: VendaDia,
    comandaId: string,
    mesaNumero: number
  ) => {
    const vendaComData = {
      ...venda,
      data: new Date(),
    };

    const resp = await api.fecharComanda(comandaId, vendaComData, mesaNumero);
    setVendas(normalizarDatasVendas(resp.vendas || []));
    setComandas(resp.comandas || []);
    setMesas(resp.mesas || []);
    return resp.venda;
  };

  /**
   * Cancela mesa: despesa de CMV no banco, remove comanda e libera mesa.
   */
  const excluirMesa = async (comandaId: string, mesaNumero: number) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) {
      console.error('Comanda não encontrada');
      return;
    }

    const valorCMV = comanda.itens.reduce((total, item) => {
      const produto = produtos.find(
        (p) => p.nome === item.produto_nome || item.produto_nome.startsWith(p.nome)
      );
      return total + (produto?.cmv || 0) * item.quantidade;
    }, 0);

    const novaDespesa: Despesa = {
      id: Date.now().toString(),
      descricao: `Cancelamento Mesa ${mesaNumero}`,
      valor: valorCMV,
      tipo: 'cancelamento_mesa',
      itens: [...comanda.itens],
      mesa: mesaNumero,
      data: new Date(),
    };

    const resp = await api.excluirMesa(comandaId, mesaNumero, novaDespesa);
    setDespesas(normalizarDatasDespesas(resp.despesas || []));
    setComandas(resp.comandas || []);
    setMesas(resp.mesas || []);
  };

  /** Abre mesa e cria comanda no banco. */
  const abrirMesa = async (novaComanda: Comanda) => {
    const resp = await api.abrirMesa(novaComanda);
    setComandas(resp.comandas || []);
    setMesas(resp.mesas || []);
    return resp.comanda;
  };

  /** Fecha mesa sem itens, sem venda. */
  const fecharMesaVazia = async (comandaId: string, mesaNumero: number) => {
    const resp = await api.fecharMesaVazia(comandaId, mesaNumero);
    setComandas(resp.comandas || []);
    setMesas(resp.mesas || []);
  };

  const obterComandaAtualizada = useCallback(
    (comandaId: string): Comanda | null => {
      return comandas.find((c) => c.id === comandaId) || null;
    },
    [comandas]
  );

  return {
    produtos,
    categorias,
    mesas,
    comandas,
    vendas,
    despesas,
    carregando,
    erro,
    recarregar,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    adicionarCategoria,
    removerCategoria,
    atualizarComanda,
    fecharComanda,
    excluirMesa,
    abrirMesa,
    fecharMesaVazia,
    obterComandaAtualizada,
  };
}
