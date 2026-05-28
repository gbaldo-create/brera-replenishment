import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, X, CheckCircle, AlertTriangle, ExternalLink, Building2, MapPin, Clock, ShieldAlert, RotateCcw, Info, AlertOctagon, Truck, RefreshCw } from 'lucide-react'
import { normalizationsLog as normLog } from '../data/mockData'
import { reorderReportRows as mockRows, supplierOffers, normalizationsLog, computeScore } from '../data/mockData'

export default function OrderWindow({ rows: rowsProp, onConfirmOrder }) {
  const location = useLocation()
  const allData = rowsProp ?? mockRows
  const navigate = useNavigate()
  const reqId = location.state?.reqId || 'REQ-001'
  const row = allData.find(r => r.id === reqId) || allData[0]
  const offers = supplierOffers[row.codiceMadre] || []
  const ranked = [...offers].sort((a, b) => computeScore(b, row) - computeScore(a, row))
  const offer = ranked[0]
  const norm = normalizationsLog[row.codiceMadre]
  const isMismatch = row._stato === 'mismatch' || (row._conf ?? 100) < 70

  const [qty, setQty] = useState(row.suggerimentoAcquisto)
  const [availChecked, setAvailChecked] = useState(false)
  const [availLoading, setAvailLoading] = useState(false)
  const [availOk, setAvailOk] = useState(null) // null=non verificato, true=ok, false=esaurito

  // MOQ simulato per fornitore (in produzione viene dal catalogo)
  const MOQ_MAP = { 'Rhiag Hub': 1, 'Autodis Italia': 1, 'Brembo Official Shop': 1, 'Marinelli Ricambi': 2, 'Sora Autoricambi': 1 }
  const moq = MOQ_MAP[offer.fornitore] || 1
  const moqViolation = qty < moq

  // Spese trasporto simulate
  const TRASPORTO_MAP = { 'Rhiag Hub': { soglia: 50, costo: 4.5 }, 'Autodis Italia': { soglia: 40, costo: 3.9 }, 'Brembo Official Shop': { soglia: 80, costo: 6.5 }, 'Marinelli Ricambi': { soglia: 35, costo: 3.5 }, 'Sora Autoricambi': { soglia: 60, costo: 5.0 } }
  const trasporto = TRASPORTO_MAP[offer.fornitore] || { soglia: 50, costo: 4.5 }
  const subtotale = qty * parseFloat(offer.prezzoNetto || 0)
  const speseTrasp = subtotale < trasporto.soglia ? trasporto.costo : 0
  const totalConTrasp = (subtotale + speseTrasp).toFixed(2)

  function handleCheckAvail() {
    setAvailLoading(true)
    setTimeout(() => {
      // Simulazione: 90% disponibile, 10% esaurito
      setAvailOk(Math.random() > 0.1)
      setAvailLoading(false)
      setAvailChecked(true)
    }, 900)
  }
  const qtyChanged = qty !== row.suggerimentoAcquisto

  // Contesto ERP: calcola la spiegazione del suggerimento
  const qtyContext = (() => {
    const vendutoMensile = row.nMovimenti ? (row.nMovimenti / 12).toFixed(1) : null
    const mesiCopertura = vendutoMensile && row.suggerimentoAcquisto
      ? (row.suggerimentoAcquisto / parseFloat(vendutoMensile)).toFixed(1)
      : null
    const multiplo = row.multiplo && row.multiplo > 1 ? row.multiplo : null
    return { vendutoMensile, mesiCopertura, multiplo }
  })()
  const [confirmed, setConfirmed] = useState(false)

  if (!offer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="page-header">
          <h1 className="page-title">Finestra Ordine</h1>
        </div>
        <div className="empty-state">
          <AlertTriangle size={28} />
          <span>Nessuna offerta disponibile per questo articolo</span>
        </div>
      </div>
    )
  }

  function handleConfirm(tipo) {
    setConfirmed(true)
    onConfirmOrder && onConfirmOrder(offer.id, reqId, tipo)
    setTimeout(() => navigate('/esito', { state: { reqId, tipo } }), 500)
  }

  const score = computeScore(offer, row)
  const total = totalConTrasp
  const isLocale = offer.sede === 'filiale'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finestra Ordine — {offer.fornitore}</h1>
          <p className="page-subtitle">
            Simulazione apertura portale fornitore · Articolo: {norm?.codiceNormalizzato || row.codiceMadre}
            {row.multiplo > 1 && <span style={{ color: 'var(--color-orange)', marginLeft: 8 }}>· Venduto a ×{row.multiplo} — ordina multipli di {row.multiplo}</span>}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Left: pseudo-browser */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface)' }}>
          {/* Browser chrome */}
          <div style={{ background: 'var(--color-surface-2)', padding: '10px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#f87171','#fbbf24','#4ade80'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ExternalLink size={10} />
              qricambi.com/ordine/{offer.codiceFornitore.toLowerCase().replace(/[^a-z0-9]/g,'-')}
            </div>
          </div>

          {/* Simulated page content */}
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {offer.fornitore} — Portale Ordini
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ width: 100, height: 100, background: 'var(--color-surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                🔧
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{offer.descrizione}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: 8 }}>
                  {offer.codiceFornitore} · {offer.brand}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`badge ${offer.livelloQualitativo === 'Originale' ? 'badge-originale' : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`}>
                    {offer.livelloQualitativo}
                  </span>
                  <span className="badge badge-ok">{offer.disponibilita}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Prezzo Netto', value: `€${offer.prezzoNetto.toFixed(2)}`, highlight: true },
                { label: 'Prezzo Listino', value: offer.prezzoListino ? `€${offer.prezzoListino.toFixed(2)}` : 'N.D.' },
                { label: 'Lead Time', value: offer.leadTime },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: highlight ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: isLocale ? 'var(--color-orange-light)' : 'var(--color-surface-2)', border: `1px solid ${isLocale ? 'var(--color-orange-border)' : 'var(--color-border)'}`, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
              {isLocale ? <MapPin size={14} color="var(--color-orange)" /> : <Building2 size={14} />}
              <span style={{ color: isLocale ? 'var(--color-orange-text)' : 'var(--color-text-secondary)' }}>
                {offer.logistica} — {offer.disponibilita}
              </span>
            </div>

            {offer.noteRischio && (
              <div className="alert alert-orange" style={{ marginBottom: 12 }}>
                <AlertTriangle size={14} className="alert-icon" />
                <div><div className="alert-title">Nota fornitore</div><div className="alert-desc">{offer.noteRischio}</div></div>
              </div>
            )}
          </div>
        </div>

        {/* Right: order form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-primary)' }}>Riepilogo Ordine</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Codice normalizzato</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>{norm?.codiceNormalizzato || row.codiceMadre}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fornitore</span><span style={{ fontWeight: 600 }}>{offer.fornitore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Brand</span><span>{offer.brand}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Score AI</span>
                <span style={{ fontWeight: 700, color: score >= 80 ? 'var(--color-text-primary)' : 'var(--color-orange)' }}>{score}/100</span>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 4 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span>Quantità</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                      <span style={{ fontWeight: 700, fontSize: 16, minWidth: 28, textAlign: 'center', color: qtyChanged ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{qty}</span>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setQty(q => q + 1)}>+</button>
                    </div>
                  </div>
                  {/* ERP context */}
                  <div style={{
                    padding: '7px 10px', borderRadius: 6,
                    background: qtyChanged ? 'var(--color-orange-light)' : 'var(--color-surface-2)',
                    border: `1px solid ${qtyChanged ? 'var(--color-orange-border)' : 'var(--color-border)'}`,
                    fontSize: 11, color: qtyChanged ? 'var(--color-orange-text)' : 'var(--color-text-muted)',
                    lineHeight: 1.5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <Info size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600 }}>ERP suggerisce {row.suggerimentoAcquisto} pz</span>
                        {qtyContext.vendutoMensile && (
                          <span> — venduto medio {qtyContext.vendutoMensile} pz/mese</span>
                        )}
                        {qtyContext.mesiCopertura && (
                          <span> · copertura ~{qtyContext.mesiCopertura} mesi</span>
                        )}
                        {qtyContext.multiplo && (
                          <span> · <strong style={{ color: 'var(--color-orange)' }}>venduto a ×{qtyContext.multiplo}</strong> — {qty} pz ordinati = {Math.floor(qty / qtyContext.multiplo)} vendite coperte</span>
                        )}
                        {row.giacenza > 0 && (
                          <span> · giacenza attuale {row.giacenza} pz</span>
                        )}
                      </div>
                    </div>
                    {qtyChanged && (
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle size={10} />
                        <span>Hai modificato la quantità ERP</span>
                        <button
                          onClick={() => setQty(row.suggerimentoAcquisto)}
                          style={{ marginLeft: 'auto', fontSize: 10, background: 'none', border: 'none', color: 'var(--color-orange-text)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', padding: 0 }}
                        >
                          Ripristina
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Totale</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>€{total}</div>
                    {speseTrasp > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                        imponibile €{subtotale.toFixed(2)} + trsp €{speseTrasp.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Motivazione AI */}
          <div className="alert alert-orange">
            <ShoppingCart size={14} className="alert-icon" />
            <div>
              <div className="alert-title">Motivazione AI</div>
              <div className="alert-desc" style={{ fontSize: 11 }}>
                Selezionato per coerenza con linea {row.lineaProdotto}, {isLocale ? 'disponibile in filiale locale' : 'disponibile in sede centrale'} con lead time {offer.leadTime} e prezzo netto €{offer.prezzoNetto.toFixed(2)}.
              </div>
            </div>
          </div>

          {/* Verifica disponibilità */}
          {!isMismatch && (
            <div style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: availChecked ? 6 : 0 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Disponibilità al momento dell'ordine</span>
                <button
                  className="btn btn-sm"
                  onClick={handleCheckAvail}
                  disabled={availLoading}
                  style={{ fontSize: 10 }}
                >
                  {availLoading
                    ? <><RefreshCw size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifica...</>
                    : <><RefreshCw size={10} /> Verifica</>
                  }
                </button>
              </div>
              {availChecked && (
                availOk
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#15803d', fontWeight: 600 }}><CheckCircle size={12} /> Disponibile — confermato ora</div>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontWeight: 600 }}><AlertOctagon size={12} /> Esaurito — scegli un altro fornitore</div>
              )}
            </div>
          )}

          {/* MOQ warning */}
          {moqViolation && !isMismatch && (
            <div style={{ padding: '10px 12px', borderRadius: 6, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 11, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 2 }}>Quantità minima d'ordine: {moq} pz</div>
                <div style={{ color: '#B45309' }}>Hai selezionato {qty} pz ma il fornitore richiede almeno {moq} pz per articolo.</div>
                <button onClick={() => { const setQ = window._setQtyFn; setQ && setQ(moq) }} style={{ marginTop: 6, fontSize: 10, background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>
                  Porta a {moq} pz
                </button>
              </div>
            </div>
          )}

          {/* Spese trasporto */}
          {speseTrasp > 0 && !isMismatch && (
            <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Truck size={13} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, color: 'var(--color-text-secondary)' }}>
                Spese trasporto <strong style={{ color: 'var(--color-orange)' }}>+€{speseTrasp.toFixed(2)}</strong>
                {' '}— gratuito sopra €{trasporto.soglia}.
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>Mancano €{(trasporto.soglia - subtotale).toFixed(2)} alla soglia.</span>
              </div>
            </div>
          )}

          {/* Mismatch block */}
          {isMismatch && (
            <div style={{
              padding: '12px 14px',
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              borderRadius: 8,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#92400E', marginBottom: 3 }}>
                  Ordine bloccato — Mismatch famiglia
                </div>
                <div style={{ fontSize: 11, color: '#B45309', lineHeight: 1.5 }}>
                  Confidence normalizzazione: <strong>{row._conf ?? '?'}%</strong>.
                  Risolvere in Normalizzazione prima di procedere.
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '12px 0', fontSize: 13, opacity: (isMismatch || availOk === false || moqViolation) ? 0.35 : 1, cursor: (isMismatch || availOk === false || moqViolation) ? 'not-allowed' : 'pointer' }}
            onClick={() => !isMismatch && availOk !== false && !moqViolation && handleConfirm('acquistato')}
            disabled={confirmed || isMismatch || availOk === false || moqViolation}
            title={isMismatch ? 'Risolvi il mismatch famiglia prima di ordinare' : ''}
          >
            {confirmed ? <><CheckCircle size={14} /> Confermato!</> : <><CheckCircle size={14} /> Conferma Ordine Demo</>}
          </button>
          <button
            className="btn"
            style={{ justifyContent: 'center' }}
            onClick={() => handleConfirm('revisione')}
            disabled={confirmed}
          >
            <AlertTriangle size={13} /> Invia a Revisione
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', fontSize: 11 }}
            onClick={() => navigate(-1)}
          >
            ← Torna al Ranking
          </button>
        </div>
      </div>
    </div>
  )
}
