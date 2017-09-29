const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const createLambdaScript = require('../lib/create-lambda-script.js')
const createLambdaZip = require('../lib/create-lambda-zip.js')
const setupAmazonMessaging = require('../lib/aws-setup-messaging.js')
const createAmazonLambda = require('../lib/aws-create-lambda.js')

const forceHelpText = `A Lambda function already exists with that name.
You can delete it manually from AWS or use --force to overwrite it.'`

module.exports = (filePath, { region, queueName, role, force }) => {
    if (!role && !process.env.AWS_ROLE_ARN) {
        return Promise.reject('Must specify an AWS role using --role or exporting $AWS_ROLE_ARN')
    }

    try {
        fs.accessSync(filePath)
    } catch (error) {
        return Promise.reject('Could not locate runnable script at: ' + filePath)
    }

    const buildFolder = path.join(__dirname, '../docking-station')
    mkdirp.sync(buildFolder)

    console.log('Building Lambda runnable script...')
    return createLambdaScript({ scriptPath: filePath })
        .then(() => createLambdaZip())
        .then(zipFile => {

            console.log('Deploying to AWS as Lambda function...')
            return createAmazonLambda(zipFile, {
                force,
                region,
                // the passed in role overrides the ENV role
                role: process.env.AWS_ROLE_ARN || role
            })
            .catch(error => {
                if (error.name === 'ResourceConflictException') {
                    return Promise.reject(forceHelpText)
                }
                throw error
            })
        })
        .then(lambdaConfiguration => {
            console.log('Configuring AWS services...')
            return setupAmazonMessaging({
                region,
                queueName,
                lambdaArn: lambdaConfiguration.FunctionArn,
                lambdaName: lambdaConfiguration.FunctionName
            })
        })
        .then(awsConfiguration => {
            fs.writeFileSync(path.join(buildFolder, 'aws.json'), JSON.stringify(awsConfiguration, undefined, 2), { encoding: 'utf8' })
        })
}
