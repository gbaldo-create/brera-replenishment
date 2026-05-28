import { getOperatore } from '../data/operatoreStore'
import { saveOrdineConOperatore } from '../data/ordiniStore'
import { useState, useCallback, useEffect } from 'react'
import { initialTasks } from '../data/mockData'

// ─── sessionStorage helpers ───────────────────────────────────────────────────
function ssGet(key) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function ssSet(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)) } catch {}
}
function ssDel(key) {
  try { sessionStorage.removeItem(key) } catch {}
}

export function useAppState() {
  // ─── File caricato — persiste in sessionStorage ───────────────────────────
  const [uploadedRows, setUploadedRows] = useState(() => ssGet('brera_rows'))
  const [uploadedFileName, setUploadedFileName] = useState(() => ssGet('brera_filename'))

  const [tasks, setTasks] = useState(initialTasks)
  const moveTask = useCallback((id, newStato) => setTasks(prev => prev.map(t => t.id === id ? { ...t, stato: newStato } : t)), [])
  const addTask = useCallback((task) => setTasks(prev => [...prev, task]), [])

  const loadFile = useCallback((rows, fileName) => {
    setUploadedRows(rows)
    setUploadedFileName(fileName)
    ssSet('brera_rows', rows)
    ssSet('brera_filename', fileName)

    // Auto-genera task per righe critiche del file caricato
    setTasks(prev => {
      const existingReqIds = new Set(prev.map(t => t.reqId).filter(Boolean))
      const newTasks = []

      rows.forEach(r => {
        if (existingReqIds.has(r.id)) return // non duplicare

        if (r._stato === 'mismatch' || (r._conf ?? 100) < 50) {
          newTasks.push({
            id: `TASK-AUTO-${r.id}`,
            reqId: r.id,
            titolo: `Revisione mapping — ${r.codiceMadre}`,
            descrizione: `Mismatch famiglia rilevato (confidence ${r._conf ?? '?'}%). ERP: ${r.gruppoMerceologico}. Verificare classificazione TecDoc prima di procedere all'ordine.`,
            tipo: 'Revisione Mapping',
            priorita: 'Alta',
            stato: 'Da elaborare',
            operatore: 'SYS',
            gruppo: r.gruppoMerceologico,
            createdAt: new Date().toISOString(),
          })
        } else if ((r._conf ?? 100) < 70 && r._stato !== 'ok') {
          newTasks.push({
            id: `TASK-AUTO-${r.id}`,
            reqId: r.id,
            titolo: `Verifica normalizzazione — ${r.codiceMadre}`,
            descrizione: `Confidence bassa (${r._conf ?? '?'}%). Il codice normalizzato potrebbe essere errato. Verificare in Normalizzazione prima dello scouting.`,
            tipo: 'Revisione Anagrafica',
            priorita: 'Media',
            stato: 'Da elaborare',
            operatore: 'SYS',
            gruppo: r.gruppoMerceologico,
            createdAt: new Date().toISOString(),
          })
        }
      })

      return [...prev, ...newTasks]
    })
  }, [])

  const clearFile = useCallback(() => {
    setUploadedRows(null)
    setUploadedFileName(null)
    ssDel('brera_rows')
    ssDel('brera_filename')
    ssDel('brera_norm_overrides')
  }, [])

  // ─── Revisioni normalizzazione — persiste in sessionStorage ──────────────
  const [normOverrides, setNormOverrides] = useState(() => ssGet('brera_norm_overrides') || {})

  const saveNormOverride = useCallback((id, data) => {
    setNormOverrides(prev => {
      const next = { ...prev, [id]: data }
      ssSet('brera_norm_overrides', next)
      return next
    })
  }, [])

  const resetNormOverride = useCallback((id) => {
    setNormOverrides(prev => {
      const next = { ...prev }
      delete next[id]
      ssSet('brera_norm_overrides', next)
      return next
    })
  }, [])

  // ─── Drawer / Modal / Ordini ───────────────────────────────────────────────
  const [selectedRow, setSelectedRow] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [orderModal, setOrderModal] = useState(null)
  const [orderOutcome, setOrderOutcome] = useState({})

  const openDrawer = useCallback((row) => { setSelectedRow(row); setDrawerOpen(true) }, [])
  const closeDrawer = useCallback(() => { setDrawerOpen(false); setTimeout(() => setSelectedRow(null), 300) }, [])
  const openOrderModal = useCallback((offer, row) => setOrderModal({ offer, row }), [])
  const closeOrderModal = useCallback(() => setOrderModal(null), [])
  const confirmOrder = useCallback((offerId, rowId, tipo, qty) => {
    setOrderOutcome(prev => ({ ...prev, [rowId]: tipo }))
    // Salva con operatore attivo e quantità scelta
    const op = getOperatore()
    if (orderModal) {
      saveOrdineConOperatore({
        row: orderModal.row,
        offer: orderModal.offer,
        tipo,
        qty: qty || orderModal.row?.suggerimentoAcquisto || 1,
        operatoreId: op.id,
      })
    }
    closeOrderModal()
  }, [closeOrderModal, orderModal])

  return {
    uploadedRows, uploadedFileName, loadFile, clearFile,
    normOverrides, saveNormOverride, resetNormOverride,
    selectedRow, drawerOpen, orderModal, orderOutcome,
    openDrawer, closeDrawer, openOrderModal, closeOrderModal, confirmOrder,
    tasks, moveTask, addTask,
  }
}
