import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT      = process.env.PORT ?? 3001
const isProd    = process.env.NODE_ENV === 'production'

const app = express()

// In dev the Vite server runs on a different port, so CORS is required.
// In prod everything shares one origin, but it's harmless to keep.
app.use(cors())

// ── Demo data API ─────────────────────────────────────────────────────────────
// These endpoints back the "Measure" node type. In development Vite proxies
// /api/* here; in production this server handles them directly.

// GET /api/constant?value=42  — echo a fixed value (useful for testing)
app.get('/api/constant', (req, res) => {
  res.json({ value: parseFloat(req.query.value as string) || 0 })
})

// GET /api/range?min=10&max=100  — uniformly distributed random value
app.get('/api/range', (req, res) => {
  const min = parseFloat(req.query.min as string) || 0
  const max = parseFloat(req.query.max as string) || 1
  res.json({ value: min + Math.random() * (max - min) })
})

// GET /api/increment?start=0&rate=1  — monotonically increasing counter;
// each unique (start, rate) pair keeps its own state for the server's lifetime.
const counters: Record<string, number> = {}
app.get('/api/increment', (req, res) => {
  const key   = `${req.query.start}:${req.query.rate}`
  const start = parseFloat(req.query.start as string) || 0
  const rate  = parseFloat(req.query.rate  as string) || 1
  counters[key] = (counters[key] ?? start - rate) + rate
  res.json({ value: counters[key] })
})

// ── Static file serving (production only) ─────────────────────────────────────
// In development, Vite's dev server handles the frontend on its own port.
// In production (`npm run build` → dist/) this server takes over.
if (isProd) {
  // server/ is one level below the project root, so dist/ is ../dist
  const distDir = path.join(__dirname, '..', 'dist')

  // Serve compiled JS/CSS/assets with their content-addressed filenames
  app.use(express.static(distDir))

  // SPA fallback: any path not matched above returns index.html so the React
  // app boots and manages its own state (diagram saves, panel open/close, etc.)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
