import * as path from 'path';
import * as webpack from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');


const isProduction = process.env.NODE_ENV === 'production';

const config: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    lambda: './src/lambda.ts',
  },
  target: 'node',
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
    // Add fallbacks for the missing modules
    fallback: {
      '@nestjs/websockets': false,
      '@nestjs/microservices': false,
      'class-transformer': false,
      'class-validator': false
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
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
    new CopyWebpackPlugin({
      patterns: [
        { from: '.env', to: '.', noErrorOnMissing: true },
        { from: 'package.json', to: '.' },
      ],
    }),
    // Add IgnorePlugin for optional NestJS modules you're not using
    new webpack.IgnorePlugin({
      resourceRegExp: /^(@nestjs\/websockets|@nestjs\/microservices)$/,
    }),
  ],
};

if (!isProduction) {
  config.devtool = 'source-map';
} else {
  config.plugins = [
    ...(config.plugins || []),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ];
}

export default config;