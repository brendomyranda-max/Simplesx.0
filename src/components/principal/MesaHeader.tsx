/**
 * ============================================================
 * MesaHeader.tsx
 * ============================================================
 * PAPEL: Cabeçalho da tela de gerenciamento de comanda.
 * QUEM USA: GerenciarComanda.tsx.
 * O QUE FAZ:
 *   - Mostra mesa atual, total de mesas abertas e total R$.
 *   - Navegação: voltar à seleção ou trocar de mesa.
 * ============================================================
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Users, DollarSign, Table, Eye } from 'lucide-react';
import { Comanda } from '@/types/restaurant';

interface MesaHeaderProps {
  comanda: Comanda;
  comandasAbertas: Comanda[];
  onVoltar: () => void;
  onVerMesasAbertas: () => void;
}

const MesaHeader = ({ comanda, comandasAbertas, onVoltar, onVerMesasAbertas }: MesaHeaderProps) => {
  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Navegação entre mesas */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Coffee className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">
                  Gerenciando Mesa {comanda.mesa}
                </p>
                <p className="text-sm text-primary">
                  {comandasAbertas.length} mesa(s) aberta(s) no total
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={onVoltar}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10"
                size="sm"
              >
                <Table className="h-4 w-4 mr-2" />
                Selecionar Mesa
              </Button>
              {/* Só mostra troca se houver mais de uma mesa aberta */}
              {comandasAbertas.length > 1 && (
                <Button 
                  onClick={onVerMesasAbertas}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Trocar Mesa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da mesa: pessoas, split e total */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">Mesa {comanda.mesa} - {comanda.pessoas} pessoa(s)</span>
            </div>
            <Badge variant={comanda.split_ativo ? "default" : "secondary"}>
              {comanda.split_ativo ? "Divisão Ativa" : "Conta Única"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              Total: R$ {comanda.valor_total.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MesaHeader;
