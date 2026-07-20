/**
 * ============================================================
 * CadastroMesas.tsx
 * ============================================================
 * PAPEL: Visão gerencial das mesas 1–100 (somente leitura).
 * QUEM USA: pages/Index.tsx (aba Gestor).
 * O QUE FAZ: Conta disponíveis/ocupadas e mostra grade colorida.
 *            Não permite criar/editar mesas (seed fixo no hook).
 * ============================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Users } from 'lucide-react';
import { Mesa } from '@/types/restaurant';

interface CadastroMesasProps {
  mesas: Mesa[];
}

const CadastroMesas = ({ mesas }: CadastroMesasProps) => {
  // ── Contadores de status ──
  const mesasDisponiveis = mesas.filter(m => m.status === 'disponivel').length;
  const mesasOcupadas = mesas.filter(m => m.status === 'ocupada').length;

  // ── Render ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5 text-primary" />
          Gestão de Mesas (1-100)
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Disponíveis: {mesasDisponiveis}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Ocupadas: {mesasOcupadas}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grade visual de todas as mesas */}
        <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
          {mesas.map((mesa) => (
            <div
              key={mesa.numero}
              className={`
                p-2 text-center rounded-lg border text-sm font-medium
                ${mesa.status === 'disponivel' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
                }
              `}
            >
              {mesa.numero}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CadastroMesas;
