# *Configurator* web-app

This folder contains the *configurator* function implemented as a single page
web-app. This web-app can be used on modern browsers, both on desktop computers
and mobile devices, to configure the *Headless TX* using one of the bridges that
provide the Websocket protocol.

Refer to the [configurator documention](../../doc/configurator.md) for details.


## Build instructions

This project is requires node.js.

- Node.js - [http://nodejs.org/](http://nodejs.org/)

After installing node.js, run `npm install` to fetch the required modules. The
project uses [gulp](http://gulpjs.com), a toolkit for front-end web development.

To start development, run

    npm run start

This will compile the source files and start a development web server at
[http://localhost:3000]().

If you encounter an error message containing `ENOSPC` (on Linux), you need to
increase the number of allowed inotify watches:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.d/10-increase-inode-watch && sudo sysctl -p

Source: [http://stackoverflow.com/questions/16748737/grunt-watch-error-waiting-fatal-error-watch-enospc]()
