(function () {
'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var es6Promise = createCommonjsModule(function (module, exports) {
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   3.3.1
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(commonjsGlobal, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function () {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && 'function' === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

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
  let promise = new Promise(function(resolve, reject) {
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
      let xhr = new XMLHttpRequest();

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
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

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
    let result;
  
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
    let author, books;
  
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
  then: then,

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
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof commonjsGlobal !== 'undefined') {
        local = commonjsGlobal;
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

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

polyfill();
// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));
});

interopDefault(es6Promise);
var Promise$1 = es6Promise.Promise;

const __assign = Object.assign || function (target) {
    for (var source, i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

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
global.__bind = function (obj, funcName) {
    return obj[funcName].bind(obj);
};

var nextTick = createCommonjsModule(function (module, exports) {
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

var nextTick$1 = interopDefault(nextTick);
var install = nextTick.install;
var test = nextTick.test;

var require$$4 = Object.freeze({
  default: nextTick$1,
  install: install,
  test: test
});

var mutation = createCommonjsModule(function (module, exports) {
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = commonjsGlobal.MutationObserver || commonjsGlobal.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = commonjsGlobal.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
});

var mutation$1 = interopDefault(mutation);
var install$1 = mutation.install;
var test$1 = mutation.test;

var require$$3 = Object.freeze({
  default: mutation$1,
  install: install$1,
  test: test$1
});

var messageChannel = createCommonjsModule(function (module, exports) {
'use strict';

exports.test = function () {
  if (commonjsGlobal.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof commonjsGlobal.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new commonjsGlobal.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
});

var messageChannel$1 = interopDefault(messageChannel);
var install$2 = messageChannel.install;
var test$2 = messageChannel.test;

var require$$2 = Object.freeze({
  default: messageChannel$1,
  install: install$2,
  test: test$2
});

var stateChange = createCommonjsModule(function (module, exports) {
'use strict';

exports.test = function () {
  return 'document' in commonjsGlobal && 'onreadystatechange' in commonjsGlobal.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = commonjsGlobal.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    commonjsGlobal.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
});

var stateChange$1 = interopDefault(stateChange);
var install$3 = stateChange.install;
var test$3 = stateChange.test;

var require$$1$1 = Object.freeze({
  default: stateChange$1,
  install: install$3,
  test: test$3
});

var timeout = createCommonjsModule(function (module, exports) {
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

var timeout$1 = interopDefault(timeout);
var install$4 = timeout.install;
var test$4 = timeout.test;

var require$$0$1 = Object.freeze({
  default: timeout$1,
  install: install$4,
  test: test$4
});

var index$1 = createCommonjsModule(function (module) {
'use strict';
var types = [
  interopDefault(require$$4),
  interopDefault(require$$3),
  interopDefault(require$$2),
  interopDefault(require$$1$1),
  interopDefault(require$$0$1)
];
var draining;
var currentQueue;
var queueIndex = -1;
var queue = [];
var scheduled = false;
function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }
  draining = false;
  if (currentQueue.length) {
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
  if (draining) {
    return;
  }
  scheduled = false;
  draining = true;
  var len = queue.length;
  var timeout = setTimeout(cleanUpNextTick);
  while (len) {
    currentQueue = queue;
    queue = [];
    while (currentQueue && ++queueIndex < len) {
      currentQueue[queueIndex].run();
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
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
  var fun = this.fun;
  var array = this.array;
  switch (array.length) {
  case 0:
    return fun();
  case 1:
    return fun(array[0]);
  case 2:
    return fun(array[0], array[1]);
  case 3:
    return fun(array[0], array[1], array[2]);
  default:
    return fun.apply(null, array);
  }

};
module.exports = immediate;
function immediate(task) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }
  queue.push(new Item(task, args));
  if (!scheduled && !draining) {
    scheduled = true;
    scheduleDrain();
  }
}
});

var index$2 = interopDefault(index$1);


var require$$1 = Object.freeze({
  default: index$2
});

var index$3 = createCommonjsModule(function (module) {
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
});

var index$4 = interopDefault(index$3);


var require$$2$1 = Object.freeze({
  default: index$4
});

var index$5 = createCommonjsModule(function (module) {
module.exports = function() {};
});

var index$6 = interopDefault(index$5);


var require$$3$1 = Object.freeze({
	default: index$6
});

var index$7 = createCommonjsModule(function (module) {
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
  start = typeof start === 'undefined' ? 0 : start;
  end = typeof end === 'undefined' ? Infinity : end;

  var output = [];

  var i = 0;
  for (var node = this.first; node; node = node.next) {
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

var index$8 = interopDefault(index$7);


var require$$2$2 = Object.freeze({
  default: index$8
});

var WebSQLResultSet = createCommonjsModule(function (module) {
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

var WebSQLResultSet$1 = interopDefault(WebSQLResultSet);


var require$$0$4 = Object.freeze({
  default: WebSQLResultSet$1
});

var WebSQLTransaction = createCommonjsModule(function (module) {
'use strict';

var noop = interopDefault(require$$3$1);
var Queue = interopDefault(require$$2$2);
var immediate = interopDefault(require$$1);
var WebSQLResultSet = interopDefault(require$$0$4);

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

var WebSQLTransaction$1 = interopDefault(WebSQLTransaction);


var require$$0$3 = Object.freeze({
  default: WebSQLTransaction$1
});

var WebSQLDatabase = createCommonjsModule(function (module) {
'use strict';

var Queue = interopDefault(require$$2$2);
var immediate = interopDefault(require$$1);
var noop = interopDefault(require$$3$1);

var WebSQLTransaction = interopDefault(require$$0$3);

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

var WebSQLDatabase$1 = interopDefault(WebSQLDatabase);


var require$$0$2 = Object.freeze({
  default: WebSQLDatabase$1
});

var custom = createCommonjsModule(function (module) {
'use strict';

var immediate = interopDefault(require$$1);
var argsarray = interopDefault(require$$2$1);
var noop = interopDefault(require$$3$1);

var WebSQLDatabase = interopDefault(require$$0$2);

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

var custom$1 = interopDefault(custom);


var require$$0 = Object.freeze({
  default: custom$1
});

var index = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0);
});

var customOpenDatabase = interopDefault(index);

// regretting using typescript right now.
var custOpen = (customOpenDatabase.default || customOpenDatabase);
var CustomImplementation = (function () {
    function CustomImplementation(name) {
        var returnArray = __WebSQLDatabaseCreator.createDB(name);
        if (returnArray[0]) {
            throw returnArray[0];
        }
        this.db = returnArray[1];
    }
    CustomImplementation.prototype.exec = function () {
        var _this = this;
        var args = arguments;
        // The callback has to execute asynchronously, as libraries like treo
        // set event listeners up after calling a query
        setTimeout(function () {
            _this.db.execReadOnlyCallback.apply(_this.db, args);
        }, 0);
    };
    return CustomImplementation;
}());
var openDatabase = customOpenDatabase(CustomImplementation);
global.openDatabase = openDatabase;

var EventTarget = createCommonjsModule(function (module) {
var DOMException;
(function () {
  'use strict';

  var phases = {
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3
  };

  if (typeof DOMException === 'undefined') {
    // Todo: Better polyfill (if even needed here)
    DOMException = function (msg, name) { // No need for `toString` as same as for `Error`
      var err = new Error(msg);
      err.name = name;
      return err;
    };
  }

  var ev = new WeakMap();
  var evCfg = new WeakMap();

  // Todo: Set _ev argument outside of this function
  /**
  * We use an adapter class rather than a proxy not only for compatibility but also since we have to clone
  * native event properties anyways in order to properly set `target`, etc.
  * @note The regular DOM method `dispatchEvent` won't work with this polyfill as it expects a native event
  */
  var EventPolyfill = function EventPolyfill (type, evInit, _ev) { // eslint-disable-line no-native-reassign
    if (!arguments.length) {
      throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
    }
    evInit = evInit || {};
    _ev = _ev || {};

    var _evCfg = {};
    _evCfg.type = type;
    if ('bubbles' in evInit) {
      _evCfg.bubbles = evInit.bubbles;
    }
    if ('cancelable' in evInit) {
      _evCfg.cancelable = evInit.cancelable;
    }
    if ('composed' in evInit) {
      _evCfg.composed = evInit.composed;
    }

    // _evCfg.isTrusted = true; // We are not always using this for user-created events
    // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

    ev.set(this, _ev);
    evCfg.set(this, _evCfg);
    Object.defineProperties(this,
      ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].reduce(function (obj, prop) {
        obj[prop] = {
          get: function () {
            return (/* prop in _evCfg && */ _evCfg[prop] !== undefined) ? _evCfg[prop] : (
              prop in _ev ? _ev[prop] : (
                // Defaults
                prop === 'eventPhase' ? 0 : (prop === 'defaultPrevented' ? false : null)
              )
            );
          }
        };
        return obj;
      }, {})
    );
    var props = [
      // Event
      'type',
      'bubbles', 'cancelable', // Defaults to false
      'isTrusted', 'timeStamp',
      // Other event properties (not used by our code)
      'composedPath', 'composed', 'initEvent', 'initCustomEvent'
    ];
    if (this.toString() === '[object CustomEvent]') {
      props.push('detail');
    }

    Object.defineProperties(this, props.reduce(function (obj, prop) {
      obj[prop] = {
        get: function () {
          return prop in _evCfg ? _evCfg[prop] : (prop in _ev ? _ev[prop] : (
            ['bubbles', 'cancelable', 'composed'].indexOf(prop) > -1 ? false : undefined
          ));
        }
      };
      return obj;
    }, {}));
  };
  Object.defineProperties(EventPolyfill.prototype, {
    NONE: {writable: false, value: 0},
    CAPTURING_PHASE: {writable: false, value: 1},
    AT_TARGET: {writable: false, value: 2},
    BUBBLING_PHASE: {writable: false, value: 3}
  });
  EventPolyfill.prototype.preventDefault = function () {
    var _ev = ev.get(this);
    var _evCfg = evCfg.get(this);
    if (this.cancelable && !_evCfg._passive) {
      _evCfg.defaultPrevented = true;
      if (typeof _ev.preventDefault === 'function') { // Prevent any predefined defaults
        _ev.preventDefault();
      }
    };
  };
  EventPolyfill.prototype.stopImmediatePropagation = function () {
    var _evCfg = evCfg.get(this);
    _evCfg._stopImmediatePropagation = true;
  };
  EventPolyfill.prototype.stopPropagation = function () {
    var _evCfg = evCfg.get(this);
    _evCfg._stopPropagation = true;
  };
  EventPolyfill.prototype.toString = function () {
    return '[object Event]';
  };

  var CustomEventPolyfill = function (type, eventInitDict, _ev) {
    EventPolyfill.call(this, type, eventInitDict, _ev);
    var _evCfg = evCfg.get(this);
    _evCfg.detail = eventInitDict && typeof eventInitDict === 'object' ? eventInitDict.detail : null;
  };
  CustomEventPolyfill.prototype.toString = function () {
    return '[object CustomEvent]';
  };

  function copyEvent (ev) {
    if ('detail' in ev) {
      return new CustomEventPolyfill(ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable, detail: ev.detail}, ev);
    }
    return new EventPolyfill(ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable}, ev);
  }

  function getListenersOptions (listeners, type, options) {
    var listenersByType = listeners[type];
    if (listenersByType === undefined) listeners[type] = listenersByType = [];
    options = typeof options === 'boolean' ? {capture: options} : (options || {});
    var stringifiedOptions = JSON.stringify(options);
    var listenersByTypeOptions = listenersByType.filter(function (obj) {
      return stringifiedOptions === JSON.stringify(obj.options);
    });
    return {listenersByTypeOptions: listenersByTypeOptions, options: options, listenersByType: listenersByType};
  }

  var methods = {
    addListener: function addListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
      options = listenerOptions.options;
      var listenersByType = listenerOptions.listenersByType;

      if (listenersByTypeOptions.some(function (l) {
        return l.listener === listener;
      })) return;
      listenersByType.push({listener: listener, options: options});
    },

    removeListener: function removeListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByType = listenerOptions.listenersByType;
      var stringifiedOptions = JSON.stringify(listenerOptions.options);

      listenersByType.some(function (l, i) {
        if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
          listenersByType.splice(i, 1);
          if (!listenersByType.length) delete listeners[type];
          return true;
        }
      });
    },

    hasListener: function hasListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
      return listenersByTypeOptions.some(function (l) {
        return l.listener === listener;
      });
    }
  };

  function EventTarget (customOptions) {
    this.__setOptions(customOptions);
  }

  Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function (obj, listenerType) {
    ['add', 'remove', 'has'].forEach(function (method) {
      obj[method + listenerType + 'EventListener'] = function (type, listener, options) {
        if (arguments.length < 2) throw new TypeError('2 or more arguments required');
        if (typeof type !== 'string') throw new DOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR'); // eslint-disable-line eqeqeq
        if (listener.handleEvent) { listener = listener.handleEvent.bind(listener); }
        var arrStr = '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
        if (!this[arrStr]) Object.defineProperty(this, arrStr, {value: {}});
        return methods[method + 'Listener'](this[arrStr], listener, type, options);
      };
    });
    return obj;
  }, {}));

  Object.assign(EventTarget.prototype, {
    __setOptions: function (customOptions) {
      customOptions = customOptions || {};
      // Todo: Make into event properties?
      this._defaultSync = customOptions.defaultSync;
      this._extraProperties = customOptions.extraProperties;
    },
    dispatchEvent: function (ev) {
      return this._dispatchEvent(ev, true);
    },
    _dispatchEvent: function (ev, setTarget) {
      var me = this;
      ['early', '', 'late', 'default'].forEach(function (listenerType) {
        var arrStr = '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
        if (!this[arrStr]) Object.defineProperty(this, arrStr, {value: {}});
      }, this);

      var _evCfg = evCfg.get(ev);
      if (_evCfg && setTarget && _evCfg._dispatched) throw new DOMException('The object is in an invalid state.', 'InvalidStateError');

      var eventCopy;
      if (_evCfg) {
        eventCopy = ev;
      } else {
        eventCopy = copyEvent(ev);
        _evCfg = evCfg.get(eventCopy);
        _evCfg._dispatched = true;
        (this._extraProperties || []).forEach(function (prop) {
          if (prop in ev) {
            eventCopy[prop] = ev[prop]; // Todo: Put internal to `EventPolyfill`?
          }
        });
      }
      var type = eventCopy.type;

      function finishEventDispatch () {
        _evCfg.eventPhase = phases.NONE;
        _evCfg.currentTarget = null;
        delete _evCfg._children;
      }
      function invokeDefaults () {
        // Ignore stopPropagation from defaults
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
        if (!eventCopy.defaultPrevented || !_evCfg.cancelable) { // 2nd check should be redundant
          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
          eventCopy.target.invokeCurrentListeners(eventCopy.target._defaultListeners, eventCopy, type);
        }
        finishEventDispatch();
      }
      function continueEventDispatch () {
        // Ignore stop propagation of user now
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        if (!me._defaultSync) {
          setTimeout(invokeDefaults, 0);
        } else invokeDefaults();

        _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke late listeners
        // Sync default might have stopped
        if (!_evCfg._stopPropagation) {
          _evCfg._stopImmediatePropagation = undefined;
          _evCfg._stopPropagation = undefined;
          // We could allow stopPropagation by only executing upon (_evCfg._stopPropagation)
          eventCopy.target.invokeCurrentListeners(eventCopy.target._lateListeners, eventCopy, type);
        }
        finishEventDispatch();

        return !eventCopy.defaultPrevented;
      }

      if (setTarget) _evCfg.target = this;

      switch (eventCopy.eventPhase) {
        default: case phases.NONE:

          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
          this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
          if (!this.__getParent) {
            _evCfg.eventPhase = phases.AT_TARGET;
            return this._dispatchEvent(eventCopy, false);
          }

          var par = this;
          var root = this;
          while (par.__getParent && (par = par.__getParent()) !== null) {
            if (!_evCfg._children) {
              _evCfg._children = [];
            }
            _evCfg._children.push(root);
            root = par;
          }
          root._defaultSync = me._defaultSync;
          _evCfg.eventPhase = phases.CAPTURING_PHASE;
          return root._dispatchEvent(eventCopy, false);
        case phases.CAPTURING_PHASE:
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          this.invokeCurrentListeners(this._listeners, eventCopy, type);
          var child = _evCfg._children && _evCfg._children.length && _evCfg._children.pop();
          if (!child || child === eventCopy.target) {
            _evCfg.eventPhase = phases.AT_TARGET;
          }
          if (child) child._defaultSync = me._defaultSync;
          return (child || this)._dispatchEvent(eventCopy, false);
        case phases.AT_TARGET:
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          this.invokeCurrentListeners(this._listeners, eventCopy, type, true);
          if (!_evCfg.bubbles) {
            return continueEventDispatch();
          }
          _evCfg.eventPhase = phases.BUBBLING_PHASE;
          return this._dispatchEvent(eventCopy, false);
        case phases.BUBBLING_PHASE:
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          var parent = this.__getParent && this.__getParent();
          if (!parent) {
            return continueEventDispatch();
          }
          parent.invokeCurrentListeners(parent._listeners, eventCopy, type, true);
          parent._defaultSync = me._defaultSync;
          return parent._dispatchEvent(eventCopy, false);
      }
    },
    invokeCurrentListeners: function (listeners, eventCopy, type, checkOnListeners) {
      var _evCfg = evCfg.get(eventCopy);
      var me = this;
      _evCfg.currentTarget = this;

      var listOpts = getListenersOptions(listeners, type, {});
      var listenersByType = listOpts.listenersByType.concat();
      var dummyIPos = listenersByType.length ? 1 : 0;

      listenersByType.some(function (listenerObj, i) {
        var onListener = checkOnListeners ? me['on' + type] : null;
        if (_evCfg._stopImmediatePropagation) return true;
        if (i === dummyIPos && typeof onListener === 'function') {
          // We don't splice this in as could be overwritten; executes here per
          //  https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
          this.tryCatch(function () {
            var ret = onListener.call(eventCopy.currentTarget, eventCopy);
            if (ret === false) {
              eventCopy.preventDefault();
            }
          });
        }
        var options = listenerObj.options;
        var once = options.once; // Remove listener after invoking once
        var passive = options.passive; // Don't allow `preventDefault`
        var capture = options.capture; // Use `_children` and set `eventPhase`
        _evCfg._passive = passive;

        if ((capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE) ||
          (eventCopy.eventPhase === phases.AT_TARGET ||
          (!capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE))
        ) {
          var listener = listenerObj.listener;
          this.tryCatch(function () {
            listener.call(eventCopy.currentTarget, eventCopy);
          });
          if (once) {
            this.removeEventListener(type, listener, options);
          }
        }
      }, this);
      this.tryCatch(function () {
        var onListener = checkOnListeners ? me['on' + type] : null;
        if (typeof onListener === 'function' && listenersByType.length < 2) {
          var ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
          if (ret === false) {
            eventCopy.preventDefault();
          }
        }
      });

      return !eventCopy.defaultPrevented;
    },
    tryCatch: function (cb) {
      try {
        // Per MDN: Exceptions thrown by event handlers are reported
        //  as uncaught exceptions; the event handlers run on a nested
        //  callstack: they block the caller until they complete, but
        //  exceptions do not propagate to the caller.
        cb();
      } catch (err) {
        this.triggerErrorEvent(err);
      }
    },
    triggerErrorEvent: function (err) {
      var error = err;
      if (typeof err === 'string') {
        error = new Error('Uncaught exception: ' + err);
      } else {
        error.message = 'Uncaught exception: ' + err.message;
      }

      var triggerGlobalErrorEvent;
      if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || (
          window && typeof window === 'object' && !window.dispatchEvent)
      ) {
        triggerGlobalErrorEvent = function () {
          setTimeout(function () { // Node won't be able to catch in this way if we throw in the main thread
            // console.log(err); // Should we auto-log for user?
            throw error; // Let user listen to `process.on('uncaughtException', function(err) {});`
          });
        };
      } else {
        triggerGlobalErrorEvent = function () {
          // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
          //   and https://github.com/w3c/IndexedDB/issues/49

          // Note that a regular Event will properly trigger
          //   `window.addEventListener('error')` handlers, but it will not trigger
          //   `window.onerror` as per https://html.spec.whatwg.org/multipage/webappapis.html#handler-onerror
          // Note also that the following line won't handle `window.addEventListener` handlers
          //    if (window.onerror) window.onerror(error.message, err.fileName, err.lineNumber, error.columnNumber, error);

          // `ErrorEvent` properly triggers `window.onerror` and `window.addEventListener('error')` handlers
          var ev = new ErrorEvent('error', {
            error: err,
            message: error.message || '',
            // We can't get the actually useful user's values!
            filename: error.fileName || '',
            lineno: error.lineNumber || 0,
            colno: error.columnNumber || 0
          });
          window.dispatchEvent(ev);
          // console.log(err); // Should we auto-log for user?
        };
      }
      if (this.__userErrorEventHandler) {
        this.__userErrorEventHandler(error, triggerGlobalErrorEvent);
      } else {
        triggerGlobalErrorEvent();
      }
    }
  });

  // Todo: Move to own library (but allowing WeakMaps to be passed in for sharing here)
  EventTarget.EventPolyfill = EventPolyfill;
  EventTarget.CustomEventPolyfill = CustomEventPolyfill;
  EventTarget.DOMException = DOMException;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventTarget;
  } else {
    window.EventTarget = EventTarget;
  }
}());
});

var EventTarget$1 = interopDefault(EventTarget);

var map = {};
var CFG = {};

/**
 * Creates a native DOMException, for browsers that support it
 * @returns {DOMException}
 */
function createNativeDOMException(name, message) {
    return new DOMException.prototype.constructor(message, name || 'DOMException');
}

/**
 * Creates a generic Error object
 * @returns {Error}
 */
function createError(name, message) {
    var e = new Error(message); // DOMException uses the same `toString` as `Error`, so no need to add
    e.name = name || 'DOMException';
    e.message = message;
    return e;
}

/**
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|Error|null} error
 */
function logError(name, message, error) {
    if (CFG.DEBUG) {
        if (error && error.message) {
            error = error.message;
        }

        var method = typeof console.error === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (error || ''));
        console.trace && console.trace();
    }
};

function isErrorOrDOMErrorOrDOMException(obj) {
    return isObj(obj) && typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second argument.
 * @param {array} args
 * @returns {Error|DOMException|undefined}
 */
function findError(args) {
    var err = void 0;
    if (args) {
        if (args.length === 1) {
            return args[0];
        }
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (isErrorOrDOMErrorOrDOMException(arg)) {
                return arg;
            } else if (arg && typeof arg.message === 'string') {
                err = arg;
            }
        }
    }
    return err;
};

var test$5 = void 0;
var useNativeDOMException = false;
// Test whether we can use the browser's native DOMException class
try {
    test$5 = createNativeDOMException('test name', 'test message');
    if (isErrorOrDOMErrorOrDOMException(test$5) && test$5.name === 'test name' && test$5.message === 'test message') {
        // Native DOMException works as expected
        useNativeDOMException = true;
    }
} catch (e) {}

var createDOMException = void 0;
var DOMException$1 = void 0;
if (useNativeDOMException) {
    DOMException$1 = DOMException;
    createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createNativeDOMException(name, message);
    };
} else {
    DOMException$1 = Error;
    createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var cleanInterface = false;

var testObject = { test: true };
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
    try {
        Object.defineProperty(testObject, 'test', { enumerable: false });
        if (testObject.test) {
            cleanInterface = true;
        }
    } catch (e) {
        // Object.defineProperty does not work as intended.
    }
}

/**
 * Shim the DOMStringList object.
 *
 */
var StringList = function StringList() {
    this.length = 0;
    this._items = [];
    // Internal functions on the prototype have been made non-enumerable below.
    if (cleanInterface) {
        Object.defineProperties(this, {
            '_items': {
                enumerable: false
            },
            'length': {
                enumerable: false
            }
        });
    }
};
StringList.prototype = {
    // Interface.
    contains: function contains(str) {
        return this._items.includes(str);
    },
    item: function item(key) {
        return this._items[key];
    },

    // Helpers. Should only be used internally.
    addIndexes: function addIndexes() {
        for (var i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    },
    sortList: function sortList() {
        // http://w3c.github.io/IndexedDB/#sorted-list
        // https://tc39.github.io/ecma262/#sec-abstract-relational-comparison
        this._items.sort();
        this.addIndexes();
        return this._items;
    },
    forEach: function forEach(cb, thisArg) {
        this._items.forEach(cb, thisArg);
    },
    map: function map(cb, thisArg) {
        return this._items.map(cb, thisArg);
    },
    indexOf: function indexOf(str) {
        return this._items.indexOf(str);
    },
    push: function push(item) {
        this._items.push(item);
        this.length++;
        this.sortList();
    },
    splice: function splice() /* index, howmany, item1, ..., itemX */{
        var _items;

        (_items = this._items).splice.apply(_items, arguments);
        this.length = this._items.length;
        for (var i in this) {
            if (i === String(parseInt(i, 10))) {
                delete this[i];
            }
        }
        this.sortList();
    }
};
if (cleanInterface) {
    for (var i in {
        'addIndexes': false,
        'sortList': false,
        'forEach': false,
        'map': false,
        'indexOf': false,
        'push': false,
        'splice': false
    }) {
        Object.defineProperty(StringList.prototype, i, {
            enumerable: false
        });
    }
}

function escapeNULAndCasing(arg) {
    // http://stackoverflow.com/a/6701665/271577
    return arg.replace(/\^/g, '^^').replace(/\x00/g, '^0') // eslint-disable-line no-control-regex
    // We need to avoid tables being treated as duplicates based on SQLite's case-insensitive table and column names
    // http://stackoverflow.com/a/17215009/271577
    // See also https://www.sqlite.org/faq.html#q18 re: Unicode case-insensitive not working
    .replace(/([A-Z])/g, '^$1');
}

function sqlEscape(arg) {
    // https://www.sqlite.org/lang_keywords.html
    // http://stackoverflow.com/a/6701665/271577
    // There is no need to escape ', `, or [], as
    //   we should always be within double quotes
    // NUL should have already been stripped
    return arg.replace(/"/g, '""');
}

function quote(arg) {
    return '"' + sqlEscape(arg) + '"';
}

function escapeDatabaseName(db) {
    return 'D_' + escapeNULAndCasing(db); // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

function escapeStore(store) {
    return quote('s_' + escapeNULAndCasing(store));
}

function escapeIndex(index) {
    return quote('_' + escapeNULAndCasing(index));
}

function escapeIndexName(index) {
    return '_' + escapeNULAndCasing(index);
}

function sqlLIKEEscape(str) {
    // https://www.sqlite.org/lang_expr.html#like
    return sqlEscape(str).replace(/\^/g, '^^');
}

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
function instanceOf(obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

function isObj(obj) {
    return obj && (typeof obj === 'undefined' ? 'undefined' : _typeof$1(obj)) === 'object';
}

function isDate(obj) {
    return isObj(obj) && typeof obj.getDate === 'function';
}

function isBlob(obj) {
    return isObj(obj) && typeof obj.size === 'number' && typeof obj.slice === 'function';
}

function isRegExp(obj) {
    return isObj(obj) && typeof obj.flags === 'string' && typeof obj.exec === 'function';
}

function isFile(obj) {
    return isObj(obj) && typeof obj.name === 'string' && isBlob(obj);
}

/*
// Todo: Uncomment and use with ArrayBuffer encoding/decoding when ready
function isArrayBufferOrView (obj) {
    return isObj(obj) && typeof obj.byteLength === 'number' && (
        typeof obj.slice === 'function' || // `TypedArray` (view on buffer) or `ArrayBuffer`
        typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
    );
}
*/

function isNotClonable(value) {
    return ['function', 'symbol'].includes(typeof value === 'undefined' ? 'undefined' : _typeof$1(value)) || isObj(value) && (value instanceof Error || // Duck-typing with some util.isError would be better, but too easy to get a false match
    value.nodeType > 0 && typeof value.nodeName === 'string' // DOM nodes
    );
}

function throwIfNotClonable(value, errMsg) {
    JSON.stringify(value, function (key, val) {
        if (isNotClonable(val)) {
            throw createDOMException('DataCloneError', errMsg);
        }
        return val;
    });
}

function defineReadonlyProperties(obj, props) {
    props = typeof props === 'string' ? [props] : props;
    props.forEach(function (prop) {
        Object.defineProperty(obj, '__' + prop, {
            enumerable: false,
            configurable: false,
            writable: true
        });
        Object.defineProperty(obj, prop, {
            enumerable: true,
            configurable: true,
            get: function get() {
                return this['__' + prop];
            }
        });
    });
}

var HexDigit = '[0-9a-fA-F]';
// The commented out line below is technically the grammar, with a SyntaxError
//   to occur if larger than U+10FFFF, but we will prevent the error by
//   establishing the limit in regular expressions
// const HexDigits = HexDigit + HexDigit + '*';
var HexDigits = '0*(?:' + HexDigit + '{1,5}|10' + HexDigit + '{4})*';
var UnicodeEscapeSequence = '(?:u' + HexDigit + '{4}|u{' + HexDigits + '})';

function isIdentifier(item) {
    // For load-time and run-time performance, we don't provide the complete regular
    //   expression for identifiers, but these can be passed in, using the expressions
    //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
    // ID_Start (includes Other_ID_Start)
    var UnicodeIDStart = CFG.UnicodeIDStart || '[$A-Z_a-z]';
    // ID_Continue (includes Other_ID_Continue)
    var UnicodeIDContinue = CFG.UnicodeIDContinue || '[$0-9A-Z_a-z]';
    var IdentifierStart = '(?:' + UnicodeIDStart + '|[$_]|\\\\' + UnicodeEscapeSequence + ')';
    var IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_]|\\\\' + UnicodeEscapeSequence + '|\\u200C|\\u200D)';
    return new RegExp('^' + IdentifierStart + IdentifierPart + '*$').test(item);
}

function isValidKeyPathString(keyPathString) {
    return typeof keyPathString === 'string' && (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every(isIdentifier));
}

function isValidKeyPath(keyPath) {
    return isValidKeyPathString(keyPath) || Array.isArray(keyPath) && keyPath.length &&
    // Convert array from sparse to dense http://www.2ality.com/2012/06/dense-arrays.html
    Array.apply(null, keyPath).every(function (kpp) {
        // If W3C tests are accurate, it appears sequence<DOMString> implies `toString()`
        // See also https://heycam.github.io/webidl/#idl-DOMString
        return isValidKeyPathString(kpp.toString());
    });
}

var ShimEvent = EventTarget$1.EventPolyfill;

function createEvent(type, debug, evInit) {
    var ev = new ShimEvent(type, evInit);
    ev.debug = debug;
    return ev;
}

// Babel apparently having a problem adding `hasInstance` to a class, so we are redefining as a function
function IDBVersionChangeEvent(type, eventInitDict) {
    // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
    ShimEvent.call(this, type);
    Object.defineProperty(this, 'oldVersion', {
        enumerable: true,
        configurable: true,
        get: function get() {
            return eventInitDict.oldVersion;
        }
    });
    Object.defineProperty(this, 'newVersion', {
        enumerable: true,
        configurable: true,
        get: function get() {
            return eventInitDict.newVersion;
        }
    });
}
IDBVersionChangeEvent.prototype = new ShimEvent('bogus');
IDBVersionChangeEvent.prototype.constructor = IDBVersionChangeEvent;
IDBVersionChangeEvent.prototype.toString = function () {
    return '[object IDBVersionChangeEvent]';
};

Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
    value: function value(obj) {
        return isObj(obj) && 'oldVersion' in obj && typeof obj.defaultPrevented === 'boolean';
    }
});

// We don't add to polyfill as this might not be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
    value: function value(obj) {
        return isObj(obj) && 'target' in obj && typeof obj.bubbles === 'boolean';
    }
});

var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */

var IDBRequest = function () {
    function IDBRequest() {
        _classCallCheck$1(this, IDBRequest);

        this.onsuccess = this.onerror = null;
        this.__result = undefined;
        this.__error = this.__source = this.__transaction = null;
        this.__readyState = 'pending';
        this.__setOptions({ extraProperties: ['debug'] }); // Ensure EventTarget preserves our properties
    }

    _createClass$1(IDBRequest, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBRequest]';
        }
    }, {
        key: '__getParent',
        value: function __getParent() {
            if (this.toString() === '[object IDBOpenDBRequest]') {
                return null;
            }
            return this.__transaction;
        }
    }]);

    return IDBRequest;
}();

defineReadonlyProperties(IDBRequest.prototype, ['source', 'transaction', 'readyState']);

['result', 'error'].forEach(function (prop) {
    var obj = IDBRequest.prototype;
    Object.defineProperty(obj, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
    });
    Object.defineProperty(obj, prop, {
        enumerable: true,
        configurable: true,
        get: function get() {
            if (this.__readyState !== 'done') {
                throw createDOMException('InvalidStateError', 'The request is still pending.');
            }
            return this['__' + prop];
        }
    });
});

