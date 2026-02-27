import fs from 'fs/promises'
import os from 'os'
import path from 'path';
import { jobs } from '../store/job.js';

export const createFolder = async (folderName) => {
    const dirPath = path.join(os.tmpdir(), folderName);
    try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Directory '${folderName}' created successfully!`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}


export const deleteJob = async (folderName) => {

    const dirPath = path.join(os.tmpdir(), folderName)


    try {
        await fs.rm(dirPath, { recursive: true, force: true })
        console.log(`${folderName} deleted successfully!`)
    } catch (error) {
        console.log(`Failed to delete ${folderName}, Error: ${error.message}`)
    }

}

