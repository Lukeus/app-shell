const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  target: 'electron-main',
  entry: './src/main/main.ts',
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
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
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
    clean: true,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    'node-pty': 'commonjs node-pty',
  },
};
