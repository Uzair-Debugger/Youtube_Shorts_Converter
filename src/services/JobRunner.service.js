import path from 'path';
import { downloadVideo } from './DownloadVideo.services.js';
import { updateJob } from './Functions.js';
import { deleteJob } from './CreateFolder.services.js';
import { audioExtractor } from './AudioExtractor.service.js';
import { transcribe } from './Transcription.js';

export const runJob = async (jobId, command, jobDir) => {
  try {
    const videoPath = path.join(jobDir, 'video.mp4')
    const audioPath = path.join(jobDir, 'audio.wav')

    await updateJob(jobId, 'Job started', 'processing', 10);

    const result = await downloadVideo(command);

    if (!result.success) {
      console.log(result)
      await updateJob(jobId, result.error, 'failed', 0);
      return;
    }

    await updateJob(jobId, 'Video downloaded', 'processing...', 60);
    
    const audioResult = await audioExtractor(videoPath, audioPath);
    if(!audioResult.success){
      await updateJob(jobId, audioResult.error, 'failed', 0);
      return;
    }

    const transcribeAudio = await transcribe(audioPath)

    // if(!transcribeAudio.success){
    //   console.log("Audio Transcription failed!");
    //   await updateJob(jobId, "Transcription failed", "Failed", 0)
    //   return;
    // }
    
    await updateJob(jobId, 'Audio extracted', 'completed', 100)

    // await new Promise(res => setTimeout(res, 100));
    // await deleteJob(jobId);

  } catch (error) {
    await updateJob(jobId, error.message, 'failed', 0);
  }
};
