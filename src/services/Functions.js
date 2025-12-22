const jobs = require('../store/job');
const { updateFile, createFolder } = require('./CreateFolder.services');

// To create new Job
exports.createJob = async (jobid) => {
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
exports.updateJob = async (jobid, message, status, progress) => {
    if (!jobs.has(jobid)) return;


    Object.assign(jobs.get(jobid), {

        status,
        message,
        progress,
        updatedAt: new Date()
    });

   try {
    
       await updateFile(jobid)
   } catch (error) {
    console.log(`updateFile() Error: ${error.message}`)
   }
    
};


// To get the Job
exports.getJob = (jobid) => jobs.get(jobid)

