import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ChevronRight, ChevronLeft, CheckCircle, ShoppingCart,
  MapPin, Building2, Clock, Link2, Zap, SkipForward, RotateCcw,
  ArrowRight, Sparkles, X, Info, Search, ExternalLink, Monitor
} from 'lucide-react'
import { reorderReportRows as mockRows, normalizationsLog, computeScore } from '../data/mockData'
import { searchQRicambi } from '../data/qricambiMock'
import { computeManualScore, detectCaso, CASI_SCOUTING } from '../data/scoutingMemory'
import { getNormFromMemory, getApiKey } from '../data/memoryStore'
import { classifyQuality, isComplementare, recordChoice, getSuggestedOffer, detectPriceAnomaly, suggestOptimalQty, recordPrice, getAIMode, setAIMode, detectDescriptionAnomaly, previewFabbisogno, suggestPrezzoVendita, groupOrdersByFornitore, findSostitutivi, suggestCodiceFiglio } from '../data/aiModules'
import { LoginSimulatorModal } from './Settings'
import { saveOrdine, getFabbisognoReale } from '../data/ordiniStore'
import { useQueue } from '../hooks/useQueue'
import { notificaOrdineConfermato, notificaOrdineRevisione } from '../data/notificheService'
import Tooltip from './Tooltip'
import { useToast } from './ToastNotifications'
import AIAssistant from './AIAssistant'

