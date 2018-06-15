import { promisify } from 'util'
import { URL } from 'url'
import path from 'path'
import { readFile as readFileCb } from 'fs'
var readFile = promisify(readFileCb)

function load (url) {
  return readFile(url.pathname, 'utf8')
}

var translators = new Map()

translators.set('builtin', async function (record) {
  var name = new URL(record.url).pathname
  var builtin = await import(name)
  var exportsKeys = Object.keys(builtin)
  return {
    cacheKey: record.url,
    id: record.url,
    source:
      'var builtin = import.meta.builtinRequire(' + JSON.stringify(name) + ');\n' +
      exportsKeys.map(function (name) {
        if (name === 'default') return 'export default builtin;'
        return 'export var ' + name + ' = builtin.' + name + ';'
      }).join('\n') + '\n',
  }
})

translators.set('cjs', async function (record) {
  var filename = new URL(record.url).pathname
  var id = toId(record.url, record.id)
  return {
    cacheKey: record.url,
    id: id,
    filename: filename,
    source: 'export default import.meta.browserifyRequire(' + JSON.stringify(id) + ')',
  }
})

translators.set('esm', async function (record) {
  var src = await load(new URL(record.url))
  return {
    cacheKey: record.url,
    id: toId(record.url, record.id),
    source: src,
  }
})

export default translators

function toId (url, id) {
  var parts = path.parse(new URL(url).pathname)
  return (parts.name === 'index' ? path.basename(parts.dir) : parts.name) + id
}
