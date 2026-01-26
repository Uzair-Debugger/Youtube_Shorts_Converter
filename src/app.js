import express from 'express'
import { jobRoutes } from './routes/Job.routes.js'

const app = express()

app.use(function (req, res, next) {

    console.log(`${req.method} ${req.url}`)

    next();
})


app.use(express.json())

app.use('/api', jobRoutes)



export default app