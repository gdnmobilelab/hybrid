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
    HybridServiceWorker.prototype.postMessage = function () {
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
        RegistrationInstance.on("active", function (sw) {
            _this.controller = sw;
            _this.emit("controllerchange");
        });
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbmF2aWdhdG9yL3N3LW1hbmFnZXIudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbmF2aWdhdG9yL3NlcnZpY2Utd29ya2VyLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L2NvbnNvbGUudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvcG9ydC1zdG9yZS50cyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcHJvbWlzZS10b29scy9saWIvaW5kZXguanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L3V0aWwvZ2VuZXJpYy1ldmVudHMudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvZG9jdW1lbnQtc3RhcnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuY29uc3Qgd2Via2l0ID0gKHdpbmRvdyBhcyBhbnkpLndlYmtpdDtcblxuLy8gV2UgbmVlZCB0aGVzZSBjYWxsYmFja3MgdG8gYmUgZ2xvYmFsbHkgYWNjZXNzaWJsZS5cbmNvbnN0IHByb21pc2VDYWxsYmFja3M6IHtba2V5OnN0cmluZ106IEZ1bmN0aW9ufSA9IHt9O1xuY29uc3QgcHJvbWlzZUJyaWRnZXM6IHtba2V5OnN0cmluZ106IFByb21pc2VPdmVyV0tNZXNzYWdlfSA9IHt9O1xuKHdpbmRvdyBhcyBhbnkpLl9fcHJvbWlzZUJyaWRnZUNhbGxiYWNrcyA9IHByb21pc2VDYWxsYmFja3M7XG4od2luZG93IGFzIGFueSkuX19wcm9taXNlQnJpZGdlcyA9IHByb21pc2VCcmlkZ2VzO1xuXG5leHBvcnQgY2xhc3MgUHJvbWlzZU92ZXJXS01lc3NhZ2UgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSBjYWxsYmFja0FycmF5OltGdW5jdGlvbiwgRnVuY3Rpb25dW10gPSBbXVxuICAgIHByaXZhdGUgbmFtZTpzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOnN0cmluZykge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIGlmICghd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZXNzYWdlIGhhbmRsZXIgXCIke25hbWV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdLl9yZWNlaXZlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb21pc2UgYnJpZGdlIGZvciBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c1wiYClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcHJvbWlzZUNhbGxiYWNrc1tuYW1lXSA9IHRoaXMucmVjZWl2ZVJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgICAgIHByb21pc2VCcmlkZ2VzW25hbWVdID0gdGhpcztcbiAgICB9XG5cbiAgICBicmlkZ2VQcm9taXNlKG1lc3NhZ2U6YW55KSB7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgbmV4dCBhdmFpbGFibGUgc2xvdCBpbiBvdXIgY2FsbGJhY2sgYXJyYXlcblxuICAgICAgICBsZXQgY2FsbGJhY2tJbmRleCA9IDA7XG4gICAgICAgIHdoaWxlICh0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBOb3cgaW5zZXJ0IG91ciBjYWxsYmFjayBpbnRvIHRoZSBjYWNoZWQgYXJyYXkuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IFtmdWxmaWxsLCByZWplY3RdO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlbmRpbmdcIiwge2NhbGxiYWNrSW5kZXgsIG1lc3NhZ2V9KVxuICAgICAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHtjYWxsYmFja0luZGV4LCBtZXNzYWdlfSk7XG5cbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIHNlbmQobWVzc2FnZTphbnkpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gd2Ugb25seSB3YW50IHRvIHNlbmQgYW5kIGFyZSBub3QgZXhwZWN0aW5nIGEgcmVzcG9uc2VcbiAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHttZXNzYWdlfSk7XG4gICAgfVxuXG4gICAgcmVjZWl2ZVJlc3BvbnNlKGNhbGxiYWNrSW5kZXg6bnVtYmVyLCBlcnI6c3RyaW5nLCByZXNwb25zZTogYW55KSB7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHRoaXNDYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byB1c2UgYSBjYWxsYmFjayB0aGF0IGRpZG4ndCBleGlzdFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZnJlZSB1cCB0aGlzIHNsb3QgZm9yIG5leHQgb3BlcmF0aW9uXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgW2Z1bGZpbGwsIHJlamVjdF0gPSB0aGlzQ2FsbGJhY2s7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmdWxmaWxsKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcbiIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoLWJyb3dzZXJpZnknO1xuXG5cbmV4cG9ydCBjb25zdCBzZXJ2aWNlV29ya2VyQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwic2VydmljZVdvcmtlclwiKTtcblxuY2xhc3MgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBhZGRFdmVudExpc3RlbmVyKHR5cGU6c3RyaW5nLCBsaXN0ZW5lcjooZXY6RXJyb3JFdmVudCkgPT4gdm9pZCwgdXNlQ2FwdHVyZTpib29sZWFuKSB7XG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIGRpc3BhdGNoRXZlbnQoZXZ0OkV2ZW50KTogYm9vbGVhbiB7XG4gICAgICAgIHRoaXMuZW1pdChldnQudHlwZSwgZXZ0KTtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZW1vdmVFdmVudExpc3RlbmVyKHR5cGU6c3RyaW5nLCBsaXN0ZW5lcjooZXY6RXJyb3JFdmVudCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9XG59XG5cbmNsYXNzIEh5YnJpZFNlcnZpY2VXb3JrZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXJUb0pTRXZlbnQgaW1wbGVtZW50cyBTZXJ2aWNlV29ya2VyIHtcbiAgICBzY29wZTpzdHJpbmc7XG4gICAgc2NyaXB0VVJMOnN0cmluZztcbiAgICBwcml2YXRlIF9pZDpudW1iZXI7XG5cbiAgICBpbnN0YWxsU3RhdGU6U2VydmljZVdvcmtlckluc3RhbGxTdGF0ZVxuICAgIGdldCBzdGF0ZSgpOnN0cmluZyB7XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcImFjdGl2YXRlZFwiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBcImFjdGl2YXRpbmdcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcImluc3RhbGxlZFwiXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBcImluc3RhbGxpbmdcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5SZWR1bmRhbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBcInJlZHVuZGFudFwiXG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGluc3RhbGwgc3RhdGU6XCIgKyB0aGlzLmluc3RhbGxTdGF0ZSlcbiAgICB9XG5cbiAgICBvbnN0YXRlY2hhbmdlOihzdGF0ZWNoYW5nZXZlbnQ6YW55KSA9PiB2b2lkO1xuICAgIG9ubWVzc2FnZTooZXY6TWVzc2FnZUV2ZW50KSA9PiBhbnk7XG4gICAgb25lcnJvcjogKGV2OkVycm9yRXZlbnQpID0+IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGlkOm51bWJlciwgc2NyaXB0VVJMOnN0cmluZywgc2NvcGU6c3RyaW5nLCBzdGF0ZTpTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICAgICAgdGhpcy5zY3JpcHRVUkwgPSBzY3JpcHRVUkw7XG4gICAgICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcbiAgICAgICAgdGhpcy5pbnN0YWxsU3RhdGUgPSBzdGF0ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZTogU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUgPT09IHRoaXMuaW5zdGFsbFN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnN0YWxsU3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgaWYgKHRoaXMub25zdGF0ZWNoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy5vbnN0YXRlY2hhbmdlKHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG4gICAgcG9zdE1lc3NhZ2UoKSB7XG5cbiAgICB9IFxuXG4gICAgdGVybWluYXRlKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTaG91bGQgbm90IGltcGxlbWVudCB0aGlzLlwiKTtcbiAgICB9XG5cbiAgICAvLyBhZGRFdmVudExpc3RlbmVyKHR5cGU6IFwiZXJyb3JcIiwgbGlzdGVuZXI6IChldjogRXJyb3JFdmVudCkgPT4gYW55LCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IHZvaWQge1xuXG4gICAgLy8gfVxuXG4gICAgXG59XG5cbmNsYXNzIEh5YnJpZFJlZ2lzdHJhdGlvbiBleHRlbmRzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24ge1xuICAgIFxuICAgIGFjdGl2ZTogSHlicmlkU2VydmljZVdvcmtlclxuICAgIGluc3RhbGxpbmc6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICB3YWl0aW5nOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgcHVzaE1hbmFnZXI6IGFueVxuICAgIG9udXBkYXRlZm91bmQ6ICgpID0+IHZvaWRcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJ1cGRhdGVmb3VuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbnVwZGF0ZWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbnVwZGF0ZWZvdW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0TW9zdFJlY2VudFdvcmtlcigpOkh5YnJpZFNlcnZpY2VXb3JrZXIge1xuICAgICAgICAvLyB3aGVuIHdlIHdhbnQgdGhlIG1vc3QgY3VycmVudCwgcmVnYXJkbGVzcyBvZiBhY3R1YWwgc3RhdHVzXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZSB8fCB0aGlzLndhaXRpbmcgfHwgdGhpcy5pbnN0YWxsaW5nO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJ1cGRhdGVcIixcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRNb3N0UmVjZW50V29ya2VyKCkuc2NyaXB0VVJMXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0IHNjb3BlKCk6c3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlLnNjb3BlO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB5ZXRcIilcbiAgICB9XG5cbiAgICBjbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKTp2b2lkIHtcbiAgICAgICAgLy8gSWYgYSBzZXJ2aWNlIHdvcmtlciBoYXMgY2hhbmdlZCBzdGF0ZSwgd2Ugd2FudCB0byBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBpdCBkb2Vzbid0IGFwcGVhciBpbiBhbnkgb2xkIHN0YXRlc1xuICAgIFxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsaW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsaW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmcgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG5cbiAgICAgICAgdGhpcy5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRlZCAmJiAhdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gc3c7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgdGhpcy53YWl0aW5nID0gc3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN3Lmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmluc3RhbGxpbmcgPSBzdztcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInVwZGF0ZWZvdW5kXCIsIHN3KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgUmVnaXN0cmF0aW9uSW5zdGFuY2UgPSBuZXcgSHlicmlkUmVnaXN0cmF0aW9uKCk7XG5cbmNsYXNzIEh5YnJpZFNlcnZpY2VXb3JrZXJDb250YWluZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBTZXJ2aWNlV29ya2VyQ29udGFpbmVyICB7XG4gICAgY29udHJvbGxlcjogSHlicmlkU2VydmljZVdvcmtlclxuICAgIHJlYWR5OiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+XG4gICAgb25jb250cm9sbGVyY2hhbmdlOiAoKSA9PiB2b2lkXG4gICAgb25lcnJvcjogKCkgPT4gdm9pZFxuICAgIG9ubWVzc2FnZTogKCkgPT4gdm9pZFxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKFwiY29udHJvbGxlcmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbmNvbnRyb2xsZXJjaGFuZ2UpIHtcblxuICAgICAgICAgICAgICAgIC8vIGRvZXMgaXQgZXhwZWN0IGFyZ3VtZW50cz8gVW5jbGVhci5cbiAgICAgICAgICAgICAgICB0aGlzLm9uY29udHJvbGxlcmNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5vbihcImFjdGl2ZVwiLCAoc3c6SHlicmlkU2VydmljZVdvcmtlcikgPT4ge1xuICAgICAgICAgICAgdGhpcy5jb250cm9sbGVyID0gc3c7XG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJjb250cm9sbGVyY2hhbmdlXCIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJlZ2lzdGVyKHVybDpzdHJpbmcsIG9wdGlvbnM6IFNlcnZpY2VXb3JrZXJSZWdpc3Rlck9wdGlvbnMpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcblxuICAgICAgICBsZXQgcGF0aFRvU1cgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aC5yZXNvbHZlKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSwgdXJsKTsgXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmluZm8oXCJBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIHNlcnZpY2Ugd29ya2VyIGF0XCIsIHBhdGhUb1NXKTtcbiAgICBcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicmVnaXN0ZXJcIixcbiAgICAgICAgICAgIHN3UGF0aDogdXJsLFxuICAgICAgICAgICAgc2NvcGU6IG9wdGlvbnMgPyBvcHRpb25zLnNjb3BlIDogbnVsbFxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocmVzcG9uc2U6U2VydmljZVdvcmtlck1hdGNoKSA9PiB7XG4gICAgICAgICAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKHJlc3BvbnNlKTtcbiAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gUmVnaXN0cmF0aW9uSW5zdGFuY2U7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xhaW1lZEJ5TmV3V29ya2VyKHN3Okh5YnJpZFNlcnZpY2VXb3JrZXIpIHtcbiAgICAgICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuY2xlYXJBbGxJbnN0YW5jZXNPZlNlcnZpY2VXb3JrZXIoc3cpO1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hY3RpdmUgPSBzdztcbiAgICAgICAgdGhpcy5lbWl0KFwiY29udHJvbGxlcmNoYW5nZVwiLCBzdyk7XG4gICAgfVxuXG4gICAgZ2V0UmVnaXN0cmF0aW9uKHNjb3BlOnN0cmluZyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBnZXRSZWdpc3RyYXRpb25zKCk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbltdPiB7XG4gICAgICAgIC8vIE5vdCBzdXJlIHdoeSB3ZSBlbmQgdXAgd2l0aCBtb3JlIHRoYW4gb25lIHJlZ2lzdHJhdGlvbiwgZXZlci5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbUmVnaXN0cmF0aW9uSW5zdGFuY2VdKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBTZXJ2aWNlV29ya2VyQ29udGFpbmVyID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXJDb250YWluZXIoKTsgXG5cbmVudW0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSB7XG4gICAgSW5zdGFsbGluZyA9IDAsXG4gICAgSW5zdGFsbGVkLFxuICAgIEFjdGl2YXRpbmcsXG4gICAgQWN0aXZhdGVkLFxuICAgIFJlZHVuZGFudFxufVxuXG5pbnRlcmZhY2UgU2VydmljZVdvcmtlck1hdGNoIHtcbiAgICB1cmw6IHN0cmluZyxcbiAgICBpbnN0YWxsU3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUsXG4gICAgaW5zdGFuY2VJZDpudW1iZXIsXG4gICAgc2NvcGU6IHN0cmluZ1xufVxuXG5jb25zdCBzZXJ2aWNlV29ya2VyUmVjb3Jkczoge1tpZDpudW1iZXJdIDogSHlicmlkU2VydmljZVdvcmtlcn0gPSB7fTtcblxuZnVuY3Rpb24gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG5ld01hdGNoOlNlcnZpY2VXb3JrZXJNYXRjaCkge1xuICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCwgdXNlIHRoYXQgb25lXG4gICAgbGV0IHdvcmtlciA9IHNlcnZpY2VXb3JrZXJSZWNvcmRzW25ld01hdGNoLmluc3RhbmNlSWRdO1xuXG4gICAgaWYgKCF3b3JrZXIpIHtcbiAgICAgICAgLy8gb3RoZXJ3aXNlLCBtYWtlIGEgbmV3IG9uZVxuICAgICAgICB3b3JrZXIgPSBuZXcgSHlicmlkU2VydmljZVdvcmtlcihuZXdNYXRjaC5pbnN0YW5jZUlkLCBuZXdNYXRjaC51cmwsIG5ld01hdGNoLnNjb3BlLCBuZXdNYXRjaC5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBzZXJ2aWNlV29ya2VyUmVjb3Jkc1tuZXdNYXRjaC5pbnN0YW5jZUlkXSA9IHdvcmtlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3b3JrZXIudXBkYXRlU3RhdGUobmV3TWF0Y2guaW5zdGFsbFN0YXRlKTtcbiAgICB9XG5cbiAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZSh3b3JrZXIpO1xuXG4gICAgY29uc29sZS5sb2coXCJTVyBDSEFOR0VcIiwgbmV3TWF0Y2gpO1xuICAgIHJldHVybiB3b3JrZXI7XG59XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ3N3LWNoYW5nZScsIHByb2Nlc3NOZXdXb3JrZXJNYXRjaCk7XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ2NsYWltZWQnLCBmdW5jdGlvbihtYXRjaDpTZXJ2aWNlV29ya2VyTWF0Y2gpIHtcbiAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG1hdGNoKTtcbiAgICBjb25zb2xlLmxvZyhcIkNsYWltZWQgYnkgbmV3IHdvcmtlclwiKVxuICAgIFNlcnZpY2VXb3JrZXJDb250YWluZXIuY2xhaW1lZEJ5TmV3V29ya2VyKHdvcmtlcik7XG59KVxuLy8gT24gcGFnZSBsb2FkIHdlIGdyYWIgYWxsIHRoZSBjdXJyZW50bHkgYXBwbGljYWJsZSBzZXJ2aWNlIHdvcmtlcnNcblxuc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICBvcGVyYXRpb246IFwiZ2V0QWxsXCJcbn0pLnRoZW4oKHdvcmtlcnM6IFNlcnZpY2VXb3JrZXJNYXRjaFtdKSA9PiB7XG4gICAgd29ya2Vycy5mb3JFYWNoKCh3b3JrZXIpID0+IHtcbiAgICAgICAgc2VydmljZVdvcmtlclJlY29yZHNbd29ya2VyLmluc3RhbmNlSWRdID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXIod29ya2VyLmluc3RhbmNlSWQsIHdvcmtlci51cmwsIFwiXCIsIHdvcmtlci5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0pO1xuICAgIH0pXG59KSIsImltcG9ydCB7c2VuZEFuZFJlY2VpdmV9IGZyb20gJy4uL3V0aWwvd2stbWVzc2FnaW5nJztcbmltcG9ydCB7c2VydmljZVdvcmtlckJyaWRnZSwgU2VydmljZVdvcmtlckNvbnRhaW5lcn0gZnJvbSAnLi9zdy1tYW5hZ2VyJztcblxubGV0IG5hdmlnYXRvckFzQW55OmFueSA9IG5hdmlnYXRvcjtcblxubmF2aWdhdG9yQXNBbnkuc2VydmljZVdvcmtlciA9IFNlcnZpY2VXb3JrZXJDb250YWluZXI7IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwiY29uc29sZVwiKTtcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHJldHVyblN0cmluZyA9IFwiKG5vdCBzdHJpbmdpZnlhYmxlKTogXCJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuU3RyaW5nICs9IGVyci50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHVyblN0cmluZ1xuICAgIH1cbn1cblxubGV0IGxldmVscyA9IFsnZGVidWcnLCdpbmZvJywgJ2xvZycsICdlcnJvcicsICd3YXJuJ107XG5cbmxldCBjb25zb2xlOntbbGV2ZWw6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5cbmxldCBvcmlnaW5hbENvbnNvbGUgPSB3aW5kb3cuY29uc29sZSBhcyBhbnk7XG5cbih3aW5kb3cgYXMgYW55KS5jb25zb2xlID0gY29uc29sZTtcblxubGV2ZWxzLmZvckVhY2goKGxldmVsKSA9PiB7XG4gICAgY29uc29sZVtsZXZlbF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmlnaW5hbENvbnNvbGUpIHtcbiAgICAgICAgICAgIC8vIHN0aWxsIGxvZyBvdXQgdG8gd2VidmlldyBjb25zb2xlLCBpbiBjYXNlIHdlJ3JlIGF0dGFjaGVkXG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVbbGV2ZWxdLmFwcGx5KG9yaWdpbmFsQ29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcmdzQXNKU09OID0gQXJyYXkuZnJvbShhcmd1bWVudHMpLm1hcChtYWtlU3VpdGFibGUpO1xuXG4gICAgICAgIHByb21pc2VCcmlkZ2Uuc2VuZCh7XG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBhcmdzOiBhcmdzQXNKU09OXG4gICAgICAgIH0pXG4gICAgfVxufSkiLCJpbXBvcnQge01lc3NhZ2VQb3J0V3JhcHBlcn0gZnJvbSAnLi9tZXNzYWdlLWNoYW5uZWwnO1xuXG5jb25zdCBhY3RpdmVNZXNzYWdlUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXVxuXG5jb25zdCBQb3J0U3RvcmUgPSB7XG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChwb3J0Ok1lc3NhZ2VQb3J0V3JhcHBlcikge1xuICAgICAgICBpZiAoYWN0aXZlTWVzc2FnZVBvcnRzLmluZGV4T2YocG9ydCkgPiAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJ5aW5nIHRvIGFkZCBhIHBvcnQgdGhhdCdzIGFscmVhZHkgYmVlbiBhZGRlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBhY3RpdmVNZXNzYWdlUG9ydHMucHVzaChwb3J0KTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpIHtcbiAgICAgICAgYWN0aXZlTWVzc2FnZVBvcnRzLnNwbGljZShhY3RpdmVNZXNzYWdlUG9ydHMuaW5kZXhPZihwb3J0KSwgMSk7XG4gICAgfSxcblxuICAgIGZpbmRCeU5hdGl2ZUluZGV4OiBmdW5jdGlvbihuYXRpdmVJbmRleDpudW1iZXIpOk1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGxldCBleGlzdGluZyA9IGFjdGl2ZU1lc3NhZ2VQb3J0cy5maWx0ZXIoKHApID0+IHAubmF0aXZlUG9ydEluZGV4ID09PSBuYXRpdmVJbmRleCk7XG4gICAgICAgIHJldHVybiBleGlzdGluZ1swXTtcbiAgICB9LFxuXG4gICAgZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleDogZnVuY3Rpb24obmF0aXZlSW5kZXg6bnVtYmVyKTpNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBpZiAoIW5hdGl2ZUluZGV4ICYmIG5hdGl2ZUluZGV4ICE9PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuYXRpdmUgaW5kZXhcIilcbiAgICAgICAgfVxuICAgICAgXG4gICAgICAgIGxldCBleGlzdGluZyA9IFBvcnRTdG9yZS5maW5kQnlOYXRpdmVJbmRleChuYXRpdmVJbmRleCk7XG5cbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICAvLyBBbHJlYWR5IGhhdmUgYSBwb3J0IGZvciB0aGlzLiBSZXR1cm4gaXQuXG4gICAgICAgICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBub3QsIG1ha2UgYSBuZXcgb25lXG5cbiAgICAgICAgbGV0IG5ld0N1c3RvbSA9IG5ldyBNZXNzYWdlUG9ydFdyYXBwZXIoKTtcbiAgICAgICAgbmV3Q3VzdG9tLm5hdGl2ZVBvcnRJbmRleCA9IG5hdGl2ZUluZGV4O1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ3JlYXRlZCBuZXcgd2ViIE1lc3NhZ2VQb3J0IGZvciBuYXRpdmUgaW5kZXhcIiwgbmF0aXZlSW5kZXgpXG4gICAgICAgIFxuICAgICAgICAvLyB0aGlzIGFscmVhZHkgaGFzIGEgYnJpZGdlLCBzbyB3ZSBjb25zaWRlciBpdCAnYWN0aXZlJ1xuICAgICAgICBQb3J0U3RvcmUuYWRkKG5ld0N1c3RvbSk7XG4gICAgICAgIHJldHVybiBuZXdDdXN0b21cbiAgICB9LFxuXG4gICAgZmluZE9yV3JhcEpTTWVzc3NhZ2VQb3J0OiBmdW5jdGlvbihwb3J0Ok1lc3NhZ2VQb3J0KTogTWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgbGV0IGV4aXN0aW5nID0gYWN0aXZlTWVzc2FnZVBvcnRzLmZpbHRlcigocCkgPT4gcC5qc01lc3NhZ2VQb3J0ID09IHBvcnQpO1xuXG4gICAgICAgIGlmIChleGlzdGluZy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBoYXZlIGEgcG9ydCBmb3IgdGhpcy4gUmV0dXJuIGl0LlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5ld0N1c3RvbSA9IG5ldyBNZXNzYWdlUG9ydFdyYXBwZXIocG9ydCk7XG5cbiAgICAgICAgLy8gdGhpcyBoYXMgbm90IHlldCBiZWVuIGdpdmVuIGEgbmF0aXZlIGluZGV4LCBzbyB3ZSBkbyBub3RcbiAgICAgICAgLy8gY29uc2lkZXIgaXQgYWN0aXZlLlxuXG4gICAgICAgIHJldHVybiBuZXdDdXN0b207XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQb3J0U3RvcmU7XG5cbi8vIGZvciB0ZXN0aW5nXG4od2luZG93IGFzIGFueSkuaHlicmlkUG9ydFN0b3JlID0gUG9ydFN0b3JlOyIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfVxuXG52YXIgaGFzUHJvcCA9ICh7fSkuaGFzT3duUHJvcGVydHk7XG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGNoaWxkLCBwYXJlbnQpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7XG4gICAgICAgIGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSB7XG4gICAgICAgICAgICBjaGlsZFtrZXldID0gcGFyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gY3RvcigpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkO1xuICAgIH1cbiAgICBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTtcbiAgICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIHJldHVybiBjaGlsZDtcbn07XG5cbnZhciBUaW1lb3V0RXJyb3IgPSBleHBvcnRzLlRpbWVvdXRFcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFRpbWVvdXRFcnJvcikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUaW1lb3V0RXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGJldHRlciwgYmVjYXVzZSBpdCBtYWtlcyB0aGUgcmVzdWx0aW5nIHN0YWNrIHRyYWNlIGhhdmUgdGhlIGNvcnJlY3QgZXJyb3IgbmFtZS4gIEJ1dCwgaXRcbiAgICAgICAgLy8gb25seSB3b3JrcyBpbiBWOC9DaHJvbWUuXG4gICAgICAgIFRpbWVvdXRFcnJvci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSGFja2luZXNzIGZvciBvdGhlciBicm93c2Vycy5cbiAgICAgICAgdGhpcy5zdGFjayA9IG5ldyBFcnJvcihtZXNzYWdlKS5zdGFjaztcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLm5hbWUgPSBcIlRpbWVvdXRFcnJvclwiO1xufTtcbmV4dGVuZChUaW1lb3V0RXJyb3IsIEVycm9yKTtcblxuLypcbiAqIFJldHVybnMgYSBQcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIGBtc2AgbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZC4gIFRoZSByZXR1cm5lZCBQcm9taXNlIHdpbGwgbmV2ZXIgcmVqZWN0LlxuICovXG5leHBvcnRzLmRlbGF5ID0gZnVuY3Rpb24gKG1zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpO1xuICAgIH0pO1xufTtcblxuLypcbiAqIFJldHVybnMgYSBge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH1gIG9iamVjdC4gIFRoZSByZXR1cm5lZCBgcHJvbWlzZWAgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB3aGVuIGByZXNvbHZlYCBvclxuICogYHJlamVjdGAgYXJlIGNhbGxlZC5cbiAqL1xuZXhwb3J0cy5kZWZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYW5zd2VyID0ge307XG4gICAgYW5zd2VyLnByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGFuc3dlci5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgYW5zd2VyLnJlamVjdCA9IHJlamVjdDtcbiAgICB9KTtcbiAgICByZXR1cm4gYW5zd2VyO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5LCBgdGFza3NgLCBvZiBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIFByb21pc2VzLCBleGVjdXRlcyBlYWNoIGZ1bmN0aW9uIGluIGB0YXNrc2AgaW4gc2VyaWVzLCBvbmx5XG4gKiBjYWxsaW5nIHRoZSBuZXh0IGZ1bmN0aW9uIG9uY2UgdGhlIHByZXZpb3VzIGZ1bmN0aW9uIGhhcyBjb21wbGV0ZWQuXG4gKi9cbmV4cG9ydHMuc2VyaWVzID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICByZXR1cm4gdGFza3MucmVkdWNlKGZ1bmN0aW9uIChzZXJpZXMsIHRhc2spIHtcbiAgICAgICAgcmV0dXJuIHNlcmllcy50aGVuKHRhc2spLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH0sIFByb21pc2UucmVzb2x2ZSgpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSk7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXksIGB0YXNrc2AsIG9mIGZ1bmN0aW9ucyB3aGljaCByZXR1cm4gUHJvbWlzZXMsIGV4ZWN1dGVzIGVhY2ggZnVuY3Rpb24gaW4gYHRhc2tzYCBpbiBwYXJhbGxlbC5cbiAqIElmIGBsaW1pdGAgaXMgc3VwcGxpZWQsIHRoZW4gYXQgbW9zdCBgbGltaXRgIHRhc2tzIHdpbGwgYmUgZXhlY3V0ZWQgY29uY3VycmVudGx5LlxuICovXG5leHBvcnRzLnBhcmFsbGVsID0gZXhwb3J0cy5wYXJhbGxlbExpbWl0ID0gZnVuY3Rpb24gKHRhc2tzLCBsaW1pdCkge1xuICAgIGlmICghbGltaXQgfHwgbGltaXQgPCAxIHx8IGxpbWl0ID49IHRhc2tzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwodGFza3MubWFwKGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbih0YXNrKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG5cbiAgICAgICAgdmFyIGN1cnJlbnRUYXNrID0gMDtcbiAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuICAgICAgICB2YXIgZXJyb3JlZCA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBzdGFydFRhc2sgPSBmdW5jdGlvbiBzdGFydFRhc2soKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyZW50VGFzayA+PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0YXNrTnVtYmVyID0gY3VycmVudFRhc2srKztcbiAgICAgICAgICAgIHZhciB0YXNrID0gdGFza3NbdGFza051bWJlcl07XG4gICAgICAgICAgICBydW5uaW5nKys7XG5cbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4odGFzaykudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1t0YXNrTnVtYmVyXSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICBydW5uaW5nLS07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRUYXNrIDwgdGFza3MubGVuZ3RoICYmIHJ1bm5pbmcgPCBsaW1pdCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydFRhc2soKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bm5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlcnJvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFN0YXJ0IHVwIGBsaW1pdGAgdGFza3MuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgICAgICAgc3RhcnRUYXNrKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSBgYXJyYCBvZiBpdGVtcywgY2FsbHMgYGl0ZXIoaXRlbSwgaW5kZXgpYCBmb3IgZXZlcnkgaXRlbSBpbiBgYXJyYC4gIGBpdGVyKClgIHNob3VsZCByZXR1cm4gYVxuICogUHJvbWlzZS4gIFVwIHRvIGBsaW1pdGAgaXRlbXMgd2lsbCBiZSBjYWxsZWQgaW4gcGFyYWxsZWwgKGRlZmF1bHRzIHRvIDEuKVxuICovXG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXIsIGxpbWl0KSB7XG4gICAgdmFyIHRhc2tMaW1pdCA9IGxpbWl0O1xuICAgIGlmICghbGltaXQgfHwgbGltaXQgPCAxKSB7XG4gICAgICAgIHRhc2tMaW1pdCA9IDE7XG4gICAgfVxuICAgIGlmIChsaW1pdCA+PSBhcnIubGVuZ3RoKSB7XG4gICAgICAgIHRhc2tMaW1pdCA9IGFyci5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIHRhc2tzID0gYXJyLm1hcChmdW5jdGlvbiAoaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyKGl0ZW0sIGluZGV4KTtcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICByZXR1cm4gZXhwb3J0cy5wYXJhbGxlbCh0YXNrcywgdGFza0xpbWl0KTtcbn07XG5cbi8qXG4gKiBBZGQgYSB0aW1lb3V0IHRvIGFuIGV4aXN0aW5nIFByb21pc2UuXG4gKlxuICogUmVzb2x2ZXMgdG8gdGhlIHNhbWUgdmFsdWUgYXMgYHBgIGlmIGBwYCByZXNvbHZlcyB3aXRoaW4gYG1zYCBtaWxsaXNlY29uZHMsIG90aGVyd2lzZSB0aGUgcmV0dXJuZWQgUHJvbWlzZSB3aWxsXG4gKiByZWplY3Qgd2l0aCB0aGUgZXJyb3IgXCJUaW1lb3V0OiBQcm9taXNlIGRpZCBub3QgcmVzb2x2ZSB3aXRoaW4gJHttc30gbWlsbGlzZWNvbmRzXCJcbiAqL1xuZXhwb3J0cy50aW1lb3V0ID0gZnVuY3Rpb24gKHAsIG1zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICAgICAgICByZWplY3QobmV3IGV4cG9ydHMuVGltZW91dEVycm9yKFwiVGltZW91dDogUHJvbWlzZSBkaWQgbm90IHJlc29sdmUgd2l0aGluIFwiICsgbXMgKyBcIiBtaWxsaXNlY29uZHNcIikpO1xuICAgICAgICB9LCBtcyk7XG5cbiAgICAgICAgcC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBDb250aW51YWxseSBjYWxsIGBmbigpYCB3aGlsZSBgdGVzdCgpYCByZXR1cm5zIHRydWUuXG4gKlxuICogYGZuKClgIHNob3VsZCByZXR1cm4gYSBQcm9taXNlLiAgYHRlc3QoKWAgaXMgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRydWUgb2YgZmFsc2UuXG4gKlxuICogYHdoaWxzdGAgd2lsbCByZXNvbHZlIHRvIHRoZSBsYXN0IHZhbHVlIHRoYXQgYGZuKClgIHJlc29sdmVkIHRvLCBvciB3aWxsIHJlamVjdCBpbW1lZGlhdGVseSB3aXRoIGFuIGVycm9yIGlmXG4gKiBgZm4oKWAgcmVqZWN0cyBvciBpZiBgZm4oKWAgb3IgYHRlc3QoKWAgdGhyb3cuXG4gKi9cbmV4cG9ydHMud2hpbHN0ID0gZnVuY3Rpb24gKHRlc3QsIGZuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIGxhc3RSZXN1bHQgPSBudWxsO1xuICAgICAgICB2YXIgZG9JdCA9IGZ1bmN0aW9uIGRvSXQoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmbikudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0UmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChkb0l0LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGxhc3RSZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGRvSXQoKTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydHMuZG9XaGlsc3QgPSBmdW5jdGlvbiAoZm4sIHRlc3QpIHtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIHZhciBkb1Rlc3QgPSBmdW5jdGlvbiBkb1Rlc3QoKSB7XG4gICAgICAgIHZhciBhbnN3ZXIgPSBmaXJzdCB8fCB0ZXN0KCk7XG4gICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBhbnN3ZXI7XG4gICAgfTtcbiAgICByZXR1cm4gZXhwb3J0cy53aGlsc3QoZG9UZXN0LCBmbik7XG59O1xuXG4vKlxuICoga2VlcCBjYWxsaW5nIGBmbmAgdW50aWwgaXQgcmV0dXJucyBhIG5vbi1lcnJvciB2YWx1ZSwgZG9lc24ndCB0aHJvdywgb3IgcmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcy4gYGZuYCB3aWxsIGJlXG4gKiBhdHRlbXB0ZWQgYHRpbWVzYCBtYW55IHRpbWVzIGJlZm9yZSByZWplY3RpbmcuIElmIGB0aW1lc2AgaXMgZ2l2ZW4gYXMgYEluZmluaXR5YCwgdGhlbiBgcmV0cnlgIHdpbGwgYXR0ZW1wdCB0b1xuICogcmVzb2x2ZSBmb3JldmVyICh1c2VmdWwgaWYgeW91IGFyZSBqdXN0IHdhaXRpbmcgZm9yIHNvbWV0aGluZyB0byBmaW5pc2gpLlxuICogQHBhcmFtIHtPYmplY3R8TnVtYmVyfSBvcHRpb25zIGhhc2ggdG8gcHJvdmlkZSBgdGltZXNgIGFuZCBgaW50ZXJ2YWxgLiBEZWZhdWx0cyAodGltZXM9NSwgaW50ZXJ2YWw9MCkuIElmIHRoaXMgdmFsdWVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgaXMgYSBudW1iZXIsIG9ubHkgYHRpbWVzYCB3aWxsIGJlIHNldC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgZm4gdGhlIHRhc2svY2hlY2sgdG8gYmUgcGVyZm9ybWVkLiBDYW4gZWl0aGVyIHJldHVybiBhIHN5bmNocm9ub3VzIHZhbHVlLCB0aHJvdyBhbiBlcnJvciwgb3JcbiAqICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgcHJvbWlzZVxuICogQHJldHVybnMge1Byb21pc2V9XG4gKi9cbmV4cG9ydHMucmV0cnkgPSBmdW5jdGlvbiAob3B0aW9ucywgZm4pIHtcbiAgICB2YXIgdGltZXMgPSA1O1xuICAgIHZhciBpbnRlcnZhbCA9IDA7XG4gICAgdmFyIGF0dGVtcHRzID0gMDtcbiAgICB2YXIgbGFzdEF0dGVtcHQgPSBudWxsO1xuXG4gICAgZnVuY3Rpb24gbWFrZVRpbWVPcHRpb25FcnJvcih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgYXJndW1lbnQgdHlwZSBmb3IgJ3RpbWVzJzogXCIgKyAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YodmFsdWUpKSk7XG4gICAgfVxuXG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBvcHRpb25zKSBmbiA9IG9wdGlvbnM7ZWxzZSBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBvcHRpb25zKSB0aW1lcyA9ICtvcHRpb25zO2Vsc2UgaWYgKCdvYmplY3QnID09PSAodHlwZW9mIG9wdGlvbnMgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihvcHRpb25zKSkpIHtcbiAgICAgICAgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygb3B0aW9ucy50aW1lcykgdGltZXMgPSArb3B0aW9ucy50aW1lcztlbHNlIGlmIChvcHRpb25zLnRpbWVzKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobWFrZVRpbWVPcHRpb25FcnJvcihvcHRpb25zLnRpbWVzKSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50ZXJ2YWwpIGludGVydmFsID0gK29wdGlvbnMuaW50ZXJ2YWw7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobWFrZVRpbWVPcHRpb25FcnJvcihvcHRpb25zKSk7ZWxzZSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBwYXJhbWV0ZXJzIGdpdmVuJykpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIGRvSXQgPSBmdW5jdGlvbiBkb0l0KCkge1xuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuKGxhc3RBdHRlbXB0KTtcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICAgICAgbGFzdEF0dGVtcHQgPSBlcnI7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVzICE9PSBJbmZpbml0eSAmJiBhdHRlbXB0cyA9PT0gdGltZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGxhc3RBdHRlbXB0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGRvSXQsIGludGVydmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZG9JdCgpO1xuICAgIH0pO1xufTsiLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IFBvcnRTdG9yZSBmcm9tICcuL3BvcnQtc3RvcmUnO1xuaW1wb3J0IFByb21pc2VUb29scyBmcm9tICdwcm9taXNlLXRvb2xzJztcblxubGV0IHdlYmtpdCA9ICh3aW5kb3cgYXMgYW55KS53ZWJraXQ7XG5cbmNvbnN0IHByb21pc2VCcmlkZ2UgPSBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJtZXNzYWdlQ2hhbm5lbFwiKTtcblxuLy8gV2UgbmVlZCB0aGlzIHRvIGJlIGdsb2JhbGx5IGFjY2Vzc2libGUgc28gdGhhdCB3ZSBjYW4gdHJpZ2dlciByZWNlaXZlXG4vLyBldmVudHMgbWFudWFsbHlcblxuKHdpbmRvdyBhcyBhbnkpLl9fbWVzc2FnZUNoYW5uZWxCcmlkZ2UgPSBwcm9taXNlQnJpZGdlO1xuXG5pbnRlcmZhY2UgTWVzc2FnZVBvcnRNZXNzYWdlIHtcbiAgICBkYXRhOnN0cmluZyxcbiAgICBwYXNzZWRQb3J0SWRzOiBudW1iZXJbXVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShwb3J0SW5kZXg6bnVtYmVyLCBtZXNzYWdlOk1lc3NhZ2VQb3J0TWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJSZWNlaXZlZCBpbmNvbWluZyBtZXNzYWdlIGZyb20gbmF0aXZlLCB0byBwb3J0XCIsIHBvcnRJbmRleCwgXCJ3aXRoIG1lc3NhZ2VcIiwgbWVzc2FnZSk7XG4gICAgICAgIGxldCB0aGlzUG9ydCA9IFBvcnRTdG9yZS5maW5kT3JDcmVhdGVCeU5hdGl2ZUluZGV4KHBvcnRJbmRleCk7XG5cbiAgICAgICAgaWYgKCF0aGlzUG9ydCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJpZWQgdG8gcmVjZWl2ZSBtZXNzYWdlIG9uIGluYWN0aXZlIHBvcnRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbWFwcGVkUG9ydHMgPSBtZXNzYWdlLnBhc3NlZFBvcnRJZHMubWFwKChpZCkgPT4ge1xuICAgICAgICAgICAgLy8gV2UgY2FuJ3QgcGFzcyBpbiBhY3R1YWwgbWVzc2FnZSBwb3J0cywgc28gaW5zdGVhZCB3ZSBwYXNzIGluXG4gICAgICAgICAgICAvLyB0aGVpciBJRHMuIE5vdyB3ZSBtYXAgdGhlbSB0byBvdXIgd3JhcHBlciBDdXN0b21NZXNzYWdlUG9ydFxuICAgICAgICAgICAgcmV0dXJuIFBvcnRTdG9yZS5maW5kT3JDcmVhdGVCeU5hdGl2ZUluZGV4KGlkKS5qc01lc3NhZ2VQb3J0O1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlBvc3RpbmcgbWVzc2FnZSB0byBuYXRpdmUgaW5kZXhcIiwgdGhpc1BvcnQubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICB0aGlzUG9ydC5zZW5kT3JpZ2luYWxQb3N0TWVzc2FnZShtZXNzYWdlLmRhdGEsIG1hcHBlZFBvcnRzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgfVxuXG59XG5cbnByb21pc2VCcmlkZ2UuYWRkTGlzdGVuZXIoXCJlbWl0XCIsIHJlY2VpdmVNZXNzYWdlKTtcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VQb3J0V3JhcHBlciB7XG5cbiAgICBvcGVuOmJvb2xlYW47XG4gICAgbmF0aXZlUG9ydEluZGV4Om51bWJlcjtcbiAgICBqc01lc3NhZ2VQb3J0Ok1lc3NhZ2VQb3J0O1xuICAgIGpzTWVzc2FnZUNoYW5uZWw6TWVzc2FnZUNoYW5uZWw7XG4gICAgcHJpdmF0ZSBvcmlnaW5hbEpTUG9ydENsb3NlOkZ1bmN0aW9uO1xuICAgIG9yaWdpbmFsSlNQb3J0UG9zdDpGdW5jdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKGpzUG9ydDpNZXNzYWdlUG9ydCA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5uYXRpdmVQb3J0SW5kZXggPSBudWxsO1xuICAgICAgICBpZiAoanNQb3J0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ3JlYXRpbmcgd3JhcHBlciBmb3IgYW4gZXhpc3RpbmcgTWVzc2FnZVBvcnRcIilcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IGpzUG9ydFxuXG4gICAgICAgICAgICAvLyBkaXNndXN0aW5nIGhhY2ssIGJ1dCBjYW4ndCBzZWUgYW55IHdheSBhcm91bmQgaXMgYXMgdGhlcmUgaXMgbm9cbiAgICAgICAgICAgIC8vIFwiaGFzIGRpc3BhdGNoZWQgYSBtZXNzYWdlXCIgZXZlbnQsIGFzIGZhciBhcyBJIGNhbiB0ZWxsIFxuXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQucG9zdE1lc3NhZ2UgPSB0aGlzLmhhbmRsZUpTTWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIk1ha2luZyB3cmFwcGVyIGZvciBhIG5ldyB3ZWIgTWVzc2FnZVBvcnRcIilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gd2UgY2FuJ3QgY3JlYXRlIGEgTWVzc2FnZVBvcnQgZGlyZWN0bHksIHNvIHdlIGhhdmUgdG8gbWFrZVxuICAgICAgICAgICAgLy8gYSBjaGFubmVsIHRoZW4gdGFrZSBvbmUgcG9ydCBmcm9tIGl0LiBLaW5kIG9mIGEgd2FzdGUuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlQ2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0ID0gdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQxO1xuXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwucG9ydDIub25tZXNzYWdlID0gKGV2Ok1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHdlIGNhbid0IHJlbGlhYmx5IGhvb2sgaW50byBwb3N0TWVzc2FnZSwgc28gd2UgdXNlIHRoaXNcbiAgICAgICAgICAgICAgICAvLyB0byBjYXRjaCBwb3N0TWVzc2FnZXMgdG9vLiBOZWVkIHRvIGRvY3VtZW50IGFsbCB0aGlzIG1hZG5lc3MuXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVKU01lc3NhZ2UoZXYuZGF0YSwgZXYucG9ydHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2FtZSBmb3IgdGhlIGxhY2sgb2YgYSAnY2xvc2UnIGV2ZW50LlxuICAgICAgICB0aGlzLm9yaWdpbmFsSlNQb3J0Q2xvc2UgPSB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2U7XG4gICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydC5jbG9zZSA9IHRoaXMuY2xvc2U7XG4gICAgfVxuXG4gICAgc2VuZE9yaWdpbmFsUG9zdE1lc3NhZ2UoZGF0YTogYW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSkge1xuICAgICAgICBNZXNzYWdlUG9ydC5wcm90b3R5cGUucG9zdE1lc3NhZ2UuYXBwbHkodGhpcy5qc01lc3NhZ2VQb3J0LCBbZGF0YSwgcG9ydHNdKTtcbiAgICB9XG5cbiAgICBoYW5kbGVKU01lc3NhZ2UoZGF0YTphbnksIHBvcnRzOiBNZXNzYWdlUG9ydFtdKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgXG4gICAgICAgIC8vIEdldCBvdXIgY3VzdG9tIHBvcnQgaW5zdGFuY2VzLCBjcmVhdGluZyB0aGVtIGlmIG5lY2Vzc2FyeVxuICAgICAgICBsZXQgY3VzdG9tUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChwb3J0cykge1xuICAgICAgICAgICAgY3VzdG9tUG9ydHMgPSBwb3J0cy5tYXAoKHA6TWVzc2FnZVBvcnQpID0+IFBvcnRTdG9yZS5maW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQocCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja0Zvck5hdGl2ZVBvcnQoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGV5IHdlcmUgY3JlYXRlZCwgdGhlbiB3ZSBuZWVkIHRvIGFzc2lnbiB0aGVtIGEgbmF0aXZlIElEIGJlZm9yZVxuICAgICAgICAgICAgLy8gd2Ugc2VuZC5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGVja2luZyB0aGF0IGFkZGl0aW9uYWwgcG9ydHMgaGF2ZSBuYXRpdmUgZXF1aXZhbGVudHNcIilcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJwb3N0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUG9ydEluZGV4ZXM6IGN1c3RvbVBvcnRzLm1hcCgocCkgPT4gcC5uYXRpdmVQb3J0SW5kZXgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNoZWNrRm9yTmF0aXZlUG9ydCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAodGhpcy5uYXRpdmVQb3J0SW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5kZWJ1ZyhcIlBvcnQgYWxyZWFkeSBoYXMgbmF0aXZlIGluZGV4XCIsIHRoaXMubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgb3BlcmF0aW9uOiBcImNyZWF0ZVwiXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChwb3J0SWQ6bnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiQ3JlYXRlZCBuZXcgbmF0aXZlIE1lc3NhZ2VQb3J0IGF0IGluZGV4IFwiLCBTdHJpbmcocG9ydElkKSlcbiAgICAgICAgICAgIHRoaXMubmF0aXZlUG9ydEluZGV4ID0gcG9ydElkO1xuXG4gICAgICAgICAgICAvLyBvbmx5IGFkZCB0byBvdXIgYXJyYXkgb2YgYWN0aXZlIGNoYW5uZWxzIHdoZW5cbiAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBuYXRpdmUgSURcbiAgICAgICAgICAgIFBvcnRTdG9yZS5hZGQodGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcblxuICAgICAgICAvLyBydW4gdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIHdlIG92ZXJ3cm90ZVxuICAgICAgICB0aGlzLm9yaWdpbmFsSlNQb3J0Q2xvc2UuYXBwbHkodGhpcy5qc01lc3NhZ2VQb3J0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlbW92ZSBmcm9tIG91ciBjYWNoZSBvZiBhY3RpdmUgcG9ydHNcbiAgICAgICAgUG9ydFN0b3JlLnJlbW92ZSh0aGlzKTtcbiAgICAgXG4gICAgICAgIC8vIGZpbmFsbHksIHRlbGwgdGhlIG5hdGl2ZSBoYWxmIHRvIGRlbGV0ZSB0aGlzIHJlZmVyZW5jZS5cbiAgICAgICAgcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJkZWxldGVcIixcbiAgICAgICAgICAgIHBvcnRJbmRleDogdGhpcy5uYXRpdmVQb3J0SW5kZXhcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbi8vIGxldCB3aW5kb3dBc0FueSA9ICh3aW5kb3cgYXMgYW55KTtcbi8vIHdpbmRvd0FzQW55Lk1lc3NhZ2VQb3J0ID0gQ3VzdG9tTWVzc2FnZVBvcnQ7XG4vLyB3aW5kb3dBc0FueS5DdXN0b21NZXNzYWdlUG9ydCA9IEN1c3RvbU1lc3NhZ2VQb3J0O1xuLy8gd2luZG93QXNBbnkuTWVzc2FnZUNoYW5uZWwgPSBDdXN0b21NZXNzYWdlQ2hhbm5lbDsiLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcblxubGV0IGV2ZW50c0JyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImV2ZW50c1wiKTtcblxuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZEV2ZW50cyA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihuYW1lOlN0cmluZywgZGF0YTpTdHJpbmcpIHtcbiAgICAgICAgZXZlbnRzQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbmFtZSwgZGF0YVxuICAgICAgICB9KVxuICAgIH1cbn0iLCIvLyBpbXBvcnQgJ3doYXR3Zy1mZXRjaCc7XG4vLyBpbXBvcnQgJy4vdXRpbC9vdmVycmlkZS1sb2dnaW5nJztcbmltcG9ydCAnLi9uYXZpZ2F0b3Ivc2VydmljZS13b3JrZXInO1xuaW1wb3J0ICcuL2NvbnNvbGUnO1xuaW1wb3J0ICcuL21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbCc7XG5pbXBvcnQgJy4vdXRpbC9nZW5lcmljLWV2ZW50cyc7XG5cbndpbmRvdy5vbmVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xufVxuXG4vLyBkb2N1bWVudC5ib2R5LmlubmVySFRNTD1cIlRISVMgTE9BREVEXCIiXSwibmFtZXMiOlsiYXJndW1lbnRzIiwidGhpcyIsInBhdGgucmVzb2x2ZSIsImNvbnNvbGUiLCJ3ZWJraXQiLCJwcm9taXNlQnJpZGdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLFlBQVksQ0FBQzs7QUFFYixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQzs7Ozs7Ozs7OztBQVUxQyxJQUFJLE1BQU0sR0FBRyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7QUFVL0QsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7RUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztFQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUks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U0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQztNQUMxRCxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzlELEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ2xFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUN0RSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQy9FOztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDbEQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsV0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVCOztJQUVELFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDN0MsTUFBTTtJQUNMLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO1FBQ3pCLENBQUMsQ0FBQzs7SUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMzQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUVDLE1BQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOztNQUVwRixRQUFRLEdBQUc7UUFDVCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzFELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzlELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNsRTtVQUNFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHRCxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDNUI7O1VBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNyRDtLQUNGO0dBQ0Y7O0VBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYixDQUFDOzs7Ozs7Ozs7O0FBVUYsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUM7TUFDdEMsR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7T0FDaEQ7SUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRztNQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVE7S0FDNUIsQ0FBQztHQUNIOztFQUVELE9BQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7Ozs7Ozs7OztBQVVGLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFDLEtBQUss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QUcsQ0FBQyxLQUFLLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztDQUN4Rjs7QUFFRCxBQUFPLFNBQVMsVUFBVSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtJQUN0RCxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0gsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDakU7O0FBRUQsQUFBTyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUM1Rzs7QUFFRCxBQUFPLFNBQVMsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7SUFDM0MsT0FBTyxVQUFVLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUFFO0NBQ3hFOztBQUVELEFBQU8sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQ3pELE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUN2RCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDM0YsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDL0ksSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUNuRSxDQUFDLENBQUM7Q0FDTjs7QUMzQkQsSUFBTSxNQUFNLEdBQUksTUFBYyxDQUFDLE1BQU0sQ0FBQzs7QUFHdEMsSUFBTSxnQkFBZ0IsR0FBNkIsRUFBRSxDQUFDO0FBQ3RELElBQU0sY0FBYyxHQUF5QyxFQUFFLENBQUM7QUFDL0QsTUFBYyxDQUFDLHdCQUF3QixHQUFHLGdCQUFnQixDQUFDO0FBQzNELE1BQWMsQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUM7QUFFM0M7SUFBbUMsd0NBQVk7SUFLbEQsOEJBQVksSUFBVztRQUNuQixpQkFBTyxDQUFBO1FBSkgsa0JBQWEsR0FBMEIsRUFBRSxDQUFBO1FBSzdDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQW9CLElBQUksc0JBQWtCLENBQUMsQ0FBQztTQUMvRDtRQUVELElBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBdUIsSUFBSSx3QkFBbUIsQ0FBQyxDQUFBO1NBQ2xFO1FBRUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMvQjtJQUVELDRDQUFhLEdBQWIsVUFBYyxPQUFXOztRQUF6QixrQkFBQTs7UUFBQSxpQkFtQkM7UUFmRyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDdEIsT0FBT0MsTUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN0QyxhQUFhLEVBQUUsQ0FBQztTQUNuQjtRQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTs7WUFJL0IsS0FBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0RCxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFDLGVBQUEsYUFBYSxFQUFFLFNBQUEsT0FBTyxFQUFDLENBQUMsQ0FBQTtZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBQyxlQUFBLGFBQWEsRUFBRSxTQUFBLE9BQU8sRUFBQyxDQUFDLENBQUM7U0FFM0UsQ0FBQyxDQUFBO0tBRUw7SUFFRCxtQ0FBSSxHQUFKLFVBQUssT0FBVzs7UUFHWixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBQyxTQUFBLE9BQU8sRUFBQyxDQUFDLENBQUM7S0FDNUQ7SUFFRCw4Q0FBZSxHQUFmLFVBQWdCLGFBQW9CLEVBQUUsR0FBVSxFQUFFLFFBQWE7UUFFM0QsSUFBSTtZQUNBLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7YUFDaEU7O1lBR0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7WUFFcEMsNkJBQU8sRUFBRSx3QkFBTSxDQUFpQjtZQUVyQyxJQUFJLEdBQUcsRUFBRTtnQkFDTCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUMxQjtpQkFBTTtnQkFDSCxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDckI7U0FDSDtRQUFBLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN0QjtLQUNKO0lBRUwsMkJBQUM7Q0FBQSxDQXZFeUMsWUFBWSxHQXVFckQsQUFDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hEQSxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFOztFQUU3QyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7RUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtNQUNoQixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNwQixNQUFNLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtNQUN4QixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNuQixFQUFFLEVBQUUsQ0FBQztLQUNOLE1BQU0sSUFBSSxFQUFFLEVBQUU7TUFDYixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNuQixFQUFFLEVBQUUsQ0FBQztLQUNOO0dBQ0Y7OztFQUdELElBQUksY0FBYyxFQUFFO0lBQ2xCLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO01BQ2YsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQjtHQUNGOztFQUVELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7QUFJRCxJQUFJLFdBQVc7SUFDWCwrREFBK0QsQ0FBQztBQUNwRSxJQUFJLFNBQVMsR0FBRyxTQUFTLFFBQVEsRUFBRTtFQUNqQyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVDLENBQUM7Ozs7QUFJRixPQUFPLENBQUMsT0FBTyxHQUFHLFdBQVc7RUFDM0IsNEJBQUE7O0VBQUEsSUFBSSxZQUFZLEdBQUcsRUFBRTtNQUNqQixnQkFBZ0IsR0FBRyxLQUFLLENBQUM7O0VBRTdCLEtBQUssSUFBSSxDQUFDLEdBQUdELFdBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3BFLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSUEsV0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7O0lBR25ELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO01BQzVCLE1BQU0sSUFBSSxTQUFTLENBQUMsMkNBQTJDLENBQUMsQ0FBQztLQUNsRSxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUU7TUFDaEIsU0FBUztLQUNWOztJQUVELFlBQVksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFlBQVksQ0FBQztJQUN6QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztHQUMzQzs7Ozs7O0VBTUQsWUFBWSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRTtJQUN4RSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDWixDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFFakMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLEdBQUcsR0FBRyxHQUFHLEVBQUUsSUFBSSxZQUFZLEtBQUssR0FBRyxDQUFDO0NBQzlELENBQUM7Ozs7QUFJRixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsSUFBSSxFQUFFO0VBQ2pDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO01BQ3JDLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDOzs7RUFHN0MsSUFBSSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRTtJQUN4RCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDWixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7O0VBRTNCLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7SUFDeEIsSUFBSSxHQUFHLEdBQUcsQ0FBQztHQUNaO0VBQ0QsSUFBSSxJQUFJLElBQUksYUFBYSxFQUFFO0lBQ3pCLElBQUksSUFBSSxHQUFHLENBQUM7R0FDYjs7RUFFRCxPQUFPLENBQUMsVUFBVSxHQUFHLEdBQUcsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDO0NBQ3ZDLENBQUM7OztBQUdGLE9BQU8sQ0FBQyxVQUFVLEdBQUcsU0FBUyxJQUFJLEVBQUU7RUFDbEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztDQUMvQixDQUFDOzs7QUFHRixPQUFPLENBQUMsSUFBSSxHQUFHLFdBQVc7RUFDeEIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNyRCxPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUU7SUFDeEQsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUU7TUFDekIsTUFBTSxJQUFJLFNBQVMsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsT0FBTyxDQUFDLENBQUM7R0FDVixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDZixDQUFDOzs7OztBQUtGLE9BQU8sQ0FBQyxRQUFRLEdBQUcsU0FBUyxJQUFJLEVBQUUsRUFBRSxFQUFFO0VBQ3BDLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN2QyxFQUFFLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRW5DLFNBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRTtJQUNqQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxPQUFPLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO01BQ2xDLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxNQUFNO0tBQzlCOztJQUVELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtNQUN0QixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTTtLQUM1Qjs7SUFFRCxJQUFJLEtBQUssR0FBRyxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDM0IsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0dBQzFDOztFQUVELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdEMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7RUFFbEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUN4RCxJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUM7RUFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMvQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDL0IsZUFBZSxHQUFHLENBQUMsQ0FBQztNQUNwQixNQUFNO0tBQ1A7R0FDRjs7RUFFRCxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7RUFDckIsS0FBSyxJQUFJLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDdkQsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUN4Qjs7RUFFRCxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7O0VBRWpFLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM5QixDQUFDOztBQUVGLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDOztBQUV4QixPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsSUFBSSxFQUFFO0VBQy9CLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7TUFDeEIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7TUFDaEIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7RUFFcEIsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTs7SUFFakIsT0FBTyxHQUFHLENBQUM7R0FDWjs7RUFFRCxJQUFJLEdBQUcsRUFBRTs7SUFFUCxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztHQUNyQzs7RUFFRCxPQUFPLElBQUksR0FBRyxHQUFHLENBQUM7Q0FDbkIsQ0FBQzs7O0FBR0YsT0FBTyxDQUFDLFFBQVEsR0FBRyxTQUFTLElBQUksRUFBRSxHQUFHLEVBQUU7RUFDckMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQUUzQixJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUU7SUFDNUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0dBQ3hDO0VBQ0QsT0FBTyxDQUFDLENBQUM7Q0FDVixDQUFDOzs7QUFHRixPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsSUFBSSxFQUFFO0VBQy9CLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzNCLENBQUM7O0FBRUYsU0FBUyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtJQUNwQixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2hDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUNELE9BQU8sR0FBRyxDQUFDO0NBQ2Q7OztBQUdELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO01BQzlCLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO01BQzVELFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7UUFDekIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUMxQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2pDO0NBQ0o7Ozs7Ozs7Ozs7Ozs7OztBQzFOTSxJQUFNLG1CQUFtQixHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUM7QUFFN0U7SUFBb0MseUNBQVk7SUFBaEQ7UUFBb0MsOEJBQVk7S0FhL0M7SUFaRyxnREFBZ0IsR0FBaEIsVUFBaUIsSUFBVyxFQUFFLFFBQWdDLEVBQUUsVUFBa0I7UUFDOUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDcEM7SUFFRCw2Q0FBYSxHQUFiLFVBQWMsR0FBUztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekIsT0FBTyxJQUFJLENBQUE7S0FDZDtJQUVELG1EQUFtQixHQUFuQixVQUFvQixJQUFXLEVBQUUsUUFBZ0M7UUFDN0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDdkM7SUFDTCw0QkFBQztDQUFBLENBYm1DLFlBQVksR0FhL0M7QUFFRDtJQUFrQyx1Q0FBcUI7SUE2Qm5ELDZCQUFZLEVBQVMsRUFBRSxTQUFnQixFQUFFLEtBQVksRUFBRSxLQUErQjtRQUNsRixpQkFBTyxDQUFBO1FBQ1AsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztLQUM3QjtJQTdCRCxzQkFBSSxzQ0FBSzthQUFUO1lBQ0ksSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLHlCQUF5QixDQUFDLFNBQVMsRUFBRTtnQkFDM0QsT0FBTyxXQUFXLENBQUE7YUFDckI7WUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUsseUJBQXlCLENBQUMsVUFBVSxFQUFFO2dCQUM1RCxPQUFPLFlBQVksQ0FBQTthQUN0QjtZQUNELElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUU7Z0JBQzNELE9BQU8sV0FBVyxDQUFBO2FBQ3JCO1lBQ0QsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLHlCQUF5QixDQUFDLFVBQVUsRUFBRTtnQkFDNUQsT0FBTyxZQUFZLENBQUE7YUFDdEI7WUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUsseUJBQXlCLENBQUMsU0FBUyxFQUFFO2dCQUMzRCxPQUFPLFdBQVcsQ0FBQTthQUNyQjtZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQ3JFOzs7T0FBQTtJQWNELHlDQUFXLEdBQVgsVUFBWSxLQUFnQztRQUN4QyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzdCLE9BQU87U0FDVjtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNwQixJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUNmLE1BQU0sRUFBRSxJQUFJO2FBQ2YsQ0FBQyxDQUFDO1NBQ047S0FDSjtJQUdELHlDQUFXLEdBQVg7S0FFQztJQUVELHVDQUFTLEdBQVQ7UUFDSSxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDakQ7SUFPTCwwQkFBQztDQUFBLENBL0RpQyxxQkFBcUIsR0ErRHREO0FBRUQ7SUFBaUMsc0NBQXFCO0lBUWxEO1FBUkosaUJBeUVDO1FBaEVPLGlCQUFPLENBQUM7UUFFUixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRTtZQUM1QixJQUFJLEtBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BCLEtBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUN4QjtTQUNKLENBQUMsQ0FBQTtLQUNMO0lBRUQsZ0RBQW1CLEdBQW5COztRQUVJLE9BQU8sSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDekQ7SUFFRCxtQ0FBTSxHQUFOO1FBQ0ksbUJBQW1CLENBQUMsYUFBYSxDQUFDO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLEdBQUcsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxTQUFTO1NBQzVDLENBQUMsQ0FBQTtLQUNMO0lBRUQsc0JBQUkscUNBQUs7YUFBVDtZQUNJLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDNUI7OztPQUFBO0lBRUQsdUNBQVUsR0FBVjtRQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7S0FDN0I7SUFFRCw2REFBZ0MsR0FBaEMsVUFBaUMsRUFBc0I7OztRQUluRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssRUFBRSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRTtZQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztTQUMxQjtRQUVELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxFQUFFLEVBQUU7WUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDdkI7S0FDSjtJQUlELDBEQUE2QixHQUE3QixVQUE4QixFQUFzQjtRQUVoRCxJQUFJLENBQUMsZ0NBQWdDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFMUMsSUFBSSxFQUFFLENBQUMsWUFBWSxLQUFLLHlCQUF5QixDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDekUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7U0FDcEI7UUFFRCxJQUFJLEVBQUUsQ0FBQyxZQUFZLEtBQUsseUJBQXlCLENBQUMsU0FBUyxFQUFFO1lBQ3pELElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1NBQ3JCO1FBQ0QsSUFBSSxFQUFFLENBQUMsWUFBWSxLQUFLLHlCQUF5QixDQUFDLFVBQVUsRUFBRTtZQUMxRCxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNoQztLQUNKO0lBQ0wseUJBQUM7Q0FBQSxDQXpFZ0MscUJBQXFCLEdBeUVyRDtBQUVELElBQU0sb0JBQW9CLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO0FBRXREO0lBQTJDLGdEQUFZO0lBT25EO1FBUEosaUJBd0RDO1FBaERPLGlCQUFPLENBQUM7UUFFUixJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFO1lBQ2pDLElBQUksS0FBSSxDQUFDLGtCQUFrQixFQUFFOztnQkFHekIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7YUFDN0I7U0FDSixDQUFDLENBQUM7UUFFSCxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQUMsRUFBc0I7WUFDckQsS0FBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsS0FBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pDLENBQUMsQ0FBQTtLQUNMO0lBRUQsK0NBQVEsR0FBUixVQUFTLEdBQVUsRUFBRSxPQUFxQztRQUV0RCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBR0UsT0FBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXBGLE9BQU8sQ0FBQyxJQUFJLENBQUMsMENBQTBDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFbkUsT0FBTyxtQkFBbUIsQ0FBQyxhQUFhLENBQUM7WUFDckMsU0FBUyxFQUFFLFVBQVU7WUFDckIsTUFBTSxFQUFFLEdBQUc7WUFDWCxLQUFLLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSTtTQUN4QyxDQUFDO2FBQ0QsSUFBSSxDQUFDLFVBQUMsUUFBMkI7WUFDOUIsSUFBSSxNQUFNLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFN0MsT0FBTyxvQkFBb0IsQ0FBQztTQUMvQixDQUFDLENBQUE7S0FDTDtJQUVELHlEQUFrQixHQUFsQixVQUFtQixFQUFzQjtRQUNyQyxvQkFBb0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxRCxvQkFBb0IsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDckM7SUFFRCxzREFBZSxHQUFmLFVBQWdCLEtBQVk7UUFDeEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7S0FDaEQ7SUFFRCx1REFBZ0IsR0FBaEI7O1FBRUksT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0wsbUNBQUM7Q0FBQSxDQXhEMEMsWUFBWSxHQXdEdEQ7QUFFRCxBQUFPLElBQU0sc0JBQXNCLEdBQUcsSUFBSSw0QkFBNEIsRUFBRSxDQUFDO0FBRXpFLElBQUsseUJBTUo7QUFORCxXQUFLLHlCQUF5QjtJQUMxQixxRkFBYyxDQUFBO0lBQ2QsbUZBQVMsQ0FBQTtJQUNULHFGQUFVLENBQUE7SUFDVixtRkFBUyxDQUFBO0lBQ1QsbUZBQVMsQ0FBQTtDQUNaLEVBTkkseUJBQXlCLEtBQXpCLHlCQUF5QixRQU03QjtBQVNELElBQU0sb0JBQW9CLEdBQXdDLEVBQUUsQ0FBQztBQUVyRSwrQkFBK0IsUUFBMkI7O0lBRXRELElBQUksTUFBTSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsTUFBTSxFQUFFOztRQUVULE1BQU0sR0FBRyxJQUFJLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDO0tBQ3REO1NBQU07UUFDSCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUM3QztJQUVELG9CQUFvQixDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTNELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sTUFBTSxDQUFDO0NBQ2pCO0FBRUQsbUJBQW1CLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBRXBFLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsVUFBUyxLQUF3QjtJQUN4RSxJQUFJLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUE7SUFDcEMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDckQsQ0FBQyxDQUFBOztBQUdGLG1CQUFtQixDQUFDLGFBQWEsQ0FBQztJQUM5QixTQUFTLEVBQUUsUUFBUTtDQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsT0FBNkI7SUFDbEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFDLE1BQU07UUFDbkIsb0JBQW9CLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksbUJBQW1CLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUgsb0JBQW9CLENBQUMsNkJBQTZCLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7S0FDL0YsQ0FBQyxDQUFBO0NBQ0wsQ0FBQyxDQUFBOztBQ2hSRixJQUFJLGNBQWMsR0FBTyxTQUFTLENBQUM7QUFFbkMsY0FBYyxDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQzs7QUNIdEQsSUFBTSxhQUFhLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUUxRCxJQUFNLFlBQVksR0FBRyxVQUFDLEdBQU87SUFDekIsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO1FBQ3RCLE9BQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3pCO1NBQU0sSUFBSSxPQUFPLEdBQUcsSUFBSSxRQUFRLEVBQUU7UUFDL0IsT0FBTyxHQUFHLENBQUM7S0FDZDtTQUFNLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO1FBQzFDLE9BQU8sTUFBTSxDQUFBO0tBQ2hCO1NBQU07UUFDSCxJQUFJLFlBQVksR0FBRyx1QkFBdUIsQ0FBQTtRQUMxQyxJQUFJO1lBQ0EsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDckM7UUFBQSxPQUFPLEdBQUcsRUFBRTtZQUNWLFlBQVksSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7U0FDakM7UUFDRCxPQUFPLFlBQVksQ0FBQTtLQUN0QjtDQUNKLENBQUE7QUFFRCxJQUFJLE1BQU0sR0FBRyxDQUFDLE9BQU8sRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUV0RCxJQUFJQyxTQUFPLEdBQThCLEVBQUUsQ0FBQztBQUU1QyxJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsT0FBYyxDQUFDO0FBRTNDLE1BQWMsQ0FBQyxPQUFPLEdBQUdBLFNBQU8sQ0FBQztBQUVsQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSztJQUNqQkEsU0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHO1FBRWIsSUFBSSxlQUFlLEVBQUU7O1lBRWpCLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQzVEO1FBRUQsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFekQsYUFBYSxDQUFDLElBQUksQ0FBQztZQUNmLEtBQUssRUFBRSxLQUFLO1lBQ1osSUFBSSxFQUFFLFVBQVU7U0FDbkIsQ0FBQyxDQUFBO0tBQ0wsQ0FBQTtDQUNKLENBQUMsQ0FBQTs7QUMzQ0YsSUFBTSxrQkFBa0IsR0FBd0IsRUFBRSxDQUFBO0FBRWxELElBQU0sU0FBUyxHQUFHO0lBRWQsR0FBRyxFQUFFLFVBQVUsSUFBdUI7UUFDbEMsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1NBQ3JFO1FBQ0Qsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsTUFBTSxFQUFFLFVBQVUsSUFBdUI7UUFDckMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNsRTtJQUVELGlCQUFpQixFQUFFLFVBQVMsV0FBa0I7UUFDMUMsSUFBSSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLGVBQWUsS0FBSyxXQUFXLEdBQUEsQ0FBQyxDQUFDO1FBQ25GLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3RCO0lBRUQseUJBQXlCLEVBQUUsVUFBUyxXQUFrQjtRQUNsRCxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUU7WUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO1NBQ2pEO1FBRUQsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXhELElBQUksUUFBUSxFQUFFOztZQUVWLE9BQU8sUUFBUSxDQUFDO1NBQ25COztRQUlELElBQUksU0FBUyxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUN6QyxTQUFTLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxFQUFFLFdBQVcsQ0FBQyxDQUFBOztRQUcxRSxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pCLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBRUQsd0JBQXdCLEVBQUUsVUFBUyxJQUFnQjtRQUMvQyxJQUFJLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsYUFBYSxJQUFJLElBQUksR0FBQSxDQUFDLENBQUM7UUFFekUsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTs7WUFFdEIsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEI7UUFFRCxJQUFJLFNBQVMsR0FBRyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDOzs7UUFLN0MsT0FBTyxTQUFTLENBQUM7S0FDcEI7Q0FDSixDQUFBO0FBRUQ7QUFHQyxNQUFjLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQzs7O0FDakU1QyxZQUFZLENBQUM7O0FBRWIsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxHQUFHLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLEdBQUcsQ0FBQyxXQUFXLEtBQUssTUFBTSxHQUFHLFFBQVEsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFOztBQUU1SCxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUM7QUFDbEMsSUFBSSxNQUFNLEdBQUcsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtJQUN4QyxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUNwQixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7S0FDSjtJQUNELFNBQVMsSUFBSSxHQUFHO1FBQ1osSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7S0FDNUI7SUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDbEMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQzdCLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUNuQyxPQUFPLEtBQUssQ0FBQztDQUNoQixDQUFDOztBQUVGLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEdBQUcsVUFBVSxPQUFPLEVBQUU7SUFDekQsSUFBSSxFQUFFLElBQUksWUFBWSxZQUFZLENBQUMsRUFBRTtRQUNqQyxPQUFPLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7OztRQUd6QixZQUFZLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ25ELE1BQU07O1FBRUgsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUM7S0FDekM7SUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQztDQUM5QixDQUFDO0FBQ0YsTUFBTSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQzs7Ozs7QUFLNUIsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLEVBQUUsRUFBRTtJQUMxQixPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsT0FBTyxFQUFFO1FBQ2xDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDM0IsQ0FBQyxDQUFDO0NBQ04sQ0FBQzs7Ozs7O0FBTUYsT0FBTyxDQUFDLEtBQUssR0FBRyxZQUFZO0lBQ3hCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUNwRCxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN6QixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztLQUMxQixDQUFDLENBQUM7SUFDSCxPQUFPLE1BQU0sQ0FBQztDQUNqQixDQUFDOzs7Ozs7QUFNRixPQUFPLENBQUMsTUFBTSxHQUFHLFVBQVUsS0FBSyxFQUFFO0lBQzlCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNqQixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ3hDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxNQUFNLEVBQUU7WUFDNUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN4QixDQUFDLENBQUM7S0FDTixFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZO1FBQ25DLE9BQU8sT0FBTyxDQUFDO0tBQ2xCLENBQUMsQ0FBQztDQUNOLENBQUM7Ozs7OztBQU1GLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsR0FBRyxVQUFVLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDL0QsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQzlDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxFQUFFO1lBQ3pDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QyxDQUFDLENBQUMsQ0FBQztLQUNQOztJQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO1FBQzFDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQzs7UUFFakIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7O1FBRXBCLElBQUksU0FBUyxHQUFHLFNBQVMsU0FBUyxHQUFHO1lBQ2pDLElBQUksT0FBTyxFQUFFO2dCQUNULE9BQU87YUFDVjtZQUNELElBQUksV0FBVyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQzdCLE9BQU87YUFDVjs7WUFFRCxJQUFJLFVBQVUsR0FBRyxXQUFXLEVBQUUsQ0FBQztZQUMvQixJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsT0FBTyxFQUFFLENBQUM7O1lBRVYsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxNQUFNLEVBQUU7Z0JBQ2hELE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUM7Z0JBQzdCLE9BQU8sRUFBRSxDQUFDO2dCQUNWLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksT0FBTyxHQUFHLEtBQUssRUFBRTtvQkFDL0MsU0FBUyxFQUFFLENBQUM7aUJBQ2YsTUFBTSxJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUU7b0JBQ3RCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDcEI7YUFDSixFQUFFLFVBQVUsR0FBRyxFQUFFO2dCQUNkLElBQUksT0FBTyxFQUFFO29CQUNULE9BQU87aUJBQ1Y7Z0JBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDZixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDZixDQUFDLENBQUM7U0FDTixDQUFDOzs7UUFHRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVCLFNBQVMsRUFBRSxDQUFDO1NBQ2Y7S0FDSixDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7QUFNRixPQUFPLENBQUMsR0FBRyxHQUFHLFVBQVUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7SUFDdEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUNyQixTQUFTLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0lBQ0QsSUFBSSxLQUFLLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtRQUNyQixTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztLQUMxQjs7SUFFRCxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxFQUFFLEtBQUssRUFBRTtRQUN2QyxPQUFPLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDNUIsQ0FBQztLQUNMLENBQUMsQ0FBQztJQUNILE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDN0MsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtJQUMvQixPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUMxQyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsWUFBWTtZQUMvQixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2IsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQywwQ0FBMEMsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQztTQUN2RyxFQUFFLEVBQUUsQ0FBQyxDQUFDOztRQUVQLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxNQUFNLEVBQUU7WUFDckIsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUNoQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNuQjtTQUNKLEVBQUUsVUFBVSxHQUFHLEVBQUU7WUFDZCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7Z0JBQ2hCLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2Y7U0FDSixDQUFDLENBQUM7S0FDTixDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7Ozs7O0FBVUYsT0FBTyxDQUFDLE1BQU0sR0FBRyxVQUFVLElBQUksRUFBRSxFQUFFLEVBQUU7SUFDakMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7UUFDMUMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksSUFBSSxHQUFHLFNBQVMsSUFBSSxHQUFHO1lBQ3ZCLElBQUk7Z0JBQ0EsSUFBSSxJQUFJLEVBQUUsRUFBRTtvQkFDUixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLE1BQU0sRUFBRTt3QkFDOUMsVUFBVSxHQUFHLE1BQU0sQ0FBQzt3QkFDcEIsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztxQkFDdkIsRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDZCxNQUFNO29CQUNILE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDdkI7YUFDSixDQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNWLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNmO1NBQ0osQ0FBQzs7UUFFRixJQUFJLEVBQUUsQ0FBQztLQUNWLENBQUMsQ0FBQztDQUNOLENBQUM7O0FBRUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUU7SUFDbkMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUksTUFBTSxHQUFHLFNBQVMsTUFBTSxHQUFHO1FBQzNCLElBQUksTUFBTSxHQUFHLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUM3QixLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2QsT0FBTyxNQUFNLENBQUM7S0FDakIsQ0FBQztJQUNGLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDckMsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWUYsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLE9BQU8sRUFBRSxFQUFFLEVBQUU7SUFDbkMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNqQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7O0lBRXZCLFNBQVMsbUJBQW1CLENBQUMsS0FBSyxFQUFFO1FBQ2hDLE9BQU8sSUFBSSxLQUFLLENBQUMseUNBQXlDLElBQUksT0FBTyxLQUFLLEtBQUssV0FBVyxHQUFHLFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9IOztJQUVELElBQUksVUFBVSxLQUFLLE9BQU8sT0FBTyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLFFBQVEsS0FBSyxPQUFPLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLFFBQVEsTUFBTSxPQUFPLE9BQU8sS0FBSyxXQUFXLEdBQUcsV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFO1FBQzVMLElBQUksUUFBUSxLQUFLLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs7UUFFaEosSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7S0FDdEQsTUFBTSxJQUFJLE9BQU8sRUFBRSxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7O0lBRXJJLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO1FBQzFDLElBQUksSUFBSSxHQUFHLFNBQVMsSUFBSSxHQUFHO1lBQ3ZCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWTtnQkFDL0IsT0FBTyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDMUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxDQUFDO2dCQUNYLFdBQVcsR0FBRyxHQUFHLENBQUM7Z0JBQ2xCLElBQUksS0FBSyxLQUFLLFFBQVEsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO29CQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ3ZCLE1BQU07b0JBQ0gsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDOUI7YUFDSixDQUFDLENBQUM7U0FDTixDQUFDO1FBQ0YsSUFBSSxFQUFFLENBQUM7S0FDVixDQUFDLENBQUM7Q0FDTjs7Ozs7Ozs7Ozs7Ozs7OztBQy9QRCxJQUFJQyxRQUFNLEdBQUksTUFBYyxDQUFDLE1BQU0sQ0FBQztBQUVwQyxJQUFNQyxlQUFhLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7QUFLaEUsTUFBYyxDQUFDLHNCQUFzQixHQUFHQSxlQUFhLENBQUM7QUFPdkQsd0JBQXdCLFNBQWdCLEVBQUUsT0FBMEI7SUFDaEUsSUFBSTtRQUNBLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0RBQWdELEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFOUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztTQUNoRTtRQUVELElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBRTs7O1lBRzNDLE9BQU8sU0FBUyxDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQztTQUNoRSxDQUFDLENBQUE7UUFFRixPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUMxRSxRQUFRLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztLQUM5RDtJQUFBLE9BQU8sR0FBRyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUNyQjtDQUVKO0FBRURBLGVBQWEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBRTNDO0lBU0gsNEJBQVksTUFBeUI7UUFUbEMsaUJBMkdOO1FBbEdlLHlCQUFBLGFBQXlCO1FBQ2pDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzVCLElBQUksTUFBTSxFQUFFO1lBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFBO1lBQzdELElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFBOzs7WUFLM0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDcEU7YUFBTTtZQUNILE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQTs7O1lBS3pELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUVqRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxVQUFDLEVBQWU7OztnQkFHcEQsS0FBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMzQyxDQUFBO1NBQ0o7O1FBR0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1FBQ3BELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDekM7SUFFRCxvREFBdUIsR0FBdkIsVUFBd0IsSUFBUyxFQUFFLEtBQW9CO1FBQ25ELFdBQVcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDOUU7SUFFRCw0Q0FBZSxHQUFmLFVBQWdCLElBQVEsRUFBRSxLQUFvQjtRQUE5QyxpQkE0QkM7UUEzQkcsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBOztRQUd2QyxJQUFJLFdBQVcsR0FBd0IsRUFBRSxDQUFDO1FBRTFDLElBQUksS0FBSyxFQUFFO1lBQ1AsV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFhLElBQUssT0FBQSxTQUFTLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEdBQUEsQ0FBQyxDQUFDO1NBQ3JGO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFO2FBQ3hCLElBQUksQ0FBQzs7O1lBR0YsT0FBTyxDQUFDLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFBO1lBQ3ZFLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsVUFBQyxJQUF1QixJQUFLLE9BQUEsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUEsQ0FBaUIsQ0FBQTtTQUMvRyxDQUFDO2FBQ0QsSUFBSSxDQUFDO1lBQ0ZBLGVBQWEsQ0FBQyxhQUFhLENBQUM7Z0JBQ3hCLFNBQVMsRUFBRSxNQUFNO2dCQUNqQixTQUFTLEVBQUUsS0FBSSxDQUFDLGVBQWU7Z0JBQy9CLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDMUIscUJBQXFCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxlQUFlLEdBQUEsQ0FBQzthQUNuRSxDQUFDLENBQUE7U0FDTCxDQUFDO2FBQ0QsS0FBSyxDQUFDLFVBQUMsR0FBRztZQUNQLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEIsQ0FBQyxDQUFBO0tBQ0w7SUFFRCwrQ0FBa0IsR0FBbEI7UUFBQSxpQkFpQkM7UUFoQkcsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLElBQUksRUFBRTs7WUFFL0IsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDNUI7UUFDRCxPQUFPQSxlQUFhLENBQUMsYUFBYSxDQUFDO1lBQy9CLFNBQVMsRUFBRSxRQUFRO1NBQ3RCLENBQUM7YUFDRCxJQUFJLENBQUMsVUFBQyxNQUFhO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQTBDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDekUsS0FBSSxDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUM7OztZQUk5QixTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxDQUFDO1NBRXZCLENBQUMsQ0FBQTtLQUNMO0lBRUQsa0NBQUssR0FBTDs7UUFHSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzs7UUFHbkQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7UUFHdkJBLGVBQWEsQ0FBQyxhQUFhLENBQUM7WUFDeEIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsU0FBUyxFQUFFLElBQUksQ0FBQyxlQUFlO1NBQ2xDLENBQUMsQ0FBQTtLQUNMO0lBQ0wseUJBQUM7Q0FBQSxJQUFBOztBQ25KRCxJQUFJLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRXJELE1BQWMsQ0FBQyxZQUFZLEdBQUc7SUFDM0IsSUFBSSxFQUFFLFVBQVMsSUFBVyxFQUFFLElBQVc7UUFDbkMsWUFBWSxDQUFDLElBQUksQ0FBQztZQUNkLE1BQUEsSUFBSSxFQUFFLE1BQUEsSUFBSTtTQUNiLENBQUMsQ0FBQTtLQUNMO0NBQ0osQ0FBQTs7QUNKRCxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVMsR0FBRztJQUN6QixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3RCLENBQUEifQ==
