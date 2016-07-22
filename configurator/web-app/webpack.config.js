// Based on http://survivejs.com/webpack/developing-with-webpack

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const merge = require('webpack-merge');
const validate = require('webpack-validator');
const parts = require('./libs/parts');

var indexHtml = path.join(__dirname, "src/html", "index.html");


const PATHS = {
  app: path.join(__dirname, 'src'),
  build: path.join(__dirname, '_build')
};

const common = {
  entry: {
    app: PATHS.app,
    // indexHtml
  },
  output: {
    path: PATHS.build,
    filename: '[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: '!!html!nunjucks-html!src/html/index.html'
    })
  ],
};


var config;

// Detect how npm is run and branch based on that
switch(process.env.npm_lifecycle_event) {
  case 'build':
  case 'production':
    config = merge(
      common,
      {
        // devtool: 'source-map'
      },
      parts.clean(PATHS.build),
      parts.minify(),
      parts.extractCSS(PATHS.app),
      parts.embedImages(PATHS.app),
      parts.embedFonts(PATHS.app)
    );
    break;

  default:
    config = merge(
      common,
      {
        devtool: 'eval-source-map'
      },
      parts.setupCSS(PATHS.app),
      parts.setupImages(PATHS.app),
      parts.setupFonts(PATHS.app),
      parts.devServer({
        // Customize host/port here if needed
        host: process.env.HOST,
        port: process.env.PORT
      })
    );
}

module.exports = validate(config);
