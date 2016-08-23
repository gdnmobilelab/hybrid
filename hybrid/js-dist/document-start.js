var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index = createCommonjsModule(function (module) {
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var arguments$1 = arguments;
  var this$1 = this;

  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments$1[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this$1.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments$1[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}
});

var EventEmitter = interopDefault(index);

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

var webkit = window.webkit;
// We need these callbacks to be globally accessible.
var promiseCallbacks = {};
var promiseBridges = {};
window.__promiseBridgeCallbacks = promiseCallbacks;
window.__promiseBridges = promiseBridges;
var PromiseOverWKMessage = (function (_super) {
    __extends(PromiseOverWKMessage, _super);
    function PromiseOverWKMessage(name) {
        _super.call(this);
        this.callbackArray = [];
        this.name = name;
        if (!webkit.messageHandlers[name]) {
            throw new Error("Message handler \"" + name + "\" does not exist");
        }
        if (webkit.messageHandlers[name]._receive) {
            throw new Error("Promise bridge for \"" + name + "\" already exists\"");
        }
        promiseCallbacks[name] = this.receiveResponse.bind(this);
        promiseBridges[name] = this;
    }
    PromiseOverWKMessage.prototype.bridgePromise = function (message) {
        // Find the next available slot in our callback array
        var this$1 = this;

        var _this = this;
        var callbackIndex = 0;
        while (this$1.callbackArray[callbackIndex]) {
            callbackIndex++;
        }
        return new Promise(function (fulfill, reject) {
            // Now insert our callback into the cached array.
            _this.callbackArray[callbackIndex] = [fulfill, reject];
            console.debug("Sending", { callbackIndex: callbackIndex, message: message });
            webkit.messageHandlers[_this.name].postMessage({ callbackIndex: callbackIndex, message: message });
        });
    };
    PromiseOverWKMessage.prototype.send = function (message) {
        // Shortcut when we only want to send and are not expecting a response
        webkit.messageHandlers[this.name].postMessage({ message: message });
    };
    PromiseOverWKMessage.prototype.receiveResponse = function (callbackIndex, err, response) {
        try {
            var thisCallback = this.callbackArray[callbackIndex];
            if (!thisCallback) {
                throw new Error("Tried to use a callback that didn't exist");
            }
            // free up this slot for next operation
            this.callbackArray[callbackIndex] = null;
            var fulfill = thisCallback[0], reject = thisCallback[1];
            if (err) {
                reject(new Error(err));
            }
            else {
                fulfill(response);
            }
        }
        catch (err) {
            console.error(err);
        }
    };
    return PromiseOverWKMessage;
}(EventEmitter));

var index$1 = createCommonjsModule(function (module, exports) {
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var arguments$1 = arguments;

  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments$1.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments$1[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;
});

interopDefault(index$1);
var extname = index$1.extname;
var basename = index$1.basename;
var dirname = index$1.dirname;
var delimiter = index$1.delimiter;
var sep = index$1.sep;
var relative = index$1.relative;
var join = index$1.join;
var isAbsolute = index$1.isAbsolute;
var normalize = index$1.normalize;
var resolve = index$1.resolve;

var activeMessagePorts = [];
var PortStore = {
    add: function (port) {
        if (activeMessagePorts.indexOf(port) > -1) {
            throw new Error("Trying to add a port that's already been added");
        }
        activeMessagePorts.push(port);
    },
    remove: function (port) {
        activeMessagePorts.splice(activeMessagePorts.indexOf(port), 1);
    },
    findByNativeIndex: function (nativeIndex) {
        var existing = activeMessagePorts.filter(function (p) { return p.nativePortIndex === nativeIndex; });
        return existing[0];
    },
    findOrCreateByNativeIndex: function (nativeIndex) {
        if (!nativeIndex && nativeIndex !== 0) {
            throw new Error("Must provide a native index");
        }
        var existing = PortStore.findByNativeIndex(nativeIndex);
        if (existing) {
            // Already have a port for this. Return it.
            return existing;
        }
        // If not, make a new one
        var newCustom = new MessagePortWrapper();
        newCustom.nativePortIndex = nativeIndex;
        console.debug("Created new web MessagePort for native index", nativeIndex);
        // this already has a bridge, so we consider it 'active'
        PortStore.add(newCustom);
        return newCustom;
    },
    findOrWrapJSMesssagePort: function (port) {
        var existing = activeMessagePorts.filter(function (p) { return p.jsMessagePort == port; });
        if (existing.length == 1) {
            // Already have a port for this. Return it.
            return existing[0];
        }
        var newCustom = new MessagePortWrapper(port);
        // this has not yet been given a native index, so we do not
        // consider it active.
        return newCustom;
    }
};
// for testing
window.hybridPortStore = PortStore;

var index$3 = createCommonjsModule(function (module, exports) {
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var hasProp = ({}).hasOwnProperty;
var extend = function extend(child, parent) {
    for (var key in parent) {
        if (hasProp.call(parent, key)) {
            child[key] = parent[key];
        }
    }
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
};

var TimeoutError = exports.TimeoutError = function (message) {
    if (!(this instanceof TimeoutError)) {
        return new TimeoutError(message);
    }
    if (Error.captureStackTrace) {
        // This is better, because it makes the resulting stack trace have the correct error name.  But, it
        // only works in V8/Chrome.
        TimeoutError.__super__.constructor.apply(this, arguments);
        Error.captureStackTrace(this, this.constructor);
    } else {
        // Hackiness for other browsers.
        this.stack = new Error(message).stack;
    }
    this.message = message;
    this.name = "TimeoutError";
};
extend(TimeoutError, Error);

/*
 * Returns a Promise which resolves after `ms` milliseconds have elapsed.  The returned Promise will never reject.
 */
exports.delay = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};

/*
 * Returns a `{promise, resolve, reject}` object.  The returned `promise` will resolve or reject when `resolve` or
 * `reject` are called.
 */
exports.defer = function () {
    var answer = {};
    answer.promise = new Promise(function (resolve, reject) {
        answer.resolve = resolve;
        answer.reject = reject;
    });
    return answer;
};

/*
 * Given an array, `tasks`, of functions which return Promises, executes each function in `tasks` in series, only
 * calling the next function once the previous function has completed.
 */
exports.series = function (tasks) {
    var results = [];
    return tasks.reduce(function (series, task) {
        return series.then(task).then(function (result) {
            results.push(result);
        });
    }, Promise.resolve()).then(function () {
        return results;
    });
};

/*
 * Given an array, `tasks`, of functions which return Promises, executes each function in `tasks` in parallel.
 * If `limit` is supplied, then at most `limit` tasks will be executed concurrently.
 */
exports.parallel = exports.parallelLimit = function (tasks, limit) {
    if (!limit || limit < 1 || limit >= tasks.length) {
        return Promise.all(tasks.map(function (task) {
            return Promise.resolve().then(task);
        }));
    }

    return new Promise(function (resolve, reject) {
        var results = [];

        var currentTask = 0;
        var running = 0;
        var errored = false;

        var startTask = function startTask() {
            if (errored) {
                return;
            }
            if (currentTask >= tasks.length) {
                return;
            }

            var taskNumber = currentTask++;
            var task = tasks[taskNumber];
            running++;

            Promise.resolve().then(task).then(function (result) {
                results[taskNumber] = result;
                running--;
                if (currentTask < tasks.length && running < limit) {
                    startTask();
                } else if (running === 0) {
                    resolve(results);
                }
            }, function (err) {
                if (errored) {
                    return;
                }
                errored = true;
                reject(err);
            });
        };

        // Start up `limit` tasks.
        for (var i = 0; i < limit; i++) {
            startTask();
        }
    });
};

/*
 * Given an array `arr` of items, calls `iter(item, index)` for every item in `arr`.  `iter()` should return a
 * Promise.  Up to `limit` items will be called in parallel (defaults to 1.)
 */
exports.map = function (arr, iter, limit) {
    var taskLimit = limit;
    if (!limit || limit < 1) {
        taskLimit = 1;
    }
    if (limit >= arr.length) {
        taskLimit = arr.length;
    }

    var tasks = arr.map(function (item, index) {
        return function () {
            return iter(item, index);
        };
    });
    return exports.parallel(tasks, taskLimit);
};

/*
 * Add a timeout to an existing Promise.
 *
 * Resolves to the same value as `p` if `p` resolves within `ms` milliseconds, otherwise the returned Promise will
 * reject with the error "Timeout: Promise did not resolve within ${ms} milliseconds"
 */
exports.timeout = function (p, ms) {
    return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
            timer = null;
            reject(new exports.TimeoutError("Timeout: Promise did not resolve within " + ms + " milliseconds"));
        }, ms);

        p.then(function (result) {
            if (timer !== null) {
                clearTimeout(timer);
                resolve(result);
            }
        }, function (err) {
            if (timer !== null) {
                clearTimeout(timer);
                reject(err);
            }
        });
    });
};

/*
 * Continually call `fn()` while `test()` returns true.
 *
 * `fn()` should return a Promise.  `test()` is a synchronous function which returns true of false.
 *
 * `whilst` will resolve to the last value that `fn()` resolved to, or will reject immediately with an error if
 * `fn()` rejects or if `fn()` or `test()` throw.
 */
exports.whilst = function (test, fn) {
    return new Promise(function (resolve, reject) {
        var lastResult = null;
        var doIt = function doIt() {
            try {
                if (test()) {
                    Promise.resolve().then(fn).then(function (result) {
                        lastResult = result;
                        setTimeout(doIt, 0);
                    }, reject);
                } else {
                    resolve(lastResult);
                }
            } catch (err) {
                reject(err);
            }
        };

        doIt();
    });
};

exports.doWhilst = function (fn, test) {
    var first = true;
    var doTest = function doTest() {
        var answer = first || test();
        first = false;
        return answer;
    };
    return exports.whilst(doTest, fn);
};

