#!/bin/bash

# Create an AWS user with an administration policy, then set the
# details here.
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=abc123
export AWS_SECRET_ACCESS_KEY=supersecret

# If the execution logic is creating lots of objects, or if you are
# making a large number of concurrent HTTP requests, or similar types
# of things, you will want to bump this up.
#
# In the CloudWatch logs, at the end of the Lambda execution, you will
# see a line that looks like this:
#
#   REPORT RequestId: a602c9e7-da11-482d-84a6-694865d6d6ad  Duration: 6.48 ms Billed Duration: 100 ms Memory Size: 128 MB Max Memory Used: 71 MB  Init Duration: 133.07 ms
#
# You are charged by AWS based on execution time, number of executions,
# and allocated memory, so if you are doing large or continued operations
# you will want to tweak the memory size and timeout here appropriately.
# (This will probably require manual testing to figure out for your application.)

export IMPERIAL_LAMBDA_MEMORY_SIZE=256
export IMPERIAL_LAMBDA_TIMEOUT_SECONDS=300
export IMPERIAL_LAMBDA_FLEET_COUNT=10
