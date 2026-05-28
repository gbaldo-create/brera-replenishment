import { useState } from 'react'
import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { X, ShoppingCart } from 'lucide-react'
import { useAppState } from './hooks/useAppState'
import { normalizationsLog, supplierOffers, computeScore, reorderReportRows } from './data/mockData'

import Navbar from './components/Navbar'
import OnboardingTour from './components/OnboardingTour'
import Overview from './components/Overview'
import ReportInput from './components/ReportInput'
import NormalizationLab from './components/NormalizationLab'
import FabbisogniQueue from './components/FabbisogniQueue'
import SupplierScouting from './components/SupplierScouting'
import RankingDecision from './components/RankingDecision'
import { Explainability } from './components/Explainability'
import OrderWindow from './components/OrderWindow'
import OrderOutcome from './components/OrderOutcome'
import PromptOptimizer from './components/PromptOptimizer'
import TaskBoard from './components/TaskBoard'
import Settings from './components/Settings'
import Workstation from './components/Workstation'
import { ToastProvider } from './components/ToastNotifications'
import Tooltip from './components/Tooltip'
import Guide from './components/Guide'
import WelcomeBanner from './components/WelcomeBanner'
import OrdiniRegistro from './components/OrdiniRegistro'
import BrandConfig from './components/BrandConfig'
import EndOfDayReport from './components/EndOfDayReport'

