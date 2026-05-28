import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Building2, Clock, Link2, AlertTriangle, ArrowRight,
  ShoppingCart, ExternalLink, RefreshCw, CheckCircle, X, Zap, Info, ShieldAlert, Copy, ClipboardCheck, PackageCheck,
  Lightbulb, ChevronRight, RotateCcw, AlertOctagon
} from 'lucide-react'
import { reorderReportRows as mockRows, supplierOffers, normalizationsLog, computeScore } from '../data/mockData'
import { getOrdini } from '../data/ordiniStore'
import { useQueue } from '../hooks/useQueue'
import { searchQRicambi } from '../data/qricambiMock'
import { buildQRicambiUrl, computeManualScore, detectCaso, CASI_SCOUTING } from '../data/scoutingMemory'
import { findSostitutivi, suggestCodiceFiglio } from '../data/aiModules'
import { normalizzaCodice } from '../data/normalization'
import { getNormFromMemory } from '../data/memoryStore'

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 80 ? 'var(--color-text-primary)' : score >= 60 ? 'var(--color-orange)' : 'var(--color-orange-text)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 4, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

// ─── Caso Badge ───────────────────────────────────────────────────────────────
function CasoBadge({ caso }) {
  const info = CASI_SCOUTING[caso] || CASI_SCOUTING.STANDARD
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
      <span style={{ fontWeight: 700 }}>{info.label}</span>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>— {info.desc}</span>
    </div>
  )
}

