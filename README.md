# Fluxlet Example - TodoMVC

This is an implementation of [TodoMVC](http://todomvc.com/) using the
[Fluxlet](https://github.com/fluxlet/fluxlet) framework.

The majority of the code can be found in [app.js](js/app.js).

## Setup

    $ npm install

Will install all npm dependencies, including [jspm](http://jspm.io),
and then perform a jspm install.

## Run it

    $ npm run serve

It should open in a browser tab at http://localhost:3000

## Test it

After starting the server as above...

    $ cd tests
    $ npm install
    $ npm run test

Some of the tests are currently failing, I'm not sure why as the features
appear to work fine when tested manually.
