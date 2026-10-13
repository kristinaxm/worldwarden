const express = require('express')
const profileController = require('../controllers/profileController.js')
const { requireUser } = require('../sessions.js')
const xpService = require('../services/xpService.js')

const router = express.Router()

// Total XP, level and unlocked difficulties for the logged-in user
router.get('/xp', requireUser, async (req, res) => res.json(await xpService.getSummary(req.user.id)))
router.patch('/', requireUser, profileController.updateProfile)
router.post('/email', requireUser, profileController.updateEmail)
router.post('/password', requireUser, profileController.updatePassword)
router.delete('/', requireUser, profileController.deleteUser)

module.exports = router