const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const buildZippedScript = require('../lib/build-zipped-script.js')
const setupAmazonSqs = require('../lib/setup-amazon-sqs.js')
const createAmazonLambda = require('../lib/aws-create-lambda.js')

module.exports = (filePath, { region, queueName, role }) => {
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

    console.log('Configuring AWS services...')
    return setupAmazonSqs({ region, queueName })
        .then(awsConfiguration => {
            fs.writeFileSync(path.join(buildFolder, 'aws.json'), JSON.stringify(awsConfiguration, undefined, 2), { encoding: 'utf8' })

            console.log('Building Lambda runnable script...')
            return buildZippedScript({ scriptPath: filePath })
                .then(zipFile => {

                    console.log('Deploying to AWS as Lambda function...')
                    return createAmazonLambda(zipFile, {
                        region,
                        role: role || process.env.AWS_ROLE_ARN
                    })
                    .catch(error => {
                        if (error.name === 'ResourceConflictException') {
                            return Promise.reject('A Lambda function already exists with that name.\nYou will need to delete it manually from AWS.')
                        }
                        throw error
                    })
                })
        })
}
