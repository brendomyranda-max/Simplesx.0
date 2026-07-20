/**
 * ============================================================
 * main.tsx
 * ============================================================
 * PAPEL: Ponto de entrada da aplicação React (bootstrap).
 * QUEM USA: O navegador, ao carregar o index.html do Vite.
 * O QUE FAZ: Monta o componente raiz <App /> no elemento DOM #root
 *            e importa os estilos globais (index.css).
 * FLUXO: index.html → main.tsx → App.tsx → rotas/páginas
 * ============================================================
 */

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Cria a raiz React e renderiza a árvore de componentes no #root
createRoot(document.getElementById("root")!).render(<App />);
