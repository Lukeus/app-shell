const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  target: 'electron-renderer',
  entry: './src/renderer/index.tsx',
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
    // Force case-insensitive filesystem compatibility
    fallback: {
      globalThis: require.resolve('globalthis'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: isDevelopment,
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      // Provide global for Monaco Editor
      global: 'globalThis',
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/renderer/assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
      ],
    }),
    new MonacoWebpackPlugin({
      // Minimal languages to avoid case-sensitivity issues in CI
      languages: ['javascript', 'json', 'html', 'css', 'markdown'],
      // Enable only essential features for better performance
      features: [
        'coreCommands',
        'find',
        'folding',
        'format',
        'clipboard',
        'contextmenu',
        'bracketMatching',
        'wordHighlighter',
        'wordOperations',
      ],
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
    clean: true,
  },
  devServer: {
    port: 4000,
    static: {
      directory: path.join(__dirname, 'dist/renderer'),
    },
    historyApiFallback: true,
    compress: true,
    hot: true,
  },
};
