const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

const runnable = script => `// This is an automatically built file. Do not edit it.
import runnable from '${script}'
export default runnable
`

module.exports = ({ buildFolder, script, concurrent, data }) => {
    // make the build folder to hold files
    mkdirp.sync(buildFolder)
    // write the runnable data as a JSON file for importing
    fs.writeFileSync(path.join(buildFolder, 'configuration.json'), JSON.stringify({ concurrent, data }, undefined, 2), { encoding: 'utf8' })
    // write a module file which our scripts can then reference
    fs.writeFileSync(path.join(buildFolder, 'runnable.js'), runnable(script), { encoding: 'utf8' })
}
