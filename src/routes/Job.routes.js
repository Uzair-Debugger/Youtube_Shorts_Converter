import express from 'express'
import { createJobController, getJobController } from '../controllers/Job.controller.js'

const router = express.Router()

router.post('/jobs', createJobController)
router.get('/jobs/:jobId', getJobController)

export const jobRoutes = router
