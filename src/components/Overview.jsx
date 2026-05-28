import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet, FlaskConical, ListChecks, Search, ShoppingCart,
  AlertTriangle, TrendingDown, Clock, Truck, PiggyBank, Timer,
  ArrowRight, Zap, Kanban, FileText, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { reorderReportRows as mockRows, eodSummary } from '../data/mockData'
import { getOrdini } from '../data/ordiniStore'

const steps = [
  { n: 1, to: '/report',          icon: FileSpreadsheet, label: 'Import Report',       desc: 'Caricamento file ERP giornaliero con dati sporchi e anomalie' },
  { n: 2, to: '/normalizzazione', icon: FlaskConical,    label: 'Data Quality & Norm', desc: 'Parsing prefissi, decompressione codici, match famiglie ERP/TecDoc' },
  { n: 3, to: '/fabbisogni',      icon: ListChecks,      label: 'Coda Fabbisogni',     desc: 'Esclusione righe già coperte, ordinate per urgenza e reason code AI' },
  { n: 4, to: '/scouting',        icon: Search,          label: 'Scouting Fornitori',  desc: 'Simulazione QRicambi: offerte, fratelli articolo, logistica' },
  { n: 5, to: '/esito',           icon: ShoppingCart,    label: 'Decisione & Ordine',  desc: 'Ranking AI, explainability, conferma acquisto o revisione umana' },
]

const additionalTools = [
  { to: '/prompt-optimizer', icon: Zap,      label: 'Prompt Optimizer',  desc: 'Strategia di ricerca AI per codici sporchi o compressi' },
  { to: '/task-board',       icon: Kanban,   label: 'Task Board',         desc: 'Gestione operativa casi, assegnazioni e follow-up' },
  { to: '/eod-report',       icon: FileText, label: 'Report EOD',         desc: 'Riepilogo sessione, saving, anomalie e backlog aperto' },
]

