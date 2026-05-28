import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, ArrowRight, AlertTriangle, CheckCircle, XCircle, Edit2, Save, RotateCcw, Sparkles, Loader, Zap
} from 'lucide-react'
import Tooltip from './Tooltip'
import { reorderReportRows as mockRows, normalizationsLog } from '../data/mockData'
import { getAISuggestion, saveNormToMemory, getNormFromMemory, saveBrandToMemory, saveFamilyToMemory, getApiKey } from '../data/memoryStore'

const SPECIAL_IDS = ['REQ-001','REQ-002','REQ-003','REQ-004','REQ-005','REQ-006','REQ-007','REQ-008','REQ-009']
const FAMIGLIE_ERP = ['Filtrazione','Freni','Sospensioni','Distribuzione','Frizioni','Elettrico','Raffreddamento','Scarico','Tergicristalli','Altro']
const FAMIGLIE_TECDOC = ['Filtro Olio','Filtro Aria','Filtro Abitacolo','Filtro Carburante','Disco Freno Anteriore','Disco Freno Posteriore','Pasticche Freno Ant','Pasticche Freno Post','Ammortizzatore','Molla Elicoidale','Kit Frizione','Cinghia Servizi','Kit Cinghia Distribuzione','Pompa Acqua','Batteria Avviamento','Alternatore','Radiatore Raffreddamento','Silenziatore Posteriore','Altro']

function ConfBar({ value }) {
  const cls = value >= 90 ? 'high' : value >= 60 ? 'medium' : 'low'
  const color = value >= 90 ? 'var(--color-text-primary)' : value >= 60 ? 'var(--color-orange)' : 'var(--color-orange-text)'
  return (
    <div className="conf-bar">
      <div className="conf-track"><div className={`conf-fill ${cls}`} style={{ width: `${value}%` }} /></div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{value}%</span>
    </div>
  )
}

