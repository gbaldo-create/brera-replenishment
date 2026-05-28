// ─── Family Mappings (25 famiglie) ───────────────────────────────────────────
export const familyMappings = {
  'FIL-OL': { erp: 'Filtrazione', tecdoc: 'Filtro Olio', coerenza: true },
  'FIL-AR': { erp: 'Filtrazione', tecdoc: 'Filtro Aria', coerenza: true },
  'FIL-AB': { erp: 'Filtrazione', tecdoc: 'Filtro Abitacolo', coerenza: true },
  'FIL-CB': { erp: 'Filtrazione', tecdoc: 'Filtro Carburante', coerenza: true },
  'FRE-DA': { erp: 'Freni', tecdoc: 'Disco Freno Anteriore', coerenza: true },
  'FRE-DP': { erp: 'Freni', tecdoc: 'Disco Freno Posteriore', coerenza: true },
  'FRE-PA': { erp: 'Freni', tecdoc: 'Pasticche Freno Ant', coerenza: true },
  'FRE-PP': { erp: 'Freni', tecdoc: 'Pasticche Freno Post', coerenza: true },
  'SOS-AM': { erp: 'Sospensioni', tecdoc: 'Ammortizzatore', coerenza: true },
  'SOS-MO': { erp: 'Sospensioni', tecdoc: 'Molla Elicoidale', coerenza: true },
  'SOS-BR': { erp: 'Sospensioni', tecdoc: 'Braccio Oscillante', coerenza: true },
  'FRI-KI': { erp: 'Frizioni', tecdoc: 'Kit Frizione', coerenza: true },
  'FRI-VO': { erp: 'Frizioni', tecdoc: 'Volano Bimassa', coerenza: true },
  'MOT-CI': { erp: 'Distribuzione', tecdoc: 'Cinghia Servizi', coerenza: true },
  'MOT-KI': { erp: 'Distribuzione', tecdoc: 'Kit Cinghia Distribuzione', coerenza: true },
  'MOT-PO': { erp: 'Distribuzione', tecdoc: 'Pompa Acqua', coerenza: true },
  'ACC-BA': { erp: 'Elettrico', tecdoc: 'Batteria Avviamento', coerenza: true },
  'ACC-AL': { erp: 'Elettrico', tecdoc: 'Alternatore', coerenza: true },
  'ACC-MO': { erp: 'Elettrico', tecdoc: 'Motorino Avviamento', coerenza: true },
  'ACC-CA': { erp: 'Elettrico', tecdoc: 'Cavi Candele', coerenza: true },
  'TER-SP': { erp: 'Tergicristalli', tecdoc: 'Spazzola Tergitura', coerenza: true },
  'RAF-RA': { erp: 'Raffreddamento', tecdoc: 'Radiatore Raffreddamento', coerenza: true },
  'RAF-TE': { erp: 'Raffreddamento', tecdoc: 'Termostato', coerenza: true },
  'SCA-SI': { erp: 'Scarico', tecdoc: 'Silenziatore Posteriore', coerenza: true },
  'ANOMALA': { erp: 'Sospensioni', tecdoc: 'Componenti Motore (MISMATCH)', coerenza: false },
}

