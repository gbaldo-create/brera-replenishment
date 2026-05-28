// ─── Brera Memory Store ───────────────────────────────────────────────────────
// Persiste in localStorage tra sessioni. Cresce ad ogni revisione confermata.

const KEYS = {
  API_KEY:       'brera_api_key',
  NORM_MEMORY:   'brera_norm_memory',   // { codice: { ...dati } }
  BRAND_MEMORY:  'brera_brand_memory',  // { prefisso3: 'NomeBrand' }
  FAMILY_MEMORY: 'brera_family_memory', // { codiceMadre: { erp, tecdoc } }
  HISTORY:       'brera_history',       // array di eventi
}

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── API Key ──────────────────────────────────────────────────────────────────
export function getApiKey() { return lsGet(KEYS.API_KEY) || '' }
export function setApiKey(key) { lsSet(KEYS.API_KEY, key) }
export function clearApiKey() { localStorage.removeItem(KEYS.API_KEY) }

// ─── Norm Memory ──────────────────────────────────────────────────────────────
export function getNormMemory() { return lsGet(KEYS.NORM_MEMORY) || {} }

export function saveNormToMemory(codiceMadre, data) {
  const mem = getNormMemory()
  mem[codiceMadre] = {
    ...data,
    timestamp: Date.now(),
    confirmedCount: (mem[codiceMadre]?.confirmedCount || 0) + 1,
  }
  lsSet(KEYS.NORM_MEMORY, mem)
  addHistoryEvent('norm_confirmed', { codiceMadre, ...data })
}

export function getNormFromMemory(codiceMadre) {
  const mem = getNormMemory()
  return mem[codiceMadre] || null
}

// ─── Brand Memory ─────────────────────────────────────────────────────────────
export function getBrandMemory() { return lsGet(KEYS.BRAND_MEMORY) || {} }

export function saveBrandToMemory(prefisso, brand) {
  const mem = getBrandMemory()
  mem[prefisso.toUpperCase()] = brand
  lsSet(KEYS.BRAND_MEMORY, mem)
  addHistoryEvent('brand_learned', { prefisso, brand })
}

export function getBrandFromMemory(prefisso) {
  const mem = getBrandMemory()
  return mem[prefisso.toUpperCase()] || null
}

// ─── Family Memory ────────────────────────────────────────────────────────────
export function getFamilyMemory() { return lsGet(KEYS.FAMILY_MEMORY) || {} }

export function saveFamilyToMemory(codiceMadre, erp, tecdoc) {
  const mem = getFamilyMemory()
  mem[codiceMadre] = { erp, tecdoc, timestamp: Date.now() }
  lsSet(KEYS.FAMILY_MEMORY, mem)
  addHistoryEvent('family_learned', { codiceMadre, erp, tecdoc })
}

// ─── History ──────────────────────────────────────────────────────────────────
export function getHistory() { return lsGet(KEYS.HISTORY) || [] }

function addHistoryEvent(type, data) {
  const history = getHistory()
  history.unshift({ type, data, timestamp: Date.now() })
  if (history.length > 500) history.splice(500)
  lsSet(KEYS.HISTORY, history)
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getMemoryStats() {
  const norm = getNormMemory()
  const brand = getBrandMemory()
  const family = getFamilyMemory()
  const history = getHistory()
  return {
    normCount: Object.keys(norm).length,
    brandCount: Object.keys(brand).length,
    familyCount: Object.keys(family).length,
    historyCount: history.length,
    lastUpdate: history[0]?.timestamp || null,
  }
}

// ─── Export / Reset ───────────────────────────────────────────────────────────
export function exportMemory() {
  return {
    norm: getNormMemory(),
    brand: getBrandMemory(),
    family: getFamilyMemory(),
    history: getHistory(),
    exportedAt: Date.now(),
  }
}

export function clearAllMemory() {
  Object.values(KEYS).forEach(k => {
    if (k !== KEYS.API_KEY) localStorage.removeItem(k)
  })
}

// ─── AI Suggestion Engine ─────────────────────────────────────────────────────
export async function getAISuggestion(codiceMadre, rowData) {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const normMem = getNormMemory()
  const brandMem = getBrandMemory()
  const familyMem = getFamilyMemory()

  // Cerca pattern simili in memoria
  const similar = Object.entries(normMem)
    .filter(([k]) => k !== codiceMadre)
    .slice(0, 10)
    .map(([k, v]) => `${k} → ${v.codiceNormalizzato} (${v.brandRilevato}, ${v.famigliaERP}/${v.famigliaTecDoc})`)
    .join('\n')

  const brandHints = Object.entries(brandMem)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ')

  const prompt = `Sei un esperto di ricambi auto. Analizza questo codice articolo e suggerisci la normalizzazione ottimale per la ricerca su portali come QRicambi.

CODICE MADRE: ${codiceMadre}
GRUPPO ERP: ${rowData.gruppoMerceologico}
SOTTOGRUPPO: ${rowData.sottogruppo || ''}
LINEA: ${rowData.lineaProdotto}
MOVIMENTI: ${rowData.nMovimenti}

MEMORIA BRAND APPRESI:
${brandHints || 'Nessuno ancora'}

REVISIONI SIMILI GIÀ CONFERMATE:
${similar || 'Nessuna ancora'}

Rispondi SOLO in JSON con questa struttura:
{
  "codiceNormalizzato": "codice pulito per ricerca",
  "brandRilevato": "nome brand o null",
  "famigliaERP": "famiglia merceologica corretta",
  "famigliaTecDoc": "categoria TecDoc corretta",
  "motivazione": "spiegazione breve in italiano",
  "confidence": 0-100,
  "warning": "eventuale avviso o null"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`API error ${response.status}`)
    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('AI suggestion error:', err)
    return null
  }
}
