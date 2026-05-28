// ─── Scouting Memory ─────────────────────────────────────────────────────────
// Salva le offerte registrate manualmente per ogni codice articolo
// Persiste in localStorage tra sessioni

const KEY = 'brera_scouting_memory'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export function getScoutingMemory() { return lsGet(KEY) || {} }

export function saveScoutingOffer(codiceMadre, offer) {
  const mem = getScoutingMemory()
  if (!mem[codiceMadre]) mem[codiceMadre] = []
  // Evita duplicati per stesso fornitore + codice
  const idx = mem[codiceMadre].findIndex(o => o.fornitore === offer.fornitore && o.codiceFornitore === offer.codiceFornitore)
  if (idx >= 0) mem[codiceMadre][idx] = { ...offer, updatedAt: Date.now() }
  else mem[codiceMadre].unshift({ ...offer, id: `MAN-${Date.now()}`, savedAt: Date.now() })
  lsSet(KEY, mem)
}

export function getScoutingOffers(codiceMadre) {
  const mem = getScoutingMemory()
  return mem[codiceMadre] || []
}

export function deleteScoutingOffer(codiceMadre, offerId) {
  const mem = getScoutingMemory()
  if (mem[codiceMadre]) {
    mem[codiceMadre] = mem[codiceMadre].filter(o => o.id !== offerId)
    if (mem[codiceMadre].length === 0) delete mem[codiceMadre]
  }
  lsSet(KEY, mem)
}

export function getScoutingStats() {
  const mem = getScoutingMemory()
  const codici = Object.keys(mem)
  const offerte = codici.reduce((acc, k) => acc + mem[k].length, 0)
  return { codici: codici.length, offerte }
}

// ─── Costruisce URL QRicambi per il codice normalizzato ───────────────────────
export function buildQRicambiUrl(codiceNormalizzato) {
  if (!codiceNormalizzato) return 'https://www.qricambi.it'
  const clean = codiceNormalizzato.trim().replace(/\s+/g, '')
  return `https://www.qricambi.it/search?q=${encodeURIComponent(clean)}`
}

// ─── Calcola score per un'offerta manuale ────────────────────────────────────
export function computeManualScore(offer, row) {
  let score = 0
  // Disponibilità locale
  const disp = (offer.disponibilita || '').toLowerCase()
  if (disp.includes('filiale') || disp.includes('locale') || disp.includes('mi') || disp.includes('immediat')) score += 25
  else if (disp.includes('disponibile')) score += 15
  else score += 5
  // Lead time
  const lt = parseInt(offer.leadTime) || 24
  if (lt <= 2) score += 20
  else if (lt <= 12) score += 14
  else if (lt <= 24) score += 8
  else score += 3
  // Prezzo (più basso = meglio, relativo)
  const prezzo = parseFloat(offer.prezzoNetto) || 0
  if (prezzo > 0 && prezzo < 5) score += 20
  else if (prezzo < 20) score += 15
  else if (prezzo < 60) score += 10
  else score += 5
  // Linea qualitativa match
  const lineaRow = (row?.lineaProdotto || '').toLowerCase()
  const lineaOff = (offer.livelloQualitativo || '').toLowerCase()
  if (lineaRow && lineaOff && lineaRow === lineaOff) score += 20
  else if (lineaOff.includes('qualità') || lineaOff.includes('q/p')) score += 10
  else score += 5
  // Listino presente
  if (offer.prezzoListino && parseFloat(offer.prezzoListino) > 0) score += 5
  // Costruttore/brand confermato
  if (offer.costruttore && offer.costruttore.length > 1) score += 10
  return Math.min(100, score)
}

// ─── I 13 casi di scouting ───────────────────────────────────────────────────
export const CASI_SCOUTING = {
  STANDARD: { label: 'Ricerca standard', desc: 'Codice normalizzato ricercabile direttamente', color: 'var(--color-text-primary)' },
  CODICE_FIGLIO: { label: 'Serve codice figlio', desc: 'Codice madre troppo generico — trovare codice figlio in iDempiere', color: 'var(--color-orange)' },
  COMPRESSED: { label: 'Codice compresso', desc: 'Trattini rimossi — verificare risultati', color: 'var(--color-text-muted)' },
  PREFISSO_BRAND: { label: 'Prefisso brand strippato', desc: 'Prefisso nostro rimosso — cercare per costruttore', color: 'var(--color-text-muted)' },
  AMBIGUITA: { label: 'Risultati ambigui', desc: 'Stesso codice per brand diversi — controllo incrociato RoboMag/iDempiere', color: 'var(--color-orange)' },
  COMPLEMENTARI: { label: 'Escludere complementari', desc: 'Filtrare mollette, grasso, bulloni dai risultati', color: 'var(--color-text-muted)' },
  MULTIPLO: { label: 'Venduto a coppie/set', desc: 'Quantità da moltiplicare per il multiplo', color: 'var(--color-orange)' },
  NO_LISTINO: { label: 'Listino non pubblicato', desc: 'Solo prezzo netto disponibile', color: 'var(--color-text-muted)' },
  SEDE_FILIALE: { label: 'Sede vs Filiale', desc: 'Valutare trade-off prezzo/velocità', color: 'var(--color-orange)' },
  CODICE_OE: { label: 'Codice OE', desc: 'Prefisso magazzino rimosso, punteggiatura TecDoc ripristinata', color: 'var(--color-text-muted)' },
  MISMATCH: { label: 'Mismatch famiglia', desc: 'Famiglia ERP e TecDoc divergenti — BLOCCATO', color: 'var(--color-orange)' },
  DUPLICATO: { label: 'Ordine duplicato', desc: 'Ordine già inviato ieri — verificare prima', color: 'var(--color-orange)' },
  TRANSITO: { label: 'Copertura transito', desc: 'Merce in arrivo sufficiente — non ordinare', color: 'var(--color-text-muted)' },
}

export function detectCaso(row, normData) {
  if (row._stato === 'mismatch') return 'MISMATCH'
  if (row._stato === 'bloccato-dup') return 'DUPLICATO'
  if (row._stato === 'bloccato-tra') return 'TRANSITO'
  if (row._stato === 'warn-generico' || row._conf < 40) return 'CODICE_FIGLIO'
  if (row.multiplo > 1) return 'MULTIPLO'
  if (normData?.compressed) return 'COMPRESSED'
  if (normData?.brand) return 'PREFISSO_BRAND'
  if (row.codiceMadre?.startsWith('O-')) return 'CODICE_OE'
  if ((row._conf || 95) < 70) return 'AMBIGUITA'
  return 'STANDARD'
}
