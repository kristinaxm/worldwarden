const { Router } = require('express')
const { rateLimit } = require('express-rate-limit')
const { requireUser } = require('../sessions.js')
const authController = require('../controllers/authController.js')

const router = Router()

const limiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
}
const ipLimiter = rateLimit({ ...limiterOptions, limit: 20 })
const accountLimiter = rateLimit({
  ...limiterOptions,
  limit: 10,
  keyGenerator: (req) => req.credentials.email,
  skipSuccessfulRequests: true,
})

router.post('/signup', ipLimiter, authController.credentials, authController.signup)
router.post('/login', ipLimiter, authController.credentials, accountLimiter, authController.login)
router.get('/me', requireUser, authController.me)
router.post('/logout', authController.logout)

module.exports = router