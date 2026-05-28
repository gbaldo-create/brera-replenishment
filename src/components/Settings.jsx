import { useState, useEffect } from 'react'
import {
  Key, Brain, Trash2, Download, CheckCircle, Eye, EyeOff,
  RefreshCw, Clock, Building2, Globe, Lock, Unlock, Zap,
  ShoppingCart, AlertTriangle, Plus, X, ExternalLink, Copy, RotateCcw, Bell, BellOff
} from 'lucide-react'
import { requestNotifichePermesso, getNotifichePermesso, resetWelcome } from '../data/notificheService'
import Tooltip from './Tooltip'
import {
  getApiKey, setApiKey, clearApiKey, getMemoryStats, getHistory,
  clearAllMemory, exportMemory, getNormMemory, getBrandMemory
} from '../data/memoryStore'

// ─── Default fornitori ────────────────────────────────────────────────────────
const DEFAULT_FORNITORI = [
  { id: 'demauto',  nome: 'Demauto',        url: 'https://www.demauto.it',    username: '', password: '', attivo: false },
  { id: 'movidis',  nome: 'Movidis',        url: 'https://www.movidis.it',    username: '', password: '', attivo: false },
  { id: 'rhiag',    nome: 'Rhiag Hub',      url: 'https://www.rhiag.it',      username: '', password: '', attivo: false },
  { id: 'autodis',  nome: 'Autodis Italia', url: 'https://www.autodis.it',    username: '', password: '', attivo: false },
  { id: 'repar',    nome: 'Repar',          url: 'https://www.repar.it',      username: '', password: '', attivo: false },
]

function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

function loadFornitori() { return lsGet('brera_fornitori') || DEFAULT_FORNITORI }
function saveFornitori(f) { lsSet('brera_fornitori', f) }

