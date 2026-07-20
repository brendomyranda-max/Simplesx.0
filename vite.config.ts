/**
 * ============================================================
 * vite.config.ts
 * ============================================================
 * PAPEL: Configuração do bundler/dev-server Vite.
 * QUEM USA: CLI do Vite (npm run dev / build).
 * O QUE FAZ:
 *   - Define host (::) e porta 8080 do servidor de desenvolvimento.
 *   - Alias "@" → pasta ./src (imports absolutos no código React).
 * NOTA: Plugin React SWC é importado mas a config de plugins
 *       depende da versão/setup do projeto.
 * ============================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ── Servidor de desenvolvimento ──
  server: {
    host: "::",
    port: 8080,
    // Proxy da API/SQLite e impressão para o Express :3001
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/impressoras": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/imprimir": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/status": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  plugins: [react()],

  // ── Resolução de módulos (alias @ = src/) ──
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
