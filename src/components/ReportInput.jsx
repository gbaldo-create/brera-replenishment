import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, AlertTriangle, Ban, Truck, Upload, X, FileSpreadsheet, Info, Database, RefreshCw, CheckCircle, ChevronDown } from 'lucide-react'
import { fetchFromIDempiere, getDefaultParams, GRUPPI_IDEMPIERE, LINEE_IDEMPIERE, URGENZE_IDEMPIERE } from '../data/idempiereMock'
import { reorderReportRows } from '../data/mockData'
import { normalizzaCodice, getMultiplo, mapUrgenza } from '../data/normalization'
import * as XLSX from 'xlsx'

const PER_PAGE = 20

// ─── Map Excel row → internal format ─────────────────────────────────────────
function mapExcelRow(raw, idx) {
  const urgenza = mapUrgenza(raw['Urgenza'])

  const lineaRaw = String(raw['Linea Prodotto'] || '')
  let linea = lineaRaw
  if (lineaRaw.match(/economico|3_/i)) linea = 'Economico'
  else if (lineaRaw.match(/primo|impianto|2_/i)) linea = 'Originale'
  else if (lineaRaw.match(/qualit|1_/i)) linea = 'Primo Equipaggiamento'

  // Lettura robusta — gestisce varianti di maiuscole/minuscole e spazi
  function col(keys) {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== '') return String(raw[k])
    }
    return ''
  }
  const codiceMadre = col(['Codice Madre', 'CodiceMadre', 'codice madre', 'Codice']).trim()
  const stripPfx = s => s.replace(/^\d+_/, '').replace(/^[A-Z]+_/, '')
  const gruppo = stripPfx(col(['Gruppo Merceologico', 'GruppoMerceologico', 'Gruppo']))
  const sotto = stripPfx(col(['SottoGruppo Merceologico', 'Sottogruppo Merceologico', 'SottogruppoMerceologico', 'Sotto Gruppo', 'Sottogruppo']))
  const giacenza = Number(col(['Giacenza', 'giacenza'])) || 0
  const suggerimento = Number(col(['Suggerimento Acquisto', 'Suggerimento', 'SuggerimentoAcquisto'])) || 0
  const movimenti = Number(col(['N° Movimenti', 'N. Movimenti', 'NMovimenti', 'Movimenti', 'n° movimenti'])) || 0
  const giorni = Number(col(['Giorni Copertura', 'GiorniCopertura', 'Giorni'])) || 0

  // Multiplo vendita (dischi freno × 2, candele × 4)
  const multiplo = getMultiplo(gruppo, sotto)
  const qtaVendutaReale = movimenti * multiplo

  // Normalizzazione codice
  const norm = normalizzaCodice(codiceMadre)

  const conf = norm.isGenerico ? 35 : norm.warning ? 72 : 95
  const stato = norm.isGenerico ? 'warn-generico' : 'ok'

  return {
    id: `REQ-${String(idx + 1).padStart(3, '0')}`,
    codiceMadre,
    codiceNormalizzato: norm.codice,
    brand: norm.brand,
    lineaProdotto: linea,
    gruppoMerceologico: gruppo,
    sottogruppo: sotto,
    nMovimenti: movimenti,
    multiplo,
    quantitaVendutaStimata: qtaVendutaReale,
    giacenza,
    merceInTransito: 0,
    suggerimentoAcquisto: suggerimento,
    urgenza,
    giorni,
    statoOrdinePrecedente: 'Nessuno',
    noteERP: norm.warning || (multiplo > 1 ? `Venduto a ${multiplo > 2 ? 'set' : 'coppie'} — qtà ×${multiplo}` : ''),
    _stato: stato,
    _conf: conf,
    _norm: norm,
    _fromFile: true,
  }
}

const urgMap = { Prioritaria: 'badge-critica', Sottoscorta: 'badge-alta', Critica: 'badge-critica', Alta: 'badge-alta', Media: 'badge-media', Bassa: 'badge-bassa' }

