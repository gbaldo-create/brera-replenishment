import { useState, useRef, useEffect } from 'react'

// ─── Tooltip component ────────────────────────────────────────────────────────
// Uso: <Tooltip text="Descrizione">
//        <button>...</button>
//      </Tooltip>
//
// Oppure su elemento semplice:
// <Tooltip text="Salva in memoria permanente" position="top">
//   <button className="btn btn-primary">Conferma</button>
// </Tooltip>

export default function Tooltip({ text, children, position = 'top', delay = 400 }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [actualPos, setActualPos] = useState(position)
  const triggerRef = useRef(null)
  const timerRef = useRef(null)
  const tooltipRef = useRef(null)

  function show() {
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Calcola posizione ottimale
      let ap = position
      if (position === 'top' && rect.top < 50) ap = 'bottom'
      if (position === 'bottom' && rect.bottom > vh - 50) ap = 'top'
      if (position === 'left' && rect.left < 120) ap = 'right'
      if (position === 'right' && rect.right > vw - 120) ap = 'left'

      let top, left
      const tooltipW = 200 // estimated
      const tooltipH = 32  // estimated

      if (ap === 'top') {
        top = rect.top - tooltipH - 8
        left = rect.left + rect.width / 2 - tooltipW / 2
      } else if (ap === 'bottom') {
        top = rect.bottom + 8
        left = rect.left + rect.width / 2 - tooltipW / 2
      } else if (ap === 'left') {
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.left - tooltipW - 8
      } else {
        top = rect.top + rect.height / 2 - tooltipH / 2
        left = rect.right + 8
      }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, vw - tooltipW - 8))
      top = Math.max(8, Math.min(top, vh - tooltipH - 8))

      setPos({ top, left })
      setActualPos(ap)
      setVisible(true)
    }, delay)
  }

  function hide() {
    clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!text) return children

  return (
    <>
      <span ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} style={{ display: 'contents' }}>
        {children}
      </span>
      {visible && (
        <div ref={tooltipRef} style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 10000,
          background: 'var(--color-text-primary)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '5px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          maxWidth: 260,
          whiteSpace: 'normal',
          lineHeight: 1.5,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.12s ease-out',
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: 6, height: 6,
            background: 'var(--color-text-primary)',
            transform: 'rotate(45deg)',
            ...(actualPos === 'top'    && { bottom: -3,  left: '50%', marginLeft: -3 }),
            ...(actualPos === 'bottom' && { top: -3,     left: '50%', marginLeft: -3 }),
            ...(actualPos === 'left'   && { right: -3,   top: '50%',  marginTop: -3 }),
            ...(actualPos === 'right'  && { left: -3,    top: '50%',  marginTop: -3 }),
          }} />
        </div>
      )}
    </>
  )
}