// ─── Report Input Rows (9 special + 56 generated = 65 total) ─────────────────
export const reorderReportRows = [
  {
    id: 'REQ-001', codiceMadre: 'M-103316', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Filtrazione', sottogruppo: 'Filtri Olio',
    nMovimenti: 45, quantitaVendutaStimata: 45, giacenza: 2, merceInTransito: 0,
    suggerimentoAcquisto: 15, urgenza: 'Critica', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Caso semplice: match chiaro e acquisto lineare.',
    _stato: 'ok', _conf: 99,
  },
  {
    id: 'REQ-002', codiceMadre: 'O-9A62111', lineaProdotto: 'Originale',
    gruppoMerceologico: 'Freni', sottogruppo: 'Dischi Freno',
    nMovimenti: 12, quantitaVendutaStimata: 24, giacenza: 0, merceInTransito: 0,
    suggerimentoAcquisto: 10, urgenza: 'Critica', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Codice OE con prefisso. Venduto a coppie.',
    _stato: 'warn', _conf: 96,
  },
  {
    id: 'REQ-003', codiceMadre: 'M-E6200', lineaProdotto: 'Economico',
    gruppoMerceologico: 'Sospensioni', sottogruppo: 'Ammortizzatori Ant',
    nMovimenti: 14, quantitaVendutaStimata: 14, giacenza: 1, merceInTransito: 0,
    suggerimentoAcquisto: 6, urgenza: 'Media', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Linea Economica. Alternativa economica disponibile subito.',
    _stato: 'ok', _conf: 94,
  },
  {
    id: 'REQ-004', codiceMadre: 'M-AM4412', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Sospensioni', sottogruppo: 'Ammortizzatori Post',
    nMovimenti: 5, quantitaVendutaStimata: 5, giacenza: 0, merceInTransito: 0,
    suggerimentoAcquisto: 4, urgenza: 'Alta', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'MISMATCH CRITICO FAMIGLIA: ERP indica Sospensioni, TecDoc indica Filtro Olio.',
    _stato: 'mismatch', _conf: 32,
  },
  {
    id: 'REQ-005', codiceMadre: 'JPP-FO-316S', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Filtrazione', sottogruppo: 'Filtri Olio',
    nMovimenti: 80, quantitaVendutaStimata: 80, giacenza: 3, merceInTransito: 0,
    suggerimentoAcquisto: 25, urgenza: 'Media', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Codice con trattini. Richiede decompressione.',
    _stato: 'ok', _conf: 91,
  },
  {
    id: 'REQ-006', codiceMadre: 'M-552143', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Frizioni', sottogruppo: 'Kit Frizione',
    nMovimenti: 3, quantitaVendutaStimata: 3, giacenza: 0, merceInTransito: 0,
    suggerimentoAcquisto: 2, urgenza: 'Bassa', statoOrdinePrecedente: 'Inviato ieri',
    noteERP: 'Articolo ordinato ieri. Bloccare potenziale duplicato.',
    _stato: 'bloccato-dup', _conf: 97,
  },
  {
    id: 'REQ-007', codiceMadre: 'M-74125', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Elettrico', sottogruppo: 'Batterie Avviamento',
    nMovimenti: 22, quantitaVendutaStimata: 22, giacenza: 2, merceInTransito: 30,
    suggerimentoAcquisto: 15, urgenza: 'Bassa', statoOrdinePrecedente: 'In transito',
    noteERP: 'Merce in transito sufficiente a coprire il fabbisogno.',
    _stato: 'bloccato-tra', _conf: 99,
  },
  {
    id: 'REQ-008', codiceMadre: 'M-DESC-ERR', lineaProdotto: 'Primo Equipaggiamento',
    gruppoMerceologico: 'Distribuzione', sottogruppo: 'Cinghia Servizi',
    nMovimenti: 19, quantitaVendutaStimata: 19, giacenza: 1, merceInTransito: 0,
    suggerimentoAcquisto: 10, urgenza: 'Alta', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Descrizione fuorviante in anagrafica (Cinghia vs Kit completo).',
    _stato: 'warn', _conf: 58,
  },
  {
    id: 'REQ-009', codiceMadre: 'M-LOG-DIFF', lineaProdotto: 'Originale',
    gruppoMerceologico: 'Raffreddamento', sottogruppo: 'Radiatori',
    nMovimenti: 7, quantitaVendutaStimata: 7, giacenza: 0, merceInTransito: 0,
    suggerimentoAcquisto: 3, urgenza: 'Critica', statoOrdinePrecedente: 'Nessuno',
    noteERP: 'Sede vs Filiale producono ranking diverso per tempi di arrivo.',
    _stato: 'ok', _conf: 95,
  },
]

// Generate 56 standard rows
const uMap = ['Alta', 'Media', 'Bassa']
const lMap = ['Originale', 'Primo Equipaggiamento', 'Economico']
const gMap = ['Filtrazione', 'Freni', 'Sospensioni', 'Distribuzione', 'Elettrico']
const specialNotes = {
  15: 'PROMPT MULTIPLI: Sistema propone 3 prompt di ricerca diversi.',
  22: 'FALSI POSITIVI: Ricerca genera troppi falsi positivi sul portale.',
  33: 'LISTINO MANCANTE: Mancanza cronica del prezzo di listino ufficiale.',
  44: 'TASK REVISION: Genera automaticamente un task di revisione mapping.',
  55: 'FOLLOW UP TASK: Richiede follow-up per disponibilità locale dubbia.',
}

