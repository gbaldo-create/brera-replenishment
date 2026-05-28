import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import NotifichePanel from './NotifichePanel'
import OperatoreSelector from './OperatoreSelector'
import {
  ChevronDown, ChevronRight, X, ArrowRight, Search,
  Zap, LayoutDashboard, FileSpreadsheet, FlaskConical,
  ListChecks, Radar, BarChart3, HelpCircle, ShoppingCart,
  CheckSquare, ClipboardList, Settings, BookOpen,
  Tag, FileText, Kanban, MessageSquare, Package,
  ChevronLeft, PlayCircle
} from 'lucide-react'

// ─── Icone per ogni route ─────────────────────────────────────────────────────
const ROUTE_ICONS = {
  '/workstation':     Zap,
  '/':                LayoutDashboard,
  '/report':          FileSpreadsheet,
  '/normalizzazione': FlaskConical,
  '/fabbisogni':      ListChecks,
  '/scouting':        Radar,
  '/ranking':         BarChart3,
  '/explainability':  HelpCircle,
  '/ordine':          ShoppingCart,
  '/esito':           CheckSquare,
  '/ordini':          ClipboardList,
  '/prompt-optimizer':MessageSquare,
  '/task-board':      Kanban,
  '/eod-report':      FileText,
  '/brand-config':    Tag,
  '/impostazioni':    Settings,
  '/guida':           BookOpen,
}

// ─── Route map ────────────────────────────────────────────────────────────────
const ROUTES = {
  // ── Operativo — usato ogni giorno da Claudio ──
  main: [
    { to: '/workstation', label: 'Workstation', featured: true },
    { to: '/', label: 'Overview', end: true },
  ],
  operativo: [
    { to: '/report',          label: 'Report' },
    { to: '/normalizzazione', label: 'Normalizzazione' },
    { to: '/fabbisogni',      label: 'Fabbisogni' },
    { to: '/scouting',        label: 'Scouting' },
    { to: '/ordini',          label: 'Registro Ordini' },
    { to: '/task-board',      label: 'Task Board' },
    { to: '/eod-report',      label: 'Report EOD' },
  ],
  // ── Admin — configurazione e strumenti avanzati ──
  pipeline: [
    { to: '/ranking',         label: 'Ranking' },
    { to: '/explainability',  label: 'Spiegazione AI' },
    { to: '/ordine',          label: 'Finestra Ordine' },
    { to: '/esito',           label: 'Esito' },
    { to: '/prompt-optimizer', label: 'Prompt Optimizer' },
  ],
  sistema: [
    { to: '/brand-config',   label: 'Brand Config' },
    { to: '/impostazioni',   label: 'Impostazioni' },
    { to: '/guida',          label: 'Guida' },
  ],
}

const ALL_LINKS = [
  ...ROUTES.main,
  ...ROUTES.operativo.map(l => ({ ...l, group: 'Operativo' })),
  ...ROUTES.pipeline.map(l => ({ ...l, group: 'Avanzato' })),
  ...ROUTES.sistema.map(l => ({ ...l, group: 'Sistema' })),
]

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = query.trim()
    ? ALL_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_LINKS

  const grouped = {}
  filtered.forEach(l => {
    const g = l.group || 'Principale'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(l)
  })

  const flat = Object.values(grouped).flat()

  useEffect(() => { setActiveIdx(0) }, [query])

  function go(to) { navigate(to); onClose() }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flat[activeIdx]) go(flat[activeIdx].to)
  }

  let flatIdx = 0

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
        width: 520, maxWidth: 'calc(100vw - 32px)',
        background: '#1a1a1a', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        zIndex: 9999, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          <input autoFocus value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cerca schermata..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#fff', fontFamily: 'Geist, sans-serif' }}
          />
          <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 380, overflow: 'auto', padding: '6px 0' }}>
          {Object.entries(grouped).map(([group, links]) => (
            <div key={group}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', padding: '10px 16px 4px' }}>{group}</div>
              {links.map(link => {
                const Icon = ROUTE_ICONS[link.to]
                const idx = flatIdx++
                const isActive = idx === activeIdx
                return (
                  <button key={link.to} onClick={() => go(link.to)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', background: isActive ? 'rgba(249,115,22,0.12)' : 'none',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      color: isActive ? '#F97316' : 'rgba(255,255,255,0.75)',
                      fontFamily: 'Geist, sans-serif', textAlign: 'left',
                    }}
                  >
                    {Icon && <Icon size={14} color={isActive ? '#F97316' : 'rgba(255,255,255,0.3)'} />}
                    <span style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{link.label}</span>
                    {isActive && <ArrowRight size={13} color="#F97316" />}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Nessun risultato per "{query}"
            </div>
          )}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.2)', display: 'flex', gap: 14 }}>
          <span>↑↓ Naviga</span><span>↵ Apri</span><span>ESC Chiudi</span>
          <span style={{ marginLeft: 'auto' }}>⌘K</span>
        </div>
      </div>
    </>
  )
}

// ─── Tooltip per collapsed mode ───────────────────────────────────────────────
function SideTooltip({ label, children }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
          marginLeft: 10, zIndex: 9999,
          background: '#0F0F0F', color: '#fff',
          padding: '5px 10px', borderRadius: 6,
          fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {label}
          <div style={{
            position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
            border: '5px solid transparent', borderRightColor: '#0F0F0F',
          }} />
        </div>
      )}
    </div>
  )
}