/*
 * keep calling `fn` until it returns a non-error value, doesn't throw, or returns a Promise that resolves. `fn` will be
 * attempted `times` many times before rejecting. If `times` is given as `Infinity`, then `retry` will attempt to
 * resolve forever (useful if you are just waiting for something to finish).
 * @param {Object|Number} options hash to provide `times` and `interval`. Defaults (times=5, interval=0). If this value
 *                        is a number, only `times` will be set.
 * @param {Function}      fn the task/check to be performed. Can either return a synchronous value, throw an error, or
 *                        return a promise
 * @returns {Promise}
 */
exports.retry = function (options, fn) {
    var times = 5;
    var interval = 0;
    var attempts = 0;
    var lastAttempt = null;

    function makeTimeOptionError(value) {
        return new Error("Unsupported argument type for 'times': " + (typeof value === "undefined" ? "undefined" : _typeof(value)));
    }

    if ('function' === typeof options) fn = options;else if ('number' === typeof options) times = +options;else if ('object' === (typeof options === "undefined" ? "undefined" : _typeof(options))) {
        if ('number' === typeof options.times) times = +options.times;else if (options.times) return Promise.reject(makeTimeOptionError(options.times));

        if (options.interval) interval = +options.interval;
    } else if (options) return Promise.reject(makeTimeOptionError(options));else return Promise.reject(new Error('No parameters given'));

    return new Promise(function (resolve, reject) {
        var doIt = function doIt() {
            Promise.resolve().then(function () {
                return fn(lastAttempt);
            }).then(resolve).catch(function (err) {
                attempts++;
                lastAttempt = err;
                if (times !== Infinity && attempts === times) {
                    reject(lastAttempt);
                } else {
                    setTimeout(doIt, interval);
                }
            });
        };
        doIt();
    });
};
});

var PromiseTools = interopDefault(index$3);
var retry = index$3.retry;
var doWhilst = index$3.doWhilst;
var whilst = index$3.whilst;
var timeout = index$3.timeout;
var map = index$3.map;
var parallel = index$3.parallel;
var parallelLimit = index$3.parallelLimit;
var series = index$3.series;
var defer = index$3.defer;
var delay = index$3.delay;
var TimeoutError = index$3.TimeoutError;

var webkit$1 = window.webkit;
var promiseBridge = new PromiseOverWKMessage("messageChannel");
// We need this to be globally accessible so that we can trigger receive
// events manually
window.__messageChannelBridge = promiseBridge;
function receiveMessage(portIndex, message) {
    try {
        console.debug("Received incoming message from native, to port", portIndex, "with message", message);
        var thisPort = PortStore.findOrCreateByNativeIndex(portIndex);
        if (!thisPort) {
            throw new Error("Tried to receive message on inactive port");
        }
        var mappedPorts = message.passedPortIds.map(function (id) {
            // We can't pass in actual message ports, so instead we pass in
            // their IDs. Now we map them to our wrapper CustomMessagePort
            return PortStore.findOrCreateByNativeIndex(id).jsMessagePort;
        });
        console.debug("Posting message to native index", thisPort.nativePortIndex);
        thisPort.sendOriginalPostMessage(JSON.parse(message.data), mappedPorts);
    }
    catch (err) {
        console.error(err);
    }
}
promiseBridge.addListener("emit", receiveMessage);
var MessagePortWrapper = (function () {
    function MessagePortWrapper(jsPort) {
        var _this = this;
        if (jsPort === void 0) { jsPort = null; }
        this.nativePortIndex = null;
        if (jsPort) {
            console.debug("Creating wrapper for an existing MessagePort");
            this.jsMessagePort = jsPort;
            // disgusting hack, but can't see any way around is as there is no
            // "has dispatched a message" event, as far as I can tell 
            this.jsMessagePort.postMessage = this.handleJSMessage.bind(this);
        }
        else {
            console.debug("Making wrapper for a new web MessagePort");
            // we can't create a MessagePort directly, so we have to make
            // a channel then take one port from it. Kind of a waste.
            this.jsMessageChannel = new MessageChannel();
            this.jsMessagePort = this.jsMessageChannel.port1;
            this.jsMessageChannel.port2.onmessage = function (ev) {
                // we can't reliably hook into postMessage, so we use this
                // to catch postMessages too. Need to document all this madness.
                _this.handleJSMessage(ev.data, ev.ports);
            };
        }
        // Same for the lack of a 'close' event.
        this.originalJSPortClose = this.jsMessagePort.close;
        this.jsMessagePort.close = this.close;
    }
    MessagePortWrapper.prototype.sendOriginalPostMessage = function (data, ports) {
        MessagePort.prototype.postMessage.apply(this.jsMessagePort, [data, ports]);
    };
    MessagePortWrapper.prototype.handleJSMessage = function (data, ports, isExplicitPost) {
        var _this = this;
        if (isExplicitPost === void 0) { isExplicitPost = false; }
        console.debug("Posting new message...");
        // Get our custom port instances, creating them if necessary
        var customPorts = [];
        if (ports) {
            customPorts = ports.map(function (p) { return PortStore.findOrWrapJSMesssagePort(p); });
        }
        this.checkForNativePort()
            .then(function () {
            // if they were created, then we need to assign them a native ID before
            // we send.
            console.debug("Checking that additional ports have native equivalents");
            return PromiseTools.map(customPorts, function (port) { return port.checkForNativePort(); });
        })
            .then(function () {
            // If this is an explicit postMessage call, we need the native
            // side to pick up on it (so it does something with the MessagePort)
            promiseBridge.bridgePromise({
                operation: "sendToPort",
                portIndex: _this.nativePortIndex,
                data: JSON.stringify(data),
                isExplicitPost: isExplicitPost,
                additionalPortIndexes: customPorts.map(function (p) { return p.nativePortIndex; })
            });
        })
            .catch(function (err) {
            console.error(err);
        });
    };
    MessagePortWrapper.prototype.checkForNativePort = function () {
        var _this = this;
        if (this.nativePortIndex !== null) {
            //console.debug("Port already has native index", this.nativePortIndex)
            return Promise.resolve();
        }
        return promiseBridge.bridgePromise({
            operation: "create"
        })
            .then(function (portId) {
            console.debug("Created new native MessagePort at index ", String(portId));
            _this.nativePortIndex = portId;
            // only add to our array of active channels when
            // we have a native ID
            PortStore.add(_this);
        });
    };
    MessagePortWrapper.prototype.close = function () {
        // run the original function we overwrote
        this.originalJSPortClose.apply(this.jsMessagePort);
        // remove from our cache of active ports
        PortStore.remove(this);
        // finally, tell the native half to delete this reference.
        promiseBridge.bridgePromise({
            operation: "delete",
            portIndex: this.nativePortIndex
        });
    };
    return MessagePortWrapper;
}());
function postMessage(message, ports) {
    var portIndexes = [];
    Promise.resolve()
        .then(function () {
        return PromiseTools.map(ports, function (port) {
            var wrapper = new MessagePortWrapper(port);
            return wrapper.checkForNativePort()
                .then(function () {
                return wrapper.nativePortIndex;
            });
        });
    })
        .then(function (portIndexes) {
        promiseBridge.bridgePromise({
            operation: "postMessage",
            data: JSON.stringify(message),
            additionalPortIndexes: portIndexes
        });
    });
}

