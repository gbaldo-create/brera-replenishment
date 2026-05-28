import { useState, useRef } from 'react'
import { Plus, Trash2, Save, CheckCircle, Edit2, X, Download, Upload } from 'lucide-react'
import {
  getBrandRiferimento, saveBrandRiferimento,
  getBrandConcorrenza, saveBrandConcorrenza,
  GRUPPI_DISPONIBILI, LINEE_DISPONIBILI
} from '../data/brandConfig'
import Tooltip from './Tooltip'

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--color-border)', borderRadius: 6,
  fontFamily: 'Geist, sans-serif', outline: 'none',
  background: 'var(--color-surface)', boxSizing: 'border-box',
}

// ─── Brand Riferimento Section ─────────────────────────────────────────────────
function BrandRiferimentoSection() {
  const [rows, setRows] = useState(getBrandRiferimento)
  const [saved, setSaved] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  function handleChange(idx, field, value) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function handleAdd() {
    setRows(prev => [...prev, { gruppo: '', brandRiferimento: '', note: '' }])
    setEditIdx(rows.length)
  }

  function handleDelete(idx) {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    saveBrandRiferimento(rows.filter(r => r.gruppo && r.brandRiferimento))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setEditIdx(null)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <span className="card-title">Brand di riferimento per gruppo merceologico</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
            Per ogni categoria, definisce il brand principale da usare come riferimento nella ricerca su QRicambi
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={handleAdd}>
            <Plus size={12} /> Aggiungi
          </button>
          <Tooltip text="Salva la configurazione brand — verrà usata dallo scouting per filtrare i risultati">
            <button className={`btn btn-sm ${saved ? 'btn-primary' : 'btn-primary'}`} onClick={handleSave}>
              {saved ? <><CheckCircle size={12} /> Salvato!</> : <><Save size={12} /> Salva</>}
            </button>
          </Tooltip>
        </div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Gruppo merceologico</th>
              <th>Brand di riferimento</th>
              <th>Note operative</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: editIdx === i ? 'var(--color-surface-2)' : 'transparent' }}>
                <td><div className="cell">
                  {editIdx === i ? (
                    <select value={row.gruppo} onChange={e => handleChange(i, 'gruppo', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">— seleziona —</option>
                      {GRUPPI_DISPONIBILI.map(g => <option key={g}>{g}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{row.gruppo}</span>
                  )}
                </div></td>
                <td><div className="cell">
                  {editIdx === i ? (
                    <input style={{ ...inputStyle, fontWeight: 700, color: 'var(--color-orange)' }}
                      value={row.brandRiferimento}
                      onChange={e => handleChange(i, 'brandRiferimento', e.target.value)}
                      onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      placeholder="es. Brembo" />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-orange)' }}>{row.brandRiferimento}</span>
                  )}
                </div></td>
                <td><div className="cell">
                  {editIdx === i ? (
                    <input style={inputStyle} value={row.note}
                      onChange={e => handleChange(i, 'note', e.target.value)}
                      onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      placeholder="Note operative..." />
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{row.note}</span>
                  )}
                </div></td>
                <td><div className="cell" style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-xs btn-ghost"
                    onClick={() => setEditIdx(editIdx === i ? null : i)}>
                    {editIdx === i ? <X size={11} /> : <Edit2 size={11} />}
                  </button>
                  <button className="btn btn-xs btn-ghost" style={{ color: 'var(--color-orange-text)' }}
                    onClick={() => handleDelete(i)}>
                    <Trash2 size={11} />
                  </button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Brand Concorrenza Section ─────────────────────────────────────────────────
function BrandConcorrenzaSection() {
  const [rows, setRows] = useState(getBrandConcorrenza)
  const [saved, setSaved] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [filter, setFilter] = useState('')
  const fileRef = useRef(null)

  function handleChange(idx, field, value) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function handleAdd() {
    setRows(prev => [...prev, { brand: '', linea: 'Primo Equipaggiamento', note: '' }])
    setEditIdx(rows.length)
  }

  function handleDelete(idx) {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    saveBrandConcorrenza(rows.filter(r => r.brand && r.linea))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setEditIdx(null)
  }

  function handleExport() {
    const csv = ['Brand,Linea,Note', ...rows.map(r => `"${r.brand}","${r.linea}","${r.note || ''}"`)]
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'brand-concorrenza.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const lineaBadge = {
    'Originale': 'badge-originale',
    'Primo Equipaggiamento': 'badge-pe',
    'Economico': 'badge-economico',
  }

  const filtered = filter
    ? rows.filter(r => r.brand.toLowerCase().includes(filter.toLowerCase()) ||
        r.linea.toLowerCase().includes(filter.toLowerCase()))
    : rows

  const counts = {
    'Originale': rows.filter(r => r.linea === 'Originale').length,
    'Primo Equipaggiamento': rows.filter(r => r.linea === 'Primo Equipaggiamento').length,
    'Economico': rows.filter(r => r.linea === 'Economico').length,
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <span className="card-title">Brand concorrenza — Classificazione qualitativa</span>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
            Cataloga i brand con la loro linea qualitativa per determinare il prezzo di vendita corretto
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={handleExport}>
            <Download size={12} /> CSV
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleAdd}>
            <Plus size={12} /> Aggiungi
          </button>
          <Tooltip text="Salva la classificazione brand — usata dal Modulo 9 per suggerire il prezzo di vendita corretto">
            <button className={`btn btn-sm btn-primary`} onClick={handleSave}>
              {saved ? <><CheckCircle size={12} /> Salvato!</> : <><Save size={12} /> Salva</>}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Stats + filter */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        {Object.entries(counts).map(([linea, count]) => (
          <span key={linea} className={`badge ${lineaBadge[linea]}`} style={{ fontSize: 10 }}>
            {linea}: {count}
          </span>
        ))}
        <div className="search-input-wrap" style={{ marginLeft: 'auto', maxWidth: 200 }}>
          <input className="search-input" placeholder="Filtra brand..."
            value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>

      <div style={{ overflow: 'auto', maxHeight: 420 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Linea qualitativa</th>
              <th>Note</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const realIdx = rows.indexOf(row)
              return (
                <tr key={i} style={{ background: editIdx === realIdx ? 'var(--color-surface-2)' : 'transparent' }}>
                  <td><div className="cell">
                    {editIdx === realIdx ? (
                      <input style={{ ...inputStyle, fontWeight: 700 }}
                        value={row.brand}
                        onChange={e => handleChange(realIdx, 'brand', e.target.value)}
                        onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        placeholder="es. Brembo" />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{row.brand}</span>
                    )}
                  </div></td>
                  <td><div className="cell">
                    {editIdx === realIdx ? (
                      <select value={row.linea}
                        onChange={e => handleChange(realIdx, 'linea', e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}>
                        {LINEE_DISPONIBILI.map(l => <option key={l}>{l}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${lineaBadge[row.linea] || 'badge-pe'}`} style={{ fontSize: 10 }}>
                        {row.linea}
                      </span>
                    )}
                  </div></td>
                  <td><div className="cell">
                    {editIdx === realIdx ? (
                      <input style={inputStyle} value={row.note || ''}
                        onChange={e => handleChange(realIdx, 'note', e.target.value)}
                        onFocus={e => e.target.style.borderColor = 'var(--color-orange)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        placeholder="Note..." />
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{row.note}</span>
                    )}
                  </div></td>
                  <td><div className="cell" style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-xs btn-ghost"
                      onClick={() => setEditIdx(editIdx === realIdx ? null : realIdx)}>
                      {editIdx === realIdx ? <X size={11} /> : <Edit2 size={11} />}
                    </button>
                    <button className="btn btn-xs btn-ghost" style={{ color: 'var(--color-orange-text)' }}
                      onClick={() => handleDelete(realIdx)}>
                      <Trash2 size={11} />
                    </button>
                  </div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="summary-bar">
        <span>Totale brand: <strong>{rows.length}</strong></span>
        <span>· Non catalogati: riceveranno margine default (Primo Equipaggiamento)</span>
      </div>
    </div>
  )
}

// ─── Main BrandConfig ──────────────────────────────────────────────────────────
export default function BrandConfig() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ padding: 0, border: 'none', background: 'none' }}>
        <div>
          <h1 className="page-title">Brand Configuration</h1>
          <p className="page-subtitle">
            Configura i brand di riferimento per gruppo e la classificazione dei brand concorrenza
          </p>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--color-orange-light)', border: '1px solid var(--color-orange-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-orange-text)', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div>
          <strong>Come usare questa schermata:</strong>
          <div style={{ marginTop: 4, lineHeight: 1.7 }}>
            <strong>Brand di riferimento</strong> → usati dallo scouting QRicambi per filtrare i risultati e identificare l'articolo corretto quando il codice è ambiguo.<br />
            <strong>Brand concorrenza</strong> → classificazione Originale / Primo Equipaggiamento / Economico usata dal Modulo 9 per calcolare il prezzo di vendita corretto invece dei margini fissi.
          </div>
        </div>
      </div>

      <BrandRiferimentoSection />
      <BrandConcorrenzaSection />
    </div>
  )
}
