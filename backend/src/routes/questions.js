const { Router } = require('express')
const questionController = require('../controllers/questionController.js')

const router = Router()

router.post('/', questionController.start)

module.exports = router
