// ─── AI Prompt Engine ─────────────────────────────────────────────────────────
// Gestisce le istruzioni generali e i prompt contestuali per l'AI

const GENERAL_INSTRUCTIONS_KEY = 'brera_general_instructions'
const PROMPT_HISTORY_KEY = 'brera_prompt_history'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── Istruzioni generali ──────────────────────────────────────────────────────
export function getGeneralInstructions() {
  return lsGet(GENERAL_INSTRUCTIONS_KEY) || ''
}

export function saveGeneralInstructions(text) {
  lsSet(GENERAL_INSTRUCTIONS_KEY, text)
}

// ─── Storico prompt ───────────────────────────────────────────────────────────
export function getPromptHistory() {
  return lsGet(PROMPT_HISTORY_KEY) || []
}

function addToHistory(entry) {
  const history = getPromptHistory()
  history.unshift({ ...entry, timestamp: Date.now() })
  if (history.length > 50) history.splice(50)
  lsSet(PROMPT_HISTORY_KEY, history)
}

// ─── Costruisce il contesto articolo per il prompt ───────────────────────────
export function buildArticleContext(row, offers, normData, searchResults) {
  const codice = normData?.codiceNormalizzato || row?.codiceMadre
  const offerte = (offers || searchResults || [])
    .filter(o => !o.isComplementare)
    .slice(0, 5)
    .map((o, i) => `  ${i+1}. ${o.fornitore} — €${parseFloat(o.prezzoNetto||0).toFixed(2)} netto, ${o.livelloQualitativo}, ${o.sede === 'filiale' ? 'filiale locale' : 'sede centrale'}, lead time ${o.leadTime}, costruttore ${o.costruttore}`)
    .join('\n')

  return `ARTICOLO IN ANALISI:
- Codice madre: ${row?.codiceMadre} → normalizzato: ${codice}
- Gruppo: ${row?.gruppoMerceologico} / ${row?.sottogruppo}
- Linea richiesta: ${row?.lineaProdotto}
- Urgenza: ${row?.urgenza}
- Giacenza: ${row?.giacenza} pz / Da ordinare: ${row?.suggerimentoAcquisto} pz
- Movimenti anno: ${row?.nMovimenti}
${row?.multiplo > 1 ? `- Venduto a ${row.multiplo > 2 ? 'set' : 'coppie'} (×${row.multiplo})` : ''}

OFFERTE DISPONIBILI (${offerte ? offerte.split('\n').length : 0}):
${offerte || '  Nessuna offerta trovata'}

NOTE ERP: ${row?.noteERP || '—'}`
}

// ─── Chiama Claude via proxy Anthropic (funziona su Vercel) ──────────────────
export async function askAI(userPrompt, articleContext = null, generalInstructions = null) {
  const systemParts = []

  if (generalInstructions) {
    systemParts.push(`ISTRUZIONI OPERATIVE GENERALI DI BRERA:\n${generalInstructions}`)
  }

  systemParts.push(`Sei un assistente esperto di ricambi auto per Brera Srl. Rispondi in italiano, in modo conciso e operativo. Quando analizzi offerte fornitori considera sempre: urgenza dell'articolo, coerenza linea qualitativa, logistica (filiale locale = consegna rapida), prezzo netto, costruttore. Evita risposte generiche — sii specifico sui dati che ti vengono forniti.`)

  const messages = []

  if (articleContext) {
    messages.push({
      role: 'user',
      content: `${articleContext}\n\n${userPrompt}`
    })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemParts.join('\n\n'),
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Errore API ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  // Salva in storico
  addToHistory({
    prompt: userPrompt,
    risposta: text,
    hasContext: !!articleContext,
    contesto: articleContext ? articleContext.split('\n')[0] : null,
  })

  return text
}