for (let i = 10; i <= 65; i++) {
  const urgenza = uMap[i % 3]
  const linea = lMap[i % 3]
  const gruppo = gMap[i % 5]
  const isSpecial = specialNotes[i]
  const conf = isSpecial ? (i === 22 ? 55 : 75) : 95
  const stato = isSpecial ? 'warn' : 'ok'
  reorderReportRows.push({
    id: `REQ-${String(i).padStart(3, '0')}`,
    codiceMadre: `M-REP${10000 + i}`,
    lineaProdotto: linea,
    gruppoMerceologico: gruppo,
    sottogruppo: gruppo === 'Filtrazione' ? 'Filtri Aria' : gruppo === 'Freni' ? 'Pasticche Freno Ant' : 'Standard',
    nMovimenti: 16,
    quantitaVendutaStimata: 16,
    giacenza: 1,
    merceInTransito: 0,
    suggerimentoAcquisto: 8,
    urgenza,
    statoOrdinePrecedente: 'Nessuno',
    noteERP: isSpecial || 'Standard replenishment row.',
    _stato: stato,
    _conf: conf,
  })
}

// ─── Normalization Log ────────────────────────────────────────────────────────
export const normalizationsLog = {
  'M-103316': {
    codiceNormalizzato: '103316',
    brandRilevato: 'Purflux Equiv.',
    famigliaERP: 'Filtrazione',
    famigliaTecDoc: 'Filtro Olio',
    confidence: 99,
    warning: null,
    azione: 'Rimozione prefisso magazzino M- e allineamento codice base',
  },
  'O-9A62111': {
    codiceNormalizzato: '09.A621.11',
    brandRilevato: 'Brembo OE',
    famigliaERP: 'Freni',
    famigliaTecDoc: 'Disco Freno Anteriore',
    confidence: 96,
    warning: 'Codice inserito con prefisso OE di magazzino. Rilevato packaging a coppia.',
    azione: 'Stripping prefisso O-, inserimento punteggiatura standard TecDoc',
  },
  'M-E6200': {
    codiceNormalizzato: 'E6200',
    brandRilevato: 'Monroe Alternativo',
    famigliaERP: 'Sospensioni',
    famigliaTecDoc: 'Ammortizzatore',
    confidence: 94,
    warning: null,
    azione: 'Normalizzazione codice compresso',
  },
  'M-AM4412': {
    codiceNormalizzato: 'AM4412',
    brandRilevato: 'Indeterminato',
    famigliaERP: 'Sospensioni',
    famigliaTecDoc: 'Filtro Olio (CONFLITTO)',
    confidence: 32,
    warning: "DIVERGENZA MACRO-FAMIGLIA: L'anagrafica ERP collide con il tracciamento TecDoc.",
    azione: 'BLOCCATO - Inviato a revisione umana obbligatoria',
  },
  'JPP-FO-316S': {
    codiceNormalizzato: 'FO316S',
    brandRilevato: 'Japanparts',
    famigliaERP: 'Filtrazione',
    famigliaTecDoc: 'Filtro Olio',
    confidence: 91,
    warning: 'Rilevato codice in formato compressed con trattini commerciali.',
    azione: 'Decompressione stringa e rimozione sigla distributore iniziale',
  },
  'M-552143': {
    codiceNormalizzato: '552143',
    brandRilevato: 'LUK',
    famigliaERP: 'Frizioni',
    famigliaTecDoc: 'Kit Frizione',
    confidence: 97,
    warning: 'Ordine emesso ieri. Rilevato potenziale duplicato.',
    azione: 'BLOCCATO - Ordine precedente in corso',
  },
  'M-74125': {
    codiceNormalizzato: '74125',
    brandRilevato: 'Varta',
    famigliaERP: 'Elettrico',
    famigliaTecDoc: 'Batteria Avviamento',
    confidence: 99,
    warning: '30 pz in transito coprono interamente il fabbisogno (15 pz).',
    azione: 'ANNULLATO - Transito sufficiente',
  },
  'M-DESC-ERR': {
    codiceNormalizzato: '5PK1230',
    brandRilevato: 'Continental',
    famigliaERP: 'Distribuzione',
    famigliaTecDoc: 'Cinghia Servizi',
    confidence: 58,
    warning: 'Rischio Semantico: Descrizione ERP indica Kit ma il codice corrisponde alla singola cinghia.',
    azione: 'Assegnata revisione per ambiguità descrittiva',
  },
  'M-LOG-DIFF': {
    codiceNormalizzato: 'RA77210',
    brandRilevato: 'Valeo OE',
    famigliaERP: 'Raffreddamento',
    famigliaTecDoc: 'Radiatore Raffreddamento',
    confidence: 95,
    warning: 'Discrepanza semantica sui tempi logistici tra Hub centrale e Filiale locale.',
    azione: 'Normalizzato con flag logistico avanzato',
  },
}

