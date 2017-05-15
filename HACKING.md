# GH-PAGES

We can host the web-app via Github pages conveniently. Since it is served via HTTPS we can use ServiceWorker and other goodies.

## Setup

In the root of the project, execute

    git clone https://github.com/laneboysrc/rc-headless-transmitter.git --branch gh-pages --single-branch gh-pages

This creates a folder named `gh-pages` with the web-app source code, cloned from the current state of the rc-headless-transmitter's `gh-pages` branch. Note that the `gh-pages` is in `.gitignore` of the `master` branch, so it does not appear in the `master` branch.

When building the web-app (run `npm run build` in `configurator/web-app`), the files are automatically placed into the `gh-pages` folder.

To update the web-app on Github, go into the `gh-pages` folder, commit the changes, and run `git push`.


Source:
[http://stackoverflow.com/questions/1778088/how-to-clone-a-single-branch-in-git](http://stackoverflow.com/questions/1778088/how-to-clone-a-single-branch-in-git)

