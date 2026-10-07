const { createHash, randomBytes } = require('node:crypto')
const { pool } = require('./db.js')

const sessionCookie = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
const sessionDuration = 24 * 60 * 60 * 1000

function sessionHash(req) {
  const token = req.cookies[sessionCookie]
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return createHash('sha256').update(token).digest()
}

async function createSession(req, res, userId) {
  const token = randomBytes(32).toString('base64url')
  const hash = createHash('sha256').update(token).digest()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const previous = sessionHash(req)
    if (previous) await connection.execute('DELETE FROM sessions WHERE token_hash = ?', [previous])
    await connection.execute(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [hash, userId, new Date(Date.now() + sessionDuration)],
    )
    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }

  res.cookie(sessionCookie, token, { ...cookieOptions, maxAge: sessionDuration })
}

// Returns the logged-in user for this request, or null for guests and expired sessions
async function findSessionUser(req) {
  const hash = sessionHash(req)
  if (!hash) return null

  const [users] = await pool.execute(
    `SELECT users.id, users.email, users.created_at AS createdAt
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > UTC_TIMESTAMP()`,
    [hash],
  )
  return users[0] || null
}

// Stops guests with 401
async function requireUser(req, res, next) {
  const user = await findSessionUser(req)
  if (user) {
    req.user = user
    return next()
  }
  res.clearCookie(sessionCookie, cookieOptions)
  res.status(401).json({ error: 'Authentication required' })
}

// Lets everyone through: req.user is the logged-in user, or null for guests
async function loadUser(req, res, next) {
  req.user = await findSessionUser(req)
  next()
}

module.exports = { sessionCookie, cookieOptions, sessionHash, createSession, requireUser, loadUser }
