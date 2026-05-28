import { useState } from 'react'
import { Zap, Search, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { reorderReportRows, promptSearchStrategies } from '../data/mockData'

export default function PromptOptimizer() {
  const [selectedCode, setSelectedCode] = useState('M-103316')
  const [copied, setCopied] = useState(null)
  const [launched, setLaunched] = useState(null)

  const specials = reorderReportRows.slice(0, 9)
  const strategy = promptSearchStrategies[selectedCode]

  function copy(text, idx) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(idx)
    setTimeout(() => setCopied(null), 1500)
  }

  function launch(query, idx) {
    setLaunched(idx)
    setTimeout(() => setLaunched(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Prompt Search Optimizer</h1>
          <p className="page-subtitle">Strategia di ricerca AI per codici sporchi, compressi o con prefissi brand</p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 220, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>
            Casi speciali
          </div>
          {specials.map(r => {
            const hasStrategy = !!promptSearchStrategies[r.codiceMadre]
            const isSel = selectedCode === r.codiceMadre
            return (
              <div
                key={r.id}
                style={{
                  padding: '9px 14px', borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  background: isSel ? 'var(--color-surface-2)' : 'transparent',
                  borderLeft: isSel ? '2px solid var(--color-orange)' : '2px solid transparent',
                  opacity: hasStrategy ? 1 : 0.5,
                }}
                onClick={() => hasStrategy && setSelectedCode(r.codiceMadre)}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{r.codiceMadre}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.id}</div>
                {!hasStrategy && <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>Strategia standard</div>}
              </div>
            )
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {strategy ? (
            <>
              {/* Input */}
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Input originale
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{strategy.inputOriginale}</span>
                  <span className="badge badge-warn"><AlertTriangle size={9} /> Da ottimizzare</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>{strategy.motivazione}</div>
              </div>

              {/* Variants */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                  Varianti generate
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {strategy.varianti.map((v, i) => (
                    <div key={i} className="prompt-row">
                      <span className="prompt-type">{v.tipo}</span>
                      <span className="prompt-value">{v.query}</span>
                      <span className={`prompt-aff ${v.livello}`}>{v.affidabilita}</span>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        onClick={() => copy(v.query, i)}
                        title="Copia query"
                      >
                        {copied === i ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        className={`btn btn-sm ${launched === i ? 'btn-primary' : ''}`}
                        onClick={() => launch(v.query, i)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {launched === i ? (
                          <><CheckCircle size={11} /> Ricerca avviata</>
                        ) : (
                          <><Search size={11} /> Cerca</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy note */}
              <div className="alert alert-orange">
                <Zap size={14} className="alert-icon" />
                <div>
                  <div className="alert-title">Strategia consigliata</div>
                  <div className="alert-desc">
                    Prima: query precisa → poi: per brand → infine: semantica per famiglia. Le query con bassa affidabilità generano falsi positivi e vanno usate solo come fallback.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <span>Seleziona un caso con strategia speciale dalla lista</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
