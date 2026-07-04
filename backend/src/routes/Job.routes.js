import express from 'express'
import { createJobController, getJobController } from '../controllers/Job.controller.js'
import { downloadVideoController, downloadShortController, getShortsListController } from '../controllers/Download.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const jobRouter = express.Router()

jobRouter.use(authenticate)

jobRouter.post('/convert', createJobController)
jobRouter.get('/status/:jobId', getJobController)
jobRouter.get('/download/:jobId', downloadVideoController)
jobRouter.get('/shorts/:jobId', getShortsListController)
jobRouter.get('/download/:jobId/:shortIndex', downloadShortController)

export default jobRouter;
