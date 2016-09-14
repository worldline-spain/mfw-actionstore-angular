# MFW Action Store v1.0.0

This AngularJS module provides a centralized storage and communication layer for async tasks as part of **Mobile FrameWork (MFW)**.


## Features

### Route interceptor

Provided implementation is based on UI Router.

* Configure your states with required credentials (from your own role list) and the route interceptor will
handle them and allow or deny access to them.
* Configure your login state to be addressed to when no credentials are found.



## Installation

### Via Bower

Use repository URL and version tag until module is published in a Bower registry.

```shell
$ bower install --save mfw-actionstore-angular
```


### Other

Download source files and include them into your project sources.



## Usage

Once dependency has been downloaded, configure your application module(s) to require:

* `mfw.business.action-store` module: action creator and store (depends on `flux`).

```js
angular
  .module('your-module', [
      // Your other dependencies
      'mfw.business.action-store'
  ]);
```

Now you can inject both `$mfwActions` and `$mfwActionStore` services to register actions and receive their flux events.


> For further documentation, please read the generated `ngDocs` documentation inside `docs/` folder.




## Development

* Use Gitflow
* Update both package.json and bower.json versions
* Tag Git with same version numbers as NPM and Bower versions
* Check for valid `ngDocs` output inside `docs/` folder

> **Important**: Run `npm install` before anything. This will install NPM and Bower dependencies.

> **Important**: Run `npm run deliver` before committing anything. This will build documentation and distribution files.
> It's a shortcut for running both `docs` and `build` scritps.

### NPM commands

* Bower: install Bower dependencies in `bower_components/` folder:
```shell
$ npm run bower
```
* Build: build distributable binaries in `dist/` folder:
```shell
$ npm run build
```
* Documentation: generate user documentation (using `ngDocs`):
```shell
$ npm run docs
```
* Linting: run *linter* (currently JSHint):
```shell
$ npm run lint
```
* Deliver: **run it before committing to Git**. It's a shortcut for `docs` and `build` scripts:
```shell
$ npm run deliver
```
