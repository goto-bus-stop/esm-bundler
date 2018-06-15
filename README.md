# esm-bundler

a very small ES modules bundler that aims to 100% mimick Node's implementation

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/esm-bundler.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/esm-bundler
[travis-image]: https://img.shields.io/travis/goto-bus-stop/esm-bundler.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/esm-bundler
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install esm-bundler
```

## Usage

```bash
esm-bundler /path/to/entry.mjs
```

ES Modules files must have the `.mjs` extension, like in Node's current `--experimental-modules` implementation.
CommonJS files are bundled using Browserify.

## License

[Apache-2.0](LICENSE.md)
