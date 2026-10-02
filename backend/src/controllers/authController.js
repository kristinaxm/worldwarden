const validator = require('validator')
const authService = require('../services/authService.js')
const { cookieOptions, createSession, sessionCookie, sessionHash } = require('../sessions.js')

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

        async function signup(req, res) {
            const { email, password } = req.credentials
            if ([...password].length < 5 || !/[0-9]/.test(password) || !/[\p{P}\p{S}]/u.test(password)) {
                return res.status(400).json({ error: 'Password must contain 5 to 128 characters, a number and a symbol' })
            } 
            try {
                const user = await authService.createUser(email, password)
                res.status(201).json({ user })
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email is already registered' })
                }
                throw err
            }
        }

        async function login(req, res) {
            const { email, password } = req.credentials
            const user = await authService.getUserByEmail(email)
            const isValid = await authService.verifyPassword(user, password)
            if (!user || !isValid) {
                return res.status(401).json({ error: 'Invalid email or password' })
            }

            await createSession(req, res, user.id)
            res.json({ user: { id: user.id, email: user.email } })
        }

        function me (req, res) {
            res.json({ user: req.user })
        }

        async function logout(req, res) {
            const hash = sessionHash(req)
            if (hash) {
                await authService.deleteSession(hash)
            }
            res.clearCookie(sessionCookie, cookieOptions)
            res.sendStatus(204)
        }

    module.exports = {
        credentials,
        signup,
        login,
        me,
        logout,
    }