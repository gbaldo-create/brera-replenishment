import { useState, useMemo } from 'react'
import { Search, Download, Trash2, CheckCircle, AlertTriangle, Clock, X, FileText, Database, Edit2, Save, AlertOctagon
} from 'lucide-react'
import { getOrdini, updateOrdineStato, updateOrdineNote, deleteOrdine, clearOrdini, getOrdiniStats, exportOrdiniCSV, exportOrdiniIDempiere, STATI_ORDINE } from '../data/ordiniStore'
import { OperatoreAvatar } from './OperatoreSelector'
import Tooltip from './Tooltip'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`kpi-card${accent ? ' accent' : ''}`}>
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function OrdineRow({ ordine, onUpdateStato, onUpdateNote, onDelete }) {
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(ordine.note || '')
  const [annulloConfirm, setAnnulloConfirm] = useState(false)
  const [annulloNote, setAnnulloNote] = useState('')
  const stato = STATI_ORDINE[ordine.stato] || STATI_ORDINE.confermato

  function saveNote() { onUpdateNote(ordine.id, note); setEditingNote(false) }

  return (
    <tr>
      <td><div className="cell" style={{ paddingLeft: 14 }}>
        {ordine.operatore
          ? <OperatoreAvatar operatoreId={ordine.operatore} size={22} />
          : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--color-text-muted)' }}>—</div>
        }
      </div></td>
      <td><div className="cell">
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{ordine.id}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{ordine.dataLeggibile}</div>
      </div></td>
      <td><div className="cell">
        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{ordine.codiceNormalizzato || ordine.codiceMadre}</div>
        {ordine.codiceNormalizzato !== ordine.codiceMadre && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{ordine.codiceMadre}</div>
        )}
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{ordine.costruttore}</div>
      </div></td>
      <td><div className="cell">
        <div style={{ fontSize: 11 }}>{ordine.gruppo}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{ordine.sottogruppo}</div>
      </div></td>
      <td><div className="cell">
        <div style={{ fontWeight: 700, fontSize: 12 }}>{ordine.fornitore}</div>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{ordine.codiceFornitore}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{ordine.logistica} · {ordine.leadTime}</div>
      </div></td>
      <td><div className="cell" style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700 }}>{ordine.qty} pz</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>€{ordine.prezzoNetto.toFixed(2)}/pz</div>
      </div></td>
      <td><div className="cell" style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: ordine.stato === 'annullato' ? '#991b1b' : 'var(--color-orange)', textDecoration: ordine.stato === 'annullato' ? 'line-through' : 'none' }}>
          €{ordine.totale.toFixed(2)}
        </div>
        {ordine.stato === 'annullato' && (
          <div style={{ fontSize: 9, color: '#991b1b', fontWeight: 600 }}>ANNULLATO</div>
        )}
      </div></td>
      <td><div className="cell">
        {annulloConfirm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626' }}>Annullare l'ordine?</div>
            <input
              placeholder="Motivo annullamento (obbligatorio)"
              value={annulloNote}
              onChange={e => setAnnulloNote(e.target.value)}
              style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #fca5a5', borderRadius: 4, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-xs"
                style={{ background: '#dc2626', color: '#fff', border: 'none', fontSize: 10, flex: 1 }}
                disabled={!annulloNote.trim()}
                onClick={() => { onUpdateStato(ordine.id, 'annullato'); onUpdateNote && onUpdateNote(ordine.id, `[ANNULLATO] ${annulloNote}`); setAnnulloConfirm(false); setAnnulloNote('') }}
              >
                Conferma
              </button>
              <button className="btn btn-xs btn-ghost" style={{ fontSize: 10 }} onClick={() => setAnnulloConfirm(false)}>Annulla</button>
            </div>
          </div>
        ) : (
          <select
            value={ordine.stato}
            onChange={e => {
              if (e.target.value === 'annullato') { setAnnulloConfirm(true) }
              else onUpdateStato(ordine.id, e.target.value)
            }}
            style={{ fontSize: 10, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--color-border)', background: stato.bg, color: stato.color, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
          >
            {Object.entries(STATI_ORDINE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        )}
      </div></td>
      <td><div className="cell" style={{ minWidth: 160 }}>
        {editingNote ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <input value={note} onChange={e => setNote(e.target.value)}
              style={{ flex: 1, fontSize: 11, padding: '3px 6px', border: '1px solid var(--color-orange)', borderRadius: 4, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && saveNote()}
              autoFocus />
            <button className="btn btn-xs btn-primary" onClick={saveNote}><Save size={10} /></button>
            <button className="btn btn-xs btn-ghost" onClick={() => setEditingNote(false)}><X size={10} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: ordine.note ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', flex: 1 }} className="truncate">
              {ordine.note || 'Aggiungi nota...'}
            </span>
            <button className="btn btn-xs btn-ghost" onClick={() => setEditingNote(true)}><Edit2 size={10} /></button>
          </div>
        )}
      </div></td>
      <td><div className="cell">
        <Tooltip text="Elimina questo ordine dal registro">
          <button className="btn btn-xs btn-ghost" style={{ color: 'var(--color-orange-text)' }}
            onClick={() => { if (confirm('Eliminare questo ordine dal registro?')) onDelete(ordine.id) }}>
            <Trash2 size={11} />
          </button>
        </Tooltip>
      </div></td>
    </tr>
  )
}

