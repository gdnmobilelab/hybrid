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
    PromiseOverWKMessage.prototype.emitWithResponse = function (name, args, callbackIndex) {
        // Allows us to emit events with callbacks
        var _this = this;
        var respondValue = null;
        var respondWith = function (p) {
            respondValue = p;
        };
        var eventData = {
            respondWith: respondWith,
            arguments: args
        };
        this.emit(name, eventData);
        Promise.resolve(respondValue)
            .then(function (finalResponse) {
            console.log("FULFILL", callbackIndex);
            _this.send({
                callbackResponseIndex: callbackIndex,
                fulfillValue: finalResponse
            });
        })
            .catch(function (err) {
            console.log("CATCH", callbackIndex);
            _this.send({
                callbackResponseIndex: callbackIndex,
                rejectValue: err.toString()
            });
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

var punycode = createCommonjsModule(function (module, exports) {
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(commonjsGlobal));
});

var punycode$1 = interopDefault(punycode);


var require$$2 = Object.freeze({
	default: punycode$1
});

var util = createCommonjsModule(function (module) {
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};
});

var util$1 = interopDefault(util);
var isString = util.isString;
var isObject = util.isObject;
var isNull = util.isNull;
var isNullOrUndefined = util.isNullOrUndefined;

var require$$1 = Object.freeze({
  default: util$1,
  isString: isString,
  isObject: isObject,
  isNull: isNull,
  isNullOrUndefined: isNullOrUndefined
});

var decode$1 = createCommonjsModule(function (module) {
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

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};
});

var decode$2 = interopDefault(decode$1);


var require$$1$1 = Object.freeze({
  default: decode$2
});

var encode$1 = createCommonjsModule(function (module) {
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

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).map(function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (Array.isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};
});

var encode$2 = interopDefault(encode$1);


var require$$0$1 = Object.freeze({
  default: encode$2
});

var index$1 = createCommonjsModule(function (module, exports) {
'use strict';

exports.decode = exports.parse = interopDefault(require$$1$1);
exports.encode = exports.stringify = interopDefault(require$$0$1);
});

var index$2 = interopDefault(index$1);
var encode = index$1.encode;
var stringify = index$1.stringify;
var decode = index$1.decode;
var parse$1 = index$1.parse;

var require$$0 = Object.freeze({
	default: index$2,
	encode: encode,
	stringify: stringify,
	decode: decode,
	parse: parse$1
});

