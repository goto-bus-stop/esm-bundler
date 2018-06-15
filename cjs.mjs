import util from 'util'
var promisify = util.promisify
import browserify from 'browserify'

export default function cjsBundler () {
  var b = browserify({ externalRequireName: '__commonjsRequire__' })
  var hasCJS = false

  function add (module) {
    hasCJS = true
    b.require(module.filename, { expose: module.id })
  }

  function hasModules () {
    return hasCJS
  }

  async function toString () {
    var buf = await promisify(b.bundle).call(b)
    return 'var ' + buf.toString('utf8')
  }

  return {
    add: add,
    hasModules: hasModules,
    toString: toString
  }
}
