// profileController.js – hanterar HTTP för användarprofil
// Endpoints: PATCH /profile, POST /profile/email, POST /profile/password, DELETE /profile

const argon2 = require('argon2')
const validator = require('validator')
const profileService = require('../services/profileService.js')
const { sessionCookie, cookieOptions } = require('../sessions.js')
const { pool } = require('../db.js')

// Uppdatera visningsnamn + avatar (kräver inloggning, inget lösenord)
async function updateProfile(req, res) {
    const userId = req.user.id

    const { displayName, avatar } = req.body
    if (displayName && displayName.length > 50) {
        return res.status(400).json({ error: 'Visningsnamn får inte vara längre än 50 tecken!' })
    }

    const user = await profileService.updateProfile(userId, displayName || null, avatar || null)
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
    if (newPassword.length < 5) {
        return res.status(400).json({ error: 'Nytt lösenord måste vara minst 5 tecken långt!' })
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
    const valid = await argon2.verify(user.password_hash, currentPassword)
    if (!valid) {
        return res.status(401).json({ error: 'Felaktigt nuvarande lösenord!' })
    }

    const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }
    const newPasswordHash = await argon2.hash(newPassword, hashOptions)
    await profileService.updatePassword(userId, newPasswordHash)
    res.json({ message: 'Lösenordet har uppdaterats!' })
}

// Radera konto (kräver lösenord, CASCADE tar bort all kopplad data)
async function deleteUser(req, res) {
    const userId = req.user.id

    const { password } = req.body
    if (typeof password !== 'string' || !password.length) {
        return res.status(400).json({ error: 'Lösenord krävs för att radera kontot!' })
    }

    const [users] = await pool.execute(
        'SELECT id, password_hash FROM users WHERE id = ?', 
        [userId],
    )
    const user = users[0]
    if (!user) {
        return res.status(404).json({ error: 'Användaren hittades inte!' })
    }
    const valid = await argon2.verify(user.password_hash, password)
    if (!valid) {
        return res.status(401).json({ error: 'Felaktigt lösenord!' })
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