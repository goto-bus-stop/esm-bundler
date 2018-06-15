import util from 'util'
var promisify = util.promisify
import url from 'url'
var URL = url.URL
import path from 'path'
import fs from 'fs'
var readFile = promisify(fs.readFile)

function load (url) {
  return readFile(url.pathname, 'utf8')
}

var translators = new Map()

translators.set('builtin', async function (record) {
  return {
    cacheKey: record.url,
    id: record.url,
    source: 'export default import.meta.builtinRequire(' + JSON.stringify(new URL(record.url).pathname) + ')',
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
