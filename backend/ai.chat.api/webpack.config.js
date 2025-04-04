// Register ts-node to handle TypeScript files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Dynamically load the appropriate config based on environment variable
try {
  const configPath = process.env.WEBPACK_CONFIG === 'lambda' 
    ? './webpack.lambda.config.ts'
    : './webpack.config.ts';
  
  console.log(`Loading webpack config from: ${configPath}`);
  const config = require(configPath);
  module.exports = config.default || config;
} catch (error) {
  console.error('Error loading webpack configuration:', error);
  process.exit(1);
}