const path = require('path');
const paths = require('../utils/paths');
require('module-alias')(path.dirname(paths.package));
// const jsdomDevtoolsFormatter = require('jsdom-devtools-formatter');
// jsdomDevtoolsFormatter.install();
const SdenvExtend = require('sdenv-extend');

module.exports = (win, type = 'chrome') => {
  return require(`@/browser/${type}`)(new SdenvExtend({ }, win));
}

module.exports.supports = ['chrome'];

module.exports.isSupport = (type) => module.exports.supports.includes(type);