Object.assign(IDBRequest.prototype, EventTarget$1.prototype);

/**
 * The IDBOpenDBRequest called when a database is opened
 */

var IDBOpenDBRequest = function (_IDBRequest) {
    _inherits$1(IDBOpenDBRequest, _IDBRequest);

    function IDBOpenDBRequest() {
        _classCallCheck$1(this, IDBOpenDBRequest);

        var _this = _possibleConstructorReturn$1(this, (IDBOpenDBRequest.__proto__ || Object.getPrototypeOf(IDBOpenDBRequest)).call(this));

        _this.__setOptions({ extraProperties: ['oldVersion', 'newVersion', 'debug'] }); // Ensure EventTarget preserves our properties
        _this.onblocked = _this.onupgradeneeded = null;
        return _this;
    }

    _createClass$1(IDBOpenDBRequest, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBOpenDBRequest]';
        }
    }]);

    return IDBOpenDBRequest;
}(IDBRequest);

var _typeof$3 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Key = {};

/**
 * Encodes the keys based on their types. This is required to maintain collations
 */
var collations = ['undefined', 'number', 'date', 'string', 'array'];

/**
 * The sign values for numbers, ordered from least to greatest.
 *  - "negativeInfinity": Sorts below all other values.
 *  - "bigNegative": Negative values less than or equal to negative one.
 *  - "smallNegative": Negative values between negative one and zero, noninclusive.
 *  - "smallPositive": Positive values between zero and one, including zero but not one.
 *  - "largePositive": Positive values greater than or equal to one.
 *  - "positiveInfinity": Sorts above all other values.
 */
var signValues = ['negativeInfinity', 'bigNegative', 'smallNegative', 'smallPositive', 'bigPositive', 'positiveInfinity'];