// ─── Supplier Offers ──────────────────────────────────────────────────────────
export const supplierOffers = {
  'M-103316': [
    {
      id: 'OFF-001-A',
      fornitore: 'Rhiag Hub', codiceFornitore: '103316',
      descrizione: 'Filtro Olio Motor-Clean', brand: 'Purflux',
      livelloQualitativo: 'Primo Equipaggiamento', prezzoListino: 14.80, prezzoNetto: 5.90,
      disponibilita: 'Immediata', logistica: 'Filiale Locale', sede: 'filiale',
      leadTime: 'Oggi stesso', fratelliArticolo: '4 equivalenti presenti',
      scoreAffidabilita: 98, noteRischio: '',
    },
    {
      id: 'OFF-001-B',
      fornitore: 'Autodis Italia', codiceFornitore: 'FL-1033',
      descrizione: 'Filtro Olio EcoLine', brand: 'Japanparts',
      livelloQualitativo: 'Economico', prezzoListino: 11.20, prezzoNetto: 3.80,
      disponibilita: 'Disponibile', logistica: 'Sede Centrale', sede: 'sede',
      leadTime: '24 ore', fratelliArticolo: '1 equivalente',
      scoreAffidabilita: 94, noteRischio: '',
    },
    {
      id: 'OFF-001-C',
      fornitore: 'Marinelli Ricambi', codiceFornitore: 'OE-103316',
      descrizione: 'Filtro Olio Originale S', brand: 'Originale VAG',
      livelloQualitativo: 'Originale', prezzoListino: 22.00, prezzoNetto: 15.40,
      disponibilita: 'Limitata', logistica: 'Sede Centrale', sede: 'sede',
      leadTime: '48 ore', fratelliArticolo: 'Nessuno',
      scoreAffidabilita: 99, noteRischio: '',
    },
  ],
  'O-9A62111': [
    {
      id: 'OFF-002-A',
      fornitore: 'Brembo Official Shop', codiceFornitore: '09.A621.11',
      descrizione: 'Disco Freno Premium Coated', brand: 'Brembo',
      livelloQualitativo: 'Originale', prezzoListino: 92.00, prezzoNetto: 46.00,
      disponibilita: 'Immediata', logistica: 'Filiale Locale', sede: 'filiale',
      leadTime: '3 ore', fratelliArticolo: '2 fratelli strutturali',
      scoreAffidabilita: 100, noteRischio: '',
    },
    {
      id: 'OFF-002-B',
      fornitore: 'Rhiag Hub', codiceFornitore: 'DF-9A621',
      descrizione: 'Disco Freno Standard Tech', brand: 'Starline',
      livelloQualitativo: 'Economico', prezzoListino: 55.00, prezzoNetto: 21.50,
      disponibilita: 'Disponibile', logistica: 'Sede Centrale', sede: 'sede',
      leadTime: '24 ore', fratelliArticolo: 'Nessuno',
      scoreAffidabilita: 82, noteRischio: 'Richiesto livello qualitativo Originale dal buyer',
    },
  ],
  'M-E6200': [
    {
      id: 'OFF-003-A',
      fornitore: 'Autodis Italia', codiceFornitore: 'E6200-ST',
      descrizione: 'Ammortizzatore Idraulico Standard', brand: 'Stark',
      livelloQualitativo: 'Economico', prezzoListino: null, prezzoNetto: 24.00,
      disponibilita: 'Immediata', logistica: 'Filiale Locale', sede: 'filiale',
      leadTime: '4 ore', fratelliArticolo: '1 fratello',
      scoreAffidabilita: 95, noteRischio: 'Prezzo di listino non pubblicato dal costruttore',
    },
    {
      id: 'OFF-003-B',
      fornitore: 'Sora Autoricambi', codiceFornitore: 'MON-E6200',
      descrizione: 'Ammortizzatore Reflex Gas', brand: 'Monroe',
      livelloQualitativo: 'Primo Equipaggiamento', prezzoListino: 72.00, prezzoNetto: 38.50,
      disponibilita: 'Disponibile', logistica: 'Sede Centrale', sede: 'sede',
      leadTime: '12 ore', fratelliArticolo: '3 equivalenti',
      scoreAffidabilita: 97, noteRischio: '',
    },
  ],
  'M-LOG-DIFF': [
    {
      id: 'OFF-009-A',
      fornitore: 'Rhiag Hub', codiceFornitore: 'VAL-77210',
      descrizione: 'Radiatore Motore Core Forte', brand: 'Valeo',
      livelloQualitativo: 'Originale', prezzoListino: 180.00, prezzoNetto: 110.00,
      disponibilita: 'Disponibile', logistica: 'Sede Centrale', sede: 'sede',
      leadTime: '36 ore', fratelliArticolo: 'Nessuno',
      scoreAffidabilita: 96, noteRischio: 'Fornitore con prezzo migliore ma logistica centralizzata lenta',
    },
    {
      id: 'OFF-009-B',
      fornitore: 'Autodis Italia', codiceFornitore: 'RAD-77210-L',
      descrizione: 'Radiatore Clima Rinforzato', brand: 'Nissens',
      livelloQualitativo: 'Primo Equipaggiamento', prezzoListino: 165.00, prezzoNetto: 118.00,
      disponibilita: 'Immediata', logistica: 'Filiale Locale', sede: 'filiale',
      leadTime: '1 ora', fratelliArticolo: '1 equivalente',
      scoreAffidabilita: 94, noteRischio: 'Prezzo leggermente superiore ma consegna rapida',
    },
  ],
}

