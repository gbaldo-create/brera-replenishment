// ─── Notifiche Interne — sistema priorità flusso di lavoro ───────────────────

const LS_KEY = 'brera_notifiche_lette'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export function getNotificheLette() {
  return lsGet(LS_KEY) || []
}

export function segnaComeLetta(id) {
  const lette = getNotificheLette()
  if (!lette.includes(id)) {
    lsSet(LS_KEY, [...lette, id])
  }
}

export function segnaComeLetteTutte(ids) {
  const lette = getNotificheLette()
  const nuove = ids.filter(id => !lette.includes(id))
  if (nuove.length) lsSet(LS_KEY, [...lette, ...nuove])
}

export function resetNotificheLette() {
  lsSet(LS_KEY, [])
}

// ─── Generatore notifiche da stato app ───────────────────────────────────────
// Ogni notifica ha: id, tipo (critico/warning/info), titolo, body, route, priorità
export function generaNotifiche(rows, ordini = []) {
  if (!rows || rows.length === 0) return []

  const notifiche = []
  const now = Date.now()

  // ── CRITICO — giacenza zero con urgenza prioritaria ───────────────────────
  const critici = rows.filter(r =>
    (r.urgenza === 'Critica' || r.urgenza === 'Prioritaria') &&
    r.giacenza === 0 &&
    r._stato !== 'bloccato-tra' && r._stato !== 'bloccato-dup'
  )
  if (critici.length > 0) {
    notifiche.push({
      id: `critico-giacenza-zero-${critici.length}`,
      tipo: 'critico',
      priorita: 1,
      titolo: `${critici.length} articol${critici.length === 1 ? 'o' : 'i'} a giacenza zero`,
      body: `${critici.slice(0, 2).map(r => r.codiceMadre).join(', ')}${critici.length > 2 ? ` +${critici.length - 2} altri` : ''} — da ordinare subito`,
      route: '/workstation',
      ctaLabel: 'Apri Workstation',
      ts: now - 1000,
    })
  }

  // ── CRITICO — ordini in revisione da approvare ────────────────────────────
  const inRevisione = ordini.filter(o => o.stato === 'revisione')
  if (inRevisione.length > 0) {
    notifiche.push({
      id: `revisione-${inRevisione.length}`,
      tipo: 'critico',
      priorita: 2,
      titolo: `${inRevisione.length} ordin${inRevisione.length === 1 ? 'e richiede' : 'i richiedono'} approvazione`,
      body: `${inRevisione.slice(0, 2).map(o => o.codiceMadre).join(', ')}${inRevisione.length > 2 ? ` +${inRevisione.length - 2}` : ''} — in attesa del buyer`,
      route: '/ordini',
      ctaLabel: 'Vai al Registro',
      ts: now - 2000,
    })
  }

  // ── WARNING — articoli con alta ambiguità normalizzazione ─────────────────
  const ambigui = rows.filter(r => (r._conf ?? 95) < 70 && r._stato !== 'mismatch')
  if (ambigui.length > 0) {
    notifiche.push({
      id: `ambigui-${ambigui.length}`,
      tipo: 'warning',
      priorita: 3,
      titolo: `${ambigui.length} codic${ambigui.length === 1 ? 'e richiede' : 'i richiedono'} verifica`,
      body: `Confidenza normalizzazione < 70% — revisione manuale consigliata prima dell'ordine`,
      route: '/normalizzazione',
      ctaLabel: 'Normalizzazione',
      ts: now - 5000,
    })
  }

  // ── WARNING — mismatch / blocchi critici ──────────────────────────────────
  const mismatch = rows.filter(r => r._stato === 'mismatch')
  if (mismatch.length > 0) {
    notifiche.push({
      id: `mismatch-${mismatch.length}`,
      tipo: 'warning',
      priorita: 4,
      titolo: `${mismatch.length} blocch${mismatch.length === 1 ? 'io' : 'i'} per mismatch ERP`,
      body: `Articoli con conflitto famiglia TecDoc/ERP — richiedono intervento manuale`,
      route: '/normalizzazione',
      ctaLabel: 'Vedi blocchi',
      ts: now - 8000,
    })
  }

  // ── WARNING — sottoscorta non prioritari ──────────────────────────────────
  const sottoscorta = rows.filter(r =>
    (r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta') &&
    r._stato !== 'bloccato-tra'
  )
  if (sottoscorta.length > 0) {
    notifiche.push({
      id: `sottoscorta-${sottoscorta.length}`,
      tipo: 'warning',
      priorita: 5,
      titolo: `${sottoscorta.length} articol${sottoscorta.length === 1 ? 'o' : 'i'} sottoscorta`,
      body: `Scorte in esaurimento — pianifica il riordino entro oggi`,
      route: '/fabbisogni',
      ctaLabel: 'Fabbisogni',
      ts: now - 15000,
    })
  }

  // ── INFO — report non ancora caricato oggi ────────────────────────────────
  const oggi = new Date().toDateString()
  const ultimoCarico = lsGet('brera_ultimo_carico')
  if (!ultimoCarico || new Date(ultimoCarico).toDateString() !== oggi) {
    notifiche.push({
      id: `report-mancante-${oggi}`,
      tipo: 'info',
      priorita: 6,
      titolo: 'Report giornaliero non caricato',
      body: `Carica il file ERP di oggi per avviare il flusso di replenishment`,
      route: '/report',
      ctaLabel: 'Importa Report',
      ts: now - 30000,
    })
  }

  // ── INFO — flusso completato oggi ─────────────────────────────────────────
  const confermatiOggi = ordini.filter(o => {
    return new Date(o.data).toDateString() === oggi &&
      (o.stato === 'confermato' || o.stato === 'manuale')
  })
  if (confermatiOggi.length > 0 && critici.length === 0) {
    const totale = confermatiOggi.reduce((s, o) => s + o.totale, 0)
    notifiche.push({
      id: `completato-${oggi}-${confermatiOggi.length}`,
      tipo: 'info',
      priorita: 7,
      titolo: `${confermatiOggi.length} ordin${confermatiOggi.length === 1 ? 'e confermato' : 'i confermati'} oggi`,
      body: `Totale giornaliero: €${totale.toFixed(2)} — vedi il report EOD`,
      route: '/eod-report',
      ctaLabel: 'Report EOD',
      ts: now - 60000,
    })
  }

  return notifiche.sort((a, b) => a.priorita - b.priorita)
}
