import { useState } from 'react'
import { ChevronDown, User } from 'lucide-react'
import { OPERATORI_DEMO, getOperatore, setOperatore } from '../data/operatoreStore'

// Avatar operatore riutilizzabile
export function OperatoreAvatar({ operatoreId, size = 20, showName = false }) {
  const op = OPERATORI_DEMO.find(o => o.id === operatoreId)
  if (!op) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: op.colore,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: '#fff',
        flexShrink: 0, letterSpacing: '-0.03em',
        fontFamily: 'Geist, sans-serif',
      }}>
        {op.iniziali}
      </div>
      {showName && <span style={{ fontSize: 11, fontWeight: 500 }}>{op.nome}</span>}
    </div>
  )
}

export default function OperatoreSelector({ collapsed, onChange }) {
  const [current, setCurrent] = useState(() => getOperatore())
  const [open, setOpen] = useState(false)

  function select(op) {
    setOperatore(op.id)
    setCurrent(op)
    setOpen(false)
    onChange?.(op)
  }

  if (collapsed) {
    return (
      <div style={{ padding: '6px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          title={`Operatore: ${current.nome}`}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: current.colore,
            border: '2px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {current.iniziali}
        </button>
        {open && <DropdownMenu ops={OPERATORI_DEMO} current={current} onSelect={select} posLeft={44} />}
      </div>
    )
  }

  return (
    <div style={{ padding: '6px 8px', position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          cursor: 'pointer', transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: current.colore,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
          letterSpacing: '-0.02em',
        }}>
          {current.iniziali}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>{current.nome}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em' }}>Operatore attivo</div>
        </div>
        <ChevronDown size={11} color="rgba(255,255,255,0.3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && <DropdownMenu ops={OPERATORI_DEMO} current={current} onSelect={select} posLeft={0} posBottom />}
    </div>
  )
}

function DropdownMenu({ ops, current, onSelect, posLeft, posBottom }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 8998 }} onClick={e => { e.stopPropagation() }} />
      <div style={{
        position: 'absolute',
        left: posLeft,
        bottom: posBottom ? '100%' : 'auto',
        top: posBottom ? 'auto' : '100%',
        marginBottom: posBottom ? 4 : 0,
        marginTop: posBottom ? 0 : 4,
        width: 180,
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        zIndex: 8999,
        overflow: 'hidden',
        animation: 'slideUp 0.15s ease-out',
      }}>
        <div style={{ padding: '8px 12px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          Cambia operatore
        </div>
        {ops.map(op => (
          <button key={op.id} onClick={() => onSelect(op)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', background: op.id === current.id ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none', cursor: 'pointer', transition: 'background 0.1s',
              fontFamily: 'Geist, sans-serif',
            }}
            onMouseEnter={e => { if (op.id !== current.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (op.id !== current.id) e.currentTarget.style.background = 'none' }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: op.colore,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
              border: op.id === current.id ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
            }}>
              {op.iniziali}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: op.id === current.id ? 700 : 500, color: op.id === current.id ? '#fff' : 'rgba(255,255,255,0.7)' }}>{op.nome}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'Geist Mono, monospace' }}>{op.id}</div>
            </div>
            {op.id === current.id && (
              <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />
            )}
          </button>
        ))}
        <div style={{ padding: '6px 12px 8px', fontSize: 9, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.07)', fontStyle: 'italic' }}>
          Demo — in produzione: login reale
        </div>
      </div>
    </>
  )
}