function rowClass(r) {
  if (r._stato === 'mismatch' || r._stato === 'warn-generico') return 'row-warn'
  if (r._stato && r._stato.startsWith('bloccato')) return 'row-blocked'
  if (r._conf < 70) return 'row-warn'
  if (r.urgenza === 'Prioritaria' || r.urgenza === 'Critica') return 'row-critical'
  return ''
}

function StatoBadge({ r }) {
  if (r._stato === 'mismatch') return <span className="badge badge-mismatch"><AlertTriangle size={9} /> MISMATCH</span>
  if (r._stato === 'bloccato-dup') return <span className="badge badge-bloccato"><Ban size={9} /> Duplicato</span>
  if (r._stato === 'bloccato-tra') return <span className="badge badge-transito"><Truck size={9} /> Transito</span>
  if (r._stato === 'warn-generico') return <span className="badge badge-warn"><AlertTriangle size={9} /> Codice generico</span>
  if (r.multiplo > 1) return <span className="badge badge-warn">×{r.multiplo}</span>
  if (r._conf < 70) return <span className="badge badge-warn">Bassa conf.</span>
  if (r._fromFile) return <span className="badge badge-ok">Caricato</span>
  if (r.noteERP && r.noteERP !== 'Standard replenishment row.') return <span className="badge badge-warn">Warning</span>
  return <span className="badge badge-std">Standard</span>
}

