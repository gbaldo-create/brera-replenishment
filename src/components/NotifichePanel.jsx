import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, CheckCheck, AlertTriangle, Info, Zap, ArrowRight, Circle, CheckCircle } from 'lucide-react'
import { generaNotifiche } from '../data/notificheInterne'
import { getOrdini } from '../data/ordiniStore'

const TIPO_CONFIG = {
  critico: {
    icon: <Zap size={13} />,
    color: '#fff',
    bg: '#0F0F0F',
    border: 'rgba(255,255,255,0.15)',
    dot: '#F97316',
  },
  warning: {
    icon: <AlertTriangle size={13} />,
    color: '#92400e',
    bg: '#FFF7ED',
    border: '#FED7AA',
    dot: '#F97316',
  },
  info: {
    icon: <Info size={13} />,
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-2)',
    border: 'var(--color-border)',
    dot: '#9CA3AF',
  },
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Adesso'
  if (m < 60) return `${m}m fa`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h fa`
  return `${Math.floor(h / 24)}g fa`
}

function useLette() {
  const [lette, setLette] = useState(() => {
    try { return JSON.parse(localStorage.getItem('brera_notifiche_lette') || '[]') } catch { return [] }
  })

  function segnaLetta(id) {
    setLette(prev => {
      const nuove = prev.includes(id) ? prev : [...prev, id]
      localStorage.setItem('brera_notifiche_lette', JSON.stringify(nuove))
      return nuove
    })
  }

  function segnaNoLetta(id) {
    setLette(prev => {
      const nuove = prev.filter(x => x !== id)
      localStorage.setItem('brera_notifiche_lette', JSON.stringify(nuove))
      return nuove
    })
  }

  function toggleLetta(id, isLetta) {
    if (isLetta) segnaNoLetta(id)
    else segnaLetta(id)
  }

  function segnaAllLette(ids) {
    setLette(prev => {
      const nuove = [...new Set([...prev, ...ids])]
      localStorage.setItem('brera_notifiche_lette', JSON.stringify(nuove))
      return nuove
    })
  }

  function segnaAllNoLette() {
    setLette([])
    localStorage.setItem('brera_notifiche_lette', JSON.stringify([]))
  }

  return { lette, segnaLetta, toggleLetta, segnaAllLette, segnaAllNoLette }
}

export default function NotifichePanel({ rows, collapsed }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { lette, segnaLetta, toggleLetta, segnaAllLette, segnaAllNoLette } = useLette()
  const panelRef = useRef(null)

  const ordini = getOrdini()
  const tutte = generaNotifiche(rows, ordini)
  const nonLette = tutte.filter(n => !lette.includes(n.id))
  const count = nonLette.length

  // Chiudi cliccando fuori
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleCta(n) {
    segnaLetta(n.id)
    setOpen(false)
    navigate(n.route)
  }

  // ── Collapsed: solo campanella con badge ──────────────────────────────────
  if (collapsed) {
    return (
      <div ref={panelRef} style={{ position: 'relative', padding: '4px 6px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          title={`${count} notifich${count === 1 ? 'a' : 'e'} non lette`}
          style={{
            position: 'relative', width: '100%', height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)',
            background: open ? 'rgba(249,115,22,0.15)' : 'transparent',
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
        >
          <Bell size={14} color={open ? '#F97316' : count > 0 ? '#fff' : 'rgba(255,255,255,0.4)'} />
          {count > 0 && (
            <div style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: '#F97316', border: '1.5px solid #111',
              animation: 'pulse 2s infinite',
            }} />
          )}
        </button>

        {/* Panel espanso da collapsed */}
        {open && (
          <PanelEspanso
            tutte={tutte} lette={lette} count={count}
            onCta={handleCta} onToggle={toggleLetta}
            onSegnaAllLette={() => segnaAllLette(tutte.map(n => n.id))}
            onSegnaAllNoLette={segnaAllNoLette}
            onClose={() => setOpen(false)}
            posLeft={60}
          />
        )}
      </div>
    )
  }

  // ── Expanded sidebar ──────────────────────────────────────────────────────
  return (
    <div ref={panelRef} style={{ position: 'relative', padding: '0 8px' }}>

      {/* Header riga */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 4px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.2)' }}>
          Notifiche {count > 0 && <span style={{ color: '#F97316' }}>· {count}</span>}
        </span>
        <button
          onClick={() => setOpen(o => !o)}
          title="Apri pannello notifiche"
          style={{
            position: 'relative', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
            background: open ? 'rgba(249,115,22,0.15)' : 'transparent',
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = open ? 'rgba(249,115,22,0.15)' : 'transparent' }}
        >
          <Bell size={12} color={open ? '#F97316' : count > 0 ? '#fff' : 'rgba(255,255,255,0.4)'} />
          {count > 0 && (
            <div style={{
              position: 'absolute', top: 3, right: 3,
              width: 6, height: 6, borderRadius: '50%',
              background: '#F97316', border: '1.5px solid #111',
              animation: 'pulse 2s infinite',
            }} />
          )}
        </button>
      </div>

      {/* Lista compatta — TUTTE, sempre visibili */}
      {tutte.length === 0 ? (
        <div style={{ padding: '6px 4px 8px', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
          Nessuna notifica
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
          {tutte.map(n => {
            const cfg = TIPO_CONFIG[n.tipo]
            const isLetta = lette.includes(n.id)
            return (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '6px 6px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.1s', opacity: isLetta ? 0.45 : 1 }}
                onClick={() => handleCta(n)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: isLetta ? 'rgba(255,255,255,0.15)' : cfg.dot }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: isLetta ? 400 : 600, color: isLetta ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.titolo}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.body}
                  </div>
                </div>
                {/* Toggle letta/non letta */}
                <button
                  onClick={e => { e.stopPropagation(); toggleLetta(n.id, isLetta) }}
                  title={isLetta ? 'Segna come non letta' : 'Segna come letta'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLetta ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', padding: 2, display: 'flex', flexShrink: 0, marginTop: 2 }}
                  onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#F97316' }}
                  onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = isLetta ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }}
                >
                  {isLetta ? <Circle size={10} /> : <CheckCircle size={10} />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Panel espanso */}
      {open && (
        <PanelEspanso
          tutte={tutte} lette={lette} count={count}
          onCta={handleCta} onToggle={toggleLetta}
          onSegnaAllLette={() => segnaAllLette(tutte.map(n => n.id))}
          onSegnaAllNoLette={segnaAllNoLette}
          onClose={() => setOpen(false)}
          posLeft={228}
        />
      )}
    </div>
  )
}

// ─── Panel espanso (condiviso tra collapsed e expanded) ───────────────────────
function PanelEspanso({ tutte, lette, count, onCta, onToggle, onSegnaAllLette, onSegnaAllNoLette, onClose, posLeft }) {
  const allLette = tutte.every(n => lette.includes(n.id))

  return (
    <div style={{
      position: 'fixed',
      left: posLeft,
      bottom: 60,
      width: 340,
      maxHeight: 'min(540px, 80vh)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      zIndex: 9000,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideUp 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{ padding: '13px 16px 11px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} color="var(--color-text-primary)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Notifiche</span>
          {count > 0 && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#F97316', color: '#fff', fontWeight: 700 }}>{count} nuov{count === 1 ? 'a' : 'e'}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {tutte.length > 0 && (
            <button
              onClick={allLette ? onSegnaAllNoLette : onSegnaAllLette}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'Geist, sans-serif' }}
            >
              <CheckCheck size={11} />
              {allLette ? 'Segna tutte non lette' : 'Segna tutte lette'}
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 5 }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Lista completa — sempre tutte */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {tutte.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Tutto in ordine</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Nessuna azione richiesta al momento</div>
          </div>
        ) : (
          tutte.map(n => {
            const cfg = TIPO_CONFIG[n.tipo]
            const isLetta = lette.includes(n.id)
            return (
              <div key={n.id} style={{
                padding: '11px 12px', marginBottom: 6, borderRadius: 10,
                border: `1px solid ${isLetta ? 'var(--color-border)' : cfg.border}`,
                background: isLetta ? 'var(--color-surface-2)' : cfg.bg,
                opacity: isLetta ? 0.55 : 1,
                transition: 'opacity 0.2s, background 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Icona tipo */}
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLetta ? 'var(--color-surface-3)' : n.tipo === 'critico' ? '#F97316' : n.tipo === 'warning' ? '#FED7AA' : 'var(--color-surface-3)',
                    color: isLetta ? 'var(--color-text-muted)' : n.tipo === 'critico' ? '#fff' : '#92400e',
                  }}>
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isLetta ? 'var(--color-text-muted)' : cfg.color, flex: 1 }}>{n.titolo}</span>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(n.ts)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: isLetta ? 'var(--color-text-muted)' : n.tipo === 'critico' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                      {n.body}
                    </p>
                    <button onClick={() => onCta(n)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                      border: `1px solid ${n.tipo === 'critico' && !isLetta ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'}`,
                      background: n.tipo === 'critico' && !isLetta ? 'rgba(255,255,255,0.12)' : 'var(--color-surface-2)',
                      color: n.tipo === 'critico' && !isLetta ? '#fff' : 'var(--color-text-primary)',
                      cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                    }}>
                      {n.ctaLabel} <ArrowRight size={10} />
                    </button>
                  </div>

                  {/* Toggle letta/non letta — chiaro e intuitivo */}
                  <button
                    onClick={() => onToggle(n.id, isLetta)}
                    title={isLetta ? 'Segna come non letta' : 'Segna come letta'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', display: 'flex', flexShrink: 0, borderRadius: 4, color: isLetta ? 'var(--color-text-muted)' : 'var(--color-text-muted)', marginTop: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#F97316' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                  >
                    {isLetta ? <Circle size={13} /> : <CheckCircle size={13} />}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span>{tutte.length} notifich{tutte.length === 1 ? 'a' : 'e'} totali</span>
        <span>{tutte.length - count} lett{tutte.length - count === 1 ? 'a' : 'e'}</span>
      </div>
    </div>
  )
}