// ─── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, row, rank, isSelected, onSelect, onOrder }) {
  const score = computeManualScore(offer, row)
  const isBest = rank === 1
  const isLocale = offer.sede === 'filiale'
  const isComplementare = offer.isComplementare

  return (
    <div
      onClick={() => !isComplementare && onSelect(offer.id)}
      style={{
        background: isComplementare ? 'var(--color-surface-2)' : 'var(--color-surface)',
        border: `${isBest && !isComplementare ? 2 : 1}px solid ${
          isComplementare ? 'var(--color-border)' :
          isSelected ? 'var(--color-orange)' :
          isBest ? 'var(--color-orange)' : 'var(--color-border)'
        }`,
        borderRadius: 10, padding: '12px 14px',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto',
        gap: 12, alignItems: 'start',
        cursor: isComplementare ? 'default' : 'pointer',
        opacity: isComplementare ? 0.5 : 1,
        transition: 'border-color 0.14s',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isComplementare ? 'var(--color-surface-3)' : rank === 1 ? 'var(--color-orange)' : 'var(--color-surface-3)',
        border: `1px solid ${rank === 1 && !isComplementare ? 'var(--color-orange)' : 'var(--color-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800,
        color: rank === 1 && !isComplementare ? '#fff' : 'var(--color-text-muted)',
      }}>
        {isComplementare ? <X size={12} /> : rank}
      </div>

      {/* Details */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{offer.fornitore}</span>
          {isBest && !isComplementare && <span className="badge badge-pe" style={{ fontSize: 9 }}>✓ Consigliato</span>}
          {isComplementare && <span className="badge badge-mismatch" style={{ fontSize: 9 }}>COMPLEMENTARE</span>}
          <span className={`badge ${offer.livelloQualitativo === 'Originale' ? 'badge-originale' : offer.livelloQualitativo === 'Primo Equipaggiamento' ? 'badge-pe' : 'badge-economico'}`} style={{ fontSize: 9 }}>
            {offer.livelloQualitativo}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>{offer.codiceFornitore}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          {offer.descrizione} · <strong>{offer.costruttore}</strong>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
          {(() => {
            const now = new Date()
            const ore = now.getHours()
            const isWeekend = now.getDay() === 0 || now.getDay() === 6
            const cutoffFiliale = 17  // ore 17:00
            const cutoffSede = 14     // ore 14:00
            const lateFiliale = isLocale && ore >= cutoffFiliale
            const lateSede = !isLocale && ore >= cutoffSede
            const isLate = lateFiliale || lateSede
            return (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: isLocale ? 'var(--color-orange-light)' : 'var(--color-surface-3)', color: isLocale ? 'var(--color-orange-text)' : 'var(--color-text-muted)', border: `1px solid ${isLocale ? 'var(--color-orange-border)' : 'var(--color-border)'}` }}>
                  {isLocale ? <MapPin size={9} /> : <Building2 size={9} />} {offer.disponibilita}
                </span>
                {(isLate || isWeekend) && (
                  <span title={isWeekend ? 'Ordine nel weekend — consegna lunedì' : `Ordine dopo le ${isLocale ? cutoffFiliale : cutoffSede}:00 — consegna domani`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D', cursor: 'help', fontWeight: 700 }}>
                    <Clock size={9} /> {isWeekend ? 'Weekend' : 'Tardi'}
                  </span>
                )}
              </>
            )
          })()}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <Clock size={9} /> {offer.leadTime}
          </span>
          {offer.consegna && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              📅 {offer.consegna}
            </span>
          )}
          {offer.fratelliArticolo && offer.fratelliArticolo !== 'Nessuno' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              <Link2 size={9} /> {offer.fratelliArticolo}
            </span>
          )}
        </div>
        {isComplementare && (
          <div style={{ fontSize: 10, color: 'var(--color-orange-text)' }}>⚠ Articolo complementare — escluso automaticamente dal ranking</div>
        )}
        {!isComplementare && <ScoreBar score={score} />}
      </div>

      {/* Price + CTA */}
      {!isComplementare && (
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 110 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>€{parseFloat(offer.prezzoNetto || 0).toFixed(2)}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>
            {offer.prezzoListino != null
              ? `List. €${parseFloat(offer.prezzoListino).toFixed(2)}`
              : (() => {
                  // Stima margine tipico per linea qualitativa
                  const margini = { 'Originale': [20,35], 'Primo Equipaggiamento': [35,55], 'Economico': [50,80], 'Qualità/Prezzo': [35,55] }
                  const [low, high] = margini[offer.livelloQualitativo] || [30, 50]
                  const netto = parseFloat(offer.prezzoNetto || 0)
                  const stimaMin = (netto * (1 + low/100)).toFixed(2)
                  const stimaMax = (netto * (1 + high/100)).toFixed(2)
                  return (
                    <span title="Listino non pubblicato — stima basata sui margini tipici per linea qualitativa" style={{ cursor: 'help' }}>
                      Listino n.d. · vend. ~€{stimaMin}–{stimaMax}
                    </span>
                  )
                })()
            }
          </div>
          <button
            className={`btn btn-sm ${isSelected ? 'btn-primary' : ''}`}
            style={{ width: '100%' }}
            onClick={e => { e.stopPropagation(); onOrder(offer, row) }}
          >
            <ShoppingCart size={11} /> {isSelected ? 'Ordina' : 'Seleziona'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-3)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, width: `${30 + Math.random() * 40}%`, background: 'var(--color-surface-3)', borderRadius: 4 }} />
            <div style={{ height: 10, width: `${50 + Math.random() * 30}%`, background: 'var(--color-surface-2)', borderRadius: 4 }} />
            <div style={{ height: 10, width: `${40 + Math.random() * 20}%`, background: 'var(--color-surface-2)', borderRadius: 4 }} />
          </div>
          <div style={{ width: 80, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ height: 20, width: 60, background: 'var(--color-surface-3)', borderRadius: 4 }} />
            <div style={{ height: 28, width: 80, background: 'var(--color-surface-2)', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}


// ─── No Results Fallback ──────────────────────────────────────────────────────
function NoResultsFallback({ row, codiceRicerca, onRetryWithCode, onOpenQRicambi }) {
  const norm = normalizationsLog[row?.codiceMadre]

  // Strategia 1: varianti del codice
  const varianti = (() => {
    const base = codiceRicerca || row?.codiceMadre || ''
    const v = []
    // Strip trattini
    const noTreatini = base.replace(/-/g, '')
    if (noTreatini !== base) v.push({ label: 'Senza trattini', codice: noTreatini, motivo: 'I trattini commerciali causano mancati match su QRicambi' })
    // Strip prefisso brand 3 lettere
    if (/^[A-Z]{3}/.test(base)) {
      const stripped = base.slice(3)
      v.push({ label: 'Senza prefisso brand', codice: stripped, motivo: `Rimosso prefisso distributore "${base.slice(0,3)}"` })
    }
    // Solo cifre
    const soloNum = base.replace(/[^0-9]/g, '')
    if (soloNum && soloNum !== base && soloNum.length >= 4) v.push({ label: 'Solo cifre', codice: soloNum, motivo: 'Alcuni portali indicizzano solo la parte numerica' })
    // Codice madre originale se diverso
    if (row?.codiceMadre && row.codiceMadre !== base) v.push({ label: 'Codice madre originale', codice: row.codiceMadre, motivo: 'Prova con il codice non normalizzato' })
    return v.slice(0, 3)
  })()

  // Strategia 2: sostitutivi da memoria
  const sostitutivi = row ? findSostitutivi(row.codiceMadre, row.gruppoMerceologico) : { sostitutivi: [] }

  // Strategia 3: codici figlio da memoria
  const figli = row ? suggestCodiceFiglio(row.codiceMadre, row.gruppoMerceologico) : { suggerimenti: [] }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 10,
        background: '#FFFBEB', border: '1px solid #FDE68A',
      }}>
        <AlertOctagon size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 3 }}>
            Nessuna offerta trovata per <span style={{ fontFamily: 'monospace' }}>{codiceRicerca}</span>
          </div>
          <div style={{ fontSize: 12, color: '#B45309', lineHeight: 1.6 }}>
            Prova le strategie qui sotto in ordine — dalla più probabile alla più manuale.
          </div>
        </div>
      </div>

      {/* Strategia 1: varianti codice */}
      {varianti.length > 0 && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            <Lightbulb size={13} color="var(--color-orange)" /> Strategia 1 — Varianti del codice
          </div>
          {varianti.map((v, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: i < varianti.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{v.codice}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '1px 6px', borderRadius: 3 }}>{v.label}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v.motivo}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-sm"
                  onClick={() => navigator.clipboard.writeText(v.codice)}
                  title="Copia"
                >
                  <Copy size={11} />
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onRetryWithCode(v.codice)}
                >
                  <RotateCcw size={11} /> Riprova
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategia 2: sostitutivi da memoria */}
      {sostitutivi.sostitutivi?.length > 0 && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            <Lightbulb size={13} color="var(--color-orange)" /> Strategia 2 — Sostitutivi da memoria AI
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)' }}>{sostitutivi.messaggio}</span>
          </div>
          {sostitutivi.sostitutivi.slice(0, 3).map((s, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.codiceNorm || s.codiceMadre}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.brand} — usato come alternativa in sessioni precedenti</div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => onRetryWithCode(s.codiceNorm || s.codiceMadre)}>
                <RotateCcw size={11} /> Cerca
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Strategia 3: codici figlio */}
      {figli.suggerimenti?.length > 0 && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            <Lightbulb size={13} color="var(--color-orange)" /> Strategia 3 — Codici figlio simili
          </div>
          {figli.suggerimenti.slice(0, 2).map((s, i) => (
            <div key={i} style={{ padding: '10px 14px', borderBottom: i < 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Codice figlio trovato in memoria per gruppo {row?.gruppoMerceologico}</div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => onRetryWithCode(s)}>
                <RotateCcw size={11} /> Cerca
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Strategia 4: manuale */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          <ChevronRight size={13} /> Strategia 4 — Ricerca manuale
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Nessuna variante automatica ha trovato risultati. Apri iDempiere, cerca <strong style={{ fontFamily: 'monospace' }}>{row?.codiceMadre}</strong> e recupera un codice figlio specifico da incollare qui sotto.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="manual-codice-input"
              placeholder="Incolla codice figlio..."
              style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-2)', fontFamily: 'monospace', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) onRetryWithCode(e.target.value.trim()) }}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                const v = document.getElementById('manual-codice-input')?.value?.trim()
                if (v) onRetryWithCode(v)
              }}
            >
              <Search size={13} /> Cerca
            </button>
            <a href={onOpenQRicambi} target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none' }}>
              <ExternalLink size={13} /> QRicambi
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SupplierScouting({ rows: rowsProp, onOpenOrder }) {
  const location = useLocation()
  const navigate = useNavigate()
  const allData = rowsProp ?? mockRows

  const { active: queueRows } = useQueue(allData)

  // Set degli ID già ordinati in questa sessione
  const orderedIds = useMemo(() => {
    const ordini = getOrdini()
    return new Set(ordini.map(o => o.reqId).filter(Boolean))
  }, [])

  const initReqId = location.state?.reqId || queueRows[0]?.id || 'REQ-001'
  const [selectedReqId, setSelectedReqId] = useState(initReqId)
  const [selectedOfferId, setSelectedOfferId] = useState(null)
  const [filterLinea, setFilterLinea] = useState('')
  const [filterEscludi, setFilterEscludi] = useState(true) // escludi complementari
  const [searchResults, setSearchResults] = useState({}) // { reqId: { loading, results, error } }
  const [copied, setCopied] = useState(false)
  const [retryCode, setRetryCode] = useState(null) // codice custom per retry

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const selectedRow = allData.find(r => r.id === selectedReqId) || queueRows[0] || allData[0]
  const normMemory = getNormFromMemory(selectedRow?.codiceMadre)
  const normMock = normalizationsLog[selectedRow?.codiceMadre]
  const codiceRicercaBase = normMemory?.codiceNormalizzato || selectedRow?.codiceNormalizzato || normMock?.codiceNormalizzato || selectedRow?.codiceMadre
  const codiceRicerca = retryCode || codiceRicercaBase
  const caso = detectCaso(selectedRow, normMemory || normMock)

  const currentSearch = searchResults[selectedReqId]
  const isLoading = currentSearch?.loading
  const isMismatch = selectedRow?._stato === 'mismatch' || (selectedRow?._conf ?? 100) < 70
  const isBlocked = ['MISMATCH', 'TRANSITO', 'DUPLICATO'].includes(caso) || isMismatch

  // ─── Lancia ricerca QRicambi ──────────────────────────────────────────────
  const runSearch = useCallback(async (row, codice) => {
    const reqId = row.id
    setSearchResults(prev => ({ ...prev, [reqId]: { loading: true, results: [], error: null } }))
    try {
      const res = await searchQRicambi(codice, row)
      setSearchResults(prev => ({ ...prev, [reqId]: { loading: false, results: res.results || [], error: res.error || null, meta: res } }))
    } catch (e) {
      setSearchResults(prev => ({ ...prev, [reqId]: { loading: false, results: [], error: e.message } }))
    }
  }, [])

  function handleRetryWithCode(codice) {
    setRetryCode(codice)
    runSearch(selectedRow, codice)
  }

  // Auto-search quando si seleziona un articolo
  const handleSelectRow = useCallback((row) => {
    setSelectedReqId(row.id)
    setSelectedOfferId(null)
    setFilterLinea('')
    setRetryCode(null)
    if (!searchResults[row.id]) {
      const nm = getNormFromMemory(row.codiceMadre)
      const codice = nm?.codiceNormalizzato || row.codiceNormalizzato || normalizationsLog[row.codiceMadre]?.codiceNormalizzato || row.codiceMadre
      runSearch(row, codice)
    }
  }, [searchResults, runSearch])

  // Auto-search al primo caricamento
  useMemo(() => {
    if (selectedRow && !searchResults[selectedRow.id] && !isBlocked) {
      runSearch(selectedRow, codiceRicerca)
    }
  }, [selectedRow?.id])

  // Filtra e ranka le offerte
  const rankedOffers = useMemo(() => {
    const raw = currentSearch?.results || []
    let offers = raw
    if (filterEscludi) offers = offers.filter(o => !o.isComplementare)
    if (filterLinea) offers = offers.filter(o => o.livelloQualitativo === filterLinea)
    return [...offers].sort((a, b) => computeManualScore(b, selectedRow) - computeManualScore(a, selectedRow))
  }, [currentSearch, filterEscludi, filterLinea, selectedRow])

  // Rileva spread anomalo di prezzo tra fornitori
  const priceSpreadAlert = useMemo(() => {
    const offers = (currentSearch?.results || []).filter(o => !o.isComplementare && parseFloat(o.prezzoNetto) > 0)
    if (offers.length < 2) return null
    const prezzi = offers.map(o => parseFloat(o.prezzoNetto))
    const min = Math.min(...prezzi)
    const max = Math.max(...prezzi)
    const spread = ((max - min) / min) * 100
    if (spread < 40) return null // sotto 40% non è anomalo
    const cheapest = offers.find(o => parseFloat(o.prezzoNetto) === min)
    const priciest = offers.find(o => parseFloat(o.prezzoNetto) === max)
    return { min, max, spread: Math.round(spread), cheapest, priciest }
  }, [currentSearch])

  // Detect linea mismatch: richiesta non disponibile ma altre sì
  const lineaAlert = useMemo(() => {
    if (!selectedRow?.lineaProdotto || !currentSearch?.results?.length) return null
    const richiesta = selectedRow.lineaProdotto
    const allOffers = (currentSearch.results || []).filter(o => !o.isComplementare)
    const hasRichiesta = allOffers.some(o => o.livelloQualitativo === richiesta)
    if (hasRichiesta) return null
    // Linea richiesta non disponibile — quali sono disponibili?
    const disponibili = [...new Set(allOffers.map(o => o.livelloQualitativo).filter(Boolean))]
    if (disponibili.length === 0) return null
    // Suggerisci la migliore alternativa (Originale > Q/P > Economico)
    const priority = ['Originale', 'Primo Equipaggiamento', 'Qualità/Prezzo', 'Economico']
    const suggerita = priority.find(l => disponibili.includes(l)) || disponibili[0]
    return { richiesta, disponibili, suggerita }
  }, [currentSearch, selectedRow])

  const complementariCount = (currentSearch?.results || []).filter(o => o.isComplementare).length
  const totaleRisultati = currentSearch?.meta?.totaleRisultati || 0

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{ width: 220, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>
          Articoli in coda ({queueRows.length})
        </div>
        {queueRows.map(r => {
          const isSel = r.id === selectedReqId
          const hasResults = searchResults[r.id]?.results?.length > 0
          const isSearching = searchResults[r.id]?.loading
          return (
            <div key={r.id}
              style={{ padding: '9px 14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: isSel ? 'var(--color-surface-2)' : orderedIds.has(r.id) ? 'rgba(74,222,128,0.04)' : 'transparent', borderLeft: isSel ? '2px solid var(--color-orange)' : orderedIds.has(r.id) ? '2px solid rgba(74,222,128,0.4)' : '2px solid transparent', opacity: orderedIds.has(r.id) && !isSel ? 0.7 : 1 }}
              onClick={() => handleSelectRow(r)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span
                  style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, flex: 1, cursor: 'pointer' }}
                  className="truncate"
                  title="Copia codice"
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(r.codiceNormalizzato || r.codiceMadre) }}
                >
                  {r.codiceNormalizzato || r.codiceMadre}
                </span>
                {isSearching && <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid var(--color-orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                {!isSearching && orderedIds.has(r.id) && <PackageCheck size={10} color="#4ADE80" title="Già ordinato in questa sessione" />}
                {!isSearching && !orderedIds.has(r.id) && hasResults && <CheckCircle size={10} color="var(--color-orange)" />}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>{r.gruppoMerceologico}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span className={`badge ${r.urgenza === 'Prioritaria' || r.urgenza === 'Critica' ? 'badge-critica' : 'badge-alta'}`} style={{ fontSize: 9 }}>
                  {r.urgenza}
                </span>
                {orderedIds.has(r.id) && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#4ADE80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 3, padding: '1px 5px' }}>
                    ✓ ordinato
                  </span>
                )}
              </div>
              {hasResults && !orderedIds.has(r.id) && (
                <div style={{ fontSize: 9, color: 'var(--color-orange)', marginTop: 2 }}>
                  {searchResults[r.id].results.length} offerte trovate
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              Scouting —
              <span
                className="font-mono"
                style={{
                  fontSize: 16,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  borderColor: copied ? 'var(--color-orange)' : undefined,
                }}
                onClick={() => handleCopy(codiceRicerca)}
                title="Copia codice per QRicambi"
              >
                {codiceRicerca}
                {copied
                  ? <ClipboardCheck size={13} color="var(--color-orange)" />
                  : <Copy size={13} color="var(--color-text-muted)" />
                }
              </span>
              {selectedRow?.codiceMadre !== codiceRicerca && (
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  orig: {selectedRow?.codiceMadre}
                </span>
              )}
              {selectedRow?.brand && (
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  {selectedRow.brand}
                </span>
              )}
            </h1>
            <p className="page-subtitle">
              {selectedRow?.gruppoMerceologico} · {selectedRow?.lineaProdotto} · {selectedRow?.urgenza}
              {selectedRow?.multiplo > 1 && <span style={{ color: 'var(--color-orange)', marginLeft: 8 }}>· Venduto ×{selectedRow.multiplo}</span>}
              {totaleRisultati > 0 && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· {totaleRisultati} risultati QRicambi</span>}
              {complementariCount > 0 && <span style={{ color: 'var(--color-orange-text)', marginLeft: 8 }}>· {complementariCount} complementari esclusi</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={buildQRicambiUrl(codiceRicerca)} target="_blank" rel="noopener noreferrer"
              className="btn" style={{ textDecoration: 'none' }}>
              <ExternalLink size={13} /> QRicambi
            </a>
            <button className="btn" onClick={() => runSearch(selectedRow, codiceRicerca)} disabled={isLoading}>
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }} />
              {isLoading ? 'Ricerca...' : 'Aggiorna'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/ranking', { state: { reqId: selectedReqId } })}>
              Ranking <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Caso + info */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CasoBadge caso={caso} />
            {selectedRow?.multiplo > 1 && <CasoBadge caso="MULTIPLO" />}
          </div>

          {/* Blocco alert */}
          {isBlocked && (
            isMismatch ? (
              <div style={{
                padding: '16px 18px',
                background: '#FFFBEB',
                border: '2px solid #F59E0B',
                borderRadius: 10,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <ShieldAlert size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#92400E', marginBottom: 4 }}>
                    ORDINE BLOCCATO — Mismatch famiglia rilevato
                  </div>
                  <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, marginBottom: 10 }}>
                    La famiglia ERP di questo articolo non corrisponde alla classificazione TecDoc (confidence: <strong>{selectedRow?._conf ?? '?'}%</strong>).
                    Ordinare senza verificare potrebbe generare un acquisto del prodotto sbagliato.
                  </div>
                  <div style={{ fontSize: 11, color: '#B45309', marginBottom: 12, fontWeight: 600 }}>
                    ERP: <span style={{ fontFamily: 'monospace' }}>{selectedRow?.gruppoMerceologico}</span>
                    &nbsp;→&nbsp;
                    TecDoc: <span style={{ fontFamily: 'monospace' }}>{normalizationsLog[selectedRow?.codiceMadre]?.famigliaTecDoc ?? 'non classificato'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn"
                      style={{ fontSize: 11, borderColor: '#F59E0B', color: '#92400E' }}
                      onClick={() => navigate('/normalizzazione', { state: { reqId: selectedRow?.id } })}
                    >
                      <ShieldAlert size={11} /> Vai a Normalizzazione
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 11 }}
                      onClick={() => navigate('/taskboard')}
                    >
                      Apri Task Board
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-black">
                <AlertTriangle size={16} className="alert-icon" />
                <div>
                  <div className="alert-title">Articolo bloccato — scouting non necessario</div>
                  <div className="alert-desc">{CASI_SCOUTING[caso]?.desc}</div>
                </div>
              </div>
            )
          )}

          {/* Caso codice figlio */}
          {caso === 'CODICE_FIGLIO' && !isBlocked && (
            <div className="alert alert-orange">
              <Info size={14} className="alert-icon" />
              <div>
                <div className="alert-title">Codice madre generico — serve codice figlio</div>
                <div className="alert-desc">
                  Apri iDempiere, cerca <strong>{selectedRow?.codiceMadre}</strong> e recupera un codice figlio specifico.
                  Poi vai in Normalizzazione, aggiorna il codice e torna qui — la ricerca si riaggiornerà automaticamente.
                </div>
              </div>
            </div>
          )}

          {/* Filtri */}
          {!isBlocked && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {['', 'Originale', 'Primo Equipaggiamento', 'Economico'].map(l => (
                <button key={l} className={`pill${filterLinea === l ? ' active-orange' : ''}`} onClick={() => setFilterLinea(l)}>
                  {l || 'Tutti'}
                </button>
              ))}
              <div className="divider" />
              <button className={`pill${filterEscludi ? ' active' : ''}`} onClick={() => setFilterEscludi(e => !e)}>
                {filterEscludi ? <><CheckCircle size={10} /> Complementari esclusi</> : 'Mostra complementari'}
              </button>
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-orange)', marginLeft: 8 }}>
                  <Zap size={12} />
                  Ricerca su QRicambi in corso...
                </div>
              )}
            </div>
          )}

          {/* Linea alert */}
          {!isBlocked && !isLoading && lineaAlert && (
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: '#FEF3C7', border: '1px solid #FCD34D',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#92400E', marginBottom: 4 }}>
                  Linea <strong>{lineaAlert.richiesta}</strong> non disponibile
                </div>
                <div style={{ fontSize: 11, color: '#B45309', marginBottom: 8 }}>
                  Disponibili: {lineaAlert.disponibili.join(', ')}. Vuoi procedere con <strong>{lineaAlert.suggerita}</strong>?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 11, background: '#F59E0B', border: 'none', color: '#fff', fontWeight: 700 }}
                    onClick={() => setFilterLinea(lineaAlert.suggerita)}
                  >
                    Mostra {lineaAlert.suggerita}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={() => setFilterLinea('')}
                  >
                    Mostra tutte le linee
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Price spread alert */}
          {!isBlocked && !isLoading && priceSpreadAlert && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 11,
            }}>
              <Info size={14} color="var(--color-orange)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, color: 'var(--color-text-secondary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Spread prezzo anomalo +{priceSpreadAlert.spread}%</strong>
                {' '}— {priceSpreadAlert.cheapest?.fornitore} offre €{priceSpreadAlert.min.toFixed(2)} vs {priceSpreadAlert.priciest?.fornitore} a €{priceSpreadAlert.max.toFixed(2)}.
                Verifica se si tratta dello stesso articolo (brand/coating diverso?) prima di scegliere il più economico.
              </div>
            </div>
          )}

          {/* Risultati */}
          {!isBlocked && (
            isLoading ? (
              <LoadingSkeleton />
            ) : currentSearch?.error ? (
              <div className="alert alert-orange">
                <AlertTriangle size={14} className="alert-icon" />
                <div>
                  <div className="alert-title">Errore ricerca</div>
                  <div className="alert-desc">{currentSearch.error}</div>
                </div>
              </div>
            ) : rankedOffers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Mostra anche i complementari filtrati se ci sono */}
                {filterEscludi && complementariCount > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <X size={11} color="var(--color-orange)" />
                    {complementariCount} articoli complementari esclusi automaticamente (mollette, kit accessori, ecc.)
                  </div>
                )}
                {rankedOffers.map((offer, i) => (
                  <OfferCard
                    key={offer.id} offer={offer} row={selectedRow}
                    rank={i + 1} isSelected={selectedOfferId === offer.id}
                    onSelect={setSelectedOfferId}
                    onOrder={(o, r) => onOpenOrder && onOpenOrder(o, r)}
                  />
                ))}
                {/* Complementari in fondo se visibili */}
                {!filterEscludi && (currentSearch?.results || []).filter(o => o.isComplementare).map((offer, i) => (
                  <OfferCard key={offer.id} offer={offer} row={selectedRow} rank={rankedOffers.length + i + 1}
                    isSelected={false} onSelect={() => {}} onOrder={() => {}} />
                ))}
              </div>
            ) : !currentSearch ? (
              <div className="empty-state">
                <Search size={28} />
                <span>Clicca un articolo per avviare la ricerca su QRicambi</span>
              </div>
            ) : filterLinea ? (
              <div className="empty-state">
                <Search size={28} />
                <span>Nessuna offerta per linea "{filterLinea}"</span>
                <button className="btn" onClick={() => setFilterLinea('')}>Rimuovi filtro linea</button>
              </div>
            ) : (
              <NoResultsFallback
                row={selectedRow}
                codiceRicerca={codiceRicerca}
                onRetryWithCode={handleRetryWithCode}
                onOpenQRicambi={buildQRicambiUrl(codiceRicerca)}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