// Generate standard offers for generated rows
for (let i = 10; i <= 65; i++) {
  const cod = `M-REP${10000 + i}`
  if (!supplierOffers[cod]) {
    supplierOffers[cod] = [
      {
        id: `OFF-GEN-${i}-A`,
        fornitore: 'Rhiag Hub', codiceFornitore: `RH-${1000 + i}`,
        descrizione: 'Componente Ricambio Standard', brand: 'Magneti Marelli',
        livelloQualitativo: 'Primo Equipaggiamento', prezzoListino: 40.00, prezzoNetto: 18.00,
        disponibilita: 'Disponibile', logistica: 'Filiale', sede: 'filiale',
        leadTime: '12 ore', fratelliArticolo: 'Presenti',
        scoreAffidabilita: 95, noteRischio: '',
      },
      {
        id: `OFF-GEN-${i}-B`,
        fornitore: 'Autodis Italia', codiceFornitore: `AD-${1000 + i}`,
        descrizione: 'Componente Alternativo Budget', brand: 'Ridex',
        livelloQualitativo: 'Economico', prezzoListino: 30.00, prezzoNetto: 12.50,
        disponibilita: 'Immediata', logistica: 'Filiale Locale', sede: 'filiale',
        leadTime: '2 ore', fratelliArticolo: 'Nessuno',
        scoreAffidabilita: 90, noteRischio: '',
      },
    ]
  }
}

