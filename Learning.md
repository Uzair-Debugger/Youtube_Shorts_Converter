
# Step 2
>1. Client → POST /api/jobs

*  Hits createJobController

>2. Inside createJobController

* Generate a unique jobId (utils/JobID.js)

* Call createJob(jobId) (services/Functions.js) → adds job to Map with initial status queued

* Immediately call simulateJob(jobId) → starts async progress updates

>3. Inside simulateJob(jobId)

* Uses setInterval to periodically call updateJob(jobId, …)

* Updates status, progress, and message

* Once progress hits 100 → marks job completed and clears the interval

>4. Client → GET /api/jobs/:jobId

* Can poll anytime to see current job state

---

# Step 3___File system & cleanup
### Creating folder in Node Js

**Using "fs.promises.mkdir()" (Modern Async/Await):**

    const fs = require('fs').promises  
    const path = require('path');
    async function createFolder(folderName) 
    {

        const dirPath = path.join(__dirname,    folderName);

        try {
            await fs.mkdir(dirPath);
            console.log(`Directory '${folderName}'  created successfully!`);
        } catch (err) {
            console.error(`Error creating   directory: ${err.message}`);
        }
    }

    createFolder('myAsyncFolder');

### Creating File in Node Js

    async function updateFile(folderName) {
        const dirPath = path.join(__dirname,    folderName);
        const filePath = path.join(dirPath, 'demo.  txt');

        try {
            const jobData = jobs.get(folderName);

            if (!jobData) {
                throw new Error('Job not found');
            }

            await fs.writeFile(
                filePath,
                JSON.stringify(jobData, null, 2),
                'utf-8'
            );

            console.log('File updated   successfully');
            } 
            catch (error) {
            console.error(`Error: ${error.message}  `);
                }
        }

## SimulateJob.services.js
**await new Promise(res=>setTimeout(res, 100));**

    The code snippet await new Promise(res => setTimeout(res, 100)); is a standard JavaScript pattern used to create an asynchronous delay or "sleep" function. It pauses the execution of an async function for a specified duration without blocking the main JavaScript thread. 
Here is a breakdown of how it works:
new Promise(...): This creates a new JavaScript Promise object. A promise represents a value that may be available in the future.
res => setTimeout(res, 100): This is the executor function passed to the Promise constructor.
res (or resolve) is a function provided by the Promise implementation that, when called, resolves the promise.
setTimeout(res, 100) schedules the res (resolve) function to be called after a delay of 100 milliseconds.
await ...: This keyword can only be used inside an async function. It pauses the execution of the function until the promise settles (in this case, resolves). 
In summary, the entire line of code tells the program: "Pause here for 100 milliseconds, and then continue executing the rest of the code in this async function".
>However, it only pauses the execution of the current async function (the code using await), not the main synchronous JavaScript thread or other running code.
       
---
# STEP-4 — Running OS Commands from Node.js
---
## 4.1: OS command execution ✅
### Node Child Process
NodeJS is designed to be single-threaded, but it provides a child_process module to create and manage child processes. This allows you to run system commands, execute other scripts, and perform computationally expensive tasks in parallel.

**The child_process module in NodeJS provides four methods to create child processes:**

>spawn(): Launches a new process with a given command. It streams data between the parent and child processes.

>exec(): Runs a command in a shell and buffers the output. It’s useful for short-running commands.

>execFile(): Similar to exec, but it runs a specific executable file directly without a shell.

>fork(): A special case of spawn used to create NodeJS child processes. It enables communication between parent and child processes using send and on('message').