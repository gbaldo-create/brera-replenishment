// ─── Operatore Store — simulazione multi-utente per demo ─────────────────────
// In produzione: sostituire con autenticazione reale

const LS_KEY = 'brera_operatore_attivo'

export const OPERATORI_DEMO = [
  { id: 'CL', nome: 'Claudio',   colore: '#F97316', iniziali: 'CL' },
  { id: 'MR', nome: 'Marco',     colore: '#0F0F0F', iniziali: 'MR' },
  { id: 'GB', nome: 'Giulia',    colore: '#6366F1', iniziali: 'GB' },
  { id: 'FS', nome: 'Francesco', colore: '#10B981', iniziali: 'FS' },
]

export function getOperatore() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const found = OPERATORI_DEMO.find(o => o.id === saved)
      if (found) return found
    }
  } catch {}
  return OPERATORI_DEMO[0] // default: Claudio
}

export function setOperatore(id) {
  try { localStorage.setItem(LS_KEY, id) } catch {}
}

export function getOperatoreById(id) {
  return OPERATORI_DEMO.find(o => o.id === id) || null
}
