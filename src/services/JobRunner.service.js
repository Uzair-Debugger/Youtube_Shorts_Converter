const path = require('path')
const { downloadVideo } = require('./DownloadVideo.services');
const { updateJob } = require('./Functions');
const { deleteJob } = require('./CreateFolder.services');
const { audioExtractor } = require('./AudioExtractor.service');

exports.runJob = async (jobId, command, jobDir) => {
  try {
    const videoPath = path.join(jobDir, 'video.mp4')
    const audioPath = path.join(jobDir, 'audio.wav')

    await updateJob(jobId, 'Job started', 'processing', 10);

    const result = await downloadVideo(command);

    if (!result.success) {
      console.log(result)
      await updateJob(jobId, result.error, 'failed', 100);
      return;
    }

    await updateJob(jobId, 'Video downloaded', 'processing...', 60);
    
    const audioResult = await audioExtractor(videoPath, audioPath);
    if(!audioResult.success){
      await updateJob(jobId, audioResult.error, 'failed', 100);
      return;
    }
    
    await updateJob(jobId, 'Audio extracted', 'completed', 100)

    // await new Promise(res => setTimeout(res, 100));
    // await deleteJob(jobId);

  } catch (error) {
    await updateJob(jobId, error.message, 'failed', 100);
  }
};
