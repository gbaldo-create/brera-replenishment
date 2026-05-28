import { useState, useEffect } from 'react'
import { X, Zap, Bell, BellOff, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  buildWelcomeSummary, shouldShowWelcome, notificaUrgenze,
  requestNotifichePermesso, notificheAttive, getNotifichePermesso
} from '../data/notificheService'
import { getOrdini } from '../data/ordiniStore'

export default function WelcomeBanner({ rows }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [summary, setSummary] = useState(null)
  const [permesso, setPermesso] = useState(getNotifichePermesso())
  const [richiestaPermesso, setRichiestaPermesso] = useState(false)

  useEffect(() => {
    if (!rows || rows.length === 0) return
    if (!shouldShowWelcome()) return

    const ordini = getOrdini()
    const s = buildWelcomeSummary(rows, ordini)
    setSummary(s)
    setVisible(true)

    // Invia push se permesso già concesso
    if (notificheAttive() && s.prioritari > 0) {
      notificaUrgenze(s.prioritari + s.sottoscorta, s.prioritari)
    }
  }, [rows?.length])

  async function handleAttivaNotifiche() {
    setRichiestaPermesso(true)
    const result = await requestNotifichePermesso()
    setPermesso(result)
    if (result === 'granted' && summary?.prioritari > 0) {
      notificaUrgenze(summary.prioritari + summary.sottoscorta, summary.prioritari)
    }
    setRichiestaPermesso(false)
  }

  if (!visible || !summary) return null

  const hasCritici = summary.prioritari > 0 || summary.inRevisione > 0

  return (
    <>
      {/* Overlay scuro */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      <div style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(640px, calc(100vw - 40px))',
        zIndex: 1001,
        background: hasCritici ? 'var(--color-text-primary)' : 'var(--color-surface)',
        border: `1px solid ${hasCritici ? 'rgba(255,255,255,0.15)' : 'var(--color-border)'}`,
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        animation: 'slideDown 0.25s ease-out',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Zap size={20} color="#fff" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: hasCritici ? '#fff' : 'var(--color-text-primary)', marginBottom: 10 }}>
          {summary.saluto} — {rows.length} articoli caricati
        </div>

        {summary.items.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {summary.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 6,
                background: hasCritici
                  ? item.tipo === 'critico' ? 'rgba(249,115,22,0.3)' : item.tipo === 'ok' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'
                  : item.tipo === 'critico' ? 'var(--color-orange-light)' : item.tipo === 'ok' ? '#f0fdf4' : 'var(--color-surface-2)',
                border: `1px solid ${hasCritici ? 'rgba(255,255,255,0.15)' : item.tipo === 'critico' ? 'var(--color-orange-border)' : 'var(--color-border)'}`,
                fontSize: 12,
                color: hasCritici ? '#fff' : item.tipo === 'critico' ? 'var(--color-orange-text)' : 'var(--color-text-primary)',
              }}>
                <span>{item.icon}</span>
                <span style={{ fontWeight: item.tipo === 'critico' ? 700 : 500 }}>{item.testo}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: hasCritici ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', marginBottom: 12 }}>
            Nessuna urgenza critica — ottimo!
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {summary.prioritari > 0 && (
            <button
              onClick={() => { setVisible(false); navigate('/workstation') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, background: 'var(--color-orange)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
            >
              Apri Workstation <ArrowRight size={13} />
            </button>
          )}
          {summary.inRevisione > 0 && (
            <button
              onClick={() => { setVisible(false); navigate('/ordini') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, background: hasCritici ? 'rgba(255,255,255,0.15)' : 'var(--color-surface-2)', color: hasCritici ? '#fff' : 'var(--color-text-primary)', border: `1px solid ${hasCritici ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Vedi ordini in revisione
            </button>
          )}

          {/* Notifiche push */}
          {permesso === 'default' && (
            <button
              onClick={handleAttivaNotifiche}
              disabled={richiestaPermesso}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: 'transparent', color: hasCritici ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)', border: `1px solid ${hasCritici ? 'rgba(255,255,255,0.2)' : 'var(--color-border)'}`, cursor: 'pointer', fontSize: 11 }}
            >
              <Bell size={12} /> Attiva notifiche push
            </button>
          )}
          {permesso === 'granted' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: hasCritici ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)' }}>
              <Bell size={11} /> Notifiche push attive
            </div>
          )}
          {permesso === 'denied' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: hasCritici ? 'rgba(255,255,255,0.4)' : 'var(--color-text-muted)' }}>
              <BellOff size={11} /> Notifiche bloccate dal browser
            </div>
          )}
        </div>
      </div>

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: hasCritici ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)', flexShrink: 0, padding: 4, display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
    </>
  )
}
