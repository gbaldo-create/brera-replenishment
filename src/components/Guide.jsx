import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronRight, ChevronDown, BookOpen, Sparkles, X, Zap, Brain, CheckCircle, Home, RefreshCw, Save, Settings, Wrench, SlidersHorizontal, ClipboardList, Tag, FolderOpen, ShoppingCart, FlaskConical, Lightbulb, Radar, Key, PlayCircle } from 'lucide-react'
import { sections, VERSION, quickStart, aiCapabilities } from '../data/guideContent'


// ─── Mappa icone Lucide per la guida ─────────────────────────────────────────
const LUCIDE_ICONS = {
  Home, Zap, Sparkles, Brain, RefreshCw, Save, Settings, Wrench,
  SlidersHorizontal, BookOpen, ClipboardList, Tag, FolderOpen,
  Search, ShoppingCart, FlaskConical, Lightbulb, Radar, Key,
}
function GuideIcon({ name, size = 16, color = 'var(--color-orange)' }) {
  const Icon = LUCIDE_ICONS[name]
  if (!Icon) return <span style={{ fontSize: size }}>{name}</span>
  return <Icon size={size} color={color} />
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CodeBlock({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      <pre style={{ background: '#1a1a1a', color: '#F97316', padding: '12px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'Geist Mono, monospace', lineHeight: 1.7, overflow: 'auto', margin: 0 }}>{text}</pre>
      <button onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, padding: '3px 8px', cursor: 'pointer' }}>
        {copied ? '✓ Copiato' : 'Copia'}
      </button>
    </div>
  )
}

function Content({ text, isCode }) {
  if (isCode) return <CodeBlock text={text} />
  return (
    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
      {text.split('\n').map((line, i) => {
        if (/^[A-ZÀÈÌÒÙÉ\s\/]{4,}:/.test(line)) {
          const [label, ...rest] = line.split(':')
          return <div key={i} style={{ marginTop: i > 0 ? 6 : 0 }}><strong style={{ color: 'var(--color-text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}:</strong><span>{rest.join(':')}</span></div>
        }
        if (line.startsWith('—')) return <div key={i} style={{ display: 'flex', gap: 8, marginTop: 3 }}><span style={{ color: 'var(--color-orange)', flexShrink: 0 }}>—</span><span>{line.slice(1)}</span></div>
        if (/^\d+\./.test(line)) return <div key={i} style={{ display: 'flex', gap: 8, marginTop: 4 }}><span style={{ color: 'var(--color-orange)', fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{line.match(/^\d+/)[0]}.</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>
        return <div key={i} style={{ marginTop: line === '' ? 8 : 0 }}>{line}</div>
      })}
    </div>
  )
}

function Subsection({ sub, isOpen, onToggle, searchQuery }) {
  const highlight = searchQuery && (sub.title.toLowerCase().includes(searchQuery.toLowerCase()) || sub.content.toLowerCase().includes(searchQuery.toLowerCase()))
  return (
    <div style={{ border: `1px solid ${highlight ? 'var(--color-orange)' : 'var(--color-border)'}`, borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '12px 16px', background: isOpen ? 'var(--color-surface-2)' : 'var(--color-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{sub.title}</span>
          {sub.isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--color-orange)', color: '#fff' }}>NUOVO</span>}
        </div>
        {isOpen ? <ChevronDown size={14} color="var(--color-text-muted)" /> : <ChevronRight size={14} color="var(--color-text-muted)" />}
      </button>
      {isOpen && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <Content text={sub.content} isCode={sub.code} />
        </div>
      )}
    </div>
  )
}

// ─── VIEW: Quick Start ────────────────────────────────────────────────────────
function QuickStartView({ onStartTour }) {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 740 }}>

      {/* Hero */}
      <div style={{ padding: '28px 32px', background: 'var(--color-text-primary)', borderRadius: 14, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Zap size={24} color="#F97316" />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{quickStart.title}</h1>
          {onStartTour && (
            <button
              onClick={onStartTour}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 8,
                border: '1px solid rgba(249,115,22,0.4)',
                background: 'rgba(249,115,22,0.08)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: '#F97316', marginTop: 4,
              }}
            >
              <PlayCircle size={14} /> Rivedi il tour guidato
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
          Segui questi 5 passi e sarai operativo in meno di 5 minuti. Nessuna configurazione obbligatoria per iniziare.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {quickStart.steps.map((step, idx) => (
          <div key={step.n} style={{ display: 'flex', gap: 0 }}>
            {/* Left: numero + linea */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GuideIcon name={step.icon} size={18} color='#fff' />
              </div>
              {idx < quickStart.steps.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--color-border)', margin: '6px 0' }} />
              )}
            </div>

            {/* Right: contenuto */}
            <div style={{ flex: 1, paddingLeft: 16, paddingBottom: idx < quickStart.steps.length - 1 ? 24 : 0, paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text-primary)' }}>{step.title}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>~{step.time}</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Cosa fare</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{step.action}</div>
              </div>
              <div style={{ padding: '8px 14px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-orange-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Risultato atteso</div>
                <div style={{ fontSize: 12, color: 'var(--color-orange-text)' }}>{step.result}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Consigli per le prime sessioni
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quickStart.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}><GuideIcon name={tip.icon} size={14} color='var(--color-orange)' /></span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── VIEW: AI Capabilities ────────────────────────────────────────────────────
function AIGuideView() {
  const [openCategory, setOpenCategory] = useState('analisi')

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Hero */}
      <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #0F0F0F 0%, #1a1a1a 100%)', borderRadius: 14, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{aiCapabilities.title}</h1>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.7 }}>
          {aiCapabilities.subtitle}
        </p>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { value: '12', label: 'Moduli AI' },
            { value: '∞', label: 'Chat contestuale' },
            { value: '0', label: 'Configurazione iniziale' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F97316' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How to optimize */}
      <div style={{ padding: '18px 20px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Brain size={18} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 8 }}>Come ottimizzare l\'AI nel tempo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { step: '1', text: 'Prima sessione — Usa la Workstation normalmente in modalità Manuale. L\'AI osserva le tue scelte senza interrompere.' },
                { step: '2', text: 'Sessione 2-5 — Attiva modalità ✦ AI. Valuta i suggerimenti, confermali o ignorali. Ogni conferma affina il modello.' },
                { step: '3', text: 'Scrivi le Istruzioni Generali — Pannello AI → Istruzioni. Aggiungi le regole di Brera (brand preferiti, soglie prezzo). L\'AI le usa come priorità assoluta.' },
                { step: '4', text: 'Sessione 10+ — I codici ricorrenti vengono normalizzati automaticamente. Il fornitore suggerito è quello giusto il 80%+ delle volte.' },
                { step: '5', text: 'Sessione 30+ — L\'AI conosce le preferenze complete di Claudio. Può elaborare autonomamente le urgenze standard, Claudio gestisce solo le eccezioni.' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{step}</div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {aiCapabilities.categories.map(cat => (
        <div key={cat.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Category header */}
          <button
            onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
            style={{ width: '100%', padding: '14px 18px', background: openCategory === cat.id ? 'var(--color-surface-2)' : 'var(--color-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
          >
            <span style={{ fontSize: 20 }}>{cat.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{cat.title}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{cat.items.length} funzionalità</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {cat.items.slice(0, 4).map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, opacity: 0.3 + (i / 4 * 0.7) }} />
                ))}
              </div>
              {openCategory === cat.id ? <ChevronDown size={16} color="var(--color-text-muted)" /> : <ChevronRight size={16} color="var(--color-text-muted)" />}
            </div>
          </button>

          {/* Items */}
          {openCategory === cat.id && (
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              {cat.items.map((item, i) => (
                <div key={i} style={{ padding: '14px 18px', borderBottom: i < cat.items.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{item.title}</span>
                      {item.modulo && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                          MOD. {item.modulo}
                        </span>
                      )}
                      {item.requires && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--color-orange-light)', color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)' }}>
                          API KEY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{item.desc}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={9} color="var(--color-orange)" />
                      <span style={{ fontStyle: 'italic' }}>{item.trigger}</span>
                    </div>
                  </div>
                  <CheckCircle size={16} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding: '16px 20px', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
        Tutte le funzionalità con <strong>MOD.</strong> funzionano con le euristiche locali anche senza API key.<br />
        Le funzionalità con badge <strong style={{ color: 'var(--color-orange)' }}>API KEY</strong> richiedono la chiave Anthropic in <strong>Impostazioni → API & AI</strong>.
      </div>
    </div>
  )
}

// ─── VIEW: Guida completa ─────────────────────────────────────────────────────
function FullGuideView({ search = '', onClearSearch }) {
  const [openSubs, setOpenSubs] = useState(['ws-cosa', 'ws-modalita'])
  const [activeSection, setActiveSection] = useState('workstation')
  const sectionRefs = useRef({})

  function toggleSub(id) { setOpenSubs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]) }
  function expandAll() { setOpenSubs(sections.flatMap(s => s.subsections.map(sub => sub.id))) }
  function collapseAll() { setOpenSubs([]) }
  function scrollTo(sectionId) {
    setActiveSection(sectionId)
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const section = sections.find(s => s.id === sectionId)
    if (section?.subsections?.[0]) setOpenSubs(prev => [...new Set([...prev, section.subsections[0].id])])
  }

  const filteredSections = useMemo(() => {
    if (!search) return sections
    const q = search.toLowerCase()
    return sections.map(section => ({
      ...section,
      subsections: section.subsections.filter(sub => sub.title.toLowerCase().includes(q) || sub.content.toLowerCase().includes(q)),
    })).filter(s => s.subsections.length > 0 || s.title.toLowerCase().includes(q))
  }, [search])

  useEffect(() => {
    if (search.trim()) {
      setOpenSubs(filteredSections.flatMap(s => s.subsections.map(sub => sub.id)))
    }
  }, [search, filteredSections.length])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 200, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>Sezioni</div>
        </div>
        {sections.map(section => (
          <button key={section.id} onClick={() => scrollTo(section.id)}
            style={{ width: '100%', padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left', background: activeSection === section.id ? 'var(--color-surface-2)' : 'transparent', borderLeft: `3px solid ${activeSection === section.id ? 'var(--color-orange)' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => { if (activeSection !== section.id) e.currentTarget.style.background = 'var(--color-surface-2)' }}
            onMouseLeave={e => { if (activeSection !== section.id) e.currentTarget.style.background = 'transparent' }}
          >
            <GuideIcon name={section.icon} size={13} />
            <span style={{ fontSize: 11, fontWeight: activeSection === section.id ? 700 : 500, color: activeSection === section.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', flex: 1 }}>{section.title}</span>
            {section.isNew && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-orange)', flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {search && <div style={{ fontSize: 11, color: 'var(--color-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={11} /> {filteredSections.reduce((n, s) => n + s.subsections.length, 0)} risultati per "{search}"
            {onClearSearch && <button onClick={onClearSearch} style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: 4 }}>cancella</button>}
          </div>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-ghost" onClick={expandAll}>Espandi</button>
            <button className="btn btn-sm btn-ghost" onClick={collapseAll}>Comprimi</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {filteredSections.map(section => (
            <div key={section.id} ref={el => sectionRefs.current[section.id] = el}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 10px', borderBottom: '2px solid var(--color-orange)', marginBottom: 12 }}>
                <GuideIcon name={section.icon} size={15} />
                <h2 style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{section.title}</h2>
                {section.isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--color-orange)', color: '#fff' }}>NUOVO</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.subsections.map(sub => (
                  <Subsection key={sub.id} sub={sub} isOpen={openSubs.includes(sub.id)} onToggle={() => toggleSub(sub.id)} searchQuery={search} />
                ))}
              </div>
            </div>
          ))}
          {filteredSections.length === 0 && <div className="empty-state"><Search size={28} /><span>Nessun risultato per "{search}"</span><button className="btn" onClick={() => setSearch('')}>Azzera</button></div>}
          <div style={{ padding: '16px 20px', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Brera Replenishment {VERSION}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Guida integrata · Si aggiorna automaticamente ad ogni nuova versione</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Guide ───────────────────────────────────────────────────────────────
export default function Guide({ onStartTour }) {
  const [activeView, setActiveView] = useState('quickstart')
  const [search, setSearch] = useState('')

  const newCount = sections.flatMap(s => s.subsections).filter(sub => sub.isNew).length

  const tabs = [
    { id: 'quickstart', icon: <Zap size={13} />, label: 'Quick Start', desc: 'Operativo in 5 minuti' },
    { id: 'ai', icon: <Sparkles size={13} />, label: 'Guida AI', desc: 'Tutto ciò che puoi fare' },
    { id: 'guida', icon: <BookOpen size={13} />, label: 'Guida completa', desc: `${sections.length} sezioni · ${newCount} novità` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab header */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 24px', display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 20, marginRight: 8, borderRight: '1px solid var(--color-border)' }}>
          <BookOpen size={15} color="var(--color-orange)" />
          <span style={{ fontWeight: 800, fontSize: 13 }}>Documentazione</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{VERSION}</span>
        </div>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', border: 'none', cursor: 'pointer',
              background: 'transparent', borderBottom: `2px solid ${activeView === tab.id ? 'var(--color-orange)' : 'transparent'}`,
              color: activeView === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (activeView !== tab.id) e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { if (activeView !== tab.id) e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <span style={{ color: activeView === tab.id ? 'var(--color-orange)' : 'inherit' }}>{tab.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{tab.label}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search bar globale */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--color-border)', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div className="search-input-wrap" style={{ maxWidth: 360 }}>
          <Search size={13} />
          <input
            className="search-input"
            placeholder="Cerca in tutta la documentazione..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (e.target.value.trim()) setActiveView('guida')
            }}
            style={{ borderRadius: 8 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={13} /></button>}
        </div>
        {search && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Premi Invio o naviga i risultati nella Guida completa</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeView === 'quickstart' && <QuickStartView onStartTour={onStartTour} />}
        {activeView === 'ai' && <AIGuideView />}
        {activeView === 'guida' && <FullGuideView search={search} onClearSearch={() => setSearch('')} />}
      </div>
    </div>
  )
}