// ─── Sidebar Link ─────────────────────────────────────────────────────────────
function SLink({ to, label, featured, end, collapsed }) {
  const Icon = ROUTE_ICONS[to]

  const linkContent = (isActive) => (
    <>
      {Icon && (
        <Icon
          size={14}
          color={featured ? '#fff' : isActive ? '#fff' : 'rgba(255,255,255,0.4)'}
          style={{ flexShrink: 0 }}
        />
      )}
      {!collapsed && (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      )}
    </>
  )

  const link = (
    <NavLink to={to} end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 9,
        padding: collapsed ? '9px 0' : '6px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        margin: featured ? '4px 8px 2px' : '1px 6px',
        borderRadius: featured ? 8 : 7,
        fontSize: 12.5,
        fontWeight: isActive ? 600 : 400,
        color: featured ? '#fff' : isActive ? '#fff' : 'rgba(255,255,255,0.6)',
        background: featured
          ? 'var(--color-orange)'
          : isActive
            ? 'rgba(255,255,255,0.1)'
            : 'transparent',
        borderLeft: !featured && isActive ? '2px solid var(--color-orange)' : !featured ? '2px solid transparent' : 'none',
        textDecoration: 'none',
        transition: 'background 0.1s, color 0.1s',
        overflow: 'hidden', whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      })}
      onMouseEnter={e => {
        const isFeatured = e.currentTarget.style.background.includes('F97316')
        const isActive = e.currentTarget.style.fontWeight === '600' || e.currentTarget.style.color === 'rgb(255, 255, 255)'
        if (!isFeatured && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        const isFeatured = e.currentTarget.style.background.includes('F97316')
        const p = e.currentTarget.getAttribute('href')
        const isAct = window.location.pathname === p || (p === '/' && window.location.pathname === '/')
        if (!isFeatured) e.currentTarget.style.background = isAct ? 'rgba(255,255,255,0.1)' : 'transparent'
      }}
    >
      {({ isActive }) => linkContent(isActive)}
    </NavLink>
  )

  if (collapsed) {
    return <SideTooltip label={label}>{link}</SideTooltip>
  }
  return link
}

