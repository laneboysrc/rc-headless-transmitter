// Based on http://survivejs.com/webpack/developing-with-webpack

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const merge = require('webpack-merge');
const validate = require('webpack-validator');
const parts = require('./webpack.support');


const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, '_build'),
};

const indexHTML = path.join(PATHS.app, 'html', 'index.html');
const specialImages = /\W(((apple-touch-icon|android-chrome-192x192|favicon-16x16|favicon-32x32|mstile-150x150)\.png)|((safari-pinned-tab)\.svg))$/;

const common = {
  entry: {
    app: PATHS.app,
    // indexHtml
  },
  output: {
    path: PATHS.build,
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.(json|xml|ico)$/,
        loaders: ['file?name=[name].[ext]'],
        include: PATHS.app
      },
      // Alsays store some special images, like the ones referenced in the
      // manifest.json, as separate files.
      {
        test: specialImages,
        loaders: ['file?name=[name].[ext]'],
        include: PATHS.app
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'html?attrs[]=img:src&attrs[]=link:href!nunjucks-html!' + indexHTML
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
      parts.embedImages(PATHS.app, specialImages),
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
