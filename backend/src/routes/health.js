const express = require('express')
const { pool } = require('../db.js')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', db: 'unreachable' })
  }
})

module.exports = router
