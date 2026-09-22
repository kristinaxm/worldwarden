import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import validator from 'validator'
import { pool } from './db.js'
import { cookieOptions, createSession, requireUser, sessionCookie, sessionHash } from './sessions.js'

const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }
const dummyHash = await argon2.hash(randomBytes(32), hashOptions)

function credentials(req, res, next) {
  const { email, password } = req.body || {}
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[\x20-\x7E]+$/.test(email) ||
    !validator.isEmail(email.trim(), { allow_utf8_local_part: false })
  ) {
    return res.status(400).json({ error: 'A valid email address is required' })
  }
  if (typeof password !== 'string' || !password.length || [...password].length > 128) {
    return res.status(400).json({ error: 'Password must contain 1 to 128 characters' })
  }
  req.credentials = { email: email.trim().toLowerCase(), password }
  next()
}

export const authRouter = Router()
const limiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
}
const ipLimiter = rateLimit({ ...limiterOptions, limit: 20 })
const accountLimiter = rateLimit({
  ...limiterOptions,
  limit: 10,
  keyGenerator: (req) => req.credentials.email,
  skipSuccessfulRequests: true,
})

authRouter.post('/signup', ipLimiter, credentials, async (req, res) => {
  const { email, password } = req.credentials
  if ([...password].length < 5 || !/[0-9]/.test(password) || !/[\p{P}\p{S}]/u.test(password)) {
    return res.status(400).json({ error: 'Password must contain 5 to 128 characters, a number and a symbol' })
  }
  const passwordHash = await argon2.hash(password, hashOptions)
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
    )
    res.status(201).json({ user: { id: result.insertId, email } })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email is already registered' })
    }
    throw err
  }
})

authRouter.post('/login', ipLimiter, credentials, accountLimiter, async (req, res) => {
  const { email, password } = req.credentials
  const [users] = await pool.execute(
    'SELECT id, email, password_hash FROM users WHERE email = ?',
    [email],
  )
  const user = users[0]
  const valid = await argon2.verify(user?.password_hash || dummyHash, password)
  if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password' })

  await createSession(req, res, user.id)
  res.json({ user: { id: user.id, email: user.email } })
})

authRouter.get('/me', requireUser, (req, res) => res.json({ user: req.user }))

authRouter.post('/logout', async (req, res) => {
  const hash = sessionHash(req)
  if (hash) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hash])
  res.clearCookie(sessionCookie, cookieOptions)
  res.sendStatus(204)
})
