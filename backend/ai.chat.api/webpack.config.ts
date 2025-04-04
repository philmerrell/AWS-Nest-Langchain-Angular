import * as path from 'path';
import * as webpack from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const Dotenv = require('dotenv-webpack');

const isProduction = process.env.NODE_ENV === 'production';
const envFile = process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env';

const config: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './src/main.ts',  // Specify the exact file, not just the directory
  },
  target: 'node',
  externals: [nodeExternals()], // Exclude node_modules from bundling
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
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    clean: true,
  },
  optimization: {
    minimize: isProduction,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new Dotenv({
      path: envFile, // Use the environment-specific file
      systemvars: true, // Load all system variables as well
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: envFile, to: '.env', noErrorOnMissing: true }, // Copy the env file as .env
        { from: 'package.json', to: '.' },
      ],
    }),
  ],
};

if (!isProduction) {
  config.devtool = 'source-map';
}

export default config;