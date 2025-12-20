const express = require('express')
const router = express.Router()
const {
  createJobController,
  getJobController
} = require('../controllers/Job.controller')

router.post('/jobs', createJobController)
router.get('/jobs/:jobId', getJobController)

module.exports = router