// ─── KPI Card con menu ⋯ ──────────────────────────────────────────────────────
function KpiCard({ label, value, unit, icon: Icon, to, accent, menuItems, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  function openMenu(e) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuOpen(true)
  }

  return (
    <>
      <div
        className={`kpi-card${accent ? ' accent' : ''}`}
        style={{ cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-lg)' }}
        onClick={() => navigate(to)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: accent ? 'var(--color-orange)' : 'var(--color-surface-2)',
            border: `1px solid ${accent ? 'var(--color-orange)' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={accent ? '#fff' : 'var(--color-text-muted)'} />
          </div>
          <button
            onClick={openMenu}
            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.6 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <div className="kpi-value" style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
        <div className="kpi-label" style={{ marginTop: 2 }}>{label}</div>
        <div className="kpi-sub">{unit}</div>
      </div>

      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 1000, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-modal)', padding: '4px 0', minWidth: 180 }}>
            {(menuItems || [{ label: 'Vai alla schermata', to }]).map((item, i) => (
              <button key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-primary)', fontFamily: 'Geist, sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => { navigate(item.to); setMenuOpen(false) }}
              >
                <ChevronRight size={12} color="var(--color-text-muted)" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

export default function Overview({ rows: rowsProp }) {
  const navigate = useNavigate()
  const rows = rowsProp ?? mockRows

  const prioritari = rows.filter(r => r.urgenza === 'Critica' || r.urgenza === 'Prioritaria').length
  const hasCritical = prioritari > 0

  // Ordini confermati in sessione — aggiornati in tempo reale
  const [tick, setTick] = useState(0)
  useEffect(() => {
    // Poll ogni 3s per aggiornarsi se Workstation o Scouting confermano ordini
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const sessionOrdini = useMemo(() => getOrdini(), [tick])
  const ordiniConfermati = sessionOrdini.filter(o => o.tipo === 'confermato' || o.tipo === 'acquistato')
  const valoreOrdinato = ordiniConfermati.reduce((s, o) => s + (parseFloat(o.prezzoNetto || 0) * (o.qty || 1)), 0)
  const fornitori = [...new Set(ordiniConfermati.map(o => o.fornitore).filter(Boolean))]

  const kpis = [
    {
      label: 'Fabbisogni Prioritari', value: prioritari, unit: 'critici / prioritari',
      icon: AlertTriangle, to: '/fabbisogni', accent: true,
      menuItems: [
        { label: 'Vai a Fabbisogni', to: '/fabbisogni' },
        { label: 'Apri Workstation', to: '/workstation' },
      ],
    },
    {
      label: 'Giacenza Zero', value: rows.filter(r => r.giacenza === 0).length, unit: 'articoli a zero',
      icon: TrendingDown, to: '/fabbisogni',
      menuItems: [{ label: 'Vai a Fabbisogni', to: '/fabbisogni' }],
    },
    {
      label: 'Alta Ambiguità', value: rows.filter(r => (r._conf ?? 95) < 70).length, unit: 'in revisione',
      icon: Clock, to: '/normalizzazione',
      menuItems: [{ label: 'Vai a Normalizzazione', to: '/normalizzazione' }],
    },
    {
      label: 'Coperti da Transito', value: rows.filter(r => r._stato === 'bloccato-tra').length, unit: 'già coperti',
      icon: Truck, to: '/report',
      menuItems: [{ label: 'Vai al Report', to: '/report' }],
    },
    {
      label: 'Saving Potenziale', value: `€${eodSummary.savingStimato.toFixed(0)}`, unit: 'vs prima opzione',
      icon: PiggyBank, to: '/ranking', accent: true,
      menuItems: [
        { label: 'Vai al Ranking', to: '/ranking' },
        { label: 'Vai al Report EOD', to: '/eod-report' },
      ],
    },
    {
      label: 'Ordini Sessione', value: ordiniConfermati.length, unit: `su ${fornitori.length} fornitor${fornitori.length === 1 ? 'e' : 'i'}`,
      icon: ShoppingCart, to: '/ordini', accent: ordiniConfermati.length > 0,
      menuItems: [{ label: 'Vai al Registro Ordini', to: '/ordini' }],
    },
    {
      label: 'Valore Ordinato', value: `€${valoreOrdinato.toFixed(0)}`, unit: 'questa sessione',
      icon: Timer, to: '/eod-report',
      menuItems: [{ label: 'Vai al Report EOD', to: '/eod-report' }],
    },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Greeting header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', margin: '-24px -24px 0', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', backgroundImage: 'linear-gradient(rgba(15,15,15,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(15,15,15,0.025) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--color-orange)' }}>Claudio.</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {rows.length} righe caricate · {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            {prioritari > 0 && <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}> · {prioritari} urgenze da elaborare</span>}
          </p>
        </div>
        <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => navigate('/workstation')}>
          <Zap size={14} /> Apri Workstation <ArrowRight size={13} />
        </button>
      </div>

      {/* ── KPI Grid + CTA ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: hasCritical ? 'repeat(3, 1fr) 1.1fr' : 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
        {/* KPI cards */}
        <div style={{ gridColumn: hasCritical ? '1 / 4' : '1 / 4', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {kpis.map(kpi => (
            <KpiCard key={kpi.label} {...kpi} navigate={navigate} />
          ))}
        </div>

        {/* CTA arancio — solo se ci sono urgenze critiche */}
        {hasCritical && (
          <div
            onClick={() => navigate('/workstation')}
            style={{
              gridColumn: '4 / 5', gridRow: '1 / 3',
              background: 'var(--color-orange)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 22px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Organic pattern */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: 60, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>
                {prioritari}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                Urgenze prioritarie da elaborare
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                Avvia la Workstation per elaborarle articolo per articolo con supporto AI.
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-orange)' }}>
                Avvia Workstation <ArrowRight size={14} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Flusso operativo ───────────────────────────────────────────────── */}
      <div className="card" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="card-header">
          <span className="card-title">Flusso operativo — 5 step</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Clicca uno step per navigare</span>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map(({ n, to, icon: Icon, label, desc }, idx) => (
            <div key={n} style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: n <= 2 ? 'var(--color-text-primary)' : n === 3 ? 'var(--color-orange)' : 'var(--color-surface-3)',
                  border: `1px solid ${n <= 2 ? 'var(--color-text-primary)' : n === 3 ? 'var(--color-orange)' : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  color: n <= 3 ? '#fff' : 'var(--color-text-muted)',
                }}>
                  {n}
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--color-border)', margin: '4px 0' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingLeft: 14, paddingBottom: idx < steps.length - 1 ? 20 : 0, cursor: 'pointer' }} onClick={() => navigate(to)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Icon size={14} color={n === 3 ? 'var(--color-orange)' : 'var(--color-text-secondary)'} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
                  {n <= 2 && <span className="badge badge-ok" style={{ fontSize: 9 }}>Completato</span>}
                  {n === 3 && <span className="badge badge-alta" style={{ fontSize: 9 }}>In corso</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tool Operativi ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
          Tool Operativi
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {additionalTools.map(({ to, icon: Icon, label, desc }) => (
            <div key={to} className="card" style={{ padding: '16px', cursor: 'pointer', borderRadius: 'var(--radius-lg)' }}
              onClick={() => navigate(to)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-orange)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={15} color="var(--color-orange)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} /> Pipeline attiva
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)' }} /> {rows.length} righe
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-primary)' }} /> {rows.filter(r => r._stato === 'mismatch').length} blocchi critici
          </div>
          <div style={{ marginLeft: 'auto', fontWeight: 600 }}>Brera Replenishment · Demo</div>
        </div>
      </div>
    </div>
  )
}
