import { readdir, readFile } from 'node:fs/promises'
import { pool } from './db.js'

const directory = new URL('../migrations/', import.meta.url)
let connection
let locked = false

try {
  connection = await pool.getConnection()
  const [[result]] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [
    `${process.env.DB_NAME}:migrations`,
  ])
  if (result.acquired !== 1) throw new Error('Could not acquire migration lock')
  locked = true
  await connection.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,
  )
  const [applied] = await connection.query('SELECT name FROM schema_migrations')
  const files = (await readdir(directory)).filter((name) => /^\d+_[\w-]+\.sql$/.test(name)).sort()

  for (const name of files) {
    if (applied.some((migration) => migration.name === name)) continue
    const sql = await readFile(new URL(name, directory), 'utf8')
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
      await connection.query(statement)
    }
    await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name])
    console.log(`Applied ${name}`)
  }
  console.log('Database is up to date')
} finally {
  if (locked) await connection.execute('SELECT RELEASE_LOCK(?)', [`${process.env.DB_NAME}:migrations`])
  connection?.release()
  await pool.end()
}
