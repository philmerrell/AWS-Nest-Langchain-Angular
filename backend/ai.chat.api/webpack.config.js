// Require ts-node to support TypeScript config files
require('ts-node/register');

// Dynamically load the appropriate config based on environment variable
if (process.env.WEBPACK_CONFIG === 'lambda') {
  module.exports = require('./webpack.lambda.config.ts');
} else {
  module.exports = require('./webpack.config.ts');
}