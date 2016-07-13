var __commonjs_global = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports, __commonjs_global), module.exports; }

var es6Promise = __commonjs(function (module, exports, global) {
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(lib$es6$promise$$internal$$noop);

      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
        lib$es6$promise$$internal$$makePromise(child);
      }

      var state = parent._state;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    var lib$es6$promise$$internal$$id = 0;
    function lib$es6$promise$$internal$$nextId() {
      return lib$es6$promise$$internal$$id++;
    }

    function lib$es6$promise$$internal$$makePromise(promise) {
      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!lib$es6$promise$utils$$isArray(entries)) {
        return new Constructor(function(resolve, reject) {
          reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function(resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;


    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
      this._result = this._state = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
        lib$es6$promise$$internal$$makePromise(this.promise);
      }

      if (lib$es6$promise$utils$$isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
      }
    }

    function lib$es6$promise$enumerator$$validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var this$1 = this;

      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this$1._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this$1._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(__commonjs_global);
});

(es6Promise && typeof es6Promise === 'object' && 'default' in es6Promise ? es6Promise['default'] : es6Promise);
var Promise$1 = es6Promise.Promise;

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
}

global.Promise = Promise$1;

var ExtendableEvent$1 = function ExtendableEvent(type, data) {
    this.waitUntilPromise = null;
    this.type = type;
    this.data = data;
};
ExtendableEvent$1.prototype.waitUntil = function waitUntil(promise) {
    this.waitUntilPromise = promise;
};
ExtendableEvent$1.prototype.resolve = function resolve() {
    if (this.waitUntilPromise !== null) {
        return this.waitUntilPromise;
    }
    return Promise.resolve();
};
global.ExtendableEvent = ExtendableEvent$1;

var makeSuitable = function (val) {
    if (val instanceof Error) {
        return val.toString();
    }
    else {
        return JSON.stringify(val);
    }
};
var logLevels = ['info', 'log', 'error'];
global.console = {};
logLevels.forEach(function (level) {
    global.console[level] = function (message) {
        var argsAsJSON = Array.prototype.slice.call(arguments).map(makeSuitable);
        __console(JSON.stringify({
            level: level,
            text: argsAsJSON.join(',')
        }));
    };
});

hybrid.promiseBridgeBackToNative = function (callbackIndex, promise) {
    promise
        .then(function (response) {
        __promiseCallback(callbackIndex, null, response);
    })
        .catch(function (err) {
        __promiseCallback(callbackIndex, err.message);
    });
};

hybrid.dispatchExtendableEvent = function (name, data) {
    var extendedEvent = new ExtendableEvent(name, data);
    self.dispatchEvent(extendedEvent);
    return extendedEvent.resolve();
};

var WebSQLResultSet = __commonjs(function (module) {
'use strict';

function WebSQLRows(array) {
  this._array = array;
  this.length = array.length;
}

WebSQLRows.prototype.item = function (i) {
  return this._array[i];
};

function WebSQLResultSet(insertId, rowsAffected, rows) {
  this.insertId = insertId;
  this.rowsAffected = rowsAffected;
  this.rows = new WebSQLRows(rows);
}

module.exports = WebSQLResultSet;
});

var require$$0$3 = (WebSQLResultSet && typeof WebSQLResultSet === 'object' && 'default' in WebSQLResultSet ? WebSQLResultSet['default'] : WebSQLResultSet);

var timeout = __commonjs(function (module, exports) {
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
});

var require$$0$4 = (timeout && typeof timeout === 'object' && 'default' in timeout ? timeout['default'] : timeout);
var install = timeout.install;
var test = timeout.test;

var stateChange = __commonjs(function (module, exports, global) {
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
});

var require$$1$1 = (stateChange && typeof stateChange === 'object' && 'default' in stateChange ? stateChange['default'] : stateChange);
var install$1 = stateChange.install;
var test$1 = stateChange.test;

var messageChannel = __commonjs(function (module, exports, global) {
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
});

var require$$2 = (messageChannel && typeof messageChannel === 'object' && 'default' in messageChannel ? messageChannel['default'] : messageChannel);
var install$2 = messageChannel.install;
var test$2 = messageChannel.test;

var mutation = __commonjs(function (module, exports, global) {
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
});

var require$$3 = (mutation && typeof mutation === 'object' && 'default' in mutation ? mutation['default'] : mutation);
var install$3 = mutation.install;
var test$3 = mutation.test;

var nextTick = __commonjs(function (module, exports) {
'use strict';
exports.test = function () {
  // Don't get fooled by e.g. browserify environments.
  return (typeof process !== 'undefined') && !process.browser;
};

exports.install = function (func) {
  return function () {
    process.nextTick(func);
  };
};
});

var require$$4 = (nextTick && typeof nextTick === 'object' && 'default' in nextTick ? nextTick['default'] : nextTick);
var install$4 = nextTick.install;
var test$4 = nextTick.test;

var index$2 = __commonjs(function (module) {
'use strict';
var types = [
  require$$4,
  require$$3,
  require$$2,
  require$$1$1,
  require$$0$4
];
var draining;
var currentQueue;
var queueIndex = -1;
var queue = [];
var scheduled = false;
function cleanUpNextTick() {
  draining = false;
  if (currentQueue && currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    nextTick();
  }
}

//named nextTick for less confusing stack traces
function nextTick() {
  scheduled = false;
  draining = true;
  var len = queue.length;
  var timeout = setTimeout(cleanUpNextTick);
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      currentQueue[queueIndex].run();
    }
    queueIndex = -1;
    len = queue.length;
  }
  queueIndex = -1;
  draining = false;
  clearTimeout(timeout);
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(nextTick);
    break;
  }
}
// v8 likes predictible objects
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};
module.exports = immediate;
function immediate(task) {
  var arguments$1 = arguments;

  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments$1.length; i++) {
      args[i - 1] = arguments$1[i];
    }
  }
  queue.push(new Item(task, args));
  if (!scheduled && !draining) {
    scheduled = true;
    scheduleDrain();
  }
}
});

var require$$1 = (index$2 && typeof index$2 === 'object' && 'default' in index$2 ? index$2['default'] : index$2);

var index$3 = __commonjs(function (module) {
'use strict';

// Simple FIFO queue implementation to avoid having to do shift()
// on an array, which is slow.

function Queue() {
  this.length = 0;
}

Queue.prototype.push = function (item) {
  var node = {item: item};
  if (this.last) {
    this.last = this.last.next = node;
  } else {
    this.last = this.first = node;
  }
  this.length++;
};

Queue.prototype.shift = function () {
  var node = this.first;
  if (node) {
    this.first = node.next;
    if (!(--this.length)) {
      this.last = undefined;
    }
    return node.item;
  }
};

Queue.prototype.slice = function (start, end) {
  var this$1 = this;

  start = typeof start === 'undefined' ? 0 : start;
  end = typeof end === 'undefined' ? Infinity : end;

  var output = [];

  var i = 0;
  for (var node = this$1.first; node; node = node.next) {
    if (--end < 0) {
      break;
    } else if (++i > start) {
      output.push(node.item);
    }
  }
  return output;
}

module.exports = Queue;
});

var require$$2$1 = (index$3 && typeof index$3 === 'object' && 'default' in index$3 ? index$3['default'] : index$3);

var index$4 = __commonjs(function (module) {
module.exports = function() {};
});

var require$$3$1 = (index$4 && typeof index$4 === 'object' && 'default' in index$4 ? index$4['default'] : index$4);

