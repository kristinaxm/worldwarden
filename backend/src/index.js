import { app } from './app.js'
import { pool } from './db.js'

await pool.query('SELECT 1 FROM users LIMIT 1')
await pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()')

const cleanup = setInterval(() => {
  pool.query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()').catch(() => {
    console.error('Session cleanup failed')
  })
}, 60 * 60 * 1000)
cleanup.unref()

const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`API lyssnar på http://localhost:${port}`)
})

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
