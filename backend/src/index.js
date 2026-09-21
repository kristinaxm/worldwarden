import cors from 'cors'
import express from 'express'
import { pool } from './db.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', db: 'unreachable' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API lyssnar på http://localhost:${port}`))
