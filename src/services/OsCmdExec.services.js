const util = require('util')
const { exec } = require('child_process');
const execPromise = util.promisify(exec)
// Counts the number of directory in
// current working directory

async function execCommand(command) {
    try{
        const {stderr, stdout} = await execPromise(command)
        
        return{
            success: true,
            stdout,
            stderr
        }
    }
    catch(error){
        return{
            success: false,
            error: error.message
        }
    }
}

module.exports = {execCommand};

/*Key Components Summary
const execPromise = util.promisify(exec): This line creates a new version of exec called execPromise that returns a Promise instead of requiring a callback.
const { stdout, stderr } = await execPromise(...): This uses destructuring to extract the output (stdout) and warnings (stderr) directly from the resolved Promise.  */

/* 
What’s happening (important):

exec() spawns a shell

Command runs outside Node

Node does NOT block

Result comes back via callback
*/