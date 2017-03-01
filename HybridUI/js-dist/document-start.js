(function () {
'use strict';


        if (window.top.webkit.messageHandlers.hybrid.bridge) {
            return window.top.webkit.messageHandlers.hybrid.bridge.attachToWindow(window);
        }
    
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

var connectedItems = {};
var registeredClasses = {};
function manuallyAddItem(index, item) {
    console.info("Manually adding instance of " + item.constructor.name + " at index " + index);
    connectedItems[index] = item;
}
function registerClass(name, classObj) {
    console.info("Registering " + name + " as a native proxy class");
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
    // Our custom item declaration isn't made of serialized values in the same way other stuff is.
    // However, the initialData argument *is*, since we don't know what will be passed in.
    var initialData = deserialize(item.initialData);
    // Creating a new instance via apply:
    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    // first argument is ignored
    initialData.unshift(null);
    var newInstance = new (Function.prototype.bind.apply(classToCreate, initialData));
    connectedItems[item.index] = newInstance;
    console.info("Created an instance of " + item.jsClassName + " at index #" + item.index);
    return newInstance;
}
function getExistingItem(item) {
    var existingItem = connectedItems[item.index];
    if (!existingItem) {
        console.error(connectedItems);
        throw new Error(("Item of type " + item.jsClassName + " does not exist at index #") + item.index);
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
    for (var key in connectedItems) {
        if (connectedItems[key] === item) {
            return parseInt(key, 10);
        }
    }
    return -1;
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
    else {
        throw new Error("Could not deserialize this value");
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
        this.emitJSEvent = this.emitJSEvent.bind(this);
    }
    NativeItemProxy.prototype.emitJSEvent = function (name, data, waitForPromiseReturn) {
        var _this = this;
        if (data === void 0) { data = null; }
        if (waitForPromiseReturn === void 0) { waitForPromiseReturn = true; }
        return Promise.resolve()
            .then(function () {
            var cmd = {
                commandName: "itemevent",
                target: _this,
                eventName: name,
                data: data
            };
            var dispatchEvent = new DispatchToNativeEvent("sendtoitem", cmd);
            // notNativeConsole.info(`Dispatching "${name}" event into native environment...`)
            if (waitForPromiseReturn) {
                return dispatchEvent.dispatchAndResolve();
            }
            else {
                dispatchEvent.dispatch();
                return Promise.resolve();
            }
        });
    };
    return NativeItemProxy;
}());
var NativeItemProxyWithEvents = (function (_super) {
    __extends(NativeItemProxyWithEvents, _super);
    function NativeItemProxyWithEvents() {
        _super.apply(this, arguments);
        this.events = new EventEmitter();
    }
    NativeItemProxyWithEvents.prototype.addEventListener = function (name, listener) {
        this.events.on(name, listener);
    };
    NativeItemProxyWithEvents.prototype.removeEventListener = function (name, listener) {
        this.events.off(name, listener);
    };
    NativeItemProxyWithEvents.prototype.dispatchEvent = function (ev) {
        this.events.emit(ev.type, ev);
    };
    return NativeItemProxyWithEvents;
}(NativeItemProxy));

function makeSuitable(val) {
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
}
;
var levels = ['debug', 'info', 'log', 'error', 'warn'];
var notNativeConsole = {};
levels.forEach(function (level) {
    notNativeConsole[level] = console[level].bind(console);
});
var ConsoleInterceptor = (function (_super) {
    __extends(ConsoleInterceptor, _super);
    function ConsoleInterceptor(targetConsole) {
        var _this = this;
        _super.call(this);
        targetConsole.doNotEmitToNative = {};
        levels.forEach(function (level) {
            notNativeConsole[level] = targetConsole[level].bind(targetConsole);
            _this.createInterceptor(targetConsole, level);
        });
    }
    ConsoleInterceptor.prototype.getArgumentsForNativeConstructor = function () {
        return [];
    };
    ConsoleInterceptor.prototype.createInterceptor = function (obj, key) {
        var originalLog = obj[key];
        var self = this;
        // We use this to stop forming infinite loops
        obj.doNotEmitToNative[key] = obj[key].bind(obj);
        obj[key] = function () {
            originalLog.apply(obj, arguments);
            var suitableArguments = [].slice.call(arguments).map(makeSuitable);
            self.emitJSEvent(key, suitableArguments, false);
        };
    };
    return ConsoleInterceptor;
}(NativeItemProxy));

// If a proxy creation is already happening, we want to wait until
// it is complete before we run another, or we run into the danger
// of running the same operation twice.
var nativeProxyCreationCurrentlyHappening = Promise.resolve();
function serialize(obj) {
    if (obj === null) {
        return Promise.resolve(null);
    }
    else if (obj instanceof NativeItemProxy) {
        // is a native object
        var asNative_1 = obj;
        var name_1 = asNative_1.constructor.name;
        return nativeProxyCreationCurrentlyHappening
            .then(function () {
            var itemIndex = getIndexOfItem(obj);
            var retObj = {
                type: 'connected-item',
                existing: itemIndex > -1,
                jsClassName: name_1
            };
            if (itemIndex === -1) {
                notNativeConsole.warn("Found new " + name_1 + " when serializing, manually creating link...");
                retObj.initialData = asNative_1.getArgumentsForNativeConstructor();
                var ev = new DispatchToNativeEvent("connectproxyitem", retObj);
                // Not we set the waiting promise to be our new operation, to pause
                // all others.
                nativeProxyCreationCurrentlyHappening = ev.dispatchAndResolve();
                return nativeProxyCreationCurrentlyHappening.then(function (newIndex) {
                    retObj.index = newIndex;
                    retObj.existing = true;
                    manuallyAddItem(newIndex, asNative_1);
                    return retObj;
                });
            }
            else {
                retObj.index = itemIndex;
                return Promise.resolve(retObj);
            }
        });
    }
    else if (obj instanceof Array) {
        var serializePromises = obj.map(function (o) { return serialize(o); });
        return Promise.all(serializePromises)
            .then(function (serialized) {
            return {
                type: 'value',
                value: serialized
            };
        });
    }
    else if (Object(obj) === obj) {
        var keys_1 = Object.keys(obj);
        var serializePromises = keys_1.map(function (k) { return serialize(obj[k]); });
        return Promise.all(serializePromises)
            .then(function (serialized) {
            var newObj = {};
            keys_1.forEach(function (key, idx) {
                newObj[key] = serialized[idx];
            });
            return {
                type: 'value',
                value: newObj
            };
        });
    }
    else if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean" || obj === null) {
        return Promise.resolve({
            type: 'value',
            value: obj
        });
    }
    else {
        return Promise.reject(new Error("Do not know how to serialize this item"));
    }
}

var ServiceWorkerContainer = (function (_super) {
    __extends(ServiceWorkerContainer, _super);
    function ServiceWorkerContainer(targetWindow) {
        var _this = this;
        _super.call(this);
        this.targetWindow = targetWindow;
        // This doesn't actually do anything except serialize the container and
        // send it over to the native side. If we don't do that, the native version
        // never gets created, so never looks for workers etc.
        this.emitJSEvent("init");
        this.nativeEvents.on('newcontroller', this.receiveNewController.bind(this));
        // Create our ready promise, and set a listener that'll fulfill the promise
        // when we receive a new active registration.
        this.ready = new Promise(function (fulfill, reject) {
            _this.nativeEvents.once('newactiveregistration', function (ev) {
                console.log('FIRED READY EVENT');
                var reg = ev.data;
                try {
                    fulfill(reg);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        this.addEventListener('controllerchange', function (ev) {
            if (this.oncontrollerchange instanceof Function) {
                this.oncontrollerchange(ev);
            }
        }.bind(this));
    }
    ServiceWorkerContainer.prototype.receiveNewController = function (ev) {
        var newController = ev.data;
        this.controller = newController;
        this.dispatchEvent({
            type: "controllerchange",
            target: this
        });
    };
    ServiceWorkerContainer.prototype.getArgumentsForNativeConstructor = function () {
        var frameType = window.top === window ? 'top-level' : 'nested';
        return [this.targetWindow.location.href, frameType];
    };
    ServiceWorkerContainer.prototype.register = function (url, options) {
        if (options === void 0) { options = {}; }
        return this.emitJSEvent("register", [url, options]);
    };
    ServiceWorkerContainer.prototype.getRegistrations = function () {
        return this.emitJSEvent("getRegistrations");
    };
    return ServiceWorkerContainer;
}(NativeItemProxyWithEvents));
registerClass("ServiceWorkerContainer", ServiceWorkerContainer);

var ServiceWorkerRegistration = (function (_super) {
    __extends(ServiceWorkerRegistration, _super);
    function ServiceWorkerRegistration(scope) {
        _super.call(this);
        this.scope = scope;
        this.nativeEvents.on('statechange', this.setWorkerState.bind(this));
    }
    ServiceWorkerRegistration.prototype.setWorkerState = function (ev) {
        var _a = ev.data, property = _a.property, worker = _a.worker;
        if (property === 'installing') {
            this.installing = worker;
        }
        else if (property === 'waiting') {
            this.waiting = worker;
        }
        else if (property === 'activating') {
            this.activating = worker;
        }
        else if (property === 'active') {
            this.active = worker;
        }
        else if (property === 'redundant') {
            this.redundant = worker;
        }
        else {
            throw new Error("Did not understand property " + property);
        }
        console.info("Received worker for state: " + property);
    };
    ServiceWorkerRegistration.prototype.getArgumentsForNativeConstructor = function () {
        return [];
    };
    ServiceWorkerRegistration.prototype.unregister = function () {
        return this.emitJSEvent("unregister", null);
    };
    return ServiceWorkerRegistration;
}(NativeItemProxy));
;
registerClass("ServiceWorkerRegistration", ServiceWorkerRegistration);

var ServiceWorker = (function (_super) {
    __extends(ServiceWorker, _super);
    function ServiceWorker(scriptURL, state) {
        _super.call(this);
        this.onstatechange = undefined;
        this.scriptURL = scriptURL;
        this.state = state;
        this.nativeEvents.on("statechange", this.processStateChange.bind(this));
        this.addEventListener("statechange", this.checkStateChangeObject.bind(this));
    }
    ServiceWorker.prototype.processStateChange = function (ev) {
        var newState = ev.data;
        this.state = newState;
        this.dispatchEvent({
            type: 'statechange',
            target: this
        });
    };
    // If we've manually set the onstatechange variable we need to call it.
    ServiceWorker.prototype.checkStateChangeObject = function (ev) {
        // console.log('statechange?', this.onstatechange, this.onstatechange instanceof Function)
        if (this.onstatechange instanceof Function) {
            console.log("RUNNING FUNCTION");
            this.onstatechange(ev);
        }
    };
    ServiceWorker.prototype.getArgumentsForNativeConstructor = function () {
        throw new Error("Cannot be constructed on JS side");
    };
    return ServiceWorker;
}(NativeItemProxyWithEvents));
registerClass("ServiceWorker", ServiceWorker);

function register(window) {
    window.ServiceWorkerRegistration = ServiceWorkerRegistration;
    window.ServiceWorkerContainer = ServiceWorkerContainer;
    window.ServiceWorker = ServiceWorker;
}

var hybridHandler = window.top.webkit.messageHandlers.hybrid;
var Bridge = (function () {
    function Bridge() {
    }
    Bridge.prototype.attachToWindow = function (window) {
        register(window);
        window.navigator.serviceWorker = new ServiceWorkerContainer(window);
        // new ConsoleInterceptor(console);
    };
    Bridge.prototype.sendToNative = function (data) {
        serialize(data)
            .then(function (serializedData) {
            hybridHandler.postMessage(serializedData);
        })
            .catch(function (err) {
            console.error(err);
        });
    };
    Bridge.prototype.runCommand = function (instruction) {
        if (instruction.commandName === "resolvepromise") {
            // When a DispatchToNativeEvent dispatches, it sends alone a numeric ID for the
            // promise that is awaiting resolving/rejecting. The native handler either waits
            // for a native promise to resolve or immediately resolves this promise via the
            // resolvepromise command.
            var asResolve = instruction;
            DispatchToNativeEvent.resolvePromise(asResolve.promiseId, asResolve.data, asResolve.error);
        }
        if (instruction.commandName === "itemevent") {
            var itemEvent = instruction;
            var deserializedItem = itemEvent.target;
            var deserializedData = itemEvent.eventData;
            var event = new ReceiveFromNativeEvent(itemEvent.eventName, deserializedData);
            // console.info(`Dispatching event ${itemEvent.eventName} in`, deserializedItem);
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
    };
    Bridge.prototype.deserializeAndRunCommand = function (command) {
        var instruction = deserialize(command);
        return this.runCommand(instruction);
    };
    return Bridge;
}());
var bridge = new Bridge();
hybridHandler.bridge = bridge;
hybridHandler.receiveCommand = bridge.deserializeAndRunCommand.bind(bridge);

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

if (!sharedStorage.storedResolves) {
    sharedStorage.storedResolves = {};
}
var storedResolves = sharedStorage.storedResolves;
var DispatchToNativeEvent = (function () {
    function DispatchToNativeEvent(type, data) {
        if (data === void 0) { data = null; }
        this.storedResolveId = -1;
        this.type = type;
        this.data = data;
    }
    DispatchToNativeEvent.prototype.dispatch = function () {
        // notNativeConsole.info(`Dispatching command ${this.type} to native...`, this.data)
        bridge.sendToNative({
            command: this.type,
            data: this.data,
            storedResolveId: this.storedResolveId
        });
    };
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
            _this.storedResolveId = vacantResolveId;
            _this.dispatch();
        });
    };
    DispatchToNativeEvent.resolvePromise = function (promiseId, data, error) {
        var _a = storedResolves[promiseId], fulfill = _a.fulfill, reject = _a.reject;
        if (error) {
            reject(new Error(error));
        }
        else {
            fulfill(data);
        }
        storedResolves[promiseId] = null;
    };
    return DispatchToNativeEvent;
}());

// import { ConsoleInterceptor } from './global/console';
console.warn("Clearing bridge items on native side");
new DispatchToNativeEvent("clearbridgeitems").dispatchAndResolve();
window.top.webkit.messageHandlers.hybrid.bridge = bridge;
bridge.attachToWindow(window);
// import './register-to-window';
// If this is a page reload, we might still have bridge items cached
// on the native side. Just to be sure, clear them out.
// bridge.attachToWindow(window);
// (window as any).shimDidLoad = true;
// export default bridge;

}());