// Todo: Support `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
var types = {
    // Undefined is not a valid key type.  It's only used when there is no key.
    undefined: {
        encode: function encode(key) {
            return collations.indexOf('undefined') + '-';
        },
        decode: function decode(key) {
            return undefined;
        }
    },

    // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
    // notation.
    //
    // sign: takes a value between zero and five, inclusive. Represents infinite cases
    //     and the signs of both the exponent and the fractional part of the number.
    // exponent: paded to two base-32 digits, represented by the 32's compliment in the
    //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
    // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
    //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
    //     cases to ensure proper lexical sorting.
    number: {
        // The encode step checks for six numeric cases and generates 14-digit encoded
        // sign-exponent-mantissa strings.
        encode: function encode(key) {
            var key32 = Math.abs(key).toString(32);
            // Get the index of the decimal.
            var decimalIndex = key32.indexOf('.');
            // Remove the decimal.
            key32 = decimalIndex !== -1 ? key32.replace('.', '') : key32;
            // Get the index of the first significant digit.
            var significantDigitIndex = key32.search(/[^0]/);
            // Truncate leading zeros.
            key32 = key32.slice(significantDigitIndex);
            var sign = void 0,
                exponent = zeros(2),
                mantissa = zeros(11);

            // Finite cases:
            if (isFinite(key)) {
                // Negative cases:
                if (key < 0) {
                    // Negative exponent case:
                    if (key > -1) {
                        sign = signValues.indexOf('smallNegative');
                        exponent = padBase32Exponent(significantDigitIndex);
                        mantissa = flipBase32(padBase32Mantissa(key32));
                        // Non-negative exponent case:
                    } else {
                        sign = signValues.indexOf('bigNegative');
                        exponent = flipBase32(padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length));
                        mantissa = flipBase32(padBase32Mantissa(key32));
                    }
                    // Non-negative cases:
                } else {
                    // Negative exponent case:
                    if (key < 1) {
                        sign = signValues.indexOf('smallPositive');
                        exponent = flipBase32(padBase32Exponent(significantDigitIndex));
                        mantissa = padBase32Mantissa(key32);
                        // Non-negative exponent case:
                    } else {
                        sign = signValues.indexOf('bigPositive');
                        exponent = padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length);
                        mantissa = padBase32Mantissa(key32);
                    }
                }
                // Infinite cases:
            } else {
                sign = signValues.indexOf(key > 0 ? 'positiveInfinity' : 'negativeInfinity');
            }

            return collations.indexOf('number') + '-' + sign + exponent + mantissa;
        },
        // The decode step must interpret the sign, reflip values encoded as the 32's complements,
        // apply signs to the exponent and mantissa, do the base-32 power operation, and return
        // the original JavaScript number values.
        decode: function decode(key) {
            var sign = +key.substr(2, 1);
            var exponent = key.substr(3, 2);
            var mantissa = key.substr(5, 11);

            switch (signValues[sign]) {
                case 'negativeInfinity':
                    return -Infinity;
                case 'positiveInfinity':
                    return Infinity;
                case 'bigPositive':
                    return pow32(mantissa, exponent);
                case 'smallPositive':
                    exponent = negate(flipBase32(exponent));
                    return pow32(mantissa, exponent);
                case 'smallNegative':
                    exponent = negate(exponent);
                    mantissa = flipBase32(mantissa);
                    return -pow32(mantissa, exponent);
                case 'bigNegative':
                    exponent = flipBase32(exponent);
                    mantissa = flipBase32(mantissa);
                    return -pow32(mantissa, exponent);
                default:
                    throw new Error('Invalid number.');
            }
        }
    },

    // Strings are encoded as JSON strings (with quotes and unicode characters escaped).
    //
    // IF the strings are in an array, then some extra encoding is done to make sorting work correctly:
    // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
    // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
    // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
    // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
    // the indexes of each string's characters line up with each other.
    string: {
        encode: function encode(key, inArray) {
            if (inArray) {
                // prepend each character with a dash, and append a space to the end
                key = key.replace(/(.)/g, '-$1') + ' ';
            }
            return collations.indexOf('string') + '-' + key;
        },
        decode: function decode(key, inArray) {
            key = key.slice(2);
            if (inArray) {
                // remove the space at the end, and the dash before each character
                key = key.substr(0, key.length - 1).replace(/-(.)/g, '$1');
            }
            return key;
        }
    },

    // Arrays are encoded as JSON strings.
    // An extra, value is added to each array during encoding to make empty arrays sort correctly.
    array: {
        encode: function encode(key) {
            var encoded = [];
            for (var i = 0; i < key.length; i++) {
                var item = key[i];
                var encodedItem = _encode(item, true); // encode the array item
                encoded[i] = encodedItem;
            }
            encoded.push(collations.indexOf('undefined') + '-'); // append an extra item, so empty arrays sort correctly
            return collations.indexOf('array') + '-' + JSON.stringify(encoded);
        },
        decode: function decode(key) {
            var decoded = JSON.parse(key.slice(2));
            decoded.pop(); // remove the extra item
            for (var i = 0; i < decoded.length; i++) {
                var item = decoded[i];
                var decodedItem = _decode(item, true); // decode the item
                decoded[i] = decodedItem;
            }
            return decoded;
        }
    },

    // Dates are encoded as ISO 8601 strings, in UTC time zone.
    date: {
        encode: function encode(key) {
            return collations.indexOf('date') + '-' + key.toJSON();
        },
        decode: function decode(key) {
            return new Date(key.slice(2));
        }
    }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number}
 * @return {string}
 */
function padBase32Exponent(n) {
    n = n.toString(32);
    return n.length === 1 ? '0' + n : n;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string}
 * @return {string}
 */
function padBase32Mantissa(s) {
    return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 */
function flipBase32(encoded) {
    var flipped = '';
    for (var i = 0; i < encoded.length; i++) {
        flipped += (31 - parseInt(encoded[i], 32)).toString(32);
    }
    return flipped;
}

/**
 * Base-32 power function.
 * RESEARCH: This function does not precisely decode floats because it performs
 * floating point arithmetic to recover values. But can the original values be
 * recovered exactly?
 * Someone may have already figured out a good way to store JavaScript floats as
 * binary strings and convert back. Barring a better method, however, one route
 * may be to generate decimal strings that `parseFloat` decodes predictably.
 * @param {string}
 * @param {string}
 * @return {number}
 */
function pow32(mantissa, exponent) {
    exponent = parseInt(exponent, 32);
    if (exponent < 0) {
        return roundToPrecision(parseInt(mantissa, 32) * Math.pow(32, exponent - 10));
    } else {
        if (exponent < 11) {
            var whole = mantissa.slice(0, exponent);
            whole = parseInt(whole, 32);
            var fraction = mantissa.slice(exponent);
            fraction = parseInt(fraction, 32) * Math.pow(32, exponent - 11);
            return roundToPrecision(whole + fraction);
        } else {
            var expansion = mantissa + zeros(exponent - 11);
            return parseInt(expansion, 32);
        }
    }
}

/**
 *
 */
function roundToPrecision(num, precision) {
    precision = precision || 16;
    return parseFloat(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number}
 * @return {string}
 */
function zeros(n) {
    var result = '';
    while (n--) {
        result = result + '0';
    }
    return result;
}

/**
 * Negates numeric strings.
 * @param {string}
 * @return {string}
 */
function negate(s) {
    return '-' + s;
}

/**
 * Returns the string "number", "date", "string", or "array".
 */
function getType(key) {
    if (Array.isArray(key)) return 'array';
    if (isDate(key)) return 'date';
    // if (util.isArrayBufferOrView(key)) return 'ArrayBuffer'; // Todo: Uncomment when supported
    return typeof key === 'undefined' ? 'undefined' : _typeof$3(key);
}

/**
 * Keys must be strings, numbers (besides NaN), Dates (if value is not NaN),
 *   Arrays (or, once supported, ArrayBuffer) objects
 */
function convertValueToKey(key, arrayRefs, multiEntry) {
    var type = getType(key);
    switch (type) {
        case 'ArrayBuffer':
            // Copy bytes once implemented (not a possible type yet)
            return key;
        case 'array':
            arrayRefs = arrayRefs || [];
            arrayRefs.push(key);
            var newKeys = [];
            for (var i = 0; i < key.length; i++) {
                // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
                var item = key[i];
                if (arrayRefs.includes(item)) throw createDOMException('DataError', 'An array key cannot be circular');
                var newKey = void 0;
                try {
                    newKey = convertValueToKey(item, arrayRefs);
                } catch (err) {
                    if (!multiEntry) {
                        throw err;
                    }
                }
                if (!multiEntry || !newKeys.includes(newKey)) {
                    newKeys.push(newKey);
                }
            }
            return newKeys;
        case 'date':
            if (!Number.isNaN(key.getTime())) {
                return new Date(key.getTime());
            }
        // Falls through
        default:
            // allow for strings, numbers instead of first part of this check:
            // Other `typeof` types which are not valid keys:
            //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function'
            if (!['string', 'number'].includes(type) || Number.isNaN(key)) {
                throw createDOMException('DataError', 'Not a valid key');
            }
            return key;
    }
}

function convertValueToKeyMultiEntry(key) {
    return convertValueToKey(key, null, true);
}

function extractKeyFromValueUsingKeyPath(value, keyPath, multiEntry) {
    var key = evaluateKeyPathOnValue(value, keyPath, multiEntry);
    if (!multiEntry) {
        return convertValueToKey(key);
    }
    return convertValueToKeyMultiEntry(key);
}

/**
 * Returns the value of an inline key based on a key path
 * @param {object} source
 * @param {string|array} keyPath
 */
function evaluateKeyPathOnValue(value, keyPath, multiEntry) {
    if (Array.isArray(keyPath)) {
        var _ret = function () {
            var arrayValue = [];
            return {
                v: keyPath.some(function (kpPart) {
                    // If W3C tests are accurate, it appears sequence<DOMString> implies `toString()`
                    // See also https://heycam.github.io/webidl/#idl-DOMString
                    // and http://stackoverflow.com/questions/38164752/should-a-call-to-db-close-within-upgradeneeded-inevitably-prevent-onsuccess
                    kpPart = isObj(kpPart) ? kpPart.toString() : kpPart;
                    var key = extractKeyFromValueUsingKeyPath(value, kpPart, multiEntry);
                    try {
                        key = convertValueToKey(key);
                    } catch (err) {
                        return true;
                    }
                    arrayValue.push(key);
                }, []) ? undefined : arrayValue
            };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof$3(_ret)) === "object") return _ret.v;
    }
    if (keyPath === '') {
        return value;
    }
    var identifiers = keyPath.split('.');
    identifiers.some(function (idntfr, i) {
        if (idntfr === 'length' && typeof value === 'string' && i === identifiers.length - 1) {
            value = value.length;
            return true;
        }
        if (!isObj(value)) {
            value = undefined;
            return true;
        }
        value = value[idntfr];
        return value === undefined;
    });
    return value;
}

/**
 * Sets the inline key value
 * @param {object} source
 * @param {string} keyPath
 * @param {*} value
 */
function setValue(source, keyPath, value) {
    var props = keyPath.split('.');
    for (var i = 0; i < props.length - 1; i++) {
        var prop = props[i];
        source = source[prop] = source[prop] || {};
    }
    source[props[props.length - 1]] = value;
}

/**
 * Determines whether an index entry matches a multi-entry key value.
 * @param {string} encodedEntry     The entry value (already encoded)
 * @param {string} encodedKey       The full index key (already encoded)
 * @returns {boolean}
 */
function isMultiEntryMatch(encodedEntry, encodedKey) {
    var keyType = collations[encodedKey.substring(0, 1)];

    if (keyType === 'array') {
        return encodedKey.indexOf(encodedEntry) > 1;
    } else {
        return encodedKey === encodedEntry;
    }
}

function isKeyInRange(key, range, checkCached) {
    var lowerMatch = range.lower === undefined;
    var upperMatch = range.upper === undefined;
    var encodedKey = _encode(key, true);
    var lower = checkCached ? range.__lowerCached : _encode(range.lower, true);
    var upper = checkCached ? range.__upperCached : _encode(range.upper, true);

    if (range.lower !== undefined) {
        if (range.lowerOpen && encodedKey > lower) {
            lowerMatch = true;
        }
        if (!range.lowerOpen && encodedKey >= lower) {
            lowerMatch = true;
        }
    }
    if (range.upper !== undefined) {
        if (range.upperOpen && encodedKey < upper) {
            upperMatch = true;
        }
        if (!range.upperOpen && encodedKey <= upper) {
            upperMatch = true;
        }
    }

    return lowerMatch && upperMatch;
}

function findMultiEntryMatches(keyEntry, range) {
    var matches = [];

    if (Array.isArray(keyEntry)) {
        for (var i = 0; i < keyEntry.length; i++) {
            var key = keyEntry[i];

            if (Array.isArray(key)) {
                if (range.lower === range.upper) {
                    continue;
                }
                if (key.length === 1) {
                    key = key[0];
                } else {
                    var nested = findMultiEntryMatches(key, range);
                    if (nested.length > 0) {
                        matches.push(key);
                    }
                    continue;
                }
            }

            if (isKeyInRange(key, range, true)) {
                matches.push(key);
            }
        }
    } else {
        if (isKeyInRange(keyEntry, range, true)) {
            matches.push(keyEntry);
        }
    }
    return matches;
}

function _encode(key, inArray) {
    // Bad keys like `null`, `object`, `boolean`, 'function', 'symbol' should not be passed here due to prior validation
    if (key === undefined) {
        return null;
    }
    // Currently has array, date, number, string
    return types[getType(key)].encode(key, inArray);
}
function _decode(key, inArray) {
    if (typeof key !== 'string') {
        return undefined;
    }
    return types[collations[key.substring(0, 1)]].decode(key, inArray);
}

Key = { encode: _encode, decode: _decode, convertValueToKey: convertValueToKey, convertValueToKeyMultiEntry: convertValueToKeyMultiEntry, extractKeyFromValueUsingKeyPath: extractKeyFromValueUsingKeyPath, evaluateKeyPathOnValue: evaluateKeyPathOnValue, setValue: setValue, isMultiEntryMatch: isMultiEntryMatch, isKeyInRange: isKeyInRange, findMultiEntryMatches: findMultiEntryMatches };

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange(lower, upper, lowerOpen, upperOpen) {
    if (lower === undefined && upper === undefined) {
        throw new TypeError('Both arguments to the key range method cannot be undefined');
    }
    if (lower !== undefined) {
        Key.convertValueToKey(lower);
    }
    if (upper !== undefined) {
        Key.convertValueToKey(upper);
    }
    if (lower !== undefined && upper !== undefined && lower !== upper) {
        if (Key.encode(lower) > Key.encode(upper)) {
            throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
        }
    }

    this.__lower = lower;
    this.__upper = upper;
    this.__lowerOpen = !!lowerOpen;
    this.__upperOpen = !!upperOpen;
}
IDBKeyRange.prototype.includes = function (key) {
    Key.convertValueToKey(key);
    return Key.isKeyInRange(key, this);
};

IDBKeyRange.only = function (value) {
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    return new IDBKeyRange(value, undefined, open, true);
};
IDBKeyRange.upperBound = function (value, open) {
    return new IDBKeyRange(undefined, value, true, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};
IDBKeyRange.prototype.toString = function () {
    return '[object IDBKeyRange]';
};

defineReadonlyProperties(IDBKeyRange.prototype, ['lower', 'upper', 'lowerOpen', 'upperOpen']);

Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: function value(obj) {
        return isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean';
    }
});

function setSQLForRange(range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
    if (range && (range.lower !== undefined || range.upper !== undefined)) {
        if (addAnd) sql.push('AND');
        if (range.lower !== undefined) {
            sql.push(quotedKeyColumnName, range.lowerOpen ? '>' : '>=', '?');
            sqlValues.push(checkCached ? range.__lowerCached : Key.encode(range.lower));
        }
        range.lower !== undefined && range.upper !== undefined && sql.push('AND');
        if (range.upper !== undefined) {
            sql.push(quotedKeyColumnName, range.upperOpen ? '<' : '<=', '?');
            sqlValues.push(checkCached ? range.__upperCached : Key.encode(range.upper));
        }
    }
}

var nodeAtob = createCommonjsModule(function (module) {
"use strict";

function atob(str) {
  return new Buffer(str, 'base64').toString('binary');
}

module.exports = atob.atob = atob;
});

var atob = interopDefault(nodeAtob);

var b64 = createCommonjsModule(function (module, exports) {
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}
});

var b64$1 = interopDefault(b64);
var fromByteArray = b64.fromByteArray;
var toByteArray = b64.toByteArray;

var require$$1$2 = Object.freeze({
  default: b64$1,
  fromByteArray: fromByteArray,
  toByteArray: toByteArray
});

var index$12 = createCommonjsModule(function (module, exports) {
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}
});

var index$13 = interopDefault(index$12);
var write = index$12.write;
var read = index$12.read;

var require$$0$6 = Object.freeze({
  default: index$13,
  write: write,
  read: read
});

var index$10 = createCommonjsModule(function (module, exports) {
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = interopDefault(require$$1$2)
var ieee754 = interopDefault(require$$0$6)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT) {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.')
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}
});

var index$11 = interopDefault(index$10);
var kMaxLength = index$10.kMaxLength;
var INSPECT_MAX_BYTES = index$10.INSPECT_MAX_BYTES;
var SlowBuffer = index$10.SlowBuffer;
var Buffer$1 = index$10.Buffer;

var require$$0$5 = Object.freeze({
  default: index$11,
  kMaxLength: kMaxLength,
  INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
  SlowBuffer: SlowBuffer,
  Buffer: Buffer$1
});

var index$9 = createCommonjsModule(function (module) {
module.exports = Blob

var Buffer = interopDefault(require$$0$5).Buffer
  , str = {}.toString.call.bind({}.toString)

function Blob(parts, properties) {
  properties = properties || {}
  this.type = properties.type || ''
  var size = 0
  for(var i = 0, len = parts.length; i < len; ++i) {
    size += typeof parts[i] === 'string' ? Buffer.byteLength(parts[i]) :
            str(parts[i]).indexOf('ArrayBuffer') > -1 ? parts[i].byteLength :
            parts[i].buffer ? parts[i].buffer.byteLength :
            parts[i].length
  }
  this.size = size
}

var cons = Blob
  , proto = cons.prototype

proto.slice = function(start, end) {
  var b = new Blob([], {type: this.type})
  b.size = (end || this.size) - (start || 0)
  return b
}
});

var Blob = interopDefault(index$9);

var _typeof$6 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-disable no-eval */
// Needed by Node; uses native if available (browser)
/**
 * Implementation of the Structured Cloning Algorithm.  Supports the
 * following object types:
 * - Blob
 * - Boolean
 * - Date object
 * - File object (deserialized as Blob object).
 * - Number object
 * - RegExp object
 * - String object
 * This is accomplished by doing the following:
 * 1) Using the cycle/decycle functions from:
 *    https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 * 2) Serializing/deserializing objects to/from string that don't work with
 *    JSON.stringify and JSON.parse by using object specific logic (eg use
 *    the FileReader API to convert a Blob or File object to a data URL.
 * 3) JSON.stringify and JSON.parse do the final conversion to/from string.
 */