export default function OrdiniRegistro() {
  const [ordini, setOrdini] = useState(getOrdini)
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState('')
  const [filterFornitore, setFilterFornitore] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  function refresh() { setOrdini(getOrdini()) }

  function handleUpdateStato(id, stato) { updateOrdineStato(id, stato); refresh() }
  function handleUpdateNote(id, note) { updateOrdineNote(id, note); refresh() }
  function handleDelete(id) { deleteOrdine(id); refresh() }
  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearOrdini(); refresh(); setConfirmClear(false)
  }

  const fornitori = [...new Set(ordini.map(o => o.fornitore).filter(Boolean))].sort()
  const stats = useMemo(() => getOrdiniStats(ordini), [ordini])

  const filtered = useMemo(() => {
    let list = ordini
    if (filterStato) list = list.filter(o => o.stato === filterStato)
    if (filterFornitore) list = list.filter(o => o.fornitore === filterFornitore)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        (o.codiceMadre || '').toLowerCase().includes(q) ||
        (o.codiceNormalizzato || '').toLowerCase().includes(q) ||
        (o.fornitore || '').toLowerCase().includes(q) ||
        (o.gruppo || '').toLowerCase().includes(q) ||
        (o.costruttore || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [ordini, filterStato, filterFornitore, search])

  const totaleFiltered = filtered.filter(o => o.stato === 'confermato' || o.stato === 'manuale').reduce((acc, o) => acc + o.totale, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro Ordini</h1>
          <p className="page-subtitle">
            {ordini.length} ordini registrati · €{stats.totaleValore.toFixed(2)} valore confermato · {stats.inRevisione} in revisione
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip text="Esporta in CSV per importazione manuale in qualsiasi sistema">
            <button className="btn" onClick={() => exportOrdiniCSV(filtered)}>
              <Download size={13} /> CSV
            </button>
          </Tooltip>
          <Tooltip text="Esporta in formato JSON compatibile con iDempiere per creazione OdA">
            <button className="btn" onClick={() => exportOrdiniIDempiere(filtered)}>
              <Database size={13} /> Export iDempiere
            </button>
          </Tooltip>
        </div>
      </div>

      {/* KPI */}
      {ordini.length > 0 && (
        <div style={{ padding: '0 20px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <StatCard label="Totale ordini" value={ordini.length} sub="nel registro" />
          <StatCard label="Confermati" value={stats.confermati} sub={`€${stats.totaleValore.toFixed(2)}`} accent />
          <StatCard label="In revisione" value={stats.inRevisione} sub="da approvare" />
          <StatCard label="Top fornitore" value={stats.topFornitori[0]?.[0] || '—'} sub={stats.topFornitori[0] ? `€${stats.topFornitori[0][1].toFixed(2)}` : ''} />
        </div>
      )}

      {/* iDempiere banner */}
      <div style={{ margin: '0 20px 10px', padding: '10px 14px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, fontSize: 11, color: 'var(--color-orange-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
        <div>
          <strong>OdA non creati in iDempiere</strong> — Gli ordini confermati qui non generano automaticamente Ordini di Acquisto nell'ERP.
          Usa <strong>Export iDempiere</strong> per scaricare il JSON e importarlo manualmente, oppure configura l'integrazione API in produzione.
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button className={`pill${filterStato === '' ? ' active-orange' : ''}`} onClick={() => setFilterStato('')}>
          Tutti <span className="pill-count">{ordini.length}</span>
        </button>
        {Object.entries(STATI_ORDINE).map(([k, v]) => {
          const count = ordini.filter(o => o.stato === k).length
          if (count === 0) return null
          return (
            <button key={k} className={`pill${filterStato === k ? ' active-orange' : ''}`} onClick={() => setFilterStato(k)}>
              {v.label} <span className="pill-count">{count}</span>
            </button>
          )
        })}
        <div className="divider" />
        <select className="select-filter" value={filterFornitore} onChange={e => setFilterFornitore(e.target.value)}>
          <option value="">Tutti i fornitori</option>
          {fornitori.map(f => <option key={f}>{f}</option>)}
        </select>
        <div className="search-input-wrap">
          <Search size={13} />
          <input className="search-input" placeholder="Cerca codice, fornitore..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {filtered.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              Totale filtrato: <strong style={{ color: 'var(--color-orange)' }}>€{totaleFiltered.toFixed(2)}</strong>
            </span>
          )}
          <Tooltip text="Cancella tutti gli ordini dal registro locale. Non influisce su iDempiere.">
            <button className={`btn btn-sm ${confirmClear ? 'btn-primary' : 'btn-ghost'}`}
              style={{ color: confirmClear ? '#fff' : 'var(--color-orange-text)' }}
              onClick={handleClear}>
              <Trash2 size={11} /> {confirmClear ? 'Conferma cancellazione' : 'Svuota registro'}
            </button>
          </Tooltip>
          {confirmClear && <button className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(false)}>Annulla</button>}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} />
            <span>{ordini.length === 0 ? 'Nessun ordine registrato. Conferma un ordine dalla Workstation per vederlo qui.' : 'Nessun ordine con i filtri selezionati.'}</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Op</th>
                <th>ID / Data</th>
                <th>Codice articolo</th>
                <th>Gruppo</th>
                <th>Fornitore</th>
                <th style={{ textAlign: 'right' }}>Quantità</th>
                <th style={{ textAlign: 'right' }}>Totale</th>
                <th>Stato</th>
                <th>Note</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <OrdineRow key={o.id} ordine={o}
                  onUpdateStato={handleUpdateStato}
                  onUpdateNote={handleUpdateNote}
                  onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="summary-bar">
          <span>Visualizzati: <strong>{filtered.length}</strong></span>
          <span>·</span>
          <span>Valore totale confermati: <strong style={{ color: 'var(--color-orange)' }}>€{totaleFiltered.toFixed(2)}</strong></span>
          <span>·</span>
          <span>Top fornitore: <strong>{stats.topFornitori[0]?.[0] || '—'}</strong></span>
        </div>
      )}
    </div>
  )
}
