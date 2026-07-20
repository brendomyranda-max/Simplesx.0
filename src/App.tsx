/**
 * ============================================================
 * App.tsx
 * ============================================================
 * PAPEL: Componente raiz da aplicação — providers e roteamento.
 * QUEM USA: main.tsx (único consumidor direto).
 * O QUE FAZ:
 *   - Envolve a app com React Query, Tooltip e Toasters (shadcn).
 *   - Define as rotas com react-router-dom:
 *       "/" → página principal do POS (Index)
 *       "*" → página 404 (NotFound)
 * FLUXO: main → App (providers) → BrowserRouter → Index | NotFound
 * ============================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Cliente React Query compartilhado (cache de requisições, se houver)
const queryClient = new QueryClient();

// ── Componente raiz ──
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Sistemas de notificação toast (shadcn + sonner) */}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rota principal: tela do POS (Principal + Gestor) */}
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* Catch-all: qualquer URL desconhecida cai no 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