var url = createCommonjsModule(function (module, exports) {
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

'use strict';

var punycode = interopDefault(require$$2);
var util = interopDefault(require$$1);

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = interopDefault(require$$0);

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  var this$1 = this;

  if (!util.isString(url)) {
    console.log("URL IS", url)
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this$1.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  var this$1 = this;

  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this$1[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};
});

interopDefault(url);
var Url = url.Url;
var format = url.format;
var resolveObject = url.resolveObject;
var resolve = url.resolve;
var parse = url.parse;

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
        var _this = this;
        _super.call(this);
        this._id = id;
        this.scriptURL = scriptURL;
        this.scope = scope;
        this.installState = state;
        this.addListener("message", function (e) {
            if (_this.onmessage) {
                _this.onmessage(e);
            }
        });
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
        this.addListener("message", function (e) {
            console.log("FIRED MESSAGE", _this.onmessage);
            if (_this.controller) {
                _this.controller.dispatchEvent(e);
            }
            if (_this.onmessage) {
                _this.onmessage(e);
            }
        });
        this.controller = RegistrationInstance.active;
    }
    Object.defineProperty(HybridServiceWorkerContainer.prototype, "ready", {
        get: function () {
            var _this = this;
            if (this.controller) {
                console.info("ServiceWorker ready returning immediately with activated instance");
                return Promise.resolve(RegistrationInstance);
            }
            return new Promise(function (fulfill, reject) {
                console.info("ServiceWorker ready returning promise and waiting...");
                _this.once("controllerchange", function () {
                    console.debug("ServiceWorker ready received response");
                    fulfill(RegistrationInstance);
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    HybridServiceWorkerContainer.prototype.register = function (urlToRegister, options) {
        var fullSWURL = resolve(window.location.href, urlToRegister);
        console.info("Attempting to register service worker at", fullSWURL);
        return serviceWorkerBridge.bridgePromise({
            operation: "register",
            swPath: fullSWURL,
            scope: options ? options.scope : null
        })
            .then(function (response) {
            var worker = processNewWorkerMatch(response);
            return RegistrationInstance;
        })
            .catch(function (err) {
            console.error(err);
            return null;
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
}(EventEmitterToJSEvent));
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
function refreshServiceWorkers() {
    serviceWorkerBridge.bridgePromise({
        operation: "getAll"
    }).then(function (workers) {
        workers.forEach(function (worker) {
            serviceWorkerRecords[worker.instanceId] = new HybridServiceWorker(worker.instanceId, worker.url, "", worker.installState);
            RegistrationInstance.assignAccordingToInstallState(serviceWorkerRecords[worker.instanceId]);
        });
    });
}
refreshServiceWorkers();

serviceWorkerBridge.on("postMessage", function (e) {
    var message = e.arguments[0];
    var numberOfPorts = e.arguments[1];
    // We can't send MessagePorts across the bridge, so instead we create new
    // MessageChannels, listen for responses, then stringify and return them.
    var channels = [];
    var channelResponses = [];
    var _loop_1 = function(i) {
        var channel = new MessageChannel();
        channelResponses[i] = null;
        channel.port2.onmessage = function (msg) {
            console.log("RECEIVED PORT WRITE", i, msg.data);
            channelResponses[i] = msg.data;
        };
        channels.push(channel);
    };
    for (var i = 0; i < numberOfPorts; i++) {
        _loop_1(i);
    }
    var portsToSend = channels.map(function (c) { return c.port1; });
    var ev = new MessageEvent("message", {
        data: message,
        ports: portsToSend
    });
    var promiseToResolve = null;
    ev.waitUntil = function (promise) {
        promiseToResolve = promise;
    };
    ServiceWorkerContainer.dispatchEvent(ev);
    e.respondWith(Promise.resolve(promiseToResolve)
        .then(function () {
        return new Promise(function (fulfill, reject) {
            // We have to use a timeout because MessagePorts do not appear
            // to fire onmessage synchronously. But a 1ms timeout seems
            // to catch it.
            setTimeout(function () {
                fulfill(channelResponses.map(function (r) { return JSON.stringify(r); }));
            }, 1);
        });
    }));
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

var promiseBridge$2 = new PromiseOverWKMessage("notifications");

var notification = {
    permission: "unknown",
    requestPermission: function (callback) {
        return promiseBridge$2.bridgePromise({
            operation: "requestPermission"
        })
            .then(function (newStatus) {
            // Support deprecated callback method
            if (callback) {
                callback(newStatus);
            }
            return newStatus;
        });
    }
};
promiseBridge$2.bridgePromise({
    operation: "getStatus"
})
    .then(function (status) {
    // console.debug("Notification permission:", status)
    notification.permission = status;
});
promiseBridge$2.on("notification-permission-change", function (newStatus) {
    // console.debug("Received updated notification permission:" + newStatus);
    notification.permission = status;
});
window.Notification = notification;

var loadedIndicator = null;
window.__setHTML = function (htmlString, baseURL) {
    var insideHTMLTag = /<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(htmlString)[1];
    history.replaceState(null, null, baseURL);
    refreshServiceWorkers();
    document.documentElement.innerHTML = insideHTMLTag;
    // we use this on the native side to detect somewhat reliably when a page has loaded
    loadedIndicator = document.createElement("div");
    loadedIndicator.style.position = "absolute";
    loadedIndicator.style.right = "0px";
    loadedIndicator.style.top = "0px";
    loadedIndicator.style.width = "1px";
    loadedIndicator.style.height = "1px";
    loadedIndicator.style.backgroundColor = "rgb(0,255,255)";
    document.body.appendChild(loadedIndicator);
};
window.__removeLoadedIndicator = function () {
    document.body.removeChild(loadedIndicator);
};

window.onerror = function (err) {
    console.error(err);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvbm9kZV9tb2R1bGVzL3B1bnljb2RlL3B1bnljb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXRpbC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmcvZGVjb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy9lbmNvZGUuanMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXJsLmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL3BvcnQtc3RvcmUudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3Byb21pc2UtdG9vbHMvbGliL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbC50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc3ctbWFuYWdlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3IvcmVjZWl2ZS1tZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9jb25zb2xlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L3V0aWwvZ2VuZXJpYy1ldmVudHMudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbm90aWZpY2F0aW9uL25vdGlmaWNhdGlvbi1icmlkZ2UudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvbm90aWZpY2F0aW9uL25vdGlmaWNhdGlvbi50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL3NldC1kb2N1bWVudC1odG1sLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L2RvY3VtZW50LXN0YXJ0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vXG4vLyBXZSBzdG9yZSBvdXIgRUUgb2JqZWN0cyBpbiBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBgfmAgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Qgb3ZlcnJpZGRlbiBvclxuLy8gdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy8gV2UgYWxzbyBhc3N1bWUgdGhhdCBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgYXZhaWxhYmxlIHdoZW4gdGhlIGV2ZW50IG5hbWVcbi8vIGlzIGFuIEVTNiBTeW1ib2wuXG4vL1xudmFyIHByZWZpeCA9IHR5cGVvZiBPYmplY3QuY3JlYXRlICE9PSAnZnVuY3Rpb24nID8gJ34nIDogZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgRXZlbnRFbWl0dGVyIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEV2ZW50IGhhbmRsZXIgdG8gYmUgY2FsbGVkLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBDb250ZXh0IGZvciBmdW5jdGlvbiBleGVjdXRpb24uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGQgdGhlIGFzc2lnbmVkIEV2ZW50RW1pdHRlcnMgYnkgbmFtZS5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1xuICAgICwgbmFtZXMgPSBbXVxuICAgICwgbmFtZTtcblxuICBpZiAoIWV2ZW50cykgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiBldmVudHMpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbGlzdCBvZiBhc3NpZ25lZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudHMgdGhhdCBzaG91bGQgYmUgbGlzdGVkLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgV2Ugb25seSBuZWVkIHRvIGtub3cgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgbGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3ZSB3YW50IHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciB0aGF0IHdlIG5lZWQgdG8gZmluZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgbGlzdGVuZXJzIG1hdGNoaW5nIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmNlIGxpc3RlbmVycy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGV2ZW50cyA9IFtdO1xuXG4gIGlmIChmbikge1xuICAgIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVycy5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICB9IGVsc2Uge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBvciBvbmx5IHRoZSBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBldmVudCB3YW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcblxuICBpZiAoZXZlbnQpIGRlbGV0ZSB0aGlzLl9ldmVudHNbcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudF07XG4gIGVsc2UgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufVxuIiwiaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcbmNvbnN0IHdlYmtpdCA9ICh3aW5kb3cgYXMgYW55KS53ZWJraXQ7XG5cbi8vIFdlIG5lZWQgdGhlc2UgY2FsbGJhY2tzIHRvIGJlIGdsb2JhbGx5IGFjY2Vzc2libGUuXG5jb25zdCBwcm9taXNlQ2FsbGJhY2tzOiB7W2tleTpzdHJpbmddOiBGdW5jdGlvbn0gPSB7fTtcbmNvbnN0IHByb21pc2VCcmlkZ2VzOiB7W2tleTpzdHJpbmddOiBQcm9taXNlT3ZlcldLTWVzc2FnZX0gPSB7fTtcbih3aW5kb3cgYXMgYW55KS5fX3Byb21pc2VCcmlkZ2VDYWxsYmFja3MgPSBwcm9taXNlQ2FsbGJhY2tzO1xuKHdpbmRvdyBhcyBhbnkpLl9fcHJvbWlzZUJyaWRnZXMgPSBwcm9taXNlQnJpZGdlcztcblxuZXhwb3J0IGNsYXNzIFByb21pc2VPdmVyV0tNZXNzYWdlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgIHByaXZhdGUgY2FsbGJhY2tBcnJheTpbRnVuY3Rpb24sIEZ1bmN0aW9uXVtdID0gW11cbiAgICBwcml2YXRlIG5hbWU6c3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTpzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICBpZiAoIXdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTWVzc2FnZSBoYW5kbGVyIFwiJHtuYW1lfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAod2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1tuYW1lXS5fcmVjZWl2ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm9taXNlIGJyaWRnZSBmb3IgXCIke25hbWV9XCIgYWxyZWFkeSBleGlzdHNcImApXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHByb21pc2VDYWxsYmFja3NbbmFtZV0gPSB0aGlzLnJlY2VpdmVSZXNwb25zZS5iaW5kKHRoaXMpO1xuICAgICAgICBwcm9taXNlQnJpZGdlc1tuYW1lXSA9IHRoaXM7XG4gICAgfVxuXG4gICAgYnJpZGdlUHJvbWlzZShtZXNzYWdlOmFueSkge1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIG5leHQgYXZhaWxhYmxlIHNsb3QgaW4gb3VyIGNhbGxiYWNrIGFycmF5XG5cbiAgICAgICAgbGV0IGNhbGxiYWNrSW5kZXggPSAwO1xuICAgICAgICB3aGlsZSAodGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdKSB7XG4gICAgICAgICAgICBjYWxsYmFja0luZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChmdWxmaWxsLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gTm93IGluc2VydCBvdXIgY2FsbGJhY2sgaW50byB0aGUgY2FjaGVkIGFycmF5LlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSBbZnVsZmlsbCwgcmVqZWN0XTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZW5kaW5nXCIsIHtjYWxsYmFja0luZGV4LCBtZXNzYWdlfSlcbiAgICAgICAgICAgIHdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbdGhpcy5uYW1lXS5wb3N0TWVzc2FnZSh7Y2FsbGJhY2tJbmRleCwgbWVzc2FnZX0pO1xuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBlbWl0V2l0aFJlc3BvbnNlKG5hbWU6c3RyaW5nLCBhcmdzOnN0cmluZ1tdLCBjYWxsYmFja0luZGV4Om51bWJlcikge1xuXG4gICAgICAgIC8vIEFsbG93cyB1cyB0byBlbWl0IGV2ZW50cyB3aXRoIGNhbGxiYWNrc1xuXG4gICAgICAgIGxldCByZXNwb25kVmFsdWU6UHJvbWlzZTxhbnk+ID0gbnVsbFxuXG4gICAgICAgIGxldCByZXNwb25kV2l0aCA9IGZ1bmN0aW9uKHA6YW55KSB7XG4gICAgICAgICAgICByZXNwb25kVmFsdWUgPSBwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgIHJlc3BvbmRXaXRoLFxuICAgICAgICAgICAgYXJndW1lbnRzOiBhcmdzXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVtaXQobmFtZSwgZXZlbnREYXRhKTtcblxuICAgICAgICBQcm9taXNlLnJlc29sdmUocmVzcG9uZFZhbHVlKVxuICAgICAgICAudGhlbigoZmluYWxSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGVUxGSUxMXCIsIGNhbGxiYWNrSW5kZXgpXG4gICAgICAgICAgICB0aGlzLnNlbmQoe1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrUmVzcG9uc2VJbmRleDogY2FsbGJhY2tJbmRleCxcbiAgICAgICAgICAgICAgICBmdWxmaWxsVmFsdWU6IGZpbmFsUmVzcG9uc2VcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNBVENIXCIsIGNhbGxiYWNrSW5kZXgpXG4gICAgICAgICAgICB0aGlzLnNlbmQoe1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrUmVzcG9uc2VJbmRleDogY2FsbGJhY2tJbmRleCxcbiAgICAgICAgICAgICAgICByZWplY3RWYWx1ZTogZXJyLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgc2VuZChtZXNzYWdlOmFueSkge1xuICAgICAgICBcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB3ZSBvbmx5IHdhbnQgdG8gc2VuZCBhbmQgYXJlIG5vdCBleHBlY3RpbmcgYSByZXNwb25zZVxuICAgICAgICB3ZWJraXQubWVzc2FnZUhhbmRsZXJzW3RoaXMubmFtZV0ucG9zdE1lc3NhZ2Uoe21lc3NhZ2V9KTtcbiAgICB9XG5cbiAgICByZWNlaXZlUmVzcG9uc2UoY2FsbGJhY2tJbmRleDpudW1iZXIsIGVycjpzdHJpbmcsIHJlc3BvbnNlOiBhbnkpIHtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdGhpc0NhbGxiYWNrID0gdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXRoaXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHVzZSBhIGNhbGxiYWNrIHRoYXQgZGlkbid0IGV4aXN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmcmVlIHVwIHRoaXMgc2xvdCBmb3IgbmV4dCBvcGVyYXRpb25cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IG51bGw7XG5cbiAgICAgICAgICAgIGxldCBbZnVsZmlsbCwgcmVqZWN0XSA9IHRoaXNDYWxsYmFjaztcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZ1bGZpbGwocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsIi8qISBodHRwczovL210aHMuYmUvcHVueWNvZGUgdjEuMy4yIGJ5IEBtYXRoaWFzICovXG47KGZ1bmN0aW9uKHJvb3QpIHtcblxuXHQvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGVzICovXG5cdHZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiZcblx0XHQhZXhwb3J0cy5ub2RlVHlwZSAmJiBleHBvcnRzO1xuXHR2YXIgZnJlZU1vZHVsZSA9IHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmXG5cdFx0IW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cdHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWw7XG5cdGlmIChcblx0XHRmcmVlR2xvYmFsLmdsb2JhbCA9PT0gZnJlZUdsb2JhbCB8fFxuXHRcdGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsIHx8XG5cdFx0ZnJlZUdsb2JhbC5zZWxmID09PSBmcmVlR2xvYmFsXG5cdCkge1xuXHRcdHJvb3QgPSBmcmVlR2xvYmFsO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcHVueWNvZGVgIG9iamVjdC5cblx0ICogQG5hbWUgcHVueWNvZGVcblx0ICogQHR5cGUgT2JqZWN0XG5cdCAqL1xuXHR2YXIgcHVueWNvZGUsXG5cblx0LyoqIEhpZ2hlc3QgcG9zaXRpdmUgc2lnbmVkIDMyLWJpdCBmbG9hdCB2YWx1ZSAqL1xuXHRtYXhJbnQgPSAyMTQ3NDgzNjQ3LCAvLyBha2EuIDB4N0ZGRkZGRkYgb3IgMl4zMS0xXG5cblx0LyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuXHRiYXNlID0gMzYsXG5cdHRNaW4gPSAxLFxuXHR0TWF4ID0gMjYsXG5cdHNrZXcgPSAzOCxcblx0ZGFtcCA9IDcwMCxcblx0aW5pdGlhbEJpYXMgPSA3Mixcblx0aW5pdGlhbE4gPSAxMjgsIC8vIDB4ODBcblx0ZGVsaW1pdGVyID0gJy0nLCAvLyAnXFx4MkQnXG5cblx0LyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cblx0cmVnZXhQdW55Y29kZSA9IC9eeG4tLS8sXG5cdHJlZ2V4Tm9uQVNDSUkgPSAvW15cXHgyMC1cXHg3RV0vLCAvLyB1bnByaW50YWJsZSBBU0NJSSBjaGFycyArIG5vbi1BU0NJSSBjaGFyc1xuXHRyZWdleFNlcGFyYXRvcnMgPSAvW1xceDJFXFx1MzAwMlxcdUZGMEVcXHVGRjYxXS9nLCAvLyBSRkMgMzQ5MCBzZXBhcmF0b3JzXG5cblx0LyoqIEVycm9yIG1lc3NhZ2VzICovXG5cdGVycm9ycyA9IHtcblx0XHQnb3ZlcmZsb3cnOiAnT3ZlcmZsb3c6IGlucHV0IG5lZWRzIHdpZGVyIGludGVnZXJzIHRvIHByb2Nlc3MnLFxuXHRcdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdFx0J2ludmFsaWQtaW5wdXQnOiAnSW52YWxpZCBpbnB1dCdcblx0fSxcblxuXHQvKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5cdGJhc2VNaW51c1RNaW4gPSBiYXNlIC0gdE1pbixcblx0Zmxvb3IgPSBNYXRoLmZsb29yLFxuXHRzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxuXG5cdC8qKiBUZW1wb3JhcnkgdmFyaWFibGUgKi9cblx0a2V5O1xuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIGVycm9yIHR5cGUuXG5cdCAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cblx0ICovXG5cdGZ1bmN0aW9uIGVycm9yKHR5cGUpIHtcblx0XHR0aHJvdyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG5cdH1cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuXHQgKiBpdGVtLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXAoYXJyYXksIGZuKSB7XG5cdFx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0XHRyZXN1bHRbbGVuZ3RoXSA9IGZuKGFycmF5W2xlbmd0aF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncyBvciBlbWFpbFxuXHQgKiBhZGRyZXNzZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeVxuXHQgKiBjaGFyYWN0ZXIuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgc3RyaW5nIG9mIGNoYXJhY3RlcnMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrXG5cdCAqIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwRG9tYWluKHN0cmluZywgZm4pIHtcblx0XHR2YXIgcGFydHMgPSBzdHJpbmcuc3BsaXQoJ0AnKTtcblx0XHR2YXIgcmVzdWx0ID0gJyc7XG5cdFx0aWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdC8vIEluIGVtYWlsIGFkZHJlc3Nlcywgb25seSB0aGUgZG9tYWluIG5hbWUgc2hvdWxkIGJlIHB1bnljb2RlZC4gTGVhdmVcblx0XHRcdC8vIHRoZSBsb2NhbCBwYXJ0IChpLmUuIGV2ZXJ5dGhpbmcgdXAgdG8gYEBgKSBpbnRhY3QuXG5cdFx0XHRyZXN1bHQgPSBwYXJ0c1swXSArICdAJztcblx0XHRcdHN0cmluZyA9IHBhcnRzWzFdO1xuXHRcdH1cblx0XHQvLyBBdm9pZCBgc3BsaXQocmVnZXgpYCBmb3IgSUU4IGNvbXBhdGliaWxpdHkuIFNlZSAjMTcuXG5cdFx0c3RyaW5nID0gc3RyaW5nLnJlcGxhY2UocmVnZXhTZXBhcmF0b3JzLCAnXFx4MkUnKTtcblx0XHR2YXIgbGFiZWxzID0gc3RyaW5nLnNwbGl0KCcuJyk7XG5cdFx0dmFyIGVuY29kZWQgPSBtYXAobGFiZWxzLCBmbikuam9pbignLicpO1xuXHRcdHJldHVybiByZXN1bHQgKyBlbmNvZGVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcblx0ICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuXHQgKiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udmVydCBhIHBhaXIgb2Ygc3Vycm9nYXRlIGhhbHZlcyAoZWFjaCBvZiB3aGljaFxuXHQgKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcblx0ICogbWF0Y2hpbmcgVVRGLTE2LlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmVuY29kZWBcblx0ICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGRlY29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgY291bnRlciA9IDAsXG5cdFx0ICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG5cdFx0ICAgIHZhbHVlLFxuXHRcdCAgICBleHRyYTtcblx0XHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKHZhbHVlID49IDB4RDgwMCAmJiB2YWx1ZSA8PSAweERCRkYgJiYgY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gbG93IHN1cnJvZ2F0ZVxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcblx0XHRcdFx0XHQvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0Y291bnRlci0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHN0cmluZyBiYXNlZCBvbiBhbiBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZW5jb2RlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJlbmNvZGUoYXJyYXkpIHtcblx0XHRyZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0dmFyIG91dHB1dCA9ICcnO1xuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XG5cdFx0XHRcdHZhbHVlIC09IDB4MTAwMDA7XG5cdFx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApO1xuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fSkuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuXHQgKiBAc2VlIGBkaWdpdFRvQmFzaWMoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQgKGZvciB1c2UgaW5cblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuXHQgKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGJhc2ljVG9EaWdpdChjb2RlUG9pbnQpIHtcblx0XHRpZiAoY29kZVBvaW50IC0gNDggPCAxMCkge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDIyO1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gNjUgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDY1O1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gOTcgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDk3O1xuXHRcdH1cblx0XHRyZXR1cm4gYmFzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRpZ2l0L2ludGVnZXIgaW50byBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGlnaXQgVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuXHQgKiBgMGAgdG8gYGJhc2UgLSAxYC4gSWYgYGZsYWdgIGlzIG5vbi16ZXJvLCB0aGUgdXBwZXJjYXNlIGZvcm0gaXNcblx0ICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcblx0ICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cblx0ICovXG5cdGZ1bmN0aW9uIGRpZ2l0VG9CYXNpYyhkaWdpdCwgZmxhZykge1xuXHRcdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdFx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdFx0cmV0dXJuIGRpZ2l0ICsgMjIgKyA3NSAqIChkaWdpdCA8IDI2KSAtICgoZmxhZyAhPSAwKSA8PCA1KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuXHQgKiBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG5cdCAqIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG5cdCAqIHRvIFVuaWNvZGUuIE9ubHkgdGhlIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgaW5wdXQgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS5cblx0ICogaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgb24gYSBzdHJpbmcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuXG5cdCAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZWQgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleFB1bnljb2RlLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG5cdCAqIFB1bnljb2RlLiBPbmx5IHRoZSBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLFxuXHQgKiBpLmUuIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW5cblx0ICogQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG8gY29udmVydCwgYXMgYVxuXHQgKiBVbmljb2RlIHN0cmluZy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZSBvclxuXHQgKiBlbWFpbCBhZGRyZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShpbnB1dCkge1xuXHRcdHJldHVybiBtYXBEb21haW4oaW5wdXQsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4Tm9uQVNDSUkudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5cdHB1bnljb2RlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBTdHJpbmdcblx0XHQgKi9cblx0XHQndmVyc2lvbic6ICcxLjMuMicsXG5cdFx0LyoqXG5cdFx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0XHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHRcdCAqIEBzZWUgPGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmIGZyZWVNb2R1bGUpIHtcblx0XHRpZiAobW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMpIHsgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7IC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXG5cdFx0XHRmb3IgKGtleSBpbiBwdW55Y29kZSkge1xuXHRcdFx0XHRwdW55Y29kZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChmcmVlRXhwb3J0c1trZXldID0gcHVueWNvZGVba2V5XSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgeyAvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXNTdHJpbmc6IGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiB0eXBlb2YoYXJnKSA9PT0gJ3N0cmluZyc7XG4gIH0sXG4gIGlzT2JqZWN0OiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbiAgfSxcbiAgaXNOdWxsOiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gYXJnID09PSBudWxsO1xuICB9LFxuICBpc051bGxPclVuZGVmaW5lZDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGFyZyA9PSBudWxsO1xuICB9XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeVByaW1pdGl2ZSA9IGZ1bmN0aW9uKHYpIHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdjtcblxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHYgPyAndHJ1ZScgOiAnZmFsc2UnO1xuXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBpc0Zpbml0ZSh2KSA/IHYgOiAnJztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBzZXAsIGVxLCBuYW1lKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgb2JqID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubWFwKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBrcyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUoaykpICsgZXE7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpba10pKSB7XG4gICAgICAgIHJldHVybiBvYmpba10ubWFwKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHB1bnljb2RlID0gcmVxdWlyZSgncHVueWNvZGUnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbmV4cG9ydHMucGFyc2UgPSB1cmxQYXJzZTtcbmV4cG9ydHMucmVzb2x2ZSA9IHVybFJlc29sdmU7XG5leHBvcnRzLnJlc29sdmVPYmplY3QgPSB1cmxSZXNvbHZlT2JqZWN0O1xuZXhwb3J0cy5mb3JtYXQgPSB1cmxGb3JtYXQ7XG5cbmV4cG9ydHMuVXJsID0gVXJsO1xuXG5mdW5jdGlvbiBVcmwoKSB7XG4gIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICB0aGlzLnNsYXNoZXMgPSBudWxsO1xuICB0aGlzLmF1dGggPSBudWxsO1xuICB0aGlzLmhvc3QgPSBudWxsO1xuICB0aGlzLnBvcnQgPSBudWxsO1xuICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgdGhpcy5oYXNoID0gbnVsbDtcbiAgdGhpcy5zZWFyY2ggPSBudWxsO1xuICB0aGlzLnF1ZXJ5ID0gbnVsbDtcbiAgdGhpcy5wYXRobmFtZSA9IG51bGw7XG4gIHRoaXMucGF0aCA9IG51bGw7XG4gIHRoaXMuaHJlZiA9IG51bGw7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG52YXIgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaSxcbiAgICBwb3J0UGF0dGVybiA9IC86WzAtOV0qJC8sXG5cbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIGEgc2ltcGxlIHBhdGggVVJMXG4gICAgc2ltcGxlUGF0aFBhdHRlcm4gPSAvXihcXC9cXC8/KD8hXFwvKVteXFw/XFxzXSopKFxcP1teXFxzXSopPyQvLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbiAgICAvLyBXZSBhY3R1YWxseSBqdXN0IGF1dG8tZXNjYXBlIHRoZXNlLlxuICAgIGRlbGltcyA9IFsnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCddLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgbm90IGFsbG93ZWQgZm9yIHZhcmlvdXMgcmVhc29ucy5cbiAgICB1bndpc2UgPSBbJ3snLCAnfScsICd8JywgJ1xcXFwnLCAnXicsICdgJ10uY29uY2F0KGRlbGltcyksXG5cbiAgICAvLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG4gICAgYXV0b0VzY2FwZSA9IFsnXFwnJ10uY29uY2F0KHVud2lzZSksXG4gICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbiAgICAvLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4gICAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4gICAgLy8gdGhlbS5cbiAgICBub25Ib3N0Q2hhcnMgPSBbJyUnLCAnLycsICc/JywgJzsnLCAnIyddLmNvbmNhdChhdXRvRXNjYXBlKSxcbiAgICBob3N0RW5kaW5nQ2hhcnMgPSBbJy8nLCAnPycsICcjJ10sXG4gICAgaG9zdG5hbWVNYXhMZW4gPSAyNTUsXG4gICAgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eWythLXowLTlBLVpfLV17MCw2M30kLyxcbiAgICBob3N0bmFtZVBhcnRTdGFydCA9IC9eKFsrYS16MC05QS1aXy1dezAsNjN9KSguKikkLyxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbiAgICB1bnNhZmVQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbiAgICBob3N0bGVzc1Byb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG4gICAgc2xhc2hlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2h0dHBzOic6IHRydWUsXG4gICAgICAnZnRwOic6IHRydWUsXG4gICAgICAnZ29waGVyOic6IHRydWUsXG4gICAgICAnZmlsZTonOiB0cnVlXG4gICAgfSxcbiAgICBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbmZ1bmN0aW9uIHVybFBhcnNlKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKHVybCAmJiB1dGlsLmlzT2JqZWN0KHVybCkgJiYgdXJsIGluc3RhbmNlb2YgVXJsKSByZXR1cm4gdXJsO1xuXG4gIHZhciB1ID0gbmV3IFVybDtcbiAgdS5wYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KTtcbiAgcmV0dXJuIHU7XG59XG5cblVybC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICghdXRpbC5pc1N0cmluZyh1cmwpKSB7XG4gICAgY29uc29sZS5sb2coXCJVUkwgSVNcIiwgdXJsKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICAvLyBDb3B5IGNocm9tZSwgSUUsIG9wZXJhIGJhY2tzbGFzaC1oYW5kbGluZyBiZWhhdmlvci5cbiAgLy8gQmFjayBzbGFzaGVzIGJlZm9yZSB0aGUgcXVlcnkgc3RyaW5nIGdldCBjb252ZXJ0ZWQgdG8gZm9yd2FyZCBzbGFzaGVzXG4gIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gIHZhciBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKSxcbiAgICAgIHNwbGl0dGVyID1cbiAgICAgICAgICAocXVlcnlJbmRleCAhPT0gLTEgJiYgcXVlcnlJbmRleCA8IHVybC5pbmRleE9mKCcjJykpID8gJz8nIDogJyMnLFxuICAgICAgdVNwbGl0ID0gdXJsLnNwbGl0KHNwbGl0dGVyKSxcbiAgICAgIHNsYXNoUmVnZXggPSAvXFxcXC9nO1xuICB1U3BsaXRbMF0gPSB1U3BsaXRbMF0ucmVwbGFjZShzbGFzaFJlZ2V4LCAnLycpO1xuICB1cmwgPSB1U3BsaXQuam9pbihzcGxpdHRlcik7XG5cbiAgdmFyIHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiB1cmwuc3BsaXQoJyMnKS5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUcnkgZmFzdCBwYXRoIHJlZ2V4cFxuICAgIHZhciBzaW1wbGVQYXRoID0gc2ltcGxlUGF0aFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgICBpZiAoc2ltcGxlUGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gcmVzdDtcbiAgICAgIHRoaXMuaHJlZiA9IHJlc3Q7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5zZWFyY2guc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gdGhpcy5zZWFyY2guc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICAgICAgdGhpcy5xdWVyeSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSlcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcblxuICAgIHRoaXMuaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIC8vIElETkEgU3VwcG9ydDogUmV0dXJucyBhIHB1bnljb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgICAgLy8gSXQgb25seSBjb252ZXJ0cyBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgICAgLy8gaGF2ZSBub24tQVNDSUkgY2hhcmFjdGVycywgaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZlxuICAgICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgQVNDSUktb25seS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHRoaXMuaG9zdG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBwID0gdGhpcy5wb3J0ID8gJzonICsgdGhpcy5wb3J0IDogJyc7XG4gICAgdmFyIGggPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuICAgIHRoaXMuaHJlZiArPSB0aGlzLmhvc3Q7XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIGlmIChyZXN0WzBdICE9PSAnLycpIHtcbiAgICAgICAgcmVzdCA9ICcvJyArIHJlc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIGlmIChyZXN0LmluZGV4T2YoYWUpID09PSAtMSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgdGhpcy5xdWVyeSA9IHJlc3Quc3Vic3RyKHFtICsgMSk7XG4gICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIHRoaXMuc2VhcmNoID0gJyc7XG4gICAgdGhpcy5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmICh0aGlzLnBhdGhuYW1lIHx8IHRoaXMuc2VhcmNoKSB7XG4gICAgdmFyIHAgPSB0aGlzLnBhdGhuYW1lIHx8ICcnO1xuICAgIHZhciBzID0gdGhpcy5zZWFyY2ggfHwgJyc7XG4gICAgdGhpcy5wYXRoID0gcCArIHM7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgdGhpcy5ocmVmID0gdGhpcy5mb3JtYXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmb3JtYXQgYSBwYXJzZWQgb2JqZWN0IGludG8gYSB1cmwgc3RyaW5nXG5mdW5jdGlvbiB1cmxGb3JtYXQob2JqKSB7XG4gIC8vIGVuc3VyZSBpdCdzIGFuIG9iamVjdCwgYW5kIG5vdCBhIHN0cmluZyB1cmwuXG4gIC8vIElmIGl0J3MgYW4gb2JqLCB0aGlzIGlzIGEgbm8tb3AuXG4gIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGNhbGwgdXJsX2Zvcm1hdCgpIG9uIHN0cmluZ3NcbiAgLy8gdG8gY2xlYW4gdXAgcG90ZW50aWFsbHkgd29ua3kgdXJscy5cbiAgaWYgKHV0aWwuaXNTdHJpbmcob2JqKSkgb2JqID0gdXJsUGFyc2Uob2JqKTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgVXJsKSkgcmV0dXJuIFVybC5wcm90b3R5cGUuZm9ybWF0LmNhbGwob2JqKTtcbiAgcmV0dXJuIG9iai5mb3JtYXQoKTtcbn1cblxuVXJsLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF1dGggPSB0aGlzLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGVuY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICBhdXRoID0gYXV0aC5yZXBsYWNlKC8lM0EvaSwgJzonKTtcbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IHRoaXMucHJvdG9jb2wgfHwgJycsXG4gICAgICBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgJycsXG4gICAgICBoYXNoID0gdGhpcy5oYXNoIHx8ICcnLFxuICAgICAgaG9zdCA9IGZhbHNlLFxuICAgICAgcXVlcnkgPSAnJztcblxuICBpZiAodGhpcy5ob3N0KSB7XG4gICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gIH0gZWxzZSBpZiAodGhpcy5ob3N0bmFtZSkge1xuICAgIGhvc3QgPSBhdXRoICsgKHRoaXMuaG9zdG5hbWUuaW5kZXhPZignOicpID09PSAtMSA/XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgOlxuICAgICAgICAnWycgKyB0aGlzLmhvc3RuYW1lICsgJ10nKTtcbiAgICBpZiAodGhpcy5wb3J0KSB7XG4gICAgICBob3N0ICs9ICc6JyArIHRoaXMucG9ydDtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5xdWVyeSAmJlxuICAgICAgdXRpbC5pc09iamVjdCh0aGlzLnF1ZXJ5KSAmJlxuICAgICAgT2JqZWN0LmtleXModGhpcy5xdWVyeSkubGVuZ3RoKSB7XG4gICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gIH1cblxuICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKHRoaXMuc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHBhdGhuYW1lID0gcGF0aG5hbWUucmVwbGFjZSgvWz8jXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQobWF0Y2gpO1xuICB9KTtcbiAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoJyMnLCAnJTIzJyk7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZShyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmVPYmplY3QodXJsUGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKSkuZm9ybWF0KCk7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmVPYmplY3QocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmVPYmplY3QgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICBpZiAodXRpbC5pc1N0cmluZyhyZWxhdGl2ZSkpIHtcbiAgICB2YXIgcmVsID0gbmV3IFVybCgpO1xuICAgIHJlbC5wYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgIHJlbGF0aXZlID0gcmVsO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBVcmwoKTtcbiAgdmFyIHRrZXlzID0gT2JqZWN0LmtleXModGhpcyk7XG4gIGZvciAodmFyIHRrID0gMDsgdGsgPCB0a2V5cy5sZW5ndGg7IHRrKyspIHtcbiAgICB2YXIgdGtleSA9IHRrZXlzW3RrXTtcbiAgICByZXN1bHRbdGtleV0gPSB0aGlzW3RrZXldO1xuICB9XG5cbiAgLy8gaGFzaCBpcyBhbHdheXMgb3ZlcnJpZGRlbiwgbm8gbWF0dGVyIHdoYXQuXG4gIC8vIGV2ZW4gaHJlZj1cIlwiIHdpbGwgcmVtb3ZlIGl0LlxuICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgLy8gaWYgdGhlIHJlbGF0aXZlIHVybCBpcyBlbXB0eSwgdGhlbiB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBkbyBoZXJlLlxuICBpZiAocmVsYXRpdmUuaHJlZiA9PT0gJycpIHtcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIC8vIHRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICB2YXIgcmtleXMgPSBPYmplY3Qua2V5cyhyZWxhdGl2ZSk7XG4gICAgZm9yICh2YXIgcmsgPSAwOyByayA8IHJrZXlzLmxlbmd0aDsgcmsrKykge1xuICAgICAgdmFyIHJrZXkgPSBya2V5c1tya107XG4gICAgICBpZiAocmtleSAhPT0gJ3Byb3RvY29sJylcbiAgICAgICAgcmVzdWx0W3JrZXldID0gcmVsYXRpdmVbcmtleV07XG4gICAgfVxuXG4gICAgLy91cmxQYXJzZSBhcHBlbmRzIHRyYWlsaW5nIC8gdG8gdXJscyBsaWtlIGh0dHA6Ly93d3cuZXhhbXBsZS5jb21cbiAgICBpZiAoc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmICFyZXN1bHQucGF0aG5hbWUpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gcmVzdWx0LnBhdGhuYW1lID0gJy8nO1xuICAgIH1cblxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHJlc3VsdC5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBrZXlzLmxlbmd0aDsgdisrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1t2XTtcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgICB9XG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgaWYgKCFyZWxhdGl2ZS5ob3N0ICYmICFob3N0bGVzc1Byb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgdmFyIHJlbFBhdGggPSAocmVsYXRpdmUucGF0aG5hbWUgfHwgJycpLnNwbGl0KCcvJyk7XG4gICAgICB3aGlsZSAocmVsUGF0aC5sZW5ndGggJiYgIShyZWxhdGl2ZS5ob3N0ID0gcmVsUGF0aC5zaGlmdCgpKSk7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3QpIHJlbGF0aXZlLmhvc3QgPSAnJztcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gJyc7XG4gICAgICBpZiAocmVsUGF0aFswXSAhPT0gJycpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICBpZiAocmVsUGF0aC5sZW5ndGggPCAyKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHJlc3VsdC5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy8gdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnBhdGhuYW1lIHx8IHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHZhciBwID0gcmVzdWx0LnBhdGhuYW1lIHx8ICcnO1xuICAgICAgdmFyIHMgPSByZXN1bHQuc2VhcmNoIHx8ICcnO1xuICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICB9XG4gICAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB2YXIgaXNTb3VyY2VBYnMgPSAocmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyksXG4gICAgICBpc1JlbEFicyA9IChcbiAgICAgICAgICByZWxhdGl2ZS5ob3N0IHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gcmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSByZXN1bHQucHJvdG9jb2wgJiYgIXNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHJlc3VsdC5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gJyc7XG4gICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgIGlmIChyZXN1bHQuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChyZXN1bHQuaG9zdCk7XG4gICAgfVxuICAgIHJlc3VsdC5ob3N0ID0gJyc7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZS5wb3J0ID0gbnVsbDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgcmVsYXRpdmUuaG9zdCA9IG51bGw7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHJlc3VsdC5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiByZXN1bHQuaG9zdDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiByZXN1bHQuaG9zdG5hbWU7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCF1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKHJlbGF0aXZlLnNlYXJjaCkpIHtcbiAgICAvLyBqdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgLy8gbGlrZSBocmVmPSc/Zm9vJy5cbiAgICAvLyBQdXQgdGhpcyBhZnRlciB0aGUgb3RoZXIgdHdvIGNhc2VzIGJlY2F1c2UgaXQgc2ltcGxpZmllcyB0aGUgYm9vbGVhbnNcbiAgICBpZiAocHN5Y2hvdGljKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKTtcbiAgICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAgIC8vdGhpcyBlc3BlY2lhbGx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKCF1dGlsLmlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICF1dGlsLmlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQuc2VhcmNoKSB7XG4gICAgICByZXN1bHQucGF0aCA9ICcvJyArIHJlc3VsdC5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGlmIGEgdXJsIEVORHMgaW4gLiBvciAuLiwgdGhlbiBpdCBtdXN0IGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgLy8gdGhlbiBpdCBtdXN0IE5PVCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIGxhc3QgPSBzcmNQYXRoLnNsaWNlKC0xKVswXTtcbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSAoXG4gICAgICAocmVzdWx0Lmhvc3QgfHwgcmVsYXRpdmUuaG9zdCB8fCBzcmNQYXRoLmxlbmd0aCA+IDEpICYmXG4gICAgICAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8IGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWxseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgfVxuICB9XG5cbiAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICBpZiAobXVzdEVuZEFicyAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmICghdXRpbC5pc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhdXRpbC5pc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICB9XG4gIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCByZXN1bHQuYXV0aDtcbiAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG59O1xuIiwiaW1wb3J0IHtNZXNzYWdlUG9ydFdyYXBwZXJ9IGZyb20gJy4vbWVzc2FnZS1jaGFubmVsJztcblxuY29uc3QgYWN0aXZlTWVzc2FnZVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW11cblxuY29uc3QgUG9ydFN0b3JlID0ge1xuXG4gICAgYWRkOiBmdW5jdGlvbiAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpIHtcbiAgICAgICAgaWYgKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpID4gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyeWluZyB0byBhZGQgYSBwb3J0IHRoYXQncyBhbHJlYWR5IGJlZW4gYWRkZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYWN0aXZlTWVzc2FnZVBvcnRzLnB1c2gocG9ydCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5zcGxpY2UoYWN0aXZlTWVzc2FnZVBvcnRzLmluZGV4T2YocG9ydCksIDEpO1xuICAgIH0sXG5cbiAgICBmaW5kQnlOYXRpdmVJbmRleDogZnVuY3Rpb24obmF0aXZlSW5kZXg6bnVtYmVyKTpNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleCA9PT0gbmF0aXZlSW5kZXgpO1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgfSxcblxuICAgIGZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgaWYgKCFuYXRpdmVJbmRleCAmJiBuYXRpdmVJbmRleCAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIGEgbmF0aXZlIGluZGV4XCIpXG4gICAgICAgIH1cbiAgICAgIFxuICAgICAgICBsZXQgZXhpc3RpbmcgPSBQb3J0U3RvcmUuZmluZEJ5TmF0aXZlSW5kZXgobmF0aXZlSW5kZXgpO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBoYXZlIGEgcG9ydCBmb3IgdGhpcy4gUmV0dXJuIGl0LlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgbm90LCBtYWtlIGEgbmV3IG9uZVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKCk7XG4gICAgICAgIG5ld0N1c3RvbS5uYXRpdmVQb3J0SW5kZXggPSBuYXRpdmVJbmRleDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IHdlYiBNZXNzYWdlUG9ydCBmb3IgbmF0aXZlIGluZGV4XCIsIG5hdGl2ZUluZGV4KVxuICAgICAgICBcbiAgICAgICAgLy8gdGhpcyBhbHJlYWR5IGhhcyBhIGJyaWRnZSwgc28gd2UgY29uc2lkZXIgaXQgJ2FjdGl2ZSdcbiAgICAgICAgUG9ydFN0b3JlLmFkZChuZXdDdXN0b20pO1xuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tXG4gICAgfSxcblxuICAgIGZpbmRPcldyYXBKU01lc3NzYWdlUG9ydDogZnVuY3Rpb24ocG9ydDpNZXNzYWdlUG9ydCk6IE1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGxldCBleGlzdGluZyA9IGFjdGl2ZU1lc3NhZ2VQb3J0cy5maWx0ZXIoKHApID0+IHAuanNNZXNzYWdlUG9ydCA9PSBwb3J0KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIHBvcnQgZm9yIHRoaXMuIFJldHVybiBpdC5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuXG4gICAgICAgIC8vIHRoaXMgaGFzIG5vdCB5ZXQgYmVlbiBnaXZlbiBhIG5hdGl2ZSBpbmRleCwgc28gd2UgZG8gbm90XG4gICAgICAgIC8vIGNvbnNpZGVyIGl0IGFjdGl2ZS5cblxuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUG9ydFN0b3JlO1xuXG4vLyBmb3IgdGVzdGluZ1xuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZFBvcnRTdG9yZSA9IFBvcnRTdG9yZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH1cblxudmFyIGhhc1Byb3AgPSAoe30pLmhhc093blByb3BlcnR5O1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChjaGlsZCwgcGFyZW50KSB7XG4gICAgZm9yICh2YXIga2V5IGluIHBhcmVudCkge1xuICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkge1xuICAgICAgICAgICAgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICB9XG4gICAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuXG52YXIgVGltZW91dEVycm9yID0gZXhwb3J0cy5UaW1lb3V0RXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW1lb3V0RXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGltZW91dEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBiZXR0ZXIsIGJlY2F1c2UgaXQgbWFrZXMgdGhlIHJlc3VsdGluZyBzdGFjayB0cmFjZSBoYXZlIHRoZSBjb3JyZWN0IGVycm9yIG5hbWUuICBCdXQsIGl0XG4gICAgICAgIC8vIG9ubHkgd29ya3MgaW4gVjgvQ2hyb21lLlxuICAgICAgICBUaW1lb3V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhY2tpbmVzcyBmb3Igb3RoZXIgYnJvd3NlcnMuXG4gICAgICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IobWVzc2FnZSkuc3RhY2s7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gXCJUaW1lb3V0RXJyb3JcIjtcbn07XG5leHRlbmQoVGltZW91dEVycm9yLCBFcnJvcik7XG5cbi8qXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBgbXNgIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQuICBUaGUgcmV0dXJuZWQgUHJvbWlzZSB3aWxsIG5ldmVyIHJlamVjdC5cbiAqL1xuZXhwb3J0cy5kZWxheSA9IGZ1bmN0aW9uIChtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBSZXR1cm5zIGEgYHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9YCBvYmplY3QuICBUaGUgcmV0dXJuZWQgYHByb21pc2VgIHdpbGwgcmVzb2x2ZSBvciByZWplY3Qgd2hlbiBgcmVzb2x2ZWAgb3JcbiAqIGByZWplY3RgIGFyZSBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuZGVmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFuc3dlciA9IHt9O1xuICAgIGFuc3dlci5wcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBhbnN3ZXIucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIGFuc3dlci5yZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFuc3dlcjtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHNlcmllcywgb25seVxuICogY2FsbGluZyB0aGUgbmV4dCBmdW5jdGlvbiBvbmNlIHRoZSBwcmV2aW91cyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLlxuICovXG5leHBvcnRzLnNlcmllcyA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgcmV0dXJuIHRhc2tzLnJlZHVjZShmdW5jdGlvbiAoc2VyaWVzLCB0YXNrKSB7XG4gICAgICAgIHJldHVybiBzZXJpZXMudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5LCBgdGFza3NgLCBvZiBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIFByb21pc2VzLCBleGVjdXRlcyBlYWNoIGZ1bmN0aW9uIGluIGB0YXNrc2AgaW4gcGFyYWxsZWwuXG4gKiBJZiBgbGltaXRgIGlzIHN1cHBsaWVkLCB0aGVuIGF0IG1vc3QgYGxpbWl0YCB0YXNrcyB3aWxsIGJlIGV4ZWN1dGVkIGNvbmN1cnJlbnRseS5cbiAqL1xuZXhwb3J0cy5wYXJhbGxlbCA9IGV4cG9ydHMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uICh0YXNrcywgbGltaXQpIHtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSB8fCBsaW1pdCA+PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzLm1hcChmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4odGFzayk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHZhciBjdXJyZW50VGFzayA9IDA7XG4gICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgc3RhcnRUYXNrID0gZnVuY3Rpb24gc3RhcnRUYXNrKCkge1xuICAgICAgICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFza051bWJlciA9IGN1cnJlbnRUYXNrKys7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzW3Rhc2tOdW1iZXJdO1xuICAgICAgICAgICAgcnVubmluZysrO1xuXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbdGFza051bWJlcl0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgcnVubmluZy0tO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGFzayA8IHRhc2tzLmxlbmd0aCAmJiBydW5uaW5nIDwgbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChydW5uaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdGFydCB1cCBgbGltaXRgIHRhc2tzLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXkgYGFycmAgb2YgaXRlbXMsIGNhbGxzIGBpdGVyKGl0ZW0sIGluZGV4KWAgZm9yIGV2ZXJ5IGl0ZW0gaW4gYGFycmAuICBgaXRlcigpYCBzaG91bGQgcmV0dXJuIGFcbiAqIFByb21pc2UuICBVcCB0byBgbGltaXRgIGl0ZW1zIHdpbGwgYmUgY2FsbGVkIGluIHBhcmFsbGVsIChkZWZhdWx0cyB0byAxLilcbiAqL1xuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbiAoYXJyLCBpdGVyLCBsaW1pdCkge1xuICAgIHZhciB0YXNrTGltaXQgPSBsaW1pdDtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSkge1xuICAgICAgICB0YXNrTGltaXQgPSAxO1xuICAgIH1cbiAgICBpZiAobGltaXQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICB0YXNrTGltaXQgPSBhcnIubGVuZ3RoO1xuICAgIH1cblxuICAgIHZhciB0YXNrcyA9IGFyci5tYXAoZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcihpdGVtLCBpbmRleCk7XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyYWxsZWwodGFza3MsIHRhc2tMaW1pdCk7XG59O1xuXG4vKlxuICogQWRkIGEgdGltZW91dCB0byBhbiBleGlzdGluZyBQcm9taXNlLlxuICpcbiAqIFJlc29sdmVzIHRvIHRoZSBzYW1lIHZhbHVlIGFzIGBwYCBpZiBgcGAgcmVzb2x2ZXMgd2l0aGluIGBtc2AgbWlsbGlzZWNvbmRzLCBvdGhlcndpc2UgdGhlIHJldHVybmVkIFByb21pc2Ugd2lsbFxuICogcmVqZWN0IHdpdGggdGhlIGVycm9yIFwiVGltZW91dDogUHJvbWlzZSBkaWQgbm90IHJlc29sdmUgd2l0aGluICR7bXN9IG1pbGxpc2Vjb25kc1wiXG4gKi9cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uIChwLCBtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLlRpbWVvdXRFcnJvcihcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiBcIiArIG1zICsgXCIgbWlsbGlzZWNvbmRzXCIpKTtcbiAgICAgICAgfSwgbXMpO1xuXG4gICAgICAgIHAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogQ29udGludWFsbHkgY2FsbCBgZm4oKWAgd2hpbGUgYHRlc3QoKWAgcmV0dXJucyB0cnVlLlxuICpcbiAqIGBmbigpYCBzaG91bGQgcmV0dXJuIGEgUHJvbWlzZS4gIGB0ZXN0KClgIGlzIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0cnVlIG9mIGZhbHNlLlxuICpcbiAqIGB3aGlsc3RgIHdpbGwgcmVzb2x2ZSB0byB0aGUgbGFzdCB2YWx1ZSB0aGF0IGBmbigpYCByZXNvbHZlZCB0bywgb3Igd2lsbCByZWplY3QgaW1tZWRpYXRlbHkgd2l0aCBhbiBlcnJvciBpZlxuICogYGZuKClgIHJlamVjdHMgb3IgaWYgYGZuKClgIG9yIGB0ZXN0KClgIHRocm93LlxuICovXG5leHBvcnRzLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBmbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBsYXN0UmVzdWx0ID0gbnVsbDtcbiAgICAgICAgdmFyIGRvSXQgPSBmdW5jdGlvbiBkb0l0KCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZm4pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsYXN0UmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGZuLCB0ZXN0KSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB2YXIgZG9UZXN0ID0gZnVuY3Rpb24gZG9UZXN0KCkge1xuICAgICAgICB2YXIgYW5zd2VyID0gZmlyc3QgfHwgdGVzdCgpO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH07XG4gICAgcmV0dXJuIGV4cG9ydHMud2hpbHN0KGRvVGVzdCwgZm4pO1xufTtcblxuLypcbiAqIGtlZXAgY2FsbGluZyBgZm5gIHVudGlsIGl0IHJldHVybnMgYSBub24tZXJyb3IgdmFsdWUsIGRvZXNuJ3QgdGhyb3csIG9yIHJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMuIGBmbmAgd2lsbCBiZVxuICogYXR0ZW1wdGVkIGB0aW1lc2AgbWFueSB0aW1lcyBiZWZvcmUgcmVqZWN0aW5nLiBJZiBgdGltZXNgIGlzIGdpdmVuIGFzIGBJbmZpbml0eWAsIHRoZW4gYHJldHJ5YCB3aWxsIGF0dGVtcHQgdG9cbiAqIHJlc29sdmUgZm9yZXZlciAodXNlZnVsIGlmIHlvdSBhcmUganVzdCB3YWl0aW5nIGZvciBzb21ldGhpbmcgdG8gZmluaXNoKS5cbiAqIEBwYXJhbSB7T2JqZWN0fE51bWJlcn0gb3B0aW9ucyBoYXNoIHRvIHByb3ZpZGUgYHRpbWVzYCBhbmQgYGludGVydmFsYC4gRGVmYXVsdHMgKHRpbWVzPTUsIGludGVydmFsPTApLiBJZiB0aGlzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGlzIGEgbnVtYmVyLCBvbmx5IGB0aW1lc2Agd2lsbCBiZSBzZXQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuIHRoZSB0YXNrL2NoZWNrIHRvIGJlIHBlcmZvcm1lZC4gQ2FuIGVpdGhlciByZXR1cm4gYSBzeW5jaHJvbm91cyB2YWx1ZSwgdGhyb3cgYW4gZXJyb3IsIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhIHByb21pc2VcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5leHBvcnRzLnJldHJ5ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGZuKSB7XG4gICAgdmFyIHRpbWVzID0gNTtcbiAgICB2YXIgaW50ZXJ2YWwgPSAwO1xuICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgdmFyIGxhc3RBdHRlbXB0ID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIG1ha2VUaW1lT3B0aW9uRXJyb3IodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yICd0aW1lcyc6IFwiICsgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKHZhbHVlKSkpO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2Ygb3B0aW9ucykgZm4gPSBvcHRpb25zO2Vsc2UgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygb3B0aW9ucykgdGltZXMgPSArb3B0aW9ucztlbHNlIGlmICgnb2JqZWN0JyA9PT0gKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob3B0aW9ucykpKSB7XG4gICAgICAgIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMudGltZXMpIHRpbWVzID0gK29wdGlvbnMudGltZXM7ZWxzZSBpZiAob3B0aW9ucy50aW1lcykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucy50aW1lcykpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmludGVydmFsKSBpbnRlcnZhbCA9ICtvcHRpb25zLmludGVydmFsO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucykpO2Vsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gcGFyYW1ldGVycyBnaXZlbicpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbihsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICB9KS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICAgIGxhc3RBdHRlbXB0ID0gZXJyO1xuICAgICAgICAgICAgICAgIGlmICh0aW1lcyAhPT0gSW5maW5pdHkgJiYgYXR0ZW1wdHMgPT09IHRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChkb0l0LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvSXQoKTtcbiAgICB9KTtcbn07IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBQb3J0U3RvcmUgZnJvbSAnLi9wb3J0LXN0b3JlJztcbmltcG9ydCBQcm9taXNlVG9vbHMgZnJvbSAncHJvbWlzZS10b29scyc7XG5cbmxldCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwibWVzc2FnZUNoYW5uZWxcIik7XG5cbi8vIFdlIG5lZWQgdGhpcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlIHNvIHRoYXQgd2UgY2FuIHRyaWdnZXIgcmVjZWl2ZVxuLy8gZXZlbnRzIG1hbnVhbGx5XG5cbih3aW5kb3cgYXMgYW55KS5fX21lc3NhZ2VDaGFubmVsQnJpZGdlID0gcHJvbWlzZUJyaWRnZTtcblxuaW50ZXJmYWNlIE1lc3NhZ2VQb3J0TWVzc2FnZSB7XG4gICAgZGF0YTpzdHJpbmcsXG4gICAgcGFzc2VkUG9ydElkczogbnVtYmVyW11cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UocG9ydEluZGV4Om51bWJlciwgbWVzc2FnZTpNZXNzYWdlUG9ydE1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQgaW5jb21pbmcgbWVzc2FnZSBmcm9tIG5hdGl2ZSwgdG8gcG9ydFwiLCBwb3J0SW5kZXgsIFwid2l0aCBtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgICAgICBsZXQgdGhpc1BvcnQgPSBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChwb3J0SW5kZXgpO1xuXG4gICAgICAgIGlmICghdGhpc1BvcnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlY2VpdmUgbWVzc2FnZSBvbiBpbmFjdGl2ZSBwb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hcHBlZFBvcnRzID0gbWVzc2FnZS5wYXNzZWRQb3J0SWRzLm1hcCgoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHBhc3MgaW4gYWN0dWFsIG1lc3NhZ2UgcG9ydHMsIHNvIGluc3RlYWQgd2UgcGFzcyBpblxuICAgICAgICAgICAgLy8gdGhlaXIgSURzLiBOb3cgd2UgbWFwIHRoZW0gdG8gb3VyIHdyYXBwZXIgQ3VzdG9tTWVzc2FnZVBvcnRcbiAgICAgICAgICAgIHJldHVybiBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChpZCkuanNNZXNzYWdlUG9ydDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG1lc3NhZ2UgdG8gbmF0aXZlIGluZGV4XCIsIHRoaXNQb3J0Lm5hdGl2ZVBvcnRJbmRleCk7XG4gICAgICAgIHRoaXNQb3J0LnNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKSwgbWFwcGVkUG9ydHMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICB9XG5cbn1cblxucHJvbWlzZUJyaWRnZS5hZGRMaXN0ZW5lcihcImVtaXRcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuXG5leHBvcnQgY2xhc3MgTWVzc2FnZVBvcnRXcmFwcGVyIHtcblxuICAgIG9wZW46Ym9vbGVhbjtcbiAgICBuYXRpdmVQb3J0SW5kZXg6bnVtYmVyO1xuICAgIGpzTWVzc2FnZVBvcnQ6TWVzc2FnZVBvcnQ7XG4gICAganNNZXNzYWdlQ2hhbm5lbDpNZXNzYWdlQ2hhbm5lbDtcbiAgICBwcml2YXRlIG9yaWdpbmFsSlNQb3J0Q2xvc2U6RnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3Rvcihqc1BvcnQ6TWVzc2FnZVBvcnQgPSBudWxsKSB7XG4gICAgICAgIHRoaXMubmF0aXZlUG9ydEluZGV4ID0gbnVsbDtcbiAgICAgICAgaWYgKGpzUG9ydCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0aW5nIHdyYXBwZXIgZm9yIGFuIGV4aXN0aW5nIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQgPSBqc1BvcnRcblxuICAgICAgICAgICAgLy8gZGlzZ3VzdGluZyBoYWNrLCBidXQgY2FuJ3Qgc2VlIGFueSB3YXkgYXJvdW5kIGlzIGFzIHRoZXJlIGlzIG5vXG4gICAgICAgICAgICAvLyBcImhhcyBkaXNwYXRjaGVkIGEgbWVzc2FnZVwiIGV2ZW50LCBhcyBmYXIgYXMgSSBjYW4gdGVsbCBcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0LnBvc3RNZXNzYWdlID0gdGhpcy5oYW5kbGVKU01lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJNYWtpbmcgd3JhcHBlciBmb3IgYSBuZXcgd2ViIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHdlIGNhbid0IGNyZWF0ZSBhIE1lc3NhZ2VQb3J0IGRpcmVjdGx5LCBzbyB3ZSBoYXZlIHRvIG1ha2VcbiAgICAgICAgICAgIC8vIGEgY2hhbm5lbCB0aGVuIHRha2Ugb25lIHBvcnQgZnJvbSBpdC4gS2luZCBvZiBhIHdhc3RlLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IHRoaXMuanNNZXNzYWdlQ2hhbm5lbC5wb3J0MTtcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQyLm9ubWVzc2FnZSA9IChldjpNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4ndCByZWxpYWJseSBob29rIGludG8gcG9zdE1lc3NhZ2UsIHNvIHdlIHVzZSB0aGlzXG4gICAgICAgICAgICAgICAgLy8gdG8gY2F0Y2ggcG9zdE1lc3NhZ2VzIHRvby4gTmVlZCB0byBkb2N1bWVudCBhbGwgdGhpcyBtYWRuZXNzLlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSlNNZXNzYWdlKGV2LmRhdGEsIGV2LnBvcnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbWUgZm9yIHRoZSBsYWNrIG9mIGEgJ2Nsb3NlJyBldmVudC5cbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlID0gdGhpcy5qc01lc3NhZ2VQb3J0LmNsb3NlO1xuICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2UgPSB0aGlzLmNsb3NlO1xuICAgIH1cblxuICAgIHNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKGRhdGE6IGFueSwgcG9ydHM6IE1lc3NhZ2VQb3J0W10pIHtcbiAgICAgICAgTWVzc2FnZVBvcnQucHJvdG90eXBlLnBvc3RNZXNzYWdlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCwgW2RhdGEsIHBvcnRzXSk7XG4gICAgfVxuXG4gICAgaGFuZGxlSlNNZXNzYWdlKGRhdGE6YW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSwgaXNFeHBsaWNpdFBvc3Q6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgXG4gICAgICAgIC8vIEdldCBvdXIgY3VzdG9tIHBvcnQgaW5zdGFuY2VzLCBjcmVhdGluZyB0aGVtIGlmIG5lY2Vzc2FyeVxuICAgICAgICBsZXQgY3VzdG9tUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChwb3J0cykge1xuICAgICAgICAgICAgY3VzdG9tUG9ydHMgPSBwb3J0cy5tYXAoKHA6TWVzc2FnZVBvcnQpID0+IFBvcnRTdG9yZS5maW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQocCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja0Zvck5hdGl2ZVBvcnQoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGV5IHdlcmUgY3JlYXRlZCwgdGhlbiB3ZSBuZWVkIHRvIGFzc2lnbiB0aGVtIGEgbmF0aXZlIElEIGJlZm9yZVxuICAgICAgICAgICAgLy8gd2Ugc2VuZC5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGVja2luZyB0aGF0IGFkZGl0aW9uYWwgcG9ydHMgaGF2ZSBuYXRpdmUgZXF1aXZhbGVudHNcIilcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYW4gZXhwbGljaXQgcG9zdE1lc3NhZ2UgY2FsbCwgd2UgbmVlZCB0aGUgbmF0aXZlXG4gICAgICAgICAgICAvLyBzaWRlIHRvIHBpY2sgdXAgb24gaXQgKHNvIGl0IGRvZXMgc29tZXRoaW5nIHdpdGggdGhlIE1lc3NhZ2VQb3J0KVxuXG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJzZW5kVG9Qb3J0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBpc0V4cGxpY2l0UG9zdDogaXNFeHBsaWNpdFBvc3QsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBjdXN0b21Qb3J0cy5tYXAoKHApID0+IHAubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjaGVja0Zvck5hdGl2ZVBvcnQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKHRoaXMubmF0aXZlUG9ydEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuZGVidWcoXCJQb3J0IGFscmVhZHkgaGFzIG5hdGl2ZSBpbmRleFwiLCB0aGlzLm5hdGl2ZVBvcnRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJjcmVhdGVcIlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocG9ydElkOm51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IG5hdGl2ZSBNZXNzYWdlUG9ydCBhdCBpbmRleCBcIiwgU3RyaW5nKHBvcnRJZCkpXG4gICAgICAgICAgICB0aGlzLm5hdGl2ZVBvcnRJbmRleCA9IHBvcnRJZDtcblxuICAgICAgICAgICAgLy8gb25seSBhZGQgdG8gb3VyIGFycmF5IG9mIGFjdGl2ZSBjaGFubmVscyB3aGVuXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIGEgbmF0aXZlIElEXG4gICAgICAgICAgICBQb3J0U3RvcmUuYWRkKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG5cbiAgICAgICAgLy8gcnVuIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3ZSBvdmVyd3JvdGVcbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCk7XG4gICAgICAgIFxuICAgICAgICAvLyByZW1vdmUgZnJvbSBvdXIgY2FjaGUgb2YgYWN0aXZlIHBvcnRzXG4gICAgICAgIFBvcnRTdG9yZS5yZW1vdmUodGhpcyk7XG4gICAgIFxuICAgICAgICAvLyBmaW5hbGx5LCB0ZWxsIHRoZSBuYXRpdmUgaGFsZiB0byBkZWxldGUgdGhpcyByZWZlcmVuY2UuXG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiZGVsZXRlXCIsXG4gICAgICAgICAgICBwb3J0SW5kZXg6IHRoaXMubmF0aXZlUG9ydEluZGV4XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZTphbnksIHBvcnRzOiBbTWVzc2FnZVBvcnRdKSB7XG5cbiAgICBsZXQgcG9ydEluZGV4ZXM6bnVtYmVyW10gPSBbXTtcblxuICAgIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKHBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlci5uYXRpdmVQb3J0SW5kZXg7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oKHBvcnRJbmRleGVzOm51bWJlcltdKSA9PiB7XG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicG9zdE1lc3NhZ2VcIixcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpLFxuICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBwb3J0SW5kZXhlc1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG5cbiAgICBcblxufSIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQge3Bvc3RNZXNzYWdlfSBmcm9tICcuLi9tZXNzYWdlcy9tZXNzYWdlLWNoYW5uZWwnO1xuXG5leHBvcnQgY29uc3Qgc2VydmljZVdvcmtlckJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcInNlcnZpY2VXb3JrZXJcIik7XG5cbmNsYXNzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQsIHVzZUNhcHR1cmU6Ym9vbGVhbikge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBkaXNwYXRjaEV2ZW50KGV2dDpFdmVudCk6IGJvb2xlYW4ge1xuICAgICAgICB0aGlzLmVtaXQoZXZ0LnR5cGUsIGV2dCk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfVxufVxuXG5jbGFzcyBIeWJyaWRTZXJ2aWNlV29ya2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlciB7XG4gICAgc2NvcGU6c3RyaW5nO1xuICAgIHNjcmlwdFVSTDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaWQ6bnVtYmVyO1xuXG4gICAgaW5zdGFsbFN0YXRlOlNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGVcbiAgICBnZXQgc3RhdGUoKTpzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuQWN0aXZhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0ZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0aW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsaW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuUmVkdW5kYW50KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJyZWR1bmRhbnRcIlxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBpbnN0YWxsIHN0YXRlOlwiICsgdGhpcy5pbnN0YWxsU3RhdGUpXG4gICAgfVxuXG4gICAgb25zdGF0ZWNoYW5nZTooc3RhdGVjaGFuZ2V2ZW50OmFueSkgPT4gdm9pZDtcbiAgICBvbm1lc3NhZ2U6KGV2Ok1lc3NhZ2VFdmVudCkgPT4gYW55O1xuICAgIG9uZXJyb3I6IChldjpFcnJvckV2ZW50KSA9PiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihpZDpudW1iZXIsIHNjcmlwdFVSTDpzdHJpbmcsIHNjb3BlOnN0cmluZywgc3RhdGU6U2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuX2lkID0gaWQ7XG4gICAgICAgIHRoaXMuc2NyaXB0VVJMID0gc2NyaXB0VVJMO1xuICAgICAgICB0aGlzLnNjb3BlID0gc2NvcGU7XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGU6TWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9ubWVzc2FnZShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoc3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlID09PSB0aGlzLmluc3RhbGxTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLm9uc3RhdGVjaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMub25zdGF0ZWNoYW5nZSh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFxuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2U6YW55LCBvcHRpb25zOiBhbnlbXSkge1xuICAgICAgICBpZiAoUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBwb3N0TWVzc2FnZSB0byBhY3RpdmUgc2VydmljZSB3b3JrZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sZW5ndGggPiAxIHx8IG9wdGlvbnNbMF0gaW5zdGFuY2VvZiBNZXNzYWdlUG9ydCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIHNlbmRpbmcgb25lIE1lc3NhZ2VQb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgW29wdGlvbnNbMF0gYXMgTWVzc2FnZVBvcnRdKTtcblxuICAgIH0gXG5cbiAgICB0ZXJtaW5hdGUoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNob3VsZCBub3QgaW1wbGVtZW50IHRoaXMuXCIpO1xuICAgIH1cbn1cblxuY2xhc3MgSHlicmlkUmVnaXN0cmF0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbiB7XG4gICAgXG4gICAgYWN0aXZlOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgaW5zdGFsbGluZzogSHlicmlkU2VydmljZVdvcmtlclxuICAgIHdhaXRpbmc6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBwdXNoTWFuYWdlcjogYW55XG4gICAgb251cGRhdGVmb3VuZDogKCkgPT4gdm9pZFxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcInVwZGF0ZWZvdW5kXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9udXBkYXRlZm91bmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9udXBkYXRlZm91bmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLnB1c2hNYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHVzaD8nKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0TW9zdFJlY2VudFdvcmtlcigpOkh5YnJpZFNlcnZpY2VXb3JrZXIge1xuICAgICAgICAvLyB3aGVuIHdlIHdhbnQgdGhlIG1vc3QgY3VycmVudCwgcmVnYXJkbGVzcyBvZiBhY3R1YWwgc3RhdHVzXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZSB8fCB0aGlzLndhaXRpbmcgfHwgdGhpcy5pbnN0YWxsaW5nO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJ1cGRhdGVcIixcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRNb3N0UmVjZW50V29ya2VyKCkuc2NyaXB0VVJMXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0IHNjb3BlKCk6c3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlLnNjb3BlO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB5ZXRcIilcbiAgICB9XG5cbiAgICBjbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKTp2b2lkIHtcbiAgICAgICAgLy8gSWYgYSBzZXJ2aWNlIHdvcmtlciBoYXMgY2hhbmdlZCBzdGF0ZSwgd2Ugd2FudCB0byBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBpdCBkb2Vzbid0IGFwcGVhciBpbiBhbnkgb2xkIHN0YXRlc1xuICAgIFxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsaW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsaW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmcgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG5cbiAgICAgICAgdGhpcy5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRlZCAmJiAhdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gc3c7XG4gICAgICAgICAgICBTZXJ2aWNlV29ya2VyQ29udGFpbmVyLmNvbnRyb2xsZXIgPSBzdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBzdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGluZyA9IHN3O1xuICAgICAgICAgICAgdGhpcy5lbWl0KFwidXBkYXRlZm91bmRcIiwgc3cpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBSZWdpc3RyYXRpb25JbnN0YW5jZSA9IG5ldyBIeWJyaWRSZWdpc3RyYXRpb24oKTtcblxuY2xhc3MgSHlicmlkU2VydmljZVdvcmtlckNvbnRhaW5lciBleHRlbmRzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXJDb250YWluZXIge1xuICAgIGNvbnRyb2xsZXI6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBcbiAgICBvbmNvbnRyb2xsZXJjaGFuZ2U6ICgpID0+IHZvaWRcbiAgICBvbmVycm9yOiAoKSA9PiB2b2lkXG4gICAgb25tZXNzYWdlOiAoZTpNZXNzYWdlRXZlbnQpID0+IHZvaWRcblxuICAgIGdldCByZWFkeSgpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udHJvbGxlcikge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiU2VydmljZVdvcmtlciByZWFkeSByZXR1cm5pbmcgaW1tZWRpYXRlbHkgd2l0aCBhY3RpdmF0ZWQgaW5zdGFuY2VcIik7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJTZXJ2aWNlV29ya2VyIHJlYWR5IHJldHVybmluZyBwcm9taXNlIGFuZCB3YWl0aW5nLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5vbmNlKFwiY29udHJvbGxlcmNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlcnZpY2VXb3JrZXIgcmVhZHkgcmVjZWl2ZWQgcmVzcG9uc2VcIilcbiAgICAgICAgICAgICAgICBmdWxmaWxsKFJlZ2lzdHJhdGlvbkluc3RhbmNlKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICBcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcImNvbnRyb2xsZXJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25jb250cm9sbGVyY2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBpdCBleHBlY3QgYXJndW1lbnRzPyBVbmNsZWFyLlxuICAgICAgICAgICAgICAgIHRoaXMub25jb250cm9sbGVyY2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJtZXNzYWdlXCIsIChlOk1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGSVJFRCBNRVNTQUdFXCIsIHRoaXMub25tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXIuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9ubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25tZXNzYWdlKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBSZWdpc3RyYXRpb25JbnN0YW5jZS5hY3RpdmU7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXIodXJsVG9SZWdpc3RlcjpzdHJpbmcsIG9wdGlvbnM6IFNlcnZpY2VXb3JrZXJSZWdpc3Rlck9wdGlvbnMpOiBQcm9taXNlPFNlcnZpY2VXb3JrZXJSZWdpc3RyYXRpb24+IHtcbiAgICAgICAgbGV0IGZ1bGxTV1VSTCA9IHVybC5yZXNvbHZlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLCB1cmxUb1JlZ2lzdGVyKTtcbiAgICAgICBcbiAgICAgICAgY29uc29sZS5pbmZvKFwiQXR0ZW1wdGluZyB0byByZWdpc3RlciBzZXJ2aWNlIHdvcmtlciBhdFwiLCBmdWxsU1dVUkwpO1xuICAgIFxuICAgICAgICByZXR1cm4gc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJyZWdpc3RlclwiLFxuICAgICAgICAgICAgc3dQYXRoOiBmdWxsU1dVUkwsXG4gICAgICAgICAgICBzY29wZTogb3B0aW9ucyA/IG9wdGlvbnMuc2NvcGUgOiBudWxsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXNwb25zZTpTZXJ2aWNlV29ya2VyTWF0Y2gpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JrZXIgPSBwcm9jZXNzTmV3V29ya2VyTWF0Y2gocmVzcG9uc2UpO1xuICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBSZWdpc3RyYXRpb25JbnN0YW5jZTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNsYWltZWRCeU5ld1dvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG4gICAgICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmNsZWFyQWxsSW5zdGFuY2VzT2ZTZXJ2aWNlV29ya2VyKHN3KTtcbiAgICAgICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlID0gc3c7XG4gICAgICAgIHRoaXMuY29udHJvbGxlciA9IHN3O1xuICAgICAgICB0aGlzLmVtaXQoXCJjb250cm9sbGVyY2hhbmdlXCIsIHN3KTtcbiAgICB9XG5cbiAgICBnZXRSZWdpc3RyYXRpb24oc2NvcGU6c3RyaW5nKTogUHJvbWlzZTxTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoUmVnaXN0cmF0aW9uSW5zdGFuY2UpO1xuICAgIH1cblxuICAgIGdldFJlZ2lzdHJhdGlvbnMoKTogUHJvbWlzZTxTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uW10+IHtcbiAgICAgICAgLy8gTm90IHN1cmUgd2h5IHdlIGVuZCB1cCB3aXRoIG1vcmUgdGhhbiBvbmUgcmVnaXN0cmF0aW9uLCBldmVyLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtSZWdpc3RyYXRpb25JbnN0YW5jZV0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNlcnZpY2VXb3JrZXJDb250YWluZXIgPSBuZXcgSHlicmlkU2VydmljZVdvcmtlckNvbnRhaW5lcigpOyBcblxuZW51bSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlIHtcbiAgICBJbnN0YWxsaW5nID0gMCxcbiAgICBJbnN0YWxsZWQsXG4gICAgQWN0aXZhdGluZyxcbiAgICBBY3RpdmF0ZWQsXG4gICAgUmVkdW5kYW50XG59XG5cbmludGVyZmFjZSBTZXJ2aWNlV29ya2VyTWF0Y2gge1xuICAgIHVybDogc3RyaW5nLFxuICAgIGluc3RhbGxTdGF0ZTogU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSxcbiAgICBpbnN0YW5jZUlkOm51bWJlcixcbiAgICBzY29wZTogc3RyaW5nXG59XG5cbmNvbnN0IHNlcnZpY2VXb3JrZXJSZWNvcmRzOiB7W2lkOm51bWJlcl0gOiBIeWJyaWRTZXJ2aWNlV29ya2VyfSA9IHt9O1xuXG5mdW5jdGlvbiBwcm9jZXNzTmV3V29ya2VyTWF0Y2gobmV3TWF0Y2g6U2VydmljZVdvcmtlck1hdGNoKSB7XG4gICAgLy8gaWYgd2UgYWxyZWFkeSBoYXZlIGEgcmVjb3JkLCB1c2UgdGhhdCBvbmVcbiAgICBsZXQgd29ya2VyID0gc2VydmljZVdvcmtlclJlY29yZHNbbmV3TWF0Y2guaW5zdGFuY2VJZF07XG5cbiAgICBpZiAoIXdvcmtlcikge1xuICAgICAgICAvLyBvdGhlcndpc2UsIG1ha2UgYSBuZXcgb25lXG4gICAgICAgIHdvcmtlciA9IG5ldyBIeWJyaWRTZXJ2aWNlV29ya2VyKG5ld01hdGNoLmluc3RhbmNlSWQsIG5ld01hdGNoLnVybCwgbmV3TWF0Y2guc2NvcGUsIG5ld01hdGNoLmluc3RhbGxTdGF0ZSk7XG4gICAgICAgIHNlcnZpY2VXb3JrZXJSZWNvcmRzW25ld01hdGNoLmluc3RhbmNlSWRdID0gd29ya2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmtlci51cGRhdGVTdGF0ZShuZXdNYXRjaC5pbnN0YWxsU3RhdGUpO1xuICAgIH1cblxuICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFzc2lnbkFjY29yZGluZ1RvSW5zdGFsbFN0YXRlKHdvcmtlcik7XG5cbiAgICBjb25zb2xlLmxvZyhcIlNXIENIQU5HRVwiLCBuZXdNYXRjaCk7XG4gICAgcmV0dXJuIHdvcmtlcjtcbn1cblxuc2VydmljZVdvcmtlckJyaWRnZS5hZGRMaXN0ZW5lcignc3ctY2hhbmdlJywgcHJvY2Vzc05ld1dvcmtlck1hdGNoKTtcblxuc2VydmljZVdvcmtlckJyaWRnZS5hZGRMaXN0ZW5lcignY2xhaW1lZCcsIGZ1bmN0aW9uKG1hdGNoOlNlcnZpY2VXb3JrZXJNYXRjaCkge1xuICAgIGxldCB3b3JrZXIgPSBwcm9jZXNzTmV3V29ya2VyTWF0Y2gobWF0Y2gpO1xuICAgIGNvbnNvbGUubG9nKFwiQ2xhaW1lZCBieSBuZXcgd29ya2VyXCIpXG4gICAgU2VydmljZVdvcmtlckNvbnRhaW5lci5jbGFpbWVkQnlOZXdXb3JrZXIod29ya2VyKTtcbn0pXG4vLyBPbiBwYWdlIGxvYWQgd2UgZ3JhYiBhbGwgdGhlIGN1cnJlbnRseSBhcHBsaWNhYmxlIHNlcnZpY2Ugd29ya2Vyc1xuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFNlcnZpY2VXb3JrZXJzKCkge1xuICAgIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgIG9wZXJhdGlvbjogXCJnZXRBbGxcIlxuICAgIH0pLnRoZW4oKHdvcmtlcnM6IFNlcnZpY2VXb3JrZXJNYXRjaFtdKSA9PiB7XG4gICAgICAgIHdvcmtlcnMuZm9yRWFjaCgod29ya2VyKSA9PiB7XG4gICAgICAgICAgICBzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0gPSBuZXcgSHlicmlkU2VydmljZVdvcmtlcih3b3JrZXIuaW5zdGFuY2VJZCwgd29ya2VyLnVybCwgXCJcIiwgd29ya2VyLmluc3RhbGxTdGF0ZSk7XG4gICAgICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0pO1xuICAgICAgICB9KVxuICAgIH0pXG59XG5cbnJlZnJlc2hTZXJ2aWNlV29ya2VycygpO1xuXG4iLCJpbXBvcnQge1NlcnZpY2VXb3JrZXJDb250YWluZXIsIHNlcnZpY2VXb3JrZXJCcmlkZ2V9IGZyb20gJy4vc3ctbWFuYWdlcic7XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2Uub24oXCJwb3N0TWVzc2FnZVwiLCAoZTphbnkpID0+IHtcbiAgICBcbiAgICBsZXQgbWVzc2FnZTpzdHJpbmcgPSBlLmFyZ3VtZW50c1swXTtcbiAgICBsZXQgbnVtYmVyT2ZQb3J0czpudW1iZXIgPSBlLmFyZ3VtZW50c1sxXTtcbiAgIFxuICAgIC8vIFdlIGNhbid0IHNlbmQgTWVzc2FnZVBvcnRzIGFjcm9zcyB0aGUgYnJpZGdlLCBzbyBpbnN0ZWFkIHdlIGNyZWF0ZSBuZXdcbiAgICAvLyBNZXNzYWdlQ2hhbm5lbHMsIGxpc3RlbiBmb3IgcmVzcG9uc2VzLCB0aGVuIHN0cmluZ2lmeSBhbmQgcmV0dXJuIHRoZW0uXG5cbiAgICBsZXQgY2hhbm5lbHM6TWVzc2FnZUNoYW5uZWxbXSA9IFtdO1xuICAgIGxldCBjaGFubmVsUmVzcG9uc2VzOmFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mUG9ydHM7IGkrKykge1xuICAgICAgICBsZXQgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICBjaGFubmVsUmVzcG9uc2VzW2ldID0gbnVsbDtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUkVDRUlWRUQgUE9SVCBXUklURVwiLCBpLCBtc2cuZGF0YSlcbiAgICAgICAgICAgIGNoYW5uZWxSZXNwb25zZXNbaV0gPSBtc2cuZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBjaGFubmVscy5wdXNoKGNoYW5uZWwpO1xuICAgIH1cblxuICAgIGxldCBwb3J0c1RvU2VuZCA9IGNoYW5uZWxzLm1hcCgoYykgPT4gYy5wb3J0MSk7XG5cbiAgICBsZXQgZXYgPSBuZXcgTWVzc2FnZUV2ZW50KFwibWVzc2FnZVwiLCB7XG4gICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgIHBvcnRzOiBwb3J0c1RvU2VuZFxuICAgIH0pO1xuXG4gICAgbGV0IHByb21pc2VUb1Jlc29sdmU6UHJvbWlzZTxhbnk+ID0gbnVsbDtcblxuICAgIChldiBhcyBhbnkpLndhaXRVbnRpbCA9IGZ1bmN0aW9uKHByb21pc2U6UHJvbWlzZTxhbnk+KSB7XG4gICAgICAgIHByb21pc2VUb1Jlc29sdmUgPSBwcm9taXNlO1xuICAgIH1cbiAgIFxuICAgIFNlcnZpY2VXb3JrZXJDb250YWluZXIuZGlzcGF0Y2hFdmVudChldik7XG5cbiAgICBlLnJlc3BvbmRXaXRoKFxuICAgICAgICBQcm9taXNlLnJlc29sdmUocHJvbWlzZVRvUmVzb2x2ZSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgdG8gdXNlIGEgdGltZW91dCBiZWNhdXNlIE1lc3NhZ2VQb3J0cyBkbyBub3QgYXBwZWFyXG4gICAgICAgICAgICAgICAgLy8gdG8gZmlyZSBvbm1lc3NhZ2Ugc3luY2hyb25vdXNseS4gQnV0IGEgMW1zIHRpbWVvdXQgc2VlbXNcbiAgICAgICAgICAgICAgICAvLyB0byBjYXRjaCBpdC5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBmdWxmaWxsKGNoYW5uZWxSZXNwb25zZXMubWFwKChyKSA9PiBKU09OLnN0cmluZ2lmeShyKSkpO1xuICAgICAgICAgICAgICAgIH0sMSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICApXG59KTsiLCJpbXBvcnQge3NlcnZpY2VXb3JrZXJCcmlkZ2UsIFNlcnZpY2VXb3JrZXJDb250YWluZXJ9IGZyb20gJy4vc3ctbWFuYWdlcic7XG5pbXBvcnQgJy4vcmVjZWl2ZS1tZXNzYWdlJztcblxubGV0IG5hdmlnYXRvckFzQW55OmFueSA9IG5hdmlnYXRvcjtcblxubmF2aWdhdG9yQXNBbnkuc2VydmljZVdvcmtlciA9IFNlcnZpY2VXb3JrZXJDb250YWluZXI7IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwiY29uc29sZVwiKTtcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHJldHVyblN0cmluZyA9IFwiKG5vdCBzdHJpbmdpZnlhYmxlKTogXCJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuU3RyaW5nICs9IGVyci50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHVyblN0cmluZ1xuICAgIH1cbn1cblxubGV0IGxldmVscyA9IFsnZGVidWcnLCdpbmZvJywgJ2xvZycsICdlcnJvcicsICd3YXJuJ107XG5cbmxldCBjb25zb2xlOntbbGV2ZWw6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5cbmxldCBvcmlnaW5hbENvbnNvbGUgPSB3aW5kb3cuY29uc29sZSBhcyBhbnk7XG5cbih3aW5kb3cgYXMgYW55KS5jb25zb2xlID0gY29uc29sZTtcblxubGV2ZWxzLmZvckVhY2goKGxldmVsKSA9PiB7XG4gICAgY29uc29sZVtsZXZlbF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmlnaW5hbENvbnNvbGUpIHtcbiAgICAgICAgICAgIC8vIHN0aWxsIGxvZyBvdXQgdG8gd2VidmlldyBjb25zb2xlLCBpbiBjYXNlIHdlJ3JlIGF0dGFjaGVkXG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVbbGV2ZWxdLmFwcGx5KG9yaWdpbmFsQ29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcmdzQXNKU09OID0gQXJyYXkuZnJvbShhcmd1bWVudHMpLm1hcChtYWtlU3VpdGFibGUpO1xuXG4gICAgICAgIHByb21pc2VCcmlkZ2Uuc2VuZCh7XG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBhcmdzOiBhcmdzQXNKU09OXG4gICAgICAgIH0pXG4gICAgfVxufSkiLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcblxubGV0IGV2ZW50c0JyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImV2ZW50c1wiKTtcblxuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZEV2ZW50cyA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihuYW1lOlN0cmluZywgZGF0YTpTdHJpbmcpIHtcbiAgICAgICAgZXZlbnRzQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbmFtZSwgZGF0YVxuICAgICAgICB9KVxuICAgIH1cbn0iLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5leHBvcnQgZGVmYXVsdCBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJub3RpZmljYXRpb25zXCIpO1xuIiwiaW1wb3J0IHByb21pc2VCcmlkZ2UgZnJvbSAnLi9ub3RpZmljYXRpb24tYnJpZGdlJztcblxuZXhwb3J0IGNvbnN0IG5vdGlmaWNhdGlvbiA9IHtcbiAgICBwZXJtaXNzaW9uOiBcInVua25vd25cIixcbiAgICByZXF1ZXN0UGVybWlzc2lvbjogZnVuY3Rpb24oY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgIFxuXG4gICAgICAgcmV0dXJuIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicmVxdWVzdFBlcm1pc3Npb25cIlxuICAgICAgIH0pXG4gICAgICAgLnRoZW4oKG5ld1N0YXR1cykgPT4ge1xuICAgICAgICAgICAvLyBTdXBwb3J0IGRlcHJlY2F0ZWQgY2FsbGJhY2sgbWV0aG9kXG4gICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3U3RhdHVzKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICByZXR1cm4gbmV3U3RhdHVzXG4gICAgICAgfSlcbiAgICB9XG59O1xuXG5wcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgIG9wZXJhdGlvbjogXCJnZXRTdGF0dXNcIlxufSlcbi50aGVuKChzdGF0dXM6c3RyaW5nKSA9PiB7XG4gICAgLy8gY29uc29sZS5kZWJ1ZyhcIk5vdGlmaWNhdGlvbiBwZXJtaXNzaW9uOlwiLCBzdGF0dXMpXG4gICAgbm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPSBzdGF0dXM7XG59KTtcblxucHJvbWlzZUJyaWRnZS5vbihcIm5vdGlmaWNhdGlvbi1wZXJtaXNzaW9uLWNoYW5nZVwiLCAobmV3U3RhdHVzOnN0cmluZykgPT4ge1xuICAgIC8vIGNvbnNvbGUuZGVidWcoXCJSZWNlaXZlZCB1cGRhdGVkIG5vdGlmaWNhdGlvbiBwZXJtaXNzaW9uOlwiICsgbmV3U3RhdHVzKTtcbiAgICBub3RpZmljYXRpb24ucGVybWlzc2lvbiA9IHN0YXR1cztcbn0pO1xuXG4od2luZG93IGFzIGFueSkuTm90aWZpY2F0aW9uID0gbm90aWZpY2F0aW9uOyIsImltcG9ydCB7cmVmcmVzaFNlcnZpY2VXb3JrZXJzfSBmcm9tICcuLi9uYXZpZ2F0b3Ivc3ctbWFuYWdlcic7XG5cbmxldCBsb2FkZWRJbmRpY2F0b3I6SFRNTERpdkVsZW1lbnQgPSBudWxsO1xuXG4od2luZG93IGFzIGFueSkuX19zZXRIVE1MID0gZnVuY3Rpb24oaHRtbFN0cmluZzpzdHJpbmcsIGJhc2VVUkw6c3RyaW5nKSB7XG4gICAgbGV0IGluc2lkZUhUTUxUYWcgPSAvPGh0bWwoPzouKj8pPigoPzoufFxcbikqKTxcXC9odG1sPi9naW0uZXhlYyhodG1sU3RyaW5nKVsxXTtcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLG51bGwsYmFzZVVSTCk7XG4gICAgcmVmcmVzaFNlcnZpY2VXb3JrZXJzKCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IGluc2lkZUhUTUxUYWc7XG5cbiAgICAvLyB3ZSB1c2UgdGhpcyBvbiB0aGUgbmF0aXZlIHNpZGUgdG8gZGV0ZWN0IHNvbWV3aGF0IHJlbGlhYmx5IHdoZW4gYSBwYWdlIGhhcyBsb2FkZWRcbiAgICBsb2FkZWRJbmRpY2F0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGxvYWRlZEluZGljYXRvci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICBsb2FkZWRJbmRpY2F0b3Iuc3R5bGUucmlnaHQgPSBcIjBweFwiO1xuICAgIGxvYWRlZEluZGljYXRvci5zdHlsZS50b3AgPSBcIjBweFwiO1xuICAgIGxvYWRlZEluZGljYXRvci5zdHlsZS53aWR0aCA9IFwiMXB4XCI7XG4gICAgbG9hZGVkSW5kaWNhdG9yLnN0eWxlLmhlaWdodCA9IFwiMXB4XCI7XG4gICAgbG9hZGVkSW5kaWNhdG9yLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmdiKDAsMjU1LDI1NSlcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxvYWRlZEluZGljYXRvcik7XG59O1xuXG4od2luZG93IGFzIGFueSkuX19yZW1vdmVMb2FkZWRJbmRpY2F0b3IgPSBmdW5jdGlvbigpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxvYWRlZEluZGljYXRvcik7XG59IiwiLy8gaW1wb3J0ICd3aGF0d2ctZmV0Y2gnO1xuLy8gaW1wb3J0ICcuL3V0aWwvb3ZlcnJpZGUtbG9nZ2luZyc7XG5pbXBvcnQgJy4vbmF2aWdhdG9yL3NlcnZpY2Utd29ya2VyJztcbmltcG9ydCAnLi9jb25zb2xlJztcbmltcG9ydCAnLi9tZXNzYWdlcy9tZXNzYWdlLWNoYW5uZWwnO1xuaW1wb3J0ICcuL3V0aWwvZ2VuZXJpYy1ldmVudHMnO1xuaW1wb3J0ICcuL25vdGlmaWNhdGlvbi9ub3RpZmljYXRpb24nO1xuaW1wb3J0ICcuL3V0aWwvc2V0LWRvY3VtZW50LWh0bWwnO1xuXG53aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbn1cblxuLy8gZG9jdW1lbnQuYm9keS5pbm5lckhUTUw9XCJUSElTIExPQURFRFwiIl0sIm5hbWVzIjpbImFyZ3VtZW50cyIsInRoaXMiLCJjb21tb25qc0hlbHBlcnMuY29tbW9uanNHbG9iYWwiLCJjb21tb25qc0hlbHBlcnMuaW50ZXJvcERlZmF1bHQiLCJ3ZWJraXQiLCJ1cmwucmVzb2x2ZSIsInByb21pc2VCcmlkZ2UiLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLFlBQVksQ0FBQzs7QUFFYixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQzs7Ozs7Ozs7OztBQVUxQyxJQUFJLE1BQU0sR0FBRyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7QUFVL0QsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7RUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztFQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLENBQUM7Q0FDM0I7Ozs7Ozs7OztBQVNELFNBQVMsWUFBWSxHQUFHLHdCQUF3Qjs7Ozs7Ozs7QUFRaEQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcs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QyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzlELEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ2xFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUN0RSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQy9FOztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDbEQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsV0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVCOztJQUVELFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDN0MsTUFBTTtJQUNMLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO1FBQ3pCLENBQUMsQ0FBQzs7SUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMzQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUVDLE1BQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOztNQUVwRixRQUFRLEdBQUc7UUFDVCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzFELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzlELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNsRTtVQUNFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHRCxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDNUI7O1VBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNyRDtLQUNGO0dBQ0Y7O0VBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYixDQUFDOzs7Ozs7Ozs7O0FBVUYsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUM7TUFDdEMsR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7T0FDaEQ7SUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRztNQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVE7S0FDNUIsQ0FBQztHQUNIOztFQUVELE9BQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7Ozs7Ozs7OztBQVVGLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQzlELElBQUksUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxFQUFFLElBQUksQ0FB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QUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztDQUN4Rjs7QUFFRCxBQUFPLFNBQVMsVUFBVSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtJQUN0RCxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0gsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDakU7O0FBRUQsQUFBTyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUM1Rzs7QUFFRCxBQUFPLFNBQVMsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7SUFDM0MsT0FBTyxVQUFVLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUFFO0NBQ3hFOztBQUVELEFBQU8sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQ3pELE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUN2RCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDM0YsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDL0ksSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUNuRSxDQUFDLENBQUM7Q0FDTjs7QUMzQkQsSUFBTSxNQUFNLEdBQUksTUFBYyxDQUFDLE1BQU0sQ0FBQzs7QUFHdEMsSUFBTSxnQkFBZ0IsR0FBNkIsRUFBRSxDQUFDO0FBQ3RELElBQU0sY0FBYyxHQUF5QyxFQUFFLENBQUM7QUFDL0QsTUFBYyxDQUFDLHdCQUF3QixHQUFHLGdCQUFnQixDQUFDO0FBQzNELE1BQWMsQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUM7QUFFM0M7SUFBbUMsd0NBQVk7SUFLbEQsOEJBQVksSUFBVztRQUNuQixpQkFBTyxDQUFBO1FBSkgsa0JBQWEsR0FBMEIsRUFBRSxDQUFBO1FBSzdDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQW9CLElBQUksc0JBQWtCLENBQUMsQ0FBQztTQUMvRDtRQUVELElBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBdUIsSUFBSSx3QkFBbUIsQ0FBQyxDQUFBO1NBQ2xFO1FBRUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMvQjtJQUVELDRDQUFhLEdBQWIsVUFBYyxPQUFXOztRQUF6QixrQkFBQTs7UUFBQSxpQkFtQkM7UUFmRyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDdEIsT0FBT0MsTUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN0QyxhQUFhLEVBQUUsQ0FBQztTQUNuQjtRQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTs7WUFJL0IsS0FBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0RCxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFDLGVBQUEsYUFBYSxFQUFFLFNBQUEsT0FBTyxFQUFDLENBQUMsQ0FBQTtZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBQyxlQUFBLGFBQWEsRUFBRSxTQUFBLE9BQU8sRUFBQyxDQUFDLENBQUM7U0FFM0UsQ0FBQyxDQUFBO0tBRUw7SUFFRCwrQ0FBZ0IsR0FBaEIsVUFBaUIsSUFBVyxFQUFFLElBQWEsRUFBRSxhQUFvQjs7UUFBakUsaUJBZ0NDO1FBNUJHLElBQUksWUFBWSxHQUFnQixJQUFJLENBQUE7UUFFcEMsSUFBSSxXQUFXLEdBQUcsVUFBUyxDQUFLO1lBQzVCLFlBQVksR0FBRyxDQUFDLENBQUM7U0FDcEIsQ0FBQTtRQUVELElBQUksU0FBUyxHQUFHO1lBQ1osYUFBQSxXQUFXO1lBQ1gsU0FBUyxFQUFFLElBQUk7U0FDbEIsQ0FBQztRQUVGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTNCLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO2FBQzVCLElBQUksQ0FBQyxVQUFDLGFBQWE7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDckMsS0FBSSxDQUFDLElBQUksQ0FBQztnQkFDTixxQkFBcUIsRUFBRSxhQUFhO2dCQUNwQyxZQUFZLEVBQUUsYUFBYTthQUM5QixDQUFDLENBQUE7U0FDTCxDQUFDO2FBQ0QsS0FBSyxDQUFDLFVBQUMsR0FBRztZQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFBO1lBQ25DLEtBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ04scUJBQXFCLEVBQUUsYUFBYTtnQkFDcEMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUU7YUFDOUIsQ0FBQyxDQUFBO1NBQ0wsQ0FBQyxDQUFBO0tBQ0w7SUFFRCxtQ0FBSSxHQUFKLFVBQUssT0FBVzs7UUFHWixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBQyxTQUFBLE9BQU8sRUFBQyxDQUFDLENBQUM7S0FDNUQ7SUFFRCw4Q0FBZSxHQUFmLFVBQWdCLGFBQW9CLEVBQUUsR0FBVSxFQUFFLFFBQWE7UUFFM0QsSUFBSTtZQUNBLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7YUFDaEU7O1lBR0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7WUFFcEMsNkJBQU8sRUFBRSx3QkFBTSxDQUFpQjtZQUVyQyxJQUFJLEdBQUcsRUFBRTtnQkFDTCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUMxQjtpQkFBTTtnQkFDSCxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDckI7U0FDSDtRQUFBLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN0QjtLQUNKO0lBRUwsMkJBQUM7Q0FBQSxDQXpHeUMsWUFBWSxHQXlHckQsQUFDRDs7OztBQ2xIQSxDQUFDLENBQUMsU0FBUyxJQUFJLEVBQUU7OztDQUdoQixJQUFJLFdBQVcsR0FBRyxPQUFPLE9BQU8sSUFBSSxRQUFRLElBQUksT0FBTztFQUN0RCxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDO0NBQzlCLElBQUksVUFBVSxHQUFHLE9BQU8sTUFBTSxJQUFJLFFBQVEsSUFBSSxNQUFNO0VBQ25ELENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUM7Q0FDNUIsSUFBSSxVQUFVLEdBQUcsT0FBT0MsY0FBTSxJQUFJLFFBQVEsSUFBSUEsY0FBTSxDQUFDO0NBQ3JEO0VBQ0MsVUFBVSxDQUFDLE1BQU0sS0FBSyxVQUFVO0VBQ2hDLFVBQVUsQ0FBQyxNQUFNLEtBQUssVUFBVTtFQUNoQyxVQUFVLENBQUMsSUFBSSxLQUFLLFVBQVU7R0FDN0I7RUFDRCxJQUFJLEdBQUcsVUFBVSxDQUFDO0VBQ2xCOzs7Ozs7O0NBT0QsSUFBSSxRQUFROzs7Q0FHWixNQUFNLEdBQUcsVUFBVTs7O0NBR25CLElBQUksR0FBRyxFQUFFO0NBQ1QsSUFBSSxHQUFHLENBQUM7Q0FDUixJQUFJLEdBQUcsRUFBRTtDQUNULElBQUksR0FBRyxFQUFFO0NBQ1QsSUFBSSxHQUFHLEdBQUc7Q0FDVixXQUFXLEdBQUcsRUFBRTtDQUNoQixRQUFRLEdBQUcsR0FBRztDQUNkLFNBQVMsR0FBRyxHQUFHOzs7Q0FHZixhQUFhLEdBQUcsT0FBTztDQUN2QixhQUFhLEdBQUcsY0FBYztDQUM5QixlQUFlLEdBQUcsMkJBQTJCOzs7Q0FHN0MsTUFBTSxHQUFHO0VBQ1IsVUFBVSxFQUFFLGlEQUFpRDtFQUM3RCxXQUFXLEVBQUUsZ0RBQWdEO0VBQzdELGVBQWUsRUFBRSxlQUFlO0VBQ2hDOzs7Q0FHRCxhQUFhLEdBQUcsSUFBSSxHQUFHLElBQUk7Q0FDM0IsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLO0NBQ2xCLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxZQUFZOzs7Q0FHeEMsR0FBRyxDQUFDOzs7Ozs7Ozs7O0NBVUosU0FBUyxLQUFLLENBQUMsSUFBSSxFQUFFO0VBQ3BCLE1BQU0sVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQy9COzs7Ozs7Ozs7O0NBVUQsU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRTtFQUN2QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0VBQzFCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztFQUNoQixPQUFPLE1BQU0sRUFBRSxFQUFFO0dBQ2hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7R0FDbkM7RUFDRCxPQUFPLE1BQU0sQ0FBQztFQUNkOzs7Ozs7Ozs7Ozs7Q0FZRCxTQUFTLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFO0VBQzlCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDOUIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0VBQ2hCLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7OztHQUdyQixNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztHQUN4QixNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQ2xCOztFQUVELE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztFQUNqRCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQy9CLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3hDLE9BQU8sTUFBTSxHQUFHLE9BQU8sQ0FBQztFQUN4Qjs7Ozs7Ozs7Ozs7Ozs7O0NBZUQsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFO0VBQzNCLElBQUksTUFBTSxHQUFHLEVBQUU7TUFDWCxPQUFPLEdBQUcsQ0FBQztNQUNYLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTTtNQUN0QixLQUFLO01BQ0wsS0FBSyxDQUFDO0VBQ1YsT0FBTyxPQUFPLEdBQUcsTUFBTSxFQUFFO0dBQ3hCLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7R0FDckMsSUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxHQUFHLE1BQU0sRUFBRTs7SUFFM0QsS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sS0FBSyxNQUFNLEVBQUU7S0FDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssS0FBSyxFQUFFLEtBQUssS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0tBQ2pFLE1BQU07OztLQUdOLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkIsT0FBTyxFQUFFLENBQUM7S0FDVjtJQUNELE1BQU07SUFDTixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CO0dBQ0Q7RUFDRCxPQUFPLE1BQU0sQ0FBQztFQUNkOzs7Ozs7Ozs7O0NBVUQsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFO0VBQzFCLE9BQU8sR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLEtBQUssRUFBRTtHQUNqQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7R0FDaEIsSUFBSSxLQUFLLEdBQUcsTUFBTSxFQUFFO0lBQ25CLEtBQUssSUFBSSxPQUFPLENBQUM7SUFDakIsTUFBTSxJQUFJLGtCQUFrQixDQUFDLEtBQUssS0FBSyxFQUFFLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzVELEtBQUssR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUMvQjtHQUNELE1BQU0sSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUNwQyxPQUFPLE1BQU0sQ0FBQztHQUNkLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDWjs7Ozs7Ozs7Ozs7Q0FXRCxTQUFTLFlBQVksQ0FBQyxTQUFTLEVBQUU7RUFDaEMsSUFBSSxTQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtHQUN4QixPQUFPLFNBQVMsR0FBRyxFQUFFLENBQUM7R0FDdEI7RUFDRCxJQUFJLFNBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0dBQ3hCLE9BQU8sU0FBUyxHQUFHLEVBQUUsQ0FBQztHQUN0QjtFQUNELElBQUksU0FBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7R0FDeEIsT0FBTyxTQUFTLEdBQUcsRUFBRSxDQUFDO0dBQ3RCO0VBQ0QsT0FBTyxJQUFJLENBQUM7RUFDWjs7Ozs7Ozs7Ozs7OztDQWFELFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUU7OztFQUdsQyxPQUFPLEtBQUssR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDM0Q7Ozs7Ozs7Q0FPRCxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRTtFQUMzQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDVixLQUFLLEdBQUcsU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQztFQUNyRCxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQztFQUNsQyw4QkFBOEIsS0FBSyxHQUFHLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUU7R0FDM0UsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUM7R0FDckM7RUFDRCxPQUFPLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUMvRDs7Ozs7Ozs7O0NBU0QsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFOztFQUV0QixJQUFJLE1BQU0sR0FBRyxFQUFFO01BQ1gsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNO01BQzFCLEdBQUc7TUFDSCxDQUFDLEdBQUcsQ0FBQztNQUNMLENBQUMsR0FBRyxRQUFRO01BQ1osSUFBSSxHQUFHLFdBQVc7TUFDbEIsS0FBSztNQUNMLENBQUM7TUFDRCxLQUFLO01BQ0wsSUFBSTtNQUNKLENBQUM7TUFDRCxDQUFDO01BQ0QsS0FBSztNQUNMLENBQUM7O01BRUQsVUFBVSxDQUFDOzs7Ozs7RUFNZixLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztFQUNyQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7R0FDZCxLQUFLLEdBQUcsQ0FBQyxDQUFDO0dBQ1Y7O0VBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUU7O0dBRTNCLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7SUFDaEMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ25CO0dBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDakM7Ozs7O0VBS0QsS0FBSyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsV0FBVyw2QkFBNkI7Ozs7Ozs7R0FPdkYsS0FBSyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksc0JBQXNCLENBQUMsSUFBSSxJQUFJLEVBQUU7O0lBRTlELElBQUksS0FBSyxJQUFJLFdBQVcsRUFBRTtLQUN6QixLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDdkI7O0lBRUQsS0FBSyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFaEQsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO0tBQ3JELEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNsQjs7SUFFRCxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDOztJQUU1RCxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7S0FDZCxNQUFNO0tBQ047O0lBRUQsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsRUFBRTtLQUNuQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDbEI7O0lBRUQsQ0FBQyxJQUFJLFVBQVUsQ0FBQzs7SUFFaEI7O0dBRUQsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7O0dBSXZDLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0lBQ2hDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNsQjs7R0FFRCxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztHQUNwQixDQUFDLElBQUksR0FBRyxDQUFDOzs7R0FHVCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7R0FFekI7O0VBRUQsT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDMUI7Ozs7Ozs7OztDQVNELFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtFQUN0QixJQUFJLENBQUM7TUFDRCxLQUFLO01BQ0wsY0FBYztNQUNkLFdBQVc7TUFDWCxJQUFJO01BQ0osQ0FBQztNQUNELENBQUM7TUFDRCxDQUFDO01BQ0QsQ0FBQztNQUNELENBQUM7TUFDRCxZQUFZO01BQ1osTUFBTSxHQUFHLEVBQUU7O01BRVgsV0FBVzs7TUFFWCxxQkFBcUI7TUFDckIsVUFBVTtNQUNWLE9BQU8sQ0FBQzs7O0VBR1osS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7O0VBRzFCLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDOzs7RUFHM0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQztFQUNiLEtBQUssR0FBRyxDQUFDLENBQUM7RUFDVixJQUFJLEdBQUcsV0FBVyxDQUFDOzs7RUFHbkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUU7R0FDakMsWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUN4QixJQUFJLFlBQVksR0FBRyxJQUFJLEVBQUU7SUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzlDO0dBQ0Q7O0VBRUQsY0FBYyxHQUFHLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDOzs7Ozs7RUFNN0MsSUFBSSxXQUFXLEVBQUU7R0FDaEIsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUN2Qjs7O0VBR0QsT0FBTyxjQUFjLEdBQUcsV0FBVyxFQUFFOzs7O0dBSXBDLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDN0MsWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixJQUFJLFlBQVksSUFBSSxDQUFDLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRTtLQUMxQyxDQUFDLEdBQUcsWUFBWSxDQUFDO0tBQ2pCO0lBQ0Q7Ozs7R0FJRCxxQkFBcUIsR0FBRyxjQUFjLEdBQUcsQ0FBQyxDQUFDO0dBQzNDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxJQUFJLHFCQUFxQixDQUFDLEVBQUU7SUFDNUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2xCOztHQUVELEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUM7R0FDekMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7R0FFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRTtJQUNqQyxZQUFZLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUV4QixJQUFJLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFO0tBQ3pDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNsQjs7SUFFRCxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQUU7O0tBRXRCLEtBQUssQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLElBQUksRUFBRTtNQUN4RCxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztNQUM1RCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7T0FDVixNQUFNO09BQ047TUFDRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUNoQixVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztNQUN0QixNQUFNLENBQUMsSUFBSTtPQUNWLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztPQUM3RCxDQUFDO01BQ0YsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUM7TUFDaEM7O0tBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwRCxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxjQUFjLElBQUksV0FBVyxDQUFDLENBQUM7S0FDMUUsS0FBSyxHQUFHLENBQUMsQ0FBQztLQUNWLEVBQUUsY0FBYyxDQUFDO0tBQ2pCO0lBQ0Q7O0dBRUQsRUFBRSxLQUFLLENBQUM7R0FDUixFQUFFLENBQUMsQ0FBQzs7R0FFSjtFQUNELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN2Qjs7Ozs7Ozs7Ozs7OztDQWFELFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRTtFQUN6QixPQUFPLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxNQUFNLEVBQUU7R0FDeEMsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztNQUM5QixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztNQUNyQyxNQUFNLENBQUM7R0FDVixDQUFDLENBQUM7RUFDSDs7Ozs7Ozs7Ozs7OztDQWFELFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRTtFQUN2QixPQUFPLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxNQUFNLEVBQUU7R0FDeEMsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztNQUM5QixNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztNQUN2QixNQUFNLENBQUM7R0FDVixDQUFDLENBQUM7RUFDSDs7Ozs7Q0FLRCxRQUFRLEdBQUc7Ozs7OztFQU1WLFNBQVMsRUFBRSxPQUFPOzs7Ozs7OztFQVFsQixNQUFNLEVBQUU7R0FDUCxRQUFRLEVBQUUsVUFBVTtHQUNwQixRQUFRLEVBQUUsVUFBVTtHQUNwQjtFQUNELFFBQVEsRUFBRSxNQUFNO0VBQ2hCLFFBQVEsRUFBRSxNQUFNO0VBQ2hCLFNBQVMsRUFBRSxPQUFPO0VBQ2xCLFdBQVcsRUFBRSxTQUFTO0VBQ3RCLENBQUM7Ozs7O0NBS0Y7RUFDQyxPQUFPLE1BQU0sSUFBSSxVQUFVO0VBQzNCLE9BQU8sTUFBTSxDQUFDLEdBQUcsSUFBSSxRQUFRO0VBQzdCLE1BQU0sQ0FBQyxHQUFHO0dBQ1Q7RUFDRCxNQUFNLENBQUMsVUFBVSxFQUFFLFdBQVc7R0FDN0IsT0FBTyxRQUFRLENBQUM7R0FDaEIsQ0FBQyxDQUFDO0VBQ0gsTUFBTSxJQUFJLFdBQVcsSUFBSSxVQUFVLEVBQUU7RUFDckMsSUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLFdBQVcsRUFBRTtHQUNsQyxVQUFVLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztHQUM5QixNQUFNO0dBQ04sS0FBSyxHQUFHLElBQUksUUFBUSxFQUFFO0lBQ3JCLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25FO0dBQ0Q7RUFDRCxNQUFNO0VBQ04sSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7RUFDekI7O0NBRUQsQ0FBQ0QsY0FBSSxDQUFDLEVBQUU7Ozs7Ozs7Ozs7O0FDamhCVCxZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRztFQUNmLFFBQVEsRUFBRSxTQUFTLEdBQUcsRUFBRTtJQUN0QixPQUFPLE9BQU8sR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDO0dBQ2pDO0VBQ0QsUUFBUSxFQUFFLFNBQVMsR0FBRyxFQUFFO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksR0FBRyxLQUFLLElBQUksQ0FBQztHQUNqRDtFQUNELE1BQU0sRUFBRSxTQUFTLEdBQUcsRUFBRTtJQUNwQixPQUFPLEdBQUcsS0FBSyxJQUFJLENBQUM7R0FDckI7RUFDRCxpQkFBaUIsRUFBRSxTQUFTLEdBQUcsRUFBRTtJQUMvQixPQUFPLEdBQUcsSUFBSSxJQUFJLENBQUM7R0FDcEI7Q0FDRixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNNRixZQUFZLENBQUM7Ozs7O0FBS2IsU0FBUyxjQUFjLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtFQUNqQyxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDeEQ7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRTtFQUM5QyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQztFQUNqQixFQUFFLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztFQUNmLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQzs7RUFFYixJQUFJLE9BQU8sRUFBRSxLQUFLLFFBQVEsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUM3QyxPQUFPLEdBQUcsQ0FBQztHQUNaOztFQUVELElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztFQUNuQixFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7RUFFbkIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0VBQ25CLElBQUksT0FBTyxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQUU7SUFDbEQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7R0FDM0I7O0VBRUQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQzs7RUFFcEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxPQUFPLEVBQUU7SUFDaEMsR0FBRyxHQUFHLE9BQU8sQ0FBQztHQUNmOztFQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDNUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ2hDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNuQixJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7O0lBRXJCLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRTtNQUNaLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztNQUN4QixJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDMUIsTUFBTTtNQUNMLElBQUksR0FBRyxDQUFDLENBQUM7TUFDVCxJQUFJLEdBQUcsRUFBRSxDQUFDO0tBQ1g7O0lBRUQsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFN0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUU7TUFDM0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ2hDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEIsTUFBTTtNQUNMLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN0QjtHQUNGOztFQUVELE9BQU8sR0FBRyxDQUFDO0NBQ1osQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMxREYsWUFBWSxDQUFDOztBQUViLElBQUksa0JBQWtCLEdBQUcsU0FBUyxDQUFDLEVBQUU7RUFDbkMsUUFBUSxPQUFPLENBQUM7SUFDZCxLQUFLLFFBQVE7TUFDWCxPQUFPLENBQUMsQ0FBQzs7SUFFWCxLQUFLLFNBQVM7TUFDWixPQUFPLENBQUMsR0FBRyxNQUFNLEdBQUcsT0FBTyxDQUFDOztJQUU5QixLQUFLLFFBQVE7TUFDWCxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDOztJQUU5QjtNQUNFLE9BQU8sRUFBRSxDQUFDO0dBQ2I7Q0FDRixDQUFDOztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUU7RUFDNUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUM7RUFDakIsRUFBRSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7RUFDZixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7SUFDaEIsR0FBRyxHQUFHLFNBQVMsQ0FBQztHQUNqQjs7RUFFRCxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtJQUMzQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO01BQ3RDLElBQUksRUFBRSxHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO01BQ3hELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUN6QixPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7VUFDNUIsT0FBTyxFQUFFLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN2RCxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2QsTUFBTTtRQUNMLE9BQU8sRUFBRSxHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDNUQ7S0FDRixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztHQUVkOztFQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUM7RUFDckIsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7U0FDakQsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUNwRCxDQUFDOzs7Ozs7Ozs7OztBQy9ERixZQUFZLENBQUM7O0FBRWIsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHRSw0QkFBbUIsQ0FBQztBQUNyRCxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEdBQUdBLDRCQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNrQnpELFlBQVksQ0FBQzs7QUFFYixJQUFJLFFBQVEsR0FBR0EsMEJBQW1CLENBQUM7QUFDbkMsSUFBSSxJQUFJLEdBQUdBLDBCQUFpQixDQUFDOztBQUU3QixPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztBQUN6QixPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztBQUM3QixPQUFPLENBQUMsYUFBYSxHQUFHLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDOztBQUUzQixPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQzs7QUFFbEIsU0FBUyxHQUFHLEdBQUc7RUFDYixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztFQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztFQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztFQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztFQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztDQUNsQjs7Ozs7O0FBTUQsSUFBSSxlQUFlLEdBQUcsbUJBQW1CO0lBQ3JDLFdBQVcsR0FBRyxVQUFVOzs7SUFHeEIsaUJBQWlCLEdBQUcsb0NBQW9DOzs7O0lBSXhELE1BQU0sR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7OztJQUdwRCxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7OztJQUd2RCxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDOzs7OztJQUtsQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUMzRCxlQUFlLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztJQUNqQyxjQUFjLEdBQUcsR0FBRztJQUNwQixtQkFBbUIsR0FBRyx3QkFBd0I7SUFDOUMsaUJBQWlCLEdBQUcsOEJBQThCOztJQUVsRCxjQUFjLEdBQUc7TUFDZixZQUFZLEVBQUUsSUFBSTtNQUNsQixhQUFhLEVBQUUsSUFBSTtLQUNwQjs7SUFFRCxnQkFBZ0IsR0FBRztNQUNqQixZQUFZLEVBQUUsSUFBSTtNQUNsQixhQUFhLEVBQUUsSUFBSTtLQUNwQjs7SUFFRCxlQUFlLEdBQUc7TUFDaEIsTUFBTSxFQUFFLElBQUk7TUFDWixPQUFPLEVBQUUsSUFBSTtNQUNiLEtBQUssRUFBRSxJQUFJO01BQ1gsUUFBUSxFQUFFLElBQUk7TUFDZCxNQUFNLEVBQUUsSUFBSTtNQUNaLE9BQU8sRUFBRSxJQUFJO01BQ2IsUUFBUSxFQUFFLElBQUk7TUFDZCxNQUFNLEVBQUUsSUFBSTtNQUNaLFNBQVMsRUFBRSxJQUFJO01BQ2YsT0FBTyxFQUFFLElBQUk7S0FDZDtJQUNELFdBQVcsR0FBR0EsMEJBQXNCLENBQUM7O0FBRXpDLFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRTtFQUMxRCxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsWUFBWSxHQUFHLEVBQUUsT0FBTyxHQUFHLENBQUM7O0VBRWhFLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDO0VBQ2hCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLENBQUM7RUFDbEQsT0FBTyxDQUFDLENBQUM7Q0FDVjs7QUFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxTQUFTLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRTtFQUN2RSxrQkFBQTs7RUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUM7SUFDMUIsTUFBTSxJQUFJLFNBQVMsQ0FBQyx3Q0FBd0MsR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0dBQzVFOzs7OztFQUtELElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO01BQzdCLFFBQVE7VUFDSixDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRztNQUNwRSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7TUFDNUIsVUFBVSxHQUFHLEtBQUssQ0FBQztFQUN2QixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7RUFDL0MsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7O0VBRTVCLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQzs7OztFQUlmLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O0VBRW5CLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7O0lBRXJELElBQUksVUFBVSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QyxJQUFJLFVBQVUsRUFBRTtNQUNkLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO01BQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO01BQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlCLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksZ0JBQWdCLEVBQUU7VUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkQsTUFBTTtVQUNMLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEM7T0FDRixNQUFNLElBQUksZ0JBQWdCLEVBQUU7UUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7T0FDakI7TUFDRCxPQUFPLElBQUksQ0FBQztLQUNiO0dBQ0Y7O0VBRUQsSUFBSSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUN2QyxJQUFJLEtBQUssRUFBRTtJQUNULEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JDLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0lBQzNCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUNsQzs7Ozs7O0VBTUQsSUFBSSxpQkFBaUIsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO0lBQ3BFLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQztJQUN6QyxJQUFJLE9BQU8sSUFBSSxFQUFFLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO01BQ2xELElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0tBQ3JCO0dBQ0Y7O0VBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztPQUN2QixPQUFPLEtBQUssS0FBSyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBa0JuRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMvQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxLQUFLLE9BQU8sS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDO1FBQ2pELE9BQU8sR0FBRyxHQUFHLENBQUM7S0FDakI7Ozs7SUFJRCxJQUFJLElBQUksRUFBRSxNQUFNLENBQUM7SUFDakIsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLEVBQUU7O01BRWxCLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2hDLE1BQU07OztNQUdMLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN6Qzs7OztJQUlELElBQUksTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFO01BQ2pCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztNQUM3QixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN0Qzs7O0lBR0QsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDNUMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN4QyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQztRQUNqRCxPQUFPLEdBQUcsR0FBRyxDQUFDO0tBQ2pCOztJQUVELElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQztNQUNoQixPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7SUFFeEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0lBRzNCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7OztJQUlqQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDOzs7O0lBSXBDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRztRQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQzs7O0lBR3BELElBQUksQ0FBQyxZQUFZLEVBQUU7TUFDakIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7TUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7VUFDcEMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1VBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRTs7OztjQUk1QixPQUFPLElBQUksR0FBRyxDQUFDO2FBQ2hCLE1BQU07Y0FDTCxPQUFPLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BCO1dBQ0Y7O1VBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsRUFBRTtZQUN2QyxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDeEMsSUFBSSxHQUFHLEVBQUU7Y0FDUCxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2NBQ3hCLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDekI7WUFDRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Y0FDbEIsSUFBSSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUN2QztZQUNERixNQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckMsTUFBTTtXQUNQO1NBQ0Y7T0FDRjtLQUNGOztJQUVELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsY0FBYyxFQUFFO01BQ3pDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0tBQ3BCLE1BQU07O01BRUwsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQzdDOztJQUVELElBQUksQ0FBQyxZQUFZLEVBQUU7Ozs7O01BS2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDakQ7O0lBRUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDekMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDNUIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQzs7OztJQUl2QixJQUFJLFlBQVksRUFBRTtNQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztNQUNsRSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7UUFDbkIsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7T0FDbkI7S0FDRjtHQUNGOzs7O0VBSUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTs7Ozs7SUFLL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUNqRCxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDdkIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixTQUFTO01BQ1gsSUFBSSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDakMsSUFBSSxHQUFHLEtBQUssRUFBRSxFQUFFO1FBQ2QsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztPQUNsQjtNQUNELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQztHQUNGOzs7O0VBSUQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM3QixJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRTs7SUFFZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzVCO0VBQ0QsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMzQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLElBQUksZ0JBQWdCLEVBQUU7TUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM1QztJQUNELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUMxQixNQUFNLElBQUksZ0JBQWdCLEVBQUU7O0lBRTNCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0dBQ2pCO0VBQ0QsSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7RUFDL0IsSUFBSSxlQUFlLENBQUMsVUFBVSxDQUFDO01BQzNCLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0dBQ3JCOzs7RUFHRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNoQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUM1QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztJQUMxQixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDbkI7OztFQUdELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0VBQzFCLE9BQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7O0FBR0YsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFOzs7OztFQUt0QixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM1QyxJQUFJLEVBQUUsR0FBRyxZQUFZLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2pFLE9BQU8sR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0NBQ3JCOztBQUVELEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFdBQVc7RUFDaEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7RUFDM0IsSUFBSSxJQUFJLEVBQUU7SUFDUixJQUFJLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLElBQUksSUFBSSxHQUFHLENBQUM7R0FDYjs7RUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUU7TUFDOUIsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRTtNQUM5QixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO01BQ3RCLElBQUksR0FBRyxLQUFLO01BQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQzs7RUFFZixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDYixJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7R0FDekIsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDeEIsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLFFBQVE7UUFDYixHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUMvQixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7TUFDYixJQUFJLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7S0FDekI7R0FDRjs7RUFFRCxJQUFJLElBQUksQ0FBQyxLQUFLO01BQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO01BQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRTtJQUNsQyxLQUFLLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDM0M7O0VBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEtBQUssR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOztFQUUzRCxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLFFBQVEsSUFBSSxHQUFHLENBQUM7Ozs7RUFJN0QsSUFBSSxJQUFJLENBQUMsT0FBTztNQUNaLENBQUMsQ0FBQyxRQUFRLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksS0FBSyxLQUFLLEVBQUU7SUFDOUQsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7SUFDM0IsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsUUFBUSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7R0FDdkUsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2hCLElBQUksR0FBRyxFQUFFLENBQUM7R0FDWDs7RUFFRCxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztFQUN0RCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQzs7RUFFOUQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsS0FBSyxFQUFFO0lBQ25ELE9BQU8sa0JBQWtCLENBQUMsS0FBSyxDQUFD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UUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztNQUMvQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztNQUMzQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDNUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JDLE1BQU07TUFDTCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7S0FDckM7SUFDRCxNQUFNLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQzlCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7SUFDbEMsTUFBTSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzVCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ3JELE1BQU0sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQzs7SUFFNUIsSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7TUFDcEMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7TUFDOUIsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7TUFDNUIsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JCO0lBQ0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxPQUFP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
