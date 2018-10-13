# imperial-lambda

Run concurrent scripts on AWS Lambda, push the results to SQS, download locally.

I initially made this to stress-test server configurations by making
a very large number of simultaneous HTTP requests from the Lambda, however,
you could more generally use this tool for anything that has a short
run time and would benefit from distribution to a large number of machines.

## Incomplete Project

There are many limitations described below, but one big limitation is
that this project was never quite finished so you might want to use
it more as a starting point. (I was able to test the server configuration
enough to demonstrate it would handle an instantaneous load spike from 0
to 25,000 requests per second, and that was sufficient for the client.)

If you'd like help stress testing your server, I'm
[available to help with that](https://davistobias.com/contact)!

## Lambda Limitations

By default Amazon limits you to 100 simultaneous Lambda instances, but
you can message Amazon and request them to increase the number.

Lambdas have a short runtime enforced. If your executed code does
not end before that time, it will be summarily terminated by AWS.

Lambdas also only have a single thread available, so depending on
your script, running concurrent functions may not be helpful. You
will primarily find a benefit if your scripts are spending a lot
of time in I/O operations, such as HTTP/database requests.

## Legal Concerns

**Misuse of this module could result in jail time.**

In particular, running load testing against a server is in
fact a type of DDoS attack. Doing this to a server/service
that you do not own is unethical and quite likely illegal.

If you are doing load testing, you may want to contact Amazon
and let them know what you are up to, so that they don't lock
down your account pre-emptively.

## Run Script

You will need to configure AWS (see below), and then proceed
with the following commands:

1. `build`: Configure SQS, construct the runnable script, and
    push it to Lambda.
3. `launch`: Make concurrent Lambda requests.

Run each of these with: `imperial-lambda [command]`

Get help on any command with: `imperial-lambda --help [command]`

### Options

Options can be set via the command line or in the configuratino file.

### Command Line Options

The following options can be set in the configuration file, or passed
in with the command line:

* `-s` / `--script` => `script`
* `-l` / `--lambdas` => `lambdas`
* `-c` / `--concurrent` => `concurrent`

Any value provided on the command line will overwrite the corresponding
value in the configuration file.

### Configuration File Options

The configuration file is a JSON object which is used to configure the
imperial-lambda runner. It has the following properties:

* `script` *(string, required)*: The path to the runnable script, relative
    to the JSON file.
* `data` *(optional)*: This object is passed to your runnable script.
* `lambdas` *(number, optional, default `1`)*: The number of lambdas to
    run simultaneously. (See below for limitations and concerns.)
* `concurrent` *(number, optional, default `1`)*: The number of
    concurrent processes to run. (Lambdas operate within a single thread,
    so you may not see any benefit to increasing this number.)

## Script Design

Your runnable script should look like this:

```js
export default function({ data, event, context }) {
    // do your work
    return THE_PAYLOAD_TO_PUT_IN_SQS
}
```

The `data` property is the `"data"` property of the configuration object
specified when running this program. For example, given this object:

```json
{
    "script": "./runnable.js",
    "data": "hello"
}
```

The property `data` provided to your runnable script would be `"hello"`.

The additional properties `event` and `context` are the AWS Lambda
provided properties.

## Saved Output

Your runnable script will be executed in AWS Lambda, possibly concurrently
with many other scripts. It may return a promise or a property.

If you return a property, that property will be placed as-is in SQS.

If you return a promise, an object will be placed in SQS containing the
following properties:

* `status` (string): This reflects the status of your promise, either
    `"resolved"` or `"rejected"`.
* `value`: This will be the result of the resolved or rejected promise.

These objects are placed in Amazon SQS as JSON objects, and those objects
are then saved locally.

## Setup AWS

You will need:

* properly configured IAM User
* properly configured IAM Role

Log in to the [AWS Console](https://console.aws.amazon.com/) and then:

### IAM User

1. Navigate to: `Services > IAM > Users > Add User`.
2. Name the user something like `imperial_cli`.
3. Give the user `Programmatic access`.
4. Configure permissions, using `Attach existing policies`:
    * `AmazonSNSFullAccess`
    * `AmazonSQSFullAccess`
    * `AWSLambdaFullAccess`
5. Review and create user.
6. Copy the `Access key ID` and the `Secret access key` for local use.

Create a file in `~/.aws/credentials` that looks like this:

```txt
[imperial_lambda]
aws_access_key_id=ACCESS_KEY_ID
aws_secret_access_key=SECRET_ACCESS_KEY
```

Replace the appropriate properties.

### IAM Role

1. Navigate to: `Services > IAM > Roles > Create Role`.
2. Select `AWS Service` and `Lambda` for a role type.
3. Attach the `AmazonSNSFullAccess` permission policy.
4. Select `Review` and name the role something like `imperial_shuttle`.
5. Review and create role.
6. Select the created role, and copy the `Role ARN` for local use.

### TODO: After Lambda Creation

This section should be automatable, but I can't figure out
how to do it. For now, after you run `build` you will need
to go out into Amazon to the Lambda, edit it, go into the
"Triggers" section, and add the created SNS as a trigger.

## License

This software and all documentation is published and released
under the [Very Open License](http://veryopenlicense.com).
