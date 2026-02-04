import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import { executeCommand } from './ExecuteCommand.services.js';
import path from 'path';

export const audioExtractor = async (videoPath, audioPath) => {
    try {
        const command = `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 "${audioPath}"`;

        await execPromise(command);

        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

export const createVerticalVideo = async (inputPath, jobDir) => {

    try {
        const outputPath = path.join(jobDir, 'short.mp4')
        const ffmpegCommand = `ffmpeg -i "${inputPath}" \
        -vf "split[original][copy]; \
    [copy]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=20[blurred]; \
    [original]scale=1080:-1[scaled]; \
    [blurred][scaled]overlay=(W-w)/2:(H-h)/2" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 128k -ar 44100 \
    -movflags +faststart \
    "${outputPath}"`;

        const result = await executeCommand(ffmpegCommand);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        return { success: true, outputPath };
    } catch (error) {
        console.error('Error creating vertical video:', error);
        return { success: false, error: error.message };
    }
}