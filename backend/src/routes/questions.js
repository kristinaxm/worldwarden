const { Router } = require('express')
const { loadUser, requireUser } = require('../sessions.js')
const questionController = require('../controllers/questionController.js')

const router = Router()

// loadUser: guests can play too, but only logged in users get their quiz saved
router.post('/', loadUser, questionController.start)

// Hints are tracked per saved quiz, so only logged-in users can use them
router.post('/hint', requireUser, questionController.hint)

module.exports = router
