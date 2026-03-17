import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())

// GET /api/constant?value=42
app.get('/api/constant', (req, res) => {
  res.json({ value: parseFloat(req.query.value as string) || 0 })
})

// GET /api/range?min=10&max=100
app.get('/api/range', (req, res) => {
  const min = parseFloat(req.query.min as string) || 0
  const max = parseFloat(req.query.max as string) || 1
  res.json({ value: min + Math.random() * (max - min) })
})

// GET /api/increment?start=0&rate=1
const counters: Record<string, number> = {}
app.get('/api/increment', (req, res) => {
  const key = `${req.query.start}:${req.query.rate}`
  const start = parseFloat(req.query.start as string) || 0
  const rate = parseFloat(req.query.rate as string) || 1
  counters[key] = (counters[key] ?? start - rate) + rate
  res.json({ value: counters[key] })
})

app.listen(3001, () => console.log('Data server running on http://localhost:3001'))
