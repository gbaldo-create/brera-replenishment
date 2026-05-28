import { useState } from 'react'
import { FileText, BarChart3, Download, CheckCircle, AlertTriangle, TrendingUp, Clock, Package } from 'lucide-react'
import { eodSummary, buildEodFromRows } from '../data/mockData'
import { getOrdini } from '../data/ordiniStore'


// ─── Bar chart con colonna evidenziata ────────────────────────────────────────
function HighlightBarChart({ data, height = 80, label }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      {label && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1
          const isMax = d.value === max
          const h = Math.max(4, Math.round((d.value / max) * height))
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {isLast && <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-orange)' }}>{d.value}</div>}
              <div style={{ width: '100%', height: h, borderRadius: '4px 4px 2px 2px', background: isLast ? 'var(--color-orange)' : isMax ? 'var(--color-text-primary)' : 'var(--color-surface-3)', transition: 'height 0.3s ease' }} />
              <div style={{ fontSize: 9, color: isLast ? 'var(--color-orange)' : 'var(--color-text-muted)', fontWeight: isLast ? 700 : 400 }}>{d.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ value, total, color = 'var(--color-orange)', size = 80, label, sublabel }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? value / total : 0
  const dash = circ * pct
  const cx = size / 2, cy = size / 2
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={7} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size > 70 ? 15 : 12, fontWeight: 800, color, lineHeight: 1 }}>
            {total > 0 ? `+${Math.round(pct * 100)}%` : '—'}
          </span>
        </div>
      </div>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'center' }}>{label}</div>}
      {sublabel && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center' }}>{sublabel}</div>}
    </div>
  )
}