var WebSQLTransaction = __commonjs(function (module) {
'use strict';

var noop = require$$3$1;
var Queue = require$$2$1;
var immediate = require$$1;
var WebSQLResultSet = require$$0$3;

function errorUnhandled() {
  return true; // a non-truthy return indicates error was handled
}

// WebSQL has some bizarre behavior regarding insertId/rowsAffected. To try
// to match the observed behavior of Chrome/Safari as much as possible, we
// sniff the SQL message to try to massage the returned insertId/rowsAffected.
// This helps us pass the tests, although it's error-prone and should
// probably be revised.
function massageSQLResult(sql, insertId, rowsAffected, rows) {
  if (/^\s*UPDATE\b/i.test(sql)) {
    // insertId is always undefined for "UPDATE" statements
    insertId = void 0;
  } else if (/^\s*CREATE\s+TABLE\b/i.test(sql)) {
    // WebSQL always returns an insertId of 0 for "CREATE TABLE" statements
    insertId = 0;
    rowsAffected = 0;
  } else if (/^\s*DROP\s+TABLE\b/i.test(sql)) {
    // WebSQL always returns insertId=undefined and rowsAffected=0
    // for "DROP TABLE" statements. Go figure.
    insertId = void 0;
    rowsAffected = 0;
  } else if (!/^\s*INSERT\b/i.test(sql)) {
    // for all non-inserts (deletes, etc.) insertId is always undefined
    // ¯\_(ツ)_/¯
    insertId = void 0;
  }
  return new WebSQLResultSet(insertId, rowsAffected, rows);
}

function SQLTask(sql, args, sqlCallback, sqlErrorCallback) {
  this.sql = sql;
  this.args = args;
  this.sqlCallback = sqlCallback;
  this.sqlErrorCallback = sqlErrorCallback;
}

function runBatch(self, batch) {

  function onDone() {
    self._running = false;
    runAllSql(self);
  }

  var readOnly = self._websqlDatabase._currentTask.readOnly;

  self._websqlDatabase._db.exec(batch, readOnly, function (err, results) {
    /* istanbul ignore next */
    if (err) {
      self._error = err;
      return onDone();
    }
    for (var i = 0; i < results.length; i++) {
      var res = results[i];
      var batchTask = batch[i];
      if (res.error) {
        if (batchTask.sqlErrorCallback(self, res.error)) {
          // user didn't handle the error
          self._error = res.error;
          return onDone();
        }
      } else {
        batchTask.sqlCallback(self, massageSQLResult(
          batch[i].sql, res.insertId, res.rowsAffected, res.rows));
      }
    }
    onDone();
  });
}

function runAllSql(self) {
  if (self._running || self._complete) {
    return;
  }
  if (self._error) {
    self._complete = true;
    return self._websqlDatabase._onTransactionComplete(self._error);
  }
  if (!self._sqlQueue.length) {
    self._complete = true;
    return self._websqlDatabase._onTransactionComplete();
  }
  self._running = true;
  var batch = [];
  var task;
  while ((task = self._sqlQueue.shift())) {
    batch.push(task);
  }
  runBatch(self, batch);
}

function executeSql(self, sql, args, sqlCallback, sqlErrorCallback) {
  self._sqlQueue.push(new SQLTask(sql, args, sqlCallback, sqlErrorCallback));
  if (self._runningTimeout) {
    return;
  }
  self._runningTimeout = true;
  immediate(function () {
    self._runningTimeout = false;
    runAllSql(self);
  });
}

function WebSQLTransaction(websqlDatabase) {
  this._websqlDatabase = websqlDatabase;
  this._error = null;
  this._complete = false;
  this._runningTimeout = false;
  this._sqlQueue = new Queue();
  if (!websqlDatabase._currentTask.readOnly) {
    // Since we serialize all access to the database, there is no need to
    // run read-only tasks in a transaction. This is a perf boost.
    this._sqlQueue.push(new SQLTask('BEGIN;', [], noop, noop));
  }
}

WebSQLTransaction.prototype.executeSql = function (sql, args, sqlCallback, sqlErrorCallback) {
  args = Array.isArray(args) ? args : [];
  sqlCallback = typeof sqlCallback === 'function' ? sqlCallback : noop;
  sqlErrorCallback = typeof sqlErrorCallback === 'function' ? sqlErrorCallback : errorUnhandled;

  executeSql(this, sql, args, sqlCallback, sqlErrorCallback);
};

WebSQLTransaction.prototype._checkDone = function () {
  runAllSql(this);
};

module.exports = WebSQLTransaction;
});

var require$$0$2 = (WebSQLTransaction && typeof WebSQLTransaction === 'object' && 'default' in WebSQLTransaction ? WebSQLTransaction['default'] : WebSQLTransaction);

var WebSQLDatabase = __commonjs(function (module) {
'use strict';

var Queue = require$$2$1;
var immediate = require$$1;
var noop = require$$3$1;

var WebSQLTransaction = require$$0$2;

var ROLLBACK = [
  {sql: 'ROLLBACK;', args: []}
];

var COMMIT = [
  {sql: 'END;', args: []}
];

// v8 likes predictable objects
function TransactionTask(readOnly, txnCallback, errorCallback, successCallback) {
  this.readOnly = readOnly;
  this.txnCallback = txnCallback;
  this.errorCallback = errorCallback;
  this.successCallback = successCallback;
}

function WebSQLDatabase(dbVersion, db) {
  this.version = dbVersion;
  this._db = db;
  this._txnQueue = new Queue();
  this._running = false;
  this._currentTask = null;
}

WebSQLDatabase.prototype._onTransactionComplete = function(err) {
  var self = this;

  function done() {
    if (err) {
      self._currentTask.errorCallback(err);
    } else {
      self._currentTask.successCallback();
    }
    self._running = false;
    self._currentTask = null;
    self._runNextTransaction();
  }

  if (self._currentTask.readOnly) {
    done(); // read-only doesn't require a transaction
  } else if (err) {
    self._db.exec(ROLLBACK, false, done);
  } else {
    self._db.exec(COMMIT, false, done);
  }
};

WebSQLDatabase.prototype._runTransaction = function () {
  var self = this;
  var txn = new WebSQLTransaction(self);

  immediate(function () {
    self._currentTask.txnCallback(txn);
    txn._checkDone();
  });
};

WebSQLDatabase.prototype._runNextTransaction = function() {
  if (this._running) {
    return;
  }
  var task = this._txnQueue.shift();

  if (!task) {
    return;
  }

  this._currentTask = task;
  this._running = true;
  this._runTransaction();
};

WebSQLDatabase.prototype._createTransaction = function(
    readOnly, txnCallback, errorCallback, successCallback) {
  errorCallback = errorCallback || noop;
  successCallback = successCallback || noop;

  if (typeof txnCallback !== 'function') {
    throw new Error('The callback provided as parameter 1 is not a function.');
  }

  this._txnQueue.push(new TransactionTask(readOnly, txnCallback, errorCallback, successCallback));
  this._runNextTransaction();
};

WebSQLDatabase.prototype.transaction = function (txnCallback, errorCallback, successCallback) {
  this._createTransaction(false, txnCallback, errorCallback, successCallback);
};

WebSQLDatabase.prototype.readTransaction = function (txnCallback, errorCallback, successCallback) {
  this._createTransaction(true, txnCallback, errorCallback, successCallback);
};

module.exports = WebSQLDatabase;
});

var require$$0$1 = (WebSQLDatabase && typeof WebSQLDatabase === 'object' && 'default' in WebSQLDatabase ? WebSQLDatabase['default'] : WebSQLDatabase);

var index$5 = __commonjs(function (module) {
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var arguments$1 = arguments;

    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments$1[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
});

var require$$2$2 = (index$5 && typeof index$5 === 'object' && 'default' in index$5 ? index$5['default'] : index$5);

var custom = __commonjs(function (module) {
'use strict';

var immediate = require$$1;
var argsarray = require$$2$2;
var noop = require$$3$1;

var WebSQLDatabase = require$$0$1;

function customOpenDatabase(SQLiteDatabase) {

  function createDb(dbName, dbVersion) {
    var sqliteDatabase = new SQLiteDatabase(dbName);
    return new WebSQLDatabase(dbVersion, sqliteDatabase);
  }

  function openDatabase(args) {

    if (args.length < 4) {
      throw new Error('Failed to execute \'openDatabase\': ' +
        '4 arguments required, but only ' + args.length + ' present');
    }

    var dbName = args[0];
    var dbVersion = args[1];
    // db description and size are ignored
    var callback = args[4] || noop;

    var db = createDb(dbName, dbVersion);

    immediate(function () {
      callback(db);
    });

    return db;
  }

  return argsarray(openDatabase);
}

module.exports = customOpenDatabase;
});

var require$$0 = (custom && typeof custom === 'object' && 'default' in custom ? custom['default'] : custom);

var index = __commonjs(function (module) {
module.exports = require$$0;
});

var index$1 = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);


