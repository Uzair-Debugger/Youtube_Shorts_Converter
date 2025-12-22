const { deleteJob } = require('./CreateFolder.services')
const { updateJob } = require('./Functions')

exports.simulateJob = (jobId) => {
  let progress = 0

  const interval = setInterval(async () => {
    progress += 20

    if (progress >= 100) {
      try {
        await updateJob(jobId, 'Job completed', 'completed', 100)
      }
      catch (error) {
        console.log(`updateJob() Error: ${error.message}`)
      }

      await new Promise(res => setTimeout(res, 100));
      /*Add a small delay of 100ms because in real systems:
      => File system can still be flushing writes
      => Last updateFile may not fully complete */
      
      try {
        await deleteJob(jobId);
      } catch (error) {
        console.log(`deleteJob() Error: ${error.message}`)
      }
      clearInterval(interval)
      return
    }

    try {
      await updateJob(jobId, 'Processing...', 'processing', progress)
    } catch (error) {
      console.log(`updateJob() Error: ${error.message}`)
    }
  }, 5000)
}
