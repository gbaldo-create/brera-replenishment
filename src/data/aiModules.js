// ─── AI Modules Engine ────────────────────────────────────────────────────────
// 5 moduli AI che potenziano la Workstation in modalità assistita.
// Ogni modulo ha una versione mock (demo) e una versione reale (Claude API).

import { getApiKey } from './memoryStore'
import { suggestPrezzoVenditaCompetitor, getLineaPerBrand } from './brandConfig'

// ─── Storage preferenze Claudio ───────────────────────────────────────────────
const PREF_KEY = 'brera_claudio_preferences'
const PRICE_KEY = 'brera_price_history'
const CLASS_KEY = 'brera_quality_classifications'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── MODULE 1: Classificazione linea qualitativa ──────────────────────────────
export async function classifyQuality(offer, row, useAI = false) {
  const stored = lsGet(CLASS_KEY) || {}

  // Prima controlla se abbiamo già classificato questo costruttore
  const key = offer.costruttore?.toUpperCase()
  if (stored[key]) {
    return { linea: stored[key], confidence: 95, fonte: 'memoria', motivazione: `${offer.costruttore} già classificato come ${stored[key]}` }
  }

  if (useAI && getApiKey()) {
    try {
      const res = await callClaude(`Classifica questo ricambio auto in una sola parola: Originale, Primo Equipaggiamento, o Economico.
Costruttore: ${offer.costruttore}
Descrizione: ${offer.descrizione}
Prezzo netto: €${offer.prezzoNetto}
Prezzo listino: ${offer.prezzoListino ? '€' + offer.prezzoListino : 'non disponibile'}
Gruppo: ${row?.gruppoMerceologico}

Rispondi SOLO con JSON: {"linea": "...", "motivazione": "...", "confidence": 0-100}`)
      if (res) return { ...res, fonte: 'AI' }
    } catch {}
  }

  // Fallback euristico
  const costruttore = (offer.costruttore || '').toUpperCase()
  const originali = ['BREMBO','BOSCH','CONTINENTAL','VALEO','LUK','SACHS','BILSTEIN','DELPHI','DENSO','NGK','VARTA','MANN','MAHLE','SKF','FAG','NTN','GATES','DAYCO','ATE','TRW','FERODO','TEXTAR']
  const economici = ['RIDEX','BLUE PRINT','JP GROUP','KAMOKA','JAPANPARTS','JAP KO','ASHKA','STARK','TOPRAN','MEAT','FISPA']

  if (originali.some(b => costruttore.includes(b))) return { linea: 'Originale', confidence: 88, fonte: 'euristica', motivazione: `${offer.costruttore} è un brand OEM riconosciuto` }
  if (economici.some(b => costruttore.includes(b))) return { linea: 'Economico', confidence: 82, fonte: 'euristica', motivazione: `${offer.costruttore} è un brand aftermarket economico` }
  return { linea: 'Primo Equipaggiamento', confidence: 65, fonte: 'euristica', motivazione: `${offer.costruttore} non classificato — assegnato Primo Equipaggiamento per default` }
}

export function saveQualityClassification(costruttore, linea) {
  const stored = lsGet(CLASS_KEY) || {}
  stored[costruttore?.toUpperCase()] = linea
  lsSet(CLASS_KEY, stored)
}