var customOpenDatabase = Object.freeze({
	default: index$1
});

// regretting using typescript right now.
var custOpen = (index$1 || customOpenDatabase);
var CustomImplementation = function CustomImplementation(name) {
    this.name = name;
    this.nativeDbId = __createWebSQLConnection(this.name);
};
CustomImplementation.prototype.exec = function exec(queries, readOnly, callback) {
    var queriesAsJSON = JSON.stringify(queries);
    var resultJSON = __execDatabaseQuery(this.nativeDbId, queriesAsJSON, readOnly);
    var results = JSON.parse(resultJSON);
    console.log("return from exec", results);
    return callback(null, results);
};
hybrid.openDatabase = custOpen(CustomImplementation);
hybrid.openDatabase;

var events = __commonjs(function (module) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var this$1 = this;

  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this$1, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var this$1 = this;

  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this$1.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}
});

var events$1 = (events && typeof events === 'object' && 'default' in events ? events['default'] : events);


var EventEmitter = Object.freeze({
  default: events$1
});

// Weird disparity between our Rollup generated code and Node
// test environment. Doing this handles both. No idea why.
var ee = EventEmitter;
var emitter = new (ee.default || ee)();
// To stop the Typescript compiler complaining about us doing
// weird things
var selfAsAny$1 = self;
selfAsAny$1.addEventListener = emitter.addListener.bind(emitter);
selfAsAny$1.removeEventListener = emitter.removeListener.bind(emitter);
selfAsAny$1.dispatchEvent = function (evt) {
    emitter.emit(evt.type, evt);
};

