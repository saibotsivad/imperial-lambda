const test = require('tape')
const path = require('path')
const mkdirp = require('mkdirp')
const load = require('../../commands/load')

const buildFolder = path.join(process.cwd(), '.test-command-load')
mkdirp.sync(buildFolder)

const pass = (context, cb) => {
    context.value = context.value || 0
    context.value++
    cb(null, context)
}
const aws = () => ({
    createTopic: pass,
    createQueue: pass,
    getQueueArn: pass,
    subscribeToTopic: pass,
    setQueueAttributes: pass,
    createLambda: () => Promise.resolve()
})

test('that the load completes and writes file', t => {
    process.env.AWS_PROFILE = 'mock this in because the AWS SDK requires it'
    load({ buildFolder, role: 'being awesome', aws })
        .then(() => {
            const builtJson = require(path.join(buildFolder, 'aws.json'))
            t.equal(builtJson.value, 5, 'asserting that the waterfall accumulates')
            t.end()
        })
})
