const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  target: 'electron-preload',
  entry: './src/preload/preload.ts',
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: isDevelopment,
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/preload'),
    filename: 'preload.js',
    clean: true,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