function decycle(object, callback) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert the following object types to string
    // so that they can properly be encoded using JSON.stringify:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Make a deep copy of an object or array, assuring that there is at most
    // one instance of each object or array in the resulting structure. The
    // duplicate references (which might be forming cycles) are replaced with
    // an object of the form
    //      {$ref: PATH}
    // where the PATH is a JSONPath string that locates the first occurance.
    // So,
    //      var a = [];
    //      a[0] = a;
    //      return JSON.stringify(JSON.decycle(a));
    // produces the string '[{"$ref":"$"}]'.

    // JSONPath is used to locate the unique object. $ indicates the top level of
    // the object or array. [NUMBER] or [STRING] indicates a child member or
    // property.

    var objects = []; // Keep a reference to each unique object or array
    var paths = []; // Keep the path to each unique object or array
    var queuedObjects = [];
    var returnCallback = callback;
    var derezObj = void 0; // eslint-disable-line prefer-const

    /**
     * Check the queue to see if all objects have been processed.
     * if they have, call the callback with the converted object.
     */
    function checkForCompletion() {
        if (queuedObjects.length === 0) {
            returnCallback(derezObj);
        }
    }

    /**
     * Convert a blob to a data URL.
     * @param {Blob} blob to convert.
     * @param {String} path of blob in object being encoded.
     */
    function readBlobAsDataURL(blob, path) {
        var reader = new FileReader();
        reader.onloadend = function (loadedEvent) {
            var dataURL = loadedEvent.target.result;
            var blobtype = 'Blob';
            if (isFile(blob)) {
                // blobtype = 'File';
            }
            updateEncodedBlob(dataURL, path, blobtype);
        };
        reader.readAsDataURL(blob);
    }

    /**
     * Async handler to update a blob object to a data URL for encoding.
     * @param {String} dataURL
     * @param {String} path
     * @param {String} blobtype - file if the blob is a file; blob otherwise
     */
    function updateEncodedBlob(dataURL, path, blobtype) {
        var encoded = queuedObjects.indexOf(path);
        path = path.replace('$', 'derezObj');
        eval(path + '.$enc="' + dataURL + '"');
        eval(path + '.$type="' + blobtype + '"');
        queuedObjects.splice(encoded, 1);
        checkForCompletion();
    }

    function derez(value, path) {
        // The derez recurses through the object, producing the deep copy.

        var i = void 0,
            // The loop counter
        name = void 0,
            // Property name
        nu = void 0; // The new object or array

        // typeof null === 'object', so go on if this value is really an object but not
        // one of the weird builtin objects.

        var isObj$$ = isObj(value);
        var valOfType = isObj$$ && _typeof$6(value.valueOf());
        if (isObj$$ && !['boolean', 'number', 'string'].includes(valOfType) && !isDate(value) && !isRegExp(value) && !isBlob(Blob)) {
            // If the value is an object or array, look to see if we have already
            // encountered it. If so, return a $ref/path object. This is a hard way,
            // linear search that will get slower as the number of unique objects grows.

            for (i = 0; i < objects.length; i += 1) {
                if (objects[i] === value) {
                    return { $ref: paths[i] };
                }
            }

            // Otherwise, accumulate the unique value and its path.

            objects.push(value);
            paths.push(path);

            // If it is an array, replicate the array.

            if (Array.isArray(value)) {
                nu = [];
                for (i = 0; i < value.length; i += 1) {
                    nu[i] = derez(value[i], path + '[' + i + ']');
                }
            } else {
                // If it is an object, replicate the object.
                nu = {};
                for (name in value) {
                    if (Object.prototype.hasOwnProperty.call(value, name)) {
                        nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
                    }
                }
            }

            return nu;
        } else if (isBlob(value)) {
            // Queue blob for conversion
            queuedObjects.push(path);
            readBlobAsDataURL(value, path);
        } else if (valOfType === 'boolean') {
            value = {
                '$type': 'Boolean',
                '$enc': value.toString()
            };
        } else if (isDate(value)) {
            value = {
                '$type': 'Date',
                '$enc': value.getTime()
            };
        } else if (valOfType === 'number') {
            value = {
                '$type': 'Number',
                '$enc': value.toString()
            };
        } else if (isRegExp(value)) {
            value = {
                '$type': 'RegExp',
                '$enc': value.toString()
            };
        } else if (typeof value === 'number') {
            value = {
                '$type': 'number',
                '$enc': value + '' // handles NaN, Infinity, Negative Infinity
            };
        } else if (value === undefined) {
            value = {
                '$type': 'undefined'
            };
        }
        return value;
    }
    derezObj = derez(object, '$');
    checkForCompletion();
}

function retrocycle($) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert strings to the following object types
    // so that they can properly be decoded:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Restore an object that was reduced by decycle. Members whose values are
    // objects of the form
    //      {$ref: PATH}
    // are replaced with references to the value found by the PATH. This will
    // restore cycles. The object will be mutated.

    // The eval function is used to locate the values described by a PATH. The
    // root object is kept in a $ variable. A regular expression is used to
    // assure that the PATH is extremely well formed. The regexp contains nested
    // * quantifiers. That has been known to have extremely bad performance
    // problems on some browsers for very long strings. A PATH is expected to be
    // reasonably short. A PATH is allowed to belong to a very restricted subset of
    // Goessner's JSONPath.

    // So,
    //      var s = '[{"$ref":"$"}]';
    //      return JSON.retrocycle(JSON.parse(s));
    // produces an array containing a single element which is the array itself.

    var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"/bfnrt]|u[0-9a-zA-Z]{4}))*")])*$/;

    /**
     * Converts the specified data URL to a Blob object
     * @param {String} dataURL to convert to a Blob
     * @returns {Blob} the converted Blob object
     */
    function dataURLToBlob(dataURL) {
        var BASE64_MARKER = ';base64,';
        var contentType = void 0,
            parts = void 0,
            raw = void 0;
        if (!dataURL.includes(BASE64_MARKER)) {
            parts = dataURL.split(',');
            contentType = parts[0].split(':')[1];
            raw = parts[1];

            return new Blob([raw], { type: contentType });
        }

        parts = dataURL.split(BASE64_MARKER);
        contentType = parts[0].split(':')[1];
        raw = atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array.buffer], { type: contentType });
    }

    function rez(value) {
        // The rez function walks recursively through the object looking for $ref
        // properties. When it finds one that has a value that is a path, then it
        // replaces the $ref object with a reference to the value that is found by
        // the path.

        var i = void 0,
            item = void 0,
            name = void 0,
            path = void 0;

        if (isObj(value)) {
            if (Array.isArray(value)) {
                for (i = 0; i < value.length; i += 1) {
                    item = value[i];
                    if (isObj(item)) {
                        path = item.$ref;
                        if (typeof path === 'string' && px.test(path)) {
                            value[i] = eval(path);
                        } else {
                            value[i] = rez(item);
                        }
                    }
                }
            } else {
                if (value.$type !== undefined) {
                    switch (value.$type) {
                        case 'Blob':
                        case 'File':
                            value = dataURLToBlob(value.$enc);
                            break;
                        case 'Boolean':
                            value = Boolean(value.$enc === 'true');
                            break;
                        case 'Date':
                            value = new Date(value.$enc);
                            break;
                        case 'Number':
                            value = Number(value.$enc);
                            break;
                        case 'RegExp':
                            value = eval(value.$enc);
                            break;
                        case 'number':
                            value = parseFloat(value.$enc);
                            break;
                        case 'undefined':
                            value = undefined;
                            break;
                    }
                } else {
                    for (name in value) {
                        if (_typeof$6(value[name]) === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    value[name] = rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }
        return value;
    }
    return rez($);
}

/**
 * Encode the specified object as a string.  Because of the asynchronus
 * conversion of Blob/File to string, the encode function requires
 * a callback
 * @param {Object} val the value to convert.
 * @param {function} callback the function to call once conversion is
 * complete.  The callback gets called with the converted value.
 */
function encode(val, callback) {
    function finishEncode(val) {
        callback(JSON.stringify(val));
    }
    decycle(val, finishEncode);
}

/**
 * Deserialize the specified string to an object
 * @param {String} val the serialized string
 * @returns {Object} the deserialized object
 */
function decode(val) {
    return retrocycle(JSON.parse(val));
}

var Sca = { decycle: decycle, retrocycle: retrocycle, encode: encode, decode: decode };

function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * IDB Index
 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @param {IDBObjectStore} store
 * @param {IDBIndexProperties} indexProperties
 * @constructor
 */
function IDBIndex(store, indexProperties) {
    this.__objectStore = store;
    this.__name = indexProperties.columnName;
    this.__keyPath = Array.isArray(indexProperties.keyPath) ? indexProperties.keyPath.slice() : indexProperties.keyPath;
    var optionalParams = indexProperties.optionalParams;
    this.__multiEntry = !!(optionalParams && optionalParams.multiEntry);
    this.__unique = !!(optionalParams && optionalParams.unique);
    this.__deleted = !!indexProperties.__deleted;
    this.__objectStore.__cursors = indexProperties.cursors || [];
}

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndex} index
 * @param {IDBObjectStore} store
 * @protected
 */
IDBIndex.__clone = function (index, store) {
    return new IDBIndex(store, {
        columnName: index.name,
        keyPath: index.keyPath,
        optionalParams: {
            multiEntry: index.multiEntry,
            unique: index.unique
        }
    });
};

/**
 * Creates a new index on an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @returns {IDBIndex}
 * @protected
 */
IDBIndex.__createIndex = function (store, index) {
    var columnExists = !!store.__indexes[index.name] && store.__indexes[index.name].__deleted;

    // Add the index to the IDBObjectStore
    index.__pending = true;
    store.__indexes[index.name] = index;
    store.indexNames.push(index.name);

    // Create the index in WebSQL
    var transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function createIndex(tx, args, success, failure) {
        function error(tx, err) {
            failure(createDOMException(0, 'Could not create index "' + index.name + '"', err));
        }

        function applyIndex(tx) {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function () {
                // Add index entries for all existing records
                tx.executeSql('SELECT * FROM ' + escapeStore(store.name), [], function (tx, data) {
                    CFG.DEBUG && console.log('Adding existing ' + store.name + ' records to the ' + index.name + ' index');
                    addIndexEntry(0);

                    function addIndexEntry(i) {
                        if (i < data.rows.length) {
                            try {
                                var value = Sca.decode(data.rows.item(i).value);
                                var indexKey = Key.evaluateKeyPathOnValue(value, index.keyPath, index.multiEntry);
                                indexKey = Key.encode(indexKey, index.multiEntry);

                                tx.executeSql('UPDATE ' + escapeStore(store.name) + ' SET ' + escapeIndex(index.name) + ' = ? WHERE key = ?', [indexKey, data.rows.item(i).key], function (tx, data) {
                                    addIndexEntry(i + 1);
                                }, error);
                            } catch (e) {
                                // Not a valid value to insert into index, so just continue
                                addIndexEntry(i + 1);
                            }
                        } else {
                            delete index.__pending;
                            success(store);
                        }
                    }
                }, error);
            }, error);
        }

        if (columnExists) {
            // For a previously existing index, just update the index entries in the existing column
            applyIndex(tx);
        } else {
            // For a new index, add a new column to the object store, then apply the index
            var sql = ['ALTER TABLE', escapeStore(store.name), 'ADD', escapeIndex(index.name), 'BLOB'].join(' ');
            CFG.DEBUG && console.log(sql);
            tx.executeSql(sql, [], applyIndex, error);
        }
    }, undefined, store);
};

/**
 * Deletes an index from an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @protected
 */
IDBIndex.__deleteIndex = function (store, index) {
    // Remove the index from the IDBObjectStore
    store.__indexes[index.name].__deleted = true;
    store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

    // Remove the index in WebSQL
    var transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function deleteIndex(tx, args, success, failure) {
        function error(tx, err) {
            failure(createDOMException(0, 'Could not delete index "' + index.name + '"', err));
        }

        // Update the object store's index list
        IDBIndex.__updateIndexList(store, tx, success, error);
    }, undefined, store);
};

/**
 * Updates index list for the given object store.
 * @param {IDBObjectStore} store
 * @param {object} tx
 * @param {function} success
 * @param {function} failure
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
    var indexList = {};
    for (var i = 0; i < store.indexNames.length; i++) {
        var idx = store.__indexes[store.indexNames[i]];
        /** @type {IDBIndexProperties} **/
        indexList[idx.name] = {
            columnName: idx.name,
            keyPath: idx.keyPath,
            optionalParams: {
                unique: idx.unique,
                multiEntry: idx.multiEntry
            },
            deleted: !!idx.deleted
        };
    }

    CFG.DEBUG && console.log('Updating the index list for ' + store.name, indexList);
    tx.executeSql('UPDATE __sys__ SET indexList = ? WHERE name = ?', [JSON.stringify(indexList), store.name], function () {
        success(store);
    }, failure);
};

/**
 * Retrieves index data for the given key
 * @param {*|IDBKeyRange} key
 * @param {string} opType
 * @returns {IDBRequest}
 * @private
 */
