var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index = createCommonjsModule(function (module, exports) {
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

interopDefault(index);
var extname = index.extname;
var basename = index.basename;
var dirname = index.dirname;
var delimiter = index.delimiter;
var sep = index.sep;
var relative = index.relative;
var join = index.join;
var isAbsolute = index.isAbsolute;
var normalize = index.normalize;
var resolve = index.resolve;

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

function send(msg) {
    if (typeof msg.arguments === "object") {
        msg.arguments = JSON.stringify(msg.arguments);
    }
    window.webkit.messageHandlers.hybrid.postMessage(msg);
}
// WebKit messageHandlers don't actually allow a response, so instead
// we store an array of callback functions, which we then call in-app
// with a window._hybridCallback call. 
var callbackArray = [];
function sendAndReceive(msg) {
    var callbackIndex = 0;
    while (callbackArray[callbackIndex]) {
        callbackIndex++;
    }
    return new Promise(function (fulfill, reject) {
        callbackArray[callbackIndex] = function (err, resp) {
            callbackArray[callbackIndex] = null;
            if (err) {
                return reject(err);
            }
            else {
                return fulfill(resp);
            }
        };
        msg._callbackIndex = callbackIndex;
        send(msg);
    });
}
;
window._hybridCallback = function (callbackIndex, err, resp) {
    console.log('idx', callbackIndex);
    callbackArray[callbackIndex](err, resp);
};

var navigatorAsAny = navigator;
navigatorAsAny.serviceWorker = {
    register: function (swPath, opts) {
        if (opts === void 0) { opts = {}; }
        var pathToSW = window.location.origin + resolve(window.location.pathname, swPath);
        console.info("Attempting to register service worker at", pathToSW);
        return sendAndReceive({
            command: "navigator.serviceWorker.register",
            arguments: {
                path: swPath,
                options: opts
            }
        })
            .then(function (response) {
            console.log("done?", response);
        });
    }
};

var index$2 = createCommonjsModule(function (module) {
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

var EventEmitter = interopDefault(index$2);

var webkit = window.webkit;
// We need these callbacks to be globally accessible.
var promiseCallbacks = {};
window.__promiseBridgeCallbacks = promiseCallbacks;
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

var promiseBridge = new PromiseOverWKMessage("console");
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
        return JSON.stringify(val);
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
        promiseBridge.send({
            level: level,
            args: argsAsJSON
        });
    };
});

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
        console.debug("Find or create by native index", nativeIndex);
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
var promiseBridge$1 = new PromiseOverWKMessage("messageChannel");
// We need this to be globally accessible so that we can trigger receive
// events manually
window.__messageChannelBridge = promiseBridge$1;
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
        // let messageEvent = new MessageEvent("message", {
        //     data: message.data,
        //     ports: mappedPorts
        // });
        //thisPort.jsMessagePort.dispatchEvent(messageEvent);
        console.debug("Posting message to native index", thisPort.nativePortIndex);
        thisPort.sendOriginalPostMessage(message.data, mappedPorts);
    }
    catch (err) {
        console.error(err);
    }
}
promiseBridge$1.addListener("emit", receiveMessage);
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
    MessagePortWrapper.prototype.handleJSMessage = function (data, ports) {
        var _this = this;
        console.debug("Posting new message...");
        // run the original function, in case anything depends on it.
        //this.sendOriginalPostMessage(data, ports);
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
            console.log("Mapped additional ports to indexes", customPorts.map(function (p) { return p.nativePortIndex; }));
            promiseBridge$1.bridgePromise({
                operation: "post",
                portIndex: _this.nativePortIndex,
                data: JSON.stringify(data),
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
        console.debug("Getting new native index for port");
        return promiseBridge$1.bridgePromise({
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
        promiseBridge$1.bridgePromise({
            operation: "delete",
            portIndex: this.nativePortIndex
        });
    };
    return MessagePortWrapper;
}());
// class CustomMessageChannel {
//     port1:CustomMessagePort;
//     port2:CustomMessagePort;
//     constructor() {
//         this.port1 = new CustomMessagePort();
//         this.port2 = new CustomMessagePort();
//     }
// }
var windowAsAny = window;

window.onerror = function (err) {
    console.error(err);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9yb2xsdXAtcGx1Z2luLXR5cGVzY3JpcHQvc3JjL3R5cGVzY3JpcHQtaGVscGVycy5qcyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL3drLW1lc3NhZ2luZy50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc2VydmljZS13b3JrZXIudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L2NvbnNvbGUudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvcG9ydC1zdG9yZS50cyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcHJvbWlzZS10b29scy9saWIvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L2RvY3VtZW50LXN0YXJ0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHNlbmQobXNnKSB7XG4gICAgaWYgKHR5cGVvZiBtc2cuYXJndW1lbnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1zZy5hcmd1bWVudHMgPSBKU09OLnN0cmluZ2lmeShtc2cuYXJndW1lbnRzKTtcbiAgICB9XG4gICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMuaHlicmlkLnBvc3RNZXNzYWdlKG1zZyk7XG59XG5cbi8vIFdlYktpdCBtZXNzYWdlSGFuZGxlcnMgZG9uJ3QgYWN0dWFsbHkgYWxsb3cgYSByZXNwb25zZSwgc28gaW5zdGVhZFxuLy8gd2Ugc3RvcmUgYW4gYXJyYXkgb2YgY2FsbGJhY2sgZnVuY3Rpb25zLCB3aGljaCB3ZSB0aGVuIGNhbGwgaW4tYXBwXG4vLyB3aXRoIGEgd2luZG93Ll9oeWJyaWRDYWxsYmFjayBjYWxsLiBcblxuY29uc3QgY2FsbGJhY2tBcnJheSA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gc2VuZEFuZFJlY2VpdmUobXNnKSB7XG4gICAgXG4gICAgbGV0IGNhbGxiYWNrSW5kZXggPSAwO1xuXG4gICAgd2hpbGUgKGNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0pIHtcbiAgICAgICAgY2FsbGJhY2tJbmRleCsrO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSAoZXJyLCByZXNwKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdWxmaWxsKHJlc3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBtc2cuX2NhbGxiYWNrSW5kZXggPSBjYWxsYmFja0luZGV4O1xuICAgICAgICBzZW5kKG1zZyk7XG4gICAgfSk7XG59O1xuXG53aW5kb3cuX2h5YnJpZENhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2tJbmRleCwgZXJyLCByZXNwKSB7XG4gICAgY29uc29sZS5sb2coJ2lkeCcsY2FsbGJhY2tJbmRleClcbiAgICBjYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdKGVyciwgcmVzcCk7XG59IiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoLWJyb3dzZXJpZnknO1xuaW1wb3J0IHtzZW5kQW5kUmVjZWl2ZX0gZnJvbSAnLi4vdXRpbC93ay1tZXNzYWdpbmcnO1xuXG5sZXQgbmF2aWdhdG9yQXNBbnk6YW55ID0gbmF2aWdhdG9yO1xuXG5uYXZpZ2F0b3JBc0FueS5zZXJ2aWNlV29ya2VyID0ge1xuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihzd1BhdGg6c3RyaW5nLCBvcHRzID0ge30pIHtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgbGV0IHBhdGhUb1NXID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHBhdGgucmVzb2x2ZSh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsIHN3UGF0aCk7IFxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5pbmZvKFwiQXR0ZW1wdGluZyB0byByZWdpc3RlciBzZXJ2aWNlIHdvcmtlciBhdFwiLCBwYXRoVG9TVyk7XG5cbiAgICAgICAgcmV0dXJuIHNlbmRBbmRSZWNlaXZlKHtcbiAgICAgICAgICAgIGNvbW1hbmQ6IFwibmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXJcIixcbiAgICAgICAgICAgIGFyZ3VtZW50czoge1xuICAgICAgICAgICAgICAgIHBhdGg6IHN3UGF0aCxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJkb25lP1wiLCByZXNwb25zZSk7XG4gICAgICAgIH0pXG4gICAgfVxufSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcbmNvbnN0IHdlYmtpdCA9ICh3aW5kb3cgYXMgYW55KS53ZWJraXQ7XG5cbi8vIFdlIG5lZWQgdGhlc2UgY2FsbGJhY2tzIHRvIGJlIGdsb2JhbGx5IGFjY2Vzc2libGUuXG5jb25zdCBwcm9taXNlQ2FsbGJhY2tzOiB7W2tleTpzdHJpbmddOiBGdW5jdGlvbn0gPSB7fTtcbih3aW5kb3cgYXMgYW55KS5fX3Byb21pc2VCcmlkZ2VDYWxsYmFja3MgPSBwcm9taXNlQ2FsbGJhY2tzO1xuXG5leHBvcnQgY2xhc3MgUHJvbWlzZU92ZXJXS01lc3NhZ2UgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSBjYWxsYmFja0FycmF5OltGdW5jdGlvbiwgRnVuY3Rpb25dW10gPSBbXVxuICAgIHByaXZhdGUgbmFtZTpzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOnN0cmluZykge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIGlmICghd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZXNzYWdlIGhhbmRsZXIgXCIke25hbWV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdLl9yZWNlaXZlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb21pc2UgYnJpZGdlIGZvciBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c1wiYClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcHJvbWlzZUNhbGxiYWNrc1tuYW1lXSA9IHRoaXMucmVjZWl2ZVJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgYnJpZGdlUHJvbWlzZShtZXNzYWdlOmFueSkge1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIG5leHQgYXZhaWxhYmxlIHNsb3QgaW4gb3VyIGNhbGxiYWNrIGFycmF5XG5cbiAgICAgICAgbGV0IGNhbGxiYWNrSW5kZXggPSAwO1xuICAgICAgICB3aGlsZSAodGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdKSB7XG4gICAgICAgICAgICBjYWxsYmFja0luZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChmdWxmaWxsLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gTm93IGluc2VydCBvdXIgY2FsbGJhY2sgaW50byB0aGUgY2FjaGVkIGFycmF5LlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSBbZnVsZmlsbCwgcmVqZWN0XTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZW5kaW5nXCIsIHtjYWxsYmFja0luZGV4LCBtZXNzYWdlfSlcbiAgICAgICAgICAgIHdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbdGhpcy5uYW1lXS5wb3N0TWVzc2FnZSh7Y2FsbGJhY2tJbmRleCwgbWVzc2FnZX0pO1xuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBzZW5kKG1lc3NhZ2U6YW55KSB7XG4gICAgICAgIFxuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHdlIG9ubHkgd2FudCB0byBzZW5kIGFuZCBhcmUgbm90IGV4cGVjdGluZyBhIHJlc3BvbnNlXG4gICAgICAgIHdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbdGhpcy5uYW1lXS5wb3N0TWVzc2FnZSh7bWVzc2FnZX0pO1xuICAgIH1cblxuICAgIHJlY2VpdmVSZXNwb25zZShjYWxsYmFja0luZGV4Om51bWJlciwgZXJyOnN0cmluZywgcmVzcG9uc2U6IGFueSkge1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCB0aGlzQ2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghdGhpc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJpZWQgdG8gdXNlIGEgY2FsbGJhY2sgdGhhdCBkaWRuJ3QgZXhpc3RcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZyZWUgdXAgdGhpcyBzbG90IGZvciBuZXh0IG9wZXJhdGlvblxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IFtmdWxmaWxsLCByZWplY3RdID0gdGhpc0NhbGxiYWNrO1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlcnIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnVsZmlsbChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG59IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwiY29uc29sZVwiKTtcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgfVxufVxuXG5sZXQgbGV2ZWxzID0gWydkZWJ1ZycsJ2luZm8nLCAnbG9nJywgJ2Vycm9yJywgJ3dhcm4nXTtcblxubGV0IGNvbnNvbGU6e1tsZXZlbDpzdHJpbmddOiBGdW5jdGlvbn0gPSB7fTtcblxubGV0IG9yaWdpbmFsQ29uc29sZSA9IHdpbmRvdy5jb25zb2xlIGFzIGFueTtcblxuKHdpbmRvdyBhcyBhbnkpLmNvbnNvbGUgPSBjb25zb2xlO1xuXG5sZXZlbHMuZm9yRWFjaCgobGV2ZWwpID0+IHtcbiAgICBjb25zb2xlW2xldmVsXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgaWYgKG9yaWdpbmFsQ29uc29sZSkge1xuICAgICAgICAgICAgLy8gc3RpbGwgbG9nIG91dCB0byB3ZWJ2aWV3IGNvbnNvbGUsIGluIGNhc2Ugd2UncmUgYXR0YWNoZWRcbiAgICAgICAgICAgIG9yaWdpbmFsQ29uc29sZVtsZXZlbF0uYXBwbHkob3JpZ2luYWxDb25zb2xlLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFyZ3NBc0pTT04gPSBBcnJheS5mcm9tKGFyZ3VtZW50cykubWFwKG1ha2VTdWl0YWJsZSk7XG5cbiAgICAgICAgcHJvbWlzZUJyaWRnZS5zZW5kKHtcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbCxcbiAgICAgICAgICAgIGFyZ3M6IGFyZ3NBc0pTT05cbiAgICAgICAgfSlcbiAgICB9XG59KSIsImltcG9ydCB7TWVzc2FnZVBvcnRXcmFwcGVyfSBmcm9tICcuL21lc3NhZ2UtY2hhbm5lbCc7XG5cbmNvbnN0IGFjdGl2ZU1lc3NhZ2VQb3J0czpNZXNzYWdlUG9ydFdyYXBwZXJbXSA9IFtdXG5cbmNvbnN0IFBvcnRTdG9yZSA9IHtcblxuICAgIGFkZDogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGlmIChhY3RpdmVNZXNzYWdlUG9ydHMuaW5kZXhPZihwb3J0KSA+IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcnlpbmcgdG8gYWRkIGEgcG9ydCB0aGF0J3MgYWxyZWFkeSBiZWVuIGFkZGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5wdXNoKHBvcnQpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChwb3J0Ok1lc3NhZ2VQb3J0V3JhcHBlcikge1xuICAgICAgICBhY3RpdmVNZXNzYWdlUG9ydHMuc3BsaWNlKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpLCAxKTtcbiAgICB9LFxuXG4gICAgZmluZEJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgbGV0IGV4aXN0aW5nID0gYWN0aXZlTWVzc2FnZVBvcnRzLmZpbHRlcigocCkgPT4gcC5uYXRpdmVQb3J0SW5kZXggPT09IG5hdGl2ZUluZGV4KTtcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nWzBdO1xuICAgIH0sXG5cbiAgICBmaW5kT3JDcmVhdGVCeU5hdGl2ZUluZGV4OiBmdW5jdGlvbihuYXRpdmVJbmRleDpudW1iZXIpOk1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGlmICghbmF0aXZlSW5kZXggJiYgbmF0aXZlSW5kZXggIT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBhIG5hdGl2ZSBpbmRleFwiKVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJGaW5kIG9yIGNyZWF0ZSBieSBuYXRpdmUgaW5kZXhcIiwgbmF0aXZlSW5kZXgpXG4gICAgICAgIGxldCBleGlzdGluZyA9IFBvcnRTdG9yZS5maW5kQnlOYXRpdmVJbmRleChuYXRpdmVJbmRleCk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICAvLyBBbHJlYWR5IGhhdmUgYSBwb3J0IGZvciB0aGlzLiBSZXR1cm4gaXQuXG4gICAgICAgICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBub3QsIG1ha2UgYSBuZXcgb25lXG5cbiAgICAgICAgbGV0IG5ld0N1c3RvbSA9IG5ldyBNZXNzYWdlUG9ydFdyYXBwZXIoKTtcbiAgICAgICAgbmV3Q3VzdG9tLm5hdGl2ZVBvcnRJbmRleCA9IG5hdGl2ZUluZGV4O1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ3JlYXRlZCBuZXcgd2ViIE1lc3NhZ2VQb3J0IGZvciBuYXRpdmUgaW5kZXhcIixuYXRpdmVJbmRleClcbiAgICAgICAgXG4gICAgICAgIC8vIHRoaXMgYWxyZWFkeSBoYXMgYSBicmlkZ2UsIHNvIHdlIGNvbnNpZGVyIGl0ICdhY3RpdmUnXG4gICAgICAgIFBvcnRTdG9yZS5hZGQobmV3Q3VzdG9tKTtcbiAgICAgICAgcmV0dXJuIG5ld0N1c3RvbVxuICAgIH0sXG5cbiAgICBmaW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQ6IGZ1bmN0aW9uKHBvcnQ6TWVzc2FnZVBvcnQpOiBNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLmpzTWVzc2FnZVBvcnQgPT0gcG9ydCk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAvLyBBbHJlYWR5IGhhdmUgYSBwb3J0IGZvciB0aGlzLiBSZXR1cm4gaXQuXG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmV3Q3VzdG9tID0gbmV3IE1lc3NhZ2VQb3J0V3JhcHBlcihwb3J0KTtcblxuICAgICAgICAvLyB0aGlzIGhhcyBub3QgeWV0IGJlZW4gZ2l2ZW4gYSBuYXRpdmUgaW5kZXgsIHNvIHdlIGRvIG5vdFxuICAgICAgICAvLyBjb25zaWRlciBpdCBhY3RpdmUuXG5cbiAgICAgICAgcmV0dXJuIG5ld0N1c3RvbTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBvcnRTdG9yZTtcblxuLy8gZm9yIHRlc3Rpbmdcbih3aW5kb3cgYXMgYW55KS5oeWJyaWRQb3J0U3RvcmUgPSBQb3J0U3RvcmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9XG5cbnZhciBoYXNQcm9wID0gKHt9KS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoY2hpbGQsIHBhcmVudCkge1xuICAgIGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHtcbiAgICAgICAgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIHtcbiAgICAgICAgICAgIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgfVxuICAgIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xuICAgIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxudmFyIFRpbWVvdXRFcnJvciA9IGV4cG9ydHMuVGltZW91dEVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGltZW91dEVycm9yKSkge1xuICAgICAgICByZXR1cm4gbmV3IFRpbWVvdXRFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYmV0dGVyLCBiZWNhdXNlIGl0IG1ha2VzIHRoZSByZXN1bHRpbmcgc3RhY2sgdHJhY2UgaGF2ZSB0aGUgY29ycmVjdCBlcnJvciBuYW1lLiAgQnV0LCBpdFxuICAgICAgICAvLyBvbmx5IHdvcmtzIGluIFY4L0Nocm9tZS5cbiAgICAgICAgVGltZW91dEVycm9yLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBIYWNraW5lc3MgZm9yIG90aGVyIGJyb3dzZXJzLlxuICAgICAgICB0aGlzLnN0YWNrID0gbmV3IEVycm9yKG1lc3NhZ2UpLnN0YWNrO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMubmFtZSA9IFwiVGltZW91dEVycm9yXCI7XG59O1xuZXh0ZW5kKFRpbWVvdXRFcnJvciwgRXJyb3IpO1xuXG4vKlxuICogUmV0dXJucyBhIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgYG1zYCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkLiAgVGhlIHJldHVybmVkIFByb21pc2Ugd2lsbCBuZXZlciByZWplY3QuXG4gKi9cbmV4cG9ydHMuZGVsYXkgPSBmdW5jdGlvbiAobXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLCBtcyk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogUmV0dXJucyBhIGB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fWAgb2JqZWN0LiAgVGhlIHJldHVybmVkIGBwcm9taXNlYCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHdoZW4gYHJlc29sdmVgIG9yXG4gKiBgcmVqZWN0YCBhcmUgY2FsbGVkLlxuICovXG5leHBvcnRzLmRlZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhbnN3ZXIgPSB7fTtcbiAgICBhbnN3ZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgYW5zd2VyLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICBhbnN3ZXIucmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuICAgIHJldHVybiBhbnN3ZXI7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXksIGB0YXNrc2AsIG9mIGZ1bmN0aW9ucyB3aGljaCByZXR1cm4gUHJvbWlzZXMsIGV4ZWN1dGVzIGVhY2ggZnVuY3Rpb24gaW4gYHRhc2tzYCBpbiBzZXJpZXMsIG9ubHlcbiAqIGNhbGxpbmcgdGhlIG5leHQgZnVuY3Rpb24gb25jZSB0aGUgcHJldmlvdXMgZnVuY3Rpb24gaGFzIGNvbXBsZXRlZC5cbiAqL1xuZXhwb3J0cy5zZXJpZXMgPSBmdW5jdGlvbiAodGFza3MpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHJldHVybiB0YXNrcy5yZWR1Y2UoZnVuY3Rpb24gKHNlcmllcywgdGFzaykge1xuICAgICAgICByZXR1cm4gc2VyaWVzLnRoZW4odGFzaykudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfSwgUHJvbWlzZS5yZXNvbHZlKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHBhcmFsbGVsLlxuICogSWYgYGxpbWl0YCBpcyBzdXBwbGllZCwgdGhlbiBhdCBtb3N0IGBsaW1pdGAgdGFza3Mgd2lsbCBiZSBleGVjdXRlZCBjb25jdXJyZW50bHkuXG4gKi9cbmV4cG9ydHMucGFyYWxsZWwgPSBleHBvcnRzLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbiAodGFza3MsIGxpbWl0KSB7XG4gICAgaWYgKCFsaW1pdCB8fCBsaW1pdCA8IDEgfHwgbGltaXQgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0YXNrcy5tYXAoZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICAgICAgICB2YXIgY3VycmVudFRhc2sgPSAwO1xuICAgICAgICB2YXIgcnVubmluZyA9IDA7XG4gICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIHN0YXJ0VGFzayA9IGZ1bmN0aW9uIHN0YXJ0VGFzaygpIHtcbiAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRUYXNrID49IHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHRhc2tOdW1iZXIgPSBjdXJyZW50VGFzaysrO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrc1t0YXNrTnVtYmVyXTtcbiAgICAgICAgICAgIHJ1bm5pbmcrKztcblxuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW3Rhc2tOdW1iZXJdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHJ1bm5pbmctLTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPCB0YXNrcy5sZW5ndGggJiYgcnVubmluZyA8IGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocnVubmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU3RhcnQgdXAgYGxpbWl0YCB0YXNrcy5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICAgICAgICBzdGFydFRhc2soKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5IGBhcnJgIG9mIGl0ZW1zLCBjYWxscyBgaXRlcihpdGVtLCBpbmRleClgIGZvciBldmVyeSBpdGVtIGluIGBhcnJgLiAgYGl0ZXIoKWAgc2hvdWxkIHJldHVybiBhXG4gKiBQcm9taXNlLiAgVXAgdG8gYGxpbWl0YCBpdGVtcyB3aWxsIGJlIGNhbGxlZCBpbiBwYXJhbGxlbCAoZGVmYXVsdHMgdG8gMS4pXG4gKi9cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gKGFyciwgaXRlciwgbGltaXQpIHtcbiAgICB2YXIgdGFza0xpbWl0ID0gbGltaXQ7XG4gICAgaWYgKCFsaW1pdCB8fCBsaW1pdCA8IDEpIHtcbiAgICAgICAgdGFza0xpbWl0ID0gMTtcbiAgICB9XG4gICAgaWYgKGxpbWl0ID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgdGFza0xpbWl0ID0gYXJyLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgdGFza3MgPSBhcnIubWFwKGZ1bmN0aW9uIChpdGVtLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXIoaXRlbSwgaW5kZXgpO1xuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHJldHVybiBleHBvcnRzLnBhcmFsbGVsKHRhc2tzLCB0YXNrTGltaXQpO1xufTtcblxuLypcbiAqIEFkZCBhIHRpbWVvdXQgdG8gYW4gZXhpc3RpbmcgUHJvbWlzZS5cbiAqXG4gKiBSZXNvbHZlcyB0byB0aGUgc2FtZSB2YWx1ZSBhcyBgcGAgaWYgYHBgIHJlc29sdmVzIHdpdGhpbiBgbXNgIG1pbGxpc2Vjb25kcywgb3RoZXJ3aXNlIHRoZSByZXR1cm5lZCBQcm9taXNlIHdpbGxcbiAqIHJlamVjdCB3aXRoIHRoZSBlcnJvciBcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiAke21zfSBtaWxsaXNlY29uZHNcIlxuICovXG5leHBvcnRzLnRpbWVvdXQgPSBmdW5jdGlvbiAocCwgbXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIHJlamVjdChuZXcgZXhwb3J0cy5UaW1lb3V0RXJyb3IoXCJUaW1lb3V0OiBQcm9taXNlIGRpZCBub3QgcmVzb2x2ZSB3aXRoaW4gXCIgKyBtcyArIFwiIG1pbGxpc2Vjb25kc1wiKSk7XG4gICAgICAgIH0sIG1zKTtcblxuICAgICAgICBwLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLypcbiAqIENvbnRpbnVhbGx5IGNhbGwgYGZuKClgIHdoaWxlIGB0ZXN0KClgIHJldHVybnMgdHJ1ZS5cbiAqXG4gKiBgZm4oKWAgc2hvdWxkIHJldHVybiBhIFByb21pc2UuICBgdGVzdCgpYCBpcyBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdHJ1ZSBvZiBmYWxzZS5cbiAqXG4gKiBgd2hpbHN0YCB3aWxsIHJlc29sdmUgdG8gdGhlIGxhc3QgdmFsdWUgdGhhdCBgZm4oKWAgcmVzb2x2ZWQgdG8sIG9yIHdpbGwgcmVqZWN0IGltbWVkaWF0ZWx5IHdpdGggYW4gZXJyb3IgaWZcbiAqIGBmbigpYCByZWplY3RzIG9yIGlmIGBmbigpYCBvciBgdGVzdCgpYCB0aHJvdy5cbiAqL1xuZXhwb3J0cy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgZm4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgbGFzdFJlc3VsdCA9IG51bGw7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZuKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGRvSXQsIDApO1xuICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobGFzdFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9JdCgpO1xuICAgIH0pO1xufTtcblxuZXhwb3J0cy5kb1doaWxzdCA9IGZ1bmN0aW9uIChmbiwgdGVzdCkge1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG4gICAgdmFyIGRvVGVzdCA9IGZ1bmN0aW9uIGRvVGVzdCgpIHtcbiAgICAgICAgdmFyIGFuc3dlciA9IGZpcnN0IHx8IHRlc3QoKTtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGFuc3dlcjtcbiAgICB9O1xuICAgIHJldHVybiBleHBvcnRzLndoaWxzdChkb1Rlc3QsIGZuKTtcbn07XG5cbi8qXG4gKiBrZWVwIGNhbGxpbmcgYGZuYCB1bnRpbCBpdCByZXR1cm5zIGEgbm9uLWVycm9yIHZhbHVlLCBkb2Vzbid0IHRocm93LCBvciByZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzLiBgZm5gIHdpbGwgYmVcbiAqIGF0dGVtcHRlZCBgdGltZXNgIG1hbnkgdGltZXMgYmVmb3JlIHJlamVjdGluZy4gSWYgYHRpbWVzYCBpcyBnaXZlbiBhcyBgSW5maW5pdHlgLCB0aGVuIGByZXRyeWAgd2lsbCBhdHRlbXB0IHRvXG4gKiByZXNvbHZlIGZvcmV2ZXIgKHVzZWZ1bCBpZiB5b3UgYXJlIGp1c3Qgd2FpdGluZyBmb3Igc29tZXRoaW5nIHRvIGZpbmlzaCkuXG4gKiBAcGFyYW0ge09iamVjdHxOdW1iZXJ9IG9wdGlvbnMgaGFzaCB0byBwcm92aWRlIGB0aW1lc2AgYW5kIGBpbnRlcnZhbGAuIERlZmF1bHRzICh0aW1lcz01LCBpbnRlcnZhbD0wKS4gSWYgdGhpcyB2YWx1ZVxuICogICAgICAgICAgICAgICAgICAgICAgICBpcyBhIG51bWJlciwgb25seSBgdGltZXNgIHdpbGwgYmUgc2V0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICBmbiB0aGUgdGFzay9jaGVjayB0byBiZSBwZXJmb3JtZWQuIENhbiBlaXRoZXIgcmV0dXJuIGEgc3luY2hyb25vdXMgdmFsdWUsIHRocm93IGFuIGVycm9yLCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYSBwcm9taXNlXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuZXhwb3J0cy5yZXRyeSA9IGZ1bmN0aW9uIChvcHRpb25zLCBmbikge1xuICAgIHZhciB0aW1lcyA9IDU7XG4gICAgdmFyIGludGVydmFsID0gMDtcbiAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgIHZhciBsYXN0QXR0ZW1wdCA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBtYWtlVGltZU9wdGlvbkVycm9yKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmd1bWVudCB0eXBlIGZvciAndGltZXMnOiBcIiArICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZih2YWx1ZSkpKTtcbiAgICB9XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIG9wdGlvbnMpIGZuID0gb3B0aW9ucztlbHNlIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMpIHRpbWVzID0gK29wdGlvbnM7ZWxzZSBpZiAoJ29iamVjdCcgPT09ICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG9wdGlvbnMpKSkge1xuICAgICAgICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBvcHRpb25zLnRpbWVzKSB0aW1lcyA9ICtvcHRpb25zLnRpbWVzO2Vsc2UgaWYgKG9wdGlvbnMudGltZXMpIHJldHVybiBQcm9taXNlLnJlamVjdChtYWtlVGltZU9wdGlvbkVycm9yKG9wdGlvbnMudGltZXMpKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5pbnRlcnZhbCkgaW50ZXJ2YWwgPSArb3B0aW9ucy5pbnRlcnZhbDtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMpIHJldHVybiBQcm9taXNlLnJlamVjdChtYWtlVGltZU9wdGlvbkVycm9yKG9wdGlvbnMpKTtlbHNlIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIHBhcmFtZXRlcnMgZ2l2ZW4nKSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgZG9JdCA9IGZ1bmN0aW9uIGRvSXQoKSB7XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4obGFzdEF0dGVtcHQpO1xuICAgICAgICAgICAgfSkudGhlbihyZXNvbHZlKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgICAgICBsYXN0QXR0ZW1wdCA9IGVycjtcbiAgICAgICAgICAgICAgICBpZiAodGltZXMgIT09IEluZmluaXR5ICYmIGF0dGVtcHRzID09PSB0aW1lcykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QobGFzdEF0dGVtcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59OyIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgUG9ydFN0b3JlIGZyb20gJy4vcG9ydC1zdG9yZSc7XG5pbXBvcnQgUHJvbWlzZVRvb2xzIGZyb20gJ3Byb21pc2UtdG9vbHMnO1xuXG5sZXQgd2Via2l0ID0gKHdpbmRvdyBhcyBhbnkpLndlYmtpdDtcblxuY29uc3QgcHJvbWlzZUJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcIm1lc3NhZ2VDaGFubmVsXCIpO1xuXG4vLyBXZSBuZWVkIHRoaXMgdG8gYmUgZ2xvYmFsbHkgYWNjZXNzaWJsZSBzbyB0aGF0IHdlIGNhbiB0cmlnZ2VyIHJlY2VpdmVcbi8vIGV2ZW50cyBtYW51YWxseVxuXG4od2luZG93IGFzIGFueSkuX19tZXNzYWdlQ2hhbm5lbEJyaWRnZSA9IHByb21pc2VCcmlkZ2U7XG5cbmludGVyZmFjZSBNZXNzYWdlUG9ydE1lc3NhZ2Uge1xuICAgIGRhdGE6c3RyaW5nLFxuICAgIHBhc3NlZFBvcnRJZHM6IG51bWJlcltdXG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKHBvcnRJbmRleDpudW1iZXIsIG1lc3NhZ2U6TWVzc2FnZVBvcnRNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlJlY2VpdmVkIGluY29taW5nIG1lc3NhZ2UgZnJvbSBuYXRpdmUsIHRvIHBvcnRcIixwb3J0SW5kZXgsIFwid2l0aCBtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgICAgICBsZXQgdGhpc1BvcnQgPSBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChwb3J0SW5kZXgpO1xuXG4gICAgICAgIGlmICghdGhpc1BvcnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlY2VpdmUgbWVzc2FnZSBvbiBpbmFjdGl2ZSBwb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hcHBlZFBvcnRzID0gbWVzc2FnZS5wYXNzZWRQb3J0SWRzLm1hcCgoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHBhc3MgaW4gYWN0dWFsIG1lc3NhZ2UgcG9ydHMsIHNvIGluc3RlYWQgd2UgcGFzcyBpblxuICAgICAgICAgICAgLy8gdGhlaXIgSURzLiBOb3cgd2UgbWFwIHRoZW0gdG8gb3VyIHdyYXBwZXIgQ3VzdG9tTWVzc2FnZVBvcnRcbiAgICAgICAgICAgIHJldHVybiBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChpZCkuanNNZXNzYWdlUG9ydDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIGxldCBtZXNzYWdlRXZlbnQgPSBuZXcgTWVzc2FnZUV2ZW50KFwibWVzc2FnZVwiLCB7XG4gICAgICAgIC8vICAgICBkYXRhOiBtZXNzYWdlLmRhdGEsXG4gICAgICAgIC8vICAgICBwb3J0czogbWFwcGVkUG9ydHNcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy90aGlzUG9ydC5qc01lc3NhZ2VQb3J0LmRpc3BhdGNoRXZlbnQobWVzc2FnZUV2ZW50KTtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlBvc3RpbmcgbWVzc2FnZSB0byBuYXRpdmUgaW5kZXhcIiwgdGhpc1BvcnQubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICB0aGlzUG9ydC5zZW5kT3JpZ2luYWxQb3N0TWVzc2FnZShtZXNzYWdlLmRhdGEsIG1hcHBlZFBvcnRzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgfVxuXG59XG5cbnByb21pc2VCcmlkZ2UuYWRkTGlzdGVuZXIoXCJlbWl0XCIsIHJlY2VpdmVNZXNzYWdlKTtcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VQb3J0V3JhcHBlciB7XG5cbiAgICBvcGVuOmJvb2xlYW47XG4gICAgbmF0aXZlUG9ydEluZGV4Om51bWJlcjtcbiAgICBqc01lc3NhZ2VQb3J0Ok1lc3NhZ2VQb3J0O1xuICAgIGpzTWVzc2FnZUNoYW5uZWw6TWVzc2FnZUNoYW5uZWw7XG4gICAgcHJpdmF0ZSBvcmlnaW5hbEpTUG9ydENsb3NlOkZ1bmN0aW9uO1xuICAgIG9yaWdpbmFsSlNQb3J0UG9zdDpGdW5jdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKGpzUG9ydDpNZXNzYWdlUG9ydCA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5uYXRpdmVQb3J0SW5kZXggPSBudWxsO1xuICAgICAgICBpZiAoanNQb3J0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ3JlYXRpbmcgd3JhcHBlciBmb3IgYW4gZXhpc3RpbmcgTWVzc2FnZVBvcnRcIilcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IGpzUG9ydFxuXG4gICAgICAgICAgICAvLyBkaXNndXN0aW5nIGhhY2ssIGJ1dCBjYW4ndCBzZWUgYW55IHdheSBhcm91bmQgaXMgYXMgdGhlcmUgaXMgbm9cbiAgICAgICAgICAgIC8vIFwiaGFzIGRpc3BhdGNoZWQgYSBtZXNzYWdlXCIgZXZlbnQsIGFzIGZhciBhcyBJIGNhbiB0ZWxsIFxuXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQucG9zdE1lc3NhZ2UgPSB0aGlzLmhhbmRsZUpTTWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIk1ha2luZyB3cmFwcGVyIGZvciBhIG5ldyB3ZWIgTWVzc2FnZVBvcnRcIilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gd2UgY2FuJ3QgY3JlYXRlIGEgTWVzc2FnZVBvcnQgZGlyZWN0bHksIHNvIHdlIGhhdmUgdG8gbWFrZVxuICAgICAgICAgICAgLy8gYSBjaGFubmVsIHRoZW4gdGFrZSBvbmUgcG9ydCBmcm9tIGl0LiBLaW5kIG9mIGEgd2FzdGUuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlQ2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0ID0gdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQxO1xuXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwucG9ydDIub25tZXNzYWdlID0gKGV2Ok1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHdlIGNhbid0IHJlbGlhYmx5IGhvb2sgaW50byBwb3N0TWVzc2FnZSwgc28gd2UgdXNlIHRoaXNcbiAgICAgICAgICAgICAgICAvLyB0byBjYXRjaCBwb3N0TWVzc2FnZXMgdG9vLiBOZWVkIHRvIGRvY3VtZW50IGFsbCB0aGlzIG1hZG5lc3MuXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVKU01lc3NhZ2UoZXYuZGF0YSwgZXYucG9ydHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2FtZSBmb3IgdGhlIGxhY2sgb2YgYSAnY2xvc2UnIGV2ZW50LlxuICAgICAgICB0aGlzLm9yaWdpbmFsSlNQb3J0Q2xvc2UgPSB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2U7XG4gICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydC5jbG9zZSA9IHRoaXMuY2xvc2U7XG4gICAgfVxuXG4gICAgc2VuZE9yaWdpbmFsUG9zdE1lc3NhZ2UoZGF0YTogYW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSkge1xuICAgICAgICBNZXNzYWdlUG9ydC5wcm90b3R5cGUucG9zdE1lc3NhZ2UuYXBwbHkodGhpcy5qc01lc3NhZ2VQb3J0LCBbZGF0YSwgcG9ydHNdKTtcbiAgICB9XG5cbiAgICBoYW5kbGVKU01lc3NhZ2UoZGF0YTphbnksIHBvcnRzOiBNZXNzYWdlUG9ydFtdKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgIC8vIHJ1biB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIGluIGNhc2UgYW55dGhpbmcgZGVwZW5kcyBvbiBpdC5cbiAgICAgICAgLy90aGlzLnNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKGRhdGEsIHBvcnRzKTtcblxuICAgICAgICAvLyBHZXQgb3VyIGN1c3RvbSBwb3J0IGluc3RhbmNlcywgY3JlYXRpbmcgdGhlbSBpZiBuZWNlc3NhcnlcbiAgICAgICAgbGV0IGN1c3RvbVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW107XG4gICAgICAgIFxuICAgICAgICBpZiAocG9ydHMpIHtcbiAgICAgICAgICAgIGN1c3RvbVBvcnRzID0gcG9ydHMubWFwKChwOk1lc3NhZ2VQb3J0KSA9PiBQb3J0U3RvcmUuZmluZE9yV3JhcEpTTWVzc3NhZ2VQb3J0KHApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gaWYgdGhleSB3ZXJlIGNyZWF0ZWQsIHRoZW4gd2UgbmVlZCB0byBhc3NpZ24gdGhlbSBhIG5hdGl2ZSBJRCBiZWZvcmVcbiAgICAgICAgICAgIC8vIHdlIHNlbmQuXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ2hlY2tpbmcgdGhhdCBhZGRpdGlvbmFsIHBvcnRzIGhhdmUgbmF0aXZlIGVxdWl2YWxlbnRzXCIpXG4gICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1hcHBlZCBhZGRpdGlvbmFsIHBvcnRzIHRvIGluZGV4ZXNcIiwgY3VzdG9tUG9ydHMubWFwKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleCkpXG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJwb3N0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUG9ydEluZGV4ZXM6IGN1c3RvbVBvcnRzLm1hcCgocCkgPT4gcC5uYXRpdmVQb3J0SW5kZXgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNoZWNrRm9yTmF0aXZlUG9ydCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAodGhpcy5uYXRpdmVQb3J0SW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5kZWJ1ZyhcIlBvcnQgYWxyZWFkeSBoYXMgbmF0aXZlIGluZGV4XCIsIHRoaXMubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJHZXR0aW5nIG5ldyBuYXRpdmUgaW5kZXggZm9yIHBvcnRcIilcbiAgICAgICAgcmV0dXJuIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiY3JlYXRlXCJcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKHBvcnRJZDpudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDcmVhdGVkIG5ldyBuYXRpdmUgTWVzc2FnZVBvcnQgYXQgaW5kZXggXCIsIFN0cmluZyhwb3J0SWQpKVxuICAgICAgICAgICAgdGhpcy5uYXRpdmVQb3J0SW5kZXggPSBwb3J0SWQ7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgYWRkIHRvIG91ciBhcnJheSBvZiBhY3RpdmUgY2hhbm5lbHMgd2hlblxuICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIG5hdGl2ZSBJRFxuICAgICAgICAgICAgUG9ydFN0b3JlLmFkZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNsb3NlKCkge1xuXG4gICAgICAgIC8vIHJ1biB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2Ugb3Zlcndyb3RlXG4gICAgICAgIHRoaXMub3JpZ2luYWxKU1BvcnRDbG9zZS5hcHBseSh0aGlzLmpzTWVzc2FnZVBvcnQpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVtb3ZlIGZyb20gb3VyIGNhY2hlIG9mIGFjdGl2ZSBwb3J0c1xuICAgICAgICBQb3J0U3RvcmUucmVtb3ZlKHRoaXMpO1xuICAgICBcbiAgICAgICAgLy8gZmluYWxseSwgdGVsbCB0aGUgbmF0aXZlIGhhbGYgdG8gZGVsZXRlIHRoaXMgcmVmZXJlbmNlLlxuICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgb3BlcmF0aW9uOiBcImRlbGV0ZVwiLFxuICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuXG5cblxuLy8gY2xhc3MgQ3VzdG9tTWVzc2FnZUNoYW5uZWwge1xuLy8gICAgIHBvcnQxOkN1c3RvbU1lc3NhZ2VQb3J0O1xuLy8gICAgIHBvcnQyOkN1c3RvbU1lc3NhZ2VQb3J0O1xuXG4vLyAgICAgY29uc3RydWN0b3IoKSB7XG4vLyAgICAgICAgIHRoaXMucG9ydDEgPSBuZXcgQ3VzdG9tTWVzc2FnZVBvcnQoKTtcbi8vICAgICAgICAgdGhpcy5wb3J0MiA9IG5ldyBDdXN0b21NZXNzYWdlUG9ydCgpO1xuLy8gICAgIH1cbi8vIH1cblxubGV0IHdpbmRvd0FzQW55ID0gKHdpbmRvdyBhcyBhbnkpO1xuLy8gd2luZG93QXNBbnkuTWVzc2FnZVBvcnQgPSBDdXN0b21NZXNzYWdlUG9ydDtcbi8vIHdpbmRvd0FzQW55LkN1c3RvbU1lc3NhZ2VQb3J0ID0gQ3VzdG9tTWVzc2FnZVBvcnQ7XG4vLyB3aW5kb3dBc0FueS5NZXNzYWdlQ2hhbm5lbCA9IEN1c3RvbU1lc3NhZ2VDaGFubmVsOyIsIi8vIGltcG9ydCAnd2hhdHdnLWZldGNoJztcbi8vIGltcG9ydCAnLi91dGlsL292ZXJyaWRlLWxvZ2dpbmcnO1xuaW1wb3J0ICcuL25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlcic7XG5pbXBvcnQgJy4vY29uc29sZSc7XG5pbXBvcnQgJy4vbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsJztcblxud2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG59XG5cbi8vIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MPVwiVEhJUyBMT0FERURcIiJdLCJuYW1lcyI6WyJhcmd1bWVudHMiLCJwYXRoLnJlc29sdmUiLCJ0aGlzIiwiY29uc29sZSIsIndlYmtpdCIsInByb21pc2VCcmlkZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlCQSxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFOztFQUU3QyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7RUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtNQUNoQixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNwQixNQUFNLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtNQUN4QixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNuQixFQUFFLEVBQUUsQ0FBQztLQUNOLE1BQU0sSUFBSSxFQUFFLEVBQUU7TUFDYixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNuQixFQUFFLEVBQUUsQ0FBQztLQUNOO0dBQ0Y7OztFQUdELElBQUksY0FBYyxFQUFFO0lBQ2xCLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO01BQ2YsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQjtHQUNGOztFQUVELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7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QU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDNUc7O0FBRUQsQUFBTyxTQUFTLE9BQU8sQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFO0lBQzNDLE9BQU8sVUFBVSxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRTtDQUN4RTs7QUFFRCxBQUFPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtJQUN6RCxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7UUFDdkQsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUMzRixTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQy9JLElB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QUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFELEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDOUQsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDbEUsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ3RFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7TUFDMUUsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7S0FDL0U7O0lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUNsRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHRCxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUI7O0lBRUQsU0FBUyxDQUFDLEVBQUUsQ0FBQyxL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
