import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { X, ArrowRight, ArrowLeft, MapPin, Zap, ListChecks, Radar, ShoppingCart, BookOpen } from 'lucide-react'

// ─── Step definitions ─────────────────────────────────────────────────────────
// selector: CSS selector dell'elemento da illuminare
// position: dove mettere il tooltip rispetto al target ('right', 'bottom', 'left', 'top', 'center')
const STEPS = [
  {
    id: 'welcome',
    selector: null,
    position: 'center',
    icon: <Zap size={28} color="#F97316" />,
    title: 'Benvenuto in Brera Replenishment',
    body: 'Questo tour ti guida in 6 passi attraverso le funzioni principali. Puoi saltarlo ora e riaprirlo in qualsiasi momento dalla sidebar o dalla Guida.',
    cta: 'Inizia il tour',
  },
  {
    id: 'sidebar-workstation',
    selector: 'a[href="/workstation"]',
    position: 'right',
    icon: <Zap size={18} color="#F97316" />,
    title: 'Workstation — il cuore operativo',
    body: 'Da qui elabori le urgenze una alla volta. La coda è già ordinata per priorità. Il badge arancio mostra quante urgenze ti aspettano.',
  },
  {
    id: 'sidebar-fabbisogni',
    selector: 'a[href="/fabbisogni"]',
    position: 'right',
    icon: <ListChecks size={18} color="#F97316" />,
    title: 'Coda Fabbisogni',
    body: 'Tutti gli articoli da riordinare, con esclusione automatica di duplicati, merce in transito e mismatch famiglia. Ogni riga ha un Reason Code AI che spiega perché è in coda.',
  },
  {
    id: 'sidebar-scouting',
    selector: 'a[href="/scouting"]',
    position: 'right',
    icon: <Radar size={18} color="#F97316" />,
    title: 'Scouting Fornitori',
    body: 'La ricerca su QRicambi parte automaticamente. Offerte rankate per score AI, complementari esclusi, mismatch bloccati. Clicca il codice per copiarlo negli appunti.',
  },
  {
    id: 'sidebar-ordini',
    selector: 'a[href="/ordini"]',
    position: 'right',
    icon: <ShoppingCart size={18} color="#F97316" />,
    title: 'Registro Ordini',
    body: 'Tutti gli ordini confermati in sessione, con stato modificabile, note libere e export CSV/JSON per iDempiere.',
  },
  {
    id: 'sidebar-guida',
    selector: 'a[href="/guida"]',
    position: 'right',
    icon: <BookOpen size={18} color="#F97316" />,
    title: 'Guida completa',
    body: 'Documentazione di ogni schermata, i 12 moduli AI, il glossario e la risoluzione problemi. Cerca qualsiasi termine con la barra in cima. Puoi riaprire questo tour dal pulsante qui sotto.',
    cta: 'Completato — inizia a lavorare',
  },
]

// ─── Spotlight overlay ────────────────────────────────────────────────────────
function getRect(selector) {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const PAD = 8

export default function OnboardingTour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef(null)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  // Compute highlight rect
  useLayoutEffect(() => {
    const compute = () => {
      const r = getRect(current.selector)
      setRect(r)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [step, current.selector])

  // Fade in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Scroll target into view
  useEffect(() => {
    if (current.selector) {
      const el = document.querySelector(current.selector)
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [step, current.selector])

  function next() {
    if (isLast) { finish(); return }
    setStep(s => s + 1)
  }
  function prev() { setStep(s => Math.max(0, s - 1)) }
  function finish() {
    localStorage.setItem('brera_tour_done', '1')
    setVisible(false)
    setTimeout(onClose, 220)
  }

  // ── Tooltip position logic ──────────────────────────────────────────────────
  function tooltipStyle() {
    const base = {
      position: 'fixed',
      zIndex: 10002,
      width: 320,
      background: '#0F0F0F',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 14,
      boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
      padding: '20px 22px',
      transition: 'opacity 0.2s, transform 0.2s',
      opacity: visible ? 1 : 0,
    }

    if (current.position === 'center' || !rect) {
      return {
        ...base,
        top: '50%', left: '50%',
        transform: visible ? 'translate(-50%, -50%)' : 'translate(-50%, -46%)',
      }
    }

    const OFFSET = 18
    if (current.position === 'right') {
      return {
        ...base,
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + OFFSET,
        transform: visible ? 'translateY(-50%)' : 'translateY(-46%)',
      }
    }
    if (current.position === 'bottom') {
      return {
        ...base,
        top: rect.top + rect.height + OFFSET,
        left: rect.left + rect.width / 2,
        transform: visible ? 'translateX(-50%)' : 'translateX(-46%)',
      }
    }
    if (current.position === 'left') {
      return {
        ...base,
        top: rect.top + rect.height / 2,
        left: rect.left - 320 - OFFSET,
        transform: visible ? 'translateY(-50%)' : 'translateY(-46%)',
      }
    }
    return base
  }

  // ── Arrow pointing to target ───────────────────────────────────────────────
  function ArrowPointer() {
    if (current.position === 'center' || !rect) return null
    if (current.position === 'right') return (
      <div style={{
        position: 'absolute', left: -8, top: '50%',
        transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '8px solid rgba(255,255,255,0.12)',
      }} />
    )
    return null
  }

  return (
    <>
      {/* ── Dark overlay with cutout ── */}
      <svg
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          width: '100vw', height: '100vh',
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-mask)"
        />
        {/* Highlight border around target */}
        {rect && (
          <rect
            x={rect.left - PAD}
            y={rect.top - PAD}
            width={rect.width + PAD * 2}
            height={rect.height + PAD * 2}
            rx={8}
            fill="none"
            stroke="#F97316"
            strokeWidth={2}
            strokeDasharray="6 3"
            style={{ animation: 'dash 1.2s linear infinite' }}
          />
        )}
      </svg>

      {/* ── Click blocker (prevent interaction with app while tour active) ── */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10001, cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      />

      {/* ── Tooltip ── */}
      <div ref={tooltipRef} style={tooltipStyle()}>
        <ArrowPointer />

        {/* Close */}
        <button
          onClick={finish}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 24, height: 24, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
          }}
          title="Salta il tour"
        >
          <X size={12} />
        </button>

        {/* Step counter */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 16 : 6,
                height: 6, borderRadius: 3,
                background: i === step ? '#F97316' : i < step ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.15)',
                transition: 'width 0.2s, background 0.2s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {current.icon}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3, paddingTop: 2 }}>
            {current.title}
          </div>
        </div>

        {/* Body */}
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7, marginBottom: 20,
        }}>
          {current.body}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isFirst && (
            <button
              onClick={prev}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12, color: 'rgba(255,255,255,0.5)',
              }}
            >
              <ArrowLeft size={12} /> Indietro
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              border: 'none',
              background: '#F97316', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            }}
          >
            {current.cta || (isLast ? 'Inizia a lavorare' : 'Avanti')}
            {!isLast && <ArrowRight size={13} />}
          </button>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={finish} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'rgba(255,255,255,0.2)',
              textDecoration: 'underline',
            }}>
              Salta il tour
            </button>
          </div>
        )}
      </div>

      {/* ── CSS animation for dashed border ── */}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </>
  )
}
