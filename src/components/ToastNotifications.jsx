import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertTriangle, Info, X, Loader } from 'lucide-react'

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Toast item ───────────────────────────────────────────────────────────────
function Toast({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Auto dismiss
    if (toast.duration !== 0) {
      const t2 = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onRemove(toast.id), 300)
      }, toast.duration || 3500)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    return () => clearTimeout(t1)
  }, [toast.id])

  const configs = {
    success: { bg: 'var(--color-text-primary)', color: '#fff', icon: <CheckCircle size={14} />, border: 'none' },
    error:   { bg: '#fee2e2', color: '#991b1b', icon: <AlertTriangle size={14} />, border: '1px solid #fca5a5' },
    warning: { bg: 'var(--color-orange-light)', color: 'var(--color-orange-text)', icon: <AlertTriangle size={14} />, border: '1px solid var(--color-orange-border)' },
    info:    { bg: 'var(--color-surface)', color: 'var(--color-text-primary)', icon: <Info size={14} />, border: '1px solid var(--color-border)' },
    loading: { bg: 'var(--color-surface)', color: 'var(--color-text-primary)', icon: <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />, border: '1px solid var(--color-border)' },
  }
  const cfg = configs[toast.type] || configs.info

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 14px',
      background: cfg.bg, color: cfg.color,
      border: cfg.border,
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      minWidth: 280, maxWidth: 380,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
      pointerEvents: 'all',
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && <div style={{ fontWeight: 700, fontSize: 12, marginBottom: toast.message ? 2 : 0 }}>{toast.title}</div>}
        {toast.message && <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.5 }}>{toast.message}</div>}
        {toast.action && (
          <button onClick={toast.action.onClick}
            style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, border: `1px solid ${cfg.color}`, background: 'transparent', color: cfg.color, cursor: 'pointer', opacity: 0.9 }}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, opacity: 0.6, flexShrink: 0, padding: 0, display: 'flex', marginTop: 1 }}>
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]) // max 5 toasts
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const update = useCallback((id, updates) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  // Shorthand methods
  const toast = {
    success: (title, message, opts) => add({ type: 'success', title, message, ...opts }),
    error:   (title, message, opts) => add({ type: 'error',   title, message, duration: 6000, ...opts }),
    warning: (title, message, opts) => add({ type: 'warning', title, message, ...opts }),
    info:    (title, message, opts) => add({ type: 'info',    title, message, ...opts }),
    loading: (title, message)       => add({ type: 'loading', title, message, duration: 0 }),
    update,
    remove,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — top right */}
      <div style={{
        position: 'fixed', top: 60, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => <Toast key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}