// ─── Login Simulator Modal ────────────────────────────────────────────────────
function LoginSimulatorModal({ fornitore, offer, onClose, onConfirm }) {
  const [step, setStep] = useState('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qty, setQty] = useState(offer?.suggerimentoAcquisto || 1)

  // Simula occasionalmente un fallimento (20% probabilità in demo)
  const willFail = !fornitore.username || (Math.random() < 0.2 && retryCount === 0)

  useEffect(() => {
    if (fallbackMode) return
    const t1 = setTimeout(() => setStep('logged'), 1200)
    const t2 = setTimeout(() => {
      if (willFail && retryCount === 0) {
        setStep('error')
      } else {
        setStep('ordering')
      }
    }, 2400)
    const t3 = setTimeout(() => {
      if (step !== 'error') setStep('done')
    }, 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [retryCount, fallbackMode])

  function handleRetry() {
    setRetryCount(r => r + 1)
    setStep('connecting')
  }

  function handleFallback() {
    setFallbackMode(true)
    setStep('fallback')
  }

  function copyCode() {
    navigator.clipboard?.writeText(offer?.codiceFornitore || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const steps = [
    { key: 'connecting', label: `Connessione a ${fornitore.nome}...`, icon: Globe },
    { key: 'logged',     label: `Login con ${fornitore.username || 'account Brera'}`, icon: Unlock },
    { key: 'ordering',   label: 'Compilazione ordine automatica...', icon: ShoppingCart },
    { key: 'done',       label: 'Ordine confermato!', icon: CheckCircle },
  ]

  const currentStepIdx = steps.findIndex(s => s.key === step)

  return (
    <div className="modal-overlay" onClick={step === 'done' ? onClose : undefined}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={16} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Portale {fornitore.nome}</span>
          </div>
          {step === 'done' && <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>}
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Browser chrome */}
          <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#f87171','#fbbf24','#4ade80'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '3px 8px', fontSize: 10, color: 'var(--color-text-muted)' }}>
                🔒 {fornitore.url}/ordini/nuovo
              </div>
            </div>
            <div style={{ padding: '16px', minHeight: 80 }}>
              {step === 'done' ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <CheckCircle size={32} color="var(--color-orange)" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Ordine #{Math.floor(Math.random() * 90000) + 10000} confermato</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Riceverai conferma via email · Consegna: {offer?.leadTime || '24 ore'}
                  </div>
                </div>
              ) : fallbackMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '10px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 7, fontSize: 12, color: '#92400E' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Login automatico non riuscito</div>
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      Controlla che le credenziali in Impostazioni → Fornitori siano aggiornate.<br />
                      Completa l'ordine manualmente e poi clicca "Ho ordinato manualmente".
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checklist ordine manuale</div>
                  {[
                    `Apri ${fornitore.url} nel browser`,
                    `Cerca codice: ${offer?.codiceFornitore || '—'}`,
                    `Verifica descrizione e costruttore: ${offer?.costruttore || '—'}`,
                    `Inserisci quantità e aggiungi al carrello`,
                    'Completa il checkout e salva il numero ordine',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-orange)', flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                      <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {steps.slice(0, currentStepIdx + 1).map((s, i) => {
                    const Icon = s.icon
                    const isActive = i === currentStepIdx
                    const isDone = i < currentStepIdx
                    return (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                        {isActive ? (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                        ) : (
                          <CheckCircle size={16} color="var(--color-orange)" style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: isActive ? 600 : 400 }}>{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dettaglio ordine */}
          {offer && (
            <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Articolo:</span> <strong>{offer.codiceFornitore}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Brand:</span> <strong>{offer.costruttore}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Prezzo:</span> <strong style={{ color: 'var(--color-orange)' }}>€{parseFloat(offer.prezzoNetto || 0).toFixed(2)}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Consegna:</span> <strong>{offer.leadTime}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'done' ? (
            <>
              <button className="btn" onClick={onClose}>Chiudi</button>
              <Tooltip text="Registra l'ordine nel sistema Brera e passa all'articolo successivo">
                <button className="btn btn-primary" onClick={() => { onConfirm(); onClose() }}>
                  <CheckCircle size={13} /> Registra in Brera
                </button>
              </Tooltip>
            </>
          ) : fallbackMode ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
              <Tooltip text="Conferma che hai completato l'ordine manualmente sul portale">
                <button className="btn btn-primary" onClick={() => { onConfirm(); onClose() }}>
                  <CheckCircle size={13} /> Ho ordinato manualmente
                </button>
              </Tooltip>
            </>
          ) : step === 'error' ? (
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          ) : (
            <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Annulla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Fornitore Card ───────────────────────────────────────────────────────────
function FornitoreCard({ fornitore, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState(fornitore)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  function handleSave() {
    onUpdate(form)
    setEditing(false)
    setTestResult(null)
  }

  async function handleTest() {
    if (!form.username || !form.password) return
    setTesting(true)
    setTestResult(null)
    await new Promise(r => setTimeout(r, 1500))
    setTesting(false)
    // Simula successo se username e password sono compilati
    const ok = form.username.length > 2 && form.password.length > 2
    setTestResult(ok ? 'ok' : 'error')
    if (ok) onUpdate({ ...form, attivo: true })
  }

  const isConnected = fornitore.attivo && fornitore.username && fornitore.password

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: isConnected ? 'var(--color-orange-light)' : 'var(--color-surface-3)', border: `1px solid ${isConnected ? 'var(--color-orange-border)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color={isConnected ? 'var(--color-orange)' : 'var(--color-text-muted)'} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{fornitore.nome}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{fornitore.url}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isConnected ? (
            <span className="badge badge-ok"><CheckCircle size={9} /> Connesso</span>
          ) : (
            <span className="badge badge-std"><Lock size={9} /> Non configurato</span>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => setEditing(e => !e)}>
            {editing ? 'Annulla' : 'Configura'}
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Username</div>
              <input
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'Geist, sans-serif', outline: 'none', background: 'var(--color-surface)', boxSizing: 'border-box' }}
                placeholder="es. brera@email.it"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Password</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ width: '100%', padding: '6px 32px 6px 10px', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'Geist, sans-serif', outline: 'none', background: 'var(--color-surface)', boxSizing: 'border-box' }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          {testResult && (
            <div style={{ padding: '8px 12px', borderRadius: 6, fontSize: 11, background: testResult === 'ok' ? 'var(--color-orange-light)' : '#fee2e2', color: testResult === 'ok' ? 'var(--color-orange-text)' : '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
              {testResult === 'ok' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
              {testResult === 'ok' ? 'Connessione riuscita — credenziali salvate' : 'Credenziali non valide — riprova'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={handleTest} disabled={testing || !form.username || !form.password}>
              {testing ? (
                <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--color-orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> Test connessione</>
              ) : (
                <><Zap size={11} /> Test connessione</>
              )}
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              <CheckCircle size={11} /> Salva
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className={`kpi-card${accent ? ' accent' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="kpi-label">{label}</span>
        <Icon size={14} color={accent ? 'var(--color-orange)' : 'var(--color-text-muted)'} />
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

// ─── Notifiche Panel ─────────────────────────────────────────────────────────
function NotifichePanel() {
  const [permesso, setPermesso] = useState(getNotifichePermesso())
  const [loading, setLoading] = useState(false)

  async function richiedi() {
    setLoading(true)
    const p = await requestNotifichePermesso()
    setPermesso(p)
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Bell size={14} /> Notifiche push</span>
        {permesso === 'granted' && <span className="badge badge-ok"><CheckCircle size={9} /> Attive</span>}
        {permesso === 'denied' && <span className="badge badge-mismatch"><BellOff size={9} /> Bloccate</span>}
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Le notifiche push appaiono anche quando il browser è in background. Usate per: nuove urgenze all'avvio, conferma ordine, ordini in revisione, login fallito.
        </div>
        {permesso === 'default' && (
          <button className="btn btn-primary" onClick={richiedi} disabled={loading} style={{ width: 'fit-content' }}>
            {loading ? 'Richiesta in corso...' : <><Bell size={13} /> Attiva notifiche push</>}
          </button>
        )}
        {permesso === 'granted' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ padding: '8px 12px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 6, fontSize: 11, color: 'var(--color-orange-text)' }}>
              ✓ Notifiche attive — riceverai aggiornamenti in background
            </div>
            <button className="btn btn-sm btn-ghost" onClick={resetWelcome}>
              <RefreshCw size={11} /> Rivisualizza welcome
            </button>
          </div>
        )}
        {permesso === 'denied' && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Le notifiche sono state bloccate dal browser. Per riattivarle: clicca il lucchetto 🔒 nella barra URL → Notifiche → Consenti.
          </div>
        )}
        {permesso === 'not-supported' && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Questo browser non supporta le notifiche push.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Settings ────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('fornitori') // fornitori | api | memoria
  const [apiKey, setApiKeyState] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [normMem, setNormMem] = useState({})
  const [brandMem, setBrandMem] = useState({})
  const [confirmClear, setConfirmClear] = useState(false)
  const [fornitori, setFornitori] = useState(loadFornitori)

  useEffect(() => {
    setApiKeyState(getApiKey())
    refreshStats()
  }, [])

  function refreshStats() {
    setStats(getMemoryStats())
    setHistory(getHistory().slice(0, 20))
    setNormMem(getNormMemory())
    setBrandMem(getBrandMemory())
  }

  function handleSaveKey() { setApiKey(apiKey.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  function handleClearKey() { clearApiKey(); setApiKeyState('') }

  function handleExport() {
    const data = exportMemory()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `brera-memory-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function handleClearMemory() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearAllMemory(); setConfirmClear(false); refreshStats()
  }

  function updateFornitore(updated) {
    const next = fornitori.map(f => f.id === updated.id ? updated : f)
    setFornitori(next)
    saveFornitori(next)
  }

  const connessi = fornitori.filter(f => f.attivo && f.username && f.password).length
  const maskedKey = apiKey ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4) : ''

  const tabs = [
    { id: 'fornitori', label: `Fornitori (${connessi}/${fornitori.length})` },
    { id: 'api', label: 'API & AI' },
    { id: 'memoria', label: `Memoria (${stats?.normCount || 0})` },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

      <div className="page-header" style={{ padding: 0, border: 'none', background: 'none' }}>
        <div>
          <h1 className="page-title">Impostazioni</h1>
          <p className="page-subtitle">Fornitori, API key Anthropic, Memoria AI</p>
        </div>
        <button className="btn btn-ghost" onClick={refreshStats}><RefreshCw size={13} /> Aggiorna</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface-2)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.12s', background: tab === t.id ? 'var(--color-surface)' : 'transparent', color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)', boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB FORNITORI ─────────────────────────────────────────────────── */}
      {tab === 'fornitori' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="alert alert-neutral" style={{ fontSize: 11 }}>
            <Lock size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-text-muted)' }} />
            <div>
              Le credenziali sono salvate solo nel browser (localStorage) e non vengono mai trasmesse a terzi.
              In produzione verranno usate dal backend locale per il login automatico sui portali.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
            <StatCard label="Fornitori configurati" value={connessi} sub={`di ${fornitori.length} disponibili`} icon={Building2} accent={connessi > 0} />
            <StatCard label="Login automatico" value={connessi > 0 ? 'Attivo' : 'Non attivo'} sub="simulato in demo" icon={Zap} accent={connessi > 0} />
          </div>

          {fornitori.map(f => (
            <FornitoreCard key={f.id} fornitore={f} onUpdate={updateFornitore} />
          ))}
        </div>
      )}

      {/* ── TAB API ──────────────────────────────────────────────────────── */}
      {tab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notifiche push */}
          <NotifichePanel />
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Key size={14} /> Chiave API Anthropic</span>
              {getApiKey() && <span className="badge badge-ok"><CheckCircle size={9} /> Configurata</span>}
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="alert alert-neutral" style={{ fontSize: 11 }}>
                <Key size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-text-muted)' }} />
                <div>Salvata solo nel browser. Usata per i suggerimenti AI in Normalizzazione. Senza key le revisioni manuali funzionano comunque.</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKeyState(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    style={{ width: '100%', padding: '8px 40px 8px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'Geist Mono, monospace', outline: 'none', background: 'var(--color-surface-2)', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                  <button style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setShowKey(s => !s)}>
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className={`btn ${saved ? 'btn-primary' : ''}`} onClick={handleSaveKey}>
                  {saved ? <><CheckCircle size={13} /> Salvata!</> : 'Salva'}
                </button>
                {getApiKey() && <button className="btn btn-ghost" onClick={handleClearKey}><Trash2 size={13} /></button>}
              </div>
              {getApiKey() && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>Attiva: {maskedKey}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB MEMORIA ──────────────────────────────────────────────────── */}
      {tab === 'memoria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <StatCard label="Codici Appresi" value={stats.normCount} sub="normalizzazioni" icon={Brain} accent={stats.normCount > 0} />
              <StatCard label="Brand" value={stats.brandCount} sub="prefissi → brand" icon={Brain} accent={stats.brandCount > 0} />
              <StatCard label="Famiglie" value={stats.familyCount} sub="ERP ↔ TecDoc" icon={Brain} />
              <StatCard label="Eventi" value={stats.historyCount} sub="cronologia" icon={Clock} />
            </div>
          )}

          {Object.keys(brandMem).length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><Brain size={14} /> Brand Appresi</span></div>
              <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(brandMem).map(([pfx, brand]) => (
                  <div key={pfx} style={{ padding: '4px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }}>
                    <span className="font-mono" style={{ fontWeight: 700 }}>{pfx}</span>
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 6px' }}>→</span>
                    <span>{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(normMem).length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><Brain size={14} /> Codici in Memoria</span><span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{Object.keys(normMem).length}</span></div>
              <div style={{ overflow: 'auto', maxHeight: 280 }}>
                <table className="data-table">
                  <thead><tr><th>Codice Madre</th><th>Normalizzato</th><th>Brand</th><th>ERP</th><th>TecDoc</th><th>Conferme</th><th>Data</th></tr></thead>
                  <tbody>
                    {Object.entries(normMem).map(([cod, data]) => (
                      <tr key={cod}>
                        <td><div className="cell"><span className="font-mono" style={{ fontSize: 11 }}>{cod}</span></div></td>
                        <td><div className="cell"><span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-orange)' }}>{data.codiceNormalizzato}</span></div></td>
                        <td><div className="cell" style={{ fontSize: 11 }}>{data.brandRilevato || '—'}</div></td>
                        <td><div className="cell" style={{ fontSize: 11 }}>{data.famigliaERP || '—'}</div></td>
                        <td><div className="cell" style={{ fontSize: 11 }}>{data.famigliaTecDoc || '—'}</div></td>
                        <td><div className="cell" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-orange)' }}>{data.confirmedCount || 1}</div></td>
                        <td><div className="cell" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{data.timestamp ? new Date(data.timestamp).toLocaleDateString('it-IT') : '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><Clock size={14} /> Cronologia</span></div>
              <div style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, padding: '4px 0', borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: ev.type === 'norm_confirmed' ? 'var(--color-orange-light)' : 'var(--color-surface-3)', color: ev.type === 'norm_confirmed' ? 'var(--color-orange-text)' : 'var(--color-text-muted)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                      {ev.type === 'norm_confirmed' ? 'NORM' : ev.type === 'brand_learned' ? 'BRAND' : 'FAMILY'}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{ev.data.codiceMadre || ev.data.prefisso}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{ev.data.codiceNormalizzato || ev.data.brand || ev.data.tecdoc}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 10 }}>{new Date(ev.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.normCount === 0 && stats?.brandCount === 0 && (
            <div className="empty-state">
              <Brain size={32} />
              <span>Memoria vuota. Conferma revisioni in Normalizzazione per iniziare ad apprendere.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={handleExport}><Download size={13} /> Esporta JSON</button>
            <button className={`btn ${confirmClear ? 'btn-primary' : 'btn-ghost'}`} style={{ color: confirmClear ? '#fff' : 'var(--color-orange-text)' }} onClick={handleClearMemory}>
              <Trash2 size={13} /> {confirmClear ? 'Conferma cancellazione' : 'Cancella memoria'}
            </button>
            {confirmClear && <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Annulla</button>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Export del LoginSimulatorModal per uso in Workstation ────────────────────
export { LoginSimulatorModal }