IDBIndex.prototype.__fetchIndexData = function (range, opType, nullDisallowed, unboundedAllowed) {
    var me = this;
    var hasUnboundedRange = unboundedAllowed && range == null;

    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This index has been deleted');
    }
    if (this.objectStore.__deleted) {
        throw createDOMException('InvalidStateError', "This index's object store has been deleted");
    }
    IDBTransaction.__assertActive(this.objectStore.transaction);

    if (nullDisallowed && !unboundedAllowed && range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    var fetchArgs = fetchIndexData(me, !hasUnboundedRange, range, opType, false);
    return me.objectStore.transaction.__addToTransactionQueue(function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        executeFetchIndexData.apply(undefined, _toConsumableArray$1(fetchArgs).concat(args));
    }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function (range, direction) {
    var cursor = new IDBCursorWithValue(range, direction, this.objectStore, this, escapeIndexName(this.name), 'value');
    this.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function (range, direction) {
    var cursor = new IDBCursor(range, direction, this.objectStore, this, escapeIndexName(this.name), 'key');
    this.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

IDBIndex.prototype.get = function (query) {
    if (!arguments.length) {
        // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.get`.');
    }
    return this.__fetchIndexData(query, 'value', true);
};

IDBIndex.prototype.getKey = function (query) {
    if (!arguments.length) {
        // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.getKey`.');
    }
    return this.__fetchIndexData(query, 'key', true);
};

/*
// Todo: Implement getAll
IDBIndex.prototype.getAll = function (query, count) {
};
*/

/*
// Todo: Implement getAllKeys
IDBIndex.prototype.getAllKeys = function (query, count) {
};
*/

IDBIndex.prototype.count = function (query) {
    // key is optional
    if (instanceOf(query, IDBKeyRange)) {
        if (!query.toString() !== '[object IDBKeyRange]') {
            query = new IDBKeyRange(query.lower, query.upper, query.lowerOpen, query.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return new IDBCursorWithValue(query, 'next', this.objectStore, this, escapeIndexName(this.name), 'value', true).__req;
    }
    return this.__fetchIndexData(query, 'count', false, true);
};

IDBIndex.prototype.__renameIndex = function (storeName, oldName, newName) {
    var colInfoToPreserveArr = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    var newNameType = 'BLOB';
    var colNamesToPreserve = colInfoToPreserveArr.map(function (colInfo) {
        return colInfo[0];
    });
    var colInfoToPreserve = colInfoToPreserveArr.map(function (colInfo) {
        return colInfo.join(' ');
    });
    var listColInfoToPreserve = colInfoToPreserve.length ? colInfoToPreserve.join(', ') + ', ' : '';
    var listColsToPreserve = colNamesToPreserve.length ? colNamesToPreserve.join(', ') + ', ' : '';

    var me = this;
    // We could adapt the approach at http://stackoverflow.com/a/8430746/271577
    //    to make the approach reusable without passing column names, but it is a bit fragile
    me.transaction.__addNonRequestToTransactionQueue(function renameIndex(tx, args, success, error) {
        var sql = 'ALTER TABLE ' + escapeStore(storeName) + ' RENAME TO tmp_' + escapeStore(storeName);
        tx.executeSql(sql, [], function (tx, data) {
            var sql = 'CREATE TABLE ' + escapeStore(storeName) + '(' + listColInfoToPreserve + escapeIndex(newName) + ' ' + newNameType + ')';
            tx.executeSql(sql, [], function (tx, data) {
                var sql = 'INSERT INTO ' + escapeStore(storeName) + '(' + listColsToPreserve + escapeIndex(newName) + ') SELECT ' + listColsToPreserve + escapeIndex(oldName) + ' FROM tmp_' + escapeStore(storeName);
                tx.executeSql(sql, [], function (tx, data) {
                    var sql = 'DROP TABLE tmp_' + escapeStore(storeName);
                    tx.executeSql(sql, [], function (tx, data) {
                        success();
                    }, function (tx, err) {
                        error(err);
                    });
                }, function (tx, err) {
                    error(err);
                });
            });
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBIndex.prototype.toString = function () {
    return '[object IDBIndex]';
};

defineReadonlyProperties(IDBIndex.prototype, ['objectStore', 'keyPath', 'multiEntry', 'unique']);

Object.defineProperty(IDBIndex, Symbol.hasInstance, {
    value: function value(obj) {
        return isObj(obj) && typeof obj.openCursor === 'function' && typeof obj.multiEntry === 'boolean';
    }
});

Object.defineProperty(IDBIndex.prototype, 'name', {
    enumerable: false,
    configurable: false,
    get: function get() {
        return this.__name;
    },
    set: function set(newName) {
        var me = this;
        var oldName = me.name;
        IDBTransaction.__assertVersionChange(this.objectStore.transaction);
        IDBTransaction.__assertActive(this.objectStore.transaction);
        if (me.__deleted) {
            throw createDOMException('InvalidStateError', 'This index has been deleted');
        }
        if (me.objectStore.__deleted) {
            throw createDOMException('InvalidStateError', "This index's object store has been deleted");
        }
        if (newName === oldName) {
            return;
        }
        if (me.objectStore.__indexes[newName] && !me.objectStore.__indexes[newName].__deleted) {
            throw createDOMException('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.name);
        }

        me.__name = newName;
        // Todo: Add pending flag to delay queries against this index until renamed in SQLite
        var colInfoToPreserveArr = [['key', 'BLOB ' + (me.objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')], ['value', 'BLOB']];
        this.__renameIndex(me.objectStore.name, oldName, newName, colInfoToPreserveArr);
    }
});

function executeFetchIndexData(index, hasKey, encodedKey, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
    tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
        var recordCount = 0,
            record = null;
        if (index.multiEntry) {
            var _loop = function _loop(i) {
                var row = data.rows.item(i);
                var rowKey = Key.decode(row[escapeIndexName(index.name)]);
                if (hasKey && (multiChecks && encodedKey.some(function (check) {
                    return rowKey.includes(check);
                }) || // More precise than our SQL
                Key.isMultiEntryMatch(encodedKey, row[escapeIndexName(index.name)]))) {
                    recordCount++;
                    record = record || row;
                } else if (!hasKey && !multiChecks) {
                    if (rowKey !== undefined) {
                        recordCount = recordCount + (Array.isArray(rowKey) ? rowKey.length : 1);
                        record = record || row;
                    }
                }
            };

            for (var i = 0; i < data.rows.length; i++) {
                _loop(i);
            }
        } else {
            recordCount = data.rows.length;
            record = recordCount && data.rows.item(0);
        }
        if (opType === 'count') {
            success(recordCount);
        } else if (recordCount === 0) {
            success(undefined);
        } else if (opType === 'key') {
            success(Key.decode(record.key));
        } else {
            // when opType is value
            success(Sca.decode(record.value));
        }
    }, error);
}

function fetchIndexData(index, hasRange, range, opType, multiChecks) {
    var sql = ['SELECT * FROM', escapeStore(index.objectStore.name), 'WHERE', escapeIndex(index.name), 'NOT NULL'];
    var sqlValues = [];
    if (hasRange) {
        if (multiChecks) {
            sql.push('AND (');
            range.forEach(function (innerKey, i) {
                if (i > 0) sql.push('OR');
                sql.push(escapeIndex(index.name), "LIKE ? ESCAPE '^' ");
                sqlValues.push('%' + sqlLIKEEscape(Key.encode(innerKey, index.multiEntry)) + '%');
            });
            sql.push(')');
        } else if (index.multiEntry) {
            sql.push('AND', escapeIndex(index.name), "LIKE ? ESCAPE '^'");
            range = Key.encode(range, index.multiEntry);
            sqlValues.push('%' + sqlLIKEEscape(range) + '%');
        } else {
            if (instanceOf(range, IDBKeyRange)) {
                // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
                if (!range.toString() !== '[object IDBKeyRange]') {
                    range = new IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
                }
            } else {
                range = IDBKeyRange.only(range);
            }
            setSQLForRange(range, escapeIndex(index.name), sql, sqlValues, true, false);
        }
    }
    CFG.DEBUG && console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
    return [index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

var syncPromiseCommonjs = createCommonjsModule(function (module) {
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

function isPromise(p) {
  return p && typeof p.then === 'function';
}
function addReject(prom, reject) {
  prom.then(null, reject) // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
}

// States
var PENDING = 2,
    FULFILLED = 0, // We later abuse these as array indices
    REJECTED = 1;

function SyncPromise(fn) {
  var self = this;
  self.v = 0; // Value, this will be set to either a resolved value or rejected reason
  self.s = PENDING; // State of the promise
  self.c = [[],[]]; // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
  function transist(val, state) {
    self.v = val;
    self.s = state;
    self.c[state].forEach(function(fn) { fn(val); });
    // Release memory, but if no handlers have been added, as we
    //   assume that we will resolve/reject (truly) synchronously
    //   and thus we avoid flagging checks about whether we've
    //   already resolved/rejected.
    if (self.c[state].length) self.c = null;
  }
  function resolve(val) {
    if (!self.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(val)) {
      addReject(val.then(resolve), reject);
    } else {
      transist(val, FULFILLED);
    }
  }
  function reject(reason) {
    if (!self.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(reason)) {
      addReject(reason.then(reject), reject);
    } else {
      transist(reason, REJECTED);
    }
  }
  try {
    fn(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

var prot = SyncPromise.prototype;

prot.then = function(cb, errBack) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    var rej = typeof errBack === 'function' ? errBack : reject;
    function settle() {
      try {
        resolve(cb ? cb(self.v) : self.v);
      } catch(e) {
        rej(e);
      }
    }
    if (self.s === FULFILLED) {
      settle();
    } else if (self.s === REJECTED) {
      rej(self.v);
    } else {
      self.c[FULFILLED].push(settle);
      self.c[REJECTED].push(rej);
    }
  });
};

prot.catch = function(cb) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    function settle() {
      try {
        resolve(cb(self.v));
      } catch(e) {
        reject(e);
      }
    }
    if (self.s === REJECTED) {
      settle();
    } else if (self.s === FULFILLED) {
      resolve(self.v);
    } else {
      self.c[REJECTED].push(settle);
      self.c[FULFILLED].push(resolve);
    }
  });
};

SyncPromise.all = function(promises) {
  return new SyncPromise(function(resolve, reject, l) {
    l = promises.length;
    var hasPromises = false;
    var newPromises = [];
    if (!l) {
        resolve(newPromises);
        return;
    }
    promises.forEach(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
          newPromises[i] = res;
          --l || resolve(newPromises);
        }), reject);
      } else {
        newPromises[i] = p;
        --l || resolve(promises);
      }
    });
  });
};

SyncPromise.race = function(promises) {
  var resolved = false;
  return new SyncPromise(function(resolve, reject) {
    promises.some(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
          if (resolved) {
            return;
          }
          resolve(res);
          resolved = true;
        }), reject);
      } else {
        resolve(p);
        resolved = true;
        return true;
      }
    });
  });
};

SyncPromise.resolve = function(val) {
  return new SyncPromise(function(resolve, reject) {
    resolve(val);
  });
};

SyncPromise.reject = function(val) {
  return new SyncPromise(function(resolve, reject) {
    reject(val);
  });
};
module.exports = SyncPromise;
});

var SyncPromise = interopDefault(syncPromiseCommonjs);

var _typeof$5 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * IndexedDB Object Store
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @constructor
 */
function IDBObjectStore(storeProperties, transaction) {
    this.__name = storeProperties.name;
    this.__keyPath = Array.isArray(storeProperties.keyPath) ? storeProperties.keyPath.slice() : storeProperties.keyPath;
    this.__transaction = transaction;
    this.__idbdb = storeProperties.idbdb;
    this.__cursors = storeProperties.cursors || [];

    // autoInc is numeric (0/1) on WinPhone
    this.__autoIncrement = !!storeProperties.autoInc;

    this.__indexes = {};
    this.__indexNames = new StringList();
    var indexList = storeProperties.indexList;
    for (var indexName in indexList) {
        if (indexList.hasOwnProperty(indexName)) {
            var index = new IDBIndex(this, indexList[indexName]);
            this.__indexes[index.name] = index;
            if (!index.__deleted) {
                this.indexNames.push(index.name);
            }
        }
    }
}

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 */
IDBObjectStore.__clone = function (store, transaction) {
    var newStore = new IDBObjectStore({
        name: store.name,
        keyPath: Array.isArray(store.keyPath) ? store.keyPath.slice() : store.keyPath,
        autoInc: store.autoIncrement,
        indexList: {},
        idbdb: store.__idbdb,
        cursors: store.__cursors
    }, transaction);
    newStore.__indexes = store.__indexes;
    newStore.__indexNames = store.indexNames;
    return newStore;
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    db.__objectStores[store.name] = store;
    db.objectStoreNames.push(store.name);

    // Add the object store to WebSQL
    var transaction = db.__versionTransaction;
    IDBTransaction$1.__assertVersionChange(transaction);
    transaction.__addNonRequestToTransactionQueue(function createObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            CFG.DEBUG && console.log(err);
            throw createDOMException(0, 'Could not create object store "' + store.name + '"', err);
        }

        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        var sql = ['CREATE TABLE', escapeStore(store.name), '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        CFG.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?,?)', [store.name, JSON.stringify(store.keyPath), store.autoIncrement, '{}', 1], function () {
                success(store);
            }, error);
        }, error);
    });
};

/**
 * Deletes an object store from the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    store.__deleted = true;
    db.__objectStores[store.name] = undefined;
    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

    // Remove the object store from WebSQL
    var transaction = db.__versionTransaction;
    IDBTransaction$1.__assertVersionChange(transaction);
    transaction.__addNonRequestToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            CFG.DEBUG && console.log(err);
            failure(createDOMException(0, 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT * FROM __sys__ WHERE name = ?', [store.name], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + escapeStore(store.name), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE name = ?', [store.name], function () {
                        success();
                    }, error);
                }, error);
            }
        });
    });
};

/**
 * Determines whether the given inline or out-of-line key is valid, according to the object store's schema.
 * @param {*} value     Used for inline keys
 * @param {*} key       Used for out-of-line keys
 * @private
 */
IDBObjectStore.prototype.__validateKeyAndValue = function (value, key) {
    if (this.keyPath !== null) {
        if (key !== undefined) {
            throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided', this);
        }
        throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
        key = Key.evaluateKeyPathOnValue(value, this.keyPath);
        if (key === undefined) {
            if (this.autoIncrement) {
                // Todo: Check whether this next check is a problem coming from `IDBCursor.update()`
                if (!isObj(value)) {
                    // Although steps for storing will detect this, we want to throw synchronously for `add`/`put`
                    throw createDOMException('DataError', 'KeyPath was specified, but value was not an object');
                }
                // A key will be generated
                return undefined;
            }
            throw createDOMException('DataError', 'Could not evaluate a key from keyPath');
        }
        Key.convertValueToKey(key);
    } else {
        if (key === undefined) {
            if (this.autoIncrement) {
                // A key will be generated
                return undefined;
            }
            throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ', this);
        }
        Key.convertValueToKey(key);
        throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
    }

    return key;
};

/**
 * From the store properties and object, extracts the value for the key in the object store
 * If the table has auto increment, get the current number (unless it has a keyPath leading to a
 *  valid but non-numeric or < 1 key)
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failure
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failure) {
    var me = this;

    function getCurrentNumber(callback) {
        tx.executeSql('SELECT currNum FROM __sys__ WHERE name = ?', [me.name], function (tx, data) {
            if (data.rows.length !== 1) {
                callback(1);
            } else {
                callback(data.rows.item(0).currNum);
            }
        }, function (tx, error) {
            failure(createDOMException('DataError', 'Could not get the auto increment value for key', error));
        });
    }

    // This variable determines against which key comparisons should be made
    //   when determining whether to update the current number
    var keyToCheck = key;
    var hasKeyPath = me.keyPath !== null;
    if (hasKeyPath) {
        keyToCheck = Key.evaluateKeyPathOnValue(value, me.keyPath);
    }
    // If auto-increment and no valid primaryKey found on the keyPath, get and set the new value, and use
    if (me.autoIncrement && keyToCheck === undefined) {
        getCurrentNumber(function (cn) {
            if (hasKeyPath) {
                try {
                    // Update the value with the new key
                    Key.setValue(value, me.keyPath, cn);
                } catch (e) {
                    failure(createDOMException('DataError', 'Could not assign a generated value to the keyPath', e));
                }
            }
            success(cn);
        });
        // If auto-increment and the keyPath item is a valid numeric key, get the old auto-increment to compare if the new is higher
        //  to determine which to use and whether to update the current number
    } else if (me.autoIncrement && Number.isFinite(keyToCheck) && keyToCheck >= 1) {
        getCurrentNumber(function (cn) {
            var useNewForAutoInc = keyToCheck >= cn;
            success(keyToCheck, useNewForAutoInc);
        });
        // Not auto-increment or auto-increment with a bad (non-numeric or < 1) keyPath key
    } else {
        success(keyToCheck);
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, primaryKey, passedKey, useNewForAutoInc, success, error) {
    var _this = this;

    var me = this;
    var paramMap = {};
    var indexPromises = me.indexNames.map(function (indexName) {
        return new SyncPromise(function (resolve, reject) {
            var index = me.__indexes[indexName];
            if (index.__pending) {
                resolve();
                return;
            }
            var indexKey = void 0;
            try {
                indexKey = Key.extractKeyFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
            } catch (err) {
                resolve();
                return;
            }
            function setIndexInfo(index) {
                if (indexKey === undefined) {
                    return;
                }
                paramMap[index.name] = Key.encode(indexKey, index.multiEntry);
            }
            if (index.unique) {
                (function () {
                    var multiCheck = index.multiEntry && Array.isArray(indexKey);
                    var fetchArgs = fetchIndexData(index, true, indexKey, 'key', multiCheck);
                    executeFetchIndexData.apply(undefined, _toConsumableArray(fetchArgs).concat([tx, null, function success(key) {
                        if (key === undefined) {
                            setIndexInfo(index);
                            resolve();
                            return;
                        }
                        reject(createDOMException('ConstraintError', 'Index already contains a record equal to ' + (multiCheck ? 'one of the subkeys of' : '') + '`indexKey`'));
                    }, reject]));
                })();
            } else {
                setIndexInfo(index);
                resolve();
            }
        });
    });
    SyncPromise.all(indexPromises).then(function () {
        var sqlStart = ['INSERT INTO ', escapeStore(_this.name), '('];
        var sqlEnd = [' VALUES ('];
        var insertSqlValues = [];
        if (primaryKey !== undefined) {
            Key.convertValueToKey(primaryKey);
            sqlStart.push(quote('key'), ',');
            sqlEnd.push('?,');
            insertSqlValues.push(Key.encode(primaryKey));
        }
        for (var key in paramMap) {
            sqlStart.push(escapeIndex(key) + ',');
            sqlEnd.push('?,');
            insertSqlValues.push(paramMap[key]);
        }
        // removing the trailing comma
        sqlStart.push(quote('value') + ' )');
        sqlEnd.push('?)');
        insertSqlValues.push(encoded);

        var insertSql = sqlStart.join(' ') + sqlEnd.join(' ');
        CFG.DEBUG && console.log('SQL for adding', insertSql, insertSqlValues);

        var insert = function insert(result) {
            var cb = void 0;
            if (typeof result === 'function') {
                cb = result;
                result = undefined;
            }
            tx.executeSql(insertSql, insertSqlValues, function (tx, data) {
                if (cb) {
                    cb();
                } else success(result);
            }, function (tx, err) {
                error(createDOMException('ConstraintError', err.message, err));
            });
        };

        // Need for a clone here?
        Sca.encode(primaryKey, function (primaryKey) {
            primaryKey = Sca.decode(primaryKey);
            if (!me.autoIncrement) {
                insert(primaryKey);
                return;
            }

            // Bump up the auto-inc counter if the key path-resolved value is valid (greater than old value and >=1) OR
            //  if a manually passed in key is valid (numeric and >= 1) and >= any primaryKey
            // Todo: If primaryKey is not a number, we should be checking the value of any previous "current number" and compare with that
            if (useNewForAutoInc) {
                insert(function () {
                    var sql = 'UPDATE __sys__ SET currNum = ? WHERE name = ?';
                    var sqlValues = [Math.floor(primaryKey) + 1, me.name];
                    CFG.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
                // If the key path-resolved value is invalid (not numeric or < 1) or
                //    if a manually passed in key is invalid (non-numeric or < 1),
                //    then we don't need to modify the current number
            } else if (useNewForAutoInc === false || !Number.isFinite(primaryKey) || primaryKey < 1) {
                insert(primaryKey);
                // Increment current number by 1 (we cannot leverage SQLite's
                //  autoincrement (and decrement when not needed), as decrementing
                //  will be overwritten/ignored upon the next insert)
            } else {
                insert(function () {
                    var sql = 'UPDATE __sys__ SET currNum = currNum + 1 WHERE name = ?';
                    var sqlValues = [me.name];
                    CFG.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
            }
        });
    }).catch(function (err) {
        error(err);
    });
};

IDBObjectStore.prototype.add = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    this.__validateKeyAndValue(value, key);

    var request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStoreAdd(tx, args, success, error) {
        Sca.encode(value, function (encoded) {
            value = Sca.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                Sca.encode(value, function (encoded) {
                    me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                        me.__cursors.forEach(function (cursor) {
                            cursor.__addToCache();
                        });
                        success.apply(undefined, arguments);
                    }, error);
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.put = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    this.__validateKeyAndValue(value, key);

    var request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStorePut(tx, args, success, error) {
        Sca.encode(value, function (encoded) {
            value = Sca.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                Sca.encode(value, function (encoded) {
                    // First try to delete if the record exists
                    Key.convertValueToKey(primaryKey);
                    var sql = 'DELETE FROM ' + escapeStore(me.name) + ' WHERE key = ?';
                    var encodedPrimaryKey = Key.encode(primaryKey);
                    tx.executeSql(sql, [encodedPrimaryKey], function (tx, data) {
                        CFG.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);
                        me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                            me.__cursors.forEach(function (cursor) {
                                cursor.__addToCache();
                            });
                            success.apply(undefined, arguments);
                        }, error);
                    }, function (tx, err) {
                        error(err);
                    });
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.get = function (range) {
    var me = this;
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.get`.');
    }

    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    if (range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    if (instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else {
        range = IDBKeyRange.only(range);
    }

    var sql = ['SELECT * FROM ', escapeStore(me.name), ' WHERE '];
    var sqlValues = [];
    setSQLForRange(range, quote('key'), sql, sqlValues);
    sql = sql.join(' ');
    return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
        CFG.DEBUG && console.log('Fetching', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            CFG.DEBUG && console.log('Fetched data', data);
            var value = void 0;
            try {
                // Opera can't deal with the try-catch here.
                if (data.rows.length === 0) {
                    return success();
                }

                value = Sca.decode(data.rows.item(0).value);
            } catch (e) {
                // If no result is returned, or error occurs when parsing JSON
                CFG.DEBUG && console.log(e);
            }
            success(value);
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

/*
// Todo: Implement getKey
IDBObjectStore.prototype.getKey = function (query) {
};
*/

/*
// Todo: Implement getAll
IDBObjectStore.prototype.getAll = function (query, count) {
};
*/

/*
// Todo: Implement getAllKeys
IDBObjectStore.prototype.getAllKeys = function (query, count) {
};
*/