var selfAsAny = self;
selfAsAny.promiseBridge = function (callbackIndex, promise) {
    promise
        .then(function (response) {
        __promiseCallback(callbackIndex, null, response);
    })
        .catch(function (err) {
        __promiseCallback(callbackIndex, err.message);
    });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLWNvbnRleHQuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3NlcnZpY2Utd29ya2VyL2dsb2JhbHMvcHJvbWlzZS50cyIsIi4uLy4uL2pzLXNyYy9zcmMvc2VydmljZS13b3JrZXIvZ2xvYmFscy9leHRlbmRhYmxlLWV2ZW50LnRzIiwiLi4vLi4vanMtc3JjL3NyYy9zZXJ2aWNlLXdvcmtlci9nbG9iYWxzL2NvbnNvbGUudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3NlcnZpY2Utd29ya2VyL2h5YnJpZC9wcm9taXNlLWJyaWRnZS50cyIsIi4uLy4uL2pzLXNyYy9zcmMvc2VydmljZS13b3JrZXIvaHlicmlkL2Rpc3BhdGNoLWV4dGVuZGFibGUtZXZlbnQudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3dlYnNxbC9saWIvd2Vic3FsL1dlYlNRTFJlc3VsdFNldC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvaW1tZWRpYXRlL2xpYi90aW1lb3V0LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9pbW1lZGlhdGUvbGliL3N0YXRlQ2hhbmdlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9pbW1lZGlhdGUvbGliL21lc3NhZ2VDaGFubmVsLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9pbW1lZGlhdGUvbGliL211dGF0aW9uLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9pbW1lZGlhdGUvbGliL25leHRUaWNrLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9pbW1lZGlhdGUvbGliL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy90aW55LXF1ZXVlL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9ub29wLWZuL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy93ZWJzcWwvbGliL3dlYnNxbC9XZWJTUUxUcmFuc2FjdGlvbi5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvd2Vic3FsL2xpYi93ZWJzcWwvV2ViU1FMRGF0YWJhc2UuanMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL2FyZ3NhcnJheS9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvd2Vic3FsL2xpYi9jdXN0b20uanMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3dlYnNxbC9jdXN0b20vaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3NlcnZpY2Utd29ya2VyL2h5YnJpZC93ZWJzcWwudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3NlcnZpY2Utd29ya2VyL3NlbGYvZXZlbnRzLnRzIiwiLi4vLi4vanMtc3JjL3NyYy9zZXJ2aWNlLXdvcmtlci93b3JrZXItY29udGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjIuMVxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwID0gZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbiA9IHNjaGVkdWxlRm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXAoYXNhcEZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGFzYXBGbjtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93IHx8IHt9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGNoaWxkW2xpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBST01JU0VfSURdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UoY2hpbGQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzW3N0YXRlIC0gMV07XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcGFyZW50Ll9yZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR0aGVuJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW47XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQUk9NSVNFX0lEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDE2KTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AoKSB7fVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgICA9IHZvaWQgMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEID0gMTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgID0gMjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGZpbGxtZW50KCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJZb3UgY2Fubm90IHJlc29sdmUgYSBwcm9taXNlIHdpdGggaXRzZWxmXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKCdBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihwcm9taXNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuKSB7XG4gICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBlcnJvciA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcblxuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9LCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICAgICAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHRoZW5hYmxlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pIHtcbiAgICAgIGlmIChtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlLmNvbnN0cnVjdG9yICYmXG4gICAgICAgICAgdGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQgJiZcbiAgICAgICAgICBjb25zdHJ1Y3Rvci5yZXNvbHZlID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0KSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsZmlsbG1lbnQoKSk7XG4gICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbih2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaWQgPSAwO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5leHRJZCgpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgICAgIHByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgICAgcHJvbWlzZS5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IFtdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZTtcbiAgICAvKipcbiAgICAgIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgICAgIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gICAgICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXNbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRuZXh0SWQoKTtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJyAmJiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UgPyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcikgOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQsXG5cbiAgICAvKipcbiAgICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBzeW5jaHJvbm91c1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluZEF1dGhvcigpO1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH1cblxuICAgICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGNhdGNoXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCF0aGlzLnByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0pIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIHRoaXMubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHRoaXMucHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJHZhbGlkYXRpb25FcnJvcigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkdmFsaWRhdGlvbkVycm9yKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsZW5ndGggID0gdGhpcy5sZW5ndGg7XG4gICAgICB2YXIgaW5wdXQgICA9IHRoaXMuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgdGhpcy5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgICAgIHZhciByZXNvbHZlID0gYy5yZXNvbHZlO1xuXG4gICAgICBpZiAocmVzb2x2ZSA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCkge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4oZW50cnkpO1xuXG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCAmJlxuICAgICAgICAgICAgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLl9yZW1haW5pbmctLTtcbiAgICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCkge1xuICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgdGhlbik7XG4gICAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbihyZXNvbHZlKSB7IHJlc29sdmUoZW50cnkpOyB9KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24oc3RhdGUsIGksIHZhbHVlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uKHByb21pc2UsIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG4iLCJleHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgKiBhcyBlczZQcm9taXNlIGZyb20gJ2VzNi1wcm9taXNlJztcblxuZ2xvYmFsLlByb21pc2UgPSBlczZQcm9taXNlLlByb21pc2U7XG4iLCJcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXh0ZW5kYWJsZUV2ZW50IHtcblxuICAgIHByaXZhdGUgZGF0YTpPYmplY3Q7XG4gICAgcHVibGljIHR5cGU6c3RyaW5nO1xuICAgIHByaXZhdGUgd2FpdFVudGlsUHJvbWlzZTpQcm9taXNlPGFueT4gPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IodHlwZTpzdHJpbmcsIGRhdGE/OiBPYmplY3QpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9XG5cbiAgICB3YWl0VW50aWwocHJvbWlzZTpQcm9taXNlPGFueT4pIHtcbiAgICAgICAgdGhpcy53YWl0VW50aWxQcm9taXNlID0gcHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXNvbHZlKCkge1xuICAgICAgICBpZiAodGhpcy53YWl0VW50aWxQcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53YWl0VW50aWxQcm9taXNlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn1cblxuZ2xvYmFsLkV4dGVuZGFibGVFdmVudCA9IEV4dGVuZGFibGVFdmVudDsiLCJcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgICB9XG59XG5cbmxldCBsb2dMZXZlbHMgPSBbJ2luZm8nLCAnbG9nJywgJ2Vycm9yJ107XG5cbmdsb2JhbC5jb25zb2xlID0ge307XG5cbmxvZ0xldmVscy5mb3JFYWNoKChsZXZlbCkgPT4ge1xuICAgIGdsb2JhbC5jb25zb2xlW2xldmVsXSA9IGZ1bmN0aW9uIChtZXNzYWdlOnN0cmluZykge1xuICAgICAgICBsZXQgYXJnc0FzSlNPTiA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykubWFwKG1ha2VTdWl0YWJsZSk7XG4gICAgICAgIF9fY29uc29sZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICB0ZXh0OiBhcmdzQXNKU09OLmpvaW4oJywnKVxuICAgICAgICB9KSlcbiAgICB9XG59KVxuIiwiaHlicmlkLnByb21pc2VCcmlkZ2VCYWNrVG9OYXRpdmUgPSBmdW5jdGlvbihjYWxsYmFja0luZGV4Om51bWJlciwgcHJvbWlzZTogUHJvbWlzZTxhbnk+KSB7XG4gICAgcHJvbWlzZVxuICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBfX3Byb21pc2VDYWxsYmFjayhjYWxsYmFja0luZGV4LCBudWxsLCByZXNwb25zZSlcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIF9fcHJvbWlzZUNhbGxiYWNrKGNhbGxiYWNrSW5kZXgsIGVyci5tZXNzYWdlKVxuICAgIH0pXG59IiwiXG5oeWJyaWQuZGlzcGF0Y2hFeHRlbmRhYmxlRXZlbnQgPSBmdW5jdGlvbihuYW1lOnN0cmluZywgZGF0YTpPYmplY3QpIHtcbiAgICBsZXQgZXh0ZW5kZWRFdmVudCA9IG5ldyBFeHRlbmRhYmxlRXZlbnQobmFtZSwgZGF0YSk7XG5cbiAgICBzZWxmLmRpc3BhdGNoRXZlbnQoZXh0ZW5kZWRFdmVudCk7XG5cbiAgICByZXR1cm4gZXh0ZW5kZWRFdmVudC5yZXNvbHZlKClcbn0iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFdlYlNRTFJvd3MoYXJyYXkpIHtcbiAgdGhpcy5fYXJyYXkgPSBhcnJheTtcbiAgdGhpcy5sZW5ndGggPSBhcnJheS5sZW5ndGg7XG59XG5cbldlYlNRTFJvd3MucHJvdG90eXBlLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuICByZXR1cm4gdGhpcy5fYXJyYXlbaV07XG59O1xuXG5mdW5jdGlvbiBXZWJTUUxSZXN1bHRTZXQoaW5zZXJ0SWQsIHJvd3NBZmZlY3RlZCwgcm93cykge1xuICB0aGlzLmluc2VydElkID0gaW5zZXJ0SWQ7XG4gIHRoaXMucm93c0FmZmVjdGVkID0gcm93c0FmZmVjdGVkO1xuICB0aGlzLnJvd3MgPSBuZXcgV2ViU1FMUm93cyhyb3dzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXZWJTUUxSZXN1bHRTZXQ7IiwiJ3VzZSBzdHJpY3QnO1xuZXhwb3J0cy50ZXN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuaW5zdGFsbCA9IGZ1bmN0aW9uICh0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dCh0LCAwKTtcbiAgfTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLnRlc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAnZG9jdW1lbnQnIGluIGdsb2JhbCAmJiAnb25yZWFkeXN0YXRlY2hhbmdlJyBpbiBnbG9iYWwuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG59O1xuXG5leHBvcnRzLmluc3RhbGwgPSBmdW5jdGlvbiAoaGFuZGxlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyBDcmVhdGUgYSA8c2NyaXB0PiBlbGVtZW50OyBpdHMgcmVhZHlzdGF0ZWNoYW5nZSBldmVudCB3aWxsIGJlIGZpcmVkIGFzeW5jaHJvbm91c2x5IG9uY2UgaXQgaXMgaW5zZXJ0ZWRcbiAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuICAgIHZhciBzY3JpcHRFbCA9IGdsb2JhbC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHRFbC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBoYW5kbGUoKTtcblxuICAgICAgc2NyaXB0RWwub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgIHNjcmlwdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0RWwpO1xuICAgICAgc2NyaXB0RWwgPSBudWxsO1xuICAgIH07XG4gICAgZ2xvYmFsLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JpcHRFbCk7XG5cbiAgICByZXR1cm4gaGFuZGxlO1xuICB9O1xufTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMudGVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGdsb2JhbC5zZXRJbW1lZGlhdGUpIHtcbiAgICAvLyB3ZSBjYW4gb25seSBnZXQgaGVyZSBpbiBJRTEwXG4gICAgLy8gd2hpY2ggZG9lc24ndCBoYW5kZWwgcG9zdE1lc3NhZ2Ugd2VsbFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHlwZW9mIGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG59O1xuXG5leHBvcnRzLmluc3RhbGwgPSBmdW5jdGlvbiAoZnVuYykge1xuICB2YXIgY2hhbm5lbCA9IG5ldyBnbG9iYWwuTWVzc2FnZUNoYW5uZWwoKTtcbiAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gIH07XG59OyIsIid1c2Ugc3RyaWN0Jztcbi8vYmFzZWQgb2ZmIHJzdnAgaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qc1xuLy9saWNlbnNlIGh0dHBzOi8vZ2l0aHViLmNvbS90aWxkZWlvL3JzdnAuanMvYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy9odHRwczovL2dpdGh1Yi5jb20vdGlsZGVpby9yc3ZwLmpzL2Jsb2IvbWFzdGVyL2xpYi9yc3ZwL2FzYXAuanNcblxudmFyIE11dGF0aW9uID0gZ2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgZ2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG5cbmV4cG9ydHMudGVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE11dGF0aW9uO1xufTtcblxuZXhwb3J0cy5pbnN0YWxsID0gZnVuY3Rpb24gKGhhbmRsZSkge1xuICB2YXIgY2FsbGVkID0gMDtcbiAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uKGhhbmRsZSk7XG4gIHZhciBlbGVtZW50ID0gZ2xvYmFsLmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50LCB7XG4gICAgY2hhcmFjdGVyRGF0YTogdHJ1ZVxuICB9KTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBlbGVtZW50LmRhdGEgPSAoY2FsbGVkID0gKytjYWxsZWQgJSAyKTtcbiAgfTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuZXhwb3J0cy50ZXN0ID0gZnVuY3Rpb24gKCkge1xuICAvLyBEb24ndCBnZXQgZm9vbGVkIGJ5IGUuZy4gYnJvd3NlcmlmeSBlbnZpcm9ubWVudHMuXG4gIHJldHVybiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSAmJiAhcHJvY2Vzcy5icm93c2VyO1xufTtcblxuZXhwb3J0cy5pbnN0YWxsID0gZnVuY3Rpb24gKGZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmMpO1xuICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciB0eXBlcyA9IFtcbiAgcmVxdWlyZSgnLi9uZXh0VGljaycpLFxuICByZXF1aXJlKCcuL211dGF0aW9uLmpzJyksXG4gIHJlcXVpcmUoJy4vbWVzc2FnZUNoYW5uZWwnKSxcbiAgcmVxdWlyZSgnLi9zdGF0ZUNoYW5nZScpLFxuICByZXF1aXJlKCcuL3RpbWVvdXQnKVxuXTtcbnZhciBkcmFpbmluZztcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xudmFyIHF1ZXVlID0gW107XG52YXIgc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gIGRyYWluaW5nID0gZmFsc2U7XG4gIGlmIChjdXJyZW50UXVldWUgJiYgY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcXVldWVJbmRleCA9IC0xO1xuICB9XG4gIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICBuZXh0VGljaygpO1xuICB9XG59XG5cbi8vbmFtZWQgbmV4dFRpY2sgZm9yIGxlc3MgY29uZnVzaW5nIHN0YWNrIHRyYWNlc1xuZnVuY3Rpb24gbmV4dFRpY2soKSB7XG4gIHNjaGVkdWxlZCA9IGZhbHNlO1xuICBkcmFpbmluZyA9IHRydWU7XG4gIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICB3aGlsZSAobGVuKSB7XG4gICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgcXVldWUgPSBbXTtcbiAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgfVxuICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gIH1cbiAgcXVldWVJbmRleCA9IC0xO1xuICBkcmFpbmluZyA9IGZhbHNlO1xuICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG52YXIgc2NoZWR1bGVEcmFpbjtcbnZhciBpID0gLTE7XG52YXIgbGVuID0gdHlwZXMubGVuZ3RoO1xud2hpbGUgKCsraSA8IGxlbikge1xuICBpZiAodHlwZXNbaV0gJiYgdHlwZXNbaV0udGVzdCAmJiB0eXBlc1tpXS50ZXN0KCkpIHtcbiAgICBzY2hlZHVsZURyYWluID0gdHlwZXNbaV0uaW5zdGFsbChuZXh0VGljayk7XG4gICAgYnJlYWs7XG4gIH1cbn1cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICB0aGlzLmZ1biA9IGZ1bjtcbiAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGltbWVkaWF0ZTtcbmZ1bmN0aW9uIGltbWVkaWF0ZSh0YXNrKSB7XG4gIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cbiAgfVxuICBxdWV1ZS5wdXNoKG5ldyBJdGVtKHRhc2ssIGFyZ3MpKTtcbiAgaWYgKCFzY2hlZHVsZWQgJiYgIWRyYWluaW5nKSB7XG4gICAgc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBzY2hlZHVsZURyYWluKCk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gU2ltcGxlIEZJRk8gcXVldWUgaW1wbGVtZW50YXRpb24gdG8gYXZvaWQgaGF2aW5nIHRvIGRvIHNoaWZ0KClcbi8vIG9uIGFuIGFycmF5LCB3aGljaCBpcyBzbG93LlxuXG5mdW5jdGlvbiBRdWV1ZSgpIHtcbiAgdGhpcy5sZW5ndGggPSAwO1xufVxuXG5RdWV1ZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBub2RlID0ge2l0ZW06IGl0ZW19O1xuICBpZiAodGhpcy5sYXN0KSB7XG4gICAgdGhpcy5sYXN0ID0gdGhpcy5sYXN0Lm5leHQgPSBub2RlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubGFzdCA9IHRoaXMuZmlyc3QgPSBub2RlO1xuICB9XG4gIHRoaXMubGVuZ3RoKys7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub2RlID0gdGhpcy5maXJzdDtcbiAgaWYgKG5vZGUpIHtcbiAgICB0aGlzLmZpcnN0ID0gbm9kZS5uZXh0O1xuICAgIGlmICghKC0tdGhpcy5sZW5ndGgpKSB7XG4gICAgICB0aGlzLmxhc3QgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBub2RlLml0ZW07XG4gIH1cbn07XG5cblF1ZXVlLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHN0YXJ0ID0gdHlwZW9mIHN0YXJ0ID09PSAndW5kZWZpbmVkJyA/IDAgOiBzdGFydDtcbiAgZW5kID0gdHlwZW9mIGVuZCA9PT0gJ3VuZGVmaW5lZCcgPyBJbmZpbml0eSA6IGVuZDtcblxuICB2YXIgb3V0cHV0ID0gW107XG5cbiAgdmFyIGkgPSAwO1xuICBmb3IgKHZhciBub2RlID0gdGhpcy5maXJzdDsgbm9kZTsgbm9kZSA9IG5vZGUubmV4dCkge1xuICAgIGlmICgtLWVuZCA8IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSBpZiAoKytpID4gc3RhcnQpIHtcbiAgICAgIG91dHB1dC5wdXNoKG5vZGUuaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUXVldWU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge307XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBub29wID0gcmVxdWlyZSgnbm9vcC1mbicpO1xudmFyIFF1ZXVlID0gcmVxdWlyZSgndGlueS1xdWV1ZScpO1xudmFyIGltbWVkaWF0ZSA9IHJlcXVpcmUoJ2ltbWVkaWF0ZScpO1xudmFyIFdlYlNRTFJlc3VsdFNldCA9IHJlcXVpcmUoJy4vV2ViU1FMUmVzdWx0U2V0Jyk7XG5cbmZ1bmN0aW9uIGVycm9yVW5oYW5kbGVkKCkge1xuICByZXR1cm4gdHJ1ZTsgLy8gYSBub24tdHJ1dGh5IHJldHVybiBpbmRpY2F0ZXMgZXJyb3Igd2FzIGhhbmRsZWRcbn1cblxuLy8gV2ViU1FMIGhhcyBzb21lIGJpemFycmUgYmVoYXZpb3IgcmVnYXJkaW5nIGluc2VydElkL3Jvd3NBZmZlY3RlZC4gVG8gdHJ5XG4vLyB0byBtYXRjaCB0aGUgb2JzZXJ2ZWQgYmVoYXZpb3Igb2YgQ2hyb21lL1NhZmFyaSBhcyBtdWNoIGFzIHBvc3NpYmxlLCB3ZVxuLy8gc25pZmYgdGhlIFNRTCBtZXNzYWdlIHRvIHRyeSB0byBtYXNzYWdlIHRoZSByZXR1cm5lZCBpbnNlcnRJZC9yb3dzQWZmZWN0ZWQuXG4vLyBUaGlzIGhlbHBzIHVzIHBhc3MgdGhlIHRlc3RzLCBhbHRob3VnaCBpdCdzIGVycm9yLXByb25lIGFuZCBzaG91bGRcbi8vIHByb2JhYmx5IGJlIHJldmlzZWQuXG5mdW5jdGlvbiBtYXNzYWdlU1FMUmVzdWx0KHNxbCwgaW5zZXJ0SWQsIHJvd3NBZmZlY3RlZCwgcm93cykge1xuICBpZiAoL15cXHMqVVBEQVRFXFxiL2kudGVzdChzcWwpKSB7XG4gICAgLy8gaW5zZXJ0SWQgaXMgYWx3YXlzIHVuZGVmaW5lZCBmb3IgXCJVUERBVEVcIiBzdGF0ZW1lbnRzXG4gICAgaW5zZXJ0SWQgPSB2b2lkIDA7XG4gIH0gZWxzZSBpZiAoL15cXHMqQ1JFQVRFXFxzK1RBQkxFXFxiL2kudGVzdChzcWwpKSB7XG4gICAgLy8gV2ViU1FMIGFsd2F5cyByZXR1cm5zIGFuIGluc2VydElkIG9mIDAgZm9yIFwiQ1JFQVRFIFRBQkxFXCIgc3RhdGVtZW50c1xuICAgIGluc2VydElkID0gMDtcbiAgICByb3dzQWZmZWN0ZWQgPSAwO1xuICB9IGVsc2UgaWYgKC9eXFxzKkRST1BcXHMrVEFCTEVcXGIvaS50ZXN0KHNxbCkpIHtcbiAgICAvLyBXZWJTUUwgYWx3YXlzIHJldHVybnMgaW5zZXJ0SWQ9dW5kZWZpbmVkIGFuZCByb3dzQWZmZWN0ZWQ9MFxuICAgIC8vIGZvciBcIkRST1AgVEFCTEVcIiBzdGF0ZW1lbnRzLiBHbyBmaWd1cmUuXG4gICAgaW5zZXJ0SWQgPSB2b2lkIDA7XG4gICAgcm93c0FmZmVjdGVkID0gMDtcbiAgfSBlbHNlIGlmICghL15cXHMqSU5TRVJUXFxiL2kudGVzdChzcWwpKSB7XG4gICAgLy8gZm9yIGFsbCBub24taW5zZXJ0cyAoZGVsZXRlcywgZXRjLikgaW5zZXJ0SWQgaXMgYWx3YXlzIHVuZGVmaW5lZFxuICAgIC8vIMKvXFxfKOODhClfL8KvXG4gICAgaW5zZXJ0SWQgPSB2b2lkIDA7XG4gIH1cbiAgcmV0dXJuIG5ldyBXZWJTUUxSZXN1bHRTZXQoaW5zZXJ0SWQsIHJvd3NBZmZlY3RlZCwgcm93cyk7XG59XG5cbmZ1bmN0aW9uIFNRTFRhc2soc3FsLCBhcmdzLCBzcWxDYWxsYmFjaywgc3FsRXJyb3JDYWxsYmFjaykge1xuICB0aGlzLnNxbCA9IHNxbDtcbiAgdGhpcy5hcmdzID0gYXJncztcbiAgdGhpcy5zcWxDYWxsYmFjayA9IHNxbENhbGxiYWNrO1xuICB0aGlzLnNxbEVycm9yQ2FsbGJhY2sgPSBzcWxFcnJvckNhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBydW5CYXRjaChzZWxmLCBiYXRjaCkge1xuXG4gIGZ1bmN0aW9uIG9uRG9uZSgpIHtcbiAgICBzZWxmLl9ydW5uaW5nID0gZmFsc2U7XG4gICAgcnVuQWxsU3FsKHNlbGYpO1xuICB9XG5cbiAgdmFyIHJlYWRPbmx5ID0gc2VsZi5fd2Vic3FsRGF0YWJhc2UuX2N1cnJlbnRUYXNrLnJlYWRPbmx5O1xuXG4gIHNlbGYuX3dlYnNxbERhdGFiYXNlLl9kYi5leGVjKGJhdGNoLCByZWFkT25seSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKGVycikge1xuICAgICAgc2VsZi5fZXJyb3IgPSBlcnI7XG4gICAgICByZXR1cm4gb25Eb25lKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJlcyA9IHJlc3VsdHNbaV07XG4gICAgICB2YXIgYmF0Y2hUYXNrID0gYmF0Y2hbaV07XG4gICAgICBpZiAocmVzLmVycm9yKSB7XG4gICAgICAgIGlmIChiYXRjaFRhc2suc3FsRXJyb3JDYWxsYmFjayhzZWxmLCByZXMuZXJyb3IpKSB7XG4gICAgICAgICAgLy8gdXNlciBkaWRuJ3QgaGFuZGxlIHRoZSBlcnJvclxuICAgICAgICAgIHNlbGYuX2Vycm9yID0gcmVzLmVycm9yO1xuICAgICAgICAgIHJldHVybiBvbkRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmF0Y2hUYXNrLnNxbENhbGxiYWNrKHNlbGYsIG1hc3NhZ2VTUUxSZXN1bHQoXG4gICAgICAgICAgYmF0Y2hbaV0uc3FsLCByZXMuaW5zZXJ0SWQsIHJlcy5yb3dzQWZmZWN0ZWQsIHJlcy5yb3dzKSk7XG4gICAgICB9XG4gICAgfVxuICAgIG9uRG9uZSgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcnVuQWxsU3FsKHNlbGYpIHtcbiAgaWYgKHNlbGYuX3J1bm5pbmcgfHwgc2VsZi5fY29tcGxldGUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHNlbGYuX2Vycm9yKSB7XG4gICAgc2VsZi5fY29tcGxldGUgPSB0cnVlO1xuICAgIHJldHVybiBzZWxmLl93ZWJzcWxEYXRhYmFzZS5fb25UcmFuc2FjdGlvbkNvbXBsZXRlKHNlbGYuX2Vycm9yKTtcbiAgfVxuICBpZiAoIXNlbGYuX3NxbFF1ZXVlLmxlbmd0aCkge1xuICAgIHNlbGYuX2NvbXBsZXRlID0gdHJ1ZTtcbiAgICByZXR1cm4gc2VsZi5fd2Vic3FsRGF0YWJhc2UuX29uVHJhbnNhY3Rpb25Db21wbGV0ZSgpO1xuICB9XG4gIHNlbGYuX3J1bm5pbmcgPSB0cnVlO1xuICB2YXIgYmF0Y2ggPSBbXTtcbiAgdmFyIHRhc2s7XG4gIHdoaWxlICgodGFzayA9IHNlbGYuX3NxbFF1ZXVlLnNoaWZ0KCkpKSB7XG4gICAgYmF0Y2gucHVzaCh0YXNrKTtcbiAgfVxuICBydW5CYXRjaChzZWxmLCBiYXRjaCk7XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVTcWwoc2VsZiwgc3FsLCBhcmdzLCBzcWxDYWxsYmFjaywgc3FsRXJyb3JDYWxsYmFjaykge1xuICBzZWxmLl9zcWxRdWV1ZS5wdXNoKG5ldyBTUUxUYXNrKHNxbCwgYXJncywgc3FsQ2FsbGJhY2ssIHNxbEVycm9yQ2FsbGJhY2spKTtcbiAgaWYgKHNlbGYuX3J1bm5pbmdUaW1lb3V0KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNlbGYuX3J1bm5pbmdUaW1lb3V0ID0gdHJ1ZTtcbiAgaW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9ydW5uaW5nVGltZW91dCA9IGZhbHNlO1xuICAgIHJ1bkFsbFNxbChzZWxmKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIFdlYlNRTFRyYW5zYWN0aW9uKHdlYnNxbERhdGFiYXNlKSB7XG4gIHRoaXMuX3dlYnNxbERhdGFiYXNlID0gd2Vic3FsRGF0YWJhc2U7XG4gIHRoaXMuX2Vycm9yID0gbnVsbDtcbiAgdGhpcy5fY29tcGxldGUgPSBmYWxzZTtcbiAgdGhpcy5fcnVubmluZ1RpbWVvdXQgPSBmYWxzZTtcbiAgdGhpcy5fc3FsUXVldWUgPSBuZXcgUXVldWUoKTtcbiAgaWYgKCF3ZWJzcWxEYXRhYmFzZS5fY3VycmVudFRhc2sucmVhZE9ubHkpIHtcbiAgICAvLyBTaW5jZSB3ZSBzZXJpYWxpemUgYWxsIGFjY2VzcyB0byB0aGUgZGF0YWJhc2UsIHRoZXJlIGlzIG5vIG5lZWQgdG9cbiAgICAvLyBydW4gcmVhZC1vbmx5IHRhc2tzIGluIGEgdHJhbnNhY3Rpb24uIFRoaXMgaXMgYSBwZXJmIGJvb3N0LlxuICAgIHRoaXMuX3NxbFF1ZXVlLnB1c2gobmV3IFNRTFRhc2soJ0JFR0lOOycsIFtdLCBub29wLCBub29wKSk7XG4gIH1cbn1cblxuV2ViU1FMVHJhbnNhY3Rpb24ucHJvdG90eXBlLmV4ZWN1dGVTcWwgPSBmdW5jdGlvbiAoc3FsLCBhcmdzLCBzcWxDYWxsYmFjaywgc3FsRXJyb3JDYWxsYmFjaykge1xuICBhcmdzID0gQXJyYXkuaXNBcnJheShhcmdzKSA/IGFyZ3MgOiBbXTtcbiAgc3FsQ2FsbGJhY2sgPSB0eXBlb2Ygc3FsQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBzcWxDYWxsYmFjayA6IG5vb3A7XG4gIHNxbEVycm9yQ2FsbGJhY2sgPSB0eXBlb2Ygc3FsRXJyb3JDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IHNxbEVycm9yQ2FsbGJhY2sgOiBlcnJvclVuaGFuZGxlZDtcblxuICBleGVjdXRlU3FsKHRoaXMsIHNxbCwgYXJncywgc3FsQ2FsbGJhY2ssIHNxbEVycm9yQ2FsbGJhY2spO1xufTtcblxuV2ViU1FMVHJhbnNhY3Rpb24ucHJvdG90eXBlLl9jaGVja0RvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHJ1bkFsbFNxbCh0aGlzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViU1FMVHJhbnNhY3Rpb247IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUXVldWUgPSByZXF1aXJlKCd0aW55LXF1ZXVlJyk7XG52YXIgaW1tZWRpYXRlID0gcmVxdWlyZSgnaW1tZWRpYXRlJyk7XG52YXIgbm9vcCA9IHJlcXVpcmUoJ25vb3AtZm4nKTtcblxudmFyIFdlYlNRTFRyYW5zYWN0aW9uID0gcmVxdWlyZSgnLi9XZWJTUUxUcmFuc2FjdGlvbicpO1xuXG52YXIgUk9MTEJBQ0sgPSBbXG4gIHtzcWw6ICdST0xMQkFDSzsnLCBhcmdzOiBbXX1cbl07XG5cbnZhciBDT01NSVQgPSBbXG4gIHtzcWw6ICdFTkQ7JywgYXJnczogW119XG5dO1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0YWJsZSBvYmplY3RzXG5mdW5jdGlvbiBUcmFuc2FjdGlvblRhc2socmVhZE9ubHksIHR4bkNhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgdGhpcy5yZWFkT25seSA9IHJlYWRPbmx5O1xuICB0aGlzLnR4bkNhbGxiYWNrID0gdHhuQ2FsbGJhY2s7XG4gIHRoaXMuZXJyb3JDYWxsYmFjayA9IGVycm9yQ2FsbGJhY2s7XG4gIHRoaXMuc3VjY2Vzc0NhbGxiYWNrID0gc3VjY2Vzc0NhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBXZWJTUUxEYXRhYmFzZShkYlZlcnNpb24sIGRiKSB7XG4gIHRoaXMudmVyc2lvbiA9IGRiVmVyc2lvbjtcbiAgdGhpcy5fZGIgPSBkYjtcbiAgdGhpcy5fdHhuUXVldWUgPSBuZXcgUXVldWUoKTtcbiAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICB0aGlzLl9jdXJyZW50VGFzayA9IG51bGw7XG59XG5cbldlYlNRTERhdGFiYXNlLnByb3RvdHlwZS5fb25UcmFuc2FjdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24oZXJyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBmdW5jdGlvbiBkb25lKCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHNlbGYuX2N1cnJlbnRUYXNrLmVycm9yQ2FsbGJhY2soZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5fY3VycmVudFRhc2suc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgfVxuICAgIHNlbGYuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICBzZWxmLl9jdXJyZW50VGFzayA9IG51bGw7XG4gICAgc2VsZi5fcnVuTmV4dFRyYW5zYWN0aW9uKCk7XG4gIH1cblxuICBpZiAoc2VsZi5fY3VycmVudFRhc2sucmVhZE9ubHkpIHtcbiAgICBkb25lKCk7IC8vIHJlYWQtb25seSBkb2Vzbid0IHJlcXVpcmUgYSB0cmFuc2FjdGlvblxuICB9IGVsc2UgaWYgKGVycikge1xuICAgIHNlbGYuX2RiLmV4ZWMoUk9MTEJBQ0ssIGZhbHNlLCBkb25lKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLl9kYi5leGVjKENPTU1JVCwgZmFsc2UsIGRvbmUpO1xuICB9XG59O1xuXG5XZWJTUUxEYXRhYmFzZS5wcm90b3R5cGUuX3J1blRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciB0eG4gPSBuZXcgV2ViU1FMVHJhbnNhY3Rpb24oc2VsZik7XG5cbiAgaW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9jdXJyZW50VGFzay50eG5DYWxsYmFjayh0eG4pO1xuICAgIHR4bi5fY2hlY2tEb25lKCk7XG4gIH0pO1xufTtcblxuV2ViU1FMRGF0YWJhc2UucHJvdG90eXBlLl9ydW5OZXh0VHJhbnNhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX3J1bm5pbmcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHRhc2sgPSB0aGlzLl90eG5RdWV1ZS5zaGlmdCgpO1xuXG4gIGlmICghdGFzaykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX2N1cnJlbnRUYXNrID0gdGFzaztcbiAgdGhpcy5fcnVubmluZyA9IHRydWU7XG4gIHRoaXMuX3J1blRyYW5zYWN0aW9uKCk7XG59O1xuXG5XZWJTUUxEYXRhYmFzZS5wcm90b3R5cGUuX2NyZWF0ZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24oXG4gICAgcmVhZE9ubHksIHR4bkNhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgZXJyb3JDYWxsYmFjayA9IGVycm9yQ2FsbGJhY2sgfHwgbm9vcDtcbiAgc3VjY2Vzc0NhbGxiYWNrID0gc3VjY2Vzc0NhbGxiYWNrIHx8IG5vb3A7XG5cbiAgaWYgKHR5cGVvZiB0eG5DYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGNhbGxiYWNrIHByb3ZpZGVkIGFzIHBhcmFtZXRlciAxIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICB9XG5cbiAgdGhpcy5fdHhuUXVldWUucHVzaChuZXcgVHJhbnNhY3Rpb25UYXNrKHJlYWRPbmx5LCB0eG5DYWxsYmFjaywgZXJyb3JDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrKSk7XG4gIHRoaXMuX3J1bk5leHRUcmFuc2FjdGlvbigpO1xufTtcblxuV2ViU1FMRGF0YWJhc2UucHJvdG90eXBlLnRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKHR4bkNhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgdGhpcy5fY3JlYXRlVHJhbnNhY3Rpb24oZmFsc2UsIHR4bkNhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2spO1xufTtcblxuV2ViU1FMRGF0YWJhc2UucHJvdG90eXBlLnJlYWRUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uICh0eG5DYWxsYmFjaywgZXJyb3JDYWxsYmFjaywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gIHRoaXMuX2NyZWF0ZVRyYW5zYWN0aW9uKHRydWUsIHR4bkNhbGxiYWNrLCBlcnJvckNhbGxiYWNrLCBzdWNjZXNzQ2FsbGJhY2spO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJTUUxEYXRhYmFzZTsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gYXJnc0FycmF5O1xuXG5mdW5jdGlvbiBhcmdzQXJyYXkoZnVuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbikge1xuICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgIHZhciBpID0gLTE7XG4gICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuLmNhbGwodGhpcywgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmdW4uY2FsbCh0aGlzLCBbXSk7XG4gICAgfVxuICB9O1xufSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGltbWVkaWF0ZSA9IHJlcXVpcmUoJ2ltbWVkaWF0ZScpO1xudmFyIGFyZ3NhcnJheSA9IHJlcXVpcmUoJ2FyZ3NhcnJheScpO1xudmFyIG5vb3AgPSByZXF1aXJlKCdub29wLWZuJyk7XG5cbnZhciBXZWJTUUxEYXRhYmFzZSA9IHJlcXVpcmUoJy4vd2Vic3FsL1dlYlNRTERhdGFiYXNlJyk7XG5cbmZ1bmN0aW9uIGN1c3RvbU9wZW5EYXRhYmFzZShTUUxpdGVEYXRhYmFzZSkge1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZURiKGRiTmFtZSwgZGJWZXJzaW9uKSB7XG4gICAgdmFyIHNxbGl0ZURhdGFiYXNlID0gbmV3IFNRTGl0ZURhdGFiYXNlKGRiTmFtZSk7XG4gICAgcmV0dXJuIG5ldyBXZWJTUUxEYXRhYmFzZShkYlZlcnNpb24sIHNxbGl0ZURhdGFiYXNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5EYXRhYmFzZShhcmdzKSB7XG5cbiAgICBpZiAoYXJncy5sZW5ndGggPCA0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBleGVjdXRlIFxcJ29wZW5EYXRhYmFzZVxcJzogJyArXG4gICAgICAgICc0IGFyZ3VtZW50cyByZXF1aXJlZCwgYnV0IG9ubHkgJyArIGFyZ3MubGVuZ3RoICsgJyBwcmVzZW50Jyk7XG4gICAgfVxuXG4gICAgdmFyIGRiTmFtZSA9IGFyZ3NbMF07XG4gICAgdmFyIGRiVmVyc2lvbiA9IGFyZ3NbMV07XG4gICAgLy8gZGIgZGVzY3JpcHRpb24gYW5kIHNpemUgYXJlIGlnbm9yZWRcbiAgICB2YXIgY2FsbGJhY2sgPSBhcmdzWzRdIHx8IG5vb3A7XG5cbiAgICB2YXIgZGIgPSBjcmVhdGVEYihkYk5hbWUsIGRiVmVyc2lvbik7XG5cbiAgICBpbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2soZGIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRiO1xuICB9XG5cbiAgcmV0dXJuIGFyZ3NhcnJheShvcGVuRGF0YWJhc2UpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGN1c3RvbU9wZW5EYXRhYmFzZTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL2xpYi9jdXN0b20nKTsiLCJpbXBvcnQgKiBhcyBjdXN0b21PcGVuRGF0YWJhc2UgZnJvbSAnd2Vic3FsL2N1c3RvbSc7XG5cbi8vIHJlZ3JldHRpbmcgdXNpbmcgdHlwZXNjcmlwdCByaWdodCBub3cuXG5sZXQgY3VzdE9wZW4gPSAoY3VzdG9tT3BlbkRhdGFiYXNlLmRlZmF1bHQgfHwgY3VzdG9tT3BlbkRhdGFiYXNlKVxuXG5pbnRlcmZhY2UgU1FMUXVlcnkge1xuICAgIHNxbDogc3RyaW5nO1xuICAgIGFyZ3M6IFthbnldXG59XG5cbmludGVyZmFjZSBTUUxSZXN1bHRTZXQge1xuICAgIHJvd3M6IFthbnldO1xuICAgIHJvd3NBZmZlY3RlZDogbnVtYmVyO1xuICAgIGluc2VydElkOiBudW1iZXI7XG59XG5cbmNsYXNzIEN1c3RvbUltcGxlbWVudGF0aW9uIHtcblxuICAgIHByaXZhdGUgbmFtZTpzdHJpbmc7XG4gICAgcHJpdmF0ZSBuYXRpdmVEYklkOm51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6c3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLm5hdGl2ZURiSWQgPSBfX2NyZWF0ZVdlYlNRTENvbm5lY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBleGVjKHF1ZXJpZXM6W1NRTFF1ZXJ5XSwgcmVhZE9ubHk6Qm9vbGVhbiwgY2FsbGJhY2s6KGVycm9yOkVycm9yLCByZXN1bHRzOmFueSkgPT4gdm9pZCkgIHtcbiAgICAgICAgbGV0IHF1ZXJpZXNBc0pTT04gPSBKU09OLnN0cmluZ2lmeShxdWVyaWVzKTtcbiAgICAgICAgbGV0IHJlc3VsdEpTT04gPSBfX2V4ZWNEYXRhYmFzZVF1ZXJ5KHRoaXMubmF0aXZlRGJJZCwgcXVlcmllc0FzSlNPTiwgcmVhZE9ubHkpO1xuICAgIFxuICAgICAgICBsZXQgcmVzdWx0czphbnkgPSBKU09OLnBhcnNlKHJlc3VsdEpTT04pO1xuICAgICAgICBjb25zb2xlLmxvZyhcInJldHVybiBmcm9tIGV4ZWNcIiwgcmVzdWx0cylcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgIH1cbn1cblxuXG5oeWJyaWQub3BlbkRhdGFiYXNlID0gY3VzdE9wZW4oQ3VzdG9tSW1wbGVtZW50YXRpb24pO1xuZXhwb3J0IGRlZmF1bHQgaHlicmlkLm9wZW5EYXRhYmFzZTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJpbXBvcnQgKiBhcyBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuLy8gV2VpcmQgZGlzcGFyaXR5IGJldHdlZW4gb3VyIFJvbGx1cCBnZW5lcmF0ZWQgY29kZSBhbmQgTm9kZVxuLy8gdGVzdCBlbnZpcm9ubWVudC4gRG9pbmcgdGhpcyBoYW5kbGVzIGJvdGguIE5vIGlkZWEgd2h5LlxubGV0IGVlID0gRXZlbnRFbWl0dGVyO1xubGV0IGVtaXR0ZXIgPSBuZXcgKChlZSBhcyBhbnkpLmRlZmF1bHQgfHwgZWUpKCk7XG5cbi8vIFRvIHN0b3AgdGhlIFR5cGVzY3JpcHQgY29tcGlsZXIgY29tcGxhaW5pbmcgYWJvdXQgdXMgZG9pbmdcbi8vIHdlaXJkIHRoaW5nc1xubGV0IHNlbGZBc0FueSA9IHNlbGYgYXMgYW55O1xuXG5zZWxmQXNBbnkuYWRkRXZlbnRMaXN0ZW5lciA9IGVtaXR0ZXIuYWRkTGlzdGVuZXIuYmluZChlbWl0dGVyKTtcbnNlbGZBc0FueS5yZW1vdmVFdmVudExpc3RlbmVyID0gZW1pdHRlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGVtaXR0ZXIpO1xuXG5zZWxmQXNBbnkuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2dDpFdmVudCkge1xuICAgIGVtaXR0ZXIuZW1pdChldnQudHlwZSwgZXZ0KTtcbn1cbiIsImltcG9ydCAnLi9pbmNsdWRlJ1xuXG5sZXQgc2VsZkFzQW55ID0gc2VsZiBhcyBhbnk7XG5cbnNlbGZBc0FueS5wcm9taXNlQnJpZGdlID0gZnVuY3Rpb24oY2FsbGJhY2tJbmRleDpudW1iZXIsIHByb21pc2U6IFByb21pc2U8YW55Pikge1xuICAgIHByb21pc2VcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgX19wcm9taXNlQ2FsbGJhY2soY2FsbGJhY2tJbmRleCwgbnVsbCwgcmVzcG9uc2UpXG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBfX3Byb21pc2VDYWxsYmFjayhjYWxsYmFja0luZGV4LCBlcnIubWVzc2FnZSlcbiAgICB9KVxufSJdLCJuYW1lcyI6WyJ0aGlzIiwiZXM2UHJvbWlzZS5Qcm9taXNlIiwiRXh0ZW5kYWJsZUV2ZW50IiwiY29uc3QiLCJsZXQiLCJyZXF1aXJlJCQxIiwicmVxdWlyZSQkMCIsImFyZ3VtZW50cyIsInJlcXVpcmUkJDMiLCJyZXF1aXJlJCQyIiwiY3VzdG9tT3BlbkRhdGFiYXNlLmRlZmF1bHQiLCJzZWxmQXNBbnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLENBQUMsV0FBVztJQUNSLFlBQVksQ0FBQztJQUNiLFNBQVMsdUNBQXVDLENBQUMsQ0FBQyxFQUFFO01BQ2xELE9BQU8sT0FBTyxDQUFDLEtBQUssVUFBVSxLQUFLLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7S0FDekU7O0lBRUQsU0FBUyxpQ0FBaUMsQ0FBQyxDQUFDLEVBQUU7TUFDNUMsT0FBTyxPQUFPLENBQUMsS0FBSyxV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QU8sQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDNUc7O0FBRUQsQUFBTyxTQUFTLE9BQU8sQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFO0lBQzNDLE9BQU8sVUFBVSxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtDQUN4RTs7QUFFRCxBQUFPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtJQUN6RCxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7UUFDdkQsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUMzRixTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFB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