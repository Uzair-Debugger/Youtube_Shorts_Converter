const { updateJob } = require('./Functions')

exports.simulateJob = (jobId) => {
  let progress = 0

  const interval = setInterval(() => {
    progress += 20

    if (progress >= 100) {
      updateJob(jobId, 'Job completed', 'completed', 100)
      clearInterval(interval)
      return
    }

    updateJob(jobId, 'Processing...', 'processing', progress)
  }, 5000)
}