export default function ReportInput({ onOpenDrawer, uploadedRows: uploadedRowsProp, uploadedFileName: fileNameProp, onLoadFile, onClearFile }) {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  // Use props from App (global state) — fallback to local state for standalone use
  const uploadedRows = uploadedRowsProp ?? null
  const fileName = fileNameProp ?? null

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [gruppo, setGruppo] = useState('')
  const [linea, setLinea] = useState('')
  const [sortCol, setSortCol] = useState('urgenza')
  const [sortDir, setSortDir] = useState(1)
  const [page, setPage] = useState(0)

  // iDempiere import state
  const [showIDempiere, setShowIDempiere] = useState(false)
  const [iParams, setIParams] = useState(getDefaultParams)
  const [iLoading, setILoading] = useState(false)
  const [iError, setIError] = useState(null)
  const [iMeta, setIMeta] = useState(null)

  const baseRows = uploadedRows || reorderReportRows
  const isRealData = !!uploadedRows

  const urgOrd = { Prioritaria: 0, Critica: 0, Alta: 1, Sottoscorta: 1, Media: 2, Bassa: 3 }

  const filtered = useMemo(() => {
    let rows = [...baseRows]
    if (filter === 'prioritaria') rows = rows.filter(r => r.urgenza === 'Prioritaria' || r.urgenza === 'Critica')
    else if (filter === 'sottoscorta') rows = rows.filter(r => r.urgenza === 'Sottoscorta')
    else if (filter === 'generico') rows = rows.filter(r => r._stato === 'warn-generico' || r._stato === 'mismatch')
    else if (filter === 'multiplo') rows = rows.filter(r => r.multiplo > 1)
    else if (filter === 'bloccati') rows = rows.filter(r => r._stato && r._stato.startsWith('bloccato'))
    if (gruppo) rows = rows.filter(r => r.gruppoMerceologico === gruppo)
    if (linea) rows = rows.filter(r => r.lineaProdotto === linea)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.codiceMadre.toLowerCase().includes(q) ||
        (r.codiceNormalizzato || '').toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.gruppoMerceologico.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (sortCol === 'urgenza') { av = urgOrd[a.urgenza] ?? 3; bv = urgOrd[b.urgenza] ?? 3 }
      if (typeof av === 'number') return sortDir * (av - bv)
      return sortDir * String(av || '').localeCompare(String(bv || ''))
    })
    return rows
  }, [baseRows, filter, search, gruppo, linea, sortCol, sortDir])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const slice = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  function setSort(col) {
    if (sortCol === col) setSortDir(d => d * -1)
    else { setSortCol(col); setSortDir(1) }
    setPage(0)
  }
  function setF(f) { setFilter(f); setPage(0) }

  const gruppi = [...new Set(baseRows.map(r => r.gruppoMerceologico))].filter(Boolean).sort()

  const counts = {
    all: baseRows.length,
    prioritaria: baseRows.filter(r => r.urgenza === 'Prioritaria' || r.urgenza === 'Critica').length,
    sottoscorta: baseRows.filter(r => r.urgenza === 'Sottoscorta').length,
    generico: baseRows.filter(r => r._stato === 'warn-generico' || r._stato === 'mismatch').length,
    multiplo: baseRows.filter(r => r.multiplo > 1).length,
    bloccati: baseRows.filter(r => r._stato && r._stato.startsWith('bloccato')).length,
  }

  // ─── Excel upload ──────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) { setUploadError('Formato non supportato. Usa .xlsx o .xls'); return }
    setUploading(true); setUploadError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (raw.length === 0) throw new Error('Il foglio è vuoto')
        const required = ['Codice Madre', 'Urgenza', 'Giacenza', 'Suggerimento Acquisto']
        const cols = Object.keys(raw[0])
        const missing = required.filter(c => !cols.includes(c))
        if (missing.length > 0) throw new Error(`Colonne mancanti: ${missing.join(', ')}`)
        const mapped = raw.map((row, i) => mapExcelRow(row, i))
        onLoadFile && onLoadFile(mapped, file.name)
        setFilter('all'); setPage(0); setSearch(''); setGruppo(''); setLinea('')
      } catch (err) {
        setUploadError(err.message)
      } finally {
        setUploading(false)
      }
    }
    reader.onerror = () => { setUploadError('Errore di lettura file'); setUploading(false) }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e) { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }
  function resetToMock() { onClearFile && onClearFile(); setUploadError(null); setFilter('all'); setPage(0); setSearch(''); setGruppo(''); setLinea(''); setIMeta(null) }

  async function handleIDempiereImport() {
    setILoading(true); setIError(null)
    try {
      const result = await fetchFromIDempiere(iParams)
      onLoadFile && onLoadFile(result.rows, `iDempiere ${result.meta.dataRange}`)
      setIMeta(result.meta)
      setShowIDempiere(false)
      setFilter('all'); setPage(0); setSearch(''); setGruppo(''); setLinea('')
    } catch (err) {
      setIError(err.message || 'Errore import iDempiere')
    } finally {
      setILoading(false)
    }
  }

  function toggleGruppo(g) {
    setIParams(p => ({
      ...p,
      gruppi: p.gruppi.includes(g) ? p.gruppi.filter(x => x !== g) : [...p.gruppi, g]
    }))
  }

  function toggleLinea(l) {
    setIParams(p => ({
      ...p,
      linee: p.linee.includes(l) ? p.linee.filter(x => x !== l) : [...p.linee, l]
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Input — {isRealData ? 'Avviso Sottoscorta' : 'Dati Demo ERP'}</h1>
          <p className="page-subtitle">
            {baseRows.length} righe · {counts.prioritaria} prioritari · {counts.sottoscorta} sottoscorta
            {counts.generico > 0 && <span style={{ color: 'var(--color-orange)', marginLeft: 6 }}>· {counts.generico} codici generici</span>}
            {counts.multiplo > 0 && <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>· {counts.multiplo} multipli</span>}
            {fileName && <span style={{ color: 'var(--color-orange)', marginLeft: 8 }}>· 📂 {fileName}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {uploadedRows && <button className="btn btn-ghost" onClick={resetToMock}><X size={13} /> Demo</button>}
          <button className="btn" onClick={() => fileRef.current.click()}><Upload size={13} /> Carica Excel</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <button className={`btn ${showIDempiere ? 'btn-primary' : ''}`} onClick={() => setShowIDempiere(s => !s)}>
            <Database size={13} /> Import iDempiere
          </button>
          <button className="btn" onClick={() => navigate('/normalizzazione')}>Normalizzazione <ArrowRight size={13} /></button>
        </div>
      </div>

      {/* Import panel — Excel + iDempiere side by side */}
      {(!uploadedRows || showIDempiere) && (
        <div style={{ margin: '12px 18px', display: 'grid', gridTemplateColumns: showIDempiere ? '1fr 1fr' : '1fr', gap: 12 }}>

          {/* Excel upload */}
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current.click()}
            style={{ border: '2px dashed var(--color-border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-surface)', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-orange)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet size={18} color="var(--color-orange)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{uploading ? 'Caricamento...' : 'Carica file Excel'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Trascina o clicca — Avviso Sottoscorta .xlsx</div>
            </div>
            {uploading && <div style={{ width: 16, height: 16, border: '2px solid var(--color-orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          </div>

          {/* iDempiere panel */}
          {showIDempiere && (
            <div style={{ border: '2px solid var(--color-orange)', borderRadius: 10, padding: '16px 18px', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Database size={15} color="var(--color-orange)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Import da iDempiere</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Connessione simulata — API REST in produzione</div>
                </div>
              </div>

              {/* Date range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Data da', field: 'dataInizio' },
                  { label: 'Data a', field: 'dataFine' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                    <input type="date" value={iParams[field]}
                      onChange={e => setIParams(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '5px 8px', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-2)', outline: 'none', boxSizing: 'border-box', fontFamily: 'Geist, sans-serif' }}
                      onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />
                  </div>
                ))}
              </div>

              {/* Urgenza */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Urgenza</div>
                <select value={iParams.urgenza} onChange={e => setIParams(p => ({ ...p, urgenza: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-2)', outline: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif' }}>
                  {URGENZE_IDEMPIERE.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>

              {/* Gruppi multi-select */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  Gruppi merceologici {iParams.gruppi.length > 0 && <span style={{ color: 'var(--color-orange)' }}>({iParams.gruppi.length} selezionati)</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {GRUPPI_IDEMPIERE.map(g => (
                    <button key={g} onClick={() => toggleGruppo(g)}
                      style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, border: `1px solid ${iParams.gruppi.includes(g) ? 'var(--color-orange)' : 'var(--color-border)'}`, background: iParams.gruppi.includes(g) ? 'var(--color-orange)' : 'var(--color-surface-2)', color: iParams.gruppi.includes(g) ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: iParams.gruppi.includes(g) ? 700 : 400 }}>
                      {g}
                    </button>
                  ))}
                  {iParams.gruppi.length > 0 && (
                    <button onClick={() => setIParams(p => ({ ...p, gruppi: [] }))}
                      style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                      ✕ tutti
                    </button>
                  )}
                </div>
              </div>

              {/* Linee */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  Linea prodotto {iParams.linee.length > 0 && <span style={{ color: 'var(--color-orange)' }}>({iParams.linee.length})</span>}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {LINEE_IDEMPIERE.map(l => (
                    <button key={l} onClick={() => toggleLinea(l)}
                      style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, border: `1px solid ${iParams.linee.includes(l) ? 'var(--color-orange)' : 'var(--color-border)'}`, background: iParams.linee.includes(l) ? 'var(--color-orange)' : 'var(--color-surface-2)', color: iParams.linee.includes(l) ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: iParams.linee.includes(l) ? 700 : 400 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtri avanzati */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Giacenza max', field: 'giacenzaMax', placeholder: 'es. 5' },
                  { label: 'Movimenti min', field: 'movimentiMin', placeholder: 'es. 10' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                    <input type="number" value={iParams[field]} placeholder={placeholder}
                      onChange={e => setIParams(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '5px 8px', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-2)', outline: 'none', boxSizing: 'border-box', fontFamily: 'Geist, sans-serif' }}
                      onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />
                  </div>
                ))}
              </div>

              {/* Includi bloccati */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={iParams.includiBloccati} onChange={e => setIParams(p => ({ ...p, includiBloccati: e.target.checked }))} />
                Includi articoli bloccati (mismatch, duplicati)
              </label>

              {/* Error */}
              {iError && (
                <div style={{ padding: '8px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 11, color: '#991b1b', display: 'flex', gap: 6 }}>
                  <AlertTriangle size={13} /> {iError}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleIDempiereImport} disabled={iLoading}>
                  {iLoading ? (
                    <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Importazione in corso...</>
                  ) : (
                    <><Database size={13} /> Importa da iDempiere</>
                  )}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIParams(getDefaultParams())}>
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loaded banner */}
      {uploadedRows && !showIDempiere && (
        <div style={{ margin: '10px 18px', padding: '10px 16px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          {iMeta ? <Database size={15} color="var(--color-orange)" /> : <FileSpreadsheet size={15} color="var(--color-orange)" />}
          <span style={{ flex: 1 }}>
            <strong>{fileName}</strong> · {uploadedRows.length} righe · {counts.prioritaria} prioritari · {counts.sottoscorta} sottoscorta
            {iMeta && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· Filtri: {iMeta.filtriAttivi}</span>}
          </span>
          {iMeta ? (
            <button className="btn btn-sm" onClick={() => setShowIDempiere(true)}><Database size={11} /> Modifica filtri</button>
          ) : (
            <button className="btn btn-sm" onClick={() => fileRef.current.click()}><Upload size={11} /> Sostituisci</button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={resetToMock}><X size={11} /></button>
        </div>
      )}

      {/* iDempiere import success banner */}
      {iMeta && !showIDempiere && uploadedRows && (
        <div style={{ margin: '0 18px 8px', padding: '8px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle size={13} color="var(--color-orange)" />
          <span>Import iDempiere: <strong>{iMeta.dataRange}</strong> · {iMeta.filtriAttivi} · {iMeta.totale} righe · <em>{iMeta.fonte}</em></span>
        </div>
      )}

      {uploadError && (
        <div style={{ margin: '0 18px 8px', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 8, fontSize: 12, color: 'var(--color-orange-text)', display: 'flex', gap: 8 }}>
          <AlertTriangle size={14} /> {uploadError}
          <button className="btn btn-xs btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setUploadError(null)}><X size={11} /></button>
        </div>
      )}

      <div className="filter-bar">
        <button className={`pill${filter === 'all' ? ' active-orange' : ''}`} onClick={() => setF('all')}>Tutti <span className="pill-count">{counts.all}</span></button>
        <button className={`pill${filter === 'prioritaria' ? ' active' : ''}`} onClick={() => setF('prioritaria')}><AlertTriangle size={10} /> Prioritari <span className="pill-count">{counts.prioritaria}</span></button>
        <button className={`pill${filter === 'sottoscorta' ? ' active-orange' : ''}`} onClick={() => setF('sottoscorta')}>Sottoscorta <span className="pill-count">{counts.sottoscorta}</span></button>
        {counts.generico > 0 && <button className={`pill${filter === 'generico' ? ' active' : ''}`} onClick={() => setF('generico')}><AlertTriangle size={10} /> Codice generico <span className="pill-count">{counts.generico}</span></button>}
        {counts.multiplo > 0 && <button className={`pill${filter === 'multiplo' ? ' active-orange' : ''}`} onClick={() => setF('multiplo')}>Multipli ×2/×4 <span className="pill-count">{counts.multiplo}</span></button>}
        <div className="divider" />
        <select className="select-filter" value={gruppo} onChange={e => { setGruppo(e.target.value); setPage(0) }}>
          <option value="">Tutti i gruppi</option>
          {gruppi.map(g => <option key={g}>{g}</option>)}
        </select>
        <select className="select-filter" value={linea} onChange={e => { setLinea(e.target.value); setPage(0) }}>
          <option value="">Tutte le linee</option>
          {['Originale', 'Primo Equipaggiamento', 'Economico'].map(l => <option key={l}>{l}</option>)}
        </select>
        <div className="search-input-wrap">
          <Search size={13} />
          <input className="search-input" placeholder="Cerca codice..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => setSort('id')}>ID</th>
              <th onClick={() => setSort('codiceMadre')}>Codice Madre</th>
              {isRealData && <th>Codice Ricerca</th>}
              <th onClick={() => setSort('gruppoMerceologico')}>Gruppo</th>
              <th onClick={() => setSort('lineaProdotto')}>Linea</th>
              <th style={{ textAlign: 'right' }} onClick={() => setSort('nMovimenti')}>Mov.</th>
              {isRealData && <th style={{ textAlign: 'right' }}>Multiplo</th>}
              <th style={{ textAlign: 'right' }} onClick={() => setSort('giacenza')}>Giac.</th>
              <th style={{ textAlign: 'right' }}>Sugger.</th>
              {isRealData && <th style={{ textAlign: 'right' }}>Giorni</th>}
              <th onClick={() => setSort('urgenza')}>Urgenza</th>
              <th>Stato</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slice.map(r => (
              <tr key={r.id} className={rowClass(r)} onClick={() => onOpenDrawer && onOpenDrawer(r)} style={{ cursor: 'pointer' }}>
                <td><div className="cell"><span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.id}</span></div></td>
                <td><div className="cell"><span className="font-mono" style={{ fontSize: 11, fontWeight: 600 }}>{r.codiceMadre}</span></div></td>
                {isRealData && (
                  <td><div className="cell">
                    {r.codiceNormalizzato && r.codiceNormalizzato !== r.codiceMadre ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="code-after">{r.codiceNormalizzato}</span>
                        {r.brand && <span style={{ fontSize: 9, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '1px 5px', borderRadius: 3 }}>{r.brand}</span>}
                      </div>
                    ) : <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>—</span>}
                  </div></td>
                )}
                <td><div className="cell">
                  <div style={{ fontSize: 12 }}>{r.gruppoMerceologico}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.sottogruppo}</div>
                </div></td>
                <td><div className="cell">
                  <span className={`badge ${r.lineaProdotto === 'Originale' ? 'badge-originale' : r.lineaProdotto === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`}>{r.lineaProdotto}</span>
                </div></td>
                <td><div className="cell" style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{r.nMovimenti}</div></td>
                {isRealData && <td><div className="cell" style={{ textAlign: 'right' }}>
                  {r.multiplo > 1 ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-orange)' }}>×{r.multiplo}</span> : <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>×1</span>}
                </div></td>}
                <td><div className="cell" style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, color: r.giacenza === 0 ? 'var(--color-orange-text)' : 'var(--color-text-primary)' }}>{r.giacenza}</div></td>
                <td><div className="cell" style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'var(--color-orange)' }}>{r.suggerimentoAcquisto}</div></td>
                {isRealData && <td><div className="cell" style={{ textAlign: 'right', fontSize: 11, color: r.giorni === 0 ? 'var(--color-orange-text)' : 'var(--color-text-muted)' }}>{r.giorni}</div></td>}
                <td><div className="cell"><span className={`badge ${urgMap[r.urgenza] || 'badge-std'}`}>{r.urgenza}</span></div></td>
                <td><div className="cell"><StatoBadge r={r} /></div></td>
                <td><div className="cell" style={{ maxWidth: 180 }}>
                  {r.noteERP && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }} className="truncate">{r.noteERP}</div>}
                </div></td>
                <td><div className="cell">
                  <button className="btn btn-sm btn-ghost" onClick={e => { e.stopPropagation(); onOpenDrawer && onOpenDrawer(r) }} style={{ padding: '3px 8px' }}>
                    <ArrowRight size={11} />
                  </button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state"><Search size={28} /><span>Nessuna riga trovata</span></div>
        )}
      </div>

      <div className="summary-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div className="summary-dot" style={{ background: 'var(--color-text-primary)' }} />{counts.prioritaria} prioritari</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div className="summary-dot" style={{ background: 'var(--color-orange)' }} />{counts.sottoscorta} sottoscorta</div>
        {counts.generico > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div className="summary-dot" style={{ background: 'var(--color-border-strong)' }} />{counts.generico} codici generici</div>}
        <span>Visualizzate: <strong>{filtered.length}</strong></span>
        <div className="pagination" style={{ marginLeft: 'auto' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>←</button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>
          )).slice(Math.max(0, page - 2), page + 3)}
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>→</button>
        </div>
      </div>
    </div>
  )
}
