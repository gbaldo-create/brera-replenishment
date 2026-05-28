// ─── QRicambi Mock Engine ─────────────────────────────────────────────────────
// Simula le risposte di QRicambi per la demo.
// In produzione questo file viene sostituito con il connettore reale.

import { BRAND_PREFIXES } from './normalization'
import { getBrandPerGruppo } from './brandConfig'

// ─── Database fornitori simulati ─────────────────────────────────────────────
const FORNITORI = [
  { nome: 'Demauto', tipo: 'filiale', cities: ['Milano', 'Roma', 'Torino'], markup: 0.85 },
  { nome: 'Movidis', tipo: 'filiale', cities: ['Milano', 'Bologna'], markup: 0.90 },
  { nome: 'Rhiag Hub', tipo: 'sede', cities: ['Sede Nazionale'], markup: 0.82 },
  { nome: 'Autodis Italia', tipo: 'filiale', cities: ['Milano', 'Verona', 'Napoli'], markup: 0.88 },
  { nome: 'Repar', tipo: 'sede', cities: ['Sede Centrale'], markup: 0.80 },
  { nome: 'iDir', tipo: 'filiale', cities: ['Milano'], markup: 0.92 },
  { nome: 'Claudio', tipo: 'sede', cities: ['Chorzow', 'Varsavia'], markup: 0.75 },
  { nome: 'Profi', tipo: 'sede', cities: ['Chorzow'], markup: 0.78 },
  { nome: 'Marinelli', tipo: 'filiale', cities: ['Roma', 'Napoli'], markup: 0.91 },
]

// ─── Prezzi listino per categoria ────────────────────────────────────────────
const LISTINO_BASE = {
  'Filtro Olio': 4.4, 'Filtro Aria': 7.2, 'Filtro Abitacolo': 9.8,
  'Filtro Carburante': 11.5, 'Disco Freno': 42.0, 'Pastiglie Freno': 28.0,
  'Ammortizzatore': 68.0, 'Kit Frizione': 185.0, 'Cinghia': 18.0,
  'Kit Distribuzione': 95.0, 'Pompa Acqua': 45.0, 'Batteria': 89.0,
  'Alternatore': 145.0, 'Radiatore': 165.0, 'Termostato': 22.0,
  'Spazzola': 8.5, 'Silenziatore': 95.0, 'default': 35.0,
}

// ─── Costruttori per categoria ────────────────────────────────────────────────
const COSTRUTTORI = {
  'Filtro': ['ASHKA', 'JAP KO', 'KAMOKA', 'MANN', 'BOSCH', 'PURFLUX', 'FRAM'],
  'Freni': ['BREMBO', 'TEXTAR', 'FERODO', 'ATE', 'TRW', 'MINTEX', 'JURID'],
  'Sospensioni': ['MONROE', 'BILSTEIN', 'KYB', 'SACHS', 'GABRIEL', 'KONI'],
  'Frizioni': ['LUK', 'SACHS', 'VALEO', 'EXEDY'],
  'Distribuzione': ['CONTINENTAL', 'GATES', 'DAYCO', 'SKF', 'INA'],
  'Elettrico': ['BOSCH', 'VALEO', 'DENSO', 'DELPHI', 'NGK'],
  'Raffreddamento': ['VALEO', 'NISSENS', 'MAHLE', 'NRF', 'THERMOTEC'],
  'default': ['MAGNETI MARELLI', 'RIDEX', 'MEYLE', 'FEBI', 'BLUE PRINT'],
}

