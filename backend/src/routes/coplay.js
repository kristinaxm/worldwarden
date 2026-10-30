const { Router } = require('express')
const { requireUser } = require('../sessions.js')
const coplayController = require('../controllers/coplayController.js')

const router = Router()

// Co-play is for logged in players only: every player gets their own saved quiz
router.post('/', requireUser, coplayController.create)
router.post('/:code/join', requireUser, coplayController.join)
router.get('/:code', requireUser, coplayController.lobby)
router.post('/:code/start', requireUser, coplayController.start)
router.get('/:code/questions', requireUser, coplayController.questions)
router.get('/:code/scores', requireUser, coplayController.scores)

module.exports = router
