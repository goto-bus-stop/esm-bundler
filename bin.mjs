import minimist from 'minimist'
import bundle from './'

var argv = minimist(process.argv.slice(2))

bundle(argv._[0], argv).then(console.log)
