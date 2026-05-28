// ─── Ranking Config — pesi modificabili dell'algoritmo ───────────────────────

const LS_KEY = 'brera_ranking_weights'

export const DEFAULT_WEIGHTS = {
  famiglia:     { label: 'Famiglia / Codice',     value: 30, description: 'Match famiglia TecDoc/ERP e normalizzazione codice' },
  linea:        { label: 'Linea Prodotto',         value: 20, description: 'Corrispondenza tra linea richiesta e livello qualitativo offerta' },
  disponibilita:{ label: 'Disponibilità',          value: 20, description: 'Disponibilità immediata vs disponibile vs su ordine' },
  prezzo:       { label: 'Prezzo Netto',           value: 15, description: 'Competitività del prezzo netto sul mercato' },
  brand:        { label: 'Brand / Affidabilità',   value: 10, description: 'Score affidabilità fornitore e brand qualità' },
  listino:      { label: 'Completezza Dati',       value: 5,  description: 'Presenza prezzo di listino e dati completi' },
}

export function getWeights() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge con defaults per eventuali nuovi campi
      const merged = { ...DEFAULT_WEIGHTS }
      Object.keys(parsed).forEach(k => {
        if (merged[k]) merged[k] = { ...merged[k], value: parsed[k] }
      })
      return merged
    }
  } catch {}
  return { ...DEFAULT_WEIGHTS }
}

export function saveWeights(weights) {
  try {
    const toSave = {}
    Object.keys(weights).forEach(k => { toSave[k] = weights[k].value })
    localStorage.setItem(LS_KEY, JSON.stringify(toSave))
  } catch {}
}

export function resetWeights() {
  try { localStorage.removeItem(LS_KEY) } catch {}
  return { ...DEFAULT_WEIGHTS }
}

export function getTotalWeight(weights) {
  return Object.values(weights).reduce((s, w) => s + w.value, 0)
}

// ─── computeScore dinamico ────────────────────────────────────────────────────
export function computeScoreWithWeights(offer, row, normalizationsLog, weights) {
  const w = weights || getWeights()
  const total = getTotalWeight(w)
  if (total === 0) return 0

  const normLog = normalizationsLog?.[row.codiceMadre]

  // Punteggi grezzi per ogni fattore (0–100 ciascuno)
  const familyOk = normLog ? (normLog.famigliaTecDoc && !normLog.famigliaTecDoc.includes('CONFLITTO')) : true
  const scores = {
    famiglia:      familyOk ? 100 : 15,
    linea:         offer.livelloQualitativo === row.lineaProdotto ? 100 : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 50 : 0,
    disponibilita: offer.disponibilita === 'Immediata' ? 100 : offer.disponibilita === 'Disponibile' ? 60 : 25,
    prezzo:        offer.prezzoNetto < 10 ? 100 : offer.prezzoNetto < 30 ? 70 : offer.prezzoNetto < 80 ? 45 : 20,
    brand:         offer.scoreAffidabilita >= 98 ? 100 : offer.scoreAffidabilita >= 90 ? 70 : 40,
    listino:       offer.prezzoListino !== null ? 100 : 0,
  }

  // Score pesato normalizzato su 100
  const weighted = Object.keys(scores).reduce((sum, k) => {
    return sum + (scores[k] * (w[k]?.value ?? 0))
  }, 0)

  return Math.min(100, Math.round(weighted / total))
}