// ─── Row Detail Drawer ────────────────────────────────────────────────────────
function RowDrawer({ row, onClose, onOpenOrder, normOverrides }) {
  if (!row) return null
  const norm = normalizationsLog[row.codiceMadre]
  const override = normOverrides?.[row.id]
  const offers = supplierOffers[row.codiceMadre] || []
  const ranked = [...offers].sort((a, b) => computeScore(b, row) - computeScore(a, row))
  const best = ranked[0]

  const displayCodice = override?.codiceNormalizzato ?? norm?.codiceNormalizzato ?? row.codiceMadre
  const displayBrand = override?.brandRilevato ?? norm?.brandRilevato ?? '—'
  const displayERP = override?.famigliaERP ?? norm?.famigliaERP ?? row.gruppoMerceologico
  const displayTecDoc = override?.famigliaTecDoc ?? norm?.famigliaTecDoc ?? ''
  const displayConf = override?.confermato ? 100 : (norm?.confidence ?? row._conf ?? 95)
  const displayNote = override?.note ?? norm?.azione ?? ''

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{row.codiceMadre}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {row.id} · {row.gruppoMerceologico} · {row.lineaProdotto}
              {override?.confermato && <span style={{ color: 'var(--color-orange)', marginLeft: 8 }}>✓ Revisionato</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Normalizzazione */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>Normalizzazione</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="code-before">{row.codiceMadre}</span>
              <span className="code-arrow">→</span>
              <span className="code-after" style={{ color: override ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{displayCodice}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
              <span>Brand: <strong>{displayBrand}</strong></span>
              <span>Conf.: <strong style={{ color: displayConf >= 90 ? 'inherit' : 'var(--color-orange)' }}>{displayConf}%</strong></span>
              <span>ERP: <strong>{displayERP}</strong></span>
              <span>TecDoc: <strong style={{ color: displayTecDoc.includes('CONFLITTO') && !override ? 'var(--color-orange-text)' : 'inherit' }}>{displayTecDoc || '—'}</strong></span>
            </div>
            {displayNote && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{displayNote}</div>
            )}
            {norm?.warning && !override && (
              <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--color-orange-light)', borderRadius: 6, fontSize: 11, color: 'var(--color-orange-text)', border: '1px solid var(--color-orange-border)' }}>
                ⚠ {norm.warning}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>Stock & Fabbisogno</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Giacenza', value: row.giacenza, warn: row.giacenza === 0 },
                { label: 'Transito', value: row.merceInTransito },
                { label: 'Suggerito', value: row.suggerimentoAcquisto, accent: true },
              ].map(({ label, value, warn, accent }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'var(--color-surface-2)', borderRadius: 6 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: warn ? 'var(--color-orange-text)' : accent ? 'var(--color-orange)' : 'var(--color-text-primary)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Best offer */}
          {best && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Offerta Migliore — Score {computeScore(best, row)}/100
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{best.fornitore}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{best.brand} · {best.livelloQualitativo}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{best.logistica} · {best.leadTime}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>€{best.prezzoNetto.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>netto</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>{row.noteERP}</div>
        </div>

        <div className="drawer-footer">
          {best && (
            <button className="btn btn-primary" onClick={() => { onClose(); onOpenOrder && onOpenOrder(best, row) }}>
              <ShoppingCart size={13} /> Ordina ora
            </button>
          )}
          <button className="btn" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </>
  )
}

// ─── Order Modal ──────────────────────────────────────────────────────────────
function OrderModal({ data, onClose, onConfirm }) {
  const navigate = useNavigate()
  const [qty, setQty] = useState(data?.row?.suggerimentoAcquisto || 1)

  if (!data) return null
  const { offer, row } = data
  const suggerito = row.suggerimentoAcquisto || 1
  const totale = qty * offer.prezzoNetto
  const isSuggerito = qty === suggerito

  function changeQty(delta) {
    setQty(q => Math.max(1, q + delta))
  }

  function handle(tipo) {
    onConfirm(offer.id, row.id, tipo, qty)
    navigate('/esito', { state: { reqId: row.id, tipo } })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Conferma Ordine — {offer.fornitore}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Dettagli articolo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            {[
              { label: 'Articolo', value: row.codiceMadre },
              { label: 'Fornitore', value: offer.fornitore },
              { label: 'Brand', value: offer.brand },
              { label: 'Linea', value: offer.livelloQualitativo },
              { label: 'Prezzo unitario', value: `€${offer.prezzoNetto.toFixed(2)}` },
              { label: 'Lead time', value: offer.leadTime || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Quantità modificabile */}
          <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Quantità</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Suggerita: <strong style={{ color: 'var(--color-text-primary)' }}>{suggerito} pz</strong>
                  {!isSuggerito && (
                    <button
                      onClick={() => setQty(suggerito)}
                      style={{ marginLeft: 8, fontSize: 10, color: 'var(--color-orange)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      ripristina
                    </button>
                  )}
                </div>
              </div>
              {/* Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border-strong)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface)' }}>
                <button
                  onClick={() => changeQty(-1)}
                  disabled={qty <= 1}
                  style={{ width: 34, height: 34, border: 'none', background: 'none', cursor: qty <= 1 ? 'not-allowed' : 'pointer', fontSize: 18, fontWeight: 300, color: qty <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (qty > 1) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >−</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: 52, height: 34, border: 'none', textAlign: 'center', fontSize: 15, fontWeight: 700, fontFamily: 'Geist Mono, monospace', background: 'transparent', color: isSuggerito ? 'var(--color-text-primary)' : 'var(--color-orange)', outline: 'none' }}
                />
                <button
                  onClick={() => changeQty(1)}
                  style={{ width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 300, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >+</button>
              </div>
            </div>
            {!isSuggerito && (
              <div style={{ fontSize: 10, color: 'var(--color-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--color-orange-light)', borderRadius: 5, border: '1px solid var(--color-orange-border)' }}>
                ⚠ Quantità modificata rispetto al suggerimento ERP ({suggerito} pz)
              </div>
            )}
          </div>

          {/* Totale */}
          <div style={{ padding: '12px 14px', background: qty !== suggerito ? 'var(--color-orange-light)' : 'var(--color-surface-2)', borderRadius: 8, border: `1px solid ${qty !== suggerito ? 'var(--color-orange-border)' : 'var(--color-border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Totale ordine</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{qty} pz × €{offer.prezzoNetto.toFixed(2)}</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-orange)', fontFamily: 'Geist Mono, monospace', transition: 'all 0.15s' }}>
              €{totale.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn" onClick={() => handle('revisione')}>Invia a Revisione</button>
          <button className="btn btn-primary" onClick={() => handle('acquistato')}>
            <ShoppingCart size={13} /> Conferma Ordine
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Data Mode Banner — sempre visibile ──────────────────────────────────────
function DataModeBanner({ fileName, rowCount, onClear, onLoadFile }) {
  const fileRef = React.useRef()
  const isReal = !!fileName

  if (isReal) {
    return (
      <div style={{
        background: '#0F0F0F', color: '#fff',
        padding: '5px 20px', fontSize: 11,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        borderBottom: '1px solid rgba(249,115,22,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.3)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.06em' }}>DATI REALI</span>
        </div>
        <span style={{ flex: 1, color: 'rgba(255,255,255,0.7)' }}>
          <strong style={{ color: '#fff' }}>{fileName}</strong>
          <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>· {rowCount} righe attive in tutte le schermate</span>
        </span>
        <button
          onClick={() => fileRef.current.click()}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 4, padding: '2px 10px', fontSize: 10, cursor: 'pointer' }}
        >
          Sostituisci
        </button>
        <button
          onClick={onClear}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 4, padding: '2px 10px', fontSize: 10, cursor: 'pointer' }}
        >
          × Demo
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={e => onLoadFile && onLoadFile(e.target.files[0])} />
      </div>
    )
  }

  // Demo mode
  return (
    <div style={{
      background: '#1a1a1a', color: '#fff',
      padding: '5px 20px', fontSize: 11,
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '2px 8px', borderRadius: 4,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>DEMO</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.35)', flex: 1 }}>
        Stai usando dati simulati — carica il file Excel reale per lavorare su dati Brera
      </span>
      <button
        onClick={() => fileRef.current.click()}
        style={{
          background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
          color: '#F97316', borderRadius: 4, padding: '3px 12px', fontSize: 10,
          cursor: 'pointer', fontWeight: 700,
        }}
      >
        ↑ Carica Excel reale
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => onLoadFile && onLoadFile(e.target.files[0])} />
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const {
    uploadedRows, uploadedFileName, loadFile, clearFile,
    normOverrides, saveNormOverride, resetNormOverride,
    selectedRow, drawerOpen, orderModal, orderOutcome, tasks,
    openDrawer, closeDrawer, openOrderModal, closeOrderModal, confirmOrder,
    moveTask, addTask,
  } = useAppState()

  const [showTour, setShowTour] = useState(() => !localStorage.getItem('brera_tour_done'))

  // rows usate in tutto il flusso
  const activeRows = uploadedRows || reorderReportRows

  return (
    <ToastProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {showTour && <OnboardingTour onClose={() => setShowTour(false)} />}
        <Navbar onStartTour={() => setShowTour(true)} uploadedRows={uploadedRows} rows={activeRows} urgencyCount={activeRows ? activeRows.filter(r =>
        (r.urgenza === 'Prioritaria' || r.urgenza === 'Critica') &&
        r._stato !== 'bloccato-tra' && r._stato !== 'bloccato-dup' && r._stato !== 'mismatch' &&
        (r.giacenza ?? 0) < (r.suggerimentoAcquisto ?? 1)
      ).length : 0} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {uploadedRows && <WelcomeBanner rows={activeRows} />}
          <DataModeBanner
            fileName={uploadedFileName}
            rowCount={uploadedRows?.length}
            onClear={clearFile}
            onLoadFile={() => {
              // Upload happens in ReportInput — just navigate there
              document.querySelector('a[href="/report"]')?.click()
            }}
          />
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Routes>
            <Route path="/" element={<Overview rows={activeRows} />} />
            <Route path="/workstation" element={<Workstation rows={activeRows} normOverrides={normOverrides} onOpenOrder={openOrderModal} onConfirmOrder={confirmOrder} />} />
            <Route path="/report" element={
              <ReportInput
                onOpenDrawer={openDrawer}
                uploadedRows={uploadedRows}
                uploadedFileName={uploadedFileName}
                onLoadFile={loadFile}
                onClearFile={clearFile}
              />
            } />
            <Route path="/normalizzazione" element={
              <NormalizationLab
                rows={activeRows}
                normOverrides={normOverrides}
                onSaveOverride={saveNormOverride}
                onResetOverride={resetNormOverride}
              />
            } />
            <Route path="/fabbisogni" element={
              <FabbisogniQueue
                rows={activeRows}
                normOverrides={normOverrides}
                onOpenDrawer={openDrawer}
              />
            } />
            <Route path="/scouting" element={<SupplierScouting rows={activeRows} onOpenOrder={openOrderModal} />} />
            <Route path="/ranking" element={<RankingDecision rows={activeRows} onOpenOrder={openOrderModal} />} />
            <Route path="/explainability" element={<Explainability rows={activeRows} onOpenOrder={openOrderModal} />} />
            <Route path="/ordine" element={<OrderWindow rows={activeRows} onConfirmOrder={confirmOrder} />} />
            <Route path="/esito" element={<OrderOutcome rows={activeRows} orderOutcome={orderOutcome} />} />
            <Route path="/prompt-optimizer" element={<PromptOptimizer rows={activeRows} />} />
            <Route path="/task-board" element={<TaskBoard tasks={tasks} moveTask={moveTask} addTask={addTask} />} />
            <Route path="/eod-report" element={<EndOfDayReport rows={activeRows} />} />
            <Route path="/impostazioni" element={<Settings />} />
            <Route path="/guida" element={<Guide onStartTour={() => setShowTour(true)} />} />
            <Route path="/ordini" element={<OrdiniRegistro />} />
            <Route path="/brand-config" element={<BrandConfig />} />
          </Routes>
      </div>

      {drawerOpen && (
        <RowDrawer
          row={selectedRow}
          onClose={closeDrawer}
          onOpenOrder={openOrderModal}
          normOverrides={normOverrides}
        />
      )}

      {orderModal && (
        <OrderModal
          data={orderModal}
          onClose={closeOrderModal}
          onConfirm={confirmOrder}
        />
      )}
      </div>
    </div>
  </ToastProvider>
  )
}
