/**
 * ============================================================
 * FiltroGarcom.tsx
 * ============================================================
 * PAPEL: Identificação do garçom e filtro "minhas mesas".
 * QUEM USA: pages/Index.tsx (sempre visível na aba Principal).
 * O QUE FAZ:
 *   - Input do nome do garçom (atribuído a comandas/vendas no Index).
 *   - Checkbox para filtrar lista de mesas abertas pelo garçom.
 * ============================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from 'lucide-react';

interface FiltroGarcomProps {
  onGarcomChange: (garcom: string) => void;
  onFiltroMeusChange: (filtrar: boolean) => void;
  garcomAtual: string;
  filtrarMeus: boolean;
}

const FiltroGarcom = ({ onGarcomChange, onFiltroMeusChange, garcomAtual, filtrarMeus }: FiltroGarcomProps) => {
  // ── Render (componente controlado pelo pai) ──
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          Identificação do Garçom
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Nome usado em abertura de mesa e fechamento de venda */}
        <div>
          <Label htmlFor="garcom" className="text-sm">Nome do Garçom</Label>
          <Input
            id="garcom"
            placeholder="Digite seu nome"
            value={garcomAtual}
            onChange={(e) => onGarcomChange(e.target.value)}
            className="mt-1"
          />
        </div>
        
        {/* Aplica filtro em MesasAbertas quando ativo */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="filtrar-meus"
            checked={filtrarMeus}
            onCheckedChange={(checked) => onFiltroMeusChange(checked as boolean)}
          />
          <Label htmlFor="filtrar-meus" className="text-sm">
            Mostrar apenas minhas mesas
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltroGarcom;
