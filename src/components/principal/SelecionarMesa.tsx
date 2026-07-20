/**
 * ============================================================
 * SelecionarMesa.tsx
 * ============================================================
 * PAPEL: Tela inicial do salão — mapa de mesas disponíveis/ocupadas.
 * QUEM USA: pages/Index.tsx (modo === 'selecionar').
 * O QUE FAZ:
 *   - Lista mesas livres (verde) e ocupadas (vermelho).
 *   - Atalho "Ver Mesas Abertas" quando há comandas abertas.
 *   - Clique em mesa chama onSelecionarMesa (abrir ou gerenciar).
 * FLUXO: Index → SelecionarMesa → AbrirMesa | GerenciarComanda
 * ============================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Coffee, Eye } from 'lucide-react';
import { Mesa, Comanda } from '@/types/restaurant';

interface SelecionarMesaProps {
  mesas: Mesa[];
  onSelecionarMesa: (mesa: Mesa) => void;
  comandasAbertas: Comanda[];
  onVerMesasAbertas: () => void;
}

const SelecionarMesa = ({ mesas, onSelecionarMesa, comandasAbertas, onVerMesasAbertas }: SelecionarMesaProps) => {
  // ── Derivados: separa mesas por status ──
  const mesasDisponiveis = mesas.filter(m => m.status === 'disponivel');
  const mesasOcupadas = mesas.filter(m => m.status === 'ocupada');

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Banner: resumo de mesas já abertas + atalho */}
      {comandasAbertas.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    {comandasAbertas.length} mesa(s) aberta(s)
                  </p>
                  <p className="text-sm text-primary">
                    Mesas: {comandasAbertas.map(c => c.mesa).join(', ')}
                  </p>
                </div>
              </div>
              <Button 
                onClick={onVerMesasAbertas}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Mesas Abertas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            Selecionar Mesa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Grade de mesas livres */}
            <div>
              <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Mesas Disponíveis
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {mesasDisponiveis.map((mesa) => (
                  <Button
                    key={mesa.numero}
                    variant="outline"
                    className="h-12 border-green-200 hover:bg-green-50 hover:border-green-300"
                    onClick={() => onSelecionarMesa(mesa)}
                  >
                    {mesa.numero}
                  </Button>
                ))}
              </div>
              {mesasDisponiveis.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma mesa disponível</p>
              )}
            </div>

            {/* Grade de mesas ocupadas (entra no gerenciamento) */}
            <div>
              <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Mesas Ocupadas
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {mesasOcupadas.map((mesa) => (
                  <Button
                    key={mesa.numero}
                    variant="outline"
                    className="h-12 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => onSelecionarMesa(mesa)}
                  >
                    <Coffee className="h-4 w-4 mr-1" />
                    {mesa.numero}
                  </Button>
                ))}
              </div>
              {mesasOcupadas.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma mesa ocupada</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelecionarMesa;
