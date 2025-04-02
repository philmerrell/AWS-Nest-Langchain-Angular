import * as path from 'path';
import * as webpack from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const config: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    lambda: './src/lambda.ts', // Entry point specifically for Lambda handler
  },
  target: 'node',
  // Explicitly exclude AWS SDK to reduce bundle size since it's available in the Lambda runtime
  externals: [
    'aws-sdk',
    'aws-lambda',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/smithy-client'
  ],
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
    path: path.resolve(__dirname, 'dist'),
    filename: 'lambda.js',
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
    }),
    // Fixed CopyWebpackPlugin usage
    new CopyWebpackPlugin({
      patterns: [
        { from: '.env', to: '.', noErrorOnMissing: true },
        { from: 'package.json', to: '.' },
      ],
    }),
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