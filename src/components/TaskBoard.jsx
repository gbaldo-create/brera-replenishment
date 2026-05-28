import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, AlertTriangle, Clock, CheckCircle, Search, ArrowRight, ExternalLink, MapPin } from 'lucide-react'

const COLUMNS = ['Da elaborare', 'In corso', 'Da fare', 'Eseguito']

const typeColors = {
  'Revisione Mapping':    'task-type-revisione',
  'Revisione Anagrafica': 'task-type-revisione',
  'Listino Mancante':     'task-type-listino',
  'Follow-up Ordine':     'task-type-followup',
  'Ranking Logistico':    'task-type-revisione',
  'Conferma Ordine':      'task-type-conferma',
}

const priorityOrder = { Critica: 0, Alta: 1, Media: 2, Bassa: 3 }

// Mappa tipo task → schermata di destinazione
const tipoToRoute = {
  'Revisione Mapping':    { route: '/normalizzazione', label: 'Apri Normalizzazione' },
  'Revisione Anagrafica': { route: '/normalizzazione', label: 'Apri Normalizzazione' },
  'Listino Mancante':     { route: '/scouting',        label: 'Apri Scouting' },
  'Follow-up Ordine':     { route: '/esito',           label: 'Apri Esito' },
  'Ranking Logistico':    { route: '/ranking',         label: 'Apri Ranking' },
  'Conferma Ordine':      { route: '/ordine',          label: 'Apri Ordine' },
}