function EditPanel({ row, norm, override, onSave, onReset }) {
  const memoryData = getNormFromMemory(row.codiceMadre)
  const base = override || memoryData || {}

  const [codice, setCodice] = useState(base.codiceNormalizzato ?? (norm?.codiceNormalizzato || row.codiceMadre))
  const [brand, setBrand] = useState(base.brandRilevato ?? (norm?.brandRilevato || row.brand || ''))
  const [famigliaERP, setFamigliaERP] = useState(base.famigliaERP ?? (norm?.famigliaERP || row.gruppoMerceologico))
  const [famigliaTecDoc, setFamigliaTecDoc] = useState(base.famigliaTecDoc ?? (norm?.famigliaTecDoc || ''))
  const [note, setNote] = useState(base.note ?? '')
  const [saved, setSaved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiError, setAiError] = useState(null)
  const hasApiKey = !!getApiKey()

  // Se c'è memoria, mostra banner
  const fromMemory = !!memoryData && !override

  async function fetchAISuggestion() {
    setAiLoading(true)
    setAiError(null)
    setAiSuggestion(null)
    try {
      const suggestion = await getAISuggestion(row.codiceMadre, row)
      if (suggestion) {
        setAiSuggestion(suggestion)
      } else {
        setAiError('Nessuna risposta dall\'AI')
      }
    } catch (e) {
      setAiError('Errore API: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  function applyAISuggestion() {
    if (!aiSuggestion) return
    if (aiSuggestion.codiceNormalizzato) setCodice(aiSuggestion.codiceNormalizzato)
    if (aiSuggestion.brandRilevato) setBrand(aiSuggestion.brandRilevato)
    if (aiSuggestion.famigliaERP) setFamigliaERP(aiSuggestion.famigliaERP)
    if (aiSuggestion.famigliaTecDoc) setFamigliaTecDoc(aiSuggestion.famigliaTecDoc)
    if (aiSuggestion.motivazione) setNote(aiSuggestion.motivazione)
    setAiSuggestion(null)
  }

  function handleSave() {
    const data = { codiceNormalizzato: codice, brandRilevato: brand, famigliaERP, famigliaTecDoc, note, confermato: true }
    onSave(data)
    // Salva in memoria permanente
    saveNormToMemory(row.codiceMadre, data)
    if (brand && codice !== row.codiceMadre) {
      const prefix = row.codiceMadre.slice(0, 3).toUpperCase()
      if (/^[A-Z]{3}$/.test(prefix)) saveBrandToMemory(prefix, brand)
    }
    if (famigliaERP && famigliaTecDoc) saveFamilyToMemory(row.codiceMadre, famigliaERP, famigliaTecDoc)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = { width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'Geist, sans-serif', outline: 'none', background: 'var(--color-surface)', transition: 'border-color 0.12s', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }

  return (
    <tr>
      <td colSpan={8}>
        <div style={{ padding: '18px 22px', background: 'var(--color-surface)', borderBottom: '2px solid var(--color-orange)', borderTop: '1px solid var(--color-orange-border)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit2 size={14} color="var(--color-orange)" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Revisione — {row.id}</span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{row.codiceMadre}</span>
              {override?.confermato && <span className="badge badge-ok"><CheckCircle size={9} /> Confermato</span>}
              {fromMemory && <span className="badge badge-warn"><Sparkles size={9} /> Da memoria</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasApiKey && (
                <button className="btn btn-sm" onClick={fetchAISuggestion} disabled={aiLoading} style={{ gap: 5 }}>
                  {aiLoading ? <><Loader size={11} className="animate-spin" /> AI in elaborazione...</> : <><Sparkles size={11} color="var(--color-orange)" /> Suggerimento AI</>}
                </button>
              )}
              <button className="btn btn-sm btn-ghost" onClick={onReset}><RotateCcw size={11} /> Ripristina</button>
            </div>
          </div>

          {/* Banner memoria */}
          {fromMemory && (
            <div className="alert alert-orange" style={{ marginBottom: 12 }}>
              <Sparkles size={14} className="alert-icon" />
              <div>
                <div className="alert-title">Dati da memoria AI — confermati {memoryData.confirmedCount || 1} volta/e</div>
                <div className="alert-desc">Questi valori provengono da una revisione precedentemente confermata. Puoi modificarli e riconfermare.</div>
              </div>
            </div>
          )}

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="alert alert-orange" style={{ marginBottom: 12 }}>
              <Sparkles size={14} className="alert-icon" />
              <div style={{ flex: 1 }}>
                <div className="alert-title">Suggerimento AI — Confidence {aiSuggestion.confidence}%</div>
                <div className="alert-desc" style={{ marginBottom: 8 }}>
                  Codice: <strong>{aiSuggestion.codiceNormalizzato}</strong>
                  {aiSuggestion.brandRilevato && <> · Brand: <strong>{aiSuggestion.brandRilevato}</strong></>}
                  {aiSuggestion.famigliaERP && <> · ERP: <strong>{aiSuggestion.famigliaERP}</strong></>}
                  <br /><em>{aiSuggestion.motivazione}</em>
                  {aiSuggestion.warning && <><br /><span style={{ color: 'var(--color-orange-text)' }}>⚠ {aiSuggestion.warning}</span></>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-primary" onClick={applyAISuggestion}>Applica suggerimento</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setAiSuggestion(null)}>Ignora</button>
                </div>
              </div>
            </div>
          )}
          {aiError && <div style={{ fontSize: 11, color: 'var(--color-orange-text)', marginBottom: 10 }}>⚠ {aiError}</div>}
          {!hasApiKey && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={11} /> Configura la API key in <a href="/impostazioni" style={{ color: 'var(--color-orange)' }}>Impostazioni</a> per abilitare i suggerimenti AI
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Codice normalizzato</label>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                <span className="code-before">{row.codiceMadre}</span> <span className="code-arrow">→</span>
              </div>
              <input style={{ ...inputStyle, fontFamily: 'Geist Mono, monospace', fontWeight: 600 }}
                value={codice} onChange={e => setCodice(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                placeholder="es. 103316" />
            </div>
            <div>
              <label style={labelStyle}>Brand rilevato</label>
              <input style={inputStyle} value={brand} onChange={e => setBrand(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                placeholder="es. Purflux, Brembo..." />
            </div>
            <div>
              <label style={labelStyle}>Famiglia ERP</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={famigliaERP} onChange={e => setFamigliaERP(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                {FAMIGLIE_ERP.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Famiglia TecDoc</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={famigliaTecDoc} onChange={e => setFamigliaTecDoc(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                <option value="">— seleziona —</option>
                {FAMIGLIE_TECDOC.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Note di revisione</label>
            <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              value={note} onChange={e => setNote(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              placeholder="Motivo della correzione, riferimenti, note operative..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tooltip text="Salva la revisione in memoria permanente (localStorage). I file futuri con lo stesso codice troveranno già questa correzione applicata." position="top">
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><CheckCircle size={13} /> Salvato in memoria!</> : <><Save size={13} /> Conferma e salva in memoria</>}
              </button>
            </Tooltip>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Salvata permanentemente — usata nei file futuri
            </span>
          </div>
        </div>
      </td>
    </tr>
  )
}

function NormRow({ row, norm, expanded, editing, onToggle, onEdit, overrides, onSaveOverride, onResetOverride }) {
  const override = overrides[row.id]
  const memoryData = getNormFromMemory(row.codiceMadre)
  const isConfirmed = override?.confermato
  const fromMemory = !!memoryData && !override
  const isMismatch = row._stato === 'mismatch'
  const isBlocked = row._stato && row._stato.startsWith('bloccato')
  const isWarn = (row._conf ?? 95) < 70

  let rowCls = ''
  if (isMismatch) rowCls = 'row-mismatch'
  else if (isBlocked) rowCls = 'row-blocked'
  else if (isWarn) rowCls = 'row-warn'

  const displayCodice = override?.codiceNormalizzato ?? memoryData?.codiceNormalizzato ?? norm?.codiceNormalizzato ?? row.codiceNormalizzato ?? row.codiceMadre
  const displayBrand = override?.brandRilevato ?? memoryData?.brandRilevato ?? norm?.brandRilevato ?? row.brand ?? '—'
  const displayERP = override?.famigliaERP ?? memoryData?.famigliaERP ?? norm?.famigliaERP ?? row.gruppoMerceologico
  const displayTecDoc = override?.famigliaTecDoc ?? memoryData?.famigliaTecDoc ?? norm?.famigliaTecDoc ?? ''
  const displayConf = isConfirmed ? 100 : fromMemory ? 98 : (norm?.confidence ?? row._conf ?? 95)

  return (
    <>
      <tr className={rowCls} style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td><div className="cell" style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{row.id}</div></td>
        <td><div className="cell">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span className="code-before">{row.codiceMadre}</span>
            <span className="code-arrow">→</span>
            <span className="code-after" style={{ color: (override || fromMemory) ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{displayCodice}</span>
            {isConfirmed && <CheckCircle size={11} color="var(--color-orange)" />}
            {fromMemory && <Sparkles size={11} color="var(--color-orange)" title="Da memoria AI" />}
          </div>
        </div></td>
        <td><div className="cell" style={{ fontSize: 11 }}>{displayBrand}</div></td>
        <td><div className="cell">
          <div style={{ fontSize: 11 }}>{displayERP}</div>
          {displayTecDoc && <div style={{ fontSize: 10, color: displayTecDoc.includes('CONFLITTO') && !isConfirmed ? 'var(--color-orange-text)' : 'var(--color-text-muted)' }}>{displayTecDoc}</div>}
        </div></td>
        <td><div className="cell"><ConfBar value={displayConf} /></div></td>
        <td><div className="cell">
          {isConfirmed && <span className="badge badge-ok"><CheckCircle size={9} /> Confermato</span>}
          {fromMemory && !isConfirmed && <span className="badge badge-warn"><Sparkles size={9} /> Memoria</span>}
          {!isConfirmed && !fromMemory && isMismatch && <span className="badge badge-mismatch"><AlertTriangle size={9} /> BLOCCATO</span>}
          {!isConfirmed && !fromMemory && isBlocked && !isMismatch && <span className="badge badge-bloccato">Bloccato</span>}
          {!isConfirmed && !fromMemory && !isMismatch && !isBlocked && norm?.warning && <span className="badge badge-warn">Warning</span>}
          {!isConfirmed && !fromMemory && !isMismatch && !isBlocked && !norm?.warning && <span className="badge badge-ok"><CheckCircle size={9} /> OK</span>}
        </div></td>
        <td><div className="cell" style={{ fontSize: 10, color: 'var(--color-text-muted)', maxWidth: 160 }} className="truncate">
          {override?.note || memoryData?.note || (norm?.azione || 'Normalizzazione standard')}
        </div></td>
        <td><div className="cell" style={{ display: 'flex', gap: 4 }}>
          <button className={`btn btn-xs ${editing ? 'btn-primary' : ''}`}
            onClick={e => { e.stopPropagation(); onEdit() }} title="Modifica">
            <Edit2 size={10} />
          </button>
          <ArrowRight size={12} color="var(--color-text-muted)" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        </div></td>
      </tr>

      {editing && (
        <EditPanel row={row} norm={norm} override={override}
          onSave={(data) => onSaveOverride(row.id, data)}
          onReset={() => onResetOverride(row.id)} />
      )}

      {expanded && !editing && (
        <tr>
          <td colSpan={8}>
            <div style={{ padding: '14px 20px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Prima → Dopo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
                  <span className="code-before" style={{ padding: '2px 6px', background: 'var(--color-surface-3)', borderRadius: 4 }}>{row.codiceMadre}</span>
                  <ArrowRight size={14} color="var(--color-orange)" />
                  <span className="code-after" style={{ padding: '2px 6px', background: 'var(--color-surface-3)', borderRadius: 4 }}>{displayCodice}</span>
                </div>
                {(override?.note || memoryData?.note || norm?.azione) && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {override?.note || memoryData?.note || norm?.azione}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Analisi</div>
                {norm?.warning && !isConfirmed ? (
                  <div className="alert alert-orange" style={{ fontSize: 11 }}>
                    <AlertTriangle size={14} className="alert-icon" />
                    <div><div className="alert-title">Warning</div><div className="alert-desc">{norm.warning}</div></div>
                  </div>
                ) : (
                  <div className="alert alert-neutral" style={{ fontSize: 11 }}>
                    <CheckCircle size={14} className="alert-icon" style={{ color: 'var(--color-text-secondary)' }} />
                    <div><div className="alert-title">{fromMemory ? 'Dati da memoria AI' : 'Normalizzazione OK'}</div></div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Stock</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  <span>Giacenza: <strong style={{ color: row.giacenza === 0 ? 'var(--color-orange-text)' : 'inherit' }}>{row.giacenza} pz</strong></span>
                  <span>Transito: <strong>{row.merceInTransito ?? 0} pz</strong></span>
                  <span>Sugger.: <strong style={{ color: 'var(--color-orange)' }}>{row.suggerimentoAcquisto} pz</strong></span>
                  <span>Conf.: <strong>{displayConf}%</strong></span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function NormalizationLab({ rows: rowsProp, normOverrides: overridesProp, onSaveOverride, onResetOverride }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [editing, setEditing] = useState(null)
  const [localOverrides, setLocalOverrides] = useState({})
  const overrides = overridesProp ?? localOverrides

  const allData = rowsProp ?? mockRows
  const specialRows = useMemo(() => allData.filter(r => SPECIAL_IDS.includes(r.id)), [allData])

  const allRows = useMemo(() => {
    let rows = filter === 'speciali' ? specialRows : allData
    if (filter === 'mismatch') rows = rows.filter(r => r._stato === 'mismatch')
    if (filter === 'bloccati') rows = rows.filter(r => r._stato && r._stato.startsWith('bloccato'))
    if (filter === 'lowconf') rows = rows.filter(r => (r._conf ?? 95) < 70)
    if (filter === 'confermati') rows = rows.filter(r => overrides?.[r.id]?.confermato)
    if (filter === 'memoria') rows = rows.filter(r => !!getNormFromMemory(r.codiceMadre))
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.codiceMadre.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.codiceNormalizzato || '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [filter, search, specialRows, allData, overrides])

  function toggle(id) {
    setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
    if (editing === id) setEditing(null)
  }

  function handleEdit(id) {
    setEditing(prev => prev === id ? null : id)
    setExpanded(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function saveOverride(id, data) {
    if (onSaveOverride) onSaveOverride(id, data)
    else setLocalOverrides(prev => ({ ...prev, [id]: data }))
    setEditing(null)
  }

  const [bulkDone, setBulkDone] = useState(false)

  // Righe con confidence ≥ soglia e non ancora confermate
  function getBulkCandidates(minConf = 90) {
    return allData.filter(r => {
      const conf = r._conf ?? 95
      return conf >= minConf && !overrides?.[r.id]?.confermato && r._stato !== 'mismatch'
    })
  }

  function handleBulkConfirm() {
    const candidates = getBulkCandidates(90)
    candidates.forEach(r => {
      const norm = normalizationsLog[r.codiceMadre]
      const data = {
        codiceNormalizzato: r.codiceNormalizzato ?? norm?.codiceNormalizzato ?? r.codiceMadre,
        brandRilevato: r.brand ?? norm?.brandRilevato ?? '',
        famigliaERP: r.gruppoMerceologico,
        famigliaTecDoc: norm?.famigliaTecDoc ?? r.gruppoMerceologico,
        note: 'Confermato in blocco (confidence ≥ 90%)',
        confermato: true,
      }
      saveNormToMemory(r.codiceMadre, data)
      if (onSaveOverride) onSaveOverride(r.id, data)
      else setLocalOverrides(prev => ({ ...prev, [r.id]: data }))
    })
    setBulkDone(true)
    setTimeout(() => setBulkDone(false), 2500)
  }

  function resetOverride(id) {
    if (onResetOverride) onResetOverride(id)
    else setLocalOverrides(prev => { const next = { ...prev }; delete next[id]; return next })
    setEditing(null)
  }

  const confirmedCount = Object.values(overrides).filter(o => o.confermato).length
  const memoryCount = allData.filter(r => !!getNormFromMemory(r.codiceMadre)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Quality & Normalization Lab</h1>
          <p className="page-subtitle">
            {allData.length} righe · clicca <Edit2 size={11} style={{ verticalAlign: 'middle', color: 'var(--color-orange)' }} /> per modificare · <Sparkles size={11} style={{ verticalAlign: 'middle', color: 'var(--color-orange)' }} /> = da memoria AI
            {confirmedCount > 0 && <span style={{ color: 'var(--color-orange)', marginLeft: 8 }}>· {confirmedCount} confermate</span>}
            {memoryCount > 0 && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· {memoryCount} da memoria</span>}
          </p>
        </div>
      </div>

      <div className="filter-bar">
        {[
          { f: 'all', label: 'Tutti', count: allData.length },
          { f: 'speciali', label: 'Casi Speciali', count: specialRows.length },
          { f: 'mismatch', label: 'Mismatch', count: allData.filter(r => r._stato === 'mismatch').length, icon: <XCircle size={10} /> },
          { f: 'bloccati', label: 'Bloccati', count: allData.filter(r => r._stato && r._stato.startsWith('bloccato')).length },
          { f: 'lowconf', label: 'Bassa Conf.', count: allData.filter(r => (r._conf ?? 95) < 70).length },
        ].map(({ f, label, count, icon }) => (
          <button key={f} className={`pill${filter === f ? ' active-orange' : ''}`} onClick={() => setFilter(f)}>
            {icon} {label} <span className="pill-count">{count}</span>
          </button>
        ))}
        {confirmedCount > 0 && (
          <button className={`pill${filter === 'confermati' ? ' active-orange' : ''}`} onClick={() => setFilter('confermati')}>
            <CheckCircle size={10} /> Confermati <span className="pill-count">{confirmedCount}</span>
          </button>
        )}
        {memoryCount > 0 && (
          <button className={`pill${filter === 'memoria' ? ' active-orange' : ''}`} onClick={() => setFilter('memoria')}>
            <Sparkles size={10} /> Da Memoria <span className="pill-count">{memoryCount}</span>
          </button>
        )}
        <div className="divider" />
        <div className="search-input-wrap">
          <Search size={13} />
          <input className="search-input" placeholder="Cerca codice..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setExpanded(new Set(allRows.map(r => r.id)))}>Espandi tutti</button>
        <button className="btn btn-sm btn-ghost" onClick={() => setExpanded(new Set())}>Comprimi</button>
        <div className="divider" />
        {(() => {
          const candidates = getBulkCandidates(90)
          return candidates.length > 0 ? (
            <button
              className={`btn btn-sm ${bulkDone ? '' : 'btn-primary'}`}
              onClick={handleBulkConfirm}
              style={{ gap: 5 }}
              title={`Conferma automaticamente ${candidates.length} righe con confidence ≥ 90%`}
            >
              {bulkDone
                ? <><CheckCircle size={11} /> Fatto!</>
                : <><Zap size={11} /> Conferma {candidates.length} ad alta conf.</>
              }
            </button>
          ) : null
        })()}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Prima → Dopo</th>
              <th>Brand</th>
              <th>Famiglia ERP / TecDoc</th>
              <th>Confidence</th>
              <th>Stato</th>
              <th>Azione / Note</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {allRows.map(r => (
              <NormRow key={r.id} row={r} norm={normalizationsLog[r.codiceMadre]}
                expanded={expanded.has(r.id)} editing={editing === r.id}
                onToggle={() => toggle(r.id)} onEdit={() => handleEdit(r.id)}
                overrides={overrides} onSaveOverride={saveOverride} onResetOverride={resetOverride} />
            ))}
          </tbody>
        </table>
        {allRows.length === 0 && <div className="empty-state"><Search size={28} /><span>Nessun risultato</span></div>}
      </div>

      <div className="summary-bar">
        <span>Visualizzate: <strong>{allRows.length}</strong></span>
        <span>· Confermate: <strong style={{ color: 'var(--color-orange)' }}>{confirmedCount}</strong></span>
        <span>· Da memoria: <strong>{memoryCount}</strong></span>
      </div>
    </div>
  )
}
