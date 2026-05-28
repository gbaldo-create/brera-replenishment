import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, Zap, ArrowRight, Ban, Clock, ShieldAlert } from 'lucide-react'
import { reorderReportRows as mockRows, normalizationsLog } from '../data/mockData'
import { useQueue } from '../hooks/useQueue'
import { getFabbisognoReale } from '../data/ordiniStore'

// ─── Reason Code AI ───────────────────────────────────────────────────────────
function getReason(r) {
  if (r._stato === 'warn-generico') return { code: 'CODICE_GENERICO', text: 'Codice madre troppo generico per ricerca su QRicambi — usare codice figlio', action: 'human' }
  if (r._conf < 70) return { code: 'BASSA_CONF', text: 'Confidence di normalizzazione bassa — verificare codice prima di ordinare', action: 'human' }
  if (r.multiplo > 1) return { code: `MULTIPLO_x${r.multiplo}`, text: `Articolo venduto a ${r.multiplo > 2 ? 'set' : 'coppie'} — quantità suggerita moltiplicata per ${r.multiplo}`, action: 'review' }
  if (r.urgenza === 'Prioritaria' || r.urgenza === 'Critica') return { code: 'GIACENZA_ZERO', text: 'Giacenza a zero — acquisto urgente', action: 'auto' }
  if (r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta') return { code: 'SOTTOSCORTA', text: 'Giacenza insufficiente a coprire il fabbisogno mensile', action: 'auto' }
  return { code: 'STD_REPLEN', text: 'Riordino standard basato su soglia minima', action: 'auto' }
}

const reasonColors = {
  GIACENZA_ZERO:   { bg: 'var(--color-text-primary)', color: '#fff' },
  SOTTOSCORTA:     { bg: 'var(--color-orange)', color: '#fff' },
  BASSA_CONF:      { bg: 'var(--color-orange-light)', color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)' },
  CODICE_GENERICO: { bg: 'var(--color-orange-light)', color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)' },
  STD_REPLEN:      { bg: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' },
}

function ReasonBadge({ code }) {
  const s = reasonColors[code] || reasonColors.STD_REPLEN
  return (
    <span style={{ ...s, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
      {code}
    </span>
  )
}

// ─── Exclusion badge ──────────────────────────────────────────────────────────
const EXCLUSION_META = {
  'bloccato-tra': {
    icon: <Clock size={10} />,
    label: 'IN TRANSITO',
    tooltip: 'Merce in transito sufficiente a coprire il fabbisogno — nessun acquisto necessario',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  'bloccato-dup': {
    icon: <Ban size={10} />,
    label: 'GIÀ ORDINATO',
    tooltip: 'Ordine inviato nelle ultime 24h — possibile duplicato',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  'mismatch': {
    icon: <ShieldAlert size={10} />,
    label: 'MISMATCH FAMIGLIA',
    tooltip: 'Divergenza ERP↔TecDoc — revisione umana obbligatoria prima di ordinare',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
}

function ExclusionBadge({ stato }) {
  const meta = EXCLUSION_META[stato]
  if (!meta) return null
  return (
    <span
      title={meta.tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
        letterSpacing: '0.05em', fontFamily: 'monospace',
        color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
        cursor: 'help',
      }}
    >
      {meta.icon}{meta.label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FabbisogniQueue({ onOpenDrawer, rows: rowsProp, normOverrides }) {
  const navigate = useNavigate()
  const allData = rowsProp ?? mockRows
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [gruppo, setGruppo] = useState('')
  const [showExcluded, setShowExcluded] = useState(true)

  const EXCLUDED_STATI = ['bloccato-tra', 'bloccato-dup', 'mismatch']

  // Fonte di verità condivisa con Workstation e SupplierScouting
  const { active: activeRows, excluded: excludedRows } = useQueue(allData)

  const urgOrd = { Prioritaria: 0, Critica: 0, Alta: 1, Sottoscorta: 1, Media: 2, Bassa: 3 }

  const filteredActive = useMemo(() => {
    let rows = activeRows
    if (filter === 'critica') rows = rows.filter(r => r.urgenza === 'Prioritaria' || r.urgenza === 'Critica')
    if (filter === 'sottoscorta') rows = rows.filter(r => r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta')
    if (filter === 'human') rows = rows.filter(r => {
      const rc = getReason(r)
      return rc.action === 'human' || r._conf < 70
    })
    if (filter === 'auto') rows = rows.filter(r => {
      const rc = getReason(r)
      return rc.action === 'auto' && (r._conf ?? 95) >= 80
    })
    if (gruppo) rows = rows.filter(r => r.gruppoMerceologico === gruppo)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        (r.codiceMadre || '').toLowerCase().includes(q) ||
        (r.codiceNormalizzato || '').toLowerCase().includes(q) ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.gruppoMerceologico || '').toLowerCase().includes(q)
      )
    }
    return [...rows].sort((a, b) => {
      const ua = urgOrd[a.urgenza] ?? 2
      const ub = urgOrd[b.urgenza] ?? 2
      return ua !== ub ? ua - ub : (b._conf ?? 95) - (a._conf ?? 95)
    })
  }, [activeRows, filter, search, gruppo])

  const gruppi = [...new Set(allData.map(r => r.gruppoMerceologico))].filter(Boolean).sort()
  const countPri = activeRows.filter(r => r.urgenza === 'Prioritaria' || r.urgenza === 'Critica').length
  const countSot = activeRows.filter(r => r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta').length
  const countHuman = activeRows.filter(r => { const rc = getReason(r); return rc.action === 'human' || r._conf < 70 }).length
  const countAuto = activeRows.filter(r => { const rc = getReason(r); return rc.action === 'auto' && (r._conf ?? 95) >= 80 }).length

  const cntTra  = excludedRows.filter(r => r._stato === 'bloccato-tra').length
  const cntDup  = excludedRows.filter(r => r._stato === 'bloccato-dup').length
  const cntMis  = excludedRows.filter(r => r._stato === 'mismatch').length

  const pillClass = (f) => `pill${filter === f ? ' active-orange' : ''}`

  // ─── Row renderer (shared between active and excluded sections) ──────────────
  const renderRow = (r, isExcluded = false) => {
    const norm = normalizationsLog[r.codiceMadre]
    const override = normOverrides?.[r.id]
    const codiceDisplay = override?.codiceNormalizzato ?? r.codiceNormalizzato ?? norm?.codiceNormalizzato ?? r.codiceMadre
    const reason = getReason(r)
    const needsHuman = reason.action === 'human'
    const isAuto = reason.action === 'auto' && (r._conf ?? 95) >= 80
    const fb = getFabbisognoReale(r)

    let rowCls = ''
    if (isExcluded) rowCls = 'row-excluded'
    else if (r.urgenza === 'Prioritaria' || r.urgenza === 'Critica') rowCls = 'row-critical'
    else if (needsHuman) rowCls = 'row-warn'

    return (
      <tr
        key={r.id}
        className={rowCls}
        style={{ cursor: isExcluded ? 'default' : 'pointer', opacity: isExcluded ? 0.55 : 1 }}
        onClick={() => !isExcluded && navigate('/scouting', { state: { reqId: r.id } })}
      >
        <td>
          <div className="cell">
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.id}</span>
          </div>
        </td>
        <td>
          <div className="cell">
            <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, textDecoration: isExcluded ? 'line-through' : 'none', color: isExcluded ? 'var(--color-text-muted)' : 'inherit' }}>
              {codiceDisplay}
            </span>
            {codiceDisplay !== r.codiceMadre && (
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>orig: {r.codiceMadre}</div>
            )}
          </div>
        </td>
        <td>
          <div className="cell">
            <div style={{ fontSize: 12 }}>{r.gruppoMerceologico}</div>
            {r.sottogruppo && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.sottogruppo}</div>}
          </div>
        </td>
        <td>
          <div className="cell">
            <span className={`badge ${r.urgenza === 'Prioritaria' || r.urgenza === 'Critica' ? 'badge-critica' : r.urgenza === 'Sottoscorta' || r.urgenza === 'Alta' ? 'badge-alta' : 'badge-media'}`}>
              {r.urgenza}
            </span>
          </div>
        </td>
        <td>
          <div className="cell">
            <span className={`badge ${r.lineaProdotto === 'Originale' ? 'badge-originale' : r.lineaProdotto === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`}>
              {r.lineaProdotto}
            </span>
          </div>
        </td>
        <td>
          <div className="cell">
            {isExcluded
              ? <ExclusionBadge stato={r._stato} />
              : <ReasonBadge code={reason.code} />
            }
          </div>
        </td>
        <td>
          <div className="cell" style={{ maxWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }} className="truncate">
              {isExcluded ? (EXCLUSION_META[r._stato]?.tooltip ?? r.noteERP) : reason.text}
            </div>
          </div>
        </td>
        <td>
          <div className="cell" style={{ textAlign: 'right', fontSize: 12, color: fb.giacenzaERP === 0 ? 'var(--color-orange-text)' : 'var(--color-text-muted)' }}>
            {fb.giacenzaERP}
          </div>
        </td>
        <td>
          <div className="cell" style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: fb.coperto ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{fb.totale}</div>
            {(fb.ordinato > 0 || fb.transito > 0) && (
              <div style={{ fontSize: 9, color: 'var(--color-orange-text)' }}>
                {fb.ordinato > 0 && `+${fb.ordinato} ord.`}{fb.transito > 0 && ` +${fb.transito} tra.`}
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="cell" style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: fb.coperto ? 'var(--color-text-muted)' : 'var(--color-orange)' }}>
            {fb.coperto ? <span style={{ fontSize: 10 }}>✓ Coperto</span> : fb.fabbisognoReale}
          </div>
        </td>
        <td>
          <div className="cell">
            {isExcluded
              ? (
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {r._stato === 'bloccato-tra' ? 'Coperto' : r._stato === 'bloccato-dup' ? 'Bloccato' : 'In revisione'}
                </span>
              )
              : (
                <button
                  className={`btn btn-sm ${isAuto ? 'btn-primary' : ''}`}
                  onClick={e => { e.stopPropagation(); navigate('/scouting', { state: { reqId: r.id } }) }}
                >
                  {needsHuman ? <><AlertTriangle size={11} /> Revisione</> : <><Search size={11} /> Scouting</>}
                </button>
              )
            }
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Coda Fabbisogni da Riordinare</h1>
          <p className="page-subtitle">
            {activeRows.length} articoli attivi · {excludedRows.length} esclusi · {countPri} prioritari · {countSot} sottoscorta
          </p>
        </div>
      </div>

      {/* Exclusion summary bar */}
      {excludedRows.length > 0 && (
        <div style={{
          padding: '8px 20px',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 11, color: 'var(--color-text-muted)', flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 600 }}>Auto-esclusi:</span>
          {cntTra > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#3B82F6' }}>
              <Clock size={10} /> <strong>{cntTra}</strong> coperti da transito
            </span>
          )}
          {cntDup > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#DC2626' }}>
              <Ban size={10} /> <strong>{cntDup}</strong> ordine duplicato
            </span>
          )}
          {cntMis > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#D97706' }}>
              <ShieldAlert size={10} /> <strong>{cntMis}</strong> mismatch famiglia
            </span>
          )}
          <button
            onClick={() => setShowExcluded(v => !v)}
            style={{
              marginLeft: 'auto', fontSize: 10, padding: '2px 10px', borderRadius: 4,
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {showExcluded ? 'Nascondi esclusi' : 'Mostra esclusi'}
          </button>
        </div>
      )}

      <div className="filter-bar">
        <button className={pillClass('all')} onClick={() => setFilter('all')}>
          Tutti <span className="pill-count">{activeRows.length}</span>
        </button>
        <button className={`pill${filter === 'critica' ? ' active' : ''}`} onClick={() => setFilter('critica')}>
          <AlertTriangle size={10} /> Prioritari <span className="pill-count">{countPri}</span>
        </button>
        <button className={pillClass('sottoscorta')} onClick={() => setFilter('sottoscorta')}>
          Sottoscorta <span className="pill-count">{countSot}</span>
        </button>
        <button className={`pill${filter === 'auto' ? ' active-orange' : ''}`} onClick={() => setFilter('auto')}>
          <Zap size={10} /> Auto-acquisto <span className="pill-count">{countAuto}</span>
        </button>
        <button className={`pill${filter === 'human' ? ' active' : ''}`} onClick={() => setFilter('human')}>
          Revisione umana <span className="pill-count">{countHuman}</span>
        </button>
        <div className="divider" />
        <select className="select-filter" value={gruppo} onChange={e => setGruppo(e.target.value)}>
          <option value="">Tutti i gruppi</option>
          {gruppi.map(g => <option key={g}>{g}</option>)}
        </select>
        <div className="search-input-wrap">
          <Search size={13} />
          <input className="search-input" placeholder="Cerca codice o gruppo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Codice</th>
              <th>Gruppo / Sotto</th>
              <th>Urgenza</th>
              <th>Linea</th>
              <th>Stato / Reason</th>
              <th>Note</th>
              <th style={{ textAlign: 'right' }}>Giac. ERP</th>
              <th style={{ textAlign: 'right' }}>Giac. Reale</th>
              <th style={{ textAlign: 'right' }}>Da ordinare</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* Active rows */}
            {filteredActive.map(r => renderRow(r, false))}

            {/* Excluded rows — separator + degraded */}
            {showExcluded && excludedRows.length > 0 && filter === 'all' && (
              <>
                <tr>
                  <td colSpan={11} style={{
                    padding: '6px 12px',
                    background: 'var(--color-surface-2)',
                    borderTop: '2px dashed var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 10, fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.08em',
                  }}>
                    ↓ ESCLUSI AUTOMATICAMENTE — non richiedono azione ({excludedRows.length})
                  </td>
                </tr>
                {excludedRows.map(r => renderRow(r, true))}
              </>
            )}
          </tbody>
        </table>

        {filteredActive.length === 0 && filter !== 'all' && (
          <div className="empty-state"><Search size={28} /><span>Nessun articolo in coda con i filtri selezionati</span></div>
        )}
      </div>

      <div className="summary-bar">
        <span>Attivi: <strong>{filteredActive.length}</strong></span>
        <span>·</span>
        <span>Prioritari: <strong style={{ color: 'var(--color-text-primary)' }}>{countPri}</strong></span>
        <span>·</span>
        <span>Sottoscorta: <strong style={{ color: 'var(--color-orange)' }}>{countSot}</strong></span>
        <span>·</span>
        <span>Revisione umana: <strong>{countHuman}</strong></span>
        <span>·</span>
        <span style={{ color: 'var(--color-text-muted)' }}>Esclusi: <strong>{excludedRows.length}</strong></span>
      </div>
    </div>
  )
}
