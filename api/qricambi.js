// api/qricambi.js — Vercel Serverless Function
// Il token non è mai esposto al browser — sta solo in process.env

const BASE_URL = 'https://api.qricambi.com'
const TOKEN = process.env.QRICAMBI_TOKEN || ''

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  }
}

export default async function handler(req, res) {
  // CORS per il frontend Vercel
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!TOKEN) return res.status(500).json({ error: 'QRICAMBI_TOKEN non configurato in Vercel env vars' })

  // Routing: ?endpoint=mysupplier | searchpriceandavailability
  const endpoint = req.query.endpoint || 'searchpriceandavailability'

  try {
    if (endpoint === 'mysupplier') {
      const r = await fetch(`${BASE_URL}/mysupplier`, { method: 'GET', headers: headers() })
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    if (endpoint === 'searchpriceandavailability') {
      const r = await fetch(`${BASE_URL}/searchpriceandavailability`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(req.body),
      })
      const data = await r.json()
      return res.status(r.status).json(data)
    }

    return res.status(400).json({ error: `Endpoint sconosciuto: ${endpoint}` })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
