/**
 * ============================================================
 * use-mobile.tsx
 * ============================================================
 * PAPEL: Hook que detecta se a viewport é mobile (< 768px).
 * QUEM USA: Componentes de layout responsivo (ex.: sidebar shadcn).
 * O QUE FAZ: Observa matchMedia e window.innerWidth; retorna boolean.
 * ============================================================
 */

import * as React from "react"

/** Breakpoint alinhado ao Tailwind `md` (768px) */
const MOBILE_BREAKPOINT = 768

/**
 * @returns true se a largura da janela for menor que MOBILE_BREAKPOINT
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // ── Listener de resize via matchMedia ──
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Coerce undefined inicial para false
  return !!isMobile
}
