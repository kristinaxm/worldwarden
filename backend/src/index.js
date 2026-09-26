const cors = require('cors')
const express = require('express')
const healthRouter = require('./routes/health.js')

await pool.query('SELECT 1 FROM users LIMIT 1')
await pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()')

const cleanup = setInterval(() => {
  pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()').catch(() => {
    console.error('Session cleanup failed')
  })
}, 60 * 60 * 1000)
cleanup.unref()

app.use('/api/health', healthRouter)

function shutdown() {
  clearInterval(cleanup)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
