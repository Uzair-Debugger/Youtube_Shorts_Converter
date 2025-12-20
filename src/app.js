const express = require('express')
const jobRoutes = require('./routes/Job.routes')
const app = express()

app.use(function(req, res, next){

    console.log(`${req.method} ${req.url}`)

    next();
})


app.use(express.json())

app.use('/api', jobRoutes)



module.exports = app