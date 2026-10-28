const { randomBytes } = require('node:crypto')
const argon2 = require('argon2')
const { pool } = require('../db.js')

const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }
const dummyHash = argon2.hash(randomBytes(32), hashOptions)

async function createUser(email, password) {
  const passwordHash = await argon2.hash(password, hashOptions)
  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash],
  )
  return { id: result.insertId, email }
}

async function getUserByEmail(email) {
  const [users] = await pool.execute(
    'SELECT id, email, password_hash, display_name, avatar FROM users WHERE email = ?',
    [email],
  )
  return users[0] || null
}

async function verifyPassword(user, password) {
    // GitHub accounts have no password: the dummy hash keeps the timing the same
    const hash = user?.password_hash || (await dummyHash)
    return argon2.verify(hash, password)
}

// Finds the GitHub account, or links the GitHub id to an existing email account
async function findOrCreateGithubUser(githubId, email) {
  const [users] = await pool.execute(
    'SELECT id, email, display_name, avatar FROM users WHERE github_id = ?',
    [githubId],
  )
  if (users[0]) return users[0]

  const existing = await getUserByEmail(email)
  if (existing) {
    await pool.execute('UPDATE users SET github_id = ? WHERE id = ?', [githubId, existing.id])
    return { id: existing.id, email: existing.email, display_name: existing.display_name, avatar: existing.avatar }
  }

  const [result] = await pool.execute(
    'INSERT INTO users (email, github_id) VALUES (?, ?)',
    [email, githubId],
  )
  return { id: result.insertId, email, display_name: null, avatar: null }
}

async function deleteSession(hash) {
  await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hash])
}

module.exports = {
    createUser,
    getUserByEmail,
    verifyPassword,
    findOrCreateGithubUser,
    deleteSession, }