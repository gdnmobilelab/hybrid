(function () {
'use strict';

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

// We have one native bridge, but potentially more than one webview-side bridge
// if we use iframes. So we need to set up a quick storage container
// that actually references the top frame
var sharedStorage;
if (window.top !== window && window.top.location.href) {
    // the href check makes sure we're on same-origin
    sharedStorage = window.top.webkit.messageHandlers.hybrid.sharedStorage;
}
else {
    sharedStorage = {};
    window.webkit.messageHandlers.hybrid.sharedStorage = sharedStorage;
}

if (!sharedStorage.connectedItems) {
    sharedStorage.connectedItems = [];
}
var connectedItems = sharedStorage.connectedItems;
var registeredClasses = {};
function registerClass(name, classObj) {
    registeredClasses[name] = classObj;
}
function createItem(item) {
    var classToCreate = registeredClasses[item.jsClassName];
    if (!classToCreate) {
        throw new Error("Tried to create an instance of class " + item.jsClassName + " but it wasn't registered");
    }
    if (connectedItems[item.index]) {
        throw new Error("Item already exists at index #" + item.index);
    }
    var newInstance = new classToCreate(item.index, item.initialData);
    connectedItems[item.index] = newInstance;
    return newInstance;
}
function getExistingItem(item) {
    var existingItem = connectedItems[item.index];
    if (!existingItem) {
        throw new Error("Item does not exist at index #" + item.index);
    }
    return existingItem;
}
function processSerializedItem(item) {
    if (item.existing === true) {
        return getExistingItem(item);
    }
    else {
        return createItem(item);
    }
}
function getIndexOfItem(item) {
    return connectedItems.indexOf(item);
}

function deserializeValue(asValue) {
    if (asValue.value instanceof Array) {
        return asValue.value.map(deserialize);
    }
    else if (Object(asValue.value) === asValue.value) {
        var newObj = {};
        for (var key in asValue.value) {
            var serializedValue = deserialize(asValue.value[key]);
            newObj[key] = serializedValue;
        }
        return newObj;
    }
    else if (typeof asValue.value === "string" || typeof asValue.value === "number" || typeof asValue.value === "boolean" || asValue.value === null) {
        return asValue.value;
    }
}
function deserialize(serializedObject) {
    if (serializedObject == null) {
        return null;
    }
    if (serializedObject.type === "value") {
        return deserializeValue(serializedObject);
    }
    else if (serializedObject.type === "connected-item") {
        return processSerializedItem(serializedObject);
    }
    else {
        throw new Error("Did not know how to deserialize this");
    }
}

var storedReturnPromises = [];
var ReceiveFromNativeEvent = (function () {
    function ReceiveFromNativeEvent(type, data) {
        this.storedPromiseId = -1;
        this.type = type;
        this.data = data;
    }
    ReceiveFromNativeEvent.prototype.respondWith = function (promise) {
        if (this.storedPromiseId !== -1) {
            throw new Error("respondWith has already been called");
        }
        var vacantStoreId = 0;
        while (storedReturnPromises[vacantStoreId]) {
            vacantStoreId++;
        }
        storedReturnPromises[vacantStoreId] = promise;
        this.storedPromiseId = vacantStoreId;
    };
    Object.defineProperty(ReceiveFromNativeEvent.prototype, "metadata", {
        get: function () {
            if (this.storedPromiseId === -1) {
                return {
                    type: 'null'
                };
            }
            else {
                return {
                    type: 'promise',
                    promiseId: this.storedPromiseId
                };
            }
        },
        enumerable: true,
        configurable: true
    });
    return ReceiveFromNativeEvent;
}());

if (!sharedStorage.storedResolves) {
    console.info("create new shared store");
    sharedStorage.storedResolves = {};
}
var storedResolves = sharedStorage.storedResolves;
var DispatchToNativeEvent = (function () {
    function DispatchToNativeEvent(type, data, targetItemId) {
        if (targetItemId === void 0) { targetItemId = null; }
        this.storedResolveId = -1;
        this.type = type;
        this.data = data;
        this.targetItemId = targetItemId;
    }
    // Dispatch this event to the native environment, and wait
    // for a response
    DispatchToNativeEvent.prototype.dispatchAndResolve = function () {
        var _this = this;
        return new Promise(function (fulfill, reject) {
            var vacantResolveId = 0;
            while (storedResolves[vacantResolveId]) {
                vacantResolveId++;
            }
            storedResolves[vacantResolveId] = { fulfill, reject };
            console.log('stored resolves', storedResolves);
            _this.storedResolveId = vacantResolveId;
            console.info("Sending event to native with targetId", _this.targetItemId, "and promiseId", _this.storedResolveId);
            sendToNative({
                command: _this.type,
                data: _this.data,
                storedResolveId: _this.storedResolveId,
                targetItemId: _this.targetItemId
            });
        });
    };
    DispatchToNativeEvent.resolvePromise = function (promiseId, data, error) {
        console.info("Resolving promise #", promiseId, storedResolves);
        var _a = storedResolves[promiseId], fulfill = _a.fulfill, reject = _a.reject;
        if (error) {
            reject(new Error(error));
        }
        else {
            fulfill(data);
        }
        // storedResolves[promiseId] = null;
    };
    return DispatchToNativeEvent;
}());

var windowTarget = window;
if (window.top !== window && window.top.location.href) {
    // href check makes sure we have same-origin permissions. If we don't
    // we're kind of screwed.
    console.info("We appear to be running inside a frame, referencing the parent handler.");
    windowTarget = window.top;
}
var hybridHandler = (windowTarget).webkit.messageHandlers.hybrid;
if (window.top === window) {
    hybridHandler.receiveCommand = deserializeAndRunCommand;
}
function sendToNative(data) {
    // if (window.top !== window) {
    //     let frameIndex = -1;
    //     let frames:any = window.top.frames;
    //     while (frameIndex < frames.length - 1) {
    //         if (frames[frameIndex] === window) {
    //             break;
    //         }
    //         frameIndex++;
    //     }
    //     if (frameIndex === -1) {
    //         throw new Error("Could not find this window in the frames array");
    //     }
    //     data = {
    //         command: 'frameinstruction',
    //         frameIndex: frameIndex,
    //         data: data
    //     }
    // }
    hybridHandler.postMessage(data);
}
function runCommand(instruction) {
    console.log("Running command", instruction);
    if (instruction.commandName === "resolvepromise") {
        // When a DispatchToNativeEvent dispatches, it sends alone a numeric ID for the
        // promise that is awaiting resolving/rejecting. The native handler either waits
        // for a native promise to resolve or immediately resolves this promise via the
        // resolvepromise command.
        var asResolve = instruction;
        console.info("Received promis resolve with ID", asResolve.promiseId);
        DispatchToNativeEvent.resolvePromise(asResolve.promiseId, asResolve.data, asResolve.error);
    }
    if (instruction.commandName === "itemevent") {
        var itemEvent = instruction;
        var deserializedItem = itemEvent.target;
        var deserializedData = deserialize(itemEvent.data);
        var event = new ReceiveFromNativeEvent(itemEvent.eventName, deserializedData);
        console.info("Dispatching event " + itemEvent.eventName + " in", deserializedItem);
        deserializedItem.nativeEvents.emit(itemEvent.eventName, event);
        return event.metadata;
    }
    else if (instruction.commandName === "registerItem") {
        var registerCommand = instruction;
        var target_1 = window;
        registerCommand.path.forEach(function (key) {
            // Go through the path keys, grabbing the correct target object
            target_1 = target_1[key];
        });
        console.info("Registering", registerCommand.item, "as " + registerCommand.name + " on", target_1);
        target_1[registerCommand.name] = registerCommand.item;
    }
}
function deserializeAndRunCommand(command) {
    var instruction = deserialize(command);
    return runCommand(instruction);
}

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
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
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

var NativeItemProxy = (function () {
    function NativeItemProxy() {
        this.nativeEvents = new EventEmitter();
    }
    NativeItemProxy.prototype.sendToNative = function (name, data) {
        if (data === void 0) { data = null; }
        var id = getIndexOfItem(this);
        if (id === -1) {
            throw new Error("Trying to send to native but we're not registered. Are you doing this in the constructor? Don't.");
        }
        var nativeEvent = { name, data };
        var ev = new DispatchToNativeEvent("sendtoitem", nativeEvent, id);
        return ev.dispatchAndResolve();
    };
    return NativeItemProxy;
}());

var ServiceWorkerContainer = (function (_super) {
    __extends(ServiceWorkerContainer, _super);
    function ServiceWorkerContainer() {
        _super.call(this);
        // this.nativeEvents.on('test', (e:ReceiveFromNativeEvent) => {
        //     console.log("it worked?")
        //     // e.respondWith(
        //     //     Promise.resolve('test')
        //     // )
        // })
        // setTimeout(() => {
        //     this.sendToNative("test", {one: "two"})
        //     .then((response) => {
        //         console.log('promise response', response);
        //     })
        // }, 100)
    }
    ServiceWorkerContainer.prototype.register = function (url, options) {
        if (options === void 0) { options = {}; }
        return this.sendToNative("register", [url, options]);
    };
    ServiceWorkerContainer.prototype.getRegistrations = function () {
        return this.sendToNative("getRegistrations");
    };
    return ServiceWorkerContainer;
}(NativeItemProxy));
registerClass("ServiceWorkerContainer", ServiceWorkerContainer);

// import './navigator/service-worker';
// import './console';
// import './messages/message-channel';
// import './util/generic-events';
// import './notification/notification';
// import './util/set-document-html';
// import './load-handler';
if (__hybridRegisterCommands) {
    var parsedCommands = deserialize(__hybridRegisterCommands);
    console.info("Found " + parsedCommands.length + " register commands on load.");
    parsedCommands.forEach(runCommand);
    __hybridRegisterCommands = undefined;
}
window.shimDidLoad = true;

}());