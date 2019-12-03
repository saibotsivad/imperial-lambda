const { promisify } = require('util')
const { format } = require('date-fns')
const fs = require('fs')
const CloudWatchLogs = require('aws-sdk/clients/cloudwatchlogs')

const writeFile = promisify(fs.writeFile)
const date = new Date().toISOString()
const csvStream = fs.createWriteStream(`logs-${date}.csv`, { flags: 'a' })
const jsonStream = fs.createWriteStream(`logs-${date}.json`, { flags: 'a' })
const logGroupName = '/aws/lambda/imperial-lambda-dev-imperial-lambda-fire'

csvStream.write([
	'id',
	'awsRequestId',
	'startDate',
	'startTime',
	'durationMillis',
	'statusCode',
	'etag'
].join(',') + '\n')

// 03/14/2012
const excelDate = date => format(date, 'MM/dd/yyyy')
// 1:30:55 PM
const excelTime = date => format(date, 'h:mm:ss a')

const toCsv = data => {
	const date = new Date(data.meta.start)
	return [
		data.id,
		data.meta.awsRequestId,
		excelDate(date),
		excelTime(date),
		data.meta.durationMillis,
		data.attributes.statusCode,
		data.attributes.headers.etag
	].join(',')
}

let lines = 0
const append = async data => {
	lines++
	if (lines % 100 === 0) {
		console.log(`Logging line ${lines}`)
	}
	jsonStream.write(JSON.stringify(data) + '\n')
	csvStream.write(toCsv(data) + '\n')
}

const parseLog = logString => {
	try {
		const [ , , , json ] = logString.message.split('\t')
		const data = JSON.parse(json)
		if (data.type === 'imperial_lambda_result') {
			return data
		}
	} catch (ignore) {
		// there are many CloudWatch events that are invalid JSON
		// and will throw here
	}
}

const handleLogEvents = async logs => {
	if (logs && logs.length) {
		for (const log of logs) {
			const data = parseLog(log)
			if (data) {
				await append(data)
			}
		}
	}
}

const work = async () => {
	const cloudwatchlogs = new CloudWatchLogs()

	const { logStreams } = await cloudwatchlogs
		.describeLogStreams({
			logGroupName,
			orderBy: 'LastEventTime',
			descending: true,
			limit: 1
		})
		.promise()

	// TODO there are going to be multiple log streams
	const [ { logStreamName } ] = logStreams

	const fetchLogs = async nextToken => cloudwatchlogs
		.getLogEvents({
			logGroupName,
			logStreamName,
			nextToken,
			startFromHead: true
		})
		.promise()

	let { events, nextForwardToken: previousToken } = await fetchLogs()
	handleLogEvents(events)

	while (previousToken) {
		const results = await fetchLogs(previousToken)
		handleLogEvents(results.events)
		previousToken = results.nextForwardToken === previousToken
			? false
			: results.nextForwardToken
	}
}

work()
	.then(() => {
		csvStream.end()
		jsonStream.end()
		process.exit(0)
	})
	.catch(error => {
		csvStream.end()
		jsonStream.end()
		console.error(error)
		process.exit(1)
	})
