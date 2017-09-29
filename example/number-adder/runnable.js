/*
This demo serves no practical purpose other than to
make testing the final build possible.
*/
module.exports = ({ data }) => Promise.resolve({ number: data.number + 1 })
