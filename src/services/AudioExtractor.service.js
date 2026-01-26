import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

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