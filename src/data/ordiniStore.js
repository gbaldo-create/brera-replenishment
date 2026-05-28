// ─── Registro Ordini Brera ─────────────────────────────────────────────────────
// Persiste in localStorage tra sessioni.
// In produzione: ogni ordine confermato genera anche un OdA in iDempiere via API.

const KEY = 'brera_ordini_registro'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── Tipi stato ordine ────────────────────────────────────────────────────────
export const STATI_ORDINE = {
  confermato:  { label: 'Confermato',    color: 'var(--color-text-primary)', bg: 'var(--color-surface-3)' },
  revisione:   { label: 'In revisione',  color: 'var(--color-orange-text)',  bg: 'var(--color-orange-light)' },
  accodato:    { label: 'Accodato',      color: 'var(--color-text-muted)',   bg: 'var(--color-surface-2)' },
  manuale:     { label: 'Manuale',       color: 'var(--color-text-secondary)', bg: 'var(--color-surface-2)' },
  annullato:   { label: 'Annullato',     color: '#991b1b',                   bg: '#fee2e2' },
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export function getOrdini() { return lsGet(KEY) || [] }

export function saveOrdine({ row, offer, tipo, qty }) {
  const ordini = getOrdini()
  const ordine = {
    id: `ORD-${Date.now()}`,
    data: new Date().toISOString(),
    dataLeggibile: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    reqId: row?.id,
    codiceMadre: row?.codiceMadre,
    codiceNormalizzato: row?.codiceNormalizzato || row?.codiceMadre,
    gruppo: row?.gruppoMerceologico,
    sottogruppo: row?.sottogruppo,
    linea: offer?.livelloQualitativo || row?.lineaProdotto,
    urgenza: row?.urgenza,
    fornitore: offer?.fornitore,
    codiceFornitore: offer?.codiceFornitore,
    costruttore: offer?.costruttore,
    brand: offer?.brand || offer?.costruttore,
    prezzoNetto: parseFloat(offer?.prezzoNetto || 0),
    prezzoListino: offer?.prezzoListino ? parseFloat(offer.prezzoListino) : null,
    qty: qty || row?.suggerimentoAcquisto || 1,
    totale: parseFloat(offer?.prezzoNetto || 0) * (qty || row?.suggerimentoAcquisto || 1),
    logistica: offer?.logistica,
    leadTime: offer?.leadTime,
    stato: tipo || 'confermato',
    note: '',
  }
  ordini.unshift(ordine)
  lsSet(KEY, ordini)
  return ordine
}

export function updateOrdineStato(id, stato) {
  const ordini = getOrdini()
  const idx = ordini.findIndex(o => o.id === id)
  if (idx >= 0) { ordini[idx].stato = stato; lsSet(KEY, ordini) }
}

export function updateOrdineNote(id, note) {
  const ordini = getOrdini()
  const idx = ordini.findIndex(o => o.id === id)
  if (idx >= 0) { ordini[idx].note = note; lsSet(KEY, ordini) }
}

export function deleteOrdine(id) {
  const ordini = getOrdini().filter(o => o.id !== id)
  lsSet(KEY, ordini)
}

export function clearOrdini() { localStorage.removeItem(KEY) }

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getOrdiniStats(ordini) {
  const list = ordini || getOrdini()
  const confermati = list.filter(o => o.stato === 'confermato' || o.stato === 'manuale')
  const inRevisione = list.filter(o => o.stato === 'revisione')
  const totaleValore = confermati.reduce((acc, o) => acc + o.totale, 0)
  const perFornitore = {}
  confermati.forEach(o => { perFornitore[o.fornitore] = (perFornitore[o.fornitore] || 0) + o.totale })
  const topFornitori = Object.entries(perFornitore).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return { totale: list.length, confermati: confermati.length, inRevisione: inRevisione.length, totaleValore, topFornitori }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
export function exportOrdiniCSV(ordini) {
  const list = ordini || getOrdini()
  const headers = ['ID Ordine', 'Data', 'Req ID', 'Codice Madre', 'Codice Normalizzato', 'Gruppo', 'Linea', 'Urgenza', 'Fornitore', 'Codice Fornitore', 'Costruttore', 'Quantità', 'Prezzo Netto', 'Prezzo Listino', 'Totale', 'Logistica', 'Lead Time', 'Stato', 'Note']
  const rows = list.map(o => [
    o.id, o.dataLeggibile, o.reqId, o.codiceMadre, o.codiceNormalizzato,
    o.gruppo, o.linea, o.urgenza, o.fornitore, o.codiceFornitore, o.costruttore,
    o.qty, o.prezzoNetto.toFixed(2), o.prezzoListino ? o.prezzoListino.toFixed(2) : '',
    o.totale.toFixed(2), o.logistica, o.leadTime, o.stato, o.note,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brera-ordini-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Export iDempiere (formato JSON per import futuro) ────────────────────────
export function exportOrdiniIDempiere(ordini) {
  const list = (ordini || getOrdini()).filter(o => o.stato === 'confermato' || o.stato === 'manuale')
  const payload = {
    exportDate: new Date().toISOString(),
    source: 'Brera Replenishment',
    ordini: list.map(o => ({
      documentNo: o.id,
      dateOrdered: o.data,
      vendor: o.fornitore,
      productCode: o.codiceNormalizzato,
      productOrigCode: o.codiceMadre,
      qty: o.qty,
      priceActual: o.prezzoNetto,
      lineNetAmt: o.totale,
      description: `Ordine automatico Brera Replenishment - ${o.gruppo} - ${o.costruttore}`,
    }))
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brera-ordini-idempiere-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Giacenza reale = ERP + transito + ordinato (non annullato) ───────────────
export function getQuantitaOrdinata(codiceMadre) {
  const ordini = getOrdini()
  return ordini
    .filter(o => o.codiceMadre === codiceMadre && o.stato !== 'annullato')
    .reduce((acc, o) => acc + (o.qty || 0), 0)
}

export function getGiacenzaReale(row) {
  const giacenzaERP = row.giacenza || 0
  const transito = row.merceInTransito || 0
  const ordinato = getQuantitaOrdinata(row.codiceMadre)
  return {
    giacenzaERP,
    transito,
    ordinato,
    totale: giacenzaERP + transito + ordinato,
    coperto: (giacenzaERP + transito + ordinato) >= (row.suggerimentoAcquisto || 0),
  }
}

// Calcola fabbisogno reale tenendo conto degli ordini già registrati
export function getFabbisognoReale(row) {
  const g = getGiacenzaReale(row)
  const suggerito = row.suggerimentoAcquisto || 0
  const fabbisognoReale = Math.max(0, suggerito - g.ordinato - g.transito)
  return {
    ...g,
    suggerito,
    fabbisognoReale,
    ridotto: fabbisognoReale < suggerito,
    coperto: fabbisognoReale === 0,
  }
}

// ─── Export con operatore (aggiornato da operatoreStore) ─────────────────────
export function saveOrdineConOperatore({ row, offer, tipo, qty, operatoreId }) {
  const ordini = getOrdini()
  const ordine = {
    id: `ORD-${Date.now()}`,
    data: new Date().toISOString(),
    dataLeggibile: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    reqId: row?.id,
    codiceMadre: row?.codiceMadre,
    codiceNormalizzato: row?.codiceNormalizzato || row?.codiceMadre,
    gruppo: row?.gruppoMerceologico,
    sottogruppo: row?.sottogruppo,
    linea: offer?.livelloQualitativo || row?.lineaProdotto,
    urgenza: row?.urgenza,
    fornitore: offer?.fornitore,
    codiceFornitore: offer?.codiceFornitore,
    costruttore: offer?.costruttore,
    brand: offer?.brand || offer?.costruttore,
    prezzoNetto: parseFloat(offer?.prezzoNetto || 0),
    prezzoListino: offer?.prezzoListino ? parseFloat(offer.prezzoListino) : null,
    qty: qty || row?.suggerimentoAcquisto || 1,
    totale: parseFloat(offer?.prezzoNetto || 0) * (qty || row?.suggerimentoAcquisto || 1),
    logistica: offer?.logistica,
    leadTime: offer?.leadTime,
    stato: tipo || 'confermato',
    note: '',
    operatore: operatoreId || null,
  }
  ordini.unshift(ordine)
  lsSet(KEY, ordini)
  return ordine
}
