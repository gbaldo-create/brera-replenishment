// ─── Notifiche Service ────────────────────────────────────────────────────────
// Gestisce notifiche push del browser e welcome banner all'avvio

const PERM_KEY = 'brera_notifiche_attive'
const LAST_NOTIFICA_KEY = 'brera_last_notifica'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── Permesso notifiche browser ───────────────────────────────────────────────
export async function requestNotifichePermesso() {
  if (!('Notification' in window)) return 'not-supported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  lsSet(PERM_KEY, result === 'granted')
  return result
}

export function getNotifichePermesso() {
  if (!('Notification' in window)) return 'not-supported'
  return Notification.permission
}

export function notificheAttive() {
  return getNotifichePermesso() === 'granted'
}

// ─── Invia notifica push ──────────────────────────────────────────────────────
export function inviaPushNotifica({ titolo, corpo, icona = '🔧', tag, onClick }) {
  if (!notificheAttive()) return null
  try {
    const n = new Notification(`Brera Replenishment — ${titolo}`, {
      body: corpo,
      icon: '/favicon.ico',
      tag: tag || 'brera-default',
      badge: '/favicon.ico',
    })
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close() }
    setTimeout(() => n.close(), 8000)
    return n
  } catch { return null }
}

// ─── Notifiche contestuali ────────────────────────────────────────────────────
export function notificaUrgenze(count, critica) {
  if (count === 0) return
  inviaPushNotifica({
    titolo: `${count} urgenz${count === 1 ? 'a' : 'e'} da elaborare`,
    corpo: critica > 0
      ? `${critica} prioritari (giacenza zero) · Apri la Workstation per iniziare`
      : `${count} articoli sottoscorta · Apri Brera per elaborarli`,
    tag: 'brera-urgenze',
  })
}

export function notificaOrdineConfermato(codiceMadre, fornitore, totale) {
  inviaPushNotifica({
    titolo: 'Ordine confermato',
    corpo: `${codiceMadre} · ${fornitore} · €${totale.toFixed(2)}`,
    tag: 'brera-ordine',
  })
}

export function notificaLoginFallito(fornitore) {
  inviaPushNotifica({
    titolo: `Login fallito — ${fornitore}`,
    corpo: 'Impossibile accedere al portale. Aggiorna le credenziali in Impostazioni.',
    tag: 'brera-login-error',
  })
}

export function notificaOrdineRevisione(codiceMadre) {
  inviaPushNotifica({
    titolo: 'Ordine in attesa di revisione',
    corpo: `${codiceMadre} richiede approvazione del buyer prima dell'invio`,
    tag: 'brera-revisione',
  })
}

// ─── Welcome summary all'avvio ────────────────────────────────────────────────
export function buildWelcomeSummary(rows, ordini) {
  const ora = new Date().getHours()
  const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'

  const prioritari = rows.filter(r =>
    r.urgenza === 'Prioritaria' || r.urgenza === 'Critica'
  ).length

  const sottoscorta = rows.filter(r =>
    r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta'
  ).length

  const inRevisione = ordini.filter(o => o.stato === 'revisione').length
  const confermatiOggi = ordini.filter(o => {
    const oggi = new Date().toDateString()
    return new Date(o.data).toDateString() === oggi &&
      (o.stato === 'confermato' || o.stato === 'manuale')
  }).length

  const totaleOggi = ordini
    .filter(o => {
      const oggi = new Date().toDateString()
      return new Date(o.data).toDateString() === oggi &&
        (o.stato === 'confermato' || o.stato === 'manuale')
    })
    .reduce((acc, o) => acc + o.totale, 0)

  const items = []
  if (prioritari > 0) items.push({ tipo: 'critico', testo: `${prioritari} urgenz${prioritari === 1 ? 'a' : 'e'} prioritar${prioritari === 1 ? 'ia' : 'ie'} (giacenza zero)`, icon: '🔴' })
  if (sottoscorta > 0) items.push({ tipo: 'warning', testo: `${sottoscorta} articol${sottoscorta === 1 ? 'o' : 'i'} sottoscorta`, icon: '🟡' })
  if (inRevisione > 0) items.push({ tipo: 'warning', testo: `${inRevisione} ordin${inRevisione === 1 ? 'e' : 'i'} in revisione da approvare`, icon: '⏳' })
  if (confermatiOggi > 0) items.push({ tipo: 'ok', testo: `${confermatiOggi} ordin${confermatiOggi === 1 ? 'e' : 'i'} confermati oggi · €${totaleOggi.toFixed(2)}`, icon: '✅' })

  return { saluto, items, prioritari, sottoscorta, inRevisione, confermatiOggi, totaleOggi }
}

// ─── Controlla se mostrare il welcome (max 1 volta ogni 4 ore) ────────────────
export function shouldShowWelcome() {
  const last = lsGet(LAST_NOTIFICA_KEY)
  if (!last) { lsSet(LAST_NOTIFICA_KEY, Date.now()); return true }
  const ore4 = 4 * 60 * 60 * 1000
  if (Date.now() - last > ore4) { lsSet(LAST_NOTIFICA_KEY, Date.now()); return true }
  return false
}

export function resetWelcome() { localStorage.removeItem(LAST_NOTIFICA_KEY) }
