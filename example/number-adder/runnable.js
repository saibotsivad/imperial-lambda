/*
This demo serves no practical purpose other than to
make testing the final build possible.
*/
module.exports = ({ event }) => Promise.resolve({
    number: (event && event.data && event.data.number) + 1
})
