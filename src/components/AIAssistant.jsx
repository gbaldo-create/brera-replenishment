import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Settings, Clock, ChevronDown, ChevronUp, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { askAI, buildArticleContext, getGeneralInstructions, saveGeneralInstructions, getPromptHistory } from '../data/aiPrompts'
import { getApiKey } from '../data/memoryStore'

// ─── Messaggio chat ───────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--color-surface-3)' : 'var(--color-orange)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800,
        color: isUser ? 'var(--color-text-muted)' : '#fff',
      }}>
        {isUser ? 'C' : '✦'}
      </div>
      <div style={{
        flex: 1, padding: '10px 14px', borderRadius: 8,
        background: isUser ? 'var(--color-surface-2)' : 'var(--color-surface)',
        border: `1px solid ${isUser ? 'var(--color-border)' : 'var(--color-orange-border)'}`,
        fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-primary)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.loading && (
          <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-orange)', animation: `bounce 0.8s ${i * 0.15}s infinite` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tab Istruzioni Generali ──────────────────────────────────────────────────
function GeneralInstructionsTab() {
  const [text, setText] = useState(getGeneralInstructions)
  const [saved, setSaved] = useState(false)

  const suggestions = [
    'Per i dischi freno usa sempre Brembo se disponibile in filiale locale',
    'Per i filtri olio preferisco la linea Economico se il prezzo è sotto €3',
    'Evita fornitori con sede solo centrale se urgenza è Prioritaria',
    'Per le pastiglie freno usa Textar o Ferodo come prima scelta',
    'Se c\'è promo >30% acquista scorta per 3 mesi anche se non urgente',
    'Per batterie usa sempre Varta o Bosch, mai economico',
  ]

  function handleSave() {
    saveGeneralInstructions(text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        Scrivi le regole operative di Brera. L'AI le userà come contesto per tutte le analisi. Es: brand preferiti per categoria, soglie prezzo, criteri logistica.
      </div>

      {/* Suggerimenti rapidi */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
          Suggerimenti rapidi — clicca per aggiungere
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((s, i) => (
            <button key={i}
              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-orange)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              onClick={() => setText(t => t ? t + '\n' + s : s)}
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Es: Per i freni usa sempre Brembo se disponibile in filiale locale entro lead time di 4 ore. Per i filtri olio preferisco la linea Economico sotto €3. Evita ordini da sede centrale se l'urgenza è Prioritaria..."
        style={{
          flex: 1, minHeight: 200, padding: '10px 12px', fontSize: 12,
          border: '1px solid var(--color-border)', borderRadius: 8,
          fontFamily: 'Geist, sans-serif', lineHeight: 1.7,
          outline: 'none', resize: 'none',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
      />

      <button className={`btn ${saved ? 'btn-primary' : 'btn-primary'}`} style={{ justifyContent: 'center' }} onClick={handleSave}>
        {saved ? <><CheckCircle size={13} /> Salvate!</> : <><Save size={13} /> Salva istruzioni</>}
      </button>

      {text && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          ✓ {text.split('\n').filter(l => l.trim()).length} regole configurate — verranno iniettate in ogni analisi AI
        </div>
      )}
    </div>
  )
}

// ─── Tab Chat sul pezzo ───────────────────────────────────────────────────────
function ArticleChatTab({ row, offers, normData }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showContext, setShowContext] = useState(false)
  const bottomRef = useRef(null)
  const hasApiKey = !!getApiKey()

  const context = row ? buildArticleContext(row, offers, normData) : null

  const quickPrompts = [
    'Quale offerta sceglieresti e perché?',
    'Ci sono rischi in queste offerte che non vedo?',
    'Il prezzo è in linea con il mercato?',
    'Conviene fare scorta o ordinare il minimo?',
    'Quale costruttore è più affidabile per questo tipo di articolo?',
    'Il lead time di questo fornitore è accettabile con questa urgenza?',
  ]

  useEffect(() => {
    if (row && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Ciao! Ho il contesto completo su ${row.codiceMadre} (${row.gruppoMerceologico}, ${row.urgenza}). Cosa vuoi sapere su questo articolo?`,
      }])
    }
  }, [row?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(promptText) {
    const text = promptText || input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: text }
    const loadingMsg = { role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    try {
      const generalInstr = getGeneralInstructions()
      const risposta = await askAI(text, context, generalInstr || null)
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: risposta }
        return next
      })
    } catch (e) {
      setMessages(prev => prev.slice(0, -1))
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!row) {
    return (
      <div className="empty-state">
        <Sparkles size={28} color="var(--color-orange)" />
        <span>Seleziona un articolo nella Workstation per analizzarlo</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* Contesto articolo collassabile */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 12, overflow: 'hidden', flexShrink: 0 }}>
        <button
          style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}
          onClick={() => setShowContext(s => !s)}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)' }} />
          Contesto: {row.codiceMadre} · {row.gruppoMerceologico} · {row.urgenza}
          <span style={{ marginLeft: 'auto' }}>{showContext ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
        </button>
        {showContext && (
          <pre style={{ padding: '10px 12px', fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'Geist Mono, monospace', lineHeight: 1.6, margin: 0, overflowX: 'auto', background: 'var(--color-surface)' }}>
            {context}
          </pre>
        )}
      </div>

      {/* Prompt rapidi */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, flexShrink: 0 }}>
          {quickPrompts.map((p, i) => (
            <button key={i}
              style={{ fontSize: 10, padding: '4px 9px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-orange)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
              onClick={() => send(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messaggi */}
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 4 }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {error && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <AlertTriangle size={13} />
            {error.includes('CORS') || error.includes('fetch') ? 'Errore di rete — verifica la connessione e la API key in Impostazioni' : error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!hasApiKey && (
        <div style={{ padding: '8px 12px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 6, fontSize: 11, color: 'var(--color-orange-text)', marginBottom: 8, flexShrink: 0 }}>
          ⚠ Configura la API key in Impostazioni → API & AI per attivare la chat
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={hasApiKey ? 'Scrivi la tua domanda su questo articolo...' : 'API key richiesta'}
          disabled={!hasApiKey || loading}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 12,
            border: '1px solid var(--color-border)', borderRadius: 8,
            fontFamily: 'Geist, sans-serif', outline: 'none',
            background: hasApiKey ? 'var(--color-surface)' : 'var(--color-surface-2)',
            opacity: hasApiKey ? 1 : 0.6,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
        <button
          className="btn btn-primary btn-icon"
          style={{ padding: '8px 14px', opacity: (!input.trim() || !hasApiKey || loading) ? 0.5 : 1 }}
          disabled={!input.trim() || !hasApiKey || loading}
          onClick={() => send()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Tab Storico ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const history = getPromptHistory()

  if (history.length === 0) {
    return <div className="empty-state"><Clock size={24} /><span style={{ fontSize: 12 }}>Nessuna conversazione ancora</span></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
      {history.map((h, i) => (
        <div key={i} style={{ padding: '10px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {h.hasContext && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-orange-light)', color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)' }}>SUL PEZZO</span>}
            <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{new Date(h.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>D: {h.prompt}</div>
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>R: {h.risposta?.slice(0, 200)}{h.risposta?.length > 200 ? '...' : ''}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main AIAssistant Panel ───────────────────────────────────────────────────
export default function AIAssistant({ row, offers, normData, onClose }) {
  const [tab, setTab] = useState('chat')

  const tabs = [
    { id: 'chat', label: '✦ Sul pezzo' },
    { id: 'general', label: '⚙ Istruzioni generali' },
    { id: 'history', label: '🕐 Storico' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>AI Assistant</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Claude · Analisi articoli e regole operative</div>
        </div>
        {onClose && <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600,
              border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--color-orange)' : '2px solid transparent',
              background: 'transparent', color: tab === t.id ? 'var(--color-orange)' : 'var(--color-text-muted)',
              transition: 'all 0.12s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
        {tab === 'chat' && <ArticleChatTab row={row} offers={offers} normData={normData} />}
        {tab === 'general' && <GeneralInstructionsTab />}
        {tab === 'history' && <HistoryTab />}
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
