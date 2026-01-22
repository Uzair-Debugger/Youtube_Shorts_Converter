const path = require('path')
const { createJob } = require('../services/Functions');
const { runJob } = require('../services/JobRunner.service');
const { generateJobId } = require('../utils/JobID')

exports.createJobController = (req, res) => {
  const jobId = generateJobId();
  //   const { command } = req.body; // get url from frontend

  const jobDir =  path.join('D:', 'videos') // configure path later in .env for deployment
  const command = `yt-dlp -o "${jobDir}/%(title)s.%(ext)s" https://youtu.be/eCvYgEslNVI`; // testing my own url

  createJob(jobId);

  // 🔥 background execution
  runJob(jobId, command);

  res.json({ jobId });
};



exports.getJobController = (req, res) => {

  const { jobId } = req.params
  const job = getJob(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  res.json(job)
}