// profileController.js – hanterar HTTP för användarprofil
// Endpoints: PATCH /profile, POST /profile/email, POST /profile/password, DELETE /profile

const argon2 = require('argon2')
const validator = require('validator')
const profileService = require('../services/profileService.js')
const { sessionCookie, cookieOptions, sessionHash } = require('../sessions.js')
const { pool } = require('../db.js')

// Uppdatera visningsnamn och/eller avatar (kräver inloggning, inget lösenord)
// Bara fälten som skickas med ändras, de andra ligger kvar
async function updateProfile(req, res) {
    const userId = req.user.id

    const { displayName, avatar } = req.body || {}
    const isTextOrNull = (value) => value === null || typeof value === 'string'

    if (displayName === undefined && avatar === undefined) {
        return res.status(400).json({ error: 'Skicka med displayName och/eller avatar!' })
    }
    if (displayName !== undefined && !isTextOrNull(displayName)) {
        return res.status(400).json({ error: 'Visningsnamn måste vara text!' })
    }
    if (displayName && [...displayName].length > 50) {
        return res.status(400).json({ error: 'Visningsnamn får inte vara längre än 50 tecken!' })
    }
    if (avatar !== undefined && !isTextOrNull(avatar)) {
        return res.status(400).json({ error: 'Avatar måste vara text!' })
    }

    const changes = {}
    if (displayName !== undefined) changes.display_name = displayName || null
    if (avatar !== undefined) changes.avatar = avatar || null

    const user = await profileService.updateProfile(userId, changes)
    res.json({ user })
}
// Byt e-post (kräver lösenordsverifiering)
async function updateEmail(req, res) {
    const userId = req.user.id

    const { email, password } = req.body
    if (typeof email !== 'string' || !validator.isEmail(email.trim())) {
        return res.status(400).json({ error: 'Ogiltig e-postadress!' })
    } 
    if (typeof password !== 'string' || !password.length) {
        return res.status(400).json({ error: 'Lösenord krävs!' })
    }

    const [users] = await pool.execute(
        'SELECT id, password_hash FROM users WHERE id = ?', 
        [userId],  
    )
    const user = users[0]
    if (!user) {
        return res.status(404).json({ error: 'Användaren hittades inte!' })
    }
    if (!user.password_hash) {
        return res.status(400).json({ error: 'Kontot använder GitHub-inloggning och har inget lösenord.' })
    }
    const valid = await argon2.verify(user.password_hash, password)
    if (!valid) {
        return res.status(401).json({ error: 'Felaktigt lösenord!' })
    }

    try {
        const updatedUser = await profileService.updateEmail(userId, email.trim().toLowerCase())
        res.json({ user: updatedUser })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'E-postadressen är redan registrerad!' })
        }
        throw err
    }
}

// Byt lösenord (kräver nuvarande lösenord + validering av nytt)
async function updatePassword(req, res) {
    const userId = req.user.id

    const { currentPassword, newPassword } = req.body
    if (typeof currentPassword !== 'string' || !currentPassword.length) {
        return res.status(400).json({ error: 'Nuvarande lösenord krävs!' })
    }
    if (typeof newPassword !== 'string' || !newPassword.length) {
        return res.status(400).json({ error: 'Nytt lösenord krävs!' })
    }
    // Samma regler som vid registrering (authController.signup): 5–128 tecken
    const length = [...newPassword].length
    if (length < 5 || length > 128) {
        return res.status(400).json({ error: 'Nytt lösenord måste vara 5–128 tecken långt!' })
    }
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSymbol = /[\p{P}\p{S}]/u.test(newPassword)

    if (!hasNumber || !hasSymbol) {
        return res.status(400).json({ 
            error: 'Nytt lösenord måste innehålla minst en siffra och ett specialtecken!' 
    })
    }

    const [users] = await pool.execute(
        'SELECT id, password_hash FROM users WHERE id = ?', 
        [userId],
    )
    const user = users[0]
    if (!user) {
        return res.status(404).json({ error: 'Användaren hittades inte!' })
    }
    if (!user.password_hash) {
        return res.status(400).json({ error: 'Kontot använder GitHub-inloggning och har inget lösenord.' })
    }
    const valid = await argon2.verify(user.password_hash, currentPassword)
    if (!valid) {
        return res.status(401).json({ error: 'Felaktigt nuvarande lösenord!' })
    }

    const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }
    const newPasswordHash = await argon2.hash(newPassword, hashOptions)
    await profileService.updatePassword(userId, newPasswordHash, sessionHash(req))
    res.json({ message: 'Lösenordet har uppdaterats!' })
}

// Radera konto (kräver lösenord, CASCADE tar bort all kopplad data)
async function deleteUser(req, res) {
    const userId = req.user.id

    const { password, email } = req.body

    const [users] = await pool.execute(
        'SELECT id, email, password_hash FROM users WHERE id = ?', 
        [userId],
    )
    const user = users[0]
    if (!user) {
        return res.status(404).json({ error: 'Användaren hittades inte!' })
    }

    // GitHub-konton har inget lösenord, så de bekräftar med sin e-postadress i stället
    if (!user.password_hash) {
        if (typeof email !== 'string' || email.trim().toLowerCase() !== user.email) {
            return res.status(401).json({ error: 'Fel e-postadress!' })
        }
    } else {
        if (typeof password !== 'string' || !password.length) {
            return res.status(400).json({ error: 'Lösenord krävs för att radera kontot!' })
        }
        const valid = await argon2.verify(user.password_hash, password)
        if (!valid) {
            return res.status(401).json({ error: 'Felaktigt lösenord!' })
        }
    }
    await profileService.deleteUser(userId)
    res.clearCookie(sessionCookie, cookieOptions)
    res.sendStatus(204)
}

module.exports = {
    updateProfile,
    updateEmail,
    updatePassword,
    deleteUser
}