import { jobs } from '../store/job.js';
import { createFolder } from './CreateFolder.services.js';

// To create new Job
export const createJob = async (jobid) => {
    jobs.set(jobid, {
        id: jobid,
        status: "Queued",
        message: "Job queued",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    try {

        await createFolder(jobid)
    } catch (error) {
        console.log(`createFolder() Error: ${error.message}`)
    }

}

// To update the job
export const updateJob = async (jobid, message, status, progress) => {
    if (!jobs.has(jobid)) return;


    Object.assign(jobs.get(jobid), {

        status,
        message,
        progress,
        updatedAt: new Date()
    });

    //    try {

    //        await updateFile(jobid)
    //    } catch (error) {
    //     console.log(`updateFile() Error: ${error.message}`)
    //    }

    console.log(message, status, progress,"%")
};


// To get the Job
export const getJob = (jobid) => jobs.get(jobid)