// ─── MODULE 2: Rilevamento complementari ─────────────────────────────────────
export async function isComplementare(offer, row, useAI = false) {
  const desc = (offer.descrizione || '').toLowerCase()
  const costruttore = (offer.costruttore || '').toLowerCase()

  // Keywords certe
  const keywords = ['molletta','mollette','clip','clips','grasso','spray','kit bulloni','viti','guarnizione','coprimozzo','cappellotto','antirumore','sensore','kit accessori','attacco','supporto']
  const certainMatch = keywords.some(k => desc.includes(k))
  if (certainMatch) return { isComp: true, confidence: 95, fonte: 'keyword', motivo: 'Parola chiave complementare rilevata' }

  if (useAI && getApiKey()) {
    try {
      const res = await callClaude(`Stai cercando: ${row?.gruppoMerceologico} - ${row?.sottogruppo}
Articolo trovato: "${offer.descrizione}" (${offer.costruttore})

Questo articolo è un COMPLEMENTARE (accessorio, kit montaggio, sensore aggiuntivo) o è l'articolo PRINCIPALE cercato?
Rispondi SOLO con JSON: {"isComplementare": true/false, "confidence": 0-100, "motivo": "..."}`)
      if (res) return { isComp: res.isComplementare, confidence: res.confidence, fonte: 'AI', motivo: res.motivo }
    } catch {}
  }

  return { isComp: false, confidence: 70, fonte: 'euristica', motivo: 'Nessun indicatore di complementare trovato' }
}

// ─── MODULE 3: Apprendimento preferenze Claudio ───────────────────────────────
export function recordChoice(row, offer, score) {
  const prefs = lsGet(PREF_KEY) || { choices: [], patterns: {} }

  const choice = {
    timestamp: Date.now(),
    gruppo: row.gruppoMerceologico,
    linea: row.lineaProdotto,
    urgenza: row.urgenza,
    fornitore: offer.fornitore,
    costruttore: offer.costruttore,
    linea_scelta: offer.livelloQualitativo,
    sede: offer.sede,
    leadTime: offer.leadTime,
    prezzoNetto: offer.prezzoNetto,
    score,
  }

  prefs.choices.push(choice)
  if (prefs.choices.length > 200) prefs.choices = prefs.choices.slice(-200)

  // Aggiorna pattern: gruppo → fornitore preferito
  const pk = `${row.gruppoMerceologico}_${row.lineaProdotto}`
  if (!prefs.patterns[pk]) prefs.patterns[pk] = {}
  prefs.patterns[pk][offer.fornitore] = (prefs.patterns[pk][offer.fornitore] || 0) + 1

  lsSet(PREF_KEY, prefs)
}

export function getPreferredFornitore(gruppo, linea) {
  const prefs = lsGet(PREF_KEY)
  if (!prefs?.patterns) return null
  const pk = `${gruppo}_${linea}`
  const pattern = prefs.patterns[pk]
  if (!pattern) return null
  const preferred = Object.entries(pattern).sort((a, b) => b[1] - a[1])[0]
  return preferred ? { fornitore: preferred[0], volte: preferred[1] } : null
}

export async function getSuggestedOffer(rankedOffers, row, useAI = false) {
  const preferred = getPreferredFornitore(row?.gruppoMerceologico, row?.lineaProdotto)

  if (preferred && preferred.volte >= 2) {
    const match = rankedOffers.find(o => o.fornitore === preferred.fornitore)
    if (match) return { offer: match, fonte: 'preferenza', motivazione: `Claudio ha scelto ${preferred.fornitore} ${preferred.volte} volte per ${row.gruppoMerceologico}` }
  }

  if (useAI && getApiKey() && rankedOffers.length > 0) {
    const prefs = lsGet(PREF_KEY)
    const recentChoices = prefs?.choices?.slice(-20).map(c => `${c.gruppo}: ${c.fornitore} (${c.linea_scelta}, €${c.prezzoNetto})`).join('\n') || 'Nessuna scelta precedente'

    try {
      const res = await callClaude(`Analizza le preferenze storiche di Claudio e suggerisci la migliore offerta per questo articolo.

ARTICOLO: ${row?.gruppoMerceologico} - ${row?.lineaProdotto} - Urgenza: ${row?.urgenza}

SCELTE RECENTI DI CLAUDIO:
${recentChoices}

OFFERTE DISPONIBILI:
${rankedOffers.slice(0, 5).map((o, i) => `${i+1}. ${o.fornitore}: €${o.prezzoNetto}, ${o.sede === 'filiale' ? 'filiale locale' : 'sede centrale'}, ${o.leadTime}`).join('\n')}

Quale offerta sceglierebbe Claudio? Rispondi SOLO con JSON: {"indice": 0-4, "motivazione": "...", "confidence": 0-100}`)

      if (res && res.indice >= 0 && rankedOffers[res.indice]) {
        return { offer: rankedOffers[res.indice], fonte: 'AI', motivazione: res.motivazione, confidence: res.confidence }
      }
    } catch {}
  }

  return { offer: rankedOffers[0], fonte: 'score', motivazione: 'Selezionata per score più alto' }
}

