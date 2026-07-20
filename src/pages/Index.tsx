/**
 * ============================================================
 * Index.tsx
 * ============================================================
 * PAPEL: Página principal do POS — orquestra as abas Principal e Gestor.
 * QUEM USA: App.tsx (rota "/").
 * O QUE FAZ:
 *   - Consome o hook useRestaurantData (estado global do restaurante).
 *   - Controla o fluxo de navegação do atendimento:
 *       selecionar mesa → abrir mesa → gerenciar comanda → mesas abertas
 *   - Aba "Principal": operação de salão (garçom, mesas, comandas).
 *   - Aba "Gestor": cadastros, categorias, produtos, vendas, despesas, relatórios.
 * FLUXO:
 *   1. Garçom informa nome e opcionalmente filtra "meus pedidos".
 *   2. Seleciona mesa livre (abrir) ou ocupada (gerenciar comanda).
 *   3. Pode listar mesas abertas e retornar à seleção.
 *   4. Ao fechar comanda, registra venda e volta à seleção.
 * ============================================================
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Coffee } from 'lucide-react';
import Header from '@/components/Header';
import CadastroProduto from '@/components/gestor/CadastroProduto';
import CadastroMesas from '@/components/gestor/CadastroMesas';
import VendasDia from '@/components/gestor/VendasDia';
import DespesasDia from '@/components/gestor/DespesasDia';
import ListaProdutos from '@/components/gestor/ListaProdutos';
import GerenciarCategorias from '@/components/gestor/GerenciarCategorias';
import RelatoriosAvancados from '@/components/gestor/RelatoriosAvancados';
import SelecionarMesa from '@/components/principal/SelecionarMesa';
import AbrirMesa from '@/components/principal/AbrirMesa';
import GerenciarComanda from '@/components/principal/GerenciarComanda';
import MesasAbertas from '@/components/principal/MesasAbertas';
import FiltroGarcom from '@/components/principal/FiltroGarcom';
import { Mesa, Comanda, VendaDia } from '@/types/restaurant';
import { useRestaurantData } from '@/hooks/useRestaurantData';

const Index = () => {
  // ── Dados e ações persistidos no SQLite via API ──
  const {
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
    removerProduto,
    adicionarCategoria,
    removerCategoria,
    atualizarComanda,
    fecharComanda,
    excluirMesa,
    abrirMesa,
    fecharMesaVazia,
    obterComandaAtualizada
  } = useRestaurantData();

  // ── Estados de navegação do fluxo de atendimento ──
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [comandaAtiva, setComandaAtiva] = useState<Comanda | null>(null);
  const [modo, setModo] = useState<'selecionar' | 'abrir' | 'gerenciar' | 'mesas-abertas'>('selecionar');
  
  // ── Estados do garçom (filtro e atribuição em comandas/vendas) ──
  const [garcomAtual, setGarcomAtual] = useState('');
  const [filtrarMeusPedidos, setFiltrarMeusPedidos] = useState(false);

  // ── Handlers de navegação e fluxo de mesas ──

  /**
   * Seleciona uma mesa no mapa.
   * Se ocupada com comanda, abre o gerenciamento; senão, fluxo de abertura.
   */
  const selecionarMesa = (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    
    if (mesa.status === 'ocupada' && mesa.comanda_id) {
      const comanda = obterComandaAtualizada(mesa.comanda_id);
      if (comanda) {
        setComandaAtiva(comanda);
        setModo('gerenciar');
      }
    } else {
      setModo('abrir');
    }
  };

  /**
   * Abre mesa com a comanda recém-criada, anexando o garçom atual se informado.
   */
  const handleAbrirMesa = async (novaComanda: Comanda) => {
    const comandaComGarcom = garcomAtual ? { ...novaComanda, garcom: garcomAtual } : novaComanda;
    const salva = await abrirMesa(comandaComGarcom);
    setComandaAtiva(salva || comandaComGarcom);
    setModo('gerenciar');
  };

  /**
   * Fecha a comanda ativa, registra a venda (com garçom de fechamento) e volta à seleção.
   */
  const handleFecharComanda = async (venda: VendaDia) => {
    if (!comandaAtiva) return;
    
    const vendaComGarcom = garcomAtual ? { 
      ...venda, 
      garcom_fechamento: garcomAtual,
      divisao_conta: venda.divisao_conta ? {
        ...venda.divisao_conta,
        garcom_fechamento: garcomAtual
      } : undefined
    } : venda;
    
    await fecharComanda(vendaComGarcom, comandaAtiva.id, comandaAtiva.mesa);
    voltarParaSelecao();
  };

  /** Exclui mesa/comanda e retorna à tela de seleção. */
  const handleExcluirMesa = async (comandaId: string, mesaNumero: number) => {
    await excluirMesa(comandaId, mesaNumero);
    voltarParaSelecao();
  };

  /** Fecha mesa vazia sem gerar venda (sem navegar de volta automaticamente). */
  const handleFecharMesaVazia = async (comandaId: string, mesaNumero: number) => {
    await fecharMesaVazia(comandaId, mesaNumero);
  };

  /** Limpa seleção e volta ao modo "selecionar mesa". */
  const voltarParaSelecao = () => {
    setMesaSelecionada(null);
    setComandaAtiva(null);
    setModo('selecionar');
  };

  /** Navega para a lista de mesas/comandas abertas. */
  const irParaMesasAbertas = () => {
    setModo('mesas-abertas');
  };

  /** Abre o gerenciamento de uma comanda já aberta (a partir da lista). */
  const selecionarComandaAtiva = (comanda: Comanda) => {
    setComandaAtiva(comanda);
    setModo('gerenciar');
  };

  // Comandas com status "aberta" (usadas na lista e no gerenciamento)
  const comandasAbertas = comandas.filter(c => c.status === 'aberta');

  // ── Loading / erro de conexão com o banco ──
  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700">Carregando dados do banco...</p>
          <p className="text-sm text-gray-500">Conectando ao SQLite via API</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 space-y-4 text-center">
          <p className="text-lg font-semibold text-red-700">Banco de dados indisponível</p>
          <p className="text-sm text-gray-600">{erro}</p>
          <p className="text-xs text-gray-500">
            Em um terminal rode: <code className="bg-gray-100 px-1 rounded">npm run server</code>
          </p>
          <button
            type="button"
            onClick={() => recarregar()}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto p-4">
        {/* Abas principais: operação de salão vs. gestão administrativa */}
        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="principal" className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Principal
            </TabsTrigger>
            <TabsTrigger value="gestor" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestor
            </TabsTrigger>
          </TabsList>

          {/* ── Aba Gestor: cadastros, produtos, relatórios e financeiro do dia ── */}
          <TabsContent value="gestor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CadastroProduto 
                onProdutoAdicionado={adicionarProduto} 
                categorias={categorias}
              />
              <CadastroMesas mesas={mesas} />
            </div>
            <GerenciarCategorias
              categorias={categorias}
              onCategoriaAdicionada={adicionarCategoria}
              onCategoriaRemovida={removerCategoria}
            />
            <ListaProdutos produtos={produtos} onProdutoRemovido={removerProduto} />
            <RelatoriosAvancados vendas={vendas} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VendasDia vendas={vendas} />
              <DespesasDia despesas={despesas} />
            </div>
          </TabsContent>

          {/* ── Aba Principal: fluxo de atendimento por mesa/comanda ── */}
          <TabsContent value="principal">
            {/* Filtro do Garçom - sempre visível */}
            <FiltroGarcom
              garcomAtual={garcomAtual}
              filtrarMeus={filtrarMeusPedidos}
              onGarcomChange={setGarcomAtual}
              onFiltroMeusChange={setFiltrarMeusPedidos}
            />

            {/* Tela de seleção de mesas (mapa de mesas) */}
            {modo === 'selecionar' && (
              <SelecionarMesa 
                mesas={mesas} 
                onSelecionarMesa={selecionarMesa}
                comandasAbertas={comandasAbertas}
                onVerMesasAbertas={irParaMesasAbertas}
              />
            )}

            {/* Lista de mesas/comandas abertas */}
            {modo === 'mesas-abertas' && (
              <MesasAbertas
                comandas={comandasAbertas}
                onSelecionarComanda={selecionarComandaAtiva}
                onVoltar={voltarParaSelecao}
                onFecharMesaVazia={handleFecharMesaVazia}
                garcomAtual={garcomAtual}
                filtrarPorGarcom={filtrarMeusPedidos}
              />
            )}
            
            {/* Formulário de abertura de mesa livre */}
            {modo === 'abrir' && mesaSelecionada && (
              <AbrirMesa 
                mesa={mesaSelecionada}
                onMesaAberta={handleAbrirMesa}
                onVoltar={voltarParaSelecao}
              />
            )}
            
            {/* Gerenciamento completo da comanda (itens, conta, impressão) */}
            {modo === 'gerenciar' && comandaAtiva && (
              <GerenciarComanda
                comanda={comandaAtiva}
                produtos={produtos}
                onComandaAtualizada={atualizarComanda}
                onComandaFechada={handleFecharComanda}
                onMesaExcluida={handleExcluirMesa}
                onVoltar={voltarParaSelecao}
                onVerMesasAbertas={irParaMesasAbertas}
                comandasAbertas={comandasAbertas}
                obterComandaAtualizada={obterComandaAtualizada}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
