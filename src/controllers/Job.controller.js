const { createJob, updateJob, getJob } = require('../services/Functions')
const { simulateJob } = require('../services/SimulateJob.services')
const { jobs } = require('../store/job')
const { generateJobId } = require('../utils/JobID')

exports.createJobController = (req, res) => {
    const jobId = generateJobId()

    createJob(jobId)
    simulateJob(jobId)

    res.json({ jobId })
}


exports.getJobController = (req, res) => {

    const { jobId } = req.params
    const job = getJob(jobId)

    if (!job) {
        return res.status(404).json({ error: 'Job not found' })
    }

    res.json(job)
}