// ─── MODULE 4: Anomalie prezzo ────────────────────────────────────────────────
export function recordPrice(codiceMadre, fornitore, prezzo) {
  const history = lsGet(PRICE_KEY) || {}
  const key = `${codiceMadre}_${fornitore}`
  if (!history[key]) history[key] = []
  history[key].push({ prezzo, timestamp: Date.now() })
  if (history[key].length > 20) history[key] = history[key].slice(-20)
  lsSet(PRICE_KEY, history)
}

export function detectPriceAnomaly(codiceMadre, fornitore, prezzoAttuale) {
  const history = lsGet(PRICE_KEY) || {}
  const key = `${codiceMadre}_${fornitore}`
  const records = history[key]
  if (!records || records.length < 2) return null

  const prezzi = records.map(r => r.prezzo)
  const media = prezzi.reduce((a, b) => a + b, 0) / prezzi.length
  const variazione = ((prezzoAttuale - media) / media) * 100

  if (variazione < -30) return { tipo: 'promo', variazione: Math.abs(variazione).toFixed(0), messaggio: `Prezzo ${Math.abs(variazione).toFixed(0)}% sotto la media storica — possibile promo!`, color: 'var(--color-orange)' }
  if (variazione > 30) return { tipo: 'aumento', variazione: variazione.toFixed(0), messaggio: `Prezzo ${variazione.toFixed(0)}% sopra la media storica — verifica prima di ordinare`, color: 'var(--color-orange-text)' }
  return null
}

// ─── MODULE 5: Quantità ottimale ──────────────────────────────────────────────
export async function suggestOptimalQty(row, offer, useAI = false) {
  const base = row?.suggerimentoAcquisto || 1
  const vendutoMese = Math.round((row?.nMovimenti || 0) / 12)

  // Controlla se c'è promo (prezzo molto sotto storico)
  const anomaly = detectPriceAnomaly(row?.codiceMadre, offer?.fornitore, offer?.prezzoNetto)
  const isPromo = anomaly?.tipo === 'promo'

  if (useAI && getApiKey()) {
    try {
      const res = await callClaude(`Suggerisci la quantità ottimale da acquistare per questo ricambio auto.

ARTICOLO: ${row?.gruppoMerceologico} (${row?.codiceMadre})
Venduto al mese: ~${vendutoMese} pz
Giacenza attuale: ${row?.giacenza} pz
Suggerimento ERP: ${base} pz
Prezzo netto: €${offer?.prezzoNetto}
Prezzo anomalo: ${isPromo ? 'SÌ — promo rilevata' : 'No'}
Lead time: ${offer?.leadTime}
Logistica: ${offer?.sede === 'filiale' ? 'filiale locale' : 'sede centrale'}

Considera: costo di stoccaggio vs saving su promo, lead time, rotazione.
Rispondi SOLO con JSON: {"qty": numero, "motivazione": "...", "risparmio_stimato": numero_o_null}`)

      if (res?.qty) return { qty: res.qty, motivazione: res.motivazione, risparmio: res.risparmio_stimato, fonte: 'AI' }
    } catch {}
  }

  // Logica euristica
  if (isPromo && vendutoMese > 0) {
    const qtyPromo = Math.min(base * 3, vendutoMese * 3)
    return { qty: qtyPromo, motivazione: `Promo rilevata: conviene acquistare scorta per ~3 mesi (${qtyPromo} pz)`, fonte: 'euristica' }
  }

  return { qty: base, motivazione: 'Quantità standard ERP', fonte: 'base' }
}

