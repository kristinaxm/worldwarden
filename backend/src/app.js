import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { authRouter } from './auth.js'
import { pool } from './db.js'

export const app = express()
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.disable('x-powered-by')
app.use(helmet())
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  if (req.get('origin') && req.get('origin') !== origin) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }
  next()
})
app.use(cors({ origin, credentials: true }))
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' })
  }
  next()
})
app.use(express.json({ limit: '8kb' }))
app.use(cookieParser())

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(500).json({ status: 'error', db: 'unreachable' })
  }
})

app.use('/api/auth', authRouter)
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }
  if (['charset.unsupported', 'encoding.unsupported'].includes(err.type)) {
    return res.status(415).json({ error: 'Unsupported request encoding' })
  }
  console.error('Request failed', { method: req.method, code: err.code || 'INTERNAL_ERROR' })
  res.status(500).json({ error: 'Something went wrong' })
})