// ─── Notifica inline ──────────────────────────────────────────────────────────
function InlineNotification({ type, message, onDismiss }) {
  if (!message) return null
  const colors = {
    success: { bg: 'var(--color-text-primary)', color: '#fff', icon: <CheckCircle size={13} /> },
    warning: { bg: 'var(--color-orange)', color: '#fff', icon: <AlertTriangle size={13} /> },
    info:    { bg: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', icon: <Info size={13} /> },
    error:   { bg: '#fee2e2', color: '#991b1b', icon: <X size={13} /> },
  }
  const s = colors[type] || colors.info
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: s.bg, color: s.color, border: s.border || 'none', fontSize: 12, fontWeight: 500, animation: 'slideUp 0.2s ease-out' }}>
      {s.icon}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', padding: 0, display: 'flex' }}>
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Score Gauge — flat ──────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const W = 60, H = 52
  const cx = W / 2, cy = H - 8
  const R = 22

  const color = score >= 70 ? '#F97316' : score >= 50 ? '#ef4444' : '#D1D5DB'

  const toRad = d => d * Math.PI / 180
  const startRad = toRad(220)
  const sx = cx + R * Math.cos(startRad)
  const sy = cy - R * Math.sin(startRad)
  const endRad = toRad(-40)
  const ex = cx + R * Math.cos(endRad)
  const ey = cy - R * Math.sin(endRad)
  const trackD = `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`

  const sweep = (score / 100) * 260
  const filledRad = toRad(220 - sweep)
  const fx = cx + R * Math.cos(filledRad)
  const fy = cy - R * Math.sin(filledRad)
  const largeArc = sweep > 180 ? 1 : 0
  const filledD = `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${fx} ${fy}`

  const needleLen = R - 3
  const nx = cx + needleLen * Math.cos(filledRad)
  const ny = cy - needleLen * Math.sin(filledRad)

  return (
    <div style={{ flexShrink: 0, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={trackD} fill="none" stroke="#E5E7EB" strokeWidth={5} strokeLinecap="round" />
        {score > 0 && (
          <path d={filledD} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
        )}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={2.5} fill={color} />
        <circle cx={cx} cy={cy} r={1} fill="white" />
      </svg>
      <div style={{ fontSize: 10, fontWeight: 800, color, lineHeight: 1, marginTop: -2 }}>
        {score}
      </div>
    </div>
  )
}

// ─── Portale Fornitore Simulato ───────────────────────────────────────────────
function PortaleModal({ offer, row, onClose, onConfirm }) {
  const [qty, setQty] = useState(row?.suggerimentoAcquisto || 1)
  const [confirmed, setConfirmed] = useState(false)
  if (!offer || !row) return null
  const total = (qty * parseFloat(offer.prezzoNetto || 0)).toFixed(2)
  const isLocale = offer.sede === 'filiale'

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => { onConfirm(qty); onClose() }, 800)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Portale Fornitore — {offer.fornitore}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          {/* Browser chrome */}
          <div style={{ background: 'var(--color-surface-2)', padding: '8px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#f87171','#fbbf24','#4ade80'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ExternalLink size={10} />
              qricambi.com/ordine/{(offer.codiceFornitore || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}
            </div>
          </div>

          {/* Contenuto */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 80, background: 'var(--color-surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🔧</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{offer.descrizione}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: 6 }}>{offer.codiceFornitore} · {offer.costruttore}</div>
                <span className={`badge ${offer.livelloQualitativo === 'Originale' ? 'badge-originale' : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`}>{offer.livelloQualitativo}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Prezzo Netto', value: `€${parseFloat(offer.prezzoNetto || 0).toFixed(2)}`, accent: true },
                { label: 'Prezzo Listino', value: offer.prezzoListino ? `€${parseFloat(offer.prezzoListino).toFixed(2)}` : 'N.D.' },
                { label: 'Lead Time', value: offer.leadTime || '—' },
              ].map(({ label, value, accent }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: accent ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: isLocale ? 'var(--color-orange-light)' : 'var(--color-surface-2)', border: `1px solid ${isLocale ? 'var(--color-orange-border)' : 'var(--color-border)'}`, borderRadius: 6, fontSize: 12 }}>
              {isLocale ? <MapPin size={14} color="var(--color-orange)" /> : <Building2 size={14} />}
              <span style={{ color: isLocale ? 'var(--color-orange-text)' : 'var(--color-text-secondary)', fontWeight: 600 }}>
                {offer.logistica || offer.disponibilita}
              </span>
              {offer.consegna && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· Consegna {offer.consegna}</span>}
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Quantità</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span style={{ fontWeight: 800, fontSize: 16, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Totale ordine</span>
                <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-orange)' }}>€{total}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={confirmed}>
            {confirmed ? <><CheckCircle size={13} /> Confermato!</> : <><ShoppingCart size={13} /> Conferma Ordine Demo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Offer Row compatta ───────────────────────────────────────────────────────
function OfferRow({ offer, rank, isSelected, onSelect, row }) {
  const score = computeManualScore(offer, row)
  const isBest = rank === 1
  const isLocale = offer.sede === 'filiale' ||
    (offer.disponibilita || '').toLowerCase().includes('filiale') ||
    (offer.logistica || '').toLowerCase().includes('locale')

  return (
    <div
      onClick={() => onSelect(offer)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderRadius: 8, cursor: 'pointer',
        background: isSelected ? 'var(--color-surface-2)' : 'transparent',
        border: `1px solid ${isSelected ? 'var(--color-orange)' : isBest ? 'var(--color-border-strong)' : 'transparent'}`,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-2)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: isBest ? 'var(--color-orange)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isBest ? '#fff' : 'var(--color-text-muted)' }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{offer.fornitore}</span>
          {isBest && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--color-orange)', color: '#fff' }}>TOP</span>}
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{offer.codiceFornitore}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{offer.costruttore}</span>
          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: isLocale ? 'var(--color-orange-light)' : 'var(--color-surface-3)', color: isLocale ? 'var(--color-orange-text)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {isLocale ? <MapPin size={9} /> : <Building2 size={9} />} {offer.leadTime}
          </span>
          {offer.consegna && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>📅 {offer.consegna}</span>}
        </div>
      </div>
      <ScoreRing score={score} />
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>€{parseFloat(offer.prezzoNetto || 0).toFixed(2)}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {offer.prezzoListino ? `list. €${parseFloat(offer.prezzoListino).toFixed(2)}` : 'listino n.d.'}
        </div>
      </div>
      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-border)'}`, background: isSelected ? 'var(--color-orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
        {isSelected && <CheckCircle size={12} color="#fff" />}
      </div>
    </div>
  )
}

// ─── Main Workstation ─────────────────────────────────────────────────────────
// ─── sessionStorage helpers (Workstation progress) ───────────────────────────
const WS_KEY = 'brera_ws_progress'
function wsGet() {
  try { const v = sessionStorage.getItem(WS_KEY); return v ? JSON.parse(v) : null } catch { return null }
}
function wsSet(data) {
  try { sessionStorage.setItem(WS_KEY, JSON.stringify(data)) } catch {}
}

export default function Workstation({ rows: rowsProp, normOverrides, onOpenOrder, onConfirmOrder }) {
  const navigate = useNavigate()
  const toast = useToast()
  const allData = rowsProp ?? mockRows

  const { active: urgencyQueue } = useQueue(allData)
  // legacy alias kept for compatibility


  const [currentIdx, setCurrentIdx] = useState(() => wsGet()?.currentIdx ?? 0)
  const [searchState, setSearchState] = useState({})
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [customQty, setCustomQty] = useState(null) // null = usa suggerimento ERP
  const [completedIds, setCompletedIds] = useState(() => new Set(wsGet()?.completedIds ?? []))
  const [skippedIds, setSkippedIds] = useState(() => new Set(wsGet()?.skippedIds ?? []))
  const [notification, setNotification] = useState(null)
  const [filterLinea, setFilterLinea] = useState('')
  const [ordenati, setOrdinati] = useState(() => wsGet()?.ordenati ?? {})
  const [showPortale, setShowPortale] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiMode, setAiModeState] = useState(() => getAIMode())
  const [aiInsights, setAiInsights] = useState({}) // { reqId: { suggestion, anomaly, optQty, classifications } }
  const [aiLoading, setAiLoading] = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [showGroupAlert, setShowGroupAlert] = useState(null)
  const [showPrezzoVendita, setShowPrezzoVendita] = useState(null)

  // Persist progress to sessionStorage whenever it changes
  useEffect(() => {
    wsSet({
      currentIdx,
      completedIds: [...completedIds],
      skippedIds: [...skippedIds],
      ordenati,
    })
  }, [currentIdx, completedIds, skippedIds, ordenati])

  function toggleAIMode(mode) {
    setAiModeState(mode)
    setAIMode(mode)
  }

  const currentRow = urgencyQueue[currentIdx]
  const normMemory = currentRow ? getNormFromMemory(currentRow.codiceMadre) : null
  const normMock = currentRow ? normalizationsLog[currentRow.codiceMadre] : null
  const override = normOverrides?.[currentRow?.id]
  const codiceRicerca = override?.codiceNormalizzato || normMemory?.codiceNormalizzato || currentRow?.codiceNormalizzato || normMock?.codiceNormalizzato || currentRow?.codiceMadre
  const caso = currentRow ? detectCaso(currentRow, override || normMemory || normMock) : 'STANDARD'
  const currentSearch = searchState[currentRow?.id]
  const isBlocked = ['MISMATCH', 'TRANSITO', 'DUPLICATO'].includes(caso)
  const isCompleted = completedIds.has(currentRow?.id)
  const isSkipped = skippedIds.has(currentRow?.id)

  function notify(type, message) {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  async function runSearch(row, codice) {
    setSearchState(prev => ({ ...prev, [row.id]: { loading: true, results: [], error: null } }))
    try {
      const res = await searchQRicambi(codice, row)
      const results = res.results || []
      setSearchState(prev => ({ ...prev, [row.id]: { loading: false, results, error: null } }))

      // Run AI analysis if in AI mode
      if (aiMode === 'ai' && results.length > 0) {
        setAiLoading(true)
        try {
          const useAI = !!getApiKey()
          const ranked = [...results].filter(o => !o.isComplementare)
            .sort((a, b) => computeManualScore(b, row) - computeManualScore(a, row))
          const [suggestion, anomaly, optQty] = await Promise.all([
            getSuggestedOffer(ranked, row, useAI),
            Promise.resolve(detectPriceAnomaly(row.codiceMadre, ranked[0]?.fornitore, ranked[0]?.prezzoNetto)),
            suggestOptimalQty(row, ranked[0], useAI),
          ])
          // Record prices for history
          results.forEach(o => recordPrice(row.codiceMadre, o.fornitore, o.prezzoNetto))
          // Module 7: description anomalies for each offer
          const descAnomalies = ranked.slice(0, 3).map(o => detectDescriptionAnomaly(o, row)).filter(Boolean)
          // Module 6: codice figlio
          const codiceFiglio = suggestCodiceFiglio(row.codiceMadre, row.gruppoMerceologico)
          // Module 11: sostitutivi
          const sostitutivi = ranked.length === 0 ? findSostitutivi(row.codiceMadre, row.gruppoMerceologico) : null
          setAiInsights(prev => ({ ...prev, [row.id]: { suggestion, anomaly, optQty, descAnomalies, codiceFiglio, sostitutivi } }))
          // Auto-select suggested offer
          if (suggestion?.offer) setSelectedOffer(suggestion.offer)
        } catch {}
        setAiLoading(false)
      }
    } catch (e) {
      setSearchState(prev => ({ ...prev, [row.id]: { loading: false, results: [], error: e.message } }))
    }
  }

  useEffect(() => {
    if (!currentRow || searchState[currentRow.id] || isBlocked) return
    setSelectedOffer(null)
    setFilterLinea('')
    runSearch(currentRow, codiceRicerca)
  }, [currentRow?.id])

  const rankedOffers = useMemo(() => {
    const raw = (currentSearch?.results || []).filter(o => !o.isComplementare)
    const filtered = filterLinea ? raw.filter(o => o.livelloQualitativo === filterLinea) : raw
    return [...filtered].sort((a, b) => computeManualScore(b, currentRow) - computeManualScore(a, currentRow))
  }, [currentSearch, filterLinea, currentRow])

  const bestOffer = rankedOffers[0]
  useEffect(() => {
    if (bestOffer && !selectedOffer) setSelectedOffer(bestOffer)
  }, [bestOffer?.id])

  function goNext() {
    setSelectedOffer(null)
    setFilterLinea('')
    setShowPortale(false)
    setCurrentIdx(i => Math.min(urgencyQueue.length - 1, i + 1))
  }

  function goPrev() {
    setSelectedOffer(null)
    setFilterLinea('')
    setShowPortale(false)
    setCurrentIdx(i => Math.max(0, i - 1))
  }

  function handleSkip() {
    setSkippedIds(prev => new Set([...prev, currentRow.id]))
    notify('info', `${currentRow.codiceMadre} rimandato`)
    goNext()
  }

  function handleOrder(tipo) {
    if (!selectedOffer && tipo === 'acquistato') return
    setCompletedIds(prev => new Set([...prev, currentRow.id]))
    setOrdinati(prev => ({ ...prev, [currentRow.id]: tipo }))
    onConfirmOrder && onConfirmOrder(selectedOffer?.id, currentRow.id, tipo)
    if (tipo === 'acquistato' && selectedOffer) {
      recordChoice(currentRow, selectedOffer, 0)
      saveOrdine({ row: currentRow, offer: selectedOffer, tipo: 'confermato', qty: customQty || currentRow.suggerimentoAcquisto })
      const newPending = [...pendingOrders, { rowId: currentRow.id, row: currentRow, offer: selectedOffer, tipo }]
      setPendingOrders(newPending)
      // Check group savings
      if (aiMode === 'ai') {
        const groups = groupOrdersByFornitore(newPending, searchState)
        const withSaving = groups.find(g => g.risparmioTrasporto)
        if (withSaving) setShowGroupAlert(withSaving)
      }
    }
    const msgs = {
      acquistato: `Ordine confermato — ${currentRow.codiceMadre}`,
      revisione: `Inviato a revisione — ${currentRow.codiceMadre}`,
      accodato: `Accodato — ${currentRow.codiceMadre}`,
    }
    notify('success', msgs[tipo] || 'Operazione completata')
    if (tipo === 'acquistato') { toast.success('Ordine confermato', `${currentRow.codiceMadre} · €${(parseFloat(selectedOffer?.prezzoNetto || 0) * currentRow.suggerimentoAcquisto).toFixed(2)} · ${selectedOffer?.fornitore}`); notificaOrdineConfermato(currentRow.codiceMadre, selectedOffer?.fornitore, parseFloat(selectedOffer?.prezzoNetto || 0) * currentRow.suggerimentoAcquisto) }
    if (tipo === 'revisione') { toast.warning('Inviato a revisione', `${currentRow.codiceMadre} richiede approvazione manuale`); saveOrdine({ row: currentRow, offer: selectedOffer, tipo: 'revisione', qty: customQty || currentRow.suggerimentoAcquisto }); notificaOrdineRevisione(currentRow.codiceMadre) }
    setTimeout(goNext, 800)
  }

  const completati = completedIds.size
  const saltati = skippedIds.size
  const totaleOrdini = Object.entries(ordenati).filter(([, t]) => t === 'acquistato').reduce((acc, [reqId]) => {
    const row = allData.find(r => r.id === reqId)
    const s = searchState[reqId]
    const offer = s?.results?.find(o => !o.isComplementare)
    return acc + (parseFloat(offer?.prezzoNetto || 0) * (row?.suggerimentoAcquisto || 0))
  }, 0)

  if (urgencyQueue.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <CheckCircle size={48} color="var(--color-orange)" />
        <div style={{ fontSize: 22, fontWeight: 800 }}>Nessuna urgenza da elaborare</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Carica il file Excel per iniziare la sessione</div>
        <button className="btn btn-primary" onClick={() => navigate('/report')}>Vai a Report</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{ width: 200, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Sessione</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Rimasti', value: urgencyQueue.length - completati - saltati, color: 'var(--color-text-primary)' },
              { label: 'Fatti', value: completati, color: 'var(--color-orange)' },
              { label: 'Saltati', value: saltati, color: 'var(--color-text-muted)' },
              { label: 'Totale', value: urgencyQueue.length, color: 'var(--color-text-secondary)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '6px', background: 'var(--color-surface-2)', borderRadius: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
          {totaleOrdini > 0 && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-orange)' }}>€{totaleOrdini.toFixed(2)}</div>
              <div style={{ fontSize: 9, color: 'var(--color-orange-text)', fontWeight: 600 }}>ORDINATO OGGI</div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {urgencyQueue.map((r, i) => {
            const isCur = i === currentIdx
            const isDone = completedIds.has(r.id)
            const isSkip = skippedIds.has(r.id)
            return (
              <div key={r.id} onClick={() => { setCurrentIdx(i); setSelectedOffer(null); setFilterLinea(''); setShowPortale(false); setCustomQty(null) }}
                style={{
                  padding: '9px 12px 8px',
                  borderBottom: '1px solid #ECEEF2',
                  cursor: 'pointer',
                  background: isCur ? '#FFF4EE' : isDone ? '#FAFBFC' : 'transparent',
                  borderLeft: `3px solid ${isCur ? 'var(--color-orange)' : isDone ? '#D1D5DB' : 'transparent'}`,
                  opacity: isSkip ? 0.45 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = '#F8F9FA' }}
                onMouseLeave={e => { e.currentTarget.style.background = isCur ? '#FFF4EE' : isDone ? '#FAFBFC' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <span style={{
                    fontFamily: 'Geist Mono, monospace', fontSize: 11,
                    fontWeight: isCur ? 700 : 600, flex: 1,
                    color: isCur ? 'var(--color-orange)' : isDone ? '#9CA3AF' : 'var(--color-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{r.codiceNormalizzato || r.codiceMadre}</span>
                  {isDone && <CheckCircle size={11} color="#9CA3AF" />}
                  {isSkip && <SkipForward size={10} color="var(--color-text-muted)" />}
                  {searchState[r.id]?.loading && <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--color-orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: '0.02em' }}>{r.gruppoMerceologico}</span>
                  {searchState[r.id]?.results?.length > 0 && !searchState[r.id]?.loading
                    ? <span style={{ fontSize: 9, color: 'var(--color-orange)', fontWeight: 700 }}>{searchState[r.id].results.length} off.</span>
                    : <span className={`badge ${r.urgenza === 'Prioritaria' || r.urgenza === 'Critica' ? 'badge-critica' : 'badge-alta'}`} style={{ fontSize: 7, padding: '1px 5px' }}>{r.urgenza}</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pannello principale ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top nav */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={goPrev} disabled={currentIdx === 0}><ChevronLeft size={16} /></button>

          {/* Progress segmentata */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* Barra segmenti */}
            <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 4, overflow: 'hidden' }}>
              {urgencyQueue.map((r, i) => {
                const isDone = completedIds.has(r.id)
                const isSkip = skippedIds.has(r.id)
                const isCur  = i === currentIdx
                return (
                  <div
                    key={r.id}
                    onClick={() => { setCurrentIdx(i); setSelectedOffer(null) }}
                    title={r.codiceMadre}
                    style={{
                      flex: 1,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'background 0.2s, transform 0.1s',
                      transform: isCur ? 'scaleY(1.4)' : 'scaleY(1)',
                      background: isDone
                        ? 'var(--color-text-primary)'
                        : isSkip
                          ? 'var(--color-surface-3)'
                          : isCur
                            ? 'var(--color-orange)'
                            : 'var(--color-surface-3)',
                      boxShadow: isCur ? '0 0 6px rgba(249,115,22,0.5)' : 'none',
                    }}
                  />
                )
              })}
            </div>
            {/* Info riga */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                {currentIdx + 1}<span style={{ opacity: 0.4 }}>/</span>{urgencyQueue.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {completati > 0 && (
                  <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--color-text-primary)', display: 'inline-block' }} />
                    {completati} fatti
                  </span>
                )}
                {saltati > 0 && (
                  <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-text-muted)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', display: 'inline-block' }} />
                    {saltati} rimandati
                  </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--color-orange)', fontWeight: 700 }}>
                  {urgencyQueue.length - completati - saltati} rimasti
                </span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: completati > 0 ? 'var(--color-orange)' : 'var(--color-text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                {Math.round((completati / urgencyQueue.length) * 100)}%
              </div>
            </div>
          </div>

          <button className="btn btn-sm btn-ghost btn-icon" onClick={goNext} disabled={currentIdx === urgencyQueue.length - 1}><ChevronRight size={16} /></button>
          <div className="divider" />
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/report')}>Report</button>
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/eod-report')}>EOD</button>
          <div className="divider" />
          {/* AI Mode Toggle */}
          <Tooltip text="Modalità Manuale: nessuna AI, decisioni tutte umane. Modalità ✦ AI: 12 moduli attivi, suggerimenti automatici." position="bottom">
          <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface-2)', padding: 3, borderRadius: 6, border: '1px solid var(--color-border)' }}>
            <button onClick={() => toggleAIMode('manual')} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: aiMode === 'manual' ? 'var(--color-surface)' : 'transparent', color: aiMode === 'manual' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: aiMode === 'manual' ? 'var(--shadow-card)' : 'none' }}>
              Manuale
            </button>
            <button onClick={() => toggleAIMode('ai')} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: aiMode === 'ai' ? 'var(--color-orange)' : 'transparent', color: aiMode === 'ai' ? '#fff' : 'var(--color-text-muted)' }}>
              ✦ AI
            </button>
          </div>
          </Tooltip>
          <Tooltip text="Apre il pannello AI: chat contestuale sull'articolo, istruzioni operative generali, storico conversazioni" position="bottom">
          <button
            className={`btn btn-sm ${showAIPanel ? 'btn-primary' : ''}`}
            onClick={() => setShowAIPanel(s => !s)}
            style={{ gap: 5 }}
          >
            <Sparkles size={12} /> {showAIPanel ? 'Chiudi AI' : 'Chiedi AI'}
          </button>
          </Tooltip>
        </div>

        {/* Notifica */}
        {notification && (
          <div style={{ padding: '8px 20px', flexShrink: 0 }}>
            <InlineNotification type={notification.type} message={notification.message} onDismiss={() => setNotification(null)} />
          </div>
        )}

        {currentRow && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: showAIPanel ? '1fr 320px 340px' : '1fr 320px', overflow: 'hidden' }}>

            {/* Colonna sinistra */}
            <div style={{ overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid var(--color-border)' }}>

              {/* Header articolo */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h2 style={{ fontFamily: 'Geist Mono, Geist Mono, monospace', fontSize: 20, fontWeight: 800, margin: 0 }}>{codiceRicerca}</h2>
                    {currentRow.brand && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{currentRow.brand}</span>}
                    <span className={`badge ${currentRow.urgenza === 'Prioritaria' || currentRow.urgenza === 'Critica' ? 'badge-critica' : 'badge-alta'}`}>{currentRow.urgenza}</span>
                    {isCompleted && <span className="badge badge-ok"><CheckCircle size={9} /> {ordenati[currentRow.id] === 'acquistato' ? 'Ordinato' : 'Gestito'}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {currentRow.gruppoMerceologico} · {currentRow.sottogruppo} · {currentRow.lineaProdotto}
                    {currentRow.multiplo > 1 && <span style={{ color: 'var(--color-orange)', marginLeft: 6, fontWeight: 700 }}>× {currentRow.multiplo}</span>}
                  </div>
                </div>
                {(() => {
                  const fb = getFabbisognoReale(currentRow)
                  return (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {/* Giacenza ERP */}
                      <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: fb.giacenzaERP === 0 ? 'var(--color-orange-text)' : 'var(--color-text-primary)' }}>{fb.giacenzaERP}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Giacenza ERP</div>
                      </div>
                      {/* Giacenza reale — evidenziata */}
                      <div style={{ textAlign: 'center', padding: '8px 12px', background: fb.coperto ? 'var(--color-orange-light)' : 'var(--color-surface-2)', border: `2px solid ${fb.coperto ? 'var(--color-orange)' : fb.ordinato > 0 ? 'var(--color-orange-border)' : 'var(--color-border)'}`, borderRadius: 8, minWidth: 80 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: fb.coperto ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{fb.totale}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: fb.coperto ? 'var(--color-orange-text)' : 'var(--color-text-muted)' }}>
                          Giacenza reale
                        </div>
                        {(fb.ordinato > 0 || fb.transito > 0) && (
                          <div style={{ fontSize: 8, color: 'var(--color-orange-text)', marginTop: 2 }}>
                            {fb.giacenzaERP}{fb.transito > 0 ? `+${fb.transito}t` : ''}{fb.ordinato > 0 ? `+${fb.ordinato}o` : ''}
                          </div>
                        )}
                      </div>
                      {/* Fabbisogno reale */}
                      <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: fb.coperto ? 'var(--color-text-muted)' : 'var(--color-orange)' }}>
                          {fb.coperto ? '✓' : fb.fabbisognoReale}
                        </div>
                        <div style={{ fontSize: 9, color: fb.coperto ? 'var(--color-text-muted)' : 'var(--color-orange)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {fb.coperto ? 'Coperto' : 'Da ordinare'}
                        </div>
                        {fb.ridotto && !fb.coperto && (
                          <div style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 2 }}>era {fb.suggerito}</div>
                        )}
                      </div>
                      {/* Movimenti */}
                      <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{currentRow.nMovimenti}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Movimenti</div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Caso rilevato */}
              {caso !== 'STANDARD' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: CASI_SCOUTING[caso]?.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700 }}>{CASI_SCOUTING[caso]?.label}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>— {CASI_SCOUTING[caso]?.desc}</span>
                </div>
              )}

              {isBlocked && (
                <div className="alert alert-black">
                  <AlertTriangle size={14} className="alert-icon" />
                  <div><div className="alert-title">Articolo bloccato</div><div className="alert-desc">{CASI_SCOUTING[caso]?.desc}</div></div>
                </div>
              )}

              {/* AI Insights Panel */}
              {aiMode === 'ai' && !isBlocked && (() => {
                const insights = aiInsights[currentRow?.id]
                if (!insights && !aiLoading) return null
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aiLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11, color: 'var(--color-orange)' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--color-orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                        AI sta analizzando le offerte...
                      </div>
                    )}
                    {insights?.suggestion && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Sparkles size={12} color="var(--color-orange)" />
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            AI suggerisce: {insights.suggestion.offer?.fornitore}
                          </span>
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: insights.suggestion.fonte === 'AI' ? 'var(--color-orange)' : 'var(--color-surface-3)', color: insights.suggestion.fonte === 'AI' ? '#fff' : 'var(--color-text-muted)' }}>
                            {insights.suggestion.fonte === 'AI' ? 'Claude API' : insights.suggestion.fonte === 'preferenza' ? 'da storico' : 'score'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>{insights.suggestion.motivazione}</div>
                      </div>
                    )}
                    {insights?.anomaly && (
                      <div style={{ padding: '10px 14px', background: insights.anomaly.tipo === 'promo' ? 'var(--color-orange-light)' : '#fee2e2', border: `1px solid ${insights.anomaly.tipo === 'promo' ? 'var(--color-orange-border)' : '#fca5a5'}`, borderRadius: 8, fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: insights.anomaly.color }}>
                          {insights.anomaly.tipo === 'promo' ? '🎯 ' : '⚠ '}{insights.anomaly.messaggio}
                        </span>
                      </div>
                    )}
                    {insights?.optQty && insights.optQty.qty !== currentRow?.suggerimentoAcquisto && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}>
                        <span style={{ fontWeight: 700 }}>📦 Qtà ottimale: </span>
                        <span style={{ color: 'var(--color-orange)', fontWeight: 800 }}>{insights.optQty.qty} pz</span>
                        <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>(ERP: {currentRow?.suggerimentoAcquisto})</span>
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>{insights.optQty.motivazione}</div>
                      </div>
                    )}
                    {/* M7: Descrizioni anomale */}
                    {insights?.descAnomalies?.length > 0 && (
                      <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#991b1b' }}>⚠ Descrizione sospetta: </span>
                        <span style={{ color: '#7f1d1d' }}>{insights.descAnomalies[0].messaggio}</span>
                      </div>
                    )}
                    {/* M6: Codice figlio */}
                    {insights?.codiceFiglio && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}>
                        <span style={{ fontWeight: 700 }}>🔍 Codici simili in memoria: </span>
                        {insights.codiceFiglio.suggerimenti.map(s => (
                          <span key={s.codiceMadre} style={{ display: 'inline-block', margin: '2px 4px', padding: '1px 6px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, fontFamily: 'monospace', fontSize: 10 }}>
                            {s.codiceNormalizzato} ({s.brand})
                          </span>
                        ))}
                      </div>
                    )}
                    {/* M11: Sostitutivi */}
                    {insights?.sostitutivi && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-orange-text)' }}>🔄 {insights.sostitutivi.messaggio}</span>
                        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                          {insights.sostitutivi.sostitutivi.map(s => (
                            <span key={s.codiceMadre} style={{ padding: '2px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-orange-border)', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}>
                              {s.codiceNorm} ({s.brand})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Filtri */}
              {!isBlocked && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Linea:</span>
                  {['', 'Originale', 'Primo Equipaggiamento', 'Economico'].map(l => (
                    <button key={l} className={`pill${filterLinea === l ? ' active-orange' : ''}`} style={{ fontSize: 10, padding: '3px 9px' }} onClick={() => setFilterLinea(l)}>
                      {l || 'Tutte'}
                    </button>
                  ))}
                  <button className="btn btn-xs btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => runSearch(currentRow, codiceRicerca)} disabled={currentSearch?.loading}>
                    <RotateCcw size={11} style={{ animation: currentSearch?.loading ? 'spin 0.8s linear infinite' : 'none' }} />
                  </button>
                </div>
              )}

              {/* Offerte */}
              {!isBlocked && (
                currentSearch?.loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-orange)', padding: '4px 0' }}>
                      <Zap size={13} /> Ricerca su QRicambi in corso...
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface-3)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ height: 12, width: '45%', background: 'var(--color-surface-3)', borderRadius: 4 }} />
                          <div style={{ height: 10, width: '60%', background: 'var(--color-surface-2)', borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-surface-3)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <div style={{ height: 18, width: 60, background: 'var(--color-surface-3)', borderRadius: 4 }} />
                          <div style={{ height: 10, width: 50, background: 'var(--color-surface-2)', borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rankedOffers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rankedOffers.map((offer, i) => (
                      <OfferRow key={offer.id} offer={offer} row={currentRow} rank={i + 1} isSelected={selectedOffer?.id === offer.id} onSelect={setSelectedOffer} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Search size={24} />
                    <span style={{ fontSize: 12 }}>Nessuna offerta trovata</span>
                    <button className="btn" onClick={() => setFilterLinea('')}>Rimuovi filtri</button>
                  </div>
                )
              )}
            </div>

            {/* Colonna destra */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--color-surface)' }}>

              {selectedOffer && !isBlocked ? (
                <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--color-border)', flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 14 }}>Offerta selezionata</div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{selectedOffer.fornitore}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{selectedOffer.codiceFornitore}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{selectedOffer.costruttore} · {selectedOffer.livelloQualitativo}</div>
                  </div>

                  <div style={{ padding: '10px 12px', background: selectedOffer.sede === 'filiale' ? 'var(--color-orange-light)' : 'var(--color-surface-2)', border: `1px solid ${selectedOffer.sede === 'filiale' ? 'var(--color-orange-border)' : 'var(--color-border)'}`, borderRadius: 8, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: selectedOffer.sede === 'filiale' ? 'var(--color-orange-text)' : 'var(--color-text-secondary)', marginBottom: 4 }}>
                      {selectedOffer.sede === 'filiale' ? <MapPin size={12} /> : <Building2 size={12} />}
                      {selectedOffer.logistica || selectedOffer.disponibilita}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      ⏱ {selectedOffer.leadTime}{selectedOffer.consegna && ` · 📅 ${selectedOffer.consegna}`}
                    </div>
                  </div>

                  {(() => {
                    const fb = getFabbisognoReale(currentRow)
                    const suggerito = Math.max(1, fb.fabbisognoReale)
                    if (customQty === null) setCustomQty(suggerito)
                    const qty = customQty ?? suggerito
                    const prezzoUnit = parseFloat(selectedOffer.prezzoNetto || 0)
                    const totale = prezzoUnit * qty
                    const isModificata = qty !== suggerito
                    return (
                      <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 14, border: `1px solid ${isModificata ? 'var(--color-orange-border)' : 'var(--color-border)'}`, transition: 'border-color 0.2s' }}>
                        {/* Prezzo unitario */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Prezzo unitario</span>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>€{prezzoUnit.toFixed(2)}</span>
                        </div>
                        {/* ERP suggerimento */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Suggerito ERP</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{suggerito} pz</span>
                        </div>
                        {/* Quantità modificabile */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: isModificata ? 'var(--color-orange-text)' : 'var(--color-text-primary)' }}>
                            Quantità
                            {isModificata && (
                              <button onClick={() => setCustomQty(suggerito)} style={{ marginLeft: 6, fontSize: 9, color: 'var(--color-orange)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                                ripristina
                              </button>
                            )}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${isModificata ? 'var(--color-orange-border)' : 'var(--color-border-strong)'}`, borderRadius: 7, overflow: 'hidden', background: 'var(--color-surface)', transition: 'border-color 0.15s' }}>
                            <button
                              onClick={() => setCustomQty(q => Math.max(1, (q ?? suggerito) - 1))}
                              disabled={qty <= 1}
                              style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: qty <= 1 ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 300, color: qty <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)', borderRight: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={e => { if (qty > 1) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >−</button>
                            <input
                              type="number" min={1}
                              value={qty}
                              onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ width: 44, height: 28, border: 'none', textAlign: 'center', fontSize: 13, fontWeight: 800, fontFamily: 'Geist Mono, monospace', background: 'transparent', color: isModificata ? 'var(--color-orange)' : 'var(--color-text-primary)', outline: 'none' }}
                            />
                            <button
                              onClick={() => setCustomQty(q => (q ?? suggerito) + 1)}
                              style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 300, color: 'var(--color-text-primary)', borderLeft: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >+</button>
                          </div>
                        </div>
                        {fb.ordinato > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--color-orange-text)', padding: '4px 8px', background: 'var(--color-orange-light)', borderRadius: 4, marginBottom: 8 }}>
                            ⚠ {fb.ordinato} pz già ordinati nel registro
                          </div>
                        )}
                        {/* Totale */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>Totale</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-orange)', fontFamily: 'Geist Mono, monospace', transition: 'all 0.15s' }}>€{totale.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}

                  <div style={{ padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', gap: 8 }}>
                    <Sparkles size={13} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Score {computeManualScore(selectedOffer, currentRow)}/100 — {selectedOffer.sede === 'filiale' ? 'filiale locale' : 'sede centrale'}, {selectedOffer.leadTime}, {selectedOffer.livelloQualitativo === currentRow.lineaProdotto ? 'linea coerente' : `linea ${selectedOffer.livelloQualitativo}`}.</span>
                  </div>
                  {/* M9: Prezzo vendita suggerito */}
                  {aiMode === 'ai' && (() => {
                    const pv = suggestPrezzoVendita(selectedOffer.prezzoNetto, selectedOffer.livelloQualitativo, currentRow?.gruppoMerceologico)
                    return (
                      <div style={{ padding: '10px 12px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-orange-text)', marginBottom: 4 }}>💰 Prezzo vendita suggerito</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Range: €{pv.range.min} – €{pv.range.max}</span>
                          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-orange)' }}>€{pv.prezzoSuggerito}</span>
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>{pv.motivazione}</div>
                      </div>
                    )
                  })()}
                </div>
              ) : !isBlocked ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                  {currentSearch?.loading ? 'Caricamento offerte...' : 'Seleziona un\'offerta dalla lista'}
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}

              {/* Azioni */}
              <div style={{ padding: '16px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                {isCompleted ? (
                  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
                    <CheckCircle size={20} color="var(--color-orange)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{ordenati[currentRow.id] === 'acquistato' ? 'Ordine confermato' : 'Gestito'}</div>
                    <button className="btn btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={goNext}>Prossimo <ChevronRight size={12} /></button>
                  </div>
                ) : isBlocked ? (
                  <>
                    <button className="btn" style={{ justifyContent: 'center' }} onClick={() => handleOrder('revisione')}><AlertTriangle size={13} /> Invia a revisione</button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleSkip}><SkipForward size={13} /> Salta</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '10px', fontSize: 13, opacity: !selectedOffer ? 0.5 : 1 }} disabled={!selectedOffer} onClick={() => handleOrder('acquistato')}>
                      <ShoppingCart size={14} /> Conferma ordine
                    </button>
                    <button className="btn" style={{ justifyContent: 'center', opacity: !selectedOffer ? 0.5 : 1 }} disabled={!selectedOffer} onClick={() => setShowPortale(true)}>
                      <Monitor size={13} /> Apri portale fornitore
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button className="btn btn-sm" style={{ justifyContent: 'center' }} onClick={() => handleOrder('revisione')}><AlertTriangle size={11} /> Revisione</button>
                      <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'center' }} onClick={handleSkip}><SkipForward size={11} /> Salta</button>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'center', fontSize: 10 }} onClick={() => navigate('/scouting', { state: { reqId: currentRow.id } })}>
                      Scouting completo <ArrowRight size={10} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* AI Assistant Panel */}
            {showAIPanel && (
              <AIAssistant
                row={currentRow}
                offers={(searchState[currentRow?.id]?.results || []).filter(o => !o.isComplementare)}
                normData={normalizationsLog[currentRow?.codiceMadre]}
                onClose={() => setShowAIPanel(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* M10: Alert raggruppamento ordini */}
      {showGroupAlert && (
        <div className="modal-overlay" onClick={() => setShowGroupAlert(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700 }}>💡 Risparmio trasporto rilevato</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowGroupAlert(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {showGroupAlert.risparmioTrasporto?.messaggio}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-orange-light)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: 'var(--color-orange-text)' }}>
                Risparmio stimato: €{showGroupAlert.risparmioTrasporto?.saving?.toFixed(2)} sulle spese di trasporto
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
                Articoli: {showGroupAlert.articoli?.map(a => a.offer?.codiceFornitore).join(', ')}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowGroupAlert(null)}>Ho capito</button>
            </div>
          </div>
        </div>
      )}

      {/* Portale fornitore con login simulato */}
      {showPortale && selectedOffer && currentRow && (
        <LoginSimulatorModal
          fornitore={{ nome: selectedOffer.fornitore, url: 'https://www.' + selectedOffer.fornitore.toLowerCase().replace(/[^a-z]/g,'') + '.it', username: 'brera@brera.it' }}
          offer={selectedOffer}
          onClose={() => setShowPortale(false)}
          onConfirm={(q) => { if (q) setCustomQty(q); handleOrder('acquistato') }}
        />
      )}
    </div>
  )
}
