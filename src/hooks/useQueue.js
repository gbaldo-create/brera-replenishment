import { useMemo } from 'react'

// ─── Costanti stati bloccati ──────────────────────────────────────────────────
export const BLOCKED_STATI = ['bloccato-tra', 'bloccato-dup', 'mismatch']

// ─── Predicato: riga ordinabile ───────────────────────────────────────────────
export function isOrderable(r) {
  if (BLOCKED_STATI.includes(r._stato)) return false
  if ((r.giacenza ?? 0) >= (r.suggerimentoAcquisto ?? 1) && (r.suggerimentoAcquisto ?? 0) > 0) return false
  if ((r.suggerimentoAcquisto ?? 0) === 0) return false
  return true
}

// ─── Predicato: riga esclusa (visibile ma non ordinabile) ─────────────────────
export function isExcluded(r) {
  return BLOCKED_STATI.includes(r._stato)
}

// ─── Urgency order ────────────────────────────────────────────────────────────
const URG_ORD = { Prioritaria: 0, Critica: 0, Alta: 1, Sottoscorta: 1, Media: 2, Bassa: 3 }

export function urgencySort(a, b) {
  const ua = URG_ORD[a.urgenza] ?? 2
  const ub = URG_ORD[b.urgenza] ?? 2
  return ua !== ub ? ua - ub : (b._conf ?? 95) - (a._conf ?? 95)
}

// ─── Hook principale ──────────────────────────────────────────────────────────
/**
 * useQueue(rows)
 * Restituisce la coda elaborabile, le righe escluse e i contatori.
 * Fonte di verità unica usata da Workstation, FabbisogniQueue, SupplierScouting.
 */
export function useQueue(rows = []) {
  return useMemo(() => {
    const active   = rows.filter(isOrderable).sort(urgencySort)
    const excluded = rows.filter(isExcluded)

    // Sotto-code urgency
    const urgent   = active.filter(r => r.urgenza === 'Prioritaria' || r.urgenza === 'Critica')
    const alta     = active.filter(r => r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta')
    const std      = active.filter(r => !['Prioritaria','Critica','Sottoscorta','Alta'].includes(r.urgenza))

    // Contatori esclusi per tipo
    const cntTra = excluded.filter(r => r._stato === 'bloccato-tra').length
    const cntDup = excluded.filter(r => r._stato === 'bloccato-dup').length
    const cntMis = excluded.filter(r => r._stato === 'mismatch').length

    return {
      active,          // righe ordinabili, ordinate per urgenza
      excluded,        // righe visibili ma non ordinabili
      urgent,          // critica/prioritaria
      alta,            // sottoscorta/alta
      std,             // media/bassa
      counts: {
        active:   active.length,
        excluded: excluded.length,
        urgent:   urgent.length,
        alta:     alta.length,
        std:      std.length,
        cntTra,
        cntDup,
        cntMis,
      },
    }
  }, [rows])
}
