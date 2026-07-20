/**
 * ============================================================
 * NotFound.tsx
 * ============================================================
 * PAPEL: Página 404 para rotas inexistentes.
 * QUEM USA: App.tsx (rota catch-all "*").
 * O QUE FAZ: Exibe mensagem de página não encontrada e link para home.
 *            Também registra no console o path inválido acessado.
 * FLUXO: URL desconhecida → NotFound → usuário clica "Return to Home"
 * ============================================================
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  // Loga no console o path que gerou o 404 (ajuda em debug)
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // ── Render ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
