import path from 'path';
import { executeCommand } from './ExecuteCommand.services.js';
import { updateJob, addShortDetails } from './JobState.service.js';
import { deleteJob } from './CreateFolder.services.js';
import { audioExtractor, createVerticalVideo } from './Media.service.js';
import { analyzeBestMoment, transcribe } from './Ai.services.js';

export const runJob = async (jobId, youtubeUrl, noOfShorts, jobDir) => {
  try {
    const videoPath = path.join(jobDir, 'video.mp4')
    const audioPath = path.join(jobDir, 'audio.wav')
    const compressedAudio = path.join(jobDir, 'compressed.mp3')

    const infoCommand = `yt-dlp --dump-json --no-warnings "${youtubeUrl}"`
    const { stdout: infoJson } = await executeCommand(infoCommand)

    const videoInfo = JSON.parse(infoJson);
    const videoDuration = videoInfo.duration;

    await updateJob(jobId, 'Directory Created', 'Downloading Video...', 10);
    
    const downloadCommand = `yt-dlp -f mp4 -o "${jobDir}/video.mp4" ${youtubeUrl}`
    const result = await executeCommand(downloadCommand);

    if (!result.success) {
      console.log(result)
      await updateJob(jobId, result.error, 'failed', 0);
      return;
    }

    await updateJob(jobId, 'Video downloaded', 'Extracting Audio...', 30);

    const audioResult = await audioExtractor(videoPath, audioPath);
    if (!audioResult.success) {
      await updateJob(jobId, audioResult.error, 'failed', 0);
      return;
    }

    const compressCommand = `ffmpeg -i ${audioPath} -ar 16000 -ac 1 -map 0:a -c:a mp3 -b:a 64k ${compressedAudio}`
    const compressFile = await executeCommand(compressCommand)

    await updateJob(jobId, "Audio Extracted & Compressed", "Transcribing...", 40)

    const transcribeAudio = await transcribe(compressedAudio)

    if (!transcribeAudio) {
      console.log("Audio Transcription failed!");
      await updateJob(jobId, "Transcription failed", "Failed", 0)
      return;
    }
    console.log(transcribeAudio.text)

    await updateJob(jobId, 'Audio Transcribed', 'Analyzing best moment...', 60)

    const bestMoment = await analyzeBestMoment(transcribeAudio.text, noOfShorts, videoDuration)
    console.log("BestMoment: ", bestMoment)
    await updateJob(jobId, 'Analyzed the Best Moment', 'Converting to Short', 80)

    // Ensure bestMoment is an array
    const momentsList = Array.isArray(bestMoment) ? bestMoment : [bestMoment];

    for (let x = 0; x < noOfShorts && x < momentsList.length; x++) {
      const inputPath = path.join(jobDir, `input${x + 1}.mp4`)
      console.log(`Short no ${x + 1}: startTime: ${momentsList[x].startTime}, EndTime: ${momentsList[x].endTime}`)
      console.log(`Output path: ${inputPath}`)
      const duration = momentsList[x].endTime - momentsList[x].startTime;

      // Use ffmpeg to cut the section from the already-downloaded video instead
      const cutCommand = `ffmpeg -i "${videoPath}" -ss ${momentsList[x].startTime} -t ${duration} -c:v libx264 -preset fast -c:a aac "${inputPath}"`;
      console.log(`Executing: ${cutCommand}`);
      const createShort = await executeCommand(cutCommand);

      // console.log(`FFmpeg result - Success: ${createShort.success}`);
      if (createShort.stderr) console.log(`FFmpeg stderr: ${createShort.stderr.substring(0, 500)}`);
      if (!createShort.success) {
        console.error(`FFmpeg error: ${createShort.error}`);
        await updateJob(jobId, `FFmpeg error: ${createShort.error}`, 'failed', 0);
        return;
      }

      // Save short details with AI analysis
      addShortDetails(jobId, x, {
        index: x + 1,
        filename: `input${x + 1}.mp4`,
        startTime: momentsList[x].startTime,
        endTime: momentsList[x].endTime,
        duration: duration,
        title: momentsList[x].title || '',
        reason: momentsList[x].reason || '',
        hook: momentsList[x].hook || '',
        createdAt: new Date()
      });

    }

    await updateJob(jobId, 'completed', 'Short created Successfully', 100)
 
    // await new Promise(res => setTimeout(res, 100));
    // await deleteJob(jobId);

  } catch (error) {
    console.log("Error: ", error)
    await updateJob(jobId, error.message, 'failed', 0);
  }
};
