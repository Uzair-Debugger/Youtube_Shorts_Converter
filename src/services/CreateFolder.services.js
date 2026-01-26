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

// async function updateFile(folderName) {
//     const dirPath = path.join(os.tmpdir(), folderName);
//     const filePath = path.join(dirPath, 'demo.txt');

//     try {
//         const jobData = jobs.get(folderName);

//         if (!jobData) {
//             throw new Error('Job not found');
//         }

//         await fs.writeFile(
//             filePath,
//             JSON.stringify(jobData, null, 2),
//             'utf-8'
//         );

//         console.log('File updated successfully');
//     } catch (error) {
//         console.error(`Error: ${error.message}`);
//     }


// }


export const deleteJob = async (folderName) => {

    const dirPath = path.join(os.tmpdir(), folderName)


    try {
        await fs.rm(dirPath, { recursive: true, force: true })
        console.log(`${folderName} deleted successfully!`)
    } catch (error) {
        console.log(`Failed to delete ${folderName}, Error: ${error.message}`)
    }

}

