import scan from 'scope-analyzer'

export default function detect (ast) {
  var imports = []
  var exports = []
  ast.body.forEach(function (node) {
    if (node.type === 'ImportDeclaration') {
      addImports(imports, node)
    }
    if (node.type === 'ExportDefaultDeclaration') {
      exports.push({
        name: 'default',
        node: node,
        local: node.declaration.name || (node.declaration.id && node.declaration.id.name)
      })
    }
    if (node.type === 'ExportNamedDeclaration') {
      addExports(exports, node)
    }
    if (node.type === 'ExportAllDeclaration') {
      throw new Error('esm-bundler: export * from "module" is currently not supported')
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
  if (node.declaration) {
    if (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration') {
      list.push({
        name: node.declaration.id.name,
        node: node,
        local: node.declaration.id.name
      })
    }
    if (node.declaration.type === 'VariableDeclaration') {
      node.declaration.declarations.forEach(function (decl) {
        list.push({
          name: decl.id.name,
          node: node,
          local: decl.id.name
        })
      })
    }
  }
  if (node.specifiers.length > 0) {
    throw new Error('esm-bundler: export { a } syntax is currently not supported.')
  }
}
