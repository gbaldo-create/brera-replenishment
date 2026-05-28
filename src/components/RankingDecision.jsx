import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Star, SlidersHorizontal, RotateCcw, Save, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { reorderReportRows as mockRows, supplierOffers, normalizationsLog } from '../data/mockData'
import { getWeights, saveWeights, resetWeights, getTotalWeight, computeScoreWithWeights } from '../data/rankingConfig'

// ─── Score Pill ───────────────────────────────────────────────────────────────
function ScorePill({ label, score, max = 100 }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 70 }}>
      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-text-primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{score}</span>
      </div>
    </div>
  )
}

// ─── Rank Card ────────────────────────────────────────────────────────────────
function RankCard({ offer, row, rank, category, weights }) {
  const score = computeScoreWithWeights(offer, row, normalizationsLog, weights)
  const norm = normalizationsLog[row.codiceMadre]
  const familyOk = norm ? !norm.famigliaTecDoc?.includes('CONFLITTO') : true
  const isLocale = offer.sede === 'filiale'

  const breakdown = {
    'Famiglia':    familyOk ? weights.famiglia.value : Math.round(weights.famiglia.value * 0.15),
    'Linea':       offer.livelloQualitativo === row.lineaProdotto ? weights.linea.value : Math.round(weights.linea.value * 0.5),
    'Disponib.':   offer.disponibilita === 'Immediata' ? weights.disponibilita.value : Math.round(weights.disponibilita.value * 0.6),
    'Prezzo':      offer.prezzoNetto < 30 ? weights.prezzo.value : Math.round(weights.prezzo.value * 0.45),
    'Brand':       Math.round((offer.scoreAffidabilita / 100) * weights.brand.value),
  }

  const catColors = {
    Originale:              { bg: 'var(--color-text-primary)', color: '#fff' },
    'Primo Equipaggiamento':{ bg: 'var(--color-orange)', color: '#fff' },
    Economico:              { bg: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
  }
  const catStyle = catColors[category] || catColors.Economico

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${rank === 1 ? 'var(--color-orange)' : 'var(--color-border)'}`,
      borderRadius: 10, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ ...catStyle, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{category}</span>
            {rank === 1 && <span style={{ fontSize: 9, color: 'var(--color-orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Star size={9} fill="var(--color-orange)" /> Top pick</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{offer.fornitore}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{offer.codiceFornitore}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{offer.brand} — {offer.descrizione}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>€{offer.prezzoNetto.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {offer.prezzoListino ? `List. €${offer.prezzoListino.toFixed(2)}` : 'Listino n.d.'}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: score >= 70 ? 'var(--color-text-primary)' : 'var(--color-orange)', marginTop: 8, transition: 'color 0.2s' }}>
            {score}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
        {Object.entries(breakdown).map(([k, v]) => (
          <ScorePill key={k} label={k} score={v} max={Math.max(...Object.values(breakdown), 1)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: isLocale ? 'var(--color-orange-light)' : 'var(--color-surface-2)', color: isLocale ? 'var(--color-orange-text)' : 'var(--color-text-muted)', border: `1px solid ${isLocale ? 'var(--color-orange-border)' : 'var(--color-border)'}` }}>
          {offer.logistica}
        </span>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
          ⏱ {offer.leadTime}
        </span>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: offer.disponibilita === 'Immediata' ? 'var(--color-orange-light)' : 'var(--color-surface-2)', color: offer.disponibilita === 'Immediata' ? 'var(--color-orange-text)' : 'var(--color-text-muted)', border: '1px solid var(--color-orange-border)' }}>
          {offer.disponibilita}
        </span>
      </div>
    </div>
  )
}

// ─── Weights Editor Panel ─────────────────────────────────────────────────────
function WeightsPanel({ weights, onChange, onSave, onReset, hasUnsaved }) {
  const total = getTotalWeight(weights)
  const isOver  = total > 100
  const isUnder = total < 100
  const isOk    = total === 100

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={15} color="var(--color-orange)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Pesi Algoritmo</span>
          {hasUnsaved && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--color-orange-light)', color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)', fontWeight: 600 }}>
              Non salvato
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={11} /> Reset
          </button>
          <button
            className={`btn btn-sm ${isOk ? 'btn-primary' : ''}`}
            onClick={onSave}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Save size={11} /> Salva
          </button>
        </div>
      </div>

      {/* Totale */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
      }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: '100%',
            background: '#22c55e',
            transition: 'width 0.3s ease, background 0.2s',
          }} />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 800, fontFamily: 'Geist Mono, monospace',
          color: isOk ? '#15803d' : isOver ? '#dc2626' : 'var(--color-orange-text)',
          minWidth: 40, textAlign: 'right',
        }}>
          {total}/100
        </span>
        {!isOk && (
          <span style={{ fontSize: 11, color: isOver ? '#dc2626' : 'var(--color-orange-text)', fontWeight: 600 }}>
            {isOver ? `−${total - 100} da togliere` : `+${100 - total} da aggiungere`}
          </span>
        )}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(weights).map(([key, w]) => (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{w.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={0} max={100}
                  value={w.value}
                  onChange={e => onChange(key, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  style={{
                    width: 46, textAlign: 'center', fontSize: 12, fontWeight: 700,
                    fontFamily: 'Geist Mono, monospace',
                    border: '1px solid var(--color-border)', borderRadius: 5,
                    padding: '2px 4px', background: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)', outline: 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', width: 12 }}>%</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={0} max={60}
                value={w.value}
                onChange={e => onChange(key, parseInt(e.target.value))}
                style={{
                  flex: 1, height: 4, accentColor: 'var(--color-orange)',
                  cursor: 'pointer',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.4 }}>
              {w.description}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: 'var(--color-surface-2)', borderRadius: 7, alignItems: 'flex-start' }}>
        <Info size={12} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          I pesi devono sommare a 100. Il ranking si aggiorna in tempo reale mentre modifichi i valori. Salva per persistere le impostazioni tra le sessioni.
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RankingDecision({ rows: rowsProp, onOpenOrder }) {
  const location  = useLocation()
  const allData   = rowsProp ?? mockRows
  const navigate  = useNavigate()
  const reqId     = location.state?.reqId || 'REQ-001'
  const row       = allData.find(r => r.id === reqId) || allData[0]
  const offers    = supplierOffers[row.codiceMadre] || []
  const norm      = normalizationsLog[row.codiceMadre]

  const [weights, setWeights]       = useState(() => getWeights())
  const [savedWeights, setSavedWeights] = useState(() => getWeights())
  const [showPanel, setShowPanel]   = useState(false)

  const hasUnsaved = JSON.stringify(weights) !== JSON.stringify(savedWeights)

  function handleChange(key, val) {
    setWeights(prev => {
      const clamped = Math.max(0, Math.min(100, val))
      const others = Object.keys(prev).filter(k => k !== key)
      const oldTotal = others.reduce((s, k) => s + prev[k].value, 0)
      const remaining = 100 - clamped

      let newWeights = { ...prev, [key]: { ...prev[key], value: clamped } }

      if (oldTotal === 0) {
        // distribute equally
        const each = Math.floor(remaining / others.length)
        let leftover = remaining - each * others.length
        others.forEach(k => {
          newWeights[k] = { ...prev[k], value: each + (leftover-- > 0 ? 1 : 0) }
        })
      } else {
        // distribute proportionally
        let distributed = 0
        others.forEach((k, i) => {
          if (i === others.length - 1) {
            newWeights[k] = { ...prev[k], value: remaining - distributed }
          } else {
            const share = Math.round((prev[k].value / oldTotal) * remaining)
            const capped = Math.max(0, share)
            newWeights[k] = { ...prev[k], value: capped }
            distributed += capped
          }
        })
      }
      return newWeights
    })
  }

  function handleSave() {
    saveWeights(weights)
    setSavedWeights({ ...weights })
  }

  function handleReset() {
    const def = resetWeights()
    setWeights(def)
    setSavedWeights(def)
  }

  const ranked = useMemo(() =>
    [...offers].sort((a, b) =>
      computeScoreWithWeights(b, row, normalizationsLog, weights) -
      computeScoreWithWeights(a, row, normalizationsLog, weights)
    ),
    [offers, row, weights]
  )

  const originale = ranked.find(o => o.livelloQualitativo === 'Originale')
  const qp        = ranked.find(o => o.livelloQualitativo === 'Primo Equipaggiamento')
  const eco       = ranked.find(o => o.livelloQualitativo === 'Economico')
  const categories = [
    { cat: 'Originale', offer: originale },
    { cat: 'Primo Equipaggiamento', offer: qp },
    { cat: 'Economico', offer: eco },
  ].filter(c => c.offer)

  const total = getTotalWeight(weights)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ranking Decisionale</h1>
          <p className="page-subtitle">
            {row.codiceMadre} ({norm?.codiceNormalizzato || row.codiceMadre}) · {row.gruppoMerceologico} · Linea richiesta: {row.lineaProdotto}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${showPanel ? 'btn-primary' : ''}`}
            onClick={() => setShowPanel(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={13} />
            Pesi
            {hasUnsaved && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)', flexShrink: 0 }} />}
            {showPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/explainability', { state: { reqId } })}>
            Spiegazione AI <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>

        {/* Weights Panel */}
        {showPanel && (
          <WeightsPanel
            weights={weights}
            onChange={handleChange}
            onSave={handleSave}
            onReset={handleReset}
            hasUnsaved={hasUnsaved}
          />
        )}

        {/* Algorithm summary */}
        <div style={{
          padding: '10px 14px', background: 'var(--color-surface-2)',
          borderRadius: 8, border: '1px solid var(--color-border)',
          fontSize: 11, color: 'var(--color-text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>Pesi attivi — </strong>
            {Object.values(weights).map(w => `${w.label.split('/')[0].trim()} ${w.value}%`).join(' · ')}
          </div>
          {total !== 100 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
              ⚠ Totale: {total}/100
            </span>
          )}
        </div>

        {/* Category cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {categories.map(({ cat, offer }, i) => (
            <RankCard key={cat} offer={offer} row={row} rank={i + 1} category={cat} weights={weights} />
          ))}
        </div>

        {/* Full ranked table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tutte le offerte — ordinate per score</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {hasUnsaved ? '⚡ Score calcolato con pesi non salvati' : 'Score basato sui pesi salvati'}
            </span>
          </div>
          <div style={{ overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fornitore</th>
                  <th>Livello</th>
                  <th>Prezzo Netto</th>
                  <th>Disponibilità</th>
                  <th>Lead Time</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((offer, i) => {
                  const score = computeScoreWithWeights(offer, row, normalizationsLog, weights)
                  return (
                    <tr key={offer.id} className={i === 0 ? 'row-critical' : ''}>
                      <td><div className="cell" style={{ fontWeight: 800, fontSize: 14, color: i === 0 ? 'var(--color-orange)' : 'var(--color-text-muted)' }}>{i + 1}</div></td>
                      <td><div className="cell">
                        <strong>{offer.fornitore}</strong><br />
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{offer.codiceFornitore}</span>
                      </div></td>
                      <td><div className="cell">
                        <span className={`badge ${offer.livelloQualitativo === 'Originale' ? 'badge-originale' : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`}>
                          {offer.livelloQualitativo}
                        </span>
                      </div></td>
                      <td><div className="cell" style={{ fontWeight: 700, fontSize: 14 }}>€{offer.prezzoNetto.toFixed(2)}</div></td>
                      <td><div className="cell" style={{ fontSize: 11, color: offer.disponibilita === 'Immediata' ? 'var(--color-orange)' : 'var(--color-text-secondary)', fontWeight: 600 }}>{offer.disponibilita}</div></td>
                      <td><div className="cell" style={{ fontSize: 11 }}>{offer.leadTime}</div></td>
                      <td><div className="cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 4, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: '100%', background: i === 0 ? 'var(--color-orange)' : 'var(--color-text-primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 24 }}>{score}</span>
                        </div>
                      </div></td>
                      <td><div className="cell">
                        <button className={`btn btn-sm ${i === 0 ? 'btn-primary' : ''}`} onClick={() => onOpenOrder && onOpenOrder(offer, row)}>
                          Ordina
                        </button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
