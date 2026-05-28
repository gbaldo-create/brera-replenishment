// Explainability
import { useLocation, useNavigate } from 'react-router-dom'
import { reorderReportRows as mockRows, supplierOffers, normalizationsLog, computeScore } from '../data/mockData'
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react'

export function Explainability({ rows: rowsProp, onOpenOrder }) {
  const location = useLocation()
  const allData = rowsProp ?? mockRows
  const navigate = useNavigate()
  const reqId = location.state?.reqId || 'REQ-001'
  const row = allData.find(r => r.id === reqId) || allData[0]
  const offers = supplierOffers[row.codiceMadre] || []
  const norm = normalizationsLog[row.codiceMadre]
  const ranked = [...offers].sort((a, b) => computeScore(b, row) - computeScore(a, row))
  const best = ranked[0]

  function buildExplanation(offer) {
    const score = computeScore(offer, row)
    const isLineaMatch = offer.livelloQualitativo === row.lineaProdotto
    const isLocale = offer.sede === 'filiale'
    const savingVsFirst = offers.length > 1
      ? `${Math.round((1 - offer.prezzoNetto / Math.max(...offers.map(o => o.prezzoNetto))) * 100)}% vs alternativa più costosa`
      : null

    return {
      score,
      motivi: [
        isLineaMatch
          ? `Coerente con la linea prodotto richiesta (${row.lineaProdotto}).`
          : `Linea prodotto diversa da quella richiesta (${row.lineaProdotto}) — trade-off accettato per disponibilità.`,
        isLocale
          ? `Disponibile in filiale locale con lead time di ${offer.leadTime}.`
          : `Disponibile solo in sede centrale — lead time maggiore (${offer.leadTime}).`,
        offer.disponibilita === 'Immediata'
          ? `Disponibilità immediata confermata.`
          : `Disponibilità non immediata: ${offer.disponibilita}.`,
        savingVsFirst ? `Prezzo netto €${offer.prezzoNetto.toFixed(2)} — risparmio stimato ${savingVsFirst}.` : `Prezzo netto €${offer.prezzoNetto.toFixed(2)}.`,
        offer.noteRischio ? `⚠ Attenzione: ${offer.noteRischio}` : `Nessun rischio semantico rilevato sulla descrizione.`,
      ],
    }
  }

  const needsHuman = row._conf < 70 || row._stato === 'mismatch'
  const exp = best ? buildExplanation(best) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Spiegazione AI — Raccomandazione</h1>
          <p className="page-subtitle">{row.codiceMadre} · {row.gruppoMerceologico} · Confidence: {norm?.confidence || row._conf}%</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ordine', { state: { reqId } })}>
          Vai all'Ordine <ArrowRight size={13} />
        </button>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>

        {needsHuman ? (
          <div className="alert alert-black">
            <AlertTriangle size={16} className="alert-icon" />
            <div>
              <div className="alert-title">Caso inviato a revisione umana</div>
              <div className="alert-desc">
                {row._stato === 'mismatch'
                  ? 'Famiglia ERP e TecDoc divergono in modo critico. Non è possibile raccomandare acquisto automatico. Richiedere verifica manuale del codice articolo.'
                  : `Match confidence basso (${row._conf}%). La descrizione presenta ambiguità rispetto al codice madre. Revisione umana prima di procedere.`}
              </div>
            </div>
          </div>
        ) : exp && (
          <>
            <div className="alert alert-orange">
              <Sparkles size={16} className="alert-icon" />
              <div>
                <div className="alert-title">Raccomandazione AI — {best.fornitore}</div>
                <div className="alert-desc" style={{ marginTop: 4 }}>
                  Score complessivo: <strong>{exp.score}/100</strong> · {best.livelloQualitativo} · €{best.prezzoNetto.toFixed(2)} netto · {best.leadTime}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title"><Sparkles size={14} color="var(--color-orange)" /> Perché questa raccomandazione</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {exp.motivi.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: m.startsWith('⚠') ? 'var(--color-orange-light)' : 'var(--color-surface-2)', border: `1px solid ${m.startsWith('⚠') ? 'var(--color-orange-border)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1, color: m.startsWith('⚠') ? 'var(--color-orange-text)' : 'var(--color-text-muted)' }}>
                      {m.startsWith('⚠') ? '!' : i + 1}
                    </div>
                    <span style={{ color: m.startsWith('⚠') ? 'var(--color-orange-text)' : 'var(--color-text-secondary)' }}>{m.replace('⚠ ', '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {ranked.length > 1 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Perché NON gli altri</span>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ranked.slice(1).map(offer => (
                    <div key={offer.id} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-border-strong)' }} />
                      <span><strong>{offer.fornitore}</strong> — Score {computeScore(offer, row)}/100.{' '}
                        {offer.noteRischio ? offer.noteRischio + '.' : ''}{' '}
                        {offer.sede === 'sede' ? 'Logistica centralizzata.' : ''}{' '}
                        {offer.livelloQualitativo !== row.lineaProdotto ? `Linea ${offer.livelloQualitativo} non coerente con richiesta ${row.lineaProdotto}.` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => best && onOpenOrder && onOpenOrder(best, row)}>
                <CheckCircle size={14} /> Procedi con l'ordine
              </button>
              <button className="btn" onClick={() => navigate('/ordine', { state: { reqId } })}>
                Apri finestra ordine
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
