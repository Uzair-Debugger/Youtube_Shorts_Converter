const jobs = require('../store/job')

// To create new Job
exports.createJob = (jobid) =>{
    jobs.set(jobid, {
        id: jobid,
        status: "Queued",
        message: "Job queued",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

// To update the job
exports.updateJob = (jobid, message,status, progress) =>{
    if(!jobs.has(jobid)) return;
    

    Object.assign(jobs.get(jobid), {
        
        status,
        message,
        progress,
        updatedAt : new Date()
    });
};

// To get the Job
exports.getJob = (jobid) => jobs.get(jobid)

