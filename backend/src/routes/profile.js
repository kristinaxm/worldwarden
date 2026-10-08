const express = require('express')
const profileController = require('../controllers/profileController.js')
const { requireUser } = require('../sessions.js')

const router = express.Router()

router.patch('/', requireUser, profileController.updateProfile)
router.post('/email', requireUser, profileController.updateEmail)
router.post('/password', requireUser, profileController.updatePassword)
router.delete('/', requireUser, profileController.deleteUser)

module.exports = router