var serviceWorkerBridge = new PromiseOverWKMessage("serviceWorker");
var EventEmitterToJSEvent = (function (_super) {
    __extends(EventEmitterToJSEvent, _super);
    function EventEmitterToJSEvent() {
        _super.apply(this, arguments);
    }
    EventEmitterToJSEvent.prototype.addEventListener = function (type, listener, useCapture) {
        this.addListener(type, listener);
    };
    EventEmitterToJSEvent.prototype.dispatchEvent = function (evt) {
        this.emit(evt.type, evt);
        return true;
    };
    EventEmitterToJSEvent.prototype.removeEventListener = function (type, listener) {
        this.removeListener(type, listener);
    };
    return EventEmitterToJSEvent;
}(EventEmitter));
var HybridServiceWorker = (function (_super) {
    __extends(HybridServiceWorker, _super);
    function HybridServiceWorker(id, scriptURL, scope, state) {
        _super.call(this);
        this._id = id;
        this.scriptURL = scriptURL;
        this.scope = scope;
        this.installState = state;
    }
    Object.defineProperty(HybridServiceWorker.prototype, "state", {
        get: function () {
            if (this.installState === ServiceWorkerInstallState.Activated) {
                return "activated";
            }
            if (this.installState === ServiceWorkerInstallState.Activating) {
                return "activating";
            }
            if (this.installState === ServiceWorkerInstallState.Installed) {
                return "installed";
            }
            if (this.installState === ServiceWorkerInstallState.Installing) {
                return "installing";
            }
            if (this.installState === ServiceWorkerInstallState.Redundant) {
                return "redundant";
            }
            throw new Error("Unrecognised install state:" + this.installState);
        },
        enumerable: true,
        configurable: true
    });
    HybridServiceWorker.prototype.updateState = function (state) {
        if (state === this.installState) {
            return;
        }
        this.installState = state;
        if (this.onstatechange) {
            this.onstatechange({
                target: this
            });
        }
    };
    HybridServiceWorker.prototype.postMessage = function (message, options) {
        if (RegistrationInstance.active !== this) {
            throw new Error("Can only postMessage to active service worker");
        }
        if (options.length > 1 || options[0] instanceof MessagePort === false) {
            throw new Error("Currently only supports sending one MessagePort");
        }
        console.log('post message?', message);
        postMessage(message, [options[0]]);
    };
    HybridServiceWorker.prototype.terminate = function () {
        throw new Error("Should not implement this.");
    };
    return HybridServiceWorker;
}(EventEmitterToJSEvent));
var HybridRegistration = (function (_super) {
    __extends(HybridRegistration, _super);
    function HybridRegistration() {
        var _this = this;
        _super.call(this);
        this.addListener("updatefound", function () {
            if (_this.onupdatefound) {
                _this.onupdatefound();
            }
        });
        this.pushManager = function () {
            console.log('push?');
        };
    }
    HybridRegistration.prototype.getMostRecentWorker = function () {
        // when we want the most current, regardless of actual status
        return this.active || this.waiting || this.installing;
    };
    HybridRegistration.prototype.update = function () {
        serviceWorkerBridge.bridgePromise({
            operation: "update",
            url: this.getMostRecentWorker().scriptURL
        });
    };
    Object.defineProperty(HybridRegistration.prototype, "scope", {
        get: function () {
            return this.active.scope;
        },
        enumerable: true,
        configurable: true
    });
    HybridRegistration.prototype.unregister = function () {
        throw new Error("not yet");
    };
    HybridRegistration.prototype.clearAllInstancesOfServiceWorker = function (sw) {
        // If a service worker has changed state, we want to ensure
        // that it doesn't appear in any old states
        if (this.active === sw) {
            this.active = null;
        }
        if (this.installing === sw) {
            this.installing = null;
        }
        if (this.waiting === sw) {
            this.waiting = null;
        }
    };
    HybridRegistration.prototype.assignAccordingToInstallState = function (sw) {
        this.clearAllInstancesOfServiceWorker(sw);
        if (sw.installState === ServiceWorkerInstallState.Activated && !this.active) {
            this.active = sw;
            ServiceWorkerContainer.controller = sw;
        }
        if (sw.installState === ServiceWorkerInstallState.Installed) {
            this.waiting = sw;
        }
        if (sw.installState === ServiceWorkerInstallState.Installing) {
            this.installing = sw;
            this.emit("updatefound", sw);
        }
    };
    return HybridRegistration;
}(EventEmitterToJSEvent));
var RegistrationInstance = new HybridRegistration();
var HybridServiceWorkerContainer = (function (_super) {
    __extends(HybridServiceWorkerContainer, _super);
    function HybridServiceWorkerContainer() {
        var _this = this;
        _super.call(this);
        this.addListener("controllerchange", function () {
            if (_this.oncontrollerchange) {
                // does it expect arguments? Unclear.
                _this.oncontrollerchange();
            }
        });
        this.controller = RegistrationInstance.active;
    }
    Object.defineProperty(HybridServiceWorkerContainer.prototype, "ready", {
        get: function () {
            var _this = this;
            if (this.controller) {
                console.debug("ServiceWorker ready returning immediately with activated instance");
                return Promise.resolve(RegistrationInstance);
            }
            return new Promise(function (fulfill, reject) {
                console.debug("ServiceWorker ready returning promise and waiting...");
                _this.once("controllerchange", function () {
                    console.debug("ServiceWorker ready received response");
                    fulfill();
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    HybridServiceWorkerContainer.prototype.register = function (url, options) {
        var pathToSW = window.location.origin + resolve(window.location.pathname, url);
        console.info("Attempting to register service worker at", pathToSW);
        return serviceWorkerBridge.bridgePromise({
            operation: "register",
            swPath: url,
            scope: options ? options.scope : null
        })
            .then(function (response) {
            var worker = processNewWorkerMatch(response);
            return RegistrationInstance;
        });
    };
    HybridServiceWorkerContainer.prototype.claimedByNewWorker = function (sw) {
        RegistrationInstance.clearAllInstancesOfServiceWorker(sw);
        RegistrationInstance.active = sw;
        this.controller = sw;
        this.emit("controllerchange", sw);
    };
    HybridServiceWorkerContainer.prototype.getRegistration = function (scope) {
        return Promise.resolve(RegistrationInstance);
    };
    HybridServiceWorkerContainer.prototype.getRegistrations = function () {
        // Not sure why we end up with more than one registration, ever.
        return Promise.resolve([RegistrationInstance]);
    };
    return HybridServiceWorkerContainer;
}(EventEmitter));
var ServiceWorkerContainer = new HybridServiceWorkerContainer();
var ServiceWorkerInstallState;
(function (ServiceWorkerInstallState) {
    ServiceWorkerInstallState[ServiceWorkerInstallState["Installing"] = 0] = "Installing";
    ServiceWorkerInstallState[ServiceWorkerInstallState["Installed"] = 1] = "Installed";
    ServiceWorkerInstallState[ServiceWorkerInstallState["Activating"] = 2] = "Activating";
    ServiceWorkerInstallState[ServiceWorkerInstallState["Activated"] = 3] = "Activated";
    ServiceWorkerInstallState[ServiceWorkerInstallState["Redundant"] = 4] = "Redundant";
})(ServiceWorkerInstallState || (ServiceWorkerInstallState = {}));
var serviceWorkerRecords = {};
function processNewWorkerMatch(newMatch) {
    // if we already have a record, use that one
    var worker = serviceWorkerRecords[newMatch.instanceId];
    if (!worker) {
        // otherwise, make a new one
        worker = new HybridServiceWorker(newMatch.instanceId, newMatch.url, newMatch.scope, newMatch.installState);
        serviceWorkerRecords[newMatch.instanceId] = worker;
    }
    else {
        worker.updateState(newMatch.installState);
    }
    RegistrationInstance.assignAccordingToInstallState(worker);
    console.log("SW CHANGE", newMatch);
    return worker;
}
serviceWorkerBridge.addListener('sw-change', processNewWorkerMatch);
serviceWorkerBridge.addListener('claimed', function (match) {
    var worker = processNewWorkerMatch(match);
    console.log("Claimed by new worker");
    ServiceWorkerContainer.claimedByNewWorker(worker);
});
// On page load we grab all the currently applicable service workers
serviceWorkerBridge.bridgePromise({
    operation: "getAll"
}).then(function (workers) {
    workers.forEach(function (worker) {
        serviceWorkerRecords[worker.instanceId] = new HybridServiceWorker(worker.instanceId, worker.url, "", worker.installState);
        RegistrationInstance.assignAccordingToInstallState(serviceWorkerRecords[worker.instanceId]);
    });
});

var navigatorAsAny = navigator;
navigatorAsAny.serviceWorker = ServiceWorkerContainer;

var promiseBridge$1 = new PromiseOverWKMessage("console");
var makeSuitable = function (val) {
    if (val instanceof Error) {
        return val.toString();
    }
    else if (typeof val == "string") {
        return val;
    }
    else if (val === null || val === undefined) {
        return "null";
    }
    else {
        var returnString = "(not stringifyable): ";
        try {
            returnString = JSON.stringify(val);
        }
        catch (err) {
            returnString += err.toString();
        }
        return returnString;
    }
};
var levels = ['debug', 'info', 'log', 'error', 'warn'];
var console$1 = {};
var originalConsole = window.console;
window.console = console$1;
levels.forEach(function (level) {
    console$1[level] = function () {
        if (originalConsole) {
            // still log out to webview console, in case we're attached
            originalConsole[level].apply(originalConsole, arguments);
        }
        var argsAsJSON = Array.from(arguments).map(makeSuitable);
        promiseBridge$1.send({
            level: level,
            args: argsAsJSON
        });
    };
});

var eventsBridge = new PromiseOverWKMessage("events");
window.hybridEvents = {
    emit: function (name, data) {
        eventsBridge.send({
            name: name, data: data
        });
    }
};

var notification = {
    requestPermission: function () {
    }
};
window.Notification = notification;

window.onerror = function (err) {
    console.error(err);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvcG9ydC1zdG9yZS50cyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcHJvbWlzZS10b29scy9saWIvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25hdmlnYXRvci9zdy1tYW5hZ2VyLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9jb25zb2xlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L3V0aWwvZ2VuZXJpYy1ldmVudHMudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbm90aWZpY2F0aW9uL25vdGlmaWNhdGlvbi50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9kb2N1bWVudC1zdGFydC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn1cbiIsImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5jb25zdCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG4vLyBXZSBuZWVkIHRoZXNlIGNhbGxiYWNrcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlLlxuY29uc3QgcHJvbWlzZUNhbGxiYWNrczoge1trZXk6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5jb25zdCBwcm9taXNlQnJpZGdlczoge1trZXk6c3RyaW5nXTogUHJvbWlzZU92ZXJXS01lc3NhZ2V9ID0ge307XG4od2luZG93IGFzIGFueSkuX19wcm9taXNlQnJpZGdlQ2FsbGJhY2tzID0gcHJvbWlzZUNhbGxiYWNrcztcbih3aW5kb3cgYXMgYW55KS5fX3Byb21pc2VCcmlkZ2VzID0gcHJvbWlzZUJyaWRnZXM7XG5cbmV4cG9ydCBjbGFzcyBQcm9taXNlT3ZlcldLTWVzc2FnZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICBwcml2YXRlIGNhbGxiYWNrQXJyYXk6W0Z1bmN0aW9uLCBGdW5jdGlvbl1bXSA9IFtdXG4gICAgcHJpdmF0ZSBuYW1lOnN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6c3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgaWYgKCF3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1lc3NhZ2UgaGFuZGxlciBcIiR7bmFtZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbbmFtZV0uX3JlY2VpdmUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvbWlzZSBicmlkZ2UgZm9yIFwiJHtuYW1lfVwiIGFscmVhZHkgZXhpc3RzXCJgKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwcm9taXNlQ2FsbGJhY2tzW25hbWVdID0gdGhpcy5yZWNlaXZlUmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICAgICAgcHJvbWlzZUJyaWRnZXNbbmFtZV0gPSB0aGlzO1xuICAgIH1cblxuICAgIGJyaWRnZVByb21pc2UobWVzc2FnZTphbnkpIHtcblxuICAgICAgICAvLyBGaW5kIHRoZSBuZXh0IGF2YWlsYWJsZSBzbG90IGluIG91ciBjYWxsYmFjayBhcnJheVxuXG4gICAgICAgIGxldCBjYWxsYmFja0luZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSkge1xuICAgICAgICAgICAgY2FsbGJhY2tJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIE5vdyBpbnNlcnQgb3VyIGNhbGxiYWNrIGludG8gdGhlIGNhY2hlZCBhcnJheS5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdID0gW2Z1bGZpbGwsIHJlamVjdF07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VuZGluZ1wiLCB7Y2FsbGJhY2tJbmRleCwgbWVzc2FnZX0pXG4gICAgICAgICAgICB3ZWJraXQubWVzc2FnZUhhbmRsZXJzW3RoaXMubmFtZV0ucG9zdE1lc3NhZ2Uoe2NhbGxiYWNrSW5kZXgsIG1lc3NhZ2V9KTtcblxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgc2VuZChtZXNzYWdlOmFueSkge1xuICAgICAgICBcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB3ZSBvbmx5IHdhbnQgdG8gc2VuZCBhbmQgYXJlIG5vdCBleHBlY3RpbmcgYSByZXNwb25zZVxuICAgICAgICB3ZWJraXQubWVzc2FnZUhhbmRsZXJzW3RoaXMubmFtZV0ucG9zdE1lc3NhZ2Uoe21lc3NhZ2V9KTtcbiAgICB9XG5cbiAgICByZWNlaXZlUmVzcG9uc2UoY2FsbGJhY2tJbmRleDpudW1iZXIsIGVycjpzdHJpbmcsIHJlc3BvbnNlOiBhbnkpIHtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdGhpc0NhbGxiYWNrID0gdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXRoaXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHVzZSBhIGNhbGxiYWNrIHRoYXQgZGlkbid0IGV4aXN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmcmVlIHVwIHRoaXMgc2xvdCBmb3IgbmV4dCBvcGVyYXRpb25cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IG51bGw7XG5cbiAgICAgICAgICAgIGxldCBbZnVsZmlsbCwgcmVqZWN0XSA9IHRoaXNDYWxsYmFjaztcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZ1bGZpbGwocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiaW1wb3J0IHtNZXNzYWdlUG9ydFdyYXBwZXJ9IGZyb20gJy4vbWVzc2FnZS1jaGFubmVsJztcblxuY29uc3QgYWN0aXZlTWVzc2FnZVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW11cblxuY29uc3QgUG9ydFN0b3JlID0ge1xuXG4gICAgYWRkOiBmdW5jdGlvbiAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpIHtcbiAgICAgICAgaWYgKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpID4gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyeWluZyB0byBhZGQgYSBwb3J0IHRoYXQncyBhbHJlYWR5IGJlZW4gYWRkZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYWN0aXZlTWVzc2FnZVBvcnRzLnB1c2gocG9ydCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5zcGxpY2UoYWN0aXZlTWVzc2FnZVBvcnRzLmluZGV4T2YocG9ydCksIDEpO1xuICAgIH0sXG5cbiAgICBmaW5kQnlOYXRpdmVJbmRleDogZnVuY3Rpb24obmF0aXZlSW5kZXg6bnVtYmVyKTpNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleCA9PT0gbmF0aXZlSW5kZXgpO1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgfSxcblxuICAgIGZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgaWYgKCFuYXRpdmVJbmRleCAmJiBuYXRpdmVJbmRleCAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIGEgbmF0aXZlIGluZGV4XCIpXG4gICAgICAgIH1cbiAgICAgIFxuICAgICAgICBsZXQgZXhpc3RpbmcgPSBQb3J0U3RvcmUuZmluZEJ5TmF0aXZlSW5kZXgobmF0aXZlSW5kZXgpO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBoYXZlIGEgcG9ydCBmb3IgdGhpcy4gUmV0dXJuIGl0LlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgbm90LCBtYWtlIGEgbmV3IG9uZVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKCk7XG4gICAgICAgIG5ld0N1c3RvbS5uYXRpdmVQb3J0SW5kZXggPSBuYXRpdmVJbmRleDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IHdlYiBNZXNzYWdlUG9ydCBmb3IgbmF0aXZlIGluZGV4XCIsIG5hdGl2ZUluZGV4KVxuICAgICAgICBcbiAgICAgICAgLy8gdGhpcyBhbHJlYWR5IGhhcyBhIGJyaWRnZSwgc28gd2UgY29uc2lkZXIgaXQgJ2FjdGl2ZSdcbiAgICAgICAgUG9ydFN0b3JlLmFkZChuZXdDdXN0b20pO1xuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tXG4gICAgfSxcblxuICAgIGZpbmRPcldyYXBKU01lc3NzYWdlUG9ydDogZnVuY3Rpb24ocG9ydDpNZXNzYWdlUG9ydCk6IE1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGxldCBleGlzdGluZyA9IGFjdGl2ZU1lc3NhZ2VQb3J0cy5maWx0ZXIoKHApID0+IHAuanNNZXNzYWdlUG9ydCA9PSBwb3J0KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIHBvcnQgZm9yIHRoaXMuIFJldHVybiBpdC5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuXG4gICAgICAgIC8vIHRoaXMgaGFzIG5vdCB5ZXQgYmVlbiBnaXZlbiBhIG5hdGl2ZSBpbmRleCwgc28gd2UgZG8gbm90XG4gICAgICAgIC8vIGNvbnNpZGVyIGl0IGFjdGl2ZS5cblxuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUG9ydFN0b3JlO1xuXG4vLyBmb3IgdGVzdGluZ1xuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZFBvcnRTdG9yZSA9IFBvcnRTdG9yZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH1cblxudmFyIGhhc1Byb3AgPSAoe30pLmhhc093blByb3BlcnR5O1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChjaGlsZCwgcGFyZW50KSB7XG4gICAgZm9yICh2YXIga2V5IGluIHBhcmVudCkge1xuICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkge1xuICAgICAgICAgICAgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICB9XG4gICAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuXG52YXIgVGltZW91dEVycm9yID0gZXhwb3J0cy5UaW1lb3V0RXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW1lb3V0RXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGltZW91dEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBiZXR0ZXIsIGJlY2F1c2UgaXQgbWFrZXMgdGhlIHJlc3VsdGluZyBzdGFjayB0cmFjZSBoYXZlIHRoZSBjb3JyZWN0IGVycm9yIG5hbWUuICBCdXQsIGl0XG4gICAgICAgIC8vIG9ubHkgd29ya3MgaW4gVjgvQ2hyb21lLlxuICAgICAgICBUaW1lb3V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhY2tpbmVzcyBmb3Igb3RoZXIgYnJvd3NlcnMuXG4gICAgICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IobWVzc2FnZSkuc3RhY2s7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gXCJUaW1lb3V0RXJyb3JcIjtcbn07XG5leHRlbmQoVGltZW91dEVycm9yLCBFcnJvcik7XG5cbi8qXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBgbXNgIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQuICBUaGUgcmV0dXJuZWQgUHJvbWlzZSB3aWxsIG5ldmVyIHJlamVjdC5cbiAqL1xuZXhwb3J0cy5kZWxheSA9IGZ1bmN0aW9uIChtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBSZXR1cm5zIGEgYHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9YCBvYmplY3QuICBUaGUgcmV0dXJuZWQgYHByb21pc2VgIHdpbGwgcmVzb2x2ZSBvciByZWplY3Qgd2hlbiBgcmVzb2x2ZWAgb3JcbiAqIGByZWplY3RgIGFyZSBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuZGVmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFuc3dlciA9IHt9O1xuICAgIGFuc3dlci5wcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBhbnN3ZXIucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIGFuc3dlci5yZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFuc3dlcjtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHNlcmllcywgb25seVxuICogY2FsbGluZyB0aGUgbmV4dCBmdW5jdGlvbiBvbmNlIHRoZSBwcmV2aW91cyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLlxuICovXG5leHBvcnRzLnNlcmllcyA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgcmV0dXJuIHRhc2tzLnJlZHVjZShmdW5jdGlvbiAoc2VyaWVzLCB0YXNrKSB7XG4gICAgICAgIHJldHVybiBzZXJpZXMudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5LCBgdGFza3NgLCBvZiBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIFByb21pc2VzLCBleGVjdXRlcyBlYWNoIGZ1bmN0aW9uIGluIGB0YXNrc2AgaW4gcGFyYWxsZWwuXG4gKiBJZiBgbGltaXRgIGlzIHN1cHBsaWVkLCB0aGVuIGF0IG1vc3QgYGxpbWl0YCB0YXNrcyB3aWxsIGJlIGV4ZWN1dGVkIGNvbmN1cnJlbnRseS5cbiAqL1xuZXhwb3J0cy5wYXJhbGxlbCA9IGV4cG9ydHMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uICh0YXNrcywgbGltaXQpIHtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSB8fCBsaW1pdCA+PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzLm1hcChmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4odGFzayk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHZhciBjdXJyZW50VGFzayA9IDA7XG4gICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgc3RhcnRUYXNrID0gZnVuY3Rpb24gc3RhcnRUYXNrKCkge1xuICAgICAgICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFza051bWJlciA9IGN1cnJlbnRUYXNrKys7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzW3Rhc2tOdW1iZXJdO1xuICAgICAgICAgICAgcnVubmluZysrO1xuXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbdGFza051bWJlcl0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgcnVubmluZy0tO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGFzayA8IHRhc2tzLmxlbmd0aCAmJiBydW5uaW5nIDwgbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChydW5uaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdGFydCB1cCBgbGltaXRgIHRhc2tzLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXkgYGFycmAgb2YgaXRlbXMsIGNhbGxzIGBpdGVyKGl0ZW0sIGluZGV4KWAgZm9yIGV2ZXJ5IGl0ZW0gaW4gYGFycmAuICBgaXRlcigpYCBzaG91bGQgcmV0dXJuIGFcbiAqIFByb21pc2UuICBVcCB0byBgbGltaXRgIGl0ZW1zIHdpbGwgYmUgY2FsbGVkIGluIHBhcmFsbGVsIChkZWZhdWx0cyB0byAxLilcbiAqL1xuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbiAoYXJyLCBpdGVyLCBsaW1pdCkge1xuICAgIHZhciB0YXNrTGltaXQgPSBsaW1pdDtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSkge1xuICAgICAgICB0YXNrTGltaXQgPSAxO1xuICAgIH1cbiAgICBpZiAobGltaXQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICB0YXNrTGltaXQgPSBhcnIubGVuZ3RoO1xuICAgIH1cblxuICAgIHZhciB0YXNrcyA9IGFyci5tYXAoZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcihpdGVtLCBpbmRleCk7XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyYWxsZWwodGFza3MsIHRhc2tMaW1pdCk7XG59O1xuXG4vKlxuICogQWRkIGEgdGltZW91dCB0byBhbiBleGlzdGluZyBQcm9taXNlLlxuICpcbiAqIFJlc29sdmVzIHRvIHRoZSBzYW1lIHZhbHVlIGFzIGBwYCBpZiBgcGAgcmVzb2x2ZXMgd2l0aGluIGBtc2AgbWlsbGlzZWNvbmRzLCBvdGhlcndpc2UgdGhlIHJldHVybmVkIFByb21pc2Ugd2lsbFxuICogcmVqZWN0IHdpdGggdGhlIGVycm9yIFwiVGltZW91dDogUHJvbWlzZSBkaWQgbm90IHJlc29sdmUgd2l0aGluICR7bXN9IG1pbGxpc2Vjb25kc1wiXG4gKi9cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uIChwLCBtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLlRpbWVvdXRFcnJvcihcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiBcIiArIG1zICsgXCIgbWlsbGlzZWNvbmRzXCIpKTtcbiAgICAgICAgfSwgbXMpO1xuXG4gICAgICAgIHAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogQ29udGludWFsbHkgY2FsbCBgZm4oKWAgd2hpbGUgYHRlc3QoKWAgcmV0dXJucyB0cnVlLlxuICpcbiAqIGBmbigpYCBzaG91bGQgcmV0dXJuIGEgUHJvbWlzZS4gIGB0ZXN0KClgIGlzIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0cnVlIG9mIGZhbHNlLlxuICpcbiAqIGB3aGlsc3RgIHdpbGwgcmVzb2x2ZSB0byB0aGUgbGFzdCB2YWx1ZSB0aGF0IGBmbigpYCByZXNvbHZlZCB0bywgb3Igd2lsbCByZWplY3QgaW1tZWRpYXRlbHkgd2l0aCBhbiBlcnJvciBpZlxuICogYGZuKClgIHJlamVjdHMgb3IgaWYgYGZuKClgIG9yIGB0ZXN0KClgIHRocm93LlxuICovXG5leHBvcnRzLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBmbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBsYXN0UmVzdWx0ID0gbnVsbDtcbiAgICAgICAgdmFyIGRvSXQgPSBmdW5jdGlvbiBkb0l0KCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZm4pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsYXN0UmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGZuLCB0ZXN0KSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB2YXIgZG9UZXN0ID0gZnVuY3Rpb24gZG9UZXN0KCkge1xuICAgICAgICB2YXIgYW5zd2VyID0gZmlyc3QgfHwgdGVzdCgpO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH07XG4gICAgcmV0dXJuIGV4cG9ydHMud2hpbHN0KGRvVGVzdCwgZm4pO1xufTtcblxuLypcbiAqIGtlZXAgY2FsbGluZyBgZm5gIHVudGlsIGl0IHJldHVybnMgYSBub24tZXJyb3IgdmFsdWUsIGRvZXNuJ3QgdGhyb3csIG9yIHJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMuIGBmbmAgd2lsbCBiZVxuICogYXR0ZW1wdGVkIGB0aW1lc2AgbWFueSB0aW1lcyBiZWZvcmUgcmVqZWN0aW5nLiBJZiBgdGltZXNgIGlzIGdpdmVuIGFzIGBJbmZpbml0eWAsIHRoZW4gYHJldHJ5YCB3aWxsIGF0dGVtcHQgdG9cbiAqIHJlc29sdmUgZm9yZXZlciAodXNlZnVsIGlmIHlvdSBhcmUganVzdCB3YWl0aW5nIGZvciBzb21ldGhpbmcgdG8gZmluaXNoKS5cbiAqIEBwYXJhbSB7T2JqZWN0fE51bWJlcn0gb3B0aW9ucyBoYXNoIHRvIHByb3ZpZGUgYHRpbWVzYCBhbmQgYGludGVydmFsYC4gRGVmYXVsdHMgKHRpbWVzPTUsIGludGVydmFsPTApLiBJZiB0aGlzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGlzIGEgbnVtYmVyLCBvbmx5IGB0aW1lc2Agd2lsbCBiZSBzZXQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuIHRoZSB0YXNrL2NoZWNrIHRvIGJlIHBlcmZvcm1lZC4gQ2FuIGVpdGhlciByZXR1cm4gYSBzeW5jaHJvbm91cyB2YWx1ZSwgdGhyb3cgYW4gZXJyb3IsIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhIHByb21pc2VcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5leHBvcnRzLnJldHJ5ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGZuKSB7XG4gICAgdmFyIHRpbWVzID0gNTtcbiAgICB2YXIgaW50ZXJ2YWwgPSAwO1xuICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgdmFyIGxhc3RBdHRlbXB0ID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIG1ha2VUaW1lT3B0aW9uRXJyb3IodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yICd0aW1lcyc6IFwiICsgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKHZhbHVlKSkpO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2Ygb3B0aW9ucykgZm4gPSBvcHRpb25zO2Vsc2UgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygb3B0aW9ucykgdGltZXMgPSArb3B0aW9ucztlbHNlIGlmICgnb2JqZWN0JyA9PT0gKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob3B0aW9ucykpKSB7XG4gICAgICAgIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMudGltZXMpIHRpbWVzID0gK29wdGlvbnMudGltZXM7ZWxzZSBpZiAob3B0aW9ucy50aW1lcykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucy50aW1lcykpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmludGVydmFsKSBpbnRlcnZhbCA9ICtvcHRpb25zLmludGVydmFsO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucykpO2Vsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gcGFyYW1ldGVycyBnaXZlbicpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbihsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICB9KS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICAgIGxhc3RBdHRlbXB0ID0gZXJyO1xuICAgICAgICAgICAgICAgIGlmICh0aW1lcyAhPT0gSW5maW5pdHkgJiYgYXR0ZW1wdHMgPT09IHRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChkb0l0LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvSXQoKTtcbiAgICB9KTtcbn07IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBQb3J0U3RvcmUgZnJvbSAnLi9wb3J0LXN0b3JlJztcbmltcG9ydCBQcm9taXNlVG9vbHMgZnJvbSAncHJvbWlzZS10b29scyc7XG5cbmxldCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwibWVzc2FnZUNoYW5uZWxcIik7XG5cbi8vIFdlIG5lZWQgdGhpcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlIHNvIHRoYXQgd2UgY2FuIHRyaWdnZXIgcmVjZWl2ZVxuLy8gZXZlbnRzIG1hbnVhbGx5XG5cbih3aW5kb3cgYXMgYW55KS5fX21lc3NhZ2VDaGFubmVsQnJpZGdlID0gcHJvbWlzZUJyaWRnZTtcblxuaW50ZXJmYWNlIE1lc3NhZ2VQb3J0TWVzc2FnZSB7XG4gICAgZGF0YTpzdHJpbmcsXG4gICAgcGFzc2VkUG9ydElkczogbnVtYmVyW11cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UocG9ydEluZGV4Om51bWJlciwgbWVzc2FnZTpNZXNzYWdlUG9ydE1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQgaW5jb21pbmcgbWVzc2FnZSBmcm9tIG5hdGl2ZSwgdG8gcG9ydFwiLCBwb3J0SW5kZXgsIFwid2l0aCBtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgICAgICBsZXQgdGhpc1BvcnQgPSBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChwb3J0SW5kZXgpO1xuXG4gICAgICAgIGlmICghdGhpc1BvcnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlY2VpdmUgbWVzc2FnZSBvbiBpbmFjdGl2ZSBwb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hcHBlZFBvcnRzID0gbWVzc2FnZS5wYXNzZWRQb3J0SWRzLm1hcCgoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHBhc3MgaW4gYWN0dWFsIG1lc3NhZ2UgcG9ydHMsIHNvIGluc3RlYWQgd2UgcGFzcyBpblxuICAgICAgICAgICAgLy8gdGhlaXIgSURzLiBOb3cgd2UgbWFwIHRoZW0gdG8gb3VyIHdyYXBwZXIgQ3VzdG9tTWVzc2FnZVBvcnRcbiAgICAgICAgICAgIHJldHVybiBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChpZCkuanNNZXNzYWdlUG9ydDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG1lc3NhZ2UgdG8gbmF0aXZlIGluZGV4XCIsIHRoaXNQb3J0Lm5hdGl2ZVBvcnRJbmRleCk7XG4gICAgICAgIHRoaXNQb3J0LnNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKSwgbWFwcGVkUG9ydHMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICB9XG5cbn1cblxucHJvbWlzZUJyaWRnZS5hZGRMaXN0ZW5lcihcImVtaXRcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuXG5leHBvcnQgY2xhc3MgTWVzc2FnZVBvcnRXcmFwcGVyIHtcblxuICAgIG9wZW46Ym9vbGVhbjtcbiAgICBuYXRpdmVQb3J0SW5kZXg6bnVtYmVyO1xuICAgIGpzTWVzc2FnZVBvcnQ6TWVzc2FnZVBvcnQ7XG4gICAganNNZXNzYWdlQ2hhbm5lbDpNZXNzYWdlQ2hhbm5lbDtcbiAgICBwcml2YXRlIG9yaWdpbmFsSlNQb3J0Q2xvc2U6RnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3Rvcihqc1BvcnQ6TWVzc2FnZVBvcnQgPSBudWxsKSB7XG4gICAgICAgIHRoaXMubmF0aXZlUG9ydEluZGV4ID0gbnVsbDtcbiAgICAgICAgaWYgKGpzUG9ydCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0aW5nIHdyYXBwZXIgZm9yIGFuIGV4aXN0aW5nIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQgPSBqc1BvcnRcblxuICAgICAgICAgICAgLy8gZGlzZ3VzdGluZyBoYWNrLCBidXQgY2FuJ3Qgc2VlIGFueSB3YXkgYXJvdW5kIGlzIGFzIHRoZXJlIGlzIG5vXG4gICAgICAgICAgICAvLyBcImhhcyBkaXNwYXRjaGVkIGEgbWVzc2FnZVwiIGV2ZW50LCBhcyBmYXIgYXMgSSBjYW4gdGVsbCBcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0LnBvc3RNZXNzYWdlID0gdGhpcy5oYW5kbGVKU01lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJNYWtpbmcgd3JhcHBlciBmb3IgYSBuZXcgd2ViIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHdlIGNhbid0IGNyZWF0ZSBhIE1lc3NhZ2VQb3J0IGRpcmVjdGx5LCBzbyB3ZSBoYXZlIHRvIG1ha2VcbiAgICAgICAgICAgIC8vIGEgY2hhbm5lbCB0aGVuIHRha2Ugb25lIHBvcnQgZnJvbSBpdC4gS2luZCBvZiBhIHdhc3RlLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IHRoaXMuanNNZXNzYWdlQ2hhbm5lbC5wb3J0MTtcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQyLm9ubWVzc2FnZSA9IChldjpNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4ndCByZWxpYWJseSBob29rIGludG8gcG9zdE1lc3NhZ2UsIHNvIHdlIHVzZSB0aGlzXG4gICAgICAgICAgICAgICAgLy8gdG8gY2F0Y2ggcG9zdE1lc3NhZ2VzIHRvby4gTmVlZCB0byBkb2N1bWVudCBhbGwgdGhpcyBtYWRuZXNzLlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSlNNZXNzYWdlKGV2LmRhdGEsIGV2LnBvcnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbWUgZm9yIHRoZSBsYWNrIG9mIGEgJ2Nsb3NlJyBldmVudC5cbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlID0gdGhpcy5qc01lc3NhZ2VQb3J0LmNsb3NlO1xuICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2UgPSB0aGlzLmNsb3NlO1xuICAgIH1cblxuICAgIHNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKGRhdGE6IGFueSwgcG9ydHM6IE1lc3NhZ2VQb3J0W10pIHtcbiAgICAgICAgTWVzc2FnZVBvcnQucHJvdG90eXBlLnBvc3RNZXNzYWdlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCwgW2RhdGEsIHBvcnRzXSk7XG4gICAgfVxuXG4gICAgaGFuZGxlSlNNZXNzYWdlKGRhdGE6YW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSwgaXNFeHBsaWNpdFBvc3Q6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgXG4gICAgICAgIC8vIEdldCBvdXIgY3VzdG9tIHBvcnQgaW5zdGFuY2VzLCBjcmVhdGluZyB0aGVtIGlmIG5lY2Vzc2FyeVxuICAgICAgICBsZXQgY3VzdG9tUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChwb3J0cykge1xuICAgICAgICAgICAgY3VzdG9tUG9ydHMgPSBwb3J0cy5tYXAoKHA6TWVzc2FnZVBvcnQpID0+IFBvcnRTdG9yZS5maW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQocCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja0Zvck5hdGl2ZVBvcnQoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGV5IHdlcmUgY3JlYXRlZCwgdGhlbiB3ZSBuZWVkIHRvIGFzc2lnbiB0aGVtIGEgbmF0aXZlIElEIGJlZm9yZVxuICAgICAgICAgICAgLy8gd2Ugc2VuZC5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGVja2luZyB0aGF0IGFkZGl0aW9uYWwgcG9ydHMgaGF2ZSBuYXRpdmUgZXF1aXZhbGVudHNcIilcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYW4gZXhwbGljaXQgcG9zdE1lc3NhZ2UgY2FsbCwgd2UgbmVlZCB0aGUgbmF0aXZlXG4gICAgICAgICAgICAvLyBzaWRlIHRvIHBpY2sgdXAgb24gaXQgKHNvIGl0IGRvZXMgc29tZXRoaW5nIHdpdGggdGhlIE1lc3NhZ2VQb3J0KVxuXG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJzZW5kVG9Qb3J0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBpc0V4cGxpY2l0UG9zdDogaXNFeHBsaWNpdFBvc3QsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBjdXN0b21Qb3J0cy5tYXAoKHApID0+IHAubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjaGVja0Zvck5hdGl2ZVBvcnQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKHRoaXMubmF0aXZlUG9ydEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuZGVidWcoXCJQb3J0IGFscmVhZHkgaGFzIG5hdGl2ZSBpbmRleFwiLCB0aGlzLm5hdGl2ZVBvcnRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJjcmVhdGVcIlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocG9ydElkOm51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IG5hdGl2ZSBNZXNzYWdlUG9ydCBhdCBpbmRleCBcIiwgU3RyaW5nKHBvcnRJZCkpXG4gICAgICAgICAgICB0aGlzLm5hdGl2ZVBvcnRJbmRleCA9IHBvcnRJZDtcblxuICAgICAgICAgICAgLy8gb25seSBhZGQgdG8gb3VyIGFycmF5IG9mIGFjdGl2ZSBjaGFubmVscyB3aGVuXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIGEgbmF0aXZlIElEXG4gICAgICAgICAgICBQb3J0U3RvcmUuYWRkKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG5cbiAgICAgICAgLy8gcnVuIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3ZSBvdmVyd3JvdGVcbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCk7XG4gICAgICAgIFxuICAgICAgICAvLyByZW1vdmUgZnJvbSBvdXIgY2FjaGUgb2YgYWN0aXZlIHBvcnRzXG4gICAgICAgIFBvcnRTdG9yZS5yZW1vdmUodGhpcyk7XG4gICAgIFxuICAgICAgICAvLyBmaW5hbGx5LCB0ZWxsIHRoZSBuYXRpdmUgaGFsZiB0byBkZWxldGUgdGhpcyByZWZlcmVuY2UuXG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiZGVsZXRlXCIsXG4gICAgICAgICAgICBwb3J0SW5kZXg6IHRoaXMubmF0aXZlUG9ydEluZGV4XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZTphbnksIHBvcnRzOiBbTWVzc2FnZVBvcnRdKSB7XG5cbiAgICBsZXQgcG9ydEluZGV4ZXM6bnVtYmVyW10gPSBbXTtcblxuICAgIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKHBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlci5uYXRpdmVQb3J0SW5kZXg7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oKHBvcnRJbmRleGVzOm51bWJlcltdKSA9PiB7XG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicG9zdE1lc3NhZ2VcIixcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpLFxuICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBwb3J0SW5kZXhlc1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG5cbiAgICBcblxufSIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoLWJyb3dzZXJpZnknO1xuaW1wb3J0IHtwb3N0TWVzc2FnZX0gZnJvbSAnLi4vbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsJztcblxuZXhwb3J0IGNvbnN0IHNlcnZpY2VXb3JrZXJCcmlkZ2UgPSBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJzZXJ2aWNlV29ya2VyXCIpO1xuXG5jbGFzcyBFdmVudEVtaXR0ZXJUb0pTRXZlbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIGFkZEV2ZW50TGlzdGVuZXIodHlwZTpzdHJpbmcsIGxpc3RlbmVyOihldjpFcnJvckV2ZW50KSA9PiB2b2lkLCB1c2VDYXB0dXJlOmJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgZGlzcGF0Y2hFdmVudChldnQ6RXZlbnQpOiBib29sZWFuIHtcbiAgICAgICAgdGhpcy5lbWl0KGV2dC50eXBlLCBldnQpO1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZTpzdHJpbmcsIGxpc3RlbmVyOihldjpFcnJvckV2ZW50KSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpO1xuICAgIH1cbn1cblxuY2xhc3MgSHlicmlkU2VydmljZVdvcmtlciBleHRlbmRzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXIge1xuICAgIHNjb3BlOnN0cmluZztcbiAgICBzY3JpcHRVUkw6c3RyaW5nO1xuICAgIHByaXZhdGUgX2lkOm51bWJlcjtcblxuICAgIGluc3RhbGxTdGF0ZTpTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlXG4gICAgZ2V0IHN0YXRlKCk6c3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYWN0aXZhdGVkXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuQWN0aXZhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuIFwiYWN0aXZhdGluZ1wiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiaW5zdGFsbGVkXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGluZykge1xuICAgICAgICAgICAgcmV0dXJuIFwiaW5zdGFsbGluZ1wiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLlJlZHVuZGFudCkge1xuICAgICAgICAgICAgcmV0dXJuIFwicmVkdW5kYW50XCJcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbmlzZWQgaW5zdGFsbCBzdGF0ZTpcIiArIHRoaXMuaW5zdGFsbFN0YXRlKVxuICAgIH1cblxuICAgIG9uc3RhdGVjaGFuZ2U6KHN0YXRlY2hhbmdldmVudDphbnkpID0+IHZvaWQ7XG4gICAgb25tZXNzYWdlOihldjpNZXNzYWdlRXZlbnQpID0+IGFueTtcbiAgICBvbmVycm9yOiAoZXY6RXJyb3JFdmVudCkgPT4gYW55O1xuXG4gICAgY29uc3RydWN0b3IoaWQ6bnVtYmVyLCBzY3JpcHRVUkw6c3RyaW5nLCBzY29wZTpzdHJpbmcsIHN0YXRlOlNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUpIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICB0aGlzLl9pZCA9IGlkO1xuICAgICAgICB0aGlzLnNjcmlwdFVSTCA9IHNjcmlwdFVSTDtcbiAgICAgICAgdGhpcy5zY29wZSA9IHNjb3BlO1xuICAgICAgICB0aGlzLmluc3RhbGxTdGF0ZSA9IHN0YXRlO1xuICAgIH1cblxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlOiBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gdGhpcy5pbnN0YWxsU3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluc3RhbGxTdGF0ZSA9IHN0YXRlO1xuICAgICAgICBpZiAodGhpcy5vbnN0YXRlY2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLm9uc3RhdGVjaGFuZ2Uoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogdGhpc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBcbiAgICBwb3N0TWVzc2FnZShtZXNzYWdlOmFueSwgb3B0aW9uczogYW55W10pIHtcbiAgICAgICAgaWYgKFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFjdGl2ZSAhPT0gdGhpcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgcG9zdE1lc3NhZ2UgdG8gYWN0aXZlIHNlcnZpY2Ugd29ya2VyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubGVuZ3RoID4gMSB8fCBvcHRpb25zWzBdIGluc3RhbmNlb2YgTWVzc2FnZVBvcnQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdXJyZW50bHkgb25seSBzdXBwb3J0cyBzZW5kaW5nIG9uZSBNZXNzYWdlUG9ydFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygncG9zdCBtZXNzYWdlPycsIG1lc3NhZ2UpXG4gICAgICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2UsIFtvcHRpb25zWzBdIGFzIE1lc3NhZ2VQb3J0XSk7XG5cbiAgICB9IFxuXG4gICAgdGVybWluYXRlKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaG91bGQgbm90IGltcGxlbWVudCB0aGlzLlwiKTtcbiAgICB9XG5cbiAgICAvLyBhZGRFdmVudExpc3RlbmVyKHR5cGU6IFwiZXJyb3JcIiwgbGlzdGVuZXI6IChldjogRXJyb3JFdmVudCkgPT4gYW55LCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IHZvaWQge1xuXG4gICAgLy8gfVxuXG4gICAgXG59XG5cbmNsYXNzIEh5YnJpZFJlZ2lzdHJhdGlvbiBleHRlbmRzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24ge1xuICAgIFxuICAgIGFjdGl2ZTogSHlicmlkU2VydmljZVdvcmtlclxuICAgIGluc3RhbGxpbmc6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICB3YWl0aW5nOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgcHVzaE1hbmFnZXI6IGFueVxuICAgIG9udXBkYXRlZm91bmQ6ICgpID0+IHZvaWRcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJ1cGRhdGVmb3VuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbnVwZGF0ZWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbnVwZGF0ZWZvdW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5wdXNoTWFuYWdlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3B1c2g/JylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldE1vc3RSZWNlbnRXb3JrZXIoKTpIeWJyaWRTZXJ2aWNlV29ya2VyIHtcbiAgICAgICAgLy8gd2hlbiB3ZSB3YW50IHRoZSBtb3N0IGN1cnJlbnQsIHJlZ2FyZGxlc3Mgb2YgYWN0dWFsIHN0YXR1c1xuICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmUgfHwgdGhpcy53YWl0aW5nIHx8IHRoaXMuaW5zdGFsbGluZztcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwidXBkYXRlXCIsXG4gICAgICAgICAgICB1cmw6IHRoaXMuZ2V0TW9zdFJlY2VudFdvcmtlcigpLnNjcmlwdFVSTFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldCBzY29wZSgpOnN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZS5zY29wZTtcbiAgICB9XG5cbiAgICB1bnJlZ2lzdGVyKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3QgeWV0XCIpXG4gICAgfVxuXG4gICAgY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3c6SHlicmlkU2VydmljZVdvcmtlcik6dm9pZCB7XG4gICAgICAgIC8vIElmIGEgc2VydmljZSB3b3JrZXIgaGFzIGNoYW5nZWQgc3RhdGUsIHdlIHdhbnQgdG8gZW5zdXJlXG4gICAgICAgIC8vIHRoYXQgaXQgZG9lc24ndCBhcHBlYXIgaW4gYW55IG9sZCBzdGF0ZXNcbiAgICBcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbGluZyA9PT0gc3cpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGluZyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy53YWl0aW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFxuXG4gICAgYXNzaWduQWNjb3JkaW5nVG9JbnN0YWxsU3RhdGUoc3c6SHlicmlkU2VydmljZVdvcmtlcikge1xuXG4gICAgICAgIHRoaXMuY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3cpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN3Lmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0ZWQgJiYgIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHN3O1xuICAgICAgICAgICAgU2VydmljZVdvcmtlckNvbnRhaW5lci5jb250cm9sbGVyID0gc3c7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nID0gc3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN3Lmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmluc3RhbGxpbmcgPSBzdztcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInVwZGF0ZWZvdW5kXCIsIHN3KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgUmVnaXN0cmF0aW9uSW5zdGFuY2UgPSBuZXcgSHlicmlkUmVnaXN0cmF0aW9uKCk7XG5cbmNsYXNzIEh5YnJpZFNlcnZpY2VXb3JrZXJDb250YWluZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBTZXJ2aWNlV29ya2VyQ29udGFpbmVyICB7XG4gICAgY29udHJvbGxlcjogSHlicmlkU2VydmljZVdvcmtlclxuICAgIFxuICAgIG9uY29udHJvbGxlcmNoYW5nZTogKCkgPT4gdm9pZFxuICAgIG9uZXJyb3I6ICgpID0+IHZvaWRcbiAgICBvbm1lc3NhZ2U6ICgpID0+IHZvaWRcblxuICAgIGdldCByZWFkeSgpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udHJvbGxlcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlcnZpY2VXb3JrZXIgcmVhZHkgcmV0dXJuaW5nIGltbWVkaWF0ZWx5IHdpdGggYWN0aXZhdGVkIGluc3RhbmNlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShSZWdpc3RyYXRpb25JbnN0YW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlcnZpY2VXb3JrZXIgcmVhZHkgcmV0dXJuaW5nIHByb21pc2UgYW5kIHdhaXRpbmcuLi5cIik7XG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJjb250cm9sbGVyY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VydmljZVdvcmtlciByZWFkeSByZWNlaXZlZCByZXNwb25zZVwiKVxuICAgICAgICAgICAgICAgIGZ1bGZpbGwoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICBcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcImNvbnRyb2xsZXJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25jb250cm9sbGVyY2hhbmdlKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2VzIGl0IGV4cGVjdCBhcmd1bWVudHM/IFVuY2xlYXIuXG4gICAgICAgICAgICAgICAgdGhpcy5vbmNvbnRyb2xsZXJjaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5jb250cm9sbGVyID0gUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyKHVybDpzdHJpbmcsIG9wdGlvbnM6IFNlcnZpY2VXb3JrZXJSZWdpc3Rlck9wdGlvbnMpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcblxuICAgICAgICBsZXQgcGF0aFRvU1cgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aC5yZXNvbHZlKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSwgdXJsKTsgXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmluZm8oXCJBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIHNlcnZpY2Ugd29ya2VyIGF0XCIsIHBhdGhUb1NXKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicmVnaXN0ZXJcIixcbiAgICAgICAgICAgIHN3UGF0aDogdXJsLFxuICAgICAgICAgICAgc2NvcGU6IG9wdGlvbnMgPyBvcHRpb25zLnNjb3BlIDogbnVsbFxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocmVzcG9uc2U6U2VydmljZVdvcmtlck1hdGNoKSA9PiB7XG4gICAgICAgICAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKHJlc3BvbnNlKTtcbiAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gUmVnaXN0cmF0aW9uSW5zdGFuY2U7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xhaW1lZEJ5TmV3V29ya2VyKHN3Okh5YnJpZFNlcnZpY2VXb3JrZXIpIHtcbiAgICAgICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3cpO1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hY3RpdmUgPSBzdztcbiAgICAgICAgdGhpcy5jb250cm9sbGVyID0gc3c7XG4gICAgICAgIHRoaXMuZW1pdChcImNvbnRyb2xsZXJjaGFuZ2VcIiwgc3cpO1xuICAgIH1cblxuICAgIGdldFJlZ2lzdHJhdGlvbihzY29wZTpzdHJpbmcpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShSZWdpc3RyYXRpb25JbnN0YW5jZSk7XG4gICAgfVxuXG4gICAgZ2V0UmVnaXN0cmF0aW9ucygpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb25bXT4ge1xuICAgICAgICAvLyBOb3Qgc3VyZSB3aHkgd2UgZW5kIHVwIHdpdGggbW9yZSB0aGFuIG9uZSByZWdpc3RyYXRpb24sIGV2ZXIuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW1JlZ2lzdHJhdGlvbkluc3RhbmNlXSk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgU2VydmljZVdvcmtlckNvbnRhaW5lciA9IG5ldyBIeWJyaWRTZXJ2aWNlV29ya2VyQ29udGFpbmVyKCk7IFxuXG5lbnVtIFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUge1xuICAgIEluc3RhbGxpbmcgPSAwLFxuICAgIEluc3RhbGxlZCxcbiAgICBBY3RpdmF0aW5nLFxuICAgIEFjdGl2YXRlZCxcbiAgICBSZWR1bmRhbnRcbn1cblxuaW50ZXJmYWNlIFNlcnZpY2VXb3JrZXJNYXRjaCB7XG4gICAgdXJsOiBzdHJpbmcsXG4gICAgaW5zdGFsbFN0YXRlOiBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLFxuICAgIGluc3RhbmNlSWQ6bnVtYmVyLFxuICAgIHNjb3BlOiBzdHJpbmdcbn1cblxuY29uc3Qgc2VydmljZVdvcmtlclJlY29yZHM6IHtbaWQ6bnVtYmVyXSA6IEh5YnJpZFNlcnZpY2VXb3JrZXJ9ID0ge307XG5cbmZ1bmN0aW9uIHByb2Nlc3NOZXdXb3JrZXJNYXRjaChuZXdNYXRjaDpTZXJ2aWNlV29ya2VyTWF0Y2gpIHtcbiAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSByZWNvcmQsIHVzZSB0aGF0IG9uZVxuICAgIGxldCB3b3JrZXIgPSBzZXJ2aWNlV29ya2VyUmVjb3Jkc1tuZXdNYXRjaC5pbnN0YW5jZUlkXTtcblxuICAgIGlmICghd29ya2VyKSB7XG4gICAgICAgIC8vIG90aGVyd2lzZSwgbWFrZSBhIG5ldyBvbmVcbiAgICAgICAgd29ya2VyID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXIobmV3TWF0Y2guaW5zdGFuY2VJZCwgbmV3TWF0Y2gudXJsLCBuZXdNYXRjaC5zY29wZSwgbmV3TWF0Y2guaW5zdGFsbFN0YXRlKTtcbiAgICAgICAgc2VydmljZVdvcmtlclJlY29yZHNbbmV3TWF0Y2guaW5zdGFuY2VJZF0gPSB3b3JrZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd29ya2VyLnVwZGF0ZVN0YXRlKG5ld01hdGNoLmluc3RhbGxTdGF0ZSk7XG4gICAgfVxuXG4gICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuYXNzaWduQWNjb3JkaW5nVG9JbnN0YWxsU3RhdGUod29ya2VyKTtcblxuICAgIGNvbnNvbGUubG9nKFwiU1cgQ0hBTkdFXCIsIG5ld01hdGNoKTtcbiAgICByZXR1cm4gd29ya2VyO1xufVxuXG5zZXJ2aWNlV29ya2VyQnJpZGdlLmFkZExpc3RlbmVyKCdzdy1jaGFuZ2UnLCBwcm9jZXNzTmV3V29ya2VyTWF0Y2gpO1xuXG5zZXJ2aWNlV29ya2VyQnJpZGdlLmFkZExpc3RlbmVyKCdjbGFpbWVkJywgZnVuY3Rpb24obWF0Y2g6U2VydmljZVdvcmtlck1hdGNoKSB7XG4gICAgbGV0IHdvcmtlciA9IHByb2Nlc3NOZXdXb3JrZXJNYXRjaChtYXRjaCk7XG4gICAgY29uc29sZS5sb2coXCJDbGFpbWVkIGJ5IG5ldyB3b3JrZXJcIilcbiAgICBTZXJ2aWNlV29ya2VyQ29udGFpbmVyLmNsYWltZWRCeU5ld1dvcmtlcih3b3JrZXIpO1xufSlcbi8vIE9uIHBhZ2UgbG9hZCB3ZSBncmFiIGFsbCB0aGUgY3VycmVudGx5IGFwcGxpY2FibGUgc2VydmljZSB3b3JrZXJzXG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgb3BlcmF0aW9uOiBcImdldEFsbFwiXG59KS50aGVuKCh3b3JrZXJzOiBTZXJ2aWNlV29ya2VyTWF0Y2hbXSkgPT4ge1xuICAgIHdvcmtlcnMuZm9yRWFjaCgod29ya2VyKSA9PiB7XG4gICAgICAgIHNlcnZpY2VXb3JrZXJSZWNvcmRzW3dvcmtlci5pbnN0YW5jZUlkXSA9IG5ldyBIeWJyaWRTZXJ2aWNlV29ya2VyKHdvcmtlci5pbnN0YW5jZUlkLCB3b3JrZXIudXJsLCBcIlwiLCB3b3JrZXIuaW5zdGFsbFN0YXRlKTtcbiAgICAgICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuYXNzaWduQWNjb3JkaW5nVG9JbnN0YWxsU3RhdGUoc2VydmljZVdvcmtlclJlY29yZHNbd29ya2VyLmluc3RhbmNlSWRdKTtcbiAgICB9KVxufSkiLCJpbXBvcnQge3NlbmRBbmRSZWNlaXZlfSBmcm9tICcuLi91dGlsL3drLW1lc3NhZ2luZyc7XG5pbXBvcnQge3NlcnZpY2VXb3JrZXJCcmlkZ2UsIFNlcnZpY2VXb3JrZXJDb250YWluZXJ9IGZyb20gJy4vc3ctbWFuYWdlcic7XG5cbmxldCBuYXZpZ2F0b3JBc0FueTphbnkgPSBuYXZpZ2F0b3I7XG5cbm5hdmlnYXRvckFzQW55LnNlcnZpY2VXb3JrZXIgPSBTZXJ2aWNlV29ya2VyQ29udGFpbmVyOyIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcblxuY29uc3QgcHJvbWlzZUJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImNvbnNvbGVcIik7XG5cbmNvbnN0IG1ha2VTdWl0YWJsZSA9ICh2YWw6YW55KSA9PiB7XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB2YWwudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBcIm51bGxcIlxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCByZXR1cm5TdHJpbmcgPSBcIihub3Qgc3RyaW5naWZ5YWJsZSk6IFwiXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm5TdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyArPSBlcnIudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5TdHJpbmdcbiAgICB9XG59XG5cbmxldCBsZXZlbHMgPSBbJ2RlYnVnJywnaW5mbycsICdsb2cnLCAnZXJyb3InLCAnd2FybiddO1xuXG5sZXQgY29uc29sZTp7W2xldmVsOnN0cmluZ106IEZ1bmN0aW9ufSA9IHt9O1xuXG5sZXQgb3JpZ2luYWxDb25zb2xlID0gd2luZG93LmNvbnNvbGUgYXMgYW55O1xuXG4od2luZG93IGFzIGFueSkuY29uc29sZSA9IGNvbnNvbGU7XG5cbmxldmVscy5mb3JFYWNoKChsZXZlbCkgPT4ge1xuICAgIGNvbnNvbGVbbGV2ZWxdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAob3JpZ2luYWxDb25zb2xlKSB7XG4gICAgICAgICAgICAvLyBzdGlsbCBsb2cgb3V0IHRvIHdlYnZpZXcgY29uc29sZSwgaW4gY2FzZSB3ZSdyZSBhdHRhY2hlZFxuICAgICAgICAgICAgb3JpZ2luYWxDb25zb2xlW2xldmVsXS5hcHBseShvcmlnaW5hbENvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXJnc0FzSlNPTiA9IEFycmF5LmZyb20oYXJndW1lbnRzKS5tYXAobWFrZVN1aXRhYmxlKTtcblxuICAgICAgICBwcm9taXNlQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgYXJnczogYXJnc0FzSlNPTlxuICAgICAgICB9KVxuICAgIH1cbn0pIiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5cbmxldCBldmVudHNCcmlkZ2UgPSBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJldmVudHNcIik7XG5cbih3aW5kb3cgYXMgYW55KS5oeWJyaWRFdmVudHMgPSB7XG4gICAgZW1pdDogZnVuY3Rpb24obmFtZTpTdHJpbmcsIGRhdGE6U3RyaW5nKSB7XG4gICAgICAgIGV2ZW50c0JyaWRnZS5zZW5kKHtcbiAgICAgICAgICAgIG5hbWUsIGRhdGFcbiAgICAgICAgfSlcbiAgICB9XG59IiwiXG5sZXQgbm90aWZpY2F0aW9uID0ge1xuICAgIHJlcXVlc3RQZXJtaXNzaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICBcbiAgICB9XG59O1xuXG4od2luZG93IGFzIGFueSkuTm90aWZpY2F0aW9uID0gbm90aWZpY2F0aW9uOyIsIi8vIGltcG9ydCAnd2hhdHdnLWZldGNoJztcbi8vIGltcG9ydCAnLi91dGlsL292ZXJyaWRlLWxvZ2dpbmcnO1xuaW1wb3J0ICcuL25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlcic7XG5pbXBvcnQgJy4vY29uc29sZSc7XG5pbXBvcnQgJy4vbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsJztcbmltcG9ydCAnLi91dGlsL2dlbmVyaWMtZXZlbnRzJztcbmltcG9ydCAnLi9ub3RpZmljYXRpb24vbm90aWZpY2F0aW9uJ1xuXG53aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbn1cblxuLy8gZG9jdW1lbnQuYm9keS5pbm5lckhUTUw9XCJUSElTIExPQURFRFwiIl0sIm5hbWVzIjpbImFyZ3VtZW50cyIsInRoaXMiLCJ3ZWJraXQiLCJwYXRoLnJlc29sdmUiLCJwcm9taXNlQnJpZGdlIiwiY29uc29sZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxZQUFZLENBQUM7O0FBRWIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMs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LEdBQUcsQ0FBQztNQUM3QixHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU07TUFDdEIsSUFBSTtNQUNKLENBQUMsQ0FBQzs7RUFFTixJQUFJLFVBQVUsS0FBSyxPQUFPLFNBQVMsQ0FBQyxFQUFFLEVBQUU7SUFDdEMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOztJQUU5RSxRQUFRLEdBQUc7TUFDVCxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDMUQsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUM5RCxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUNsRSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDdEUsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUMxRSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFB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
