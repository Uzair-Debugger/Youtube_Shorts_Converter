import express from 'express'
import { createJobController, getJobController } from '../controllers/Job.controller.js'
import { downloadVideoController, downloadShortController, getShortsListController } from '../controllers/Download.controller.js'
const router = express.Router()

router.post('/convert', createJobController)
router.get('/status/:jobId', getJobController)
router.get('/download/:jobId', downloadVideoController)
router.get('/shorts/:jobId', getShortsListController)
router.get('/download/:jobId/:shortIndex', downloadShortController)

export const jobRoutes = router
