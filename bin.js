#!/usr/bin/env node

var path = require('path')
var spawn = require('child_process').spawnSync

spawn(process.execPath, ['--experimental-modules', path.join(__dirname, './bin.mjs')].concat(process.argv.slice(2)), {
  stdio: 'inherit'
})
