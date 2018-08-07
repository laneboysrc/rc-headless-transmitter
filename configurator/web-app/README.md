# *Configurator* web-app implemention

This web-app implements a *configurator* that can setup a *headless transmitter* via a bridge that implements the WebSocket protocol.

Please refer to the [configurator](../../docs/configurator.md) documentation for more information.



## Build instructions

To compile all source files into a single HTML file for distribution the following tools are needed:

- Node.js - [http://nodejs.org/](http://nodejs.org/)

*Important:* A recent (LTS) Node.js version is required. Refer to [https://github.com/nodesource/distributions](https://github.com/nodesource/distributions) to install it.

Run `npm install` to fetch the required modules.
Note: there are also local modules taken from [../common-modules/](../common-modules/).

You can then run `npm start` to start the continous build process and development web server. You can then access the build on `localhost:8080`.

Use `npm run production` to build the single-page web-app for deployment. The files will be written to `../../gh-pages`


## More information

The web-app has been implemented as *Single Page Web-App* (SPA). All individual pages that you see in the app are merged into a single HTML file and hidden when not in use.

The source file of the app are all in the `./app` folder.

The app uses [webpack][] as build tool. [webpack][] takes modules with dependencies and generates static assets representing those modules.

The starting point for our app is [./app/index.js](./app/index.js). This file *requires()* all the items needed by our app.

The javascript source code for our app is imported by require([./app/javascripts/modules](./app/javascripts/modules)) folder. In that folder is another file named [index.js](./app/javascripts/modules/index.js) that imports the sub-modules that make up our application.

Note that the sub-modules are all run as separate modules, i.e. they run in a separate context and can not share information unless a module explicitely exports it. I.e. the programming model is the one from node.js, not the traditional web browser model.

[./app/index.js](./app/index.js) not only imports Javascript, but also images, CSS and other files. How each of the imported files are processed is determined by the [webpack configuration](webpack.config.js).

Beside the assets imported in [./app/index.js](./app/index.js), the [webpack configuration](webpack.config.js) also generates the (single) HTML page of our app. This is done with the [html-webpack-plugin][]. The plugin imports [./app/html/index.html](./app/html/index.html), which is a [nunjucks][] template. The *loader* (loader is a [webpack terminology][loader]) for [./app/html/index.html](./app/html/index.html) processes the file through [nunjucks][], which embeds the sub-pages stored in the [./app/html/pages](./app/html/pages) folder. After that is done, the *html loader* is used to process *img* and *link* tags within [webpack][].

The [webpack configuration](webpack.config.js) supports two modes: development and production. The configuration used is based on the excellent [webpack book on SurvieJS][webpack-book].

In developement mode, which is executed by `npm start` or `npm run development`, [webpack][] monitors changes to the source files and automatically rebuilds it. It also runs a web server on port **8080**. The page is automatically reloaded whenever an asset changes (live reload).

You can debug the web-app without hardware by using the [simulator tool](../nodejs-headlesstx-simulator-websocket).

When run in production mode (`npm run build` or `npm run production`) then [webpack][] builds the project and gathers all required assets in the `../../gh-pages` folder. In contrast to development mode, the assets are minimized, CSS is stored as a stand-alone file, fonts are embedded in the CSS, and most images are embedded in CSS and HTML using data-url. The files in the `../../gh-pages`folder are ready to be deployed to a web server.


[nunjucks]: https://mozilla.github.io/nunjucks/ "Nunjucks - A rich and powerful templating language for JavaScript"
[webpack]: http://webpack.github.io/ "webpack"
[webpack-book]: http://survivejs.com/webpack/ "SurviveJS - Webpack: From apprentice to master"
[loader]: http://webpack.github.io/docs/using-loaders.html "webpack loader documentation"
[html-webpack-plugin]:  https://github.com/ampedandwired/html-webpack-plugin "html-webpack-plugin on Github"