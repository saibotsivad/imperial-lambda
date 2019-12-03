const { get, set } = require('dot-prop')
const got = require('got')
const promiseAll = require('p-all')

const type = 'imperial_lambda_result'

const formatException = e => ({
	status: '500',
	code: e.name,
	title: e.message,
	meta: {
		stack: e.stack
	}
})

module.exports.handler = async (event, context) => {
	const {
		config: {
			id: lambdaId,
			concurrent: concurrentExecutions = 10,
			response: responseFields = [ 'statusCode', 'headers.etag' ],
			parameters: globalParameters = {}
		},
		payloads = []
	} = event
	const { awsRequestId } = context

	await promiseAll(payloads.map((lambdaParameters, index) => async () => {
		const id = `${lambdaId}:${index}`
		const start = new Date().getTime()

		const log = result => console.log(JSON.stringify({
			id,
			type,
			meta: {
				awsRequestId,
				start,
				durationMillis: new Date().getTime() - start
			},
			...result
		}))

		try {
			const options = { ...globalParameters, ...lambdaParameters }
			const response = await got(options)
			log({
				attributes: responseFields.reduce((map, field) => {
					set(map, field, get(response, field))
					return map
				}, {})
			})
		} catch (error) {
			log({
				errors: [ formatException(error) ]
			})
		}
	}), { concurrency: concurrentExecutions })
}
