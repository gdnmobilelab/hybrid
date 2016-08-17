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

window.onerror = function (err) {
    console.error(err);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvcG9ydC1zdG9yZS50cyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcHJvbWlzZS10b29scy9saWIvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25hdmlnYXRvci9zdy1tYW5hZ2VyLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9jb25zb2xlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L3V0aWwvZ2VuZXJpYy1ldmVudHMudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvZG9jdW1lbnQtc3RhcnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuY29uc3Qgd2Via2l0ID0gKHdpbmRvdyBhcyBhbnkpLndlYmtpdDtcblxuLy8gV2UgbmVlZCB0aGVzZSBjYWxsYmFja3MgdG8gYmUgZ2xvYmFsbHkgYWNjZXNzaWJsZS5cbmNvbnN0IHByb21pc2VDYWxsYmFja3M6IHtba2V5OnN0cmluZ106IEZ1bmN0aW9ufSA9IHt9O1xuY29uc3QgcHJvbWlzZUJyaWRnZXM6IHtba2V5OnN0cmluZ106IFByb21pc2VPdmVyV0tNZXNzYWdlfSA9IHt9O1xuKHdpbmRvdyBhcyBhbnkpLl9fcHJvbWlzZUJyaWRnZUNhbGxiYWNrcyA9IHByb21pc2VDYWxsYmFja3M7XG4od2luZG93IGFzIGFueSkuX19wcm9taXNlQnJpZGdlcyA9IHByb21pc2VCcmlkZ2VzO1xuXG5leHBvcnQgY2xhc3MgUHJvbWlzZU92ZXJXS01lc3NhZ2UgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSBjYWxsYmFja0FycmF5OltGdW5jdGlvbiwgRnVuY3Rpb25dW10gPSBbXVxuICAgIHByaXZhdGUgbmFtZTpzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOnN0cmluZykge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIGlmICghd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZXNzYWdlIGhhbmRsZXIgXCIke25hbWV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdLl9yZWNlaXZlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb21pc2UgYnJpZGdlIGZvciBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c1wiYClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcHJvbWlzZUNhbGxiYWNrc1tuYW1lXSA9IHRoaXMucmVjZWl2ZVJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgICAgIHByb21pc2VCcmlkZ2VzW25hbWVdID0gdGhpcztcbiAgICB9XG5cbiAgICBicmlkZ2VQcm9taXNlKG1lc3NhZ2U6YW55KSB7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgbmV4dCBhdmFpbGFibGUgc2xvdCBpbiBvdXIgY2FsbGJhY2sgYXJyYXlcblxuICAgICAgICBsZXQgY2FsbGJhY2tJbmRleCA9IDA7XG4gICAgICAgIHdoaWxlICh0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBOb3cgaW5zZXJ0IG91ciBjYWxsYmFjayBpbnRvIHRoZSBjYWNoZWQgYXJyYXkuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IFtmdWxmaWxsLCByZWplY3RdO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlbmRpbmdcIiwge2NhbGxiYWNrSW5kZXgsIG1lc3NhZ2V9KVxuICAgICAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHtjYWxsYmFja0luZGV4LCBtZXNzYWdlfSk7XG5cbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIHNlbmQobWVzc2FnZTphbnkpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gd2Ugb25seSB3YW50IHRvIHNlbmQgYW5kIGFyZSBub3QgZXhwZWN0aW5nIGEgcmVzcG9uc2VcbiAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHttZXNzYWdlfSk7XG4gICAgfVxuXG4gICAgcmVjZWl2ZVJlc3BvbnNlKGNhbGxiYWNrSW5kZXg6bnVtYmVyLCBlcnI6c3RyaW5nLCByZXNwb25zZTogYW55KSB7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHRoaXNDYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byB1c2UgYSBjYWxsYmFjayB0aGF0IGRpZG4ndCBleGlzdFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZnJlZSB1cCB0aGlzIHNsb3QgZm9yIG5leHQgb3BlcmF0aW9uXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgW2Z1bGZpbGwsIHJlamVjdF0gPSB0aGlzQ2FsbGJhY2s7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmdWxmaWxsKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsImltcG9ydCB7TWVzc2FnZVBvcnRXcmFwcGVyfSBmcm9tICcuL21lc3NhZ2UtY2hhbm5lbCc7XG5cbmNvbnN0IGFjdGl2ZU1lc3NhZ2VQb3J0czpNZXNzYWdlUG9ydFdyYXBwZXJbXSA9IFtdXG5cbmNvbnN0IFBvcnRTdG9yZSA9IHtcblxuICAgIGFkZDogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGlmIChhY3RpdmVNZXNzYWdlUG9ydHMuaW5kZXhPZihwb3J0KSA+IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcnlpbmcgdG8gYWRkIGEgcG9ydCB0aGF0J3MgYWxyZWFkeSBiZWVuIGFkZGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5wdXNoKHBvcnQpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChwb3J0Ok1lc3NhZ2VQb3J0V3JhcHBlcikge1xuICAgICAgICBhY3RpdmVNZXNzYWdlUG9ydHMuc3BsaWNlKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpLCAxKTtcbiAgICB9LFxuXG4gICAgZmluZEJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgbGV0IGV4aXN0aW5nID0gYWN0aXZlTWVzc2FnZVBvcnRzLmZpbHRlcigocCkgPT4gcC5uYXRpdmVQb3J0SW5kZXggPT09IG5hdGl2ZUluZGV4KTtcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nWzBdO1xuICAgIH0sXG5cbiAgICBmaW5kT3JDcmVhdGVCeU5hdGl2ZUluZGV4OiBmdW5jdGlvbihuYXRpdmVJbmRleDpudW1iZXIpOk1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGlmICghbmF0aXZlSW5kZXggJiYgbmF0aXZlSW5kZXggIT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBhIG5hdGl2ZSBpbmRleFwiKVxuICAgICAgICB9XG4gICAgICBcbiAgICAgICAgbGV0IGV4aXN0aW5nID0gUG9ydFN0b3JlLmZpbmRCeU5hdGl2ZUluZGV4KG5hdGl2ZUluZGV4KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIHBvcnQgZm9yIHRoaXMuIFJldHVybiBpdC5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIG5vdCwgbWFrZSBhIG5ldyBvbmVcblxuICAgICAgICBsZXQgbmV3Q3VzdG9tID0gbmV3IE1lc3NhZ2VQb3J0V3JhcHBlcigpO1xuICAgICAgICBuZXdDdXN0b20ubmF0aXZlUG9ydEluZGV4ID0gbmF0aXZlSW5kZXg7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJDcmVhdGVkIG5ldyB3ZWIgTWVzc2FnZVBvcnQgZm9yIG5hdGl2ZSBpbmRleFwiLCBuYXRpdmVJbmRleClcbiAgICAgICAgXG4gICAgICAgIC8vIHRoaXMgYWxyZWFkeSBoYXMgYSBicmlkZ2UsIHNvIHdlIGNvbnNpZGVyIGl0ICdhY3RpdmUnXG4gICAgICAgIFBvcnRTdG9yZS5hZGQobmV3Q3VzdG9tKTtcbiAgICAgICAgcmV0dXJuIG5ld0N1c3RvbVxuICAgIH0sXG5cbiAgICBmaW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQ6IGZ1bmN0aW9uKHBvcnQ6TWVzc2FnZVBvcnQpOiBNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLmpzTWVzc2FnZVBvcnQgPT0gcG9ydCk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAvLyBBbHJlYWR5IGhhdmUgYSBwb3J0IGZvciB0aGlzLiBSZXR1cm4gaXQuXG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmV3Q3VzdG9tID0gbmV3IE1lc3NhZ2VQb3J0V3JhcHBlcihwb3J0KTtcblxuICAgICAgICAvLyB0aGlzIGhhcyBub3QgeWV0IGJlZW4gZ2l2ZW4gYSBuYXRpdmUgaW5kZXgsIHNvIHdlIGRvIG5vdFxuICAgICAgICAvLyBjb25zaWRlciBpdCBhY3RpdmUuXG5cbiAgICAgICAgcmV0dXJuIG5ld0N1c3RvbTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBvcnRTdG9yZTtcblxuLy8gZm9yIHRlc3Rpbmdcbih3aW5kb3cgYXMgYW55KS5oeWJyaWRQb3J0U3RvcmUgPSBQb3J0U3RvcmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9XG5cbnZhciBoYXNQcm9wID0gKHt9KS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoY2hpbGQsIHBhcmVudCkge1xuICAgIGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHtcbiAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIHtcbiAgICAgICAgICAgIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgfVxuICAgIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xuICAgIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxudmFyIFRpbWVvdXRFcnJvciA9IGV4cG9ydHMuVGltZW91dEVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGltZW91dEVycm9yKSkge1xuICAgICAgICByZXR1cm4gbmV3IFRpbWVvdXRFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYmV0dGVyLCBiZWNhdXNlIGl0IG1ha2VzIHRoZSByZXN1bHRpbmcgc3RhY2sgdHJhY2UgaGF2ZSB0aGUgY29ycmVjdCBlcnJvciBuYW1lLiAgQnV0LCBpdFxuICAgICAgICAvLyBvbmx5IHdvcmtzIGluIFY4L0Nocm9tZS5cbiAgICAgICAgVGltZW91dEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBIYWNraW5lc3MgZm9yIG90aGVyIGJyb3dzZXJzLlxuICAgICAgICB0aGlzLnN0YWNrID0gbmV3IEVycm9yKG1lc3NhZ2UpLnN0YWNrO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMubmFtZSA9IFwiVGltZW91dEVycm9yXCI7XG59O1xuZXh0ZW5kKFRpbWVvdXRFcnJvciwgRXJyb3IpO1xuXG4vKlxuICogUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgYG1zYCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkLiAgVGhlIHJldHVybmVkIFByb21pc2Ugd2lsbCBuZXZlciByZWplY3QuXG4gKi9cbmV4cG9ydHMuZGVsYXkgPSBmdW5jdGlvbiAobXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCBtcyk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogUmV0dXJucyBhIGB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fWAgb2JqZWN0LiAgVGhlIHJldHVybmVkIGBwcm9taXNlYCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHdoZW4gYHJlc29sdmVgIG9yXG4gKiBgcmVqZWN0YCBhcmUgY2FsbGVkLlxuICovXG5leHBvcnRzLmRlZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhbnN3ZXIgPSB7fTtcbiAgICBhbnN3ZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgYW5zd2VyLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICBhbnN3ZXIucmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuICAgIHJldHVybiBhbnN3ZXI7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXksIGB0YXNrc2AsIG9mIGZ1bmN0aW9ucyB3aGljaCByZXR1cm4gUHJvbWlzZXMsIGV4ZWN1dGVzIGVhY2ggZnVuY3Rpb24gaW4gYHRhc2tzYCBpbiBzZXJpZXMsIG9ubHlcbiAqIGNhbGxpbmcgdGhlIG5leHQgZnVuY3Rpb24gb25jZSB0aGUgcHJldmlvdXMgZnVuY3Rpb24gaGFzIGNvbXBsZXRlZC5cbiAqL1xuZXhwb3J0cy5zZXJpZXMgPSBmdW5jdGlvbiAodGFza3MpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHJldHVybiB0YXNrcy5yZWR1Y2UoZnVuY3Rpb24gKHNlcmllcywgdGFzaykge1xuICAgICAgICByZXR1cm4gc2VyaWVzLnRoZW4odGFzaykudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHBhcmFsbGVsLlxuICogSWYgYGxpbWl0YCBpcyBzdXBwbGllZCwgdGhlbiBhdCBtb3N0IGBsaW1pdGAgdGFza3Mgd2lsbCBiZSBleGVjdXRlZCBjb25jdXJyZW50bHkuXG4gKi9cbmV4cG9ydHMucGFyYWxsZWwgPSBleHBvcnRzLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbiAodGFza3MsIGxpbWl0KSB7XG4gICAgaWYgKCFsaW1pdCB8fCBsaW1pdCA8IDEgfHwgbGltaXQgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcy5tYXAoZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICAgICAgICB2YXIgY3VycmVudFRhc2sgPSAwO1xuICAgICAgICB2YXIgcnVubmluZyA9IDA7XG4gICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIHN0YXJ0VGFzayA9IGZ1bmN0aW9uIHN0YXJ0VGFzaygpIHtcbiAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRUYXNrID49IHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHRhc2tOdW1iZXIgPSBjdXJyZW50VGFzaysrO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrc1t0YXNrTnVtYmVyXTtcbiAgICAgICAgICAgIHJ1bm5pbmcrKztcblxuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW3Rhc2tOdW1iZXJdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHJ1bm5pbmctLTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPCB0YXNrcy5sZW5ndGggJiYgcnVubmluZyA8IGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVubmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU3RhcnQgdXAgYGxpbWl0YCB0YXNrcy5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICAgICAgICBzdGFydFRhc2soKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5IGBhcnJgIG9mIGl0ZW1zLCBjYWxscyBgaXRlcihpdGVtLCBpbmRleClgIGZvciBldmVyeSBpdGVtIGluIGBhcnJgLiAgYGl0ZXIoKWAgc2hvdWxkIHJldHVybiBhXG4gKiBQcm9taXNlLiAgVXAgdG8gYGxpbWl0YCBpdGVtcyB3aWxsIGJlIGNhbGxlZCBpbiBwYXJhbGxlbCAoZGVmYXVsdHMgdG8gMS4pXG4gKi9cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gKGFyciwgaXRlciwgbGltaXQpIHtcbiAgICB2YXIgdGFza0xpbWl0ID0gbGltaXQ7XG4gICAgaWYgKCFsaW1pdCB8fCBsaW1pdCA8IDEpIHtcbiAgICAgICAgdGFza0xpbWl0ID0gMTtcbiAgICB9XG4gICAgaWYgKGxpbWl0ID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgdGFza0xpbWl0ID0gYXJyLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgdGFza3MgPSBhcnIubWFwKGZ1bmN0aW9uIChpdGVtLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXIoaXRlbSwgaW5kZXgpO1xuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHJldHVybiBleHBvcnRzLnBhcmFsbGVsKHRhc2tzLCB0YXNrTGltaXQpO1xufTtcblxuLypcbiAqIEFkZCBhIHRpbWVvdXQgdG8gYW4gZXhpc3RpbmcgUHJvbWlzZS5cbiAqXG4gKiBSZXNvbHZlcyB0byB0aGUgc2FtZSB2YWx1ZSBhcyBgcGAgaWYgYHBgIHJlc29sdmVzIHdpdGhpbiBgbXNgIG1pbGxpc2Vjb25kcywgb3RoZXJ3aXNlIHRoZSByZXR1cm5lZCBQcm9taXNlIHdpbGxcbiAqIHJlamVjdCB3aXRoIHRoZSBlcnJvciBcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiAke21zfSBtaWxsaXNlY29uZHNcIlxuICovXG5leHBvcnRzLnRpbWVvdXQgPSBmdW5jdGlvbiAocCwgbXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIHJlamVjdChuZXcgZXhwb3J0cy5UaW1lb3V0RXJyb3IoXCJUaW1lb3V0OiBQcm9taXNlIGRpZCBub3QgcmVzb2x2ZSB3aXRoaW4gXCIgKyBtcyArIFwiIG1pbGxpc2Vjb25kc1wiKSk7XG4gICAgICAgIH0sIG1zKTtcblxuICAgICAgICBwLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLypcbiAqIENvbnRpbnVhbGx5IGNhbGwgYGZuKClgIHdoaWxlIGB0ZXN0KClgIHJldHVybnMgdHJ1ZS5cbiAqXG4gKiBgZm4oKWAgc2hvdWxkIHJldHVybiBhIFByb21pc2UuICBgdGVzdCgpYCBpcyBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdHJ1ZSBvZiBmYWxzZS5cbiAqXG4gKiBgd2hpbHN0YCB3aWxsIHJlc29sdmUgdG8gdGhlIGxhc3QgdmFsdWUgdGhhdCBgZm4oKWAgcmVzb2x2ZWQgdG8sIG9yIHdpbGwgcmVqZWN0IGltbWVkaWF0ZWx5IHdpdGggYW4gZXJyb3IgaWZcbiAqIGBmbigpYCByZWplY3RzIG9yIGlmIGBmbigpYCBvciBgdGVzdCgpYCB0aHJvdy5cbiAqL1xuZXhwb3J0cy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgZm4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgbGFzdFJlc3VsdCA9IG51bGw7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZuKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGRvSXQsIDApO1xuICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobGFzdFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9JdCgpO1xuICAgIH0pO1xufTtcblxuZXhwb3J0cy5kb1doaWxzdCA9IGZ1bmN0aW9uIChmbiwgdGVzdCkge1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG4gICAgdmFyIGRvVGVzdCA9IGZ1bmN0aW9uIGRvVGVzdCgpIHtcbiAgICAgICAgdmFyIGFuc3dlciA9IGZpcnN0IHx8IHRlc3QoKTtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9O1xuICAgIHJldHVybiBleHBvcnRzLndoaWxzdChkb1Rlc3QsIGZuKTtcbn07XG5cbi8qXG4gKiBrZWVwIGNhbGxpbmcgYGZuYCB1bnRpbCBpdCByZXR1cm5zIGEgbm9uLWVycm9yIHZhbHVlLCBkb2Vzbid0IHRocm93LCBvciByZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzLiBgZm5gIHdpbGwgYmVcbiAqIGF0dGVtcHRlZCBgdGltZXNgIG1hbnkgdGltZXMgYmVmb3JlIHJlamVjdGluZy4gSWYgYHRpbWVzYCBpcyBnaXZlbiBhcyBgSW5maW5pdHlgLCB0aGVuIGByZXRyeWAgd2lsbCBhdHRlbXB0IHRvXG4gKiByZXNvbHZlIGZvcmV2ZXIgKHVzZWZ1bCBpZiB5b3UgYXJlIGp1c3Qgd2FpdGluZyBmb3Igc29tZXRoaW5nIHRvIGZpbmlzaCkuXG4gKiBAcGFyYW0ge09iamVjdHxOdW1iZXJ9IG9wdGlvbnMgaGFzaCB0byBwcm92aWRlIGB0aW1lc2AgYW5kIGBpbnRlcnZhbGAuIERlZmF1bHRzICh0aW1lcz01LCBpbnRlcnZhbD0wKS4gSWYgdGhpcyB2YWx1ZVxuICogICAgICAgICAgICAgICAgICAgICAgICBpcyBhIG51bWJlciwgb25seSBgdGltZXNgIHdpbGwgYmUgc2V0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICBmbiB0aGUgdGFzay9jaGVjayB0byBiZSBwZXJmb3JtZWQuIENhbiBlaXRoZXIgcmV0dXJuIGEgc3luY2hyb25vdXMgdmFsdWUsIHRocm93IGFuIGVycm9yLCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYSBwcm9taXNlXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuZXhwb3J0cy5yZXRyeSA9IGZ1bmN0aW9uIChvcHRpb25zLCBmbikge1xuICAgIHZhciB0aW1lcyA9IDU7XG4gICAgdmFyIGludGVydmFsID0gMDtcbiAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgIHZhciBsYXN0QXR0ZW1wdCA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBtYWtlVGltZU9wdGlvbkVycm9yKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmd1bWVudCB0eXBlIGZvciAndGltZXMnOiBcIiArICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZih2YWx1ZSkpKTtcbiAgICB9XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIG9wdGlvbnMpIGZuID0gb3B0aW9ucztlbHNlIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMpIHRpbWVzID0gK29wdGlvbnM7ZWxzZSBpZiAoJ29iamVjdCcgPT09ICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG9wdGlvbnMpKSkge1xuICAgICAgICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBvcHRpb25zLnRpbWVzKSB0aW1lcyA9ICtvcHRpb25zLnRpbWVzO2Vsc2UgaWYgKG9wdGlvbnMudGltZXMpIHJldHVybiBQcm9taXNlLnJlamVjdChtYWtlVGltZU9wdGlvbkVycm9yKG9wdGlvbnMudGltZXMpKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5pbnRlcnZhbCkgaW50ZXJ2YWwgPSArb3B0aW9ucy5pbnRlcnZhbDtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMpIHJldHVybiBQcm9taXNlLnJlamVjdChtYWtlVGltZU9wdGlvbkVycm9yKG9wdGlvbnMpKTtlbHNlIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIHBhcmFtZXRlcnMgZ2l2ZW4nKSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgZG9JdCA9IGZ1bmN0aW9uIGRvSXQoKSB7XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4obGFzdEF0dGVtcHQpO1xuICAgICAgICAgICAgfSkudGhlbihyZXNvbHZlKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgICAgICBsYXN0QXR0ZW1wdCA9IGVycjtcbiAgICAgICAgICAgICAgICBpZiAodGltZXMgIT09IEluZmluaXR5ICYmIGF0dGVtcHRzID09PSB0aW1lcykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QobGFzdEF0dGVtcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59OyIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgUG9ydFN0b3JlIGZyb20gJy4vcG9ydC1zdG9yZSc7XG5pbXBvcnQgUHJvbWlzZVRvb2xzIGZyb20gJ3Byb21pc2UtdG9vbHMnO1xuXG5sZXQgd2Via2l0ID0gKHdpbmRvdyBhcyBhbnkpLndlYmtpdDtcblxuY29uc3QgcHJvbWlzZUJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcIm1lc3NhZ2VDaGFubmVsXCIpO1xuXG4vLyBXZSBuZWVkIHRoaXMgdG8gYmUgZ2xvYmFsbHkgYWNjZXNzaWJsZSBzbyB0aGF0IHdlIGNhbiB0cmlnZ2VyIHJlY2VpdmVcbi8vIGV2ZW50cyBtYW51YWxseVxuXG4od2luZG93IGFzIGFueSkuX19tZXNzYWdlQ2hhbm5lbEJyaWRnZSA9IHByb21pc2VCcmlkZ2U7XG5cbmludGVyZmFjZSBNZXNzYWdlUG9ydE1lc3NhZ2Uge1xuICAgIGRhdGE6c3RyaW5nLFxuICAgIHBhc3NlZFBvcnRJZHM6IG51bWJlcltdXG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKHBvcnRJbmRleDpudW1iZXIsIG1lc3NhZ2U6TWVzc2FnZVBvcnRNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlJlY2VpdmVkIGluY29taW5nIG1lc3NhZ2UgZnJvbSBuYXRpdmUsIHRvIHBvcnRcIiwgcG9ydEluZGV4LCBcIndpdGggbWVzc2FnZVwiLCBtZXNzYWdlKTtcbiAgICAgICAgbGV0IHRoaXNQb3J0ID0gUG9ydFN0b3JlLmZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXgocG9ydEluZGV4KTtcblxuICAgICAgICBpZiAoIXRoaXNQb3J0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byByZWNlaXZlIG1lc3NhZ2Ugb24gaW5hY3RpdmUgcG9ydFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtYXBwZWRQb3J0cyA9IG1lc3NhZ2UucGFzc2VkUG9ydElkcy5tYXAoKGlkKSA9PiB7XG4gICAgICAgICAgICAvLyBXZSBjYW4ndCBwYXNzIGluIGFjdHVhbCBtZXNzYWdlIHBvcnRzLCBzbyBpbnN0ZWFkIHdlIHBhc3MgaW5cbiAgICAgICAgICAgIC8vIHRoZWlyIElEcy4gTm93IHdlIG1hcCB0aGVtIHRvIG91ciB3cmFwcGVyIEN1c3RvbU1lc3NhZ2VQb3J0XG4gICAgICAgICAgICByZXR1cm4gUG9ydFN0b3JlLmZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXgoaWQpLmpzTWVzc2FnZVBvcnQ7XG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUG9zdGluZyBtZXNzYWdlIHRvIG5hdGl2ZSBpbmRleFwiLCB0aGlzUG9ydC5uYXRpdmVQb3J0SW5kZXgpO1xuICAgICAgICB0aGlzUG9ydC5zZW5kT3JpZ2luYWxQb3N0TWVzc2FnZShKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSksIG1hcHBlZFBvcnRzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgfVxuXG59XG5cbnByb21pc2VCcmlkZ2UuYWRkTGlzdGVuZXIoXCJlbWl0XCIsIHJlY2VpdmVNZXNzYWdlKTtcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VQb3J0V3JhcHBlciB7XG5cbiAgICBvcGVuOmJvb2xlYW47XG4gICAgbmF0aXZlUG9ydEluZGV4Om51bWJlcjtcbiAgICBqc01lc3NhZ2VQb3J0Ok1lc3NhZ2VQb3J0O1xuICAgIGpzTWVzc2FnZUNoYW5uZWw6TWVzc2FnZUNoYW5uZWw7XG4gICAgcHJpdmF0ZSBvcmlnaW5hbEpTUG9ydENsb3NlOkZ1bmN0aW9uO1xuXG4gICAgY29uc3RydWN0b3IoanNQb3J0Ok1lc3NhZ2VQb3J0ID0gbnVsbCkge1xuICAgICAgICB0aGlzLm5hdGl2ZVBvcnRJbmRleCA9IG51bGw7XG4gICAgICAgIGlmIChqc1BvcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDcmVhdGluZyB3cmFwcGVyIGZvciBhbiBleGlzdGluZyBNZXNzYWdlUG9ydFwiKVxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0ID0ganNQb3J0XG5cbiAgICAgICAgICAgIC8vIGRpc2d1c3RpbmcgaGFjaywgYnV0IGNhbid0IHNlZSBhbnkgd2F5IGFyb3VuZCBpcyBhcyB0aGVyZSBpcyBub1xuICAgICAgICAgICAgLy8gXCJoYXMgZGlzcGF0Y2hlZCBhIG1lc3NhZ2VcIiBldmVudCwgYXMgZmFyIGFzIEkgY2FuIHRlbGwgXG5cbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydC5wb3N0TWVzc2FnZSA9IHRoaXMuaGFuZGxlSlNNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiTWFraW5nIHdyYXBwZXIgZm9yIGEgbmV3IHdlYiBNZXNzYWdlUG9ydFwiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB3ZSBjYW4ndCBjcmVhdGUgYSBNZXNzYWdlUG9ydCBkaXJlY3RseSwgc28gd2UgaGF2ZSB0byBtYWtlXG4gICAgICAgICAgICAvLyBhIGNoYW5uZWwgdGhlbiB0YWtlIG9uZSBwb3J0IGZyb20gaXQuIEtpbmQgb2YgYSB3YXN0ZS5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VDaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQgPSB0aGlzLmpzTWVzc2FnZUNoYW5uZWwucG9ydDE7XG5cbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlQ2hhbm5lbC5wb3J0Mi5vbm1lc3NhZ2UgPSAoZXY6TWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gd2UgY2FuJ3QgcmVsaWFibHkgaG9vayBpbnRvIHBvc3RNZXNzYWdlLCBzbyB3ZSB1c2UgdGhpc1xuICAgICAgICAgICAgICAgIC8vIHRvIGNhdGNoIHBvc3RNZXNzYWdlcyB0b28uIE5lZWQgdG8gZG9jdW1lbnQgYWxsIHRoaXMgbWFkbmVzcy5cbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUpTTWVzc2FnZShldi5kYXRhLCBldi5wb3J0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTYW1lIGZvciB0aGUgbGFjayBvZiBhICdjbG9zZScgZXZlbnQuXG4gICAgICAgIHRoaXMub3JpZ2luYWxKU1BvcnRDbG9zZSA9IHRoaXMuanNNZXNzYWdlUG9ydC5jbG9zZTtcbiAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0LmNsb3NlID0gdGhpcy5jbG9zZTtcbiAgICB9XG5cbiAgICBzZW5kT3JpZ2luYWxQb3N0TWVzc2FnZShkYXRhOiBhbnksIHBvcnRzOiBNZXNzYWdlUG9ydFtdKSB7XG4gICAgICAgIE1lc3NhZ2VQb3J0LnByb3RvdHlwZS5wb3N0TWVzc2FnZS5hcHBseSh0aGlzLmpzTWVzc2FnZVBvcnQsIFtkYXRhLCBwb3J0c10pO1xuICAgIH1cblxuICAgIGhhbmRsZUpTTWVzc2FnZShkYXRhOmFueSwgcG9ydHM6IE1lc3NhZ2VQb3J0W10sIGlzRXhwbGljaXRQb3N0OmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUG9zdGluZyBuZXcgbWVzc2FnZS4uLlwiKVxuICAgICAgIFxuICAgICAgICAvLyBHZXQgb3VyIGN1c3RvbSBwb3J0IGluc3RhbmNlcywgY3JlYXRpbmcgdGhlbSBpZiBuZWNlc3NhcnlcbiAgICAgICAgbGV0IGN1c3RvbVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW107XG4gICAgICAgIFxuICAgICAgICBpZiAocG9ydHMpIHtcbiAgICAgICAgICAgIGN1c3RvbVBvcnRzID0gcG9ydHMubWFwKChwOk1lc3NhZ2VQb3J0KSA9PiBQb3J0U3RvcmUuZmluZE9yV3JhcEpTTWVzc3NhZ2VQb3J0KHApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gaWYgdGhleSB3ZXJlIGNyZWF0ZWQsIHRoZW4gd2UgbmVlZCB0byBhc3NpZ24gdGhlbSBhIG5hdGl2ZSBJRCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHdlIHNlbmQuXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ2hlY2tpbmcgdGhhdCBhZGRpdGlvbmFsIHBvcnRzIGhhdmUgbmF0aXZlIGVxdWl2YWxlbnRzXCIpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZVRvb2xzLm1hcChjdXN0b21Qb3J0cywgKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSA9PiBwb3J0LmNoZWNrRm9yTmF0aXZlUG9ydCgpKSBhcyBQcm9taXNlPGFueT5cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGFuIGV4cGxpY2l0IHBvc3RNZXNzYWdlIGNhbGwsIHdlIG5lZWQgdGhlIG5hdGl2ZVxuICAgICAgICAgICAgLy8gc2lkZSB0byBwaWNrIHVwIG9uIGl0IChzbyBpdCBkb2VzIHNvbWV0aGluZyB3aXRoIHRoZSBNZXNzYWdlUG9ydClcblxuICAgICAgICAgICAgcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb246IFwic2VuZFRvUG9ydFwiLFxuICAgICAgICAgICAgICAgIHBvcnRJbmRleDogdGhpcy5uYXRpdmVQb3J0SW5kZXgsXG4gICAgICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgICAgICAgICAgaXNFeHBsaWNpdFBvc3Q6IGlzRXhwbGljaXRQb3N0LFxuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQb3J0SW5kZXhlczogY3VzdG9tUG9ydHMubWFwKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2hlY2tGb3JOYXRpdmVQb3J0KCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICh0aGlzLm5hdGl2ZVBvcnRJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmRlYnVnKFwiUG9ydCBhbHJlYWR5IGhhcyBuYXRpdmUgaW5kZXhcIiwgdGhpcy5uYXRpdmVQb3J0SW5kZXgpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiY3JlYXRlXCJcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKHBvcnRJZDpudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDcmVhdGVkIG5ldyBuYXRpdmUgTWVzc2FnZVBvcnQgYXQgaW5kZXggXCIsIFN0cmluZyhwb3J0SWQpKVxuICAgICAgICAgICAgdGhpcy5uYXRpdmVQb3J0SW5kZXggPSBwb3J0SWQ7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgYWRkIHRvIG91ciBhcnJheSBvZiBhY3RpdmUgY2hhbm5lbHMgd2hlblxuICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIG5hdGl2ZSBJRFxuICAgICAgICAgICAgUG9ydFN0b3JlLmFkZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNsb3NlKCkge1xuXG4gICAgICAgIC8vIHJ1biB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2Ugb3Zlcndyb3RlXG4gICAgICAgIHRoaXMub3JpZ2luYWxKU1BvcnRDbG9zZS5hcHBseSh0aGlzLmpzTWVzc2FnZVBvcnQpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVtb3ZlIGZyb20gb3VyIGNhY2hlIG9mIGFjdGl2ZSBwb3J0c1xuICAgICAgICBQb3J0U3RvcmUucmVtb3ZlKHRoaXMpO1xuICAgICBcbiAgICAgICAgLy8gZmluYWxseSwgdGVsbCB0aGUgbmF0aXZlIGhhbGYgdG8gZGVsZXRlIHRoaXMgcmVmZXJlbmNlLlxuICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgb3BlcmF0aW9uOiBcImRlbGV0ZVwiLFxuICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2U6YW55LCBwb3J0czogW01lc3NhZ2VQb3J0XSkge1xuXG4gICAgbGV0IHBvcnRJbmRleGVzOm51bWJlcltdID0gW107XG5cbiAgICBQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKCgpID0+IHtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZVRvb2xzLm1hcChwb3J0cywgKHBvcnQ6TWVzc2FnZVBvcnQpID0+IHtcbiAgICAgICAgICAgIGxldCB3cmFwcGVyID0gbmV3IE1lc3NhZ2VQb3J0V3JhcHBlcihwb3J0KTtcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyLmNoZWNrRm9yTmF0aXZlUG9ydCgpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIubmF0aXZlUG9ydEluZGV4O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIC50aGVuKChwb3J0SW5kZXhlczpudW1iZXJbXSkgPT4ge1xuICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgb3BlcmF0aW9uOiBcInBvc3RNZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQb3J0SW5kZXhlczogcG9ydEluZGV4ZXNcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuXG4gICAgXG5cbn0iLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aC1icm93c2VyaWZ5JztcbmltcG9ydCB7cG9zdE1lc3NhZ2V9IGZyb20gJy4uL21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbCc7XG5cbmV4cG9ydCBjb25zdCBzZXJ2aWNlV29ya2VyQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwic2VydmljZVdvcmtlclwiKTtcblxuY2xhc3MgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBhZGRFdmVudExpc3RlbmVyKHR5cGU6c3RyaW5nLCBsaXN0ZW5lcjooZXY6RXJyb3JFdmVudCkgPT4gdm9pZCwgdXNlQ2FwdHVyZTpib29sZWFuKSB7XG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIGRpc3BhdGNoRXZlbnQoZXZ0OkV2ZW50KTogYm9vbGVhbiB7XG4gICAgICAgIHRoaXMuZW1pdChldnQudHlwZSwgZXZ0KTtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZW1vdmVFdmVudExpc3RlbmVyKHR5cGU6c3RyaW5nLCBsaXN0ZW5lcjooZXY6RXJyb3JFdmVudCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9XG59XG5cbmNsYXNzIEh5YnJpZFNlcnZpY2VXb3JrZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXJUb0pTRXZlbnQgaW1wbGVtZW50cyBTZXJ2aWNlV29ya2VyIHtcbiAgICBzY29wZTpzdHJpbmc7XG4gICAgc2NyaXB0VVJMOnN0cmluZztcbiAgICBwcml2YXRlIF9pZDpudW1iZXI7XG5cbiAgICBpbnN0YWxsU3RhdGU6U2VydmljZVdvcmtlckluc3RhbGxTdGF0ZVxuICAgIGdldCBzdGF0ZSgpOnN0cmluZyB7XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcImFjdGl2YXRlZFwiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBcImFjdGl2YXRpbmdcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcImluc3RhbGxlZFwiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBcImluc3RhbGxpbmdcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5SZWR1bmRhbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBcInJlZHVuZGFudFwiXG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGluc3RhbGwgc3RhdGU6XCIgKyB0aGlzLmluc3RhbGxTdGF0ZSlcbiAgICB9XG5cbiAgICBvbnN0YXRlY2hhbmdlOihzdGF0ZWNoYW5nZXZlbnQ6YW55KSA9PiB2b2lkO1xuICAgIG9ubWVzc2FnZTooZXY6TWVzc2FnZUV2ZW50KSA9PiBhbnk7XG4gICAgb25lcnJvcjogKGV2OkVycm9yRXZlbnQpID0+IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGlkOm51bWJlciwgc2NyaXB0VVJMOnN0cmluZywgc2NvcGU6c3RyaW5nLCBzdGF0ZTpTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICAgICAgdGhpcy5zY3JpcHRVUkwgPSBzY3JpcHRVUkw7XG4gICAgICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcbiAgICAgICAgdGhpcy5pbnN0YWxsU3RhdGUgPSBzdGF0ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZTogU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IHRoaXMuaW5zdGFsbFN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnN0YWxsU3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgaWYgKHRoaXMub25zdGF0ZWNoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy5vbnN0YXRlY2hhbmdlKHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG4gICAgcG9zdE1lc3NhZ2UobWVzc2FnZTphbnksIG9wdGlvbnM6IGFueVtdKSB7XG4gICAgICAgIGlmIChSZWdpc3RyYXRpb25JbnN0YW5jZS5hY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbiBvbmx5IHBvc3RNZXNzYWdlIHRvIGFjdGl2ZSBzZXJ2aWNlIHdvcmtlclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLmxlbmd0aCA+IDEgfHwgb3B0aW9uc1swXSBpbnN0YW5jZW9mIE1lc3NhZ2VQb3J0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgc2VuZGluZyBvbmUgTWVzc2FnZVBvcnRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBwb3N0TWVzc2FnZShtZXNzYWdlLCBbb3B0aW9uc1swXSBhcyBNZXNzYWdlUG9ydF0pO1xuXG4gICAgfSBcblxuICAgIHRlcm1pbmF0ZSgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2hvdWxkIG5vdCBpbXBsZW1lbnQgdGhpcy5cIik7XG4gICAgfVxuXG4gICAgLy8gYWRkRXZlbnRMaXN0ZW5lcih0eXBlOiBcImVycm9yXCIsIGxpc3RlbmVyOiAoZXY6IEVycm9yRXZlbnQpID0+IGFueSwgdXNlQ2FwdHVyZT86IGJvb2xlYW4pOiB2b2lkIHtcblxuICAgIC8vIH1cblxuICAgIFxufVxuXG5jbGFzcyBIeWJyaWRSZWdpc3RyYXRpb24gZXh0ZW5kcyBFdmVudEVtaXR0ZXJUb0pTRXZlbnQgaW1wbGVtZW50cyBTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uIHtcbiAgICBcbiAgICBhY3RpdmU6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBpbnN0YWxsaW5nOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgd2FpdGluZzogSHlicmlkU2VydmljZVdvcmtlclxuICAgIHB1c2hNYW5hZ2VyOiBhbnlcbiAgICBvbnVwZGF0ZWZvdW5kOiAoKSA9PiB2b2lkXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKFwidXBkYXRlZm91bmRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub251cGRhdGVmb3VuZCkge1xuICAgICAgICAgICAgICAgIHRoaXMub251cGRhdGVmb3VuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldE1vc3RSZWNlbnRXb3JrZXIoKTpIeWJyaWRTZXJ2aWNlV29ya2VyIHtcbiAgICAgICAgLy8gd2hlbiB3ZSB3YW50IHRoZSBtb3N0IGN1cnJlbnQsIHJlZ2FyZGxlc3Mgb2YgYWN0dWFsIHN0YXR1c1xuICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmUgfHwgdGhpcy53YWl0aW5nIHx8IHRoaXMuaW5zdGFsbGluZztcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwidXBkYXRlXCIsXG4gICAgICAgICAgICB1cmw6IHRoaXMuZ2V0TW9zdFJlY2VudFdvcmtlcigpLnNjcmlwdFVSTFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldCBzY29wZSgpOnN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZS5zY29wZTtcbiAgICB9XG5cbiAgICB1bnJlZ2lzdGVyKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3QgeWV0XCIpXG4gICAgfVxuXG4gICAgY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3c6SHlicmlkU2VydmljZVdvcmtlcik6dm9pZCB7XG4gICAgICAgIC8vIElmIGEgc2VydmljZSB3b3JrZXIgaGFzIGNoYW5nZWQgc3RhdGUsIHdlIHdhbnQgdG8gZW5zdXJlXG4gICAgICAgIC8vIHRoYXQgaXQgZG9lc24ndCBhcHBlYXIgaW4gYW55IG9sZCBzdGF0ZXNcbiAgICBcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbGluZyA9PT0gc3cpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGluZyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy53YWl0aW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFxuXG4gICAgYXNzaWduQWNjb3JkaW5nVG9JbnN0YWxsU3RhdGUoc3c6SHlicmlkU2VydmljZVdvcmtlcikge1xuXG4gICAgICAgIHRoaXMuY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3cpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHN3Lmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0ZWQgJiYgIXRoaXMuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHN3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN3Lmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdGluZyA9IHN3O1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGluZykge1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsaW5nID0gc3c7XG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJ1cGRhdGVmb3VuZFwiLCBzdyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IFJlZ2lzdHJhdGlvbkluc3RhbmNlID0gbmV3IEh5YnJpZFJlZ2lzdHJhdGlvbigpO1xuXG5jbGFzcyBIeWJyaWRTZXJ2aWNlV29ya2VyQ29udGFpbmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIGltcGxlbWVudHMgU2VydmljZVdvcmtlckNvbnRhaW5lciAge1xuICAgIGNvbnRyb2xsZXI6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBcbiAgICBvbmNvbnRyb2xsZXJjaGFuZ2U6ICgpID0+IHZvaWRcbiAgICBvbmVycm9yOiAoKSA9PiB2b2lkXG4gICAgb25tZXNzYWdlOiAoKSA9PiB2b2lkXG5cbiAgICBnZXQgcmVhZHkoKTogUHJvbWlzZTxTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uPiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZXJ2aWNlV29ya2VyIHJlYWR5IHJldHVybmluZyBpbW1lZGlhdGVseSB3aXRoIGFjdGl2YXRlZCBpbnN0YW5jZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoUmVnaXN0cmF0aW9uSW5zdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChmdWxmaWxsLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZXJ2aWNlV29ya2VyIHJlYWR5IHJldHVybmluZyBwcm9taXNlIGFuZCB3YWl0aW5nLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5vbmNlKFwiY29udHJvbGxlcmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlcnZpY2VXb3JrZXIgcmVhZHkgcmVjZWl2ZWQgcmVzcG9uc2VcIilcbiAgICAgICAgICAgICAgICBmdWxmaWxsKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJjb250cm9sbGVyY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uY29udHJvbGxlcmNoYW5nZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBpdCBleHBlY3QgYXJndW1lbnRzPyBVbmNsZWFyLlxuICAgICAgICAgICAgICAgIHRoaXMub25jb250cm9sbGVyY2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcmVnaXN0ZXIodXJsOnN0cmluZywgb3B0aW9uczogU2VydmljZVdvcmtlclJlZ2lzdGVyT3B0aW9ucyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuXG4gICAgICAgIGxldCBwYXRoVG9TVyA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoLnJlc29sdmUod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLCB1cmwpOyBcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIkF0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgc2VydmljZSB3b3JrZXIgYXRcIiwgcGF0aFRvU1cpO1xuICAgIFxuICAgICAgICByZXR1cm4gc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJyZWdpc3RlclwiLFxuICAgICAgICAgICAgc3dQYXRoOiB1cmwsXG4gICAgICAgICAgICBzY29wZTogb3B0aW9ucyA/IG9wdGlvbnMuc2NvcGUgOiBudWxsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXNwb25zZTpTZXJ2aWNlV29ya2VyTWF0Y2gpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JrZXIgPSBwcm9jZXNzTmV3V29ya2VyTWF0Y2gocmVzcG9uc2UpO1xuICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBSZWdpc3RyYXRpb25JbnN0YW5jZTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjbGFpbWVkQnlOZXdXb3JrZXIoc3c6SHlicmlkU2VydmljZVdvcmtlcikge1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFjdGl2ZSA9IHN3O1xuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBzdztcbiAgICAgICAgdGhpcy5lbWl0KFwiY29udHJvbGxlcmNoYW5nZVwiLCBzdyk7XG4gICAgfVxuXG4gICAgZ2V0UmVnaXN0cmF0aW9uKHNjb3BlOnN0cmluZyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBnZXRSZWdpc3RyYXRpb25zKCk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbltdPiB7XG4gICAgICAgIC8vIE5vdCBzdXJlIHdoeSB3ZSBlbmQgdXAgd2l0aCBtb3JlIHRoYW4gb25lIHJlZ2lzdHJhdGlvbiwgZXZlci5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbUmVnaXN0cmF0aW9uSW5zdGFuY2VdKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBTZXJ2aWNlV29ya2VyQ29udGFpbmVyID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXJDb250YWluZXIoKTsgXG5cbmVudW0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSB7XG4gICAgSW5zdGFsbGluZyA9IDAsXG4gICAgSW5zdGFsbGVkLFxuICAgIEFjdGl2YXRpbmcsXG4gICAgQWN0aXZhdGVkLFxuICAgIFJlZHVuZGFudFxufVxuXG5pbnRlcmZhY2UgU2VydmljZVdvcmtlck1hdGNoIHtcbiAgICB1cmw6IHN0cmluZyxcbiAgICBpbnN0YWxsU3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUsXG4gICAgaW5zdGFuY2VJZDpudW1iZXIsXG4gICAgc2NvcGU6IHN0cmluZ1xufVxuXG5jb25zdCBzZXJ2aWNlV29ya2VyUmVjb3Jkczoge1tpZDpudW1iZXJdIDogSHlicmlkU2VydmljZVdvcmtlcn0gPSB7fTtcblxuZnVuY3Rpb24gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG5ld01hdGNoOlNlcnZpY2VXb3JrZXJNYXRjaCkge1xuICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCwgdXNlIHRoYXQgb25lXG4gICAgbGV0IHdvcmtlciA9IHNlcnZpY2VXb3JrZXJSZWNvcmRzW25ld01hdGNoLmluc3RhbmNlSWRdO1xuXG4gICAgaWYgKCF3b3JrZXIpIHtcbiAgICAgICAgLy8gb3RoZXJ3aXNlLCBtYWtlIGEgbmV3IG9uZVxuICAgICAgICB3b3JrZXIgPSBuZXcgSHlicmlkU2VydmljZVdvcmtlcihuZXdNYXRjaC5pbnN0YW5jZUlkLCBuZXdNYXRjaC51cmwsIG5ld01hdGNoLnNjb3BlLCBuZXdNYXRjaC5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBzZXJ2aWNlV29ya2VyUmVjb3Jkc1tuZXdNYXRjaC5pbnN0YW5jZUlkXSA9IHdvcmtlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3b3JrZXIudXBkYXRlU3RhdGUobmV3TWF0Y2guaW5zdGFsbFN0YXRlKTtcbiAgICB9XG5cbiAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZSh3b3JrZXIpO1xuXG4gICAgY29uc29sZS5sb2coXCJTVyBDSEFOR0VcIiwgbmV3TWF0Y2gpO1xuICAgIHJldHVybiB3b3JrZXI7XG59XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ3N3LWNoYW5nZScsIHByb2Nlc3NOZXdXb3JrZXJNYXRjaCk7XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ2NsYWltZWQnLCBmdW5jdGlvbihtYXRjaDpTZXJ2aWNlV29ya2VyTWF0Y2gpIHtcbiAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG1hdGNoKTtcbiAgICBjb25zb2xlLmxvZyhcIkNsYWltZWQgYnkgbmV3IHdvcmtlclwiKVxuICAgIFNlcnZpY2VXb3JrZXJDb250YWluZXIuY2xhaW1lZEJ5TmV3V29ya2VyKHdvcmtlcik7XG59KVxuLy8gT24gcGFnZSBsb2FkIHdlIGdyYWIgYWxsIHRoZSBjdXJyZW50bHkgYXBwbGljYWJsZSBzZXJ2aWNlIHdvcmtlcnNcblxuc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICBvcGVyYXRpb246IFwiZ2V0QWxsXCJcbn0pLnRoZW4oKHdvcmtlcnM6IFNlcnZpY2VXb3JrZXJNYXRjaFtdKSA9PiB7XG4gICAgd29ya2Vycy5mb3JFYWNoKCh3b3JrZXIpID0+IHtcbiAgICAgICAgc2VydmljZVdvcmtlclJlY29yZHNbd29ya2VyLmluc3RhbmNlSWRdID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXIod29ya2VyLmluc3RhbmNlSWQsIHdvcmtlci51cmwsIFwiXCIsIHdvcmtlci5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0pO1xuICAgIH0pXG59KSIsImltcG9ydCB7c2VuZEFuZFJlY2VpdmV9IGZyb20gJy4uL3V0aWwvd2stbWVzc2FnaW5nJztcbmltcG9ydCB7c2VydmljZVdvcmtlckJyaWRnZSwgU2VydmljZVdvcmtlckNvbnRhaW5lcn0gZnJvbSAnLi9zdy1tYW5hZ2VyJztcblxubGV0IG5hdmlnYXRvckFzQW55OmFueSA9IG5hdmlnYXRvcjtcblxubmF2aWdhdG9yQXNBbnkuc2VydmljZVdvcmtlciA9IFNlcnZpY2VXb3JrZXJDb250YWluZXI7IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwiY29uc29sZVwiKTtcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHJldHVyblN0cmluZyA9IFwiKG5vdCBzdHJpbmdpZnlhYmxlKTogXCJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuU3RyaW5nICs9IGVyci50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHVyblN0cmluZ1xuICAgIH1cbn1cblxubGV0IGxldmVscyA9IFsnZGVidWcnLCdpbmZvJywgJ2xvZycsICdlcnJvcicsICd3YXJuJ107XG5cbmxldCBjb25zb2xlOntbbGV2ZWw6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5cbmxldCBvcmlnaW5hbENvbnNvbGUgPSB3aW5kb3cuY29uc29sZSBhcyBhbnk7XG5cbih3aW5kb3cgYXMgYW55KS5jb25zb2xlID0gY29uc29sZTtcblxubGV2ZWxzLmZvckVhY2goKGxldmVsKSA9PiB7XG4gICAgY29uc29sZVtsZXZlbF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmlnaW5hbENvbnNvbGUpIHtcbiAgICAgICAgICAgIC8vIHN0aWxsIGxvZyBvdXQgdG8gd2VidmlldyBjb25zb2xlLCBpbiBjYXNlIHdlJ3JlIGF0dGFjaGVkXG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVbbGV2ZWxdLmFwcGx5KG9yaWdpbmFsQ29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcmdzQXNKU09OID0gQXJyYXkuZnJvbShhcmd1bWVudHMpLm1hcChtYWtlU3VpdGFibGUpO1xuXG4gICAgICAgIHByb21pc2VCcmlkZ2Uuc2VuZCh7XG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBhcmdzOiBhcmdzQXNKU09OXG4gICAgICAgIH0pXG4gICAgfVxufSkiLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcblxubGV0IGV2ZW50c0JyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImV2ZW50c1wiKTtcblxuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZEV2ZW50cyA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihuYW1lOlN0cmluZywgZGF0YTpTdHJpbmcpIHtcbiAgICAgICAgZXZlbnRzQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbmFtZSwgZGF0YVxuICAgICAgICB9KVxuICAgIH1cbn0iLCIvLyBpbXBvcnQgJ3doYXR3Zy1mZXRjaCc7XG4vLyBpbXBvcnQgJy4vdXRpbC9vdmVycmlkZS1sb2dnaW5nJztcbmltcG9ydCAnLi9uYXZpZ2F0b3Ivc2VydmljZS13b3JrZXInO1xuaW1wb3J0ICcuL2NvbnNvbGUnO1xuaW1wb3J0ICcuL21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbCc7XG5pbXBvcnQgJy4vdXRpbC9nZW5lcmljLWV2ZW50cyc7XG5cbndpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xufVxuXG4vLyBkb2N1bWVudC5ib2R5LmlubmVySFRNTD1cIlRISVMgTE9BREVEXCIiXSwibmFtZXMiOlsiYXJndW1lbnRzIiwidGhpcyIsIndlYmtpdCIsInBhdGgucmVzb2x2ZSIsInByb21pc2VCcmlkZ2UiLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLFlBQVksQ0FBQzs7QUFFYixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQzs7Ozs7Ozs7OztBQVUxQyxJQUFJLE1BQU0sR0FBRyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7QUFVL0QsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7RUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztFQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLENBQUM7Q0FDM0I7Ozs7Ozs7OztBQVNELFNBQVMsWUFBWSxHQUFHLHdCQUF3Qjs7Ozs7Ozs7QUFRaEQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDOzs7Ozs7Ozs7QUFTM0MsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxVQUFVLEdBQUc7RUFDeEQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU87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QUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ2xFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUN0RSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQy9FOztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDbEQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsV0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVCOztJQUVELFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDN0MsTUFBTTtJQUNMLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO1FBQ3pCLENBQUMsQ0FBQzs7SUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMzQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUVDLE1BQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOztNQUVwRixRQUFRLEdBQUc7UUFDVCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzFELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzlELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNsRTtVQUNFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHRCxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDNUI7O1VBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNyRDtLQUNGO0dBQ0Y7O0VBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYixDQUFDOzs7Ozs7Ozs7O0FBVUYsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUM7TUFDdEMsR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7T0FDaEQ7SUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRztNQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVE7S0FDNUIsQ0FBQztHQUNIOztFQUVELE9BQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7Ozs7Ozs7OztBQVVGLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQzlELElBQUksUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQztNQUM1QyxHQUFHLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDOztFQUUxQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMs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RCxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0gsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDakU7O0FBRUQsQUFBTyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUM1Rzs7QUFFRCxBQUFPLFNBQVMsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7SUFDM0MsT0FBTyxVQUFVLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUFFO0NBQ3hFOztBQUVELEFBQU8sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQ3pELE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUN2RCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDM0YsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDL0ksSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMs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
