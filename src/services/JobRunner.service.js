import path from 'path';
import { executeCommand } from './ExecuteCommand.services.js';
import { updateJob } from './JobState.service.js';
import { deleteJob } from './CreateFolder.services.js';
import { audioExtractor, createVerticalVideo } from './Media.service.js';
import { analyzeBestMoment, transcribe } from './Ai.services.js';

export const runJob = async (jobId, youtubeUrl, jobDir) => {
  try {
    const videoPath = path.join(jobDir, 'video.mp4')
    const audioPath = path.join(jobDir, 'audio.wav')
    const compressedAudio = path.join(jobDir, 'compressed.mp3')
    const downloadCommand = `yt-dlp -f mp4 -o "${jobDir}/video.mp4" ${youtubeUrl}`

    const infoCommand = `yt-dlp --dump-json --no-warnings "${youtubeUrl}"`
    const { stdout: infoJson } = await executeCommand(infoCommand)
    const videoInfo = JSON.parse(infoJson);
    const videoDuration = videoInfo.duration;

    await updateJob(jobId, 'Job started', 'processing', 10);

    const result = await executeCommand(downloadCommand);

    if (!result.success) {
      console.log(result)
      await updateJob(jobId, result.error, 'failed', 0);
      return;
    }

    await updateJob(jobId, 'Video downloaded', 'processing...', 30);

    const audioResult = await audioExtractor(videoPath, audioPath);
    if (!audioResult.success) {
      await updateJob(jobId, audioResult.error, 'failed', 0);
      return;
    }

    const compressCommand = `ffmpeg -i ${audioPath} -ar 16000 -ac 1 -map 0:a -c:a mp3 -b:a 64k ${compressedAudio}`
    const compressFile = await executeCommand(compressCommand)

    await updateJob(jobId, "Compressed File", "Transcribing...", 40)

    const transcribeAudio = await transcribe(compressedAudio)

    if (!transcribeAudio) {
      console.log("Audio Transcription failed!");
      await updateJob(jobId, "Transcription failed", "Failed", 0)
      return;
    }
    console.log(transcribeAudio.text)

    await updateJob(jobId, 'Audio Transcribed', 'Analyzing best moment...', 60)

    const bestMoment = await analyzeBestMoment(transcribeAudio.text, videoDuration)
    console.log("BestMoment: ", bestMoment)
    await updateJob(jobId, 'Analyzed the Best Moment', 'processing...', 80)
    // await new Promise(res => setTimeout(res, 100));
    // await deleteJob(jobId);
    const inputPath = path.join(jobDir, 'input.mp4')
    console.log(`startTime: ${bestMoment.startTime}, EndTime: ${bestMoment.endTime}`)

    // Use ffmpeg to cut the section from the already-downloaded video instead
    const duration = bestMoment.endTime - bestMoment.startTime;
    const cutCommand = `ffmpeg -i "${videoPath}" -ss ${bestMoment.startTime} -t ${duration} -c:v libx264 -preset fast -c:a aac "${inputPath}"`;
    const downloadResult = await executeCommand(cutCommand);

    if (!downloadResult.success) {
      await updateJob(jobId, downloadResult.error, 'failed', 0);
      return;
    }

    const videoResult = await createVerticalVideo(inputPath, jobDir);
    if (!videoResult.success) {
      await updateJob(jobId, videoResult.error, 'failed', 0);
      return;
    }

    await updateJob(jobId, 'Short is ready', 'Short created Successfully', 90)
    const outputPath = videoResult.outputPath;

  } catch (error) {
    console.log("Error: ", error)
    await updateJob(jobId, error.message, 'failed', 0);
  }
};
