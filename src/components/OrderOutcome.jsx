import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Clock, Truck, XCircle, LayoutDashboard } from 'lucide-react'
import { reorderReportRows as mockRows, normalizationsLog, supplierOffers, computeScore } from '../data/mockData'

const outcomes = {
  acquistato: {
    icon: CheckCircle,
    color: 'var(--color-text-primary)',
    bg: 'var(--color-surface-2)',
    label: 'Ordine Demo Creato',
    desc: 'L\'ordine è stato confermato e inviato al fornitore selezionato. Il sistema ha aggiornato automaticamente il task board.',
  },
  revisione: {
    icon: AlertTriangle,
    color: 'var(--color-orange)',
    bg: 'var(--color-orange-light)',
    label: 'Inviato a Revisione',
    desc: 'Il caso è stato inviato a revisione umana. Il buyer dovrà approvare manualmente prima di procedere all\'acquisto.',
  },
  accodato: {
    icon: Clock,
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-2)',
    label: 'Ordine Accodato',
    desc: 'L\'ordine è stato accodato per l\'elaborazione nel prossimo batch.',
  },
  transito: {
    icon: Truck,
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-2)',
    label: 'Copertura Garantita da Transito',
    desc: 'La merce in transito è sufficiente a coprire il fabbisogno. Nessun nuovo acquisto necessario.',
  },
  sospeso: {
    icon: XCircle,
    color: 'var(--color-text-primary)',
    bg: 'var(--color-surface-3)',
    label: 'Caso Sospeso per Ambiguità',
    desc: 'Il sistema ha rilevato ambiguità critica che impedisce qualsiasi raccomandazione automatica. Il caso rimane nel board come "Da elaborare".',
  },
}

export default function OrderOutcome({ rows: rowsProp, orderOutcome }) {
  const location = useLocation()
  const allData = rowsProp ?? mockRows
  const navigate = useNavigate()
  const reqId = location.state?.reqId || 'REQ-001'
  const tipoFromState = location.state?.tipo
  const tipo = tipoFromState || orderOutcome?.[reqId] || 'acquistato'

  const row = allData.find(r => r.id === reqId) || allData[0]
  const norm = normalizationsLog[row.codiceMadre]
  const offers = supplierOffers[row.codiceMadre] || []
  const ranked = [...offers].sort((a, b) => computeScore(b, row) - computeScore(a, row))
  const offer = ranked[0]

  const outcome = outcomes[tipo] || outcomes.acquistato
  const Icon = outcome.icon

  // Other outcomes to simulate
  const allOutcomes = Object.entries(outcomes).filter(([k]) => k !== tipo)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Esito Finale</h1>
          <p className="page-subtitle">{reqId} — {row.codiceMadre} · {row.gruppoMerceologico}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <LayoutDashboard size={13} /> Dashboard
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Main outcome */}
        <div style={{
          padding: '28px 32px',
          background: outcome.bg,
          border: `1px solid ${outcome.color === 'var(--color-orange)' ? 'var(--color-orange-border)' : 'var(--color-border)'}`,
          borderRadius: 14,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={28} color={outcome.color} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{outcome.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{outcome.desc}</div>
          </div>
        </div>

        {/* Summary */}
        {offer && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 12 }}>Dettaglio</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Articolo', value: norm?.codiceNormalizzato || row.codiceMadre },
                { label: 'Fornitore', value: offer.fornitore },
                { label: 'Importo', value: `€${(row.suggerimentoAcquisto * offer.prezzoNetto).toFixed(2)}` },
                { label: 'Lead Time', value: offer.leadTime },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulate other outcomes */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
            Altri stati possibili (demo)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {allOutcomes.map(([k, o]) => {
              const OIcon = o.icon
              return (
                <div
                  key={k}
                  className="card"
                  style={{ padding: '12px 14px', cursor: 'pointer', opacity: 0.65 }}
                  onClick={() => navigate('/esito', { state: { reqId, tipo: k } })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OIcon size={16} color={o.color} />
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{o.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/fabbisogni')}>
            Prossimo fabbisogno
          </button>
          <button className="btn" onClick={() => navigate('/task-board')}>
            Apri Task Board
          </button>
          <button className="btn" onClick={() => navigate('/eod-report')}>
            Report fine giornata
          </button>
        </div>
      </div>
    </div>
  )
}
