import express from 'express'
import cors from 'cors'
import router from './routes/index.js'

const app = express()

// CORS must be first middleware
app.use(cors())

app.use(function (req, res, next) {

    console.log(`${req.method} ${req.url}`)

    next();
})


app.use(express.json())

app.use('/api/v1', router)



export default app