// ─── Collapsible Group ────────────────────────────────────────────────────────
function SGroup({ label, links, defaultOpen, collapsed }) {
  const location = useLocation()
  const hasActive = links.some(l => location.pathname === l.to)
  const [open, setOpen] = useState(defaultOpen || hasActive)

  if (collapsed) return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0' }}>
      {links.map(l => <SLink key={l.to} to={l.to} label={l.label} collapsed />)}
    </div>
  )

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px', margin: '4px 0 1px', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
        color: hasActive ? 'rgba(249,115,22,0.9)' : 'rgba(255,255,255,0.2)',
        transition: 'color 0.1s',
      }}
        onMouseEnter={e => { if (!hasActive) e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        onMouseLeave={e => { if (!hasActive) e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
      >
        <span>{label}</span>
        {open
          ? <ChevronDown size={11} />
          : <ChevronRight size={11} />
        }
      </button>
      {open && (
        <div style={{ paddingLeft: 4 }}>
          {links.map(l => <SLink key={l.to} to={l.to} label={l.label} />)}
        </div>
      )}
    </div>
  )
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }))
    }, 10000)
    return () => clearInterval(id)
  }, [])
  return <span>{time}</span>
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ uploadedRows, urgencyCount, rows, onStartTour }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowPalette(s => !s) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const W = collapsed ? 52 : 220

  return (
    <>
      <aside style={{
        width: W, minHeight: '100vh', flexShrink: 0,
        background: '#111111',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '14px 0' : '13px 12px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          minHeight: 58, flexShrink: 0,
        }}>
          {!collapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src="/brera-logo.png" alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 8, height: 8, borderRadius: '50%',
                    background: uploadedRows ? '#F97316' : '#4ADE80',
                    border: '1.5px solid #111',
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>Brera</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Replenishment</div>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.3)', flexShrink: 0, transition: 'all 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                title="Comprimi sidebar"
              >
                <ChevronLeft size={12} />
              </button>
            </>
          ) : (
            <SideTooltip label="Espandi sidebar">
              <button onClick={() => setCollapsed(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}>
                <img src="/brera-logo.png" alt="Brera" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: '50%',
                  background: uploadedRows ? '#F97316' : '#4ADE80',
                  border: '1.5px solid #111',
                }} />
              </button>
            </SideTooltip>
          )}
        </div>

        {/* ── Search ── */}
        <div style={{ padding: collapsed ? '8px 6px' : '8px 8px', flexShrink: 0 }}>
          {collapsed ? (
            <SideTooltip label="Cerca (⌘K)">
              <button onClick={() => setShowPalette(true)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '7px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
              }}>
                <Search size={13} color="rgba(255,255,255,0.35)" />
              </button>
            </SideTooltip>
          ) : (
            <button onClick={() => setShowPalette(true)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
              transition: 'border-color 0.12s, background 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              title="Cerca schermata (⌘K)"
            >
              <Search size={12} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'left' }}>Cerca...</span>
              <kbd style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>⌘K</kbd>
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '2px 0', scrollbarWidth: 'none' }}>

          {/* ── Main ── */}
          {ROUTES.main.map(l => (
            <div key={l.to} style={{ position: 'relative' }}>
              <SLink to={l.to} label={l.label} featured={l.featured} end={l.end} collapsed={collapsed} />
              {l.to === '/workstation' && urgencyCount > 0 && (
                <div style={{
                  position: 'absolute', top: collapsed ? 5 : 3,
                  right: collapsed ? 3 : 12,
                  background: '#fff', color: '#F97316',
                  borderRadius: 10, fontSize: 9, fontWeight: 800,
                  padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  pointerEvents: 'none', lineHeight: '14px',
                  border: '1.5px solid #F97316',
                }}>
                  {urgencyCount > 99 ? '99+' : urgencyCount}
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 10px' }} />

          {/* ── Operativo ── */}
          <SGroup label="Operativo" links={ROUTES.operativo} defaultOpen collapsed={collapsed} />

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 10px' }} />

          {/* ── Admin collapsible ── */}
          {!collapsed ? (
            <div>
              <button
                onClick={() => setAdminOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 12px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
                  color: adminOpen ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = adminOpen ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }}
              >
                <span>Avanzato</span>
                {adminOpen
                  ? <ChevronDown size={11} />
                  : <ChevronRight size={11} />
                }
              </button>
              {adminOpen && (
                <div style={{ paddingLeft: 4 }}>
                  {ROUTES.pipeline.map(l => <SLink key={l.to} to={l.to} label={l.label} />)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0' }}>
              {ROUTES.pipeline.map(l => <SLink key={l.to} to={l.to} label={l.label} collapsed />)}
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 10px' }} />

          {/* ── Sistema ── */}
          {ROUTES.sistema.map(l => (
            <SLink key={l.to} to={l.to} label={l.label} collapsed={collapsed} />
          ))}
        </nav>

        {/* ── Tour button ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '6px 4px' : '6px 8px', flexShrink: 0 }}>
          {collapsed ? (
            <SideTooltip label="Rivedi tour guidato">
              <button
                onClick={onStartTour}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '7px', borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                }}
              >
                <PlayCircle size={14} color="rgba(255,255,255,0.3)" />
              </button>
            </SideTooltip>
          ) : (
            <button
              onClick={onStartTour}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <PlayCircle size={13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Tour guidato</span>
            </button>
          )}
        </div>

        {/* ── Notifiche ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, paddingBottom: 2, flexShrink: 0 }}>
          <NotifichePanel rows={rows} collapsed={collapsed} />
        </div>

        {/* ── Operatore ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <OperatoreSelector collapsed={collapsed} />
        </div>
      </aside>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </>
  )
}
