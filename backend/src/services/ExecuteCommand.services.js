import util from 'util';
import { exec } from 'child_process';
const execPromise = util.promisify(exec);
// Counts the number of directory in
// current working directory

export const executeCommand = async (command) => {
    try {
        const { stderr, stdout } = await execPromise(command)

        return {
            success: true,
            stdout,
            stderr
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

