const { exec } = require("child_process")
const util = require('util')
const execPromise= util.promisify(exec)

exports.audioExtractor = async (videoPath, audioPath) =>{
    try {
        const command = `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 "${audioPath}"`;

        await execPromise(command);
        
        return{success:true}
    } catch (error) {
        return{
            success: false,
            error: error.message
        }
    }
}