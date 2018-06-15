import url from 'url'
var URL = url.URL
import util from 'util'
var promisify = util.promisify
import path from 'path'
import acorn from 'acorn-node'
import scan from 'scope-analyzer'
import multisplice from 'multisplice'
import identifierfy from 'identifierfy'
import detect from './detect.mjs'
import * as defaultLoader from './default-loader.mjs'
import translators from './translators.mjs'
import cjsBundler from './cjs.mjs'

function parse (src) {
  return acorn.parse(src, { sourceType: 'module' })
}

export default async function bundle (entry, opts) {
  if (!opts) opts = {}

  var modules = new Map()
  var id = 0
  var cjs = opts.cjs === false ? null : cjsBundler()

  var loaders = [defaultLoader]
  var context = {
    loaders: loaders
  }

  var entryPath = path.join(process.cwd(), entry)

  var entryModule = await importFile(context, entryPath)
  wire()
  return pack(modules)

  async function importFile (context, name, from) {
    var loader = context.loaders[0]
    var record = await loader.resolve(name, from)

    record.id = id++
    record.url = record.url + ''
    if (record.format === 'builtin') {
      record.url = 'node:' + record.url
    }
    if (modules.has(record.url)) {
      return record.url
    }

    var translate = translators.get(record.format)
    var module = await translate(record)

    if (record.format === 'builtin' && cjs) {
      cjs.add({
        filename: module.id.slice(5),
        id: module.id.slice(5),
      })
    }
    if (record.format === 'cjs' && cjs) {
      cjs.add(module)
    }

    var ast = parse(module.source)
    scan.crawl(ast)
    var m = detect(ast)
    Object.assign(module, {
      ast: ast,
      imports: m.imports,
      exports: m.exports
    })

    modules.set(module.cacheKey, module)

    await Promise.all(module.imports.map(async function (imp) {
      imp.resolved = await importFile(context, imp.source, new URL(record.url))
    }))

    return module.cacheKey
  }

  function wire () {
    modules.forEach(function (module) {
      if (!module.ast) return
      var scope = scan.scope(module.ast)
      var edit = multisplice(module.source)
      var importBindings = new Set(module.imports.map(function (i) { return i.binding }))
      var imports = new Map(module.imports.map(function (i) { return [i.binding, i] }))

      // Rename global variables and imports.
      scope.bindings.forEach(function (binding) {
        var name = module.id + '_' + binding.name

        if (importBindings.has(binding)) {
          var imp = imports.get(binding)
          var importedModule = modules.get(imp.resolved)
          var exp = importedModule.exports.find(function (ex) {
            return ex.name === imp.imported
          })
          name = exp
            ? importedModule.id + '_' + (exp.local || exp.name)
            : '__IMPORTED__' + name
        }

        name = identifierfy(name)

        binding.getReferences().forEach(function (ref) {
          // Skip renaming imported names inside `import` statements, as we'll remove those anyway
          if (importBindings.has(binding) && binding.definition === ref) return

          edit.splice(ref.start, ref.end, name)
        })
      })

      // Remove import statements.
      module.imports.forEach(function (imp) {
        edit.splice(imp.node.start, imp.node.end, '/* ' + module.source.slice(imp.node.start, imp.node.end) + ' */')
      })

      // Replace `export` syntax with variable declarations where necessary.
      module.exports.forEach(function (exp) {
        var replace = '/* ' + module.source.slice(exp.node.start, exp.node.declaration.start) + ' */'
        if (!exp.local) {
          replace += ' var ' + identifierfy(module.id + '_' + exp.name) + ' = '
        }
        edit.splice(exp.node.start, exp.node.declaration.start, replace)
      })

      module.source = edit.toString()
    })
  }

  // Sort modules in their execution order.
  function sort () {
    var ordered = []
    var module = modules.get(entryModule)
    recurse(module)
    function recurse (module) {
      var i = ordered.indexOf(module)
      if (i !== -1) ordered.splice(i, 1)
      module.imports.forEach(function (imp) {
        recurse(modules.get(imp.resolved))
      })
      ordered.push(module)
    }
    return ordered
  }

  async function pack () {
    var code = '(function () {'
    if (cjs && cjs.hasModules()) {
      code += '\n\n' + await cjs.toString()
    }
    sort(modules).forEach(function (module) {
      code += '\n\n' + module.source.replace(/^#!/, '//#!')
    })
    code += '\n\n})();'
    return code
  }
}
