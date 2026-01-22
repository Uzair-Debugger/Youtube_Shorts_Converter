const { execCommand } = require('./OsCmdExec.services');
const { updateJob } = require('./Functions');
const { deleteJob } = require('./CreateFolder.services');

exports.runJob = async (jobId, command) => {
  try {
    await updateJob(jobId, 'Job started', 'processing', 10);

    const result = await execCommand(command);

    if (!result.success) {
      console.log(result)
      await updateJob(jobId, result.error, 'failed', 100);
      return;
    }

    await updateJob(jobId, 'Job completed', 'completed', 100);

    // await new Promise(res => setTimeout(res, 100));
    // await deleteJob(jobId);

  } catch (error) {
    await updateJob(jobId, error.message, 'failed', 100);
  }
};