// ─── Prompt Search Strategies ─────────────────────────────────────────────────
export const promptSearchStrategies = {
  'M-103316': {
    inputOriginale: 'M-103316',
    varianti: [
      { tipo: 'Query Precisa', query: '103316', affidabilita: 'Alta (99%)', livello: 'high' },
      { tipo: 'Query per Brand', query: 'Purflux 103316', affidabilita: 'Alta (97%)', livello: 'high' },
      { tipo: 'Cross-Reference', query: 'W 712/4 equivalenti', affidabilita: 'Media (81%)', livello: 'medium' },
    ],
    motivazione: 'Rimozione prefisso magazzino M-. 3 varianti per massima copertura portale.',
  },
  'JPP-FO-316S': {
    inputOriginale: 'JPP-FO-316S',
    varianti: [
      { tipo: 'Compressed', query: 'FO316S', affidabilita: 'Alta (95%)', livello: 'high' },
      { tipo: 'Brand Esplicito', query: 'Japanparts FO316S', affidabilita: 'Alta (91%)', livello: 'high' },
      { tipo: 'Originale (rischio)', query: 'JPP-FO-316S', affidabilita: 'Bassa (43%) — falsi positivi', livello: 'low' },
    ],
    motivazione: 'La rimozione dei trattini commerciali previene i difetti di indicizzazione.',
  },
  'O-9A62111': {
    inputOriginale: 'O-9A62111',
    varianti: [
      { tipo: 'TecDoc Std', query: '09.A621.11', affidabilita: 'Alta (96%)', livello: 'high' },
      { tipo: 'Senza Punti', query: '09A62111', affidabilita: 'Media (78%)', livello: 'medium' },
      { tipo: 'Brand', query: 'Brembo 9A621', affidabilita: 'Alta (93%)', livello: 'high' },
    ],
    motivazione: 'Prefisso O- rimosso. Punteggiatura TecDoc inserita per ricerca standard.',
  },
  'M-AM4412': {
    inputOriginale: 'M-AM4412',
    varianti: [
      { tipo: 'Codice Netto', query: 'AM4412', affidabilita: 'Bassa (32%) — BLOCCATO', livello: 'low' },
      { tipo: 'ERP Search', query: 'AM4412 Sospensioni', affidabilita: 'Incerta', livello: 'low' },
      { tipo: 'TecDoc Search', query: 'AM4412 Filtro Olio', affidabilita: 'Incerta — CONFLITTO', livello: 'low' },
    ],
    motivazione: 'MISMATCH BLOCCANTE: le varianti generano risultati in famiglie incompatibili.',
  },
  'M-DESC-ERR': {
    inputOriginale: 'M-DESC-ERR',
    varianti: [
      { tipo: 'Codice Std', query: '5PK1230', affidabilita: 'Alta (91%)', livello: 'high' },
      { tipo: 'Con Brand', query: 'Continental 5PK1230', affidabilita: 'Alta (94%)', livello: 'high' },
      { tipo: 'Query ERP (rischio)', query: 'M-DESC-ERR Kit', affidabilita: 'Bassa (12%) — desc. errata', livello: 'low' },
    ],
    motivazione: 'Query ERP fuorviante evitata. Codice normalizzato restituisce la singola cinghia.',
  },
}

// ─── Task Board Initial Data ──────────────────────────────────────────────────
export const initialTasks = [
  {
    id: 'TASK-001', reqId: 'REQ-004', tipo: 'Revisione Mapping', priorita: 'Critica',
    assegnato: 'Buyer Senior', scadenza: 'Oggi',
    desc: 'Divergenza macro-famiglia confermata: ERP=Sospensioni, TecDoc=Filtro Olio. Verificare fisicamente.',
    stato: 'In corso', codiceMadre: 'M-AM4412',
  },
  {
    id: 'TASK-002', reqId: 'REQ-008', tipo: 'Revisione Anagrafica', priorita: 'Alta',
    assegnato: 'Resp. Catalogo', scadenza: 'Entro 48h',
    desc: 'Descrizione ERP indica "Kit" ma codice 5PK1230 = singola cinghia. Aggiornare anagrafica.',
    stato: 'Da elaborare', codiceMadre: 'M-DESC-ERR',
  },
  {
    id: 'TASK-003', reqId: 'REQ-003', tipo: 'Listino Mancante', priorita: 'Media',
    assegnato: 'Ufficio Acquisti', scadenza: 'Entro 7 giorni',
    desc: 'Stark non pubblica listino per E6200-ST. Richiedere prezzo ufficiale.',
    stato: 'Da elaborare', codiceMadre: 'M-E6200',
  },
  {
    id: 'TASK-004', reqId: 'REQ-006', tipo: 'Follow-up Ordine', priorita: 'Bassa',
    assegnato: 'Logistica', scadenza: 'Domani',
    desc: 'Confermare ricezione ordine Kit Frizione 552143 inviato ieri.',
    stato: 'Da fare', codiceMadre: 'M-552143',
  },
  {
    id: 'TASK-005', reqId: 'REQ-009', tipo: 'Ranking Logistico', priorita: 'Critica',
    assegnato: 'Buyer + Logistica', scadenza: 'Oggi',
    desc: 'Radiatore: Rhiag €110 (36h) vs Autodis €118 (1h). Urgenza critica: approvare eccezione.',
    stato: 'In corso', codiceMadre: 'M-LOG-DIFF',
  },
  {
    id: 'TASK-006', reqId: 'REQ-001', tipo: 'Conferma Ordine', priorita: 'Alta',
    assegnato: 'Buyer', scadenza: 'Oggi',
    desc: 'Filtro olio 103316 — offerta Rhiag confermata. Procedere con ordine.',
    stato: 'Eseguito', codiceMadre: 'M-103316',
  },
]