// ─── Helper AI ────────────────────────────────────────────────────────────────
// In produzione: chiamata al backend Node.js locale che fa da proxy verso Claude API
// In demo: mock intelligente basato su euristiche
async function callClaude(prompt) {
  // Simula latenza AI (200-600ms)
  await new Promise(r => setTimeout(r, 200 + Math.random() * 400))

  // Mock risposte basate sul contenuto del prompt
  if (prompt.includes('Classifica questo ricambio')) {
    const p = prompt.toLowerCase()
    if (['brembo','bosch','continental','valeo','luk','sachs','bilstein','delphi','ngk'].some(b => p.includes(b)))
      return { linea: 'Originale', motivazione: 'Brand OEM riconosciuto', confidence: 92 }
    if (['ridex','blue print','kamoka','japanparts','ashka','stark'].some(b => p.includes(b)))
      return { linea: 'Economico', motivazione: 'Brand aftermarket economico', confidence: 85 }
    return { linea: 'Primo Equipaggiamento', motivazione: 'Brand aftermarket di qualità', confidence: 70 }
  }

  if (prompt.includes('COMPLEMENTARE')) {
    const p = prompt.toLowerCase()
    const comp = ['molletta','clip','grasso','spray','kit bulloni','sensore aggiuntivo','accessori'].some(k => p.includes(k))
    return { isComplementare: comp, confidence: comp ? 92 : 78, motivo: comp ? 'Articolo accessorio rilevato' : 'Articolo principale' }
  }

  if (prompt.includes('preferenze storiche di Claudio')) {
    return { indice: 0, motivazione: 'Fornitore con score più alto e logistica locale', confidence: 85 }
  }

  if (prompt.includes('quantità ottimale')) {
    const baseMatch = prompt.match(/Suggerimento ERP: (\d+)/)
    const base = baseMatch ? parseInt(baseMatch[1]) : 1
    const isPromo = prompt.includes('SÌ — promo rilevata')
    return {
      qty: isPromo ? base * 3 : base,
      motivazione: isPromo ? 'Promo rilevata: conviene fare scorta per 3 mesi' : 'Quantità ERP ottimale',
      risparmio_stimato: isPromo ? base * 2 * 5 : null
    }
  }

  return null
}

// ─── Stato modalità AI ────────────────────────────────────────────────────────
export function getAIMode() { return lsGet('brera_ai_mode') || 'manual' }
export function setAIMode(mode) { lsSet('brera_ai_mode', mode) }

// ─── MODULE 6: Suggerimento codice figlio ─────────────────────────────────────
export function suggestCodiceFiglio(codiceMadre, gruppo) {
  const mem = lsGet('brera_norm_memory') || {}
  const similar = Object.entries(mem).filter(([k, v]) => {
    const sameGruppo = v.famigliaERP?.toLowerCase().includes((gruppo || '').toLowerCase().split(' ')[0])
    const similarCode = k.slice(0, 3).toUpperCase() === codiceMadre.slice(0, 3).toUpperCase()
    return sameGruppo || similarCode
  }).slice(0, 3)

  if (similar.length === 0) return null
  return {
    suggerimenti: similar.map(([madre, data]) => ({
      codiceMadre: madre,
      codiceNormalizzato: data.codiceNormalizzato,
      brand: data.brandRilevato,
      famiglia: data.famigliaERP,
    })),
    messaggio: `Trovati ${similar.length} codici simili già confermati in memoria`,
  }
}

