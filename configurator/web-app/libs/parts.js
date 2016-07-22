const webpack = require('webpack');

const CleanWebpackPlugin = require('clean-webpack-plugin');

exports.devServer = function(options) {
  return {
    devServer: {
      // Enable history API fallback so HTML5 History API based routing works.
      // This is a good default that will come in handy in more complicated
      // setups.
      historyApiFallback: true,

      // Unlike the cli flag, this doesn't set HotModuleReplacementPlugin!
      hot: true,
      inline: true,

      // Display only errors to reduce the amount of output.
      stats: 'errors-only',

      // Parse host and port from env to allow customization.
      host: options.host || '0.0.0.0',  // Defaults to `localhost`
      port: options.port                // Defaults to 8080
    },
    plugins: [
      // Enable multi-pass compilation for enhanced performance in larger
      // projects.
      new webpack.HotModuleReplacementPlugin({
        multiStep: true
      })
    ]
  };
};

exports.setupCSS = function(paths) {
  return {
    module: {
      loaders: [
        {
          test: /\.css$/,
          loaders: ['style', 'css'],
          include: paths
        }
      ]
    }
  };
};

exports.setupFonts = function(paths) {
  return {
    module: {
      loaders: [
        {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file?name=public/fonts/[name].[ext]',
            include: paths
        }
      ]
    }
  };
};

exports.minify = function() {
  return {
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  };
};

exports.clean = function(path) {
  return {
    plugins: [
      new CleanWebpackPlugin([path], {
        // Without `root` CleanWebpackPlugin won't point to our project and
        // will fail to work.
        root: process.cwd()
      })
    ]
  };
};
