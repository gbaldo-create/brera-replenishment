// ─── Brand Configuration Store ────────────────────────────────────────────────
// Tabella brand di riferimento per gruppo merceologico
// Tabella brand concorrenza con classificazione qualitativa

const BRAND_REF_KEY = 'brera_brand_riferimento'
const BRAND_CONC_KEY = 'brera_brand_concorrenza'

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── Default brand di riferimento per gruppo ─────────────────────────────────
const DEFAULT_BRAND_RIFERIMENTO = [
  { gruppo: 'Freni',         brandRiferimento: 'Brembo',    note: 'OEM per dischi e pastiglie' },
  { gruppo: 'Filtrazione',   brandRiferimento: 'Mann',      note: 'Filtri olio, aria, abitacolo' },
  { gruppo: 'Sospensioni',   brandRiferimento: 'Monroe',    note: 'Ammortizzatori e molle' },
  { gruppo: 'Distribuzione', brandRiferimento: 'Continental',note: 'Kit distribuzione e cinghie' },
  { gruppo: 'Frizioni',      brandRiferimento: 'Valeo',     note: 'Kit frizione e volani' },
  { gruppo: 'Elettrico',     brandRiferimento: 'Bosch',     note: 'Batterie, alternatori, motorini' },
  { gruppo: 'Raffreddamento',brandRiferimento: 'Valeo',     note: 'Radiatori e termostati' },
  { gruppo: 'Scarico',       brandRiferimento: 'Bosal',     note: 'Silenziatori e catalizzatori' },
  { gruppo: 'Tergicristalli',brandRiferimento: 'Bosch',     note: 'Spazzole e bracci' },
]

// ─── Default brand concorrenza ────────────────────────────────────────────────
const DEFAULT_BRAND_CONCORRENZA = [
  { brand: 'Brembo',       linea: 'Originale',           note: 'OEM premium freni' },
  { brand: 'Bosch',        linea: 'Originale',           note: 'OEM elettrico e filtri' },
  { brand: 'Continental',  linea: 'Originale',           note: 'OEM distribuzione' },
  { brand: 'Valeo',        linea: 'Originale',           note: 'OEM frizioni e raffreddamento' },
  { brand: 'LUK',          linea: 'Originale',           note: 'OEM frizioni Schaeffler' },
  { brand: 'Sachs',        linea: 'Originale',           note: 'OEM sospensioni ZF' },
  { brand: 'Delphi',       linea: 'Originale',           note: 'OEM sistemi iniezione' },
  { brand: 'NGK',          linea: 'Originale',           note: 'OEM candele e sonde lambda' },
  { brand: 'Mann',         linea: 'Originale',           note: 'OEM filtrazione' },
  { brand: 'Mahle',        linea: 'Originale',           note: 'OEM termico e filtrazione' },
  { brand: 'Monroe',       linea: 'Primo Equipaggiamento',note: 'Aftermarket sospensioni qualità' },
  { brand: 'Bilstein',     linea: 'Primo Equipaggiamento',note: 'Aftermarket premium sospensioni' },
  { brand: 'Textar',       linea: 'Primo Equipaggiamento',note: 'Aftermarket freni qualità' },
  { brand: 'Ferodo',       linea: 'Primo Equipaggiamento',note: 'Aftermarket freni qualità' },
  { brand: 'ATE',          linea: 'Primo Equipaggiamento',note: 'Aftermarket freni Continental' },
  { brand: 'TRW',          linea: 'Primo Equipaggiamento',note: 'Aftermarket freni ZF' },
  { brand: 'Gates',        linea: 'Primo Equipaggiamento',note: 'Aftermarket distribuzione' },
  { brand: 'Dayco',        linea: 'Primo Equipaggiamento',note: 'Aftermarket distribuzione' },
  { brand: 'SKF',          linea: 'Primo Equipaggiamento',note: 'Aftermarket cuscinetti' },
  { brand: 'Magneti Marelli',linea:'Primo Equipaggiamento',note: 'Aftermarket multilinea' },
  { brand: 'Japanparts',   linea: 'Economico',           note: 'Aftermarket economico JPN' },
  { brand: 'Ridex',        linea: 'Economico',           note: 'Aftermarket economico multilinea' },
  { brand: 'Blue Print',   linea: 'Economico',           note: 'Aftermarket economico ADL' },
  { brand: 'Kamoka',       linea: 'Economico',           note: 'Aftermarket economico PL' },
  { brand: 'Stark',        linea: 'Economico',           note: 'Aftermarket budget' },
  { brand: 'Topran',       linea: 'Economico',           note: 'Aftermarket budget DE' },
]

// ─── CRUD Brand Riferimento ───────────────────────────────────────────────────
export function getBrandRiferimento() {
  return lsGet(BRAND_REF_KEY) || DEFAULT_BRAND_RIFERIMENTO
}

export function saveBrandRiferimento(list) {
  lsSet(BRAND_REF_KEY, list)
}

export function getBrandPerGruppo(gruppo) {
  const list = getBrandRiferimento()
  return list.find(r => r.gruppo === gruppo)?.brandRiferimento || null
}

// ─── CRUD Brand Concorrenza ───────────────────────────────────────────────────
export function getBrandConcorrenza() {
  return lsGet(BRAND_CONC_KEY) || DEFAULT_BRAND_CONCORRENZA
}

export function saveBrandConcorrenza(list) {
  lsSet(BRAND_CONC_KEY, list)
}

export function getLineaPerBrand(brand) {
  const list = getBrandConcorrenza()
  const found = list.find(b =>
    b.brand.toLowerCase() === (brand || '').toLowerCase()
  )
  return found?.linea || null
}

// ─── Suggerisci prezzo vendita basato su competitor ───────────────────────────
export function suggestPrezzoVenditaCompetitor(prezzoAcquisto, brand, gruppo) {
  const linea = getLineaPerBrand(brand)

  const margini = {
    'Originale':            { min: 1.20, max: 1.35, label: '20-35%' },
    'Primo Equipaggiamento':{ min: 1.35, max: 1.55, label: '35-55%' },
    'Economico':            { min: 1.50, max: 1.80, label: '50-80%' },
  }

  const m = margini[linea] || margini['Primo Equipaggiamento']
  const prezzoSuggerito = prezzoAcquisto * ((m.min + m.max) / 2)

  return {
    linea: linea || 'Non catalogato',
    prezzoSuggerito: Math.round(prezzoSuggerito * 100) / 100,
    range: {
      min: Math.round(prezzoAcquisto * m.min * 100) / 100,
      max: Math.round(prezzoAcquisto * m.max * 100) / 100,
    },
    margineLabel: m.label,
    fonteDati: linea ? 'tabella brand concorrenza' : 'margine default',
  }
}

export const GRUPPI_DISPONIBILI = [
  'Freni', 'Filtrazione', 'Sospensioni', 'Distribuzione',
  'Frizioni', 'Elettrico', 'Raffreddamento', 'Scarico', 'Tergicristalli',
]

export const LINEE_DISPONIBILI = ['Originale', 'Primo Equipaggiamento', 'Economico']
