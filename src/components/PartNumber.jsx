// ─── PartNumber — codice articolo stile targa/part number industriale ─────────

export default function PartNumber({ code, size = 'md', showPrefix = true }) {
  if (!code) return null

  // Separa prefisso dal numero (es. "M-103316" → ["M", "103316"])
  const match = code.match(/^([A-Z]{1,3})-?(.+)$/)
  const prefix = match ? match[1] : null
  const number = match ? match[2] : code

  const sizes = {
    sm: { fontSize: 11, padding: '2px 8px', gap: 0, prefixSize: 9, borderRadius: 5 },
    md: { fontSize: 14, padding: '4px 12px', gap: 1, prefixSize: 10, borderRadius: 7 },
    lg: { fontSize: 20, padding: '6px 16px', gap: 1, prefixSize: 12, borderRadius: 9 },
    xl: { fontSize: 26, padding: '8px 20px', gap: 2, prefixSize: 13, borderRadius: 10 },
  }
  const s = sizes[size] || sizes.md

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0,
      background: '#0F0F0F',
      borderRadius: s.borderRadius,
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      fontFamily: 'Geist Mono, Geist Mono, monospace',
      userSelect: 'all',
    }}>
      {/* Prefisso */}
      {prefix && showPrefix && (
        <div style={{
          padding: `${parseInt(s.padding) + 2}px 8px`,
          paddingTop: s.padding.split(' ')[0],
          paddingBottom: s.padding.split(' ')[0],
          background: 'rgba(249,115,22,0.15)',
          borderRight: '1px solid rgba(249,115,22,0.2)',
          fontSize: s.prefixSize,
          fontWeight: 800,
          color: '#F97316',
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
        }}>
          {prefix}
        </div>
      )}
      {/* Numero */}
      <div style={{
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.06em',
        lineHeight: 1,
      }}>
        {number}
      </div>
    </div>
  )
}
