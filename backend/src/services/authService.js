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
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email],
  )
  return users[0] || null
}

async function verifyPassword(user, password) {
    const hash = user?.password_hash || (await dummyHash)
    return argon2.verify(hash, password)
}

async function deleteSession(hash) {
  await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hash])
}

module.exports = {
    createUser,
    getUserByEmail,
    verifyPassword,
    deleteSession, }