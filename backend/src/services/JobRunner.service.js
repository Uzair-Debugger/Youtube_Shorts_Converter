import path from 'path';
import { executeCommand } from './ExecuteCommand.services.js';
import { updateJob, addShortDetails } from './JobState.service.js';
import { deleteJob } from './CreateFolder.services.js';
import { audioExtractor } from './Media.service.js';
import { analyzeBestMoment, transcribe } from './Ai.services.js';

export const runJob = async (jobId, youtubeUrl, noOfShorts, jobDir) => {
  try {

    const videoPath = path.join(jobDir, 'video.mp4');
    const audioPath = path.join(jobDir, 'audio.wav');
    const compressedAudio = path.join(jobDir, 'compressed.mp3');


    // ---------------- GET VIDEO INFO ----------------
    const infoCommand = `yt-dlp --dump-json --no-warnings "${youtubeUrl}"`;
    const { stdout: infoJson } = await executeCommand(infoCommand);

    let videoDuration = 0;
    try {
      const videoInfo = JSON.parse(infoJson);
      videoDuration = videoInfo.duration || 0;
    } catch {
      console.warn("Could not parse video duration");
    }


    await updateJob(jobId, 'Directory Created', 'Downloading Video...', 10);


    // ---------------- DOWNLOAD VIDEO ----------------
    const downloadCommand = `yt-dlp -f mp4 -o "${videoPath}" "${youtubeUrl}"`;
    const result = await executeCommand(downloadCommand);

    if (!result.success) {
      
      await updateJob(jobId, 'failed', result.error, 0);
      return;
    }


    await updateJob(jobId, 'Video downloaded', 'Extracting Audio...', 30);


    // ---------------- EXTRACT AUDIO ----------------
    const audioResult = await audioExtractor(videoPath, audioPath);

    if (!audioResult.success) {
      await updateJob(jobId, 'failed', audioResult.error, 0);
      return;
    }


    // ---------------- COMPRESS AUDIO ----------------
    const compressCommand =
      `ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -map 0:a -c:a mp3 -b:a 64k "${compressedAudio}"`;

    await executeCommand(compressCommand);


    await updateJob(jobId, "Audio Extracted & Compressed", "Transcribing...", 40);


    // ---------------- TRANSCRIBE ----------------
    const transcribeAudio = await transcribe(compressedAudio);

    if (!transcribeAudio?.text) {
      await updateJob(jobId, "Failed", "Transcription failed", 0);
      return;
    }

    console.log("TRANSCRIPT READY");


    await updateJob(jobId, 'Audio Transcribed', 'Analyzing best moment...', 60);


    // ---------------- ANALYZE ----------------
    const bestMoment = await analyzeBestMoment(
      transcribeAudio.text,
      noOfShorts,
      videoDuration
    );

    console.log("AI RESULT:", bestMoment);


    if (!bestMoment || !Array.isArray(bestMoment.segments)) {
      throw new Error("AI returned invalid segments structure");
    }

    const momentsList = bestMoment.segments;


    await updateJob(jobId, 'Analyzed the Best Moment', 'Converting to Short', 80);


    // ---------------- CUT SHORTS ----------------
    let created = 0;

    for (let x = 0; x < momentsList.length && created < noOfShorts; x++) {

      const seg = momentsList[x];

      const start = Number(seg.startTime);
      const end = Number(seg.endTime);

      // HARD VALIDATION
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        console.warn("Skipping invalid segment:", seg);
        continue;
      }

      const duration = end - start;

      const inputPath = path.join(jobDir, `input${created + 1}.mp4`);

      console.log(`Creating short ${created+1}: start=${start}, duration=${duration}`);

      const cutCommand =
        `ffmpeg -i "${videoPath}" -ss ${start} -t ${duration} -c:v libx264 -preset fast -c:a aac "${inputPath}"`;

      const createShort = await executeCommand(cutCommand);

      if (!createShort.success) {
        console.error("FFmpeg failed:", createShort.error);
        continue;
      }

      // SAVE METADATA
      addShortDetails(jobId, created, {
        index: created + 1,
        filename: `input${created + 1}.mp4`,
        startTime: start,
        endTime: end,
        duration,
        title: seg.title || '',
        reason: seg.reason || '',
        hook: seg.hook || '',
        createdAt: new Date()
      });

      created++;
    }


    if (created === 0) {
      throw new Error("AI failed to generate usable segments");
    }


    await updateJob(jobId, 'completed', 'Short created Successfully', 100);

    // await deleteJob(jobId);

  }
  catch (error) {

    console.error("JOB ERROR:", error);
    await updateJob(jobId, 'failed', error.message, 0);

  }
};