// ─── MODULE 7: Alert descrizione anomala ──────────────────────────────────────
export function detectDescriptionAnomaly(offer, row) {
  const desc = (offer.descrizione || '').toLowerCase()
  const costruttore = (offer.costruttore || '').toLowerCase()
  const gruppoAtteso = (row?.gruppoMerceologico || '').toLowerCase()
  const sottoAtteso = (row?.sottogruppo || '').toLowerCase()

  // Mappa gruppo → parole chiave attese nella descrizione
  const keyMap = {
    'filtro': ['filtro', 'filter', 'olio', 'aria', 'abitacolo', 'carburante'],
    'freni': ['freno', 'brake', 'disco', 'pastiglia', 'pad', 'disc'],
    'sospensioni': ['ammortizzatore', 'shock', 'molla', 'spring', 'braccio'],
    'distribuzione': ['cinghia', 'belt', 'pompa', 'distribuzione', 'timing'],
    'frizioni': ['frizione', 'clutch', 'volano', 'flywheel'],
    'elettrico': ['batteria', 'battery', 'alternatore', 'alternator', 'motorino'],
    'raffreddamento': ['radiatore', 'radiator', 'termostato', 'thermostat'],
  }

  const expectedKey = Object.keys(keyMap).find(k => gruppoAtteso.includes(k))
  if (!expectedKey) return null

  const expectedWords = keyMap[expectedKey]
  const hasMatch = expectedWords.some(w => desc.includes(w) || costruttore.includes(w))

  if (!hasMatch) {
    return {
      tipo: 'descrizione_anomala',
      messaggio: `La descrizione "${offer.descrizione}" non sembra coerente con ${row?.gruppoMerceologico}. Verifica prima di ordinare.`,
      severity: 'warning',
    }
  }
  return null
}

// ─── MODULE 8: Previsione fabbisogno ─────────────────────────────────────────
export function previewFabbisogno(rows) {
  // Articoli vicini alla soglia ma non ancora urgenti
  const aRischio = rows.filter(r => {
    const giorni = r.giorni || 0
    const urgente = r.urgenza === 'Prioritaria' || r.urgenza === 'Critica'
    return !urgente && giorni > 0 && giorni <= 7 && r.giacenza > 0
  }).sort((a, b) => (a.giorni || 99) - (b.giorni || 99))

  return aRischio.slice(0, 5).map(r => ({
    id: r.id,
    codiceMadre: r.codiceMadre,
    gruppo: r.gruppoMerceologico,
    giorni: r.giorni,
    giacenza: r.giacenza,
    messaggio: `Esaurimento previsto in ${r.giorni} giorni`,
  }))
}

// ─── MODULE 9: Suggerimento prezzo vendita (usa tabella brand concorrenza) ─────
export function suggestPrezzoVendita(prezzoAcquisto, livelloQualitativo, gruppo, costruttore) {
  // Prima prova con tabella brand concorrenza
  if (costruttore) {
    const result = suggestPrezzoVenditaCompetitor(prezzoAcquisto, costruttore, gruppo)
    if (result.linea !== 'Non catalogato') {
      return { ...result, motivazione: `Margine da tabella brand: ${costruttore} = ${result.linea}` }
    }
  }
  // Fallback: margini fissi per linea
  const margini = {
    'Originale':             { min: 1.20, max: 1.35, label: '20-35%' },
    'Primo Equipaggiamento': { min: 1.35, max: 1.55, label: '35-55%' },
    'Economico':             { min: 1.50, max: 1.80, label: '50-80%' },
  }
  const m = margini[livelloQualitativo] || margini['Primo Equipaggiamento']
  return {
    prezzoSuggerito: Math.round(prezzoAcquisto * ((m.min + m.max) / 2) * 100) / 100,
    range: { min: Math.round(prezzoAcquisto * m.min * 100) / 100, max: Math.round(prezzoAcquisto * m.max * 100) / 100 },
    margineLabel: m.label,
    linea: livelloQualitativo,
    fonteDati: 'margine default (brand non in tabella)',
    motivazione: `Margine default per ${livelloQualitativo}: ${m.label}`,
  }
}

