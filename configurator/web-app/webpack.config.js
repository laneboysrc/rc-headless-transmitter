/* jshint esversion: 6 */

// Based on http://survivejs.com/webpack/developing-with-webpack

const path              = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const swprecachePlugin  = require('sw-precache-webpack-plugin');
const merge             = require('webpack-merge');
const validate          = require('webpack-validator');
const parts             = require('./webpack.support');



const PATHS = {
  app:    path.join(__dirname, 'app'),
  build:  path.join(__dirname, '_build'),
};

const appHTML = path.join(PATHS.app, 'html', 'app.html');
const specialImages = /\W(((apple-touch-icon|android-chrome-192x192|favicon-16x16|favicon-32x32|mstile-150x150)\.png)|((safari-pinned-tab)\.svg))$/;


// Common configuration that applies to all modes (development, build ...)
const common = {
  entry: {
    app: PATHS.app
    // app: ['babel-polyfill', PATHS.app]
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
      // Always store some special images, like the ones referenced in the
      // manifest.json, as separate files; do not in-line (data-url encode)
      // them.
      {
        test: specialImages,
        loaders: ['file?name=[name].[ext]'],
        include: PATHS.app
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      // Process the app.html page, which is a nunjucks template. Then pass
      // it through the HTML loader, which extracts all `img` and `link` tags
      // for further processing
      filename: 'app.html',
      template: 'html?attrs[]=img:src&attrs[]=link:href!nunjucks-html!' + appHTML
    }),
    new HtmlWebpackPlugin({  // Also generate an index.html
      filename: 'index.html',
      inject: false,
      template:  path.join(PATHS.app, 'html', 'index.html')
    }),
    new swprecachePlugin({
      cacheId: 'configurator-v1',
      filename: 'service-worker.js',
      maximumFileSizeToCacheInBytes: 4194304
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
        devtool: 'source-map'
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
