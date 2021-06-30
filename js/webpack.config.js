const path = require('path');
module.exports = {
  context: path.join(__dirname, 'src'),
  entry: [
    './main.js',
  ],
  output: {
    path: path.join(__dirname, 'www'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
        ],
      },
    ],
  },
  resolve: {
    alias: {
      "react": "preact/compat",
      "react-dom/text/utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "@components": "./components",
      "@lib": "./lib",
      "@context": "./context",
    },
    modules: [
      path.join(__dirname, 'node_modules'),
    ],
  },
};