// ─── MODULE 10: Raggruppamento ordini per fornitore ───────────────────────────
export function groupOrdersByFornitore(pendingOrders, searchStates) {
  const groups = {}

  pendingOrders.forEach(({ rowId, offer }) => {
    const fornitore = offer?.fornitore
    if (!fornitore) return
    if (!groups[fornitore]) groups[fornitore] = { fornitore, articoli: [], totale: 0, risparmioTrasporto: null }
    groups[fornitore].articoli.push({ rowId, offer })
    groups[fornitore].totale += parseFloat(offer?.prezzoNetto || 0)
  })

  // Segnala gruppi con più articoli (risparmio trasporto)
  Object.values(groups).forEach(g => {
    if (g.articoli.length >= 3) {
      g.risparmioTrasporto = { messaggio: `${g.articoli.length} articoli da ${g.fornitore} — ordina insieme per risparmiare sul trasporto`, saving: g.articoli.length * 2.5 }
    }
  })

  return Object.values(groups).sort((a, b) => b.articoli.length - a.articoli.length)
}

// ─── MODULE 11: Articoli sostitutivi ─────────────────────────────────────────
export function findSostitutivi(codiceMadre, gruppo) {
  const mem = lsGet('brera_norm_memory') || {}
  const scoutMem = lsGet('brera_scouting_memory') || {}

  // Cerca articoli dello stesso gruppo con offerte salvate
  const candidati = Object.entries(mem).filter(([k, v]) => {
    if (k === codiceMadre) return false
    const sameGruppo = (v.famigliaERP || '').toLowerCase().includes((gruppo || '').toLowerCase().split(' ')[0])
    const hasOffers = !!scoutMem[k]
    return sameGruppo && hasOffers
  }).slice(0, 3)

  if (candidati.length === 0) return null
  return {
    sostitutivi: candidati.map(([k, v]) => ({ codiceMadre: k, codiceNorm: v.codiceNormalizzato, brand: v.brandRilevato })),
    messaggio: `${candidati.length} possibili sostitutivi trovati in memoria`,
  }
}

// ─── MODULE 12: Sintesi EOD per management ───────────────────────────────────
export function generateEODSummary(completedOrders, skippedOrders, allRows, searchStates) {
  const acquistati = completedOrders.filter(o => o.tipo === 'acquistato')
  const inRevisione = completedOrders.filter(o => o.tipo === 'revisione')
  const totaleValore = acquistati.reduce((acc, o) => acc + (parseFloat(o.offer?.prezzoNetto || 0) * (o.row?.suggerimentoAcquisto || 1)), 0)

  const topFornitori = {}
  acquistati.forEach(o => {
    const f = o.offer?.fornitore || 'Sconosciuto'
    topFornitori[f] = (topFornitori[f] || 0) + 1
  })
  const topF = Object.entries(topFornitori).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return {
    testo: `REPORT OPERATIVO — ${oggi.toUpperCase()}

Sessione completata. Elaborati ${completedOrders.length + skippedOrders} articoli in urgenza.

ORDINI CONFERMATI: ${acquistati.length} articoli · Valore totale: €${totaleValore.toFixed(2)}
IN REVISIONE: ${inRevisione.length} articoli richiedono approvazione manuale
SALTATI: ${skippedOrders} articoli rimandati alla prossima sessione

TOP FORNITORI: ${topF.map(([f, n]) => `${f} (${n} ordini)`).join(', ')}

${inRevisione.length > 0 ? `⚠ ATTENZIONE: ${inRevisione.length} ordini in attesa di approvazione — verificare prima della chiusura.` : '✓ Nessuna pendenza critica.'}`,
    stats: { acquistati: acquistati.length, inRevisione: inRevisione.length, saltati: skippedOrders, totaleValore, topFornitori: topF },
  }
}
