const { Router } = require('express')
const { loadUser, requireUser } = require('../sessions.js')
const resultController = require('../controllers/resultController.js')

const router = Router()

// Everyone can get their answers graded, but only logged-in users get them saved
router.post('/', loadUser, resultController.submit)

// Stats only exist for logged-in users
router.get('/stats', requireUser, resultController.stats)

module.exports = router
