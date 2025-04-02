import * as path from 'path';
import * as webpack from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const config: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './src/lambda.ts', // Entry point specifically for Lambda handler
  },
  target: 'node',
  // Instead of using webpack-node-externals, manually specify which modules to exclude
  externals: {
    // Modules provided by the Lambda runtime
    'aws-sdk': 'aws-sdk',
    'aws-lambda': 'aws-lambda',
    // Add any other modules you want to exclude from the bundle
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: !isProduction,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    plugins: [new TsconfigPathsPlugin({ configFile: 'tsconfig.json' })],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: isProduction ? 'index.js' : '[name].js',
    libraryTarget: 'commonjs2',
    clean: true,
  },
  optimization: {
    minimize: isProduction,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.IS_LAMBDA': JSON.stringify(true),
      'process.env.LAMBDA_URL': JSON.stringify(true),
    }),
    // Copy necessary files to the dist folder
    new CopyWebpackPlugin({
      patterns: [
        { from: '.env', to: '.', noErrorOnMissing: true },
        { from: 'package.json', to: '.' },
      ],
    }),
    // Set "__dirname" to "/tmp" since Lambda runs with /tmp as writeable directory
    new webpack.DefinePlugin({ __dirname: '"/tmp"' }),
  ],
};

if (!isProduction) {
  // Development-specific configurations
  config.devtool = 'source-map';
} else {
  // For production Lambda deployment, add file size monitoring
  config.plugins = [
    ...(config.plugins || []),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // Limit to a single chunk for simplified Lambda deployment
    }),
  ];
}

export default config;