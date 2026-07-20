/**
 * ============================================================
 * utils.ts (lib)
 * ============================================================
 * PAPEL: Utilitários genéricos de UI (classe CSS condicional).
 * QUEM USA: Componentes shadcn/ui e qualquer componente que use `cn()`.
 * O QUE FAZ: Combina classnames (clsx) e resolve conflitos Tailwind (twMerge).
 * EXEMPLO: cn("px-2", isActive && "bg-primary") → string de classes final.
 * ============================================================
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Mescla classes CSS de forma segura para Tailwind.
 * Aceita strings, arrays, objetos condicionais (via clsx) e remove
 * conflitos de utilitários Tailwind (via tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
