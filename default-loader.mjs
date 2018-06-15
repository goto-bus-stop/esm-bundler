import path from 'path'
import { promisify } from 'util'
import { URL } from 'url'
import nodeResolveCb from 'resolve'
var nodeResolve = promisify(nodeResolveCb)

function isESM (filename, pkg) {
  return path.extname(filename) === '.mjs'
}

export async function resolve (specifier, parent) {
  if (parent && parent.protocol !== 'file:') {
    throw new Error('Only file:// URLs are supported')
  }
  if (nodeResolve.isCore(specifier)) {
    return {
      url: specifier,
      format: 'builtin'
    }
  }

  var filename = await nodeResolve(specifier, {
    extensions: ['.mjs', '.js', '.json'],
    basedir: parent ? path.dirname(parent.pathname) : null
  })
  return {
    url: new URL('file://' + filename),
    format: isESM(filename, null) ? 'esm' : 'cjs'
  }
}
