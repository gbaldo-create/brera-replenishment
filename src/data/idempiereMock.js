// ─── iDempiere Mock Import Engine ─────────────────────────────────────────────
// Simula la chiamata API REST a iDempiere con filtri parametrici.
// In produzione: sostituire fetchFromIDempiere con chiamata reale all'endpoint REST.

import { reorderReportRows } from './mockData'
import { normalizzaCodice, getMultiplo } from './normalization'

// ─── Gruppi disponibili nel sistema ──────────────────────────────────────────
export const GRUPPI_IDEMPIERE = [
  'Filtrazione', 'Freni', 'Sospensioni', 'Distribuzione',
  'Frizioni', 'Elettrico', 'Raffreddamento', 'Scarico', 'Tergicristalli',
]

export const LINEE_IDEMPIERE = ['Originale', 'Primo Equipaggiamento', 'Economico']

export const URGENZE_IDEMPIERE = [
  { value: 'tutte', label: 'Tutte le urgenze' },
  { value: 'Prioritaria', label: 'Solo Prioritaria (giacenza zero)' },
  { value: 'Sottoscorta', label: 'Solo Sottoscorta' },
]

// ─── Parametri default ────────────────────────────────────────────────────────
export function getDefaultParams() {
  const oggi = new Date()
  const ieri = new Date(oggi)
  ieri.setDate(ieri.getDate() - 1)
  return {
    dataInizio: ieri.toISOString().slice(0, 10),
    dataFine: oggi.toISOString().slice(0, 10),
    urgenza: 'tutte',
    gruppi: [],          // [] = tutti
    linee: [],           // [] = tutte
    giacenzaMax: '',     // '' = nessun limite
    movimentiMin: '',    // '' = nessun limite
    includiBloccati: false,
  }
}

// ─── Simula chiamata iDempiere ────────────────────────────────────────────────
export async function fetchFromIDempiere(params) {
  // Simula latenza di rete (500-1200ms)
  await new Promise(r => setTimeout(r, 500 + Math.random() * 700))

  // In produzione:
  // const res = await fetch(`${IDEMPIERE_BASE_URL}/api/v1/report/sottoscorta`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  //   body: JSON.stringify(params)
  // })
  // const data = await res.json()
  // return data.rows.map((row, i) => mapIDempiereRow(row, i))

  // ─── Mock: filtra i dati demo secondo i parametri ─────────────────────────
  let rows = [...reorderReportRows]

  // Filtro urgenza
  if (params.urgenza && params.urgenza !== 'tutte') {
    rows = rows.filter(r => r.urgenza === params.urgenza ||
      (params.urgenza === 'Prioritaria' && r.urgenza === 'Critica'))
  }

  // Filtro gruppi
  if (params.gruppi && params.gruppi.length > 0) {
    rows = rows.filter(r => params.gruppi.includes(r.gruppoMerceologico))
  }

  // Filtro linee
  if (params.linee && params.linee.length > 0) {
    rows = rows.filter(r => params.linee.includes(r.lineaProdotto))
  }

  // Filtro giacenza massima
  if (params.giacenzaMax !== '' && params.giacenzaMax !== null) {
    const max = Number(params.giacenzaMax)
    if (!isNaN(max)) rows = rows.filter(r => r.giacenza <= max)
  }

  // Filtro movimenti minimi
  if (params.movimentiMin !== '' && params.movimentiMin !== null) {
    const min = Number(params.movimentiMin)
    if (!isNaN(min)) rows = rows.filter(r => r.nMovimenti >= min)
  }

  // Escludi bloccati se richiesto
  if (!params.includiBloccati) {
    rows = rows.filter(r => !r._stato || r._stato === 'ok' || r._stato === 'warn' || r._stato === 'warn-generico')
  }

  // Aggiungi metadata import
  const dataRange = `${params.dataInizio} → ${params.dataFine}`
  rows = rows.map(r => ({
    ...r,
    _fromIDempiere: true,
    _importParams: params,
    _importDate: new Date().toISOString(),
    noteERP: r.noteERP + ` | Import iDempiere: ${dataRange}`,
  }))

  return {
    rows,
    meta: {
      totale: rows.length,
      dataRange,
      filtriAttivi: buildFiltriLabel(params),
      timestamp: Date.now(),
      fonte: 'iDempiere (simulato)',
    }
  }
}

function buildFiltriLabel(params) {
  const filtri = []
  if (params.urgenza && params.urgenza !== 'tutte') filtri.push(`Urgenza: ${params.urgenza}`)
  if (params.gruppi?.length > 0) filtri.push(`Gruppi: ${params.gruppi.join(', ')}`)
  if (params.linee?.length > 0) filtri.push(`Linee: ${params.linee.join(', ')}`)
  if (params.giacenzaMax !== '') filtri.push(`Giacenza ≤ ${params.giacenzaMax}`)
  if (params.movimentiMin !== '') filtri.push(`Movimenti ≥ ${params.movimentiMin}`)
  if (!params.includiBloccati) filtri.push('Esclusi bloccati')
  return filtri.length > 0 ? filtri.join(' · ') : 'Nessun filtro'
}
