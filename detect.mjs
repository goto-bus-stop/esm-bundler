import scan from 'scope-analyzer'

export default function detect (ast) {
  var imports = []
  var exports = []
  ast.body.forEach(function (node) {
    if (node.type === 'ImportDeclaration') {
      addImports(imports, node)
    }
    if (node.type === 'ExportDeclaration') {
      addExports(exports, node)
    }
    if (node.type === 'ExportDefaultDeclaration') {
      exports.push({
        name: 'default',
        node: node,
        local: node.declaration.name || (node.declaration.id && node.declaration.id.name)
      })
    }
  })

  return { imports: imports, exports: exports }
}

function addImports (list, node) {
  var source = node.source.value
  node.specifiers.forEach(function (spec) {
    if (spec.type === 'ImportDefaultSpecifier') {
      list.push({
        source: source,
        binding: scan.getBinding(spec.local),
        local: spec.local.name,
        imported: 'default',
        node: node
      })
    }
    if (spec.type === 'ImportSpecifier') {
      list.push({
        source: source,
        binding: scan.getBinding(spec.local),
        local: spec.local.name,
        imported: spec.imported.name,
        node: node
      })
    }
    if (spec.type === 'ImportNamespaceSpecifier') {
      list.push({
        source: source,
        binding: scan.getBinding(spec.local),
        local: spec.local.name,
        imported: '*',
        node: node
      })
    }
  })
}

function addExports (list, node) {
  throw new Error('esm-bundler: only default exports are supported at the moment.')
}
