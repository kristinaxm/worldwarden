const { randomBytes } = require('node:crypto')
const validator = require('validator')
const authService = require('../services/authService.js')
const { cookieOptions, createSession, sessionCookie, sessionHash } = require('../sessions.js')

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const stateCookie = 'github_state'

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
            res.json({ user: { 
                id: user.id, 
                email: user.email,
                display_name: user.display_name,
                avatar: user.avatar, }, 
            })
        }

        // Step 1: send the user to GitHub with a random state we can check on the way back
        function github(req, res) {
            // Redirect instead of JSON: the link is a page navigation, so an error
            // body would replace the whole app with raw text
            if (!process.env.GITHUB_CLIENT_ID) {
                return res.redirect(`${frontendOrigin}/?github=saknas`)
            }
            const state = randomBytes(16).toString('base64url')
            res.cookie(stateCookie, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 })
            const params = new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID,
                redirect_uri: `${process.env.BACKEND_ORIGIN || 'http://localhost:3000'}/api/auth/github/callback`,
                scope: 'read:user user:email',
                state,
            })
            res.redirect(`https://github.com/login/oauth/authorize?${params}`)
        }

        // Step 2: trade the code for a token, then log the GitHub user in with a normal session
        async function githubCallback(req, res) {
            const { code, state } = req.query
            const expected = req.cookies[stateCookie]
            res.clearCookie(stateCookie, cookieOptions)
            if (typeof code !== 'string' || typeof state !== 'string' || !expected || state !== expected) {
                return res.redirect(`${frontendOrigin}/?github=fel`)
            }

            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: `${process.env.BACKEND_ORIGIN || 'http://localhost:3000'}/api/auth/github/callback`,
                }),
            })
            const { access_token: token } = await tokenResponse.json()
            if (!token) return res.redirect(`${frontendOrigin}/?github=fel`)

            const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
            const profile = await (await fetch('https://api.github.com/user', { headers })).json()
            // The profile email can be hidden, so fall back to the verified primary one
            let email = profile.email
            if (!email) {
                const emails = await (await fetch('https://api.github.com/user/emails', { headers })).json()
                email = emails.find?.((item) => item.primary && item.verified)?.email
            }
            if (!profile.id || !email) return res.redirect(`${frontendOrigin}/?github=fel`)

            const user = await authService.findOrCreateGithubUser(String(profile.id), email.toLowerCase())
            await createSession(req, res, user.id)
            res.redirect(frontendOrigin)
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
        github,
        githubCallback,
        me,
        logout,
    }