// ─── Descrizioni realistiche ──────────────────────────────────────────────────
function buildDescrizione(gruppo, codice, costruttore) {
  const g = gruppo.toLowerCase()
  if (g.includes('filtro') && g.includes('olio')) return `Filtro olio Lungh.${62 + Math.floor(Math.random()*20)}D.Est.${60 + Math.floor(Math.random()*10)}D.Mont.${58 + Math.floor(Math.random()*8)}`
  if (g.includes('filtro') && g.includes('aria')) return `Filtro aria ${280 + Math.floor(Math.random()*40)}x${140 + Math.floor(Math.random()*30)}x${40 + Math.floor(Math.random()*20)}mm`
  if (g.includes('filtro') && g.includes('abitacolo')) return `Filtro abitacolo ${250 + Math.floor(Math.random()*30)}x${200 + Math.floor(Math.random()*20)}x${25 + Math.floor(Math.random()*10)}mm`
  if (g.includes('disco') || g.includes('freno')) return `Disco freno Diam.${280 + Math.floor(Math.random()*40)}Sp.${22 + Math.floor(Math.random()*6)}H.${45 + Math.floor(Math.random()*10)}`
  if (g.includes('pastiglia')) return `Kit pastiglie freno ${costruttore} con sensore usura`
  if (g.includes('ammortizzatore')) return `Ammortizzatore ${['idraulico', 'a gas', 'Reflex Gas'][Math.floor(Math.random()*3)]} ${costruttore}`
  if (g.includes('cinghia')) return `Cinghia ${['distribuzione', 'servizi', 'alternatore'][Math.floor(Math.random()*3)]} ${codice}`
  return `${gruppo} ${costruttore} cod.${codice}`
}

// ─── Disponibilità realistica ─────────────────────────────────────────────────
function buildDisponibilita(fornitore, qty) {
  if (fornitore.tipo === 'filiale') {
    const city = fornitore.cities[Math.floor(Math.random() * fornitore.cities.length)]
    const filiali = Math.floor(Math.random() * 800) + 50
    if (qty < 20) return { label: `${city}: ${qty} Filiali`, sede: 'filiale', leadTime: 'Oggi stesso' }
    return { label: `Sede:${filiali} Filiali`, sede: 'filiale', leadTime: `${Math.floor(Math.random()*3) + 1} ore` }
  } else {
    const city = fornitore.cities[0]
    const qty2 = Math.floor(Math.random() * 50) + 1
    return { label: `${city}: ${qty2}`, sede: 'sede', leadTime: `${Math.floor(Math.random()*2) + 1} giorno/i` }
  }
}

// ─── Consegna simulata ────────────────────────────────────────────────────────
function buildConsegna(sede) {
  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven']
  const day = days[Math.floor(Math.random() * days.length)]
  const hours = ['10:00', '13:00', '16:00', '18:00']
  const hour = hours[Math.floor(Math.random() * hours.length)]
  if (sede === 'filiale') return `${day}(+1) ${hour}`
  return `${day}(+2) ${hour}`
}

// ─── Genera risultati per un codice ──────────────────────────────────────────
function generateResults(codiceNormalizzato, gruppo, costruttorePrevalente, lineaProdotto) {
  const g = gruppo || 'default'
  const gKey = Object.keys(LISTINO_BASE).find(k => g.toLowerCase().includes(k.toLowerCase())) || 'default'
  const listinoBase = LISTINO_BASE[gKey]

  // Costruttori rilevanti per questo gruppo
  const gCostKey = Object.keys(COSTRUTTORI).find(k => g.toLowerCase().includes(k.toLowerCase())) || 'default'
  const costruttoriDisp = COSTRUTTORI[gCostKey] || COSTRUTTORI.default

  // Usa brand di riferimento configurato come primo risultato
  const brandRiferimento = getBrandPerGruppo(gruppo)
  const brandPrioritario = costruttorePrevalente?.toUpperCase() || brandRiferimento?.toUpperCase() || null
  const costruttoriOrdinati = brandPrioritario
    ? [brandPrioritario, ...costruttoriDisp.filter(c => c !== brandPrioritario)]
    : costruttoriDisp

  const results = []
  const numFornitori = Math.floor(Math.random() * 5) + 4 // 4-8 fornitori

  const fornitoriFiltrati = [...FORNITORI].sort(() => Math.random() - 0.5).slice(0, numFornitori)

  fornitoriFiltrati.forEach((fornitore, i) => {
    // Variante codice per questo fornitore
    const variantCode = i === 0
      ? codiceNormalizzato
      : `${codiceNormalizzato.slice(0, -2)}${String.fromCharCode(65 + i)}${Math.floor(Math.random()*9)}`

    const costruttore = costruttoriOrdinati[i % costruttoriOrdinati.length]
    const prezzoListino = listinoBase * (0.9 + Math.random() * 0.3)
    const prezzoNetto = prezzoListino * fornitore.markup * (0.85 + Math.random() * 0.2)
    const dispo = buildDisponibilita(fornitore, Math.floor(Math.random() * 200) + 10)
    const descrizione = buildDescrizione(g, variantCode, costruttore)
    const consegna = buildConsegna(dispo.sede)

    // Determina linea qualitativa
    let livello = 'Primo Equipaggiamento'
    if (['BREMBO', 'BOSCH', 'CONTINENTAL', 'VALEO', 'LUK', 'SACHS', 'BILSTEIN'].includes(costruttore)) livello = 'Originale'
    else if (['RIDEX', 'BLUE PRINT', 'JAP KO', 'KAMOKA', 'ASHKA'].includes(costruttore)) livello = 'Economico'

    // Aggiungi complementari solo su alcuni (da escludere)
    const isComplementare = Math.random() < 0.15 && i > 3

    results.push({
      id: `QR-${codiceNormalizzato}-${i}`,
      fornitore: fornitore.nome,
      codiceFornitore: variantCode,
      descrizione: isComplementare ? `Kit accessori per ${g}` : descrizione,
      costruttore: isComplementare ? 'VARI' : costruttore,
      prezzoListino: Math.round(prezzoListino * 100) / 100,
      prezzoNetto: Math.round(prezzoNetto * 100) / 100,
      disponibilita: dispo.label,
      sede: dispo.sede,
      logistica: dispo.sede === 'filiale' ? 'Filiale Locale' : 'Sede Centrale',
      leadTime: dispo.leadTime,
      consegna,
      livelloQualitativo: livello,
      fratelliArticolo: Math.random() > 0.5 ? `${Math.floor(Math.random()*5)+1} equivalenti` : 'Nessuno',
      scoreAffidabilita: Math.floor(Math.random() * 15) + 82,
      noteRischio: isComplementare ? 'COMPLEMENTARE — da escludere' : '',
      isComplementare,
    })
  })

  // Ordina per prezzo netto
  return results.sort((a, b) => a.prezzoNetto - b.prezzoNetto)
}

