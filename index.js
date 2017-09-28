const taskSetupBuild = require('./lib/task-0-setup-build')
const taskBuild = require('./lib/task-1-build')

module.exports = ({ buildFolder, script, lambdas, concurrent }, data) => {
    // There are X main tasks to perform:

    console.log('Setting up the build folder...')
    taskSetupBuild({ buildFolder, script, concurrent, data })

    console.log('Building the AWS Lambda script...')
    return taskBuild({ cwd: __dirname, buildFolder })
        .then(() => {
            // ----- #2: Push the script to AWS Lambda, executing the code. -----
            console.log('Pushing script to AWS Lambda...')
            console.log('Executing code...')
        })
        .then(() => {
            // ----- #3: Grab objects from Amazon SQS and save locally. -----
            console.log('Grabbing objects from Amazon SQS...')
        })
        .then(() => {
            // ----- #4: Make sure the AWS Lambda is shut down. -----
            console.log('Making sure the AWS Lambdas are shut down...')
        })
}