// ─── Area Chart SVG ───────────────────────────────────────────────────────────
function AreaChart({ data, width = 340, height = 90, color = 'var(--color-orange)', label }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const min = 0
  const W = width, H = height
  const padX = 8, padY = 8

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: padY + (1 - (d.value - min) / (max - min)) * (H - padY * 2 - 16),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length-1].x} ${H - 16} L ${points[0].x} ${H - 16} Z`

  // Smooth curve using bezier
  const curvePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cpX = (prev.x + p.x) / 2
    return `${acc} C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`
  }, '')
  const curveArea = `${curvePath} L ${points[points.length-1].x} ${H - 16} L ${points[0].x} ${H - 16} Z`

  const lastPt = points[points.length - 1]

  return (
    <div>
      {label && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 8 }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={curveArea} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={curvePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* End dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="4" fill={color} />
        <circle cx={lastPt.x} cy={lastPt.y} r="7" fill={color} opacity="0.2" />
        {/* X axis labels */}
        {data.map((d, i) => (
          <text key={i}
            x={padX + (i / (data.length - 1)) * (W - padX * 2)}
            y={H - 2}
            textAnchor="middle"
            fontSize="8"
            fill={i === data.length - 1 ? color : 'var(--color-text-muted)'}
            fontWeight={i === data.length - 1 ? '700' : '400'}
          >{d.label}</text>
        ))}
      </svg>
    </div>
  )
}

function MiniBar({ value, max, color = 'var(--color-text-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="report-section">
      <div className="report-section-header">{title}</div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  )
}

export default function EndOfDayReport({ rows }) {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'testo' | 'export'
  const [exported, setExported] = useState(null)
  const ordini = getOrdini()
  const realData = rows ? buildEodFromRows(rows, ordini) : null
  const s = realData || eodSummary
  const isDemo = !realData

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function handleExport(tipo) {
    setExported(tipo)
    setTimeout(() => setExported(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Report End-of-Day</h1>
          <p className="page-subtitle">Riepilogo sessione — {today}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['dashboard', 'testo', 'export'].map(v => (
            <button
              key={v}
              className={`btn btn-sm${view === v ? ' btn-primary' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'dashboard' && <BarChart3 size={12} />}
              {v === 'testo' && <FileText size={12} />}
              {v === 'export' && <Download size={12} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Banner dati */}
      <div style={{
        padding: '7px 24px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8,
        background: isDemo ? 'var(--color-surface-2)' : '#F0FDF4',
        borderBottom: `1px solid ${isDemo ? 'var(--color-border)' : '#BBF7D0'}`,
        flexShrink: 0,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: isDemo ? '#9CA3AF' : '#22C55E', flexShrink: 0 }} />
        {isDemo
          ? <span style={{ color: 'var(--color-text-muted)' }}>Dati <strong>demo</strong> — carica un file Excel per vedere i dati reali della sessione</span>
          : <span style={{ color: '#15803D' }}>Dati <strong>reali</strong> — {s.totaleProcessati} righe dalla sessione corrente · {getOrdini().filter(o => new Date(o.data).toDateString() === new Date().toDateString()).length} ordini oggi</span>
        }
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ─── DASHBOARD VIEW ─── */}
        {view === 'dashboard' && (
          <>
            {/* KPI top row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Processati', value: s.totaleProcessati, icon: Package, sub: 'articoli totali' },
                { label: 'Acquistati', value: s.acquistati, icon: CheckCircle, sub: 'ordini confermati', accent: true },
                { label: 'Valore Ordini', value: `€${s.valoreTotaleOrdini.toFixed(0)}`, icon: TrendingUp, sub: 'importo totale' },
                { label: 'Saving Stimato', value: `€${s.savingStimato.toFixed(0)}`, icon: TrendingUp, sub: 'vs prima alternativa', accent: true },
              ].map(({ label, value, icon: Icon, sub, accent }) => (
                <div key={label} className={`kpi-card${accent ? ' accent' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="kpi-label">{label}</span>
                    <Icon size={13} color={accent ? 'var(--color-orange)' : 'var(--color-text-muted)'} />
                  </div>
                  <div className="kpi-value">{value}</div>
                  <div className="kpi-sub">{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Bar chart sessioni settimanali */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <HighlightBarChart label="Articoli elaborati — settimana" height={72} data={[
          { label: 'Lun', value: Math.floor(s.totaleProcessati * 0.7) },
          { label: 'Mar', value: Math.floor(s.totaleProcessati * 0.9) },
          { label: 'Mer', value: Math.floor(s.totaleProcessati * 0.6) },
          { label: 'Gio', value: Math.floor(s.totaleProcessati * 1.1) },
          { label: 'Ven', value: Math.floor(s.totaleProcessati * 0.8) },
          { label: 'Sab', value: Math.floor(s.totaleProcessati * 0.3) },
          { label: 'Oggi', value: s.totaleProcessati },
        ]} />
        <AreaChart label="Trend valore ordinato — mese" data={[
          { label: '1', value: s.valoreTotaleOrdini * 0.6 },
          { label: '5', value: s.valoreTotaleOrdini * 0.75 },
          { label: '10', value: s.valoreTotaleOrdini * 0.55 },
          { label: '15', value: s.valoreTotaleOrdini * 0.9 },
          { label: '20', value: s.valoreTotaleOrdini * 0.7 },
          { label: '25', value: s.valoreTotaleOrdini * 1.1 },
          { label: 'Oggi', value: s.valoreTotaleOrdini },
        ]} />
      </div>

      {/* Distribuzione esiti — Donut charts */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 16 }}>Distribuzione Esiti</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <DonutChart value={s.acquistati} total={s.totaleProcessati} color="var(--color-text-primary)" size={76} label="Acquistati" sublabel={`${s.acquistati} ordini`} />
                  <DonutChart value={s.inRevisione} total={s.totaleProcessati} color="var(--color-orange)" size={76} label="Revisione" sublabel={`${s.inRevisione} articoli`} />
                  <DonutChart value={s.sospesoAmbiguita} total={s.totaleProcessati} color="#ef4444" size={76} label="Sospesi" sublabel={`${s.sospesoAmbiguita} casi`} />
                  <DonutChart value={s.copertiTransito} total={s.totaleProcessati} color="var(--color-text-muted)" size={76} label="Transito" sublabel={`${s.copertiTransito} coperti`} />
                </div>
              </div>

              {/* Top fornitori */}
              <Section title="Top Fornitori per Valore">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.topFornitori.map((f, i) => (
                    <div key={f.nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? 'var(--color-orange)' : 'var(--color-surface-3)',
                        border: `1px solid ${i === 0 ? 'var(--color-orange)' : 'var(--color-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--color-text-muted)',
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{f.nome}</div>
                        <MiniBar value={f.valore} max={s.topFornitori[0].valore} color={i === 0 ? 'var(--color-orange)' : 'var(--color-text-primary)'} />
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800 }}>€{f.valore.toFixed(0)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{f.ordini} ordini</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Qualità distribuzione */}
              <Section title="Distribuzione per Linea Qualità">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-around' }}>
                  {Object.entries(s.distribuzioneQualita).map(([linea, n]) => {
                    const colors = { Originale: 'var(--color-text-primary)', 'Primo Equipaggiamento': 'var(--color-orange)', Economico: 'var(--color-text-muted)' }
                    return (
                      <DonutChart key={linea}
                        value={n} total={s.acquistati}
                        color={colors[linea]}
                        size={72}
                        label={linea === 'Primo Equipaggiamento' ? 'P. Equip.' : linea}
                        sublabel={`${n} art.`}
                      />
                    )
                  })}
                </div>
              </Section>

              {/* AI Performance */}
              <Section title="Performance AI">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Risolti automaticamente', value: `${s.risoltiAutomaticamente}/${s.totaleProcessati}`, pct: Math.round((s.risoltiAutomaticamente / s.totaleProcessati) * 100) },
                    { label: 'Ricerche al 1° prompt', value: `${s.ricercheAlPrimoPrompt}%`, pct: s.ricercheAlPrimoPrompt },
                    { label: 'Task creati auto', value: `${s.taskCreatiAutomaticamente}`, pct: Math.round((s.taskCreatiAutomaticamente / s.totaleProcessati) * 100) },
                  ].map(({ label, value, pct }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{value}</span>
                      </div>
                      <MiniBar value={pct} max={100} />
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Media tentativi di ricerca per articolo: <strong>{s.mediaTentativiRicerca}</strong>
                  </div>
                </div>
              </Section>
            </div>

            {/* Anomalie */}
            <Section title="Anomalie e Criticità Rilevate">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.topProblemi.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                    <AlertTriangle size={13} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Task summary */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Task aperti', value: s.taskAperti, color: 'var(--color-orange)' },
                { label: 'Task completati oggi', value: s.taskCompletatiOggi, color: 'var(--color-text-primary)' },
                { label: 'Casi bloccati per qualità', value: s.casiBloccatiPerQualita, color: 'var(--color-text-secondary)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={16} color={color} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── TESTO VIEW ─── */}
        {view === 'testo' && (
          <div className="card" style={{ padding: '28px 32px', maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Report Operativo Giornaliero</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{today} — Workstation Brera Replenishment</div>
              </div>
              <div style={{ width: 36, height: 36, background: 'var(--color-text-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, background: 'var(--color-orange)', borderRadius: 3 }} />
              </div>
            </div>

            {[
              {
                title: 'Sintesi della sessione',
                content: `Nella giornata odierna sono stati processati complessivamente ${s.totaleProcessati} articoli in fabbisogno, dei quali ${s.risoltiAutomaticamente} (${Math.round((s.risoltiAutomaticamente/s.totaleProcessati)*100)}%) sono stati risolti in modo automatico dalla pipeline AI. Il valore totale degli ordini confermati ammonta a €${s.valoreTotaleOrdini.toFixed(2)}, con un saving stimato di €${s.savingStimato.toFixed(2)} rispetto all'alternativa a prezzo più elevato.`,
              },
              {
                title: 'Distribuzione per esito',
                content: `Degli articoli processati: ${s.acquistati} ordini confermati (di cui ${s.distribuzioneQualita['Primo Equipaggiamento']} Primo Equipaggiamento, ${s.distribuzioneQualita.Originale} Originale, ${s.distribuzioneQualita.Economico} Economico), ${s.accodati} accodati per batch serale, ${s.inRevisione} inviati a revisione umana per ambiguità semantica o bassa confidence, ${s.sospesoAmbiguita} sospesi per divergenza critica famiglia ERP/TecDoc, ${s.copertiTransito} non acquistati in quanto già coperti da merce in transito.`,
              },
              {
                title: 'Anomalie rilevate',
                content: `Il sistema ha identificato le seguenti criticità operative: ${s.topProblemi.join('; ')}. In particolare, si segnala il caso M-AM4412 con divergenza macro-famiglia che ha richiesto blocco e invio a revisione manuale obbligatoria. Il buyer senior ha preso in carico il task TASK-001 con priorità critica.`,
              },
              {
                title: 'Performance motore AI',
                content: `Il ${s.ricercheAlPrimoPrompt}% delle ricerche ha prodotto un risultato valido al primo tentativo, con una media di ${s.mediaTentativiRicerca} tentativi per articolo. Il sistema ha generato automaticamente ${s.taskCreatiAutomaticamente} task operativi, di cui ${s.taskCompletatiOggi} completati nella stessa giornata. Rimangono ${s.taskAperti} task aperti trasferiti alla sessione di domani.`,
              },
              {
                title: 'Note operative e prossimi passi',
                content: `Si raccomanda di dare priorità alla risoluzione del mismatch famiglia su M-AM4412 e alla richiesta listino per Stark E6200-ST. Il task di follow-up sull'ordine M-552143 (spedito ieri) è in carico alla logistica per conferma ricezione. Quattro articoli con listino mancante cronico sono stati segnalati all'ufficio acquisti per richiesta preventivo formale.`,
              },
            ].map(({ title, content }) => (
              <div key={title} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' }}>
                  {title}
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {content}
                </p>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Generato automaticamente da Brera Replenishment v0.1</span>
              <span>{today}</span>
            </div>
          </div>
        )}

        {/* ─── EXPORT VIEW ─── */}
        {view === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
            <div className="alert alert-neutral">
              <Download size={14} style={{ color: 'var(--color-text-muted)', marginTop: 1, flexShrink: 0 }} />
              <div>
                <div className="alert-title">Export simulato</div>
                <div className="alert-desc">In produzione i file vengono generati server-side e inviati via email o salvati su shared drive. In questa demo viene simulato il flusso.</div>
              </div>
            </div>

            {[
              { label: 'Report PDF', desc: 'Report completo con KPI, tabelle e testo narrativo', format: 'PDF' },
              { label: 'Export CSV ordini', desc: 'Lista tutti gli articoli acquistati con fornitore e importo', format: 'CSV' },
              { label: 'Export Task Board', desc: 'Snapshot del board con tutti i task e loro stato', format: 'CSV' },
              { label: 'Export anomalie', desc: 'Soli casi con mismatch, bassa confidence o warning', format: 'CSV' },
            ].map(({ label, desc, format }) => (
              <div key={label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: format === 'PDF' ? 'var(--color-text-primary)' : 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: format === 'PDF' ? '#fff' : 'var(--color-text-muted)',
                }}>
                  {format}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{desc}</div>
                </div>
                <button
                  className={`btn btn-sm${exported === label ? ' btn-primary' : ''}`}
                  onClick={() => handleExport(label)}
                >
                  {exported === label ? (
                    <><CheckCircle size={11} /> Scaricato!</>
                  ) : (
                    <><Download size={11} /> Scarica</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