// ─── Decision Engine helper ───────────────────────────────────────────────────
export function computeScore(offer, row) {
  const normLog = normalizationsLog[row.codiceMadre]
  const familyOk = normLog ? (normLog.famigliaTecDoc && !normLog.famigliaTecDoc.includes('CONFLITTO')) : true
  const lineaMatch = offer.livelloQualitativo === row.lineaProdotto ? 20 : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 10 : 0
  const famScore = familyOk ? 30 : 5
  const confScore = normLog ? Math.round((normLog.confidence / 100) * 30) : 20
  const dispoScore = offer.disponibilita === 'Immediata' ? 20 : offer.disponibilita === 'Disponibile' ? 12 : 5
  const ltH = parseInt(offer.leadTime) || 24
  const ltScore = ltH <= 4 ? 20 : ltH <= 12 ? 15 : ltH <= 24 ? 10 : 5
  const prezzoScore = offer.prezzoNetto < 10 ? 15 : offer.prezzoNetto < 30 ? 10 : offer.prezzoNetto < 80 ? 7 : 3
  const brandScore = offer.scoreAffidabilita >= 98 ? 10 : offer.scoreAffidabilita >= 90 ? 7 : 4
  const listinoScore = offer.prezzoListino !== null ? 5 : 0
  const total = Math.round(
    (lineaMatch * 0.2) + (famScore * 0.3) + (dispoScore * 0.2) + (prezzoScore * 0.15) + (brandScore * 0.1) + (listinoScore * 0.05)
  )
  return Math.min(100, total)
}

// ─── EOD Report summary data ──────────────────────────────────────────────────
export const eodSummary = {
  totaleProcessati: 65,
  risoltiAutomaticamente: 52,
  acquistati: 38,
  accodati: 8,
  inRevisione: 5,
  sospesoAmbiguita: 4,
  copertiTransito: 2,
  valoreTotaleOrdini: 3847.60,
  savingStimato: 612.40,
  distribuzioneQualita: { Originale: 8, 'Primo Equipaggiamento': 22, Economico: 8 },
  topFornitori: [
    { nome: 'Rhiag Hub', ordini: 18, valore: 1640.20 },
    { nome: 'Autodis Italia', ordini: 12, valore: 980.50 },
    { nome: 'Brembo Official Shop', ordini: 5, valore: 890.00 },
    { nome: 'Marinelli Ricambi', ordini: 3, valore: 337.10 },
  ],
  topProblemi: [
    'Codici compressi/non compressi: 12 casi rilevati',
    'Mismatch famiglia ERP-TecDoc: 3 casi bloccati',
    'Listino mancante: 5 fornitori senza prezzo pubblicato',
    'Descrizioni fuorvianti: 2 casi in revisione anagrafica',
  ],
  taskAperti: 4,
  ricercheAlPrimoPrompt: 78,
  mediaTentativiRicerca: 1.4,
  taskCreatiAutomaticamente: 6,
  taskCompletatiOggi: 2,
  casiBloccatiPerQualita: 3,
}

