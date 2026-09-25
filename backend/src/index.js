const cors = require('cors')
const express = require('express')
const healthRouter = require('./routes/health.js')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API lyssnar på http://localhost:${port}`))
