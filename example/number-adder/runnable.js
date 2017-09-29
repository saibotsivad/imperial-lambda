/*
This demo serves no practical purpose other than to
make testing the final build possible.
*/
module.exports = ({ payload }) => Promise.resolve({
    number: (payload && payload.data && payload.data.number) + 1
})
