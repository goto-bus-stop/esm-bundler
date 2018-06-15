#!/usr/bin/env node

var major = /^v(\d+)\./.exec(process.version)
if (parseInt(major[1], 10) < 10) {
  throw new Error('esm-bundler requires Node 10')
}

var path = require('path')
var spawn = require('child_process').spawnSync

spawn(process.execPath, ['--experimental-modules', path.join(__dirname, './bin.mjs')].concat(process.argv.slice(2)), {
  stdio: 'inherit'
})
