import path from 'path'
import os from 'os'
import { createJob, getJob } from '../services/JobState.service.js';
import { runJob } from '../services/JobRunner.service.js';
import { generateJobId } from '../utils/JobID.js'

export const createJobController = (req, res) => {
  const jobId = generateJobId();
  //   const { command } = req.body; // get url from frontend

  const jobDir = path.join(os.tmpdir(), jobId) // configure path later in .env for deployment
  const youtubeUrl = `https://youtu.be/V101LJO1mhc`

  createJob(jobId);

  // 🔥 background execution
  runJob(jobId, youtubeUrl, jobDir);

  res.json({ jobId });
};



export const getJobController = (req, res) => {

  const { jobId } = req.params
  const job = getJob(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  res.json(job)
}