const { Router } = require('express')
const { loadUser } = require('../sessions.js')
const leaderboardController = require('../controllers/leaderboardController.js')

const router = Router()

// loadUser: guests can see the leaderboards too, logged-in users also get their own place
router.get('/:board', loadUser, leaderboardController.getBoard)

// Open to everyone, like the leaderboards. Only players with a finished quiz.
router.get('/players/:id/medals', leaderboardController.getPlayerMedals)

module.exports = router