// ─── Task Drawer ──────────────────────────────────────────────────────────────
function TaskDrawer({ task, onClose, onMove, onRemove }) {
  const navigate = useNavigate()
  if (!task) return null
  const destination = tipoToRoute[task.tipo]
  const nextCols = COLUMNS.filter(c => c !== task.stato)

  function handleNavigate() {
    if (destination) {
      onClose()
      navigate(destination.route, { state: { reqId: task.reqId } })
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`task-type-badge ${typeColors[task.tipo] || 'task-type-followup'}`}>{task.tipo}</span>
              <span className={`badge badge-${task.priorita.toLowerCase()}`}>{task.priorita}</span>
              {task.stato === 'Eseguito' && <span className="badge badge-ok"><CheckCircle size={9} /> Eseguito</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {task.id} · {task.codiceMadre}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Descrizione */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Descrizione</div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{task.desc}</p>
          </div>

          {/* Dettagli */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>Dettagli</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Assegnato a', value: task.assegnato },
                { label: 'Scadenza', value: task.scadenza },
                { label: 'Codice Madre', value: task.codiceMadre },
                { label: 'Stato', value: task.stato },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Destinazione */}
          {destination && (
            <div className="card" style={{ padding: '14px 16px', cursor: 'pointer', border: '1px solid var(--color-orange-border)', background: 'var(--color-orange-light)' }}
              onClick={handleNavigate}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ExternalLink size={16} color="var(--color-orange)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{destination.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Vai alla schermata relativa a questo task
                    {task.reqId && ` · ${task.reqId}`}
                  </div>
                </div>
                <ArrowRight size={16} color="var(--color-orange)" style={{ marginLeft: 'auto' }} />
              </div>
            </div>
          )}

          {/* Sposta in */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Sposta in</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nextCols.map(col => (
                <button key={col} className="btn" style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => { onMove(task.id, col); onClose() }}>
                  <MapPin size={13} /> {col}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn" style={{ color: 'var(--color-orange-text)' }}
            onClick={() => { onRemove(task.id); onClose() }}>
            <X size={13} /> Rimuovi task
          </button>
          {destination && (
            <button className="btn btn-primary" onClick={handleNavigate}>
              {destination.label} <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ task, onMove, onRemove, onOpen }) {
  const [menuPos, setMenuPos] = useState(null)
  const nextCols = COLUMNS.filter(c => c !== task.stato)

  let cardCls = 'kanban-card'
  if (task.priorita === 'Critica') cardCls += ' priority-critical'
  else if (task.priorita === 'Alta') cardCls += ' priority-high'

  function openMenu(e) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  return (
    <>
      <div className={cardCls} style={{ cursor: 'pointer' }} onClick={() => onOpen(task)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span className={`task-type-badge ${typeColors[task.tipo] || 'task-type-followup'}`}>{task.tipo}</span>
            <span className={`badge badge-${task.priorita.toLowerCase()}`} style={{ fontSize: 9 }}>{task.priorita}</span>
          </div>
          <button className="btn btn-ghost btn-xs btn-icon" style={{ flexShrink: 0, padding: 2 }} onClick={openMenu}>⋯</button>
        </div>

        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
          {task.id} · {task.codiceMadre}
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
          {task.desc}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={9} /> {task.scadenza}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {task.operatore && <OperatoreAvatar operatoreId={task.operatore} size={16} />}
            {task.assegnato && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{task.assegnato}</span>}
          </div>
        </div>

        {/* Hint clicca */}
        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--color-orange)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <ArrowRight size={9} />
          {tipoToRoute[task.tipo]?.label || 'Clicca per dettaglio'}
        </div>
      </div>

      {/* Menu floating */}
      {menuPos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setMenuPos(null)} />
          <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 1000, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: 'var(--shadow-modal)', padding: '4px 0', minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', padding: '6px 14px 4px' }}>Sposta in</div>
            {nextCols.map(col => (
              <button key={col}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { onMove(task.id, col); setMenuPos(null) }}>
                {col}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
            <button
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, color: 'var(--color-orange-text)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-orange-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              onClick={() => { onRemove(task.id); setMenuPos(null) }}>
              Rimuovi
            </button>
          </div>
        </>
      )}
    </>
  )
}

// ─── Main TaskBoard ───────────────────────────────────────────────────────────
import { OperatoreAvatar } from './OperatoreSelector'
import { getOperatore } from '../data/operatoreStore'

export default function TaskBoard({ tasks, moveTask, addTask }) {
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [removed, setRemoved] = useState(new Set())
  const [selectedTask, setSelectedTask] = useState(null)
  const [newTask, setNewTask] = useState({ tipo: 'Revisione Mapping', priorita: 'Media', assegnato: '', scadenza: 'Oggi', desc: '', codiceMadre: '' })

  function handleRemove(id) { setRemoved(prev => new Set([...prev, id])) }

  function handleAdd() {
    if (!newTask.desc || !newTask.codiceMadre) return
    const id = `TASK-${String(tasks.length + 1).padStart(3, '0')}`
    const op = getOperatore(); addTask({ ...newTask, id, reqId: '', stato: 'Da elaborare', operatore: op.id })
    setShowAddForm(false)
    setNewTask({ tipo: 'Revisione Mapping', priorita: 'Media', assegnato: '', scadenza: 'Oggi', desc: '', codiceMadre: '' })
  }

  const activeTasks = tasks.filter(t => !removed.has(t.id))

  function filterTasks(col) {
    return activeTasks
      .filter(t => t.stato === col)
      .filter(t => !filterPriority || t.priorita === filterPriority)
      .filter(t => !filterType || t.tipo === filterType)
      .filter(t => !search || t.codiceMadre.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (priorityOrder[a.priorita] || 3) - (priorityOrder[b.priorita] || 3))
  }

  const colIcons = {
    'Da elaborare': AlertTriangle,
    'In corso':     Clock,
    'Da fare':      Search,
    'Eseguito':     CheckCircle,
  }

  const colColors = {
    'Da elaborare': 'var(--color-text-muted)',
    'In corso':     'var(--color-orange)',
    'Da fare':      'var(--color-text-muted)',
    'Eseguito':     '#22C55E',
  }

  const inputStyle = { width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'Geist, sans-serif', outline: 'none', background: 'var(--color-surface-2)', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task & Booking Board</h1>
          <p className="page-subtitle">
            {activeTasks.length} task · {activeTasks.filter(t => t.priorita === 'Critica').length} critici · {activeTasks.filter(t => t.stato === 'Eseguito').length} completati
            <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· Clicca una card per aprire il dettaglio</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={13} /> Nuovo Task
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <select className="select-filter" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Tutte le priorità</option>
          {['Critica', 'Alta', 'Media', 'Bassa'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="select-filter" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tutti i tipi</option>
          {Object.keys(typeColors).map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="divider" />
        <div className="search-input-wrap" style={{ maxWidth: 220 }}>
          <Search size={13} />
          <input className="search-input" placeholder="Cerca task..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
          {COLUMNS.map(col => (
            <span key={col}>{col}: <strong>{filterTasks(col).length}</strong></span>
          ))}
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 14, minWidth: 900, height: '100%' }}>
          {COLUMNS.map(col => {
            const colTasks = filterTasks(col)
            const ColIcon = colIcons[col]
            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ColIcon size={13} color={colColors[col]} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{col}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: colTasks.length > 0 ? 'var(--color-surface)' : 'transparent', border: colTasks.length > 0 ? '1px solid var(--color-border)' : 'none', color: 'var(--color-text-muted)' }}>
                    {colTasks.length}
                  </span>
                </div>
                {colTasks.length === 0 ? (
                  <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.5 }}>
                    Nessun task
                  </div>
                ) : (
                  colTasks.map(task => (
                    <KanbanCard
                      key={task.id} task={task}
                      onMove={moveTask}
                      onRemove={handleRemove}
                      onOpen={setSelectedTask}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMove={moveTask}
          onRemove={handleRemove}
        />
      )}

      {/* Add task modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: 14 }}>Nuovo Task</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddForm(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Codice Articolo *', field: 'codiceMadre', placeholder: 'es. M-103316' },
                { label: 'Assegnato a', field: 'assegnato', placeholder: 'es. Buyer Senior' },
                { label: 'Scadenza', field: 'scadenza', placeholder: 'es. Oggi, Domani' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>{label}</div>
                  <input style={inputStyle} placeholder={placeholder} value={newTask[field]}
                    onChange={e => setNewTask(p => ({ ...p, [field]: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Tipo', field: 'tipo', options: Object.keys(typeColors) },
                  { label: 'Priorità', field: 'priorita', options: ['Critica', 'Alta', 'Media', 'Bassa'] },
                ].map(({ label, field, options }) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>{label}</div>
                    <select className="select-filter" style={{ width: '100%' }} value={newTask[field]}
                      onChange={e => setNewTask(p => ({ ...p, [field]: e.target.value }))}>
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Descrizione *</div>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Descrizione del task..."
                  value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddForm(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newTask.desc || !newTask.codiceMadre}>
                <Plus size={13} /> Crea Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
