# MFW Action Store v1.0.0

This AngularJS module provides a centralized storage and communication layer for async tasks as part of **Mobile FrameWork (MFW)**.


## Features

### Centralized notifications

Register all your asynchronous actions and geet track of all of their changes:

* Start
* End
* Event update



## Installation

### Via Bower

Use repository URL and version tag until module is published in a Bower registry.

```shell
$ bower install --save mfw-actionstore-angular
```


### Other

Download source files and include them into your project sources.



### Dependency

Once dependency has been downloaded, configure your application module(s) to require:

* `mfw.business.actionstore` module: action creator and store (depends on `flux`).

```js
angular
  .module('your-module', [
      // Your other dependencies
      'mfw.business.actionstore'
  ]);
```

Now you can inject both `$mfwActions` and `$mfwActionStore` services to register actions and receive their flux events.


> For further documentation, please read the generated `ngDocs` documentation inside `docs/` folder.


## Usage

### Register an action

To register an action you only need an existing promise, if you already use them, or a function implementing your logic.

**Using a promise**

```js
var myPromise = $http.get(/**/);
var actionPromise = $mfwActions.newAction(myPromise);
var actionId = $mfwActionStore.actionId(actionPromise);
```

**Using a function**

```js
var cleanDb = funtion () {/**/};
var actionPromise = $mfwActions.newAction(cleanDb);
var actionId = $mfwActionStore.actionId(actionPromise);
```


* **Important** do not nest `.then()` calls before assigning the promise to a variable or you'll lose the reference to the original action promise. Then you won't be able to get its identifier.


### Event notifications per action idendifier

* Receive all action events by listening to: `mfw:Action.<actionId>.*`. You'll receive events like:
	* `mfw:Action.<actionId>.running`: action start
	* `mfw:Action.<actionId>.finished`: action finished successfully
	* `mfw:Action.<actionId>.error`: action finished with error

```js
var actionPromise = $mfwActions.newAction(fn); // fn implements your logic
$scope.$listenTo($mfwActionStore, $mfwActionStore.allEvents(actionPromise), callback);
// or...
//$scope.$listenTo($mfwActionStore, $mfwActionStore.finishEvent(actionPromise), callback);
//$scope.$listenTo($mfwActionStore, $mfwActionStore.errorEvent(actionPromise), callback);
```


### Event notifications per action status

* Receive all events of a specific type by listening to: `mfw:Action.<status>.*`. You'll receive events like:
	* `mfw:Action.running.<actionId>`: actions start
	* `mfw:Action.finished.<actionId>`: actions finished successfully
	* `mfw:Action.error.<actionId>`: actions finished with error

```js
$scope.$listenTo($mfwActionStore, $mfwActionStore.allEvents(), callback);
$scope.$listenTo($mfwActionStore, $mfwActionStore.finishEvent(), callback);
$scope.$listenTo($mfwActionStore, $mfwActionStore.errorEvent(), callback);
```

> Useful to implement loggers, to measure network requests performance, etc.


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