IDBObjectStore.prototype['delete'] = function (range) {
    var me = this;
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.delete`.');
    }

    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    if (range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    if (instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else {
        range = IDBKeyRange.only(range);
    }

    var sqlArr = ['DELETE FROM ', escapeStore(me.name), ' WHERE '];
    var sqlValues = [];
    setSQLForRange(range, quote('key'), sqlArr, sqlValues);
    var sql = sqlArr.join(' ');

    return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
        CFG.DEBUG && console.log('Deleting', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            CFG.DEBUG && console.log('Deleted from database', data.rowsAffected);
            me.__cursors.forEach(function (cursor) {
                cursor.__deleteFromCache();
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.clear = function () {
    var me = this;
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + escapeStore(me.name), [], function (tx, data) {
            CFG.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
            me.__cursors.forEach(function (cursor) {
                cursor.__clearFromCache();
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.count = function (key) {
    var me = this;
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(me.transaction);
    if (instanceOf(key, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!key.toString() !== '[object IDBKeyRange]') {
            key = new IDBKeyRange(key.lower, key.upper, key.lowerOpen, key.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return new IDBCursorWithValue(key, 'next', this, this, 'key', 'value', true).__req;
    } else {
        var _ret2 = function () {
            var hasKey = key != null;

            // key is optional
            if (hasKey) {
                Key.convertValueToKey(key);
            }

            return {
                v: me.transaction.__addToTransactionQueue(function objectStoreCount(tx, args, success, error) {
                    var sql = 'SELECT * FROM ' + escapeStore(me.name) + (hasKey ? ' WHERE key = ?' : '');
                    var sqlValues = [];
                    hasKey && sqlValues.push(Key.encode(key));
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(data.rows.length);
                    }, function (tx, err) {
                        error(err);
                    });
                }, undefined, me)
            };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof$5(_ret2)) === "object") return _ret2.v;
    }
};

IDBObjectStore.prototype.openCursor = function (range, direction) {
    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    var cursor = new IDBCursorWithValue(range, direction, this, this, 'key', 'value');
    this.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.openKeyCursor = function (range, direction) {
    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    var cursor = new IDBCursor(range, direction, this, this, 'key', 'key');
    this.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.index = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(this.transaction);
    var index = this.__indexes[indexName];
    if (!index || index.__deleted) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }

    return IDBIndex.__clone(index, this);
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath, optionalParameters) {
    indexName = String(indexName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (arguments.length === 1) {
        throw new TypeError('No key path was specified');
    }
    IDBTransaction$1.__assertVersionChange(this.transaction);
    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(this.transaction);
    if (this.__indexes[indexName] && !this.__indexes[indexName].__deleted) {
        throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + this.name);
    }
    if (!isValidKeyPath(keyPath)) {
        throw createDOMException('SyntaxError', 'A valid keyPath must be supplied');
    }
    if (Array.isArray(keyPath) && optionalParameters && optionalParameters.multiEntry) {
        throw createDOMException('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
    }

    optionalParameters = optionalParameters || {};
    /** @name IDBIndexProperties **/
    var indexProperties = {
        columnName: indexName,
        keyPath: keyPath,
        optionalParams: {
            unique: !!optionalParameters.unique,
            multiEntry: !!optionalParameters.multiEntry
        }
    };
    var index = new IDBIndex(this, indexProperties);
    IDBIndex.__createIndex(this, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    IDBTransaction$1.__assertVersionChange(this.transaction);
    if (this.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction$1.__assertActive(this.transaction);
    var index = this.__indexes[indexName];
    if (!index) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }

    IDBIndex.__deleteIndex(this, index);
};

IDBObjectStore.prototype.toString = function () {
    return '[object IDBObjectStore]';
};

defineReadonlyProperties(IDBObjectStore.prototype, ['keyPath', 'indexNames', 'transaction', 'autoIncrement']);

Object.defineProperty(IDBObjectStore.prototype, 'name', {
    enumerable: false,
    configurable: false,
    get: function get() {
        return this.__name;
    },
    set: function set(name) {
        var me = this;
        if (this.__deleted) {
            throw createDOMException('InvalidStateError', 'This store has been deleted');
        }
        IDBTransaction$1.__assertVersionChange(this.transaction);
        IDBTransaction$1.__assertActive(this.transaction);
        if (me.name === name) {
            return;
        }
        if (me.__idbdb.__objectStores[name]) {
            throw createDOMException('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
        }
        me.__name = name;
        // Todo: Add pending flag to delay queries against this store until renamed in SQLite

        var sql = 'ALTER TABLE ' + escapeStore(this.name) + ' RENAME TO ' + escapeStore(name);
        me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear(tx, args, success, error) {
            tx.executeSql(sql, [], function (tx, data) {
                success();
            }, function (tx, err) {
                error(err);
            });
        });
    }
});

var uniqueID = 0;

/**
 * The IndexedDB Transaction
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @constructor
 */
function IDBTransaction$1(db, storeNames, mode) {
    var _this = this;

    this.__id = ++uniqueID; // for debugging simultaneous transactions
    this.__active = true;
    this.__running = false;
    this.__errored = false;
    this.__requests = [];
    this.__objectStoreNames = storeNames;
    this.__mode = mode;
    this.__db = db;
    this.__error = null;
    this.__internal = false;
    this.onabort = this.onerror = this.oncomplete = null;
    this.__storeClones = {};
    this.__setOptions({ defaultSync: true });

    // Kick off the transaction as soon as all synchronous code is done.
    setTimeout(function () {
        _this.__executeRequests();
    }, 0);
}

IDBTransaction$1.prototype.__executeRequests = function () {
    if (this.__running) {
        CFG.DEBUG && console.log('Looks like the request set is already running', this.mode);
        return;
    }

    this.__running = true;
    var me = this;

    me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction']( // `readTransaction` is optimized, at least in `node-websql`
    function executeRequests(tx) {
        me.__tx = tx;
        var q = null,
            i = -1;

        function success(result, req) {
            if (req) {
                q.req = req; // Need to do this in case of cursors
            }
            if (q.req.__readyState === 'done') {
                // Avoid continuing with aborted requests
                return;
            }
            q.req.__readyState = 'done';
            q.req.__result = result;
            q.req.__error = null;
            var e = createEvent('success');
            try {
                // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
                // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
                // behavior for convenience in our internal calls
                me.__internal = true;
                me.__active = true;
                q.req.dispatchEvent(e);
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
            } catch (err) {
                me.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                return;
            }
            executeNextRequest();
        }

        function error() /* tx, err */{
            if (me.__errored || me.__transactionFinished) {
                // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
                return;
            }
            if (q.req && q.req.__readyState === 'done') {
                // Avoid continuing with aborted requests
                return;
            }

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var err = findError(args);
            if (!q.req) {
                me.__abortTransaction(q.req.__error);
                return;
            }
            // Fire an error event for the current IDBRequest
            q.req.__readyState = 'done';
            q.req.__error = err;
            q.req.__result = undefined;
            q.req.addLateEventListener('error', function (e) {
                if (e.cancelable && e.defaultPrevented) {
                    executeNextRequest();
                }
            });
            q.req.addDefaultEventListener('error', function () {
                me.__abortTransaction(q.req.__error);
            });
            var e = void 0;
            try {
                // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
                // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
                // behavior for convenience in our internal calls
                me.__internal = true;
                me.__active = true;
                e = createEvent('error', err, { bubbles: true, cancelable: true });
                q.req.dispatchEvent(e);
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
            } catch (handlerErr) {
                logError('Error', 'An error occurred in a handler attached to request chain', handlerErr); // We do nothing else with this `handlerErr` per spec
                e.preventDefault(); // Prevent 'error' default as steps indicate we should abort with `AbortError` even without cancellation
                me.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
            }
        }

        function executeNextRequest() {
            i++;
            if (i >= me.__requests.length) {
                // All requests in the transaction are done
                me.__requests = [];
                if (me.__active) {
                    transactionFinished();
                }
            } else {
                try {
                    q = me.__requests[i];
                    if (!q.req) {
                        q.op(tx, q.args, executeNextRequest, error);
                        return;
                    }
                    if (q.req.__readyState === 'done') {
                        // Avoid continuing with aborted requests
                        return;
                    }
                    q.op(tx, q.args, success, error, executeNextRequest);
                } catch (e) {
                    error(e);
                }
            }
        }

        executeNextRequest();
    }, function webSqlError(errWebsql) {
        var name = void 0,
            message = void 0;
        switch (errWebsql.code) {
            case 4:
                {
                    // SQLError.QUOTA_ERR
                    name = 'QuotaExceededError';
                    message = 'The operation failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.';
                    break;
                }
            /*
            // Should a WebSQL timeout treat as IndexedDB `TransactionInactiveError` or `UnknownError`?
            case 7: { // SQLError.TIMEOUT_ERR
                // All transaction errors abort later, so no need to mark inactive
                name = 'TransactionInactiveError';
                message = 'A request was placed against a transaction which is currently not active, or which is finished (Internal SQL Timeout).';
                break;
            }
            */
            default:
                {
                    name = 'UnknownError';
                    message = 'The operation failed for reasons unrelated to the database itself and not covered by any other errors.';
                    break;
                }
        }
        message += ' (' + errWebsql.message + ')--(' + errWebsql.code + ')';
        var err = createDOMException(name, message);
        me.__abortTransaction(err);
    });

    function transactionFinished() {
        me.__active = false;
        CFG.DEBUG && console.log('Transaction completed');
        var evt = createEvent('complete');
        me.__transactionFinished = true;
        try {
            // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
            // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
            // behavior for convenience in our internal calls
            me.dispatchEvent(createEvent('__beforecomplete'));
            me.__internal = true;
            me.dispatchEvent(evt);
            me.dispatchEvent(createEvent('__complete'));
        } catch (e) {
            // An error occurred in the "oncomplete" handler.
            // It's too late to call "onerror" or "onabort". Throw a global error instead.
            // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
            me.__errored = true;
            throw e;
        } finally {
            me.__storeClones = {};
        }
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction$1.prototype.__createRequest = function (source) {
    var request = new IDBRequest();
    request.__source = source !== undefined ? source : this.db;
    request.__transaction = this;
    return request;
};

/**
 * Adds a callback function to the transaction queue
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction$1.prototype.__addToTransactionQueue = function (callback, args, source) {
    var request = this.__createRequest(source);
    this.__pushToQueue(request, callback, args);
    return request;
};

/**
 * Adds a callback function to the transaction queue without generating a request
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction$1.prototype.__addNonRequestToTransactionQueue = function (callback, args, source) {
    this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue
 * @param {IDBRequest} request
 * @param {function} callback
 * @param {*} args
 * @protected
 */
IDBTransaction$1.prototype.__pushToQueue = function (request, callback, args) {
    this.__assertActive();
    this.__requests.push({
        'op': callback,
        'args': args,
        'req': request
    });
};

IDBTransaction$1.prototype.__assertActive = function () {
    if (!this.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

IDBTransaction$1.prototype.__assertWritable = function () {
    if (this.mode === 'readonly') {
        throw createDOMException('ReadOnlyError', 'The transaction is read only');
    }
};

IDBTransaction$1.prototype.__assertVersionChange = function () {
    IDBTransaction$1.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @returns {IDBObjectStore}
 */
IDBTransaction$1.prototype.objectStore = function (objectStoreName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    if (!this.__active) {
        throw createDOMException('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    if (this.__objectStoreNames.indexOf(objectStoreName) === -1) {
        throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    var store = this.db.__objectStores[objectStoreName];
    if (!store) {
        throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + this.db.name);
    }

    if (!this.__storeClones[objectStoreName]) {
        this.__storeClones[objectStoreName] = IDBObjectStore.__clone(store, this);
    }
    return this.__storeClones[objectStoreName];
};

IDBTransaction$1.prototype.__abortTransaction = function (err) {
    var me = this;
    me.__active = false; // Setting here and in transactionFinished for https://github.com/w3c/IndexedDB/issues/87
    function abort(tx, errOrResult) {
        if (!tx) {
            CFG.DEBUG && console.log('Rollback not possible due to missing transaction', me);
        } else if (typeof errOrResult.code === 'number') {
            CFG.DEBUG && console.log('Rollback erred; feature is probably not supported as per WebSQL', me);
        } else {
            CFG.DEBUG && console.log('Rollback succeeded', me);
        }

        // Todo: Steps for aborting an upgrade transaction

        if (err !== null) {
            me.__error = err;
        }

        logError('Error', 'An error occurred in a transaction', err);
        if (me.__errored) {
            // We've already called "onerror", "onabort", or thrown, so don't do it again.
            return;
        }
        me.__errored = true;
        if (me.__transactionFinished) {
            // The transaction has already completed, so we can't call "onerror" or "onabort".
            // So throw the error instead.
            setTimeout(function () {
                throw err;
            }, 0);
        }

        me.__requests.filter(function (q) {
            return q.req && q.req.__readyState !== 'done';
        }).reduce(function (promises, q) {
            // We reduce to a chain of promises to be queued in order, so we cannot use `Promise.all`
            //  and I'm unsure whether `setTimeout` currently behaves first-in-first-out with the same timeout
            //  so we could just use a `forEach`.
            return promises.then(function () {
                var reqEvt = createEvent('error', null, { bubbles: true, cancelable: true });
                q.req.__readyState = 'done';
                q.req.__result = undefined;
                q.req.__error = createDOMException('AbortError', 'A request was aborted.');
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        q.req.dispatchEvent(reqEvt); // No need to catch errors
                        resolve();
                    }, 0);
                });
            });
        }, Promise.resolve()).then(function () {
            // Also works when there are no pending requests
            var evt = createEvent('abort', err, { bubbles: true, cancelable: false });
            me.dispatchEvent(evt);
            me.__storeClones = {};
            me.dispatchEvent(createEvent('__abort'));
        });
    }

    if (me.__tx) {
        // Not supported in standard SQL (and WebSQL errors should
        //   rollback automatically), but for Node.js, etc., we give chance for
        //   manual aborts which would otherwise not work.
        abort(null, { code: 0 });
        // me.__tx.executeSql('ROLLBACK', [], abort, abort); // Not working in some circumstances, even in node
    } else {
        abort(null, { code: 0 });
    }
};

IDBTransaction$1.prototype.abort = function () {
    var me = this;
    CFG.DEBUG && console.log('The transaction was aborted', me);
    if (!this.__active) {
        throw createDOMException('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    me.__abortTransaction(null);
};
IDBTransaction$1.prototype.toString = function () {
    return '[object IDBTransaction]';
};

IDBTransaction$1.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== 'versionchange') {
        throw createDOMException('InvalidStateError', 'Not a version transaction');
    }
};
IDBTransaction$1.__assertNotVersionChange = function (tx) {
    if (tx && tx.mode === 'versionchange') {
        throw createDOMException('InvalidStateError', 'Cannot be called during a version transaction');
    }
};

IDBTransaction$1.__assertActive = function (tx) {
    if (!tx || !tx.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
* Used by our EventTarget.prototype library to implement bubbling/capturing
*/
IDBTransaction$1.prototype.__getParent = function () {
    return this.db;
};
/**
* Used by our EventTarget.prototype library to detect errors in user handlers
*/
IDBTransaction$1.prototype.__userErrorEventHandler = function (error, triggerGlobalErrorEvent) {
    if (this.__internal) {
        this.__internal = false;
        throw error;
    }
    triggerGlobalErrorEvent();
};

defineReadonlyProperties(IDBTransaction$1.prototype, ['objectStoreNames', 'mode', 'db', 'error']);

Object.assign(IDBTransaction$1.prototype, EventTarget$1.prototype);

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase(db, name, version, storeProperties) {
    var _this = this;

    this.__db = db;
    this.__closed = false;
    this.__version = version;
    this.__name = name;
    this.onabort = this.onerror = this.onversionchange = null;

    this.__objectStores = {};
    this.__objectStoreNames = new StringList();
    var itemCopy = {};

    var _loop = function _loop(i) {
        var item = storeProperties.rows.item(i);
        // Safari implements `item` getter return object's properties
        //  as readonly, so we copy all its properties (except our
        //  custom `currNum` which we don't need) onto a new object
        itemCopy.name = item.name;
        ['keyPath', 'autoInc', 'indexList'].forEach(function (prop) {
            itemCopy[prop] = JSON.parse(item[prop]);
        });
        itemCopy.idbdb = _this;
        var store = new IDBObjectStore(itemCopy);
        _this.__objectStores[store.name] = store;
        _this.objectStoreNames.push(store.name);
    };

    for (var i = 0; i < storeProperties.rows.length; i++) {
        _loop(i);
    }
}

/**
 * Creates a new object store.
 * @param {string} storeName
 * @param {object} [createOptions]
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName, createOptions) {
    storeName = String(storeName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    IDBTransaction$1.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess
    IDBTransaction$1.__assertActive(this.__versionTransaction);
    if (this.__objectStores[storeName]) {
        throw createDOMException('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
    }
    createOptions = Object.assign({}, createOptions);
    if (createOptions.keyPath === undefined) {
        createOptions.keyPath = null;
    }

    var keyPath = createOptions.keyPath;
    var autoIncrement = createOptions.autoIncrement;

    if (keyPath !== null && !isValidKeyPath(keyPath)) {
        throw createDOMException('SyntaxError', 'The keyPath argument contains an invalid key path.');
    }
    if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
        throw createDOMException('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
    }

    /** @name IDBObjectStoreProperties **/
    var storeProperties = {
        name: storeName,
        keyPath: keyPath,
        autoInc: autoIncrement,
        indexList: {},
        idbdb: this
    };
    var store = new IDBObjectStore(storeProperties, this.__versionTransaction);
    IDBObjectStore.__createObjectStore(this, store);
    return store;
};

/**
 * Deletes an object store.
 * @param {string} storeName
 */
IDBDatabase.prototype.deleteObjectStore = function (storeName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    IDBTransaction$1.__assertVersionChange(this.__versionTransaction);
    IDBTransaction$1.__assertActive(this.__versionTransaction);
    delete this.__versionTransaction.__storeClones[storeName];

    var store = this.__objectStores[storeName];
    if (!store) {
        throw createDOMException('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
    }

    IDBObjectStore.__deleteObjectStore(this, store);
};

IDBDatabase.prototype.close = function () {
    this.__closed = true;
};

/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @param {string} mode
 * @returns {IDBTransaction}
 */
IDBDatabase.prototype.transaction = function (storeNames, mode) {
    var _this2 = this;

    if (typeof mode === 'number') {
        mode = mode === 1 ? 'readwrite' : 'readonly';
        CFG.DEBUG && console.log('Mode should be a string, but was specified as ', mode); // Todo: Remove this option as no longer in spec
    } else {
        mode = mode || 'readonly';
    }

    if (mode !== 'readonly' && mode !== 'readwrite') {
        throw new TypeError('Invalid transaction mode: ' + mode);
    }

    IDBTransaction$1.__assertNotVersionChange(this.__versionTransaction);
    if (this.__closed) {
        throw createDOMException('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
    }

    storeNames = typeof storeNames === 'string' ? [storeNames] : storeNames;
    storeNames.forEach(function (storeName) {
        if (!_this2.objectStoreNames.contains(storeName)) {
            throw createDOMException('NotFoundError', 'The "' + storeName + '" object store does not exist');
        }
    });
    if (storeNames.length === 0) {
        throw createDOMException('InvalidAccessError', 'No object store names were specified');
    }
    // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
    return new IDBTransaction$1(this, storeNames, mode);
};
IDBDatabase.prototype.toString = function () {
    return '[object IDBDatabase]';
};

defineReadonlyProperties(IDBDatabase.prototype, ['name', 'version', 'objectStoreNames']);

Object.assign(IDBDatabase.prototype, EventTarget$1.prototype);

var _typeof$4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var sysdb = void 0;

/**
 * Craetes the sysDB to keep track of version numbers for databases
 **/
function createSysDB(success, failure) {
    function sysDbCreateError() /* tx, err */{
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var err = findError(args);
        CFG.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = CFG.win.openDatabase('__sysdb__.sqlite', 1, 'System Database', CFG.DEFAULT_DB_SIZE);
        sysdb.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);', [], success, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class
 * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @constructor
 */
function IDBFactory() {
    this.modules = { DOMException: DOMException$1, Event: typeof Event !== 'undefined' ? Event : ShimEvent, ShimEvent: ShimEvent, IDBFactory: IDBFactory };
}

/**
 * The IndexedDB Method to create a new database and return the DB
 * @param {string} name
 * @param {number} version
 */
IDBFactory.prototype.open = function (name, version) {
    var req = new IDBOpenDBRequest();
    var calledDbCreateError = false;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    } else if (arguments.length >= 2) {
        version = Number(version);
        if (isNaN(version) || !isFinite(version) || version >= 0x20000000000000 || // 2 ** 53
        version < 1) {
            // The spec only mentions version==0 as throwing, but W3C tests fail with these
            throw new TypeError('Invalid database version: ' + version);
        }
    }
    name = String(name); // cast to a string

    function dbCreateError() /* tx, err */{
        if (calledDbCreateError) {
            return;
        }

        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        var err = findError(args);
        calledDbCreateError = true;
        var evt = createEvent('error', args, { bubbles: true });
        req.__readyState = 'done';
        req.__error = err || DOMException$1;
        req.dispatchEvent(evt);
    }

    function openDB(oldVersion) {
        var db = CFG.win.openDatabase(escapeDatabaseName(name), 1, name, CFG.DEFAULT_DB_SIZE);
        req.__readyState = 'done';
        if (version === undefined) {
            version = oldVersion || 1;
        }
        if (oldVersion > version) {
            var err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            dbCreateError(err);
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
                tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                    req.__result = new IDBDatabase(db, name, version, data);
                    if (oldVersion < version) {
                        // DB Upgrade in progress
                        sysdb.transaction(function (systx) {
                            systx.executeSql('UPDATE dbVersions SET version = ? WHERE name = ?', [version, name], function () {
                                var e = new IDBVersionChangeEvent('upgradeneeded', { oldVersion: oldVersion, newVersion: version });
                                req.__transaction = req.result.__versionTransaction = new IDBTransaction$1(req.result, req.result.objectStoreNames, 'versionchange');
                                req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded(tx, args, success, error) {
                                    req.dispatchEvent(e);
                                    success();
                                });
                                req.transaction.on__beforecomplete = function () {
                                    req.result.__versionTransaction = null;
                                };
                                req.transaction.on__abort = function () {
                                    var err = createDOMException('AbortError', 'The upgrade transaction was aborted.');
                                    dbCreateError(err);
                                };
                                req.transaction.on__complete = function () {
                                    req.__transaction = null;
                                    if (req.__result.__closed) {
                                        var _err = createDOMException('AbortError', 'The connection has been closed.');
                                        dbCreateError(_err);
                                        return;
                                    }
                                    var e = createEvent('success');
                                    req.dispatchEvent(e);
                                };
                            }, dbCreateError);
                        }, dbCreateError);
                    } else {
                        var e = createEvent('success');
                        req.dispatchEvent(e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT * FROM dbVersions WHERE name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    // Database with this name does not exist
                    tx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [name, version || 1], function () {
                        openDB(0);
                    }, dbCreateError);
                } else {
                    openDB(data.rows.item(0).version);
                }
            }, dbCreateError);
        }, dbCreateError);
    }, dbCreateError);

    return req;
};

/**
 * Deletes a database
 * @param {string} name
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
    var req = new IDBOpenDBRequest();
    var calledDBError = false;
    var version = null;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    name = String(name); // cast to a string

    function dbError() /* tx, err */{
        if (calledDBError) {
            return;
        }

        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
        }

        var err = findError(args);
        req.__readyState = 'done';
        req.__error = err || DOMException$1;
        var e = createEvent('error', args, { bubbles: true });
        req.dispatchEvent(e);
        calledDBError = true;
    }

    function deleteFromDbVersions() {
        sysdb.transaction(function (systx) {
            systx.executeSql('DELETE FROM dbVersions WHERE name = ? ', [name], function () {
                req.__result = undefined;
                req.__readyState = 'done';
                var e = new IDBVersionChangeEvent('success', { oldVersion: version, newVersion: null });
                req.dispatchEvent(e);
            }, dbError);
        }, dbError);
    }

    createSysDB(function () {
        sysdb.transaction(function (systx) {
            systx.executeSql('SELECT * FROM dbVersions WHERE name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    req.__result = undefined;
                    var e = new IDBVersionChangeEvent('success', { oldVersion: version, newVersion: null });
                    req.dispatchEvent(e);
                    return;
                }
                version = data.rows.item(0).version;
                var db = CFG.win.openDatabase(escapeDatabaseName(name), 1, name, CFG.DEFAULT_DB_SIZE);
                db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                        var tables = data.rows;
                        (function deleteTables(i) {
                            if (i >= tables.length) {
                                // If all tables are deleted, delete the housekeeping tables
                                tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
                                    // Finally, delete the record for this DB from sysdb
                                    deleteFromDbVersions();
                                }, dbError);
                            } else {
                                // Delete all tables in this database, maintained in the sys table
                                tx.executeSql('DROP TABLE ' + escapeStore(tables.item(i).name), [], function () {
                                    deleteTables(i + 1);
                                }, function () {
                                    deleteTables(i + 1);
                                });
                            }
                        })(0);
                    }, function (e) {
                        // __sysdb table does not exist, but that does not mean delete did not happen
                        deleteFromDbVersions();
                    });
                });
            }, dbError);
        }, dbError);
    }, dbError);

    return req;
};

/**
 * Compares two keys
 * @param key1
 * @param key2
 * @returns {number}
 */
function cmp(key1, key2) {
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }

    Key.convertValueToKey(key1);
    Key.convertValueToKey(key2);
    var encodedKey1 = Key.encode(key1);
    var encodedKey2 = Key.encode(key2);
    var result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;

    if (CFG.DEBUG) {
        // verify that the keys encoded correctly
        var decodedKey1 = Key.decode(encodedKey1);
        var decodedKey2 = Key.decode(encodedKey2);
        if ((typeof key1 === 'undefined' ? 'undefined' : _typeof$4(key1)) === 'object') {
            key1 = JSON.stringify(key1);
            decodedKey1 = JSON.stringify(decodedKey1);
        }
        if ((typeof key2 === 'undefined' ? 'undefined' : _typeof$4(key2)) === 'object') {
            key2 = JSON.stringify(key2);
            decodedKey2 = JSON.stringify(decodedKey2);
        }

        // encoding/decoding mismatches are usually due to a loss of floating-point precision
        if (decodedKey1 !== key1) {
            console.warn(key1 + ' was incorrectly encoded as ' + decodedKey1);
        }
        if (decodedKey2 !== key2) {
            console.warn(key2 + ' was incorrectly encoded as ' + decodedKey2);
        }
    }

    return result;
}

IDBFactory.prototype.cmp = cmp;

/**
* NON-STANDARD!! (Also may return outdated information if a database has since been deleted)
* @link https://www.w3.org/Bugs/Public/show_bug.cgi?id=16137
* @link http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1537.html
*/
IDBFactory.prototype.webkitGetDatabaseNames = function () {
    var calledDbCreateError = false;
    function dbGetDatabaseNamesError() /* tx, err */{
        if (calledDbCreateError) {
            return;
        }

        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
        }

        var err = findError(args);
        calledDbCreateError = true;
        var evt = createEvent('error', args, { bubbles: true, cancelable: true }); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
        req.__readyState = 'done';
        req.__error = err || DOMException$1;
        req.dispatchEvent(evt);
    }
    var req = new IDBRequest();
    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT name FROM dbVersions', [], function (tx, data) {
                var dbNames = new StringList();
                for (var i = 0; i < data.rows.length; i++) {
                    dbNames.push(data.rows.item(i).name);
                }
                req.__result = dbNames;
                req.__readyState = 'done';
                var e = createEvent('success'); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
                req.dispatchEvent(e);
            }, dbGetDatabaseNamesError);
        }, dbGetDatabaseNamesError);
    }, dbGetDatabaseNamesError);
    return req;
};

IDBFactory.prototype.toString = function () {
    return '[object IDBFactory]';
};

var shimIndexedDB = new IDBFactory();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The IndexedDB Cursor Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @param {IDBObjectStore} store
 * @param {IDBObjectStore|IDBIndex} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 */
function IDBCursor(range, direction, store, source, keyColumnName, valueColumnName, count) {
    // Calling openCursor on an index or objectstore with null is allowed but we treat it as undefined internally
    IDBTransaction$1.__assertActive(store.transaction);
    if (range === null) {
        range = undefined;
    }
    if (instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else if (range !== undefined) {
        range = new IDBKeyRange(range, range, false, false);
    }
    if (direction !== undefined && !['next', 'prev', 'nextunique', 'prevunique'].includes(direction)) {
        throw new TypeError(direction + 'is not a valid cursor direction');
    }

    Object.defineProperties(this, {
        // Babel is not respecting default writable false here, so make explicit
        source: { writable: false, value: source },
        direction: { writable: false, value: direction || 'next' }
    });
    this.__key = undefined;
    this.__primaryKey = undefined;

    this.__store = store;
    this.__range = range;
    this.__req = new IDBRequest();
    this.__req.__source = source;
    this.__req.__transaction = this.__store.transaction;
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__keyOnly = valueColumnName === 'key';
    this.__valueDecoder = this.__keyOnly ? Key : Sca;
    this.__count = count;
    this.__prefetchedIndex = -1;
    this.__indexSource = instanceOf(source, IDBIndex);
    this.__multiEntryIndex = this.__indexSource ? source.multiEntry : false;
    this.__unique = this.direction.includes('unique');
    this.__sqlDirection = ['prev', 'prevunique'].includes(this.direction) ? 'DESC' : 'ASC';

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lowerCached = range.lower !== undefined && Key.encode(range.lower, this.__multiEntryIndex);
        range.__upperCached = range.upper !== undefined && Key.encode(range.upper, this.__multiEntryIndex);
    }
    this.__gotValue = true;
    this['continue']();
}

IDBCursor.prototype.__find = function () /* key, tx, success, error, recordsToLoad */{
    if (this.__multiEntryIndex) {
        this.__findMultiEntry.apply(this, arguments);
    } else {
        this.__findBasic.apply(this, arguments);
    }
};

IDBCursor.prototype.__findBasic = function (key, tx, success, error, recordsToLoad) {
    var continueCall = recordsToLoad !== undefined;
    recordsToLoad = recordsToLoad || 1;

    var me = this;
    var quotedKeyColumnName = quote(me.__keyColumnName);
    var sql = ['SELECT * FROM', escapeStore(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    setSQLForRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.__sqlDirection;
    var op = direction === 'ASC' ? '>' : '<';

    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        Key.convertValueToKey(key);
        sqlValues.push(Key.encode(key));
    } else if (continueCall && me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        Key.convertValueToKey(me.__key);
        sqlValues.push(Key.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction); // Todo: Any reason for this first sorting?

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') {
            // Avoid adding 'key' twice
            sql.push(',', quote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', quote(me.__valueColumnName), direction);
        }
        sql.push('LIMIT', recordsToLoad);
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedIndex = 0;
            me.__prefetchedData = data.rows;
            CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
            me.__decode(data.rows.item(0), success);
        } else if (data.rows.length === 1) {
            me.__decode(data.rows.item(0), success);
        } else {
            CFG.DEBUG && console.log('Reached end of cursors');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

IDBCursor.prototype.__findMultiEntry = function (key, tx, success, error) {
    var me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        CFG.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
        return;
    }

    var quotedKeyColumnName = quote(me.__keyColumnName);
    var sql = ['SELECT * FROM', escapeStore(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && me.__range.lower !== undefined && Array.isArray(me.__range.upper)) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
            sqlValues.push('%' + sqlLIKEEscape(me.__range.__lowerCached.slice(0, -1)) + '%');
        }
    }

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.__sqlDirection;
    var op = direction === 'ASC' ? '>' : '<';

    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        Key.convertValueToKey(key);
        sqlValues.push(Key.encode(key));
    } else if (me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        Key.convertValueToKey(me.__key);
        sqlValues.push(Key.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction); // Todo: Any reason for this first sorting?

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') {
            // Avoid adding 'key' twice
            sql.push(',', quote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', quote(me.__valueColumnName), direction);
        }
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (data.rows.length > 0) {
            var _ret = function () {
                if (me.__count) {
                    // Avoid caching and other processing below
                    var ct = 0;
                    for (var i = 0; i < data.rows.length; i++) {
                        var rowItem = data.rows.item(i);
                        var rowKey = Key.decode(rowItem[me.__keyColumnName], true);
                        var matches = Key.findMultiEntryMatches(rowKey, me.__range);
                        ct += matches.length;
                    }
                    success(undefined, ct, undefined);
                    return {
                        v: void 0
                    };
                }
                var rows = [];
                for (var _i = 0; _i < data.rows.length; _i++) {
                    var _rowItem = data.rows.item(_i);
                    var _rowKey = Key.decode(_rowItem[me.__keyColumnName], true);
                    var _matches = Key.findMultiEntryMatches(_rowKey, me.__range);

                    for (var j = 0; j < _matches.length; j++) {
                        var matchingKey = _matches[j];
                        var clone = {
                            matchingKey: Key.encode(matchingKey, true),
                            key: _rowItem.key
                        };
                        clone[me.__keyColumnName] = _rowItem[me.__keyColumnName];
                        clone[me.__valueColumnName] = _rowItem[me.__valueColumnName];
                        rows.push(clone);
                    }
                }
                var reverse = me.direction.indexOf('prev') === 0;
                rows.sort(function (a, b) {
                    if (a.matchingKey.replace('[', 'z') < b.matchingKey.replace('[', 'z')) {
                        return reverse ? 1 : -1;
                    }
                    if (a.matchingKey.replace('[', 'z') > b.matchingKey.replace('[', 'z')) {
                        return reverse ? -1 : 1;
                    }
                    if (a.key < b.key) {
                        return me.direction === 'prev' ? 1 : -1;
                    }
                    if (a.key > b.key) {
                        return me.direction === 'prev' ? -1 : 1;
                    }
                    return 0;
                });

                if (rows.length > 1) {
                    me.__prefetchedIndex = 0;
                    me.__prefetchedData = {
                        data: rows,
                        length: rows.length,
                        item: function item(index) {
                            return this.data[index];
                        }
                    };
                    CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
                    me.__decode(rows[0], success);
                } else if (rows.length === 1) {
                    CFG.DEBUG && console.log('Reached end of multiEntry cursor');
                    me.__decode(rows[0], success);
                } else {
                    CFG.DEBUG && console.log('Reached end of multiEntry cursor');
                    success(undefined, undefined, undefined);
                }
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof$2(_ret)) === "object") return _ret.v;
        } else {
            CFG.DEBUG && console.log('Reached end of multiEntry cursor');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

/**
 * Creates an "onsuccess" callback
 * @private
 */
IDBCursor.prototype.__onsuccess = function (success) {
    var me = this;
    return function (key, value, primaryKey) {
        me.__gotValue = true;
        if (me.__count) {
            success(value, me.__req);
        } else {
            me.__key = key === undefined ? null : key;
            me.__primaryKey = primaryKey === undefined ? null : primaryKey;
            me.__value = value === undefined ? null : value;
            var result = key === undefined ? null : me;
            success(result, me.__req);
        }
    };
};

IDBCursor.prototype.__decode = function (rowItem, callback) {
    if (this.__multiEntryIndex && this.__unique) {
        if (!this.__matchedKeys) {
            this.__matchedKeys = {};
        }
        if (this.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined);
            return;
        }
        this.__matchedKeys[rowItem.matchingKey] = true;
    }
    var key = Key.decode(this.__multiEntryIndex ? rowItem.matchingKey : rowItem[this.__keyColumnName], this.__multiEntryIndex);
    var val = this.__valueDecoder.decode(rowItem[this.__valueColumnName]);
    var primaryKey = Key.decode(rowItem.key);
    callback(key, val, primaryKey);
};

IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
    if (!this.__store.transaction.db.objectStoreNames.contains(this.__store.name) || this.__indexSource && !this.__store.indexNames.contains(this.source.name)) {
        throw createDOMException('InvalidStateError', 'The cursor\'s source or effective object store has been deleted');
    }
};

IDBCursor.prototype.__addToCache = function () {
    this.__prefetchedData = null;
};

IDBCursor.prototype.__deleteFromCache = function (sql, sqlValues) {
    this.__prefetchedData = null;
};

IDBCursor.prototype.__clearFromCache = function () {
    this.__prefetchedData = null;
};

IDBCursor.prototype.__continue = function (key, advanceContinue) {
    var me = this;
    var recordsToPreloadOnContinue = me.__advanceCount || CFG.cursorPreloadPackSize || 100;
    var advanceState = me.__advanceCount !== undefined;
    IDBTransaction$1.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue && !advanceContinue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (key !== undefined) Key.convertValueToKey(key);

    if (key !== undefined) {
        var cmpResult = cmp(key, me.key);
        if (cmpResult === 0 || me.direction.includes('next') && cmpResult === -1 || me.direction.includes('prev') && cmpResult === 1) {
            throw createDOMException('DataError', 'Cannot ' + (advanceState ? 'advance' : 'continue') + ' the cursor in an unexpected direction');
        }
    }

    me.__gotValue = false;
    me.__req.__readyState = 'pending'; // Unset done flag

    me.__store.transaction.__pushToQueue(me.__req, function cursorContinue(tx, args, success, error, executeNextRequest) {
        function triggerSuccess(k, val, primKey) {
            if (advanceState) {
                if (me.__advanceCount >= 2 && k !== undefined) {
                    me.__advanceCount--;
                    me.__key = k;
                    me.__continue(undefined, true);
                    executeNextRequest(); // We don't call success yet but do need to advance the transaction queue
                    return;
                }
                me.__advanceCount = undefined;
            }
            me.__onsuccess(success)(k, val, primKey);
        }
        if (me.__prefetchedData) {
            // We have pre-loaded data for the cursor
            me.__prefetchedIndex++;
            if (me.__prefetchedIndex < me.__prefetchedData.length) {
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), function (k, val, primKey) {
                    function checkKey() {
                        if (key !== undefined && k !== key) {
                            cursorContinue(tx, args, success, error);
                            return;
                        }
                        triggerSuccess(k, val, primKey);
                    }
                    if (me.__unique && !me.__multiEntryIndex) {
                        Sca.encode(val, function (encVal) {
                            Sca.encode(me.value, function (encMeVal) {
                                if (encVal === encMeVal) {
                                    cursorContinue(tx, args, success, error);
                                    return;
                                }
                                checkKey();
                            });
                        });
                        return;
                    }
                    checkKey();
                });
                return;
            }
        }

        // No (or not enough) pre-fetched data, do query
        me.__find(key, tx, triggerSuccess, function () {
            me.__advanceCount = undefined;
            error.apply(undefined, arguments);
        }, recordsToPreloadOnContinue);
    });
};

IDBCursor.prototype['continue'] = function (key) {
    this.__continue(key);
};

/*
// Todo: Implement continuePrimaryKey
IDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {};
*/

IDBCursor.prototype.advance = function (count) {
    var me = this;
    if (!Number.isFinite(count) || count <= 0) {
        throw new TypeError('Count is invalid - 0 or negative: ' + count);
    }
    if (me.__gotValue) {
        // Only set the count if not running in error (otherwise will override earlier good advance calls)
        me.__advanceCount = count;
    }
    me.__continue();
};

IDBCursor.prototype.update = function (valueToUpdate) {
    var me = this;
    if (!arguments.length) throw new TypeError('A value must be passed to update()');
    IDBTransaction$1.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    throwIfNotClonable(valueToUpdate, 'The data to be updated could not be cloned by the internal structured cloning algorithm.');
    if (me.__store.keyPath !== null) {
        var evaluatedKey = me.__store.__validateKeyAndValue(valueToUpdate);
        if (me.primaryKey !== evaluatedKey) {
            throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
        }
    }
    return me.__store.transaction.__addToTransactionQueue(function cursorUpdate(tx, args, success, error) {
        var key = me.key;
        var primaryKey = me.primaryKey;
        var store = me.__store;
        Sca.encode(valueToUpdate, function (encoded) {
            var value = Sca.decode(encoded);
            Sca.encode(value, function (encoded) {
                // First try to delete if the record exists
                Key.convertValueToKey(primaryKey);
                var sql = 'DELETE FROM ' + escapeStore(store.name) + ' WHERE key = ?';
                var encodedPrimaryKey = Key.encode(primaryKey);
                CFG.DEBUG && console.log(sql, encoded, key, primaryKey, encodedPrimaryKey);

                tx.executeSql(sql, [encodedPrimaryKey], function (tx, data) {
                    CFG.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);

                    store.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                        store.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                            store.__cursors.forEach(function (cursor) {
                                cursor.__deleteFromCache();
                                cursor.__addToCache();
                            });
                            success.apply(undefined, arguments);
                        }, error);
                    }, function (tx, err) {
                        error(err);
                    });
                });
            });
        });
    }, undefined, me);
};

IDBCursor.prototype['delete'] = function () {
    var me = this;
    IDBTransaction$1.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    return this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error) {
        me.__find(undefined, tx, function (key, value, primaryKey) {
            var sql = 'DELETE FROM  ' + escapeStore(me.__store.name) + ' WHERE key = ?';
            CFG.DEBUG && console.log(sql, key, primaryKey);
            Key.convertValueToKey(primaryKey);
            tx.executeSql(sql, [Key.encode(primaryKey)], function (tx, data) {
                if (data.rowsAffected === 1) {
                    me.__store.__cursors.forEach(function (cursor) {
                        cursor.__deleteFromCache();
                    });
                    success(undefined);
                } else {
                    error('No rows with key found' + key);
                }
            }, function (tx, data) {
                error(data);
            });
        }, error);
    }, undefined, me);
};

IDBCursor.prototype.toString = function () {
    return '[object IDBCursor]';
};

defineReadonlyProperties(IDBCursor.prototype, ['key', 'primaryKey']);

var IDBCursorWithValue = function (_IDBCursor) {
    _inherits(IDBCursorWithValue, _IDBCursor);

    function IDBCursorWithValue() {
        _classCallCheck(this, IDBCursorWithValue);

        return _possibleConstructorReturn(this, (IDBCursorWithValue.__proto__ || Object.getPrototypeOf(IDBCursorWithValue)).apply(this, arguments));
    }

    _createClass(IDBCursorWithValue, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBCursorWithValue]';
        }
    }]);

    return IDBCursorWithValue;
}(IDBCursor);

defineReadonlyProperties(IDBCursorWithValue.prototype, 'value');

var _typeof$7 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// Todo: polyfill IDBVersionChangeEvent, IDBOpenDBRequest?

/**
 * Polyfills missing features in the browser's native IndexedDB implementation.
 * This is used for browsers that DON'T support WebSQL but DO support IndexedDB
 */
function polyfill() {
    if (navigator.userAgent.match(/MSIE/) || navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/Edge/)) {
        // Internet Explorer's native IndexedDB does not support compound keys
        compoundKeyPolyfill();
    }
}

/**
 * Polyfills support for compound keys
 */
function compoundKeyPolyfill(IDBCursor, IDBCursorWithValue, IDBDatabase, IDBFactory, IDBIndex, IDBKeyRange, IDBObjectStore, IDBRequest, IDBTransaction) {
    var cmp = IDBFactory.prototype.cmp;
    var createObjectStore = IDBDatabase.prototype.createObjectStore;
    var createIndex = IDBObjectStore.prototype.createIndex;
    var add = IDBObjectStore.prototype.add;
    var put = IDBObjectStore.prototype.put;
    var indexGet = IDBIndex.prototype.get;
    var indexGetKey = IDBIndex.prototype.getKey;
    var indexCursor = IDBIndex.prototype.openCursor;
    var indexKeyCursor = IDBIndex.prototype.openKeyCursor;
    var storeGet = IDBObjectStore.prototype.get;
    var storeDelete = IDBObjectStore.prototype.delete;
    var storeCursor = IDBObjectStore.prototype.openCursor;
    var storeKeyCursor = IDBObjectStore.prototype.openKeyCursor;
    var bound = IDBKeyRange.bound;
    var upperBound = IDBKeyRange.upperBound;
    var lowerBound = IDBKeyRange.lowerBound;
    var only = IDBKeyRange.only;
    var requestResult = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'result');
    var cursorPrimaryKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'primaryKey');
    var cursorKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'key');
    var cursorValue = Object.getOwnPropertyDescriptor(IDBCursorWithValue.prototype, 'value');

    IDBFactory.prototype.cmp = function (key1, key2) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key1)) {
            args[0] = encodeCompoundKey(key1);
        }
        if (Array.isArray(key2)) {
            args[1] = encodeCompoundKey(key2);
        }
        return cmp.apply(this, args);
    };

    IDBDatabase.prototype.createObjectStore = function (name, opts) {
        if (opts && Array.isArray(opts.keyPath)) {
            opts.keyPath = encodeCompoundKeyPath(opts.keyPath);
        }
        return createObjectStore.apply(this, arguments);
    };

    IDBObjectStore.prototype.createIndex = function (name, keyPath, opts) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(keyPath)) {
            args[1] = encodeCompoundKeyPath(keyPath);
        }
        return createIndex.apply(this, args);
    };

    IDBObjectStore.prototype.add = function () /* value, key */{
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return this.__insertData(add, args);
    };

    IDBObjectStore.prototype.put = function () /* value, key */{
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        return this.__insertData(put, args);
    };

    IDBObjectStore.prototype.__insertData = function (method, args) {
        args = Array.prototype.slice.call(args);
        var value = args[0];
        var key = args[1];

        // out-of-line key
        if (Array.isArray(key)) {
            args[1] = encodeCompoundKey(key);
        }

        if ((typeof value === 'undefined' ? 'undefined' : _typeof$7(value)) === 'object') {
            // inline key
            if (isCompoundKey(this.keyPath)) {
                setInlineCompoundKey(value, this.keyPath);
            }

            // inline indexes
            for (var i = 0; i < this.indexNames.length; i++) {
                var index = this.index(this.indexNames[i]);
                if (isCompoundKey(index.keyPath)) {
                    try {
                        setInlineCompoundKey(value, index.keyPath, index.multiEntry);
                    } catch (e) {
                        // The value doesn't have a valid key for this index.
                    }
                }
            }
        }
        return method.apply(this, args);
    };

    IDBIndex.prototype.get = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGet.apply(this, args);
    };

    IDBIndex.prototype.getKey = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGetKey.apply(this, args);
    };

    IDBIndex.prototype.openCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexCursor.apply(this, args);
    };

    IDBIndex.prototype.openKeyCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexKeyCursor.apply(this, args);
    };

    IDBObjectStore.prototype.get = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeGet.apply(this, args);
    };

    IDBObjectStore.prototype.delete = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeDelete.apply(this, args);
    };

    IDBObjectStore.prototype.openCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeCursor.apply(this, args);
    };

    IDBObjectStore.prototype.openKeyCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeKeyCursor.apply(this, args);
    };

    IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(lower)) {
            args[0] = encodeCompoundKey(lower);
        }
        if (Array.isArray(upper)) {
            args[1] = encodeCompoundKey(upper);
        }
        return bound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.upperBound = function (key, open) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return upperBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.lowerBound = function (key, open) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return lowerBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.only = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return only.apply(IDBKeyRange, args);
    };

    Object.defineProperty(IDBRequest.prototype, 'result', {
        enumerable: requestResult.enumerable,
        configurable: requestResult.configurable,
        get: function get() {
            var result = requestResult.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'primaryKey', {
        enumerable: cursorPrimaryKey.enumerable,
        configurable: cursorPrimaryKey.configurable,
        get: function get() {
            var result = cursorPrimaryKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'key', {
        enumerable: cursorKey.enumerable,
        configurable: cursorKey.configurable,
        get: function get() {
            var result = cursorKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursorWithValue.prototype, 'value', {
        enumerable: cursorValue.enumerable,
        configurable: cursorValue.configurable,
        get: function get() {
            var result = cursorValue.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });
}

var compoundKeysPropertyName = '__$$compoundKey';
var propertySeparatorRegExp = /\$\$/g;
var propertySeparator = '$$$$'; // "$$" after RegExp escaping
var keySeparator = '$_$';

function isCompoundKey(keyPath) {
    return keyPath && keyPath.indexOf(compoundKeysPropertyName + '.') === 0;
}

function encodeCompoundKeyPath(keyPath) {
    // Encoded dotted properties
    // ["name.first", "name.last"] ==> ["name$$first", "name$$last"]
    for (var i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(/\./g, propertySeparator);
    }

    // Encode the array as a single property
    // ["name$$first", "name$$last"] => "__$$compoundKey.name$$first$_$name$$last"
    return compoundKeysPropertyName + '.' + keyPath.join(keySeparator);
}

function decodeCompoundKeyPath(keyPath) {
    // Remove the "__$$compoundKey." prefix
    keyPath = keyPath.substr(compoundKeysPropertyName.length + 1);

    // Split the properties into an array
    // "name$$first$_$name$$last" ==> ["name$$first", "name$$last"]
    keyPath = keyPath.split(keySeparator);

    // Decode dotted properties
    // ["name$$first", "name$$last"] ==> ["name.first", "name.last"]
    for (var i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(propertySeparatorRegExp, '.');
    }
    return keyPath;
}

function setInlineCompoundKey(value, encodedKeyPath, multiEntry) {
    // Encode the key
    var keyPath = decodeCompoundKeyPath(encodedKeyPath);
    var key = Key.evaluateKeyPathOnValue(value, keyPath, multiEntry);
    var encodedKey = encodeCompoundKey(key);

    // Store the encoded key inline
    encodedKeyPath = encodedKeyPath.substr(compoundKeysPropertyName.length + 1);
    value[compoundKeysPropertyName] = value[compoundKeysPropertyName] || {};
    value[compoundKeysPropertyName][encodedKeyPath] = encodedKey;
}

function removeInlineCompoundKey(value) {
    if (typeof value === 'string' && isCompoundKey(value)) {
        return decodeCompoundKey(value);
    } else if (value && _typeof$7(value[compoundKeysPropertyName]) === 'object') {
        delete value[compoundKeysPropertyName];
    }
    return value;
}

function encodeCompoundKey(key) {
    // Validate and encode the key
    Key.convertValueToKey(key);
    key = Key.encode(key);

    // Prepend the "__$$compoundKey." prefix
    key = compoundKeysPropertyName + '.' + key;

    validateKeyLength(key);
    return key;
}

function decodeCompoundKey(key) {
    validateKeyLength(key);

    // Remove the "__$$compoundKey." prefix
    key = key.substr(compoundKeysPropertyName.length + 1);

    // Decode the key
    key = Key.decode(key);
    return key;
}

function validateKeyLength(key) {
    // BUG: Internet Explorer truncates string keys at 889 characters
    if (key.length > 889) {
        throw createDOMException('DataError', 'The encoded key is ' + key.length + ' characters long, but IE only allows 889 characters. Consider replacing numeric keys with strings to reduce the encoded length.');
    }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var glob = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : self;
glob._babelPolyfill = false; // http://stackoverflow.com/questions/31282702/conflicting-use-of-babel-register

var IDB = void 0;

function shim(name, value) {
    try {
        // Try setting the property. This will fail if the property is read-only.
        IDB[name] = value;
    } catch (e) {
        console.log(e);
    }
    if (IDB[name] !== value && Object.defineProperty) {
        // Setting a read-only property failed, so try re-defining the property
        try {
            var desc = { value: value };
            if (name === 'indexedDB') {
                desc.writable = false; // Make explicit for Babel
            }
            Object.defineProperty(IDB, name, desc);
        } catch (e) {
            // With `indexedDB`, PhantomJS fails here and below but
            //  not above, while Chrome is reverse (and Firefox doesn't
            //  get here since no WebSQL to use for shimming)
        }

        if (IDB[name] !== value) {
            typeof console !== 'undefined' && console.warn && console.warn('Unable to shim ' + name);
        }
    }
}

function setGlobalVars(idb) {
    IDB = idb || (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
    shim('shimIndexedDB', shimIndexedDB);
    if (IDB.shimIndexedDB) {
        IDB.shimIndexedDB.__useShim = function () {
            if (CFG.win.openDatabase !== undefined) {
                // Polyfill ALL of IndexedDB, using WebSQL
                shim('indexedDB', shimIndexedDB);
                shim('IDBFactory', IDBFactory);
                shim('IDBDatabase', IDBDatabase);
                shim('IDBObjectStore', IDBObjectStore);
                shim('IDBIndex', IDBIndex);
                shim('IDBTransaction', IDBTransaction$1);
                shim('IDBCursor', IDBCursor);
                shim('IDBCursorWithValue', IDBCursorWithValue);
                shim('IDBKeyRange', IDBKeyRange);
                shim('IDBRequest', IDBRequest);
                shim('IDBOpenDBRequest', IDBOpenDBRequest);
                shim('IDBVersionChangeEvent', IDBVersionChangeEvent);
            } else if (_typeof(IDB.indexedDB) === 'object') {
                // Polyfill the missing IndexedDB features (no need for IDBEnvironment, the window containing indexedDB itself))
                polyfill(IDBCursor, IDBCursorWithValue, IDBDatabase, IDBFactory, IDBIndex, IDBKeyRange, IDBObjectStore, IDBRequest, IDBTransaction$1);
            }
        };

        IDB.shimIndexedDB.__debug = function (val) {
            CFG.DEBUG = val;
        };
        IDB.shimIndexedDB.__setConfig = function (prop, val) {
            CFG[prop] = val;
        };
        IDB.shimIndexedDB.__getConfig = function (prop) {
            return CFG[prop];
        };
        IDB.shimIndexedDB.__setUnicodeIdentifiers = function (ui) {
            this.__setConfig('UnicodeIDStart', ui.UnicodeIDStart);
            this.__setConfig('UnicodeIDContinue', ui.UnicodeIDContinue);
        };
    }

    // Workaround to prevent an error in Firefox
    if (!('indexedDB' in IDB)) {
        IDB.indexedDB = IDB.indexedDB || IDB.webkitIndexedDB || IDB.mozIndexedDB || IDB.oIndexedDB || IDB.msIndexedDB;
    }

    // Detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
    var poorIndexedDbSupport = false;
    if (typeof navigator !== 'undefined' && ( // Ignore Node or other environments

    // Bad non-Chrome Android support
    navigator.userAgent.match(/Android (?:2|3|4\.[0-3])/) && !navigator.userAgent.match(/Chrome/) ||
    // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
    (navigator.userAgent.indexOf('Safari') === -1 || navigator.userAgent.indexOf('Chrome') > -1) && // Exclude genuine Safari: http://stackoverflow.com/a/7768006/271577
    // Detect iOS: http://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
    // and detect version 9: http://stackoverflow.com/a/26363560/271577
    /(iPad|iPhone|iPod).* os 9_/i.test(navigator.userAgent) && !window.MSStream // But avoid IE11
    )) {
        poorIndexedDbSupport = true;
    }
    CFG.DEFAULT_DB_SIZE = ( // Safari currently requires larger size: (We don't need a larger size for Node as node-websql doesn't use this info)
    // https://github.com/axemclion/IndexedDBShim/issues/41
    // https://github.com/axemclion/IndexedDBShim/issues/115
    typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1 ? 25 : 4) * 1024 * 1024;

    if ((IDB.indexedDB === undefined || !IDB.indexedDB || poorIndexedDbSupport) && CFG.win.openDatabase !== undefined) {
        IDB.shimIndexedDB.__useShim();
    } else {
        IDB.IDBDatabase = IDB.IDBDatabase || IDB.webkitIDBDatabase;
        IDB.IDBTransaction = IDB.IDBTransaction || IDB.webkitIDBTransaction || {};
        IDB.IDBCursor = IDB.IDBCursor || IDB.webkitIDBCursor;
        IDB.IDBKeyRange = IDB.IDBKeyRange || IDB.webkitIDBKeyRange;
    }
    return IDB;
}

/* globals GLOBAL */

var indexeddb = (function (openDatabase) {
    CFG.win = { openDatabase: openDatabase };
    return setGlobalVars;
});

var applyToScope = indexeddb(openDatabase);
applyToScope(global);

// import './hybrid/dispatch-extended-event';
// import './self/skip-waiting';
// import './self/events';

var selfAsAny = self;
// selfAsAny.promiseBridge = function(callbackIndex:number, promise: Promise<any>) {
//     promise
//     .then((response) => {
//         __promiseCallback(callbackIndex, null, response)
//     })
//     .catch((err) => {
//         __promiseCallback(callbackIndex, err.message)
//     })
// }

}());