const { deleteJob } = require('./CreateFolder.services')
const { updateJob } = require('./Functions')
const { execCommand } = require('./OsCmdExec.services')

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
      const result = await execCommand('node -v');
      console.log(result.stdout) // You can see the response of your command exection | here it'll show nodejs current version

      if (!result.success) {
        console.log("Command execution failure! Cannot proceed further", result.message);
        await updateJob(jobId, result.error, "Failed", 100);
        await new Promise(res => setTimeout(res, 1000))

        try {
          await deleteJob(jobId)
        } catch (error) {
          console.error("Failed to delete job | ", error.message);
        }
        clearInterval(interval);
        return;
      }
      
    } catch (error) {
      console.log(`updateJob() Error: ${error.message}`)
    }
  }, 5000)
}
