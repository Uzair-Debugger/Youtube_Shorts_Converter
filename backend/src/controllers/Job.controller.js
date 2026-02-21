import os from 'os'
import path from 'path'
import { createJob, getJob } from '../services/JobState.service.js';
import { runJob } from '../services/JobRunner.service.js';
import { generateJobId } from '../utils/JobID.js'


export const createJobController = (req, res) => {
  const {noOfShorts, youtubeUrl} = req.body

  const jobId = generateJobId();

  const jobDir = path.join(os.tmpdir(), jobId) 

  createJob(jobId);

  // 🔥 background execution
  runJob(jobId, youtubeUrl, noOfShorts, jobDir);

  res.json({ 
    jobId: jobId,
    message: `Job created successfully`,
    youtubeUrl: youtubeUrl,
    noOfShorts: noOfShorts
  });
};



export const getJobController = (req, res) => {

  const { jobId } = req.params
  const job = getJob(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  res.json(job)
}