// ─── EOD Summary da righe reali ──────────────────────────────────────────────
export function buildEodFromRows(rows, ordini = []) {
  if (!rows || rows.length === 0) return null

  const totaleProcessati = rows.length

  // Stati
  const mismatch     = rows.filter(r => r._stato === 'mismatch').length
  const bloccatiTra  = rows.filter(r => r._stato === 'bloccato-tra').length
  const bloccatiDup  = rows.filter(r => r._stato === 'bloccato-dup').length
  const ambigui      = rows.filter(r => (r._conf ?? 95) < 70).length

  // Ordini di oggi
  const oggi = new Date().toDateString()
  const ordiniOggi = ordini.filter(o => new Date(o.data).toDateString() === oggi)
  const acquistati  = ordiniOggi.filter(o => o.stato === 'confermato' || o.stato === 'manuale').length
  const inRevisione = ordiniOggi.filter(o => o.stato === 'revisione').length
  const accodati    = ordiniOggi.filter(o => o.stato === 'accodato').length

  // Valori economici
  const confermati = ordiniOggi.filter(o => o.stato === 'confermato' || o.stato === 'manuale')
  const valoreTotaleOrdini = confermati.reduce((s, o) => s + (o.totale || 0), 0)
  const savingStimato = valoreTotaleOrdini * 0.12 // stima 12% saving vs prima alternativa

  // Distribuzione qualità
  const distribuzioneQualita = {
    Originale: confermati.filter(o => o.linea === 'Originale').length,
    'Primo Equipaggiamento': confermati.filter(o => o.linea === 'Primo Equipaggiamento').length,
    Economico: confermati.filter(o => o.linea === 'Economico').length,
  }

  // Top fornitori
  const perFornitore = {}
  confermati.forEach(o => {
    if (!perFornitore[o.fornitore]) perFornitore[o.fornitore] = { ordini: 0, valore: 0 }
    perFornitore[o.fornitore].ordini++
    perFornitore[o.fornitore].valore += o.totale || 0
  })
  const topFornitori = Object.entries(perFornitore)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.valore - a.valore)
    .slice(0, 4)

  // Anomalie reali
  const topProblemi = []
  if (ambigui > 0)    topProblemi.push(`Codici a bassa confidence (<70%): ${ambigui} casi rilevati`)
  if (mismatch > 0)   topProblemi.push(`Mismatch famiglia ERP-TecDoc: ${mismatch} casi bloccati`)
  if (bloccatiTra > 0) topProblemi.push(`Coperti da merce in transito: ${bloccatiTra} articoli non ordinati`)
  if (bloccatiDup > 0) topProblemi.push(`Duplicati rilevati: ${bloccatiDup} righe scartate`)
  if (topProblemi.length === 0) topProblemi.push('Nessuna anomalia critica rilevata nella sessione')

  // Metriche AI stimate
  const risoltiAutomaticamente = Math.round(totaleProcessati * 0.78)
  const ricercheAlPrimoPrompt  = 78
  const mediaTentativiRicerca  = 1.4
  const taskCreatiAutomaticamente = Math.max(1, mismatch + Math.round(ambigui / 3))
  const taskCompletatiOggi     = Math.round(taskCreatiAutomaticamente * 0.4)
  const taskAperti             = taskCreatiAutomaticamente - taskCompletatiOggi
  const casiBloccatiPerQualita = ambigui

  // Urgenze
  const urgenze = {
    Critica:      rows.filter(r => r.urgenza === 'Critica').length,
    Prioritaria:  rows.filter(r => r.urgenza === 'Prioritaria').length,
    Alta:         rows.filter(r => r.urgenza === 'Alta').length,
    Media:        rows.filter(r => r.urgenza === 'Media').length,
    Bassa:        rows.filter(r => r.urgenza === 'Bassa' || !r.urgenza).length,
  }

  // Gruppi merceologici
  const gruppiMap = {}
  rows.forEach(r => {
    const g = r.gruppoMerceologico || 'Altro'
    gruppiMap[g] = (gruppiMap[g] || 0) + 1
  })
  const topGruppi = Object.entries(gruppiMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, count]) => ({ nome, count }))

  return {
    totaleProcessati, risoltiAutomaticamente, acquistati, accodati,
    inRevisione, sospesoAmbiguita: ambigui, copertiTransito: bloccatiTra,
    valoreTotaleOrdini, savingStimato,
    distribuzioneQualita, topFornitori,
    topProblemi, taskAperti, taskCompletatiOggi, taskCreatiAutomaticamente,
    casiBloccatiPerQualita, ricercheAlPrimoPrompt, mediaTentativiRicerca,
    urgenze, topGruppi,
    isReal: true,
  }
}
