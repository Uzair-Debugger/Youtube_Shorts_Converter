const path = require('path')
const os = require('os')
const { createJob } = require('../services/Functions');
const { runJob } = require('../services/JobRunner.service');
const { generateJobId } = require('../utils/JobID')

exports.createJobController = (req, res) => {
  const jobId = generateJobId();
  //   const { command } = req.body; // get url from frontend

  const jobDir =  path.join(os.tmpdir(), jobId) // configure path later in .env for deployment
  const command = `yt-dlp -f mp4 -o "${jobDir}/video.mp4" https://youtu.be/eCvYgEslNVI`

  createJob(jobId);

  // 🔥 background execution
  runJob(jobId, command, jobDir);

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