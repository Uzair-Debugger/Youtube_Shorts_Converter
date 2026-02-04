# Important Concepts:
## fs:
- fs module is a core built-in module in Node.js that provides an API for interacting with the file system.
- Browser JavaScript cannot access the file system directly, so fs functionality only works on the server side. 

### Setup:
1. import it into your JavaScript file using:

        const fs = require('fs');
2. ***Asynchronous vs. Synchronous:*** Most fs functions have both **asynchronous (non-blocking, generally preferred in busy applications)** and **synchronous (blocking)** versions. The *asynchronous methods often use a callback function or promises* to handle results.

#### Purpose: 
It allows you to perform operations on files and directories, such as:
1. Reading files (fs.readFile(), fs.readFileSync()).
2. Writing data to files 

        (fs.writeFile(), fs.writeFileSync()).
3. Appending data to files 

        (fs.appendFile()).
4. Deleting files 
        (fs.unlink(), fs.rmSync()).
4. Creating and removing directories 

        (fs.mkdir(), fs.rmdir()).
5. Getting file information/stats 

        (fs.stat()). 
>**fs.readFile(path, options, callback)** vs **fs.createReadStream(path, {options})**:

* fs.readFile will load the entire file into memory as you pointed out, while as fs.createReadStream will read the file in chunks of the size you specify.

The client will also start receiving data faster using fs.createReadStream as it is sent out in chunks as it is being read, while as fs.readFile will read the entire file out and only then start sending it to the client. This might be negligible, but can make a difference if the file is very big and the disks are slow.


## formData:
> FormData is just an encoder.
That’s it.

- It takes key–value pairs + files and converts them into a format called:

        multipart/form-data


>This format is designed for sending binary data (files) together with normal fields over HTTP.

**👉 FormData does NOT:**

parse anything, validate anything, store anything, understand audio, images, or JSON, act as middleware

>It only serializes data for transport.   

***Why multipart/form-data exists at all***
- HTTP bodies can only be text.But files are binary.
- So multipart/form-data solves this by:
    - Splitting the body into parts
    - Separating parts using a boundary
    - Attaching metadata to each part


FormData builds this mess for you so you don’t lose your sanity.

>Why YOU are using FormData in this code

In your case:

    formData.append('file', fs.createReadStream(audioPath))
    formData.append('model', 'whisper-large-v3')


You are saying:
```
“Hey Groq API, here’s a file and some config fields — please treat this as a single request.”
```
And Groq’s API expects multipart/form-data, because:

- Audio files are large

- Streaming is efficient

- JSON + base64 would be slower and memory-heavy

- So FormData is used because JSON is a bad fit for files.

>Why not just use JSON?

Because JSON would require:

- Reading the entire file into memory
- Base64-encoding it (adds ~33% size)
- Slower transmission
- More RAM usage
- More CPU

>Multipart/form-data:
- Streams files
- Sends bytes as-is
- Scales better
- Is the industry standard for uploads

That’s why APIs like:
- OpenAI / Groq (audio, images)
- S3-compatible services
- Media pipelines

all use multipart/form-data.

>Client vs Server (this clears most confusion)

Client side (your code):
```
FormData → builds multipart request → send to API
```

Server side (Express, Nest, Fastify)
```
multipart request → parser (multer) → req.file / req.body
```

**- Same format. Different direction.
Different responsibility.**

- FormData = writer
- Multer = reader

==================================
# WORKFLOW
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