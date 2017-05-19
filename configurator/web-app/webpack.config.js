/* jshint esversion: 6 */

// Based on http://survivejs.com/webpack/developing-with-webpack

const path              = require('path');
const fs                = require('fs');
const webpack           = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const swprecachePlugin  = require('sw-precache-webpack-plugin');
const merge             = require('webpack-merge');
const validate          = require('webpack-validator');
const parts             = require('./webpack.support');
const execSync          = require('child_process').execSync;


const PATHS = {
  app:    path.join(__dirname, 'app'),
  build:  path.join(__dirname, '../../gh-pages')
};

const appHTML = path.join(PATHS.app, 'html', 'app.html');
const serviceWorker = path.join(PATHS.build, 'service-worker.js');
const specialImages = /\W(((laneboysrc-logo-144|laneboysrc-logo-180|laneboysrc-logo-192|favicon-16x16|favicon-32x32)\.png)|((safari-pinned-tab)\.svg))$/;

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
      cacheId: 'configurator',
      filename: 'service-worker.js',
      staticFileGlobsIgnorePatterns: [
        specialImages,
        /\Wbrowserconfig\.xml$/,
        /\Wmanifest\.json$/
      ],
      maximumFileSizeToCacheInBytes: 4194304
    }),
    new webpack.DefinePlugin({
      VERSION_DIRTY: JSON.stringify(execSync('test -z "$$(git status --porcelain -- .)" || echo "-dirty"').toString('utf-8').trim()),
      VERSION_HASH: JSON.stringify(execSync('git log -1 --format="%h" -- .').toString('utf-8').trim()),
      VERSION_DATE: JSON.stringify(execSync('git log -1 --format="%cd" --date=format:"%F %T" -- .').toString('utf-8').trim()),
    })
  ],
};


var config;

// Detect how npm is run and branch based on that
switch (process.env.npm_lifecycle_event) {
  case 'build':
  case 'production':
    // Remove the service worker to force an update
    fs.unlink(serviceWorker, function () {});

    config = merge(
      common,
      parts.clean(PATHS.build),
      parts.minify(),
      parts.extractCSS(PATHS.app),
      parts.setupImages(PATHS.app, specialImages),
      parts.setupFonts(PATHS.app)
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
