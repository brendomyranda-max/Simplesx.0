/**
 * ============================================================
 * MesasAbertas.tsx
 * ============================================================
 * PAPEL: Lista todas as comandas abertas para gestão rápida.
 * QUEM USA: pages/Index.tsx (modo === 'mesas-abertas').
 * O QUE FAZ:
 *   - Filtra por garçom quando filtrarPorGarcom está ativo.
 *   - Exibe tempo desde abertura (baseado no id = timestamp).
 *   - Permite gerenciar comanda ou fechar mesa vazia (sem itens).
 * FLUXO: SelecionarMesa → MesasAbertas → GerenciarComanda
 * ============================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coffee, X, Users, Clock } from 'lucide-react';
import { Comanda } from '@/types/restaurant';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MesasAbertasProps {
  comandas: Comanda[];
  onSelecionarComanda: (comanda: Comanda) => void;
  onVoltar: () => void;
  onFecharMesaVazia: (comandaId: string, mesaNumero: number) => void;
  garcomAtual?: string;
  filtrarPorGarcom?: boolean;
}

const MesasAbertas = ({ 
  comandas, 
  onSelecionarComanda, 
  onVoltar, 
  onFecharMesaVazia,
  garcomAtual,
  filtrarPorGarcom = false
}: MesasAbertasProps) => {
  // ── Filtro opcional: mesas do garçom atual (+ sem garçom definido) ──
  // Filtrar comandas por garçom se solicitado
  const comandasFiltradas = filtrarPorGarcom && garcomAtual 
    ? comandas.filter(comanda => 
        comanda.garcom === garcomAtual || 
        !comanda.garcom // Se não tem garçom definido, mostrar também
      )
    : comandas;

  /**
   * Estima tempo de abertura usando o id da comanda (Date.now() na criação).
   */
  const calcularTempoAbertura = (comanda: Comanda) => {
    // Simular tempo baseado no ID da comanda (timestamp)
    const agora = Date.now();
    const tempoAbertura = parseInt(comanda.id);
    const diferenca = agora - tempoAbertura;
    const minutos = Math.floor(diferenca / 60000);
    
    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;
    return `${horas}h${minRestantes > 0 ? ` ${minRestantes}min` : ''}`;
  };

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Barra de título e voltar */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={onVoltar}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <div>
          <h2 className="text-lg font-semibold">Mesas Abertas</h2>
          <p className="text-sm text-gray-600">
            {comandasFiltradas.length} mesa(s) 
            {filtrarPorGarcom && garcomAtual && ` - Garçom: ${garcomAtual}`}
          </p>
        </div>
      </div>

      {/* Estado vazio */}
      {comandasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filtrarPorGarcom ? 'Você não tem mesas abertas no momento' : 'Nenhuma mesa aberta'}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Cards de cada comanda aberta */
        <div className="grid gap-4">
          {comandasFiltradas.map((comanda) => (
            <Card key={comanda.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-primary" />
                    Mesa {comanda.mesa}
                  </CardTitle>
                  
                  {/* Só permite fechar sem venda se não houver itens */}
                  {comanda.itens.length === 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Fechar Mesa Vazia?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A Mesa {comanda.mesa} não possui itens. Deseja fechá-la sem registrar venda?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onFecharMesaVazia(comanda.id, comanda.mesa)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Fechar Mesa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Meta: pessoas, tempo e garçom */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {comanda.pessoas} pessoa(s)
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {calcularTempoAbertura(comanda)}
                    </div>
                    {comanda.garcom && (
                      <Badge variant="outline" className="text-xs">
                        {comanda.garcom}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {comanda.itens.length} item(s) • R$ {comanda.valor_total.toFixed(2)}
                      </p>
                      {comanda.split_ativo && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Divisão ativa
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onSelecionarComanda(comanda)}
                      className="bg-primary/50 hover:bg-primary/90"
                    >
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MesasAbertas;
