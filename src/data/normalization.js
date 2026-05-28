// ─── Brand prefix dictionary (3-digit codes used by Brera/iDempiere) ──────────
export const BRAND_PREFIXES = {
  'JPP': 'Japan Parts',
  'ASH': 'Ashika',
  'KNE': 'Knecht/Mahle',
  'TEX': 'Textar',
  'FER': 'Ferodo',
  'BRR': 'Brembo',
  'ATE': 'ATE',
  'TRW': 'TRW',
  'LUK': 'LUK',
  'SAC': 'Sachs',
  'MON': 'Monroe',
  'BIL': 'Bilstein',
  'KYB': 'KYB',
  'GAB': 'Gabriel',
  'NGK': 'NGK',
  'DEN': 'Denso',
  'BOS': 'Bosch',
  'VAL': 'Valeo',
  'NIS': 'Nissens',
  'HAY': 'Haynes',
  'MAN': 'Mann',
  'SOF': 'Sofima',
  'WIX': 'Wix',
  'ZAF': 'Zaffo',
  'DAY': 'Dayco',
  'CON': 'Continental',
  'GAT': 'Gates',
  'SKF': 'SKF',
  'FAG': 'FAG',
  'NTN': 'NTN',
  'FBK': 'FBK',
}

// ─── Gruppi che si vendono a coppie o multipli ───────────────────────────────
export const MULTIPLO_GRUPPI = {
  'Freni': 2,         // dischi freno → coppie
  'disco': 2,
  'Candele': 4,       // candele → set da 4
  'Filtro': 1,
  'Pastiglie': 1,     // le pastiglie già vengono in set
}

// ─── Parole chiave articoli complementari da escludere ───────────────────────
export const COMPLEMENTARI_KEYWORDS = [
  'molletta', 'mollette', 'clips', 'clip freno', 'antirumore',
  'grasso', 'spray', 'kit bulloni', 'viti', 'guarnizione',
  'coprimozzo', 'cappellotto',
]

// ─── Codici madre NON ricercabili direttamente su QRicambi ───────────────────
// (troppo generici — restituiscono falsi positivi)
export const CODICI_NON_RICERCABILI = [
  'ZAF', 'ZAFFO', 'BRR',  // 3-5 digit generici
]

// ─── Normalizza un codice madre → codice ricercabile ─────────────────────────
export function normalizzaCodice(codiceMadre) {
  if (!codiceMadre) return { codice: codiceMadre, brand: null, warning: null, compressed: false }

  let codice = codiceMadre.trim()
  let brand = null
  let warning = null
  let compressed = false

  // 1. Strip prefisso brand 3 digit (es. JPP, ASH, KNE, TEX, FER...)
  const prefixMatch = codice.match(/^([A-Z]{3})([A-Z0-9].+)$/)
  if (prefixMatch && BRAND_PREFIXES[prefixMatch[1]]) {
    brand = BRAND_PREFIXES[prefixMatch[1]]
    codice = prefixMatch[2]
  }

  // 2. Decompressione trattini (es. ASH10-03-316 → ASH1003316 → 1003316)
  if (codice.includes('-')) {
    const decompressed = codice.replace(/-/g, '')
    if (decompressed !== codice) {
      compressed = true
      codice = decompressed
      warning = `Codice compressed: trattini rimossi per ricerca`
    }
  }

  // 3. Rimuovi prefisso magazzino M- O- ecc. (es. M-103316 → 103316)
  const magazzinoMatch = codice.match(/^[A-Z]-(.+)$/)
  if (magazzinoMatch) {
    codice = magazzinoMatch[1]
    if (!warning) warning = `Prefisso magazzino rimosso`
  }

  // 4. Controlla se il codice è troppo generico per QRicambi
  const isGenerico = CODICI_NON_RICERCABILI.some(k =>
    codiceMadre.toUpperCase().startsWith(k) && codiceMadre.length <= k.length + 3
  )
  if (isGenerico) {
    warning = `Codice madre troppo generico per QRicambi — usare codice figlio`
  }

  // 5. Confidence
  let confidence = 95
  if (isGenerico) confidence = 30
  else if (warning) confidence = 75
  else if (brand) confidence = 92

  return {
    codiceOriginale: codiceMadre,
    codice,
    brand,
    warning,
    compressed,
    isGenerico,
    confidence,
    queryConsigliate: buildQueryStrategies(codice, brand, codiceMadre, isGenerico),
  }
}

// ─── Costruisce le query consigliate per QRicambi ────────────────────────────
function buildQueryStrategies(codice, brand, originale, isGenerico) {
  const queries = []

  if (isGenerico) {
    queries.push({ tipo: 'Codice figlio', query: `[codice figlio specifico]`, affidabilita: 'Alta — usare codice figlio', livello: 'high' })
    queries.push({ tipo: 'Codice originale (rischio)', query: originale, affidabilita: 'Bassa — risultati generici', livello: 'low' })
    return queries
  }

  // Query precisa come prima scelta
  queries.push({ tipo: 'Query precisa', query: codice, affidabilita: 'Alta (95%)', livello: 'high' })

  // Query con brand se disponibile
  if (brand) {
    queries.push({ tipo: 'Con brand', query: `${brand} ${codice}`, affidabilita: 'Alta (92%)', livello: 'high' })
  }

  // Variante con punteggiatura TecDoc (es. 09.A621.11)
  if (/^\d{6,}$/.test(codice)) {
    const tecdoc = codice.replace(/(\d{2})(\d{4})(\d+)/, '$1.$2.$3')
    if (tecdoc !== codice) {
      queries.push({ tipo: 'TecDoc format', query: tecdoc, affidabilita: 'Media (78%)', livello: 'medium' })
    }
  }

  return queries
}

// ─── Calcola il multiplo vendita per un gruppo merceologico ──────────────────
export function getMultiplo(gruppoMerceologico, sottogruppo) {
  const g = (gruppoMerceologico || '').toLowerCase()
  const s = (sottogruppo || '').toLowerCase()
  if (g.includes('freni') || s.includes('disco')) return 2
  if (s.includes('candel')) return 4
  return 1
}

// ─── Mappa urgenza dal file Excel → interna ───────────────────────────────────
export function mapUrgenza(raw) {
  const v = String(raw || '').toLowerCase().trim()
  if (v.includes('prioritar') || v.includes('critica') || v === 'p') return 'Prioritaria'
  if (v.includes('sottoscorta') || v.includes('scorta') || v === 's') return 'Sottoscorta'
  return 'Sottoscorta'
}

// ─── Controlla se articolo è complementare ────────────────────────────────────
export function isComplementare(descrizione) {
  const d = (descrizione || '').toLowerCase()
  return COMPLEMENTARI_KEYWORDS.some(k => d.includes(k))
}
