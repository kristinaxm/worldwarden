const { Router } = require('express')
const { loadUser } = require('../sessions.js')
const questionController = require('../controllers/questionController.js')

const router = Router()

// loadUser: guests can play too, but only logged in users get their quiz saved
router.post('/', loadUser, questionController.start)

module.exports = router