// ─── API pubblica del mock ────────────────────────────────────────────────────
// In produzione: sostituire con fetch a endpoint reale QRicambi
async function searchQRicambiMock(codiceNormalizzato, row) {
  // Simula latenza di rete (300-900ms)
  await new Promise(r => setTimeout(r, 300 + Math.random() * 600))

  if (!codiceNormalizzato || codiceNormalizzato === '[trovare in iDempiere]') {
    return { success: false, error: 'Codice non valido — trovare il codice figlio in iDempiere', results: [] }
  }

  const gruppo = row?.gruppoMerceologico || 'Filtro'
  const brand = row?.brand || null

  const results = generateResults(codiceNormalizzato, gruppo, brand, row?.lineaProdotto)

  return {
    success: true,
    codiceRicercato: codiceNormalizzato,
    totaleRisultati: results.length,
    results,
    fonte: 'QRicambi Demo',
    timestamp: Date.now(),
  }
}

// ─── Feature flag: MOCK vs BACKEND REALE ─────────────────────────────────────
// Per attivare il backend reale:
//   1. Avvia brera-backend: cd brera-backend && npm install && npm run dev
//   2. Imposta USE_REAL_BACKEND = true qui sotto (o via localStorage in dev)

const USE_REAL_BACKEND = localStorage.getItem('brera_use_real_backend') === 'true' || false
const BACKEND_URL = 'http://localhost:3001'

// Wrapper che switcha automaticamente tra mock e reale
const _searchMock = searchQRicambiMock

export async function searchQRicambi(codiceNormalizzato, row) {
  if (!USE_REAL_BACKEND) {
    return _searchMock(codiceNormalizzato, row)
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/qricambi/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codice: codiceNormalizzato, gruppo: row?.gruppoMerceologico }),
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    // Se il backend non trova nulla, fallback al mock per la demo
    if (!data.success || data.results?.length === 0) {
      console.warn('[QRicambi] Nessun risultato reale, fallback al mock')
      return _searchMock(codiceNormalizzato, row)
    }
    return data
  } catch (err) {
    console.warn('[QRicambi] Backend non raggiungibile, uso mock:', err.message)
    return _searchMock(codiceNormalizzato, row)
  }
}

// Helper per attivare/disattivare il backend reale da console browser:
// localStorage.setItem('brera_use_real_backend', 'true'); location.reload()
// localStorage.removeItem('brera_use_real_backend'); location.reload()
