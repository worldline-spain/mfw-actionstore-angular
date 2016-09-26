(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @module mfw.business.actionstore
   * @name mfw.business.actionstore
   *
   * @requires flux
   *
   * @description
   * # Description
   *
   * This module provides a centralized control and notification system to handle all async processes (involving promises)
   * in your application.
   *
   * It relies on {@link https://github.com/christianalfoni/flux-angular flux-angular} as notification mechanism and storage.
   */
  var ActionStoreModule = angular.module('mfw.business.actionstore', [
    'flux'
  ]);

  /**
   * @constant
   * @type {string}
   * @description Action status *running*.
   */
  var STATUS_RUNNING = 'running';
  /**
   * @constant
   * @type {string}
   * @description Action status *finished*.
   */
  var STATUS_FINISHED = 'finished';
  /**
   * @constant
   * @type {string}
   * @description Action status *error*.
   */
  var STATUS_ERROR = 'error';

  /**
   * @constant
   * @type {string}
   * @description Prefix to be used in all `$mfwActionStore` fired events.
   * @private
   */
  var ACTION_PREFIX = 'mfw:Action.';


  /**
   * @typedef {Object} MfwAction
   * @property {String} id Action identifier
   * @property {Promise} promise The promise
   * @property {String} status Action status
   *
   * @see STATUS_RUNNING
   * @see STATUS_FINISHED
   * @see STATUS_ERROR
   */


  /**
   * @ngdoc event
   * @name mfw.business.actionstore.service:$mfwActionStore#mfw:Action.<actionId>.<status>
   * @eventOf mfw.business.actionstore.service:$mfwActionStore
   * @eventType broadcast on $mfwActionStore
   *
   * @description
   * Event triggered when an action is updated at any status step.
   *
   * @param {MfwAction} action Updated action.
   */
  /**
   * @ngdoc event
   * @name mfw.business.actionstore.service:$mfwActionStore#mfw:Action.<status>.<actionId>
   * @eventOf mfw.business.actionstore.service:$mfwActionStore
   * @eventType broadcast on $mfwActionStore
   *
   * @description
   * Event triggered when an action is updated at a specific status step.
   *
   * @param {MfwAction} action Updated action.
   */


  /**
   * @ngdoc service
   * @name mfw.business.actionstore.service:$mfwActions
   *
   * @requires flux
   * @requires mfw.business.actionstore.service:$mfwActionStore
   *
   * @description
   * The `$mfwActions` service acts as an action creator for all your promises and dispatches processes
   * to {@link mfw.business.actionstore.service:$mfwActionStore `$mfwActionStore`}.
   */
  ActionStoreModule.service('$mfwActions', ActionCreator);
  ActionCreator.$inject = ['$timeout', 'flux', '$mfwActionStore'];
  function ActionCreator($timeout, flux, $mfwActionStore) {
    /**
     * @ngdoc method
     * @name mfw.business.actionstore.service:$mfwActions#newAction
     * @methodOf mfw.business.actionstore.service:$mfwActions
     *
     * @description
     * This method takes a promise and handles its lifecycle broadcasting
     * {@link mfw.business.actionstore.service:$mfwActionStore#events store events}.
     *
     * It dispatches the `$mfwActionCreation` action handled by {@link mfw.business.actionstore.service:$mfwActionStore `$mfwActionStore`}.
     *
     * @param {Function|Promise} actionBody The promise or a function that returns a promise.
     * @returns {Promise} A wrapped promise with the same resolution/rejection process than the original one.
     */
    this.newAction = function (actionBody) {
      var actionId = _newActionId();
      var originalPromise = angular.isFunction(actionBody) ? actionBody() : actionBody;
      var promise = _wrapPromise(originalPromise, actionId);

      // Avoid more than one flux dispatch at the same time
      $timeout(function () {
        flux.dispatch('$mfwActionCreation', promise);
      });

      return promise;
    };

    //////////////////////////

    /**
     * @description
     * This method wraps the action promise with an internal `$mfwId` identifier.
     *
     * It also dispatches events `$mfwActionFinished` and `$mfwActionError` whenever the
     * promise is resolved or rejected.
     *
     * @param {Promise} promise Action promise.
     * @param {String} actionId New action identifier.
     * @returns {Promise} - Incomming promise wrapped with `$mfwId` identifier.
     * @private
     */
    function _wrapPromise(promise, actionId) {
      var result = promise.then(resolveHandler, rejectHandler);
      result.$mfwId = actionId;
      return result;

      /////////////////////

      /**
       * @description
       * This method is executed when the action promise is resolved, and its main purpose
       * is fire the `$mfwActionFinished` flux action.
       *
       * @returns {*} The original action promise results, if any.
       * @private
       */
      function resolveHandler() {
        flux.dispatch('$mfwActionFinished', actionId);
        return (arguments || []).length ? arguments[0] : undefined;
      }

      /**
       * @description
       * This method is executed when the action promise is rejected, and its main purpose
       * is fire the `$mfwActionError` flux action.
       *
       * @returns {*} The original action promise results, if any.
       * @private
       */
      function rejectHandler() {
        flux.dispatch('$mfwActionError', actionId);
        return (arguments || []).length ? arguments[0] : undefined;
      }
    }

    /**
     * @description
     * This method generates a new random ID to be used as action identifier.
     *
     * @returns {string} New action identifier.
     * @private
     */
    function _newActionId() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }
  }

  /**
   * @ngdoc service
   * @name mfw.business.actionstore.service:$mfwActionStore
   *
   * @requires $log
   *
   * @description
   * This service takes care of all promises lifecycle and offers an API to ask for their status,
   * as well as notifying status changes via flux events:
   *
   * * {@link mfw.business.actionstore.service:$mfwActionStore#events `mfw:Action.<actionId>.<status>`}: events by action, useful to take care of an specific action status changes.
   * * {@link mfw.business.actionstore.service:$mfwActionStore#events `mfw:Action.<status>.<actionId>`}: events by status, useful for loggers and error handlers.
   *
   * Were `<actionId>` should be replaced by the action identifier associated to the created action. See
   * {@link mfw.business.actionstore.service:$mfwActionStore#methods_actionId `$mfwActionStore.actionId()`} for more information.
   *
   * And `<status>` takes one of the following values:
   *
   * * `running`: action starts running
   * * `finished`: action finished successfully
   * * `error`: action finished with error (with additional error information)
   */
  ActionStoreModule.store('$mfwActionStore', ActionStore);
  ActionStore.$inject = ['$log'];
  function ActionStore($log) {
    var store = {
      initialize: function initialize() {
        var initialState = {
          actions: {}
        };
        this.state = initialState;
      },
      handlers: {
        $mfwActionCreation: 'newAction',
        $mfwActionFinished: 'actionFinished',
        $mfwActionError: 'actionError'
      },
      /**
       * @description
       * Handler for the `$mfwActionCreation` flux action.
       *
       * This method takes a wrapped promise and creates the associated `MfwAction` action.
       *
       * By default, newly created actions have `STATUS_RUNNING` status value.
       *
       * @param {Promise} promise The promise to be wrapped.
       * @returns {String} The identifier of the new action.
       * @private
       */
      newAction: function newAction(promise) {
        var newAction = {
          id: promise.$mfwId,
          promise: promise,
          status: STATUS_RUNNING
        };
        this.state.actions[newAction.id] = newAction;

        $log.debug('> New action', newAction.id);

        this.broadcastActionUpdate(newAction);
        return newAction.id;
      },
      /**
       * @description
       * Handler for the `$mfwActionFinished` flux action.
       *
       * This method updates the associated action with the `STATUS_FINISHED` status value.
       *
       * @param {String} actionId The action identifier.
       */
      actionFinished: function actionFinished(actionId) {
        $log.debug('> Finished action', actionId);
        this.setActionStatus(actionId, STATUS_FINISHED);
      },
      /**
       * @description
       * Handler for the `$mfwActionError` flux action.
       *
       * This method updates the associated action with the `STATUS_ERROR` status value.
       *
       * @param {String} actionId The action identifier.
       * @param {*} error Error information.
       */
      actionError: function actionError(actionId, error) {
        $log.debug('> Error in action', actionId);
        this.setActionStatus(actionId, STATUS_ERROR, error);
      },
      /**
       * @description
       * Helper method to get an action by its identifier.
       *
       * @param {String} actionId The action identifier.
       * @returns {MfwAction} The action.
       */
      getAction: function getAction(actionId) {
        $log.debug('> Get action', actionId);
        return this.state.actions[actionId];
      },
      /**
       * @description
       * Helper method that emits flux events according to the status of the given action.
       *
       * It emits events for action handlers and for status handlers.
       *
       * @param {MfwAction} action The action.
       */
      broadcastActionUpdate: function broadcastActionUpdate(action) {
        var actionId = action.id;
        var status = action.status;
        $log.debug('> Broadcast action update', actionId, 'with status', status);

        // Different events
        this.emit(actionEvent(action, status), action);
        this.emit(statusEvent(action, status), action);
      },
      /**
       * @description
       * Helper method that updates an action's status and triggers the associated events.
       *
       * It emits events for action handlers and for status handlers.
       *
       * @param {String} actionId The action identifier.
       * @param {String} status New status.
       * @param {*=} data Additional information, like an error.
       */
      setActionStatus: function setActionStatus(actionId, status, data) {
        $log.debug('> Update action', actionId, 'with status', status, 'and data', data);
        angular.extend(this.state.actions[actionId], {
          status: status,
          data: data
        });
        this.broadcastActionUpdate(this.state.actions[actionId]);
      },

      exports: {
        /**
         * @ngdoc method
         * @name mfw.business.actionstore.service:$mfwActionStore#getAction
         * @methodOf mfw.business.actionstore.service:$mfwActionStore
         *
         * @description
         * This method returns the associated `MfwAction` instance associated to the action promise.
         *
         * @param {Promise} promise The promise wrapping the action.
         * @returns {MfwAction} Specified action.
         * @private
         */
        getAction: getAction,
        /**
         * @ngdoc method
         * @name mfw.business.actionstore.service:$mfwActionStore#actionId
         * @methodOf mfw.business.actionstore.service:$mfwActionStore
         *
         * @description
         * This method returns the action identifier associated to the action promise.
         *
         * @param {Promise} promise The promise wrapping the action.
         * @returns {String} Action identifier.
         * @private
         */
        actionId: actionId,
        /**
         * @ngdoc method
         * @name mfw.business.actionstore.service:$mfwActionStore#allEvents
         * @methodOf mfw.business.actionstore.service:$mfwActionStore
         *
         * @description
         * This method returns the event identifier to be used in `$scope.$listenTo` method
         * to be noticed for all action events.
         *
         * If a promise is specified, will return the *all event's* key for that action, otherwise the identifier
         * for all action events.
         *
         * Returned event identifiers:
         *
         * * `mfw:Action.*.*`: all events of all actions and status.
         * * `mfw:Action.<actionId>.*`: all events of a specific action.
         *
         * @param {Promise=} promise The promise wrapping the action, if any.
         * @returns {String} Event identifier.
         * @private
         */
        allEvents: function (promise) {
          return promise ?
            allEvents(this.getAction(actionId(promise)))
            : allEvents();
        },
        /**
         * @ngdoc method
         * @name mfw.business.actionstore.service:$mfwActionStore#finishEvent
         * @methodOf mfw.business.actionstore.service:$mfwActionStore
         *
         * @description
         * This method returns the event identifier to be used in `$scope.$listenTo` method
         * to be noticed for finish action event.
         *
         * If a promise is specified, will return the error event for that action, otherwise the identifier
         * for all actions' error event.
         *
         * Returned event identifiers:
         *
         * * `mfw:Action.finished.*`: all finished events of all actions and status.
         * * `mfw:Action.<actionId>.finished`: finished event of a specific action.
         *
         * @param {Promise=} promise The promise wrapping the action, if any.
         * @returns {String} Event identifier.
         * @private
         */
        finishEvent: function (promise) {
          return promise ?
            finishEvent(this.getAction(actionId(promise)))
            : finishEvent();
        },
        /**
         * @ngdoc method
         * @name mfw.business.actionstore.service:$mfwActionStore#errorEvent
         * @methodOf mfw.business.actionstore.service:$mfwActionStore
         *
         * @description
         * This method returns the event identifier to be used in `$scope.$listenTo` method
         * to be noticed for error action event.
         *
         * If a promise is specified, will return the error event for that action, otherwise the identifier
         * for all actions' error event.
         *
         * Returned event identifiers:
         *
         * * `mfw:Action.error.*`: all error events of all actions and status.
         * * `mfw:Action.<actionId>.error`: error event of a specific action.
         *
         * @param {Promise} promise The promise wrapping the action.
         * @returns {String} Event identifier.
         * @private
         */
        errorEvent: function (promise) {
          return promise ?
            errorEvent(this.getAction(actionId(promise)))
            : errorEvent();
        }
      }
    };

    /**
     * @description
     * This method returns the associated action id, in `$mfwId` property.
     *
     * @param {Promise} promise Wrapped action promise.
     * @returns {String} Action identifier.
     * @private
     */
    function actionId(promise) {
      return promise.$mfwId;
    }

    /**
     * @description
     * This method returns the event identifier to be used with `$scope.$listenTo` method.
     *
     * If an action is specified, will return the finish event for that action, otherwise the identifier
     * for all actions' finish event.
     *
     * @param {MfwAction=} action Action, if any.
     * @returns {String} Event identifier.
     * @private
     *
     * @see actionEvent
     * @see statusEvent
     */
    function finishEvent(action) {
      return action ?
        actionEvent(action, STATUS_FINISHED)
        : statusEvent(null, STATUS_FINISHED);
    }

    /**
     * @description
     * This method returns the event identifier to be used with `$scope.$listenTo` method.
     *
     * If an action is specified, will return the error event for that action, otherwise the identifier
     * for all actions' error event.
     *
     * @param {MfwAction=} action Action, if any.
     * @returns {String} Event identifier.
     * @private
     *
     * @see actionEvent
     * @see statusEvent
     */
    function errorEvent(action) {
      return action ?
        actionEvent(action, STATUS_ERROR)
        : statusEvent(null, STATUS_ERROR);
    }

    /**
     * @description
     * This method returns the event identifier to be used with `$scope.$listenTo` method.
     *
     * If an action is specified, will return the *all event's* key for that action, otherwise the identifier
     * for all action events.
     *
     * @param {MfwAction=} action Action, if any.
     * @returns {String} Event identifier.
     * @private
     */
    function allEvents(action) {
      return ACTION_PREFIX
        + (action ? action.id + '.*' : '*');
    }

    /**
     * @description
     * This method returns the event identifier to be used with `$scope.$listenTo` method.
     *
     * If an action is specified, will return the finish event for that action, otherwise the identifier
     * for all actions' finish event.
     *
     * @param {MfwAction=} action Action, if any.
     * @returns {String} Event identifier.
     * @private
     */
    function actionEvent(action, status) {
      return ACTION_PREFIX
        + (action ? action.id : '*')
        + '.'
        + status;
    }

    /**
     * @description
     * This method returns the event identifier to be used with `$scope.$listenTo` method.
     *
     * If an action is specified, will return the finish event for that action, otherwise the identifier
     * for all actions' finish event.
     *
     * @param {MfwAction=} action Action, if any.
     * @returns {String} Event identifier.
     * @private
     */
    function statusEvent(action, status) {
      return ACTION_PREFIX
        + status
        + '.'
        + (action ? action.id : '*');
    }

    function getAction(promise) {
      return store.getAction(actionId(promise));
    }

    return store;
  }
})();
