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
                    fulfill(RegistrationInstance);
                });
            });
        },
        enumerable: true,
        configurable: true
    });
    HybridServiceWorkerContainer.prototype.register = function (urlToRegister, options) {
        var pathToSW = resolve(window.location.href, urlToRegister);
        console.info("Attempting to register service worker at", pathToSW);
        return serviceWorkerBridge.bridgePromise({
            operation: "register",
            swPath: pathToSW,
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

var promiseBridge$2 = new PromiseOverWKMessage("notifications");

var notification = {
    permission: "unknown",
    requestPermission: function () {
        promiseBridge$2.bridgePromise({
            operation: "requestPermission"
        })
            .then(function (result) {
            console.log("request result:", result);
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

window.onerror = function (err) {
    console.error(err);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvbm9kZV9tb2R1bGVzL3B1bnljb2RlL3B1bnljb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXRpbC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmcvZGVjb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy9lbmNvZGUuanMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXJsLmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL3BvcnQtc3RvcmUudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3Byb21pc2UtdG9vbHMvbGliL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbC50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc3ctbWFuYWdlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc2VydmljZS13b3JrZXIudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvY29uc29sZS50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL2dlbmVyaWMtZXZlbnRzLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25vdGlmaWNhdGlvbi9ub3RpZmljYXRpb24tYnJpZGdlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25vdGlmaWNhdGlvbi9ub3RpZmljYXRpb24udHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvZG9jdW1lbnQtc3RhcnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuY29uc3Qgd2Via2l0ID0gKHdpbmRvdyBhcyBhbnkpLndlYmtpdDtcblxuLy8gV2UgbmVlZCB0aGVzZSBjYWxsYmFja3MgdG8gYmUgZ2xvYmFsbHkgYWNjZXNzaWJsZS5cbmNvbnN0IHByb21pc2VDYWxsYmFja3M6IHtba2V5OnN0cmluZ106IEZ1bmN0aW9ufSA9IHt9O1xuY29uc3QgcHJvbWlzZUJyaWRnZXM6IHtba2V5OnN0cmluZ106IFByb21pc2VPdmVyV0tNZXNzYWdlfSA9IHt9O1xuKHdpbmRvdyBhcyBhbnkpLl9fcHJvbWlzZUJyaWRnZUNhbGxiYWNrcyA9IHByb21pc2VDYWxsYmFja3M7XG4od2luZG93IGFzIGFueSkuX19wcm9taXNlQnJpZGdlcyA9IHByb21pc2VCcmlkZ2VzO1xuXG5leHBvcnQgY2xhc3MgUHJvbWlzZU92ZXJXS01lc3NhZ2UgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSBjYWxsYmFja0FycmF5OltGdW5jdGlvbiwgRnVuY3Rpb25dW10gPSBbXVxuICAgIHByaXZhdGUgbmFtZTpzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOnN0cmluZykge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIGlmICghd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZXNzYWdlIGhhbmRsZXIgXCIke25hbWV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdLl9yZWNlaXZlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb21pc2UgYnJpZGdlIGZvciBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c1wiYClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcHJvbWlzZUNhbGxiYWNrc1tuYW1lXSA9IHRoaXMucmVjZWl2ZVJlc3BvbnNlLmJpbmQodGhpcyk7XG4gICAgICAgIHByb21pc2VCcmlkZ2VzW25hbWVdID0gdGhpcztcbiAgICB9XG5cbiAgICBicmlkZ2VQcm9taXNlKG1lc3NhZ2U6YW55KSB7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgbmV4dCBhdmFpbGFibGUgc2xvdCBpbiBvdXIgY2FsbGJhY2sgYXJyYXlcblxuICAgICAgICBsZXQgY2FsbGJhY2tJbmRleCA9IDA7XG4gICAgICAgIHdoaWxlICh0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKGZ1bGZpbGwsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBOb3cgaW5zZXJ0IG91ciBjYWxsYmFjayBpbnRvIHRoZSBjYWNoZWQgYXJyYXkuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IFtmdWxmaWxsLCByZWplY3RdO1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlNlbmRpbmdcIiwge2NhbGxiYWNrSW5kZXgsIG1lc3NhZ2V9KVxuICAgICAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHtjYWxsYmFja0luZGV4LCBtZXNzYWdlfSk7XG5cbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIHNlbmQobWVzc2FnZTphbnkpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gd2Ugb25seSB3YW50IHRvIHNlbmQgYW5kIGFyZSBub3QgZXhwZWN0aW5nIGEgcmVzcG9uc2VcbiAgICAgICAgd2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1t0aGlzLm5hbWVdLnBvc3RNZXNzYWdlKHttZXNzYWdlfSk7XG4gICAgfVxuXG4gICAgcmVjZWl2ZVJlc3BvbnNlKGNhbGxiYWNrSW5kZXg6bnVtYmVyLCBlcnI6c3RyaW5nLCByZXNwb25zZTogYW55KSB7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHRoaXNDYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmllZCB0byB1c2UgYSBjYWxsYmFjayB0aGF0IGRpZG4ndCBleGlzdFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZnJlZSB1cCB0aGlzIHNsb3QgZm9yIG5leHQgb3BlcmF0aW9uXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgW2Z1bGZpbGwsIHJlamVjdF0gPSB0aGlzQ2FsbGJhY2s7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmdWxmaWxsKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCIvKiEgaHR0cHM6Ly9tdGhzLmJlL3B1bnljb2RlIHYxLjMuMiBieSBAbWF0aGlhcyAqL1xuOyhmdW5jdGlvbihyb290KSB7XG5cblx0LyoqIERldGVjdCBmcmVlIHZhcmlhYmxlcyAqL1xuXHR2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmXG5cdFx0IWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxuXHRcdCFtb2R1bGUubm9kZVR5cGUgJiYgbW9kdWxlO1xuXHR2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsO1xuXHRpZiAoXG5cdFx0ZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHxcblx0XHRmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCB8fFxuXHRcdGZyZWVHbG9iYWwuc2VsZiA9PT0gZnJlZUdsb2JhbFxuXHQpIHtcblx0XHRyb290ID0gZnJlZUdsb2JhbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYHB1bnljb2RlYCBvYmplY3QuXG5cdCAqIEBuYW1lIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0dmFyIHB1bnljb2RlLFxuXG5cdC8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cblx0bWF4SW50ID0gMjE0NzQ4MzY0NywgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG5cdC8qKiBCb290c3RyaW5nIHBhcmFtZXRlcnMgKi9cblx0YmFzZSA9IDM2LFxuXHR0TWluID0gMSxcblx0dE1heCA9IDI2LFxuXHRza2V3ID0gMzgsXG5cdGRhbXAgPSA3MDAsXG5cdGluaXRpYWxCaWFzID0gNzIsXG5cdGluaXRpYWxOID0gMTI4LCAvLyAweDgwXG5cdGRlbGltaXRlciA9ICctJywgLy8gJ1xceDJEJ1xuXG5cdC8qKiBSZWd1bGFyIGV4cHJlc3Npb25zICovXG5cdHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vLFxuXHRyZWdleE5vbkFTQ0lJID0gL1teXFx4MjAtXFx4N0VdLywgLy8gdW5wcmludGFibGUgQVNDSUkgY2hhcnMgKyBub24tQVNDSUkgY2hhcnNcblx0cmVnZXhTZXBhcmF0b3JzID0gL1tcXHgyRVxcdTMwMDJcXHVGRjBFXFx1RkY2MV0vZywgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG5cdC8qKiBFcnJvciBtZXNzYWdlcyAqL1xuXHRlcnJvcnMgPSB7XG5cdFx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0XHQnbm90LWJhc2ljJzogJ0lsbGVnYWwgaW5wdXQgPj0gMHg4MCAobm90IGEgYmFzaWMgY29kZSBwb2ludCknLFxuXHRcdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG5cdH0sXG5cblx0LyoqIENvbnZlbmllbmNlIHNob3J0Y3V0cyAqL1xuXHRiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW4sXG5cdGZsb29yID0gTWF0aC5mbG9vcixcblx0c3RyaW5nRnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcblxuXHQvKiogVGVtcG9yYXJ5IHZhcmlhYmxlICovXG5cdGtleTtcblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGVycm9yIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuXHQgKiBAcmV0dXJucyB7RXJyb3J9IFRocm93cyBhIGBSYW5nZUVycm9yYCB3aXRoIHRoZSBhcHBsaWNhYmxlIGVycm9yIG1lc3NhZ2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdFx0dGhyb3cgUmFuZ2VFcnJvcihlcnJvcnNbdHlwZV0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnkgYXJyYXlcblx0ICogaXRlbS5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwKGFycmF5LCBmbikge1xuXHRcdHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdFx0cmVzdWx0W2xlbmd0aF0gPSBmbihhcnJheVtsZW5ndGhdKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIHNpbXBsZSBgQXJyYXkjbWFwYC1saWtlIHdyYXBwZXIgdG8gd29yayB3aXRoIGRvbWFpbiBuYW1lIHN0cmluZ3Mgb3IgZW1haWxcblx0ICogYWRkcmVzc2VzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnlcblx0ICogY2hhcmFjdGVyLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IHN0cmluZyBvZiBjaGFyYWN0ZXJzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFja1xuXHQgKiBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcERvbWFpbihzdHJpbmcsIGZuKSB7XG5cdFx0dmFyIHBhcnRzID0gc3RyaW5nLnNwbGl0KCdAJyk7XG5cdFx0dmFyIHJlc3VsdCA9ICcnO1xuXHRcdGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHQvLyBJbiBlbWFpbCBhZGRyZXNzZXMsIG9ubHkgdGhlIGRvbWFpbiBuYW1lIHNob3VsZCBiZSBwdW55Y29kZWQuIExlYXZlXG5cdFx0XHQvLyB0aGUgbG9jYWwgcGFydCAoaS5lLiBldmVyeXRoaW5nIHVwIHRvIGBAYCkgaW50YWN0LlxuXHRcdFx0cmVzdWx0ID0gcGFydHNbMF0gKyAnQCc7XG5cdFx0XHRzdHJpbmcgPSBwYXJ0c1sxXTtcblx0XHR9XG5cdFx0Ly8gQXZvaWQgYHNwbGl0KHJlZ2V4KWAgZm9yIElFOCBjb21wYXRpYmlsaXR5LiBTZWUgIzE3LlxuXHRcdHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKHJlZ2V4U2VwYXJhdG9ycywgJ1xceDJFJyk7XG5cdFx0dmFyIGxhYmVscyA9IHN0cmluZy5zcGxpdCgnLicpO1xuXHRcdHZhciBlbmNvZGVkID0gbWFwKGxhYmVscywgZm4pLmpvaW4oJy4nKTtcblx0XHRyZXR1cm4gcmVzdWx0ICsgZW5jb2RlZDtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIG51bWVyaWMgY29kZSBwb2ludHMgb2YgZWFjaCBVbmljb2RlXG5cdCAqIGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBXaGlsZSBKYXZhU2NyaXB0IHVzZXMgVUNTLTIgaW50ZXJuYWxseSxcblx0ICogdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgYSBwYWlyIG9mIHN1cnJvZ2F0ZSBoYWx2ZXMgKGVhY2ggb2Ygd2hpY2hcblx0ICogVUNTLTIgZXhwb3NlcyBhcyBzZXBhcmF0ZSBjaGFyYWN0ZXJzKSBpbnRvIGEgc2luZ2xlIGNvZGUgcG9pbnQsXG5cdCAqIG1hdGNoaW5nIFVURi0xNi5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5lbmNvZGVgXG5cdCAqIEBzZWUgPGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBkZWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZyBUaGUgVW5pY29kZSBpbnB1dCBzdHJpbmcgKFVDUy0yKS5cblx0ICogQHJldHVybnMge0FycmF5fSBUaGUgbmV3IGFycmF5IG9mIGNvZGUgcG9pbnRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmRlY29kZShzdHJpbmcpIHtcblx0XHR2YXIgb3V0cHV0ID0gW10sXG5cdFx0ICAgIGNvdW50ZXIgPSAwLFxuXHRcdCAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuXHRcdCAgICB2YWx1ZSxcblx0XHQgICAgZXh0cmE7XG5cdFx0d2hpbGUgKGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdHZhbHVlID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdGlmICh2YWx1ZSA+PSAweEQ4MDAgJiYgdmFsdWUgPD0gMHhEQkZGICYmIGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdFx0Ly8gaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyXG5cdFx0XHRcdGV4dHJhID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdFx0aWYgKChleHRyYSAmIDB4RkMwMCkgPT0gMHhEQzAwKSB7IC8vIGxvdyBzdXJyb2dhdGVcblx0XHRcdFx0XHRvdXRwdXQucHVzaCgoKHZhbHVlICYgMHgzRkYpIDw8IDEwKSArIChleHRyYSAmIDB4M0ZGKSArIDB4MTAwMDApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIHVubWF0Y2hlZCBzdXJyb2dhdGU7IG9ubHkgYXBwZW5kIHRoaXMgY29kZSB1bml0LCBpbiBjYXNlIHRoZSBuZXh0XG5cdFx0XHRcdFx0Ly8gY29kZSB1bml0IGlzIHRoZSBoaWdoIHN1cnJvZ2F0ZSBvZiBhIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdGNvdW50ZXItLTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBzdHJpbmcgYmFzZWQgb24gYW4gYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5kZWNvZGVgXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGVuY29kZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBjb2RlUG9pbnRzIFRoZSBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmV3IFVuaWNvZGUgc3RyaW5nIChVQ1MtMikuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZW5jb2RlKGFycmF5KSB7XG5cdFx0cmV0dXJuIG1hcChhcnJheSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdHZhciBvdXRwdXQgPSAnJztcblx0XHRcdGlmICh2YWx1ZSA+IDB4RkZGRikge1xuXHRcdFx0XHR2YWx1ZSAtPSAweDEwMDAwO1xuXHRcdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKTtcblx0XHRcdFx0dmFsdWUgPSAweERDMDAgfCB2YWx1ZSAmIDB4M0ZGO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSk7XG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH0pLmpvaW4oJycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgYmFzaWMgY29kZSBwb2ludCBpbnRvIGEgZGlnaXQvaW50ZWdlci5cblx0ICogQHNlZSBgZGlnaXRUb0Jhc2ljKClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlUG9pbnQgVGhlIGJhc2ljIG51bWVyaWMgY29kZSBwb2ludCB2YWx1ZS5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50IChmb3IgdXNlIGluXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaW4gdGhlIHJhbmdlIGAwYCB0byBgYmFzZSAtIDFgLCBvciBgYmFzZWAgaWZcblx0ICogdGhlIGNvZGUgcG9pbnQgZG9lcyBub3QgcmVwcmVzZW50IGEgdmFsdWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBiYXNpY1RvRGlnaXQoY29kZVBvaW50KSB7XG5cdFx0aWYgKGNvZGVQb2ludCAtIDQ4IDwgMTApIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSAyMjtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDY1IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA2NTtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDk3IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA5Nztcblx0XHR9XG5cdFx0cmV0dXJuIGJhc2U7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBkaWdpdC9pbnRlZ2VyIGludG8gYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAc2VlIGBiYXNpY1RvRGlnaXQoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGRpZ2l0IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIGJhc2ljIGNvZGUgcG9pbnQgd2hvc2UgdmFsdWUgKHdoZW4gdXNlZCBmb3Jcblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpcyBgZGlnaXRgLCB3aGljaCBuZWVkcyB0byBiZSBpbiB0aGUgcmFuZ2Vcblx0ICogYDBgIHRvIGBiYXNlIC0gMWAuIElmIGBmbGFnYCBpcyBub24temVybywgdGhlIHVwcGVyY2FzZSBmb3JtIGlzXG5cdCAqIHVzZWQ7IGVsc2UsIHRoZSBsb3dlcmNhc2UgZm9ybSBpcyB1c2VkLiBUaGUgYmVoYXZpb3IgaXMgdW5kZWZpbmVkXG5cdCAqIGlmIGBmbGFnYCBpcyBub24temVybyBhbmQgYGRpZ2l0YCBoYXMgbm8gdXBwZXJjYXNlIGZvcm0uXG5cdCAqL1xuXHRmdW5jdGlvbiBkaWdpdFRvQmFzaWMoZGlnaXQsIGZsYWcpIHtcblx0XHQvLyAgMC4uMjUgbWFwIHRvIEFTQ0lJIGEuLnogb3IgQS4uWlxuXHRcdC8vIDI2Li4zNSBtYXAgdG8gQVNDSUkgMC4uOVxuXHRcdHJldHVybiBkaWdpdCArIDIyICsgNzUgKiAoZGlnaXQgPCAyNikgLSAoKGZsYWcgIT0gMCkgPDwgNSk7XG5cdH1cblxuXHQvKipcblx0ICogQmlhcyBhZGFwdGF0aW9uIGZ1bmN0aW9uIGFzIHBlciBzZWN0aW9uIDMuNCBvZiBSRkMgMzQ5Mi5cblx0ICogaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzQ5MiNzZWN0aW9uLTMuNFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWRhcHQoZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdFx0dmFyIGsgPSAwO1xuXHRcdGRlbHRhID0gZmlyc3RUaW1lID8gZmxvb3IoZGVsdGEgLyBkYW1wKSA6IGRlbHRhID4+IDE7XG5cdFx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRcdGZvciAoLyogbm8gaW5pdGlhbGl6YXRpb24gKi87IGRlbHRhID4gYmFzZU1pbnVzVE1pbiAqIHRNYXggPj4gMTsgayArPSBiYXNlKSB7XG5cdFx0XHRkZWx0YSA9IGZsb29yKGRlbHRhIC8gYmFzZU1pbnVzVE1pbik7XG5cdFx0fVxuXHRcdHJldHVybiBmbG9vcihrICsgKGJhc2VNaW51c1RNaW4gKyAxKSAqIGRlbHRhIC8gKGRlbHRhICsgc2tldykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scyB0byBhIHN0cmluZyBvZiBVbmljb2RlXG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGRlY29kZShpbnB1dCkge1xuXHRcdC8vIERvbid0IHVzZSBVQ1MtMlxuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGgsXG5cdFx0ICAgIG91dCxcblx0XHQgICAgaSA9IDAsXG5cdFx0ICAgIG4gPSBpbml0aWFsTixcblx0XHQgICAgYmlhcyA9IGluaXRpYWxCaWFzLFxuXHRcdCAgICBiYXNpYyxcblx0XHQgICAgaixcblx0XHQgICAgaW5kZXgsXG5cdFx0ICAgIG9sZGksXG5cdFx0ICAgIHcsXG5cdFx0ICAgIGssXG5cdFx0ICAgIGRpZ2l0LFxuXHRcdCAgICB0LFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgYmFzZU1pbnVzVDtcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHRcdC8vIHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZGVsaW1pdGVyLCBvciBgMGAgaWYgdGhlcmUgaXMgbm9uZSwgdGhlbiBjb3B5XG5cdFx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0XHRiYXNpYyA9IGlucHV0Lmxhc3RJbmRleE9mKGRlbGltaXRlcik7XG5cdFx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdFx0YmFzaWMgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0XHQvLyBpZiBpdCdzIG5vdCBhIGJhc2ljIGNvZGUgcG9pbnRcblx0XHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBkZWNvZGluZyBsb29wOiBzdGFydCBqdXN0IGFmdGVyIHRoZSBsYXN0IGRlbGltaXRlciBpZiBhbnkgYmFzaWMgY29kZVxuXHRcdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0XHRmb3IgKGluZGV4ID0gYmFzaWMgPiAwID8gYmFzaWMgKyAxIDogMDsgaW5kZXggPCBpbnB1dExlbmd0aDsgLyogbm8gZmluYWwgZXhwcmVzc2lvbiAqLykge1xuXG5cdFx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0XHQvLyB3aGljaCBnZXRzIGFkZGVkIHRvIGBpYC4gVGhlIG92ZXJmbG93IGNoZWNraW5nIGlzIGVhc2llclxuXHRcdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0XHRmb3IgKG9sZGkgPSBpLCB3ID0gMSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cblx0XHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA+PSBiYXNlIHx8IGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPCB0KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdFx0fVxuXG5cdFx0XHRvdXQgPSBvdXRwdXQubGVuZ3RoICsgMTtcblx0XHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdFx0Ly8gaW5jcmVtZW50aW5nIGBuYCBlYWNoIHRpbWUsIHNvIHdlJ2xsIGZpeCB0aGF0IG5vdzpcblx0XHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0XHRpICU9IG91dDtcblxuXHRcdFx0Ly8gSW5zZXJ0IGBuYCBhdCBwb3NpdGlvbiBgaWAgb2YgdGhlIG91dHB1dFxuXHRcdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVjczJlbmNvZGUob3V0cHV0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMgKGUuZy4gYSBkb21haW4gbmFtZSBsYWJlbCkgdG8gYVxuXHQgKiBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmNvZGUoaW5wdXQpIHtcblx0XHR2YXIgbixcblx0XHQgICAgZGVsdGEsXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50LFxuXHRcdCAgICBiYXNpY0xlbmd0aCxcblx0XHQgICAgYmlhcyxcblx0XHQgICAgaixcblx0XHQgICAgbSxcblx0XHQgICAgcSxcblx0XHQgICAgayxcblx0XHQgICAgdCxcblx0XHQgICAgY3VycmVudFZhbHVlLFxuXHRcdCAgICBvdXRwdXQgPSBbXSxcblx0XHQgICAgLyoqIGBpbnB1dExlbmd0aGAgd2lsbCBob2xkIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgaW4gYGlucHV0YC4gKi9cblx0XHQgICAgaW5wdXRMZW5ndGgsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsXG5cdFx0ICAgIGJhc2VNaW51c1QsXG5cdFx0ICAgIHFNaW51c1Q7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSBpbnB1dCBpbiBVQ1MtMiB0byBVbmljb2RlXG5cdFx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHRcdC8vIENhY2hlIHRoZSBsZW5ndGhcblx0XHRpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIHN0YXRlXG5cdFx0biA9IGluaXRpYWxOO1xuXHRcdGRlbHRhID0gMDtcblx0XHRiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzXG5cdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IDB4ODApIHtcblx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXG5cdFx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdFx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdFx0Ly8gRmluaXNoIHRoZSBiYXNpYyBzdHJpbmcgLSBpZiBpdCBpcyBub3QgZW1wdHkgLSB3aXRoIGEgZGVsaW1pdGVyXG5cdFx0aWYgKGJhc2ljTGVuZ3RoKSB7XG5cdFx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZW5jb2RpbmcgbG9vcDpcblx0XHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0XHQvLyBsYXJnZXIgb25lOlxuXHRcdFx0Zm9yIChtID0gbWF4SW50LCBqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0XHQvLyBidXQgZ3VhcmQgYWdhaW5zdCBvdmVyZmxvd1xuXHRcdFx0aGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdFx0aWYgKG0gLSBuID4gZmxvb3IoKG1heEludCAtIGRlbHRhKSAvIGhhbmRsZWRDUENvdW50UGx1c09uZSkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbHRhICs9IChtIC0gbikgKiBoYW5kbGVkQ1BDb3VudFBsdXNPbmU7XG5cdFx0XHRuID0gbTtcblxuXHRcdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IG4gJiYgKytkZWx0YSA+IG1heEludCkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PSBuKSB7XG5cdFx0XHRcdFx0Ly8gUmVwcmVzZW50IGRlbHRhIGFzIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXJcblx0XHRcdFx0XHRmb3IgKHEgPSBkZWx0YSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRcdGlmIChxIDwgdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHFNaW51c1QgPSBxIC0gdDtcblx0XHRcdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHQgKyBxTWludXNUICUgYmFzZU1pbnVzVCwgMCkpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09IGJhc2ljTGVuZ3RoKTtcblx0XHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQrK2RlbHRhO1xuXHRcdFx0KytuO1xuXG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgb3IgYW4gZW1haWwgYWRkcmVzc1xuXHQgKiB0byBVbmljb2RlLiBPbmx5IHRoZSBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGlucHV0IHdpbGwgYmUgY29udmVydGVkLCBpLmUuXG5cdCAqIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IG9uIGEgc3RyaW5nIHRoYXQgaGFzIGFscmVhZHkgYmVlblxuXHQgKiBjb252ZXJ0ZWQgdG8gVW5pY29kZS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGVkIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG9cblx0ICogY29udmVydCB0byBVbmljb2RlLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgVW5pY29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gUHVueWNvZGVcblx0ICogc3RyaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9Vbmljb2RlKGlucHV0KSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihpbnB1dCwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhQdW55Y29kZS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyBkZWNvZGUoc3RyaW5nLnNsaWNlKDQpLnRvTG93ZXJDYXNlKCkpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgVW5pY29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgb3IgYW4gZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBQdW55Y29kZS4gT25seSB0aGUgbm9uLUFTQ0lJIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCxcblx0ICogaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZiB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQncyBhbHJlYWR5IGluXG5cdCAqIEFTQ0lJLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzIHRvIGNvbnZlcnQsIGFzIGFcblx0ICogVW5pY29kZSBzdHJpbmcuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUgb3Jcblx0ICogZW1haWwgYWRkcmVzcy5cblx0ICovXG5cdGZ1bmN0aW9uIHRvQVNDSUkoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleE5vbkFTQ0lJLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/ICd4bi0tJyArIGVuY29kZShzdHJpbmcpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqIERlZmluZSB0aGUgcHVibGljIEFQSSAqL1xuXHRwdW55Y29kZSA9IHtcblx0XHQvKipcblx0XHQgKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgUHVueWNvZGUuanMgdmVyc2lvbiBudW1iZXIuXG5cdFx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdFx0ICogQHR5cGUgU3RyaW5nXG5cdFx0ICovXG5cdFx0J3ZlcnNpb24nOiAnMS4zLjInLFxuXHRcdC8qKlxuXHRcdCAqIEFuIG9iamVjdCBvZiBtZXRob2RzIHRvIGNvbnZlcnQgZnJvbSBKYXZhU2NyaXB0J3MgaW50ZXJuYWwgY2hhcmFjdGVyXG5cdFx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0XHQgKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBPYmplY3Rcblx0XHQgKi9cblx0XHQndWNzMic6IHtcblx0XHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0XHR9LFxuXHRcdCdkZWNvZGUnOiBkZWNvZGUsXG5cdFx0J2VuY29kZSc6IGVuY29kZSxcblx0XHQndG9BU0NJSSc6IHRvQVNDSUksXG5cdFx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxuXHR9O1xuXG5cdC8qKiBFeHBvc2UgYHB1bnljb2RlYCAqL1xuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcblx0Ly8gbGlrZSB0aGUgZm9sbG93aW5nOlxuXHRpZiAoXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0dHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiZcblx0XHRkZWZpbmUuYW1kXG5cdCkge1xuXHRcdGRlZmluZSgncHVueWNvZGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwdW55Y29kZTtcblx0XHR9KTtcblx0fSBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlKSB7XG5cdFx0aWYgKG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzKSB7IC8vIGluIE5vZGUuanMgb3IgUmluZ29KUyB2MC44LjArXG5cdFx0XHRmcmVlTW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcblx0XHR9IGVsc2UgeyAvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuXHRcdFx0Zm9yIChrZXkgaW4gcHVueWNvZGUpIHtcblx0XHRcdFx0cHVueWNvZGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHB1bnljb2RlW2tleV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHsgLy8gaW4gUmhpbm8gb3IgYSB3ZWIgYnJvd3NlclxuXHRcdHJvb3QucHVueWNvZGUgPSBwdW55Y29kZTtcblx0fVxuXG59KHRoaXMpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGlzU3RyaW5nOiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT09ICdzdHJpbmcnO1xuICB9LFxuICBpc09iamVjdDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIHR5cGVvZihhcmcpID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG4gIH0sXG4gIGlzTnVsbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbiAgfSxcbiAgaXNOdWxsT3JVbmRlZmluZWQ6IGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiBhcmcgPT0gbnVsbDtcbiAgfVxufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnlQcmltaXRpdmUgPSBmdW5jdGlvbih2KSB7XG4gIHN3aXRjaCAodHlwZW9mIHYpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHY7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB2ID8gJ3RydWUnIDogJ2ZhbHNlJztcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaXNGaW5pdGUodikgPyB2IDogJyc7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgc2VwLCBlcSwgbmFtZSkge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgIG9iaiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIga3MgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKGspKSArIGVxO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgICByZXR1cm4gb2JqW2tdLm1hcChmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZSh2KSk7XG4gICAgICAgIH0pLmpvaW4oc2VwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqW2tdKSk7XG4gICAgICB9XG4gICAgfSkuam9pbihzZXApO1xuXG4gIH1cblxuICBpZiAoIW5hbWUpIHJldHVybiAnJztcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUobmFtZSkpICsgZXEgK1xuICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmopKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuZGVjb2RlID0gZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vZGVjb2RlJyk7XG5leHBvcnRzLmVuY29kZSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9lbmNvZGUnKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwdW55Y29kZSA9IHJlcXVpcmUoJ3B1bnljb2RlJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5leHBvcnRzLnBhcnNlID0gdXJsUGFyc2U7XG5leHBvcnRzLnJlc29sdmUgPSB1cmxSZXNvbHZlO1xuZXhwb3J0cy5yZXNvbHZlT2JqZWN0ID0gdXJsUmVzb2x2ZU9iamVjdDtcbmV4cG9ydHMuZm9ybWF0ID0gdXJsRm9ybWF0O1xuXG5leHBvcnRzLlVybCA9IFVybDtcblxuZnVuY3Rpb24gVXJsKCkge1xuICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgdGhpcy5hdXRoID0gbnVsbDtcbiAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgdGhpcy5ob3N0bmFtZSA9IG51bGw7XG4gIHRoaXMuaGFzaCA9IG51bGw7XG4gIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgdGhpcy5xdWVyeSA9IG51bGw7XG4gIHRoaXMucGF0aG5hbWUgPSBudWxsO1xuICB0aGlzLnBhdGggPSBudWxsO1xuICB0aGlzLmhyZWYgPSBudWxsO1xufVxuXG4vLyBSZWZlcmVuY2U6IFJGQyAzOTg2LCBSRkMgMTgwOCwgUkZDIDIzOTZcblxuLy8gZGVmaW5lIHRoZXNlIGhlcmUgc28gYXQgbGVhc3QgdGhleSBvbmx5IGhhdmUgdG8gYmVcbi8vIGNvbXBpbGVkIG9uY2Ugb24gdGhlIGZpcnN0IG1vZHVsZSBsb2FkLlxudmFyIHByb3RvY29sUGF0dGVybiA9IC9eKFthLXowLTkuKy1dKzopL2ksXG4gICAgcG9ydFBhdHRlcm4gPSAvOlswLTldKiQvLFxuXG4gICAgLy8gU3BlY2lhbCBjYXNlIGZvciBhIHNpbXBsZSBwYXRoIFVSTFxuICAgIHNpbXBsZVBhdGhQYXR0ZXJuID0gL14oXFwvXFwvPyg/IVxcLylbXlxcP1xcc10qKShcXD9bXlxcc10qKT8kLyxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIHJlc2VydmVkIGZvciBkZWxpbWl0aW5nIFVSTHMuXG4gICAgLy8gV2UgYWN0dWFsbHkganVzdCBhdXRvLWVzY2FwZSB0aGVzZS5cbiAgICBkZWxpbXMgPSBbJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnXSxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG4gICAgdW53aXNlID0gWyd7JywgJ30nLCAnfCcsICdcXFxcJywgJ14nLCAnYCddLmNvbmNhdChkZWxpbXMpLFxuXG4gICAgLy8gQWxsb3dlZCBieSBSRkNzLCBidXQgY2F1c2Ugb2YgWFNTIGF0dGFja3MuICBBbHdheXMgZXNjYXBlIHRoZXNlLlxuICAgIGF1dG9Fc2NhcGUgPSBbJ1xcJyddLmNvbmNhdCh1bndpc2UpLFxuICAgIC8vIENoYXJhY3RlcnMgdGhhdCBhcmUgbmV2ZXIgZXZlciBhbGxvd2VkIGluIGEgaG9zdG5hbWUuXG4gICAgLy8gTm90ZSB0aGF0IGFueSBpbnZhbGlkIGNoYXJzIGFyZSBhbHNvIGhhbmRsZWQsIGJ1dCB0aGVzZVxuICAgIC8vIGFyZSB0aGUgb25lcyB0aGF0IGFyZSAqZXhwZWN0ZWQqIHRvIGJlIHNlZW4sIHNvIHdlIGZhc3QtcGF0aFxuICAgIC8vIHRoZW0uXG4gICAgbm9uSG9zdENoYXJzID0gWyclJywgJy8nLCAnPycsICc7JywgJyMnXS5jb25jYXQoYXV0b0VzY2FwZSksXG4gICAgaG9zdEVuZGluZ0NoYXJzID0gWycvJywgJz8nLCAnIyddLFxuICAgIGhvc3RuYW1lTWF4TGVuID0gMjU1LFxuICAgIGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlsrYS16MC05QS1aXy1dezAsNjN9JC8sXG4gICAgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbK2EtejAtOUEtWl8tXXswLDYzfSkoLiopJC8sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgY2FuIGFsbG93IFwidW5zYWZlXCIgYW5kIFwidW53aXNlXCIgY2hhcnMuXG4gICAgdW5zYWZlUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBuZXZlciBoYXZlIGEgaG9zdG5hbWUuXG4gICAgaG9zdGxlc3NQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IGFsd2F5cyBjb250YWluIGEgLy8gYml0LlxuICAgIHNsYXNoZWRQcm90b2NvbCA9IHtcbiAgICAgICdodHRwJzogdHJ1ZSxcbiAgICAgICdodHRwcyc6IHRydWUsXG4gICAgICAnZnRwJzogdHJ1ZSxcbiAgICAgICdnb3BoZXInOiB0cnVlLFxuICAgICAgJ2ZpbGUnOiB0cnVlLFxuICAgICAgJ2h0dHA6JzogdHJ1ZSxcbiAgICAgICdodHRwczonOiB0cnVlLFxuICAgICAgJ2Z0cDonOiB0cnVlLFxuICAgICAgJ2dvcGhlcjonOiB0cnVlLFxuICAgICAgJ2ZpbGU6JzogdHJ1ZVxuICAgIH0sXG4gICAgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5mdW5jdGlvbiB1cmxQYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgdXRpbC5pc09iamVjdCh1cmwpICYmIHVybCBpbnN0YW5jZW9mIFVybCkgcmV0dXJuIHVybDtcblxuICB2YXIgdSA9IG5ldyBVcmw7XG4gIHUucGFyc2UodXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1O1xufVxuXG5VcmwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAoIXV0aWwuaXNTdHJpbmcodXJsKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICAvLyBDb3B5IGNocm9tZSwgSUUsIG9wZXJhIGJhY2tzbGFzaC1oYW5kbGluZyBiZWhhdmlvci5cbiAgLy8gQmFjayBzbGFzaGVzIGJlZm9yZSB0aGUgcXVlcnkgc3RyaW5nIGdldCBjb252ZXJ0ZWQgdG8gZm9yd2FyZCBzbGFzaGVzXG4gIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gIHZhciBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKSxcbiAgICAgIHNwbGl0dGVyID1cbiAgICAgICAgICAocXVlcnlJbmRleCAhPT0gLTEgJiYgcXVlcnlJbmRleCA8IHVybC5pbmRleE9mKCcjJykpID8gJz8nIDogJyMnLFxuICAgICAgdVNwbGl0ID0gdXJsLnNwbGl0KHNwbGl0dGVyKSxcbiAgICAgIHNsYXNoUmVnZXggPSAvXFxcXC9nO1xuICB1U3BsaXRbMF0gPSB1U3BsaXRbMF0ucmVwbGFjZShzbGFzaFJlZ2V4LCAnLycpO1xuICB1cmwgPSB1U3BsaXQuam9pbihzcGxpdHRlcik7XG5cbiAgdmFyIHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiB1cmwuc3BsaXQoJyMnKS5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUcnkgZmFzdCBwYXRoIHJlZ2V4cFxuICAgIHZhciBzaW1wbGVQYXRoID0gc2ltcGxlUGF0aFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgICBpZiAoc2ltcGxlUGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gcmVzdDtcbiAgICAgIHRoaXMuaHJlZiA9IHJlc3Q7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5zZWFyY2guc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gdGhpcy5zZWFyY2guc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICAgICAgdGhpcy5xdWVyeSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSlcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcblxuICAgIHRoaXMuaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIC8vIElETkEgU3VwcG9ydDogUmV0dXJucyBhIHB1bnljb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgICAgLy8gSXQgb25seSBjb252ZXJ0cyBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgICAgLy8gaGF2ZSBub24tQVNDSUkgY2hhcmFjdGVycywgaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZlxuICAgICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgQVNDSUktb25seS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHRoaXMuaG9zdG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBwID0gdGhpcy5wb3J0ID8gJzonICsgdGhpcy5wb3J0IDogJyc7XG4gICAgdmFyIGggPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuICAgIHRoaXMuaHJlZiArPSB0aGlzLmhvc3Q7XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIGlmIChyZXN0WzBdICE9PSAnLycpIHtcbiAgICAgICAgcmVzdCA9ICcvJyArIHJlc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIGlmIChyZXN0LmluZGV4T2YoYWUpID09PSAtMSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgdGhpcy5xdWVyeSA9IHJlc3Quc3Vic3RyKHFtICsgMSk7XG4gICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIHRoaXMuc2VhcmNoID0gJyc7XG4gICAgdGhpcy5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmICh0aGlzLnBhdGhuYW1lIHx8IHRoaXMuc2VhcmNoKSB7XG4gICAgdmFyIHAgPSB0aGlzLnBhdGhuYW1lIHx8ICcnO1xuICAgIHZhciBzID0gdGhpcy5zZWFyY2ggfHwgJyc7XG4gICAgdGhpcy5wYXRoID0gcCArIHM7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgdGhpcy5ocmVmID0gdGhpcy5mb3JtYXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmb3JtYXQgYSBwYXJzZWQgb2JqZWN0IGludG8gYSB1cmwgc3RyaW5nXG5mdW5jdGlvbiB1cmxGb3JtYXQob2JqKSB7XG4gIC8vIGVuc3VyZSBpdCdzIGFuIG9iamVjdCwgYW5kIG5vdCBhIHN0cmluZyB1cmwuXG4gIC8vIElmIGl0J3MgYW4gb2JqLCB0aGlzIGlzIGEgbm8tb3AuXG4gIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGNhbGwgdXJsX2Zvcm1hdCgpIG9uIHN0cmluZ3NcbiAgLy8gdG8gY2xlYW4gdXAgcG90ZW50aWFsbHkgd29ua3kgdXJscy5cbiAgaWYgKHV0aWwuaXNTdHJpbmcob2JqKSkgb2JqID0gdXJsUGFyc2Uob2JqKTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgVXJsKSkgcmV0dXJuIFVybC5wcm90b3R5cGUuZm9ybWF0LmNhbGwob2JqKTtcbiAgcmV0dXJuIG9iai5mb3JtYXQoKTtcbn1cblxuVXJsLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF1dGggPSB0aGlzLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGVuY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICBhdXRoID0gYXV0aC5yZXBsYWNlKC8lM0EvaSwgJzonKTtcbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IHRoaXMucHJvdG9jb2wgfHwgJycsXG4gICAgICBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgJycsXG4gICAgICBoYXNoID0gdGhpcy5oYXNoIHx8ICcnLFxuICAgICAgaG9zdCA9IGZhbHNlLFxuICAgICAgcXVlcnkgPSAnJztcblxuICBpZiAodGhpcy5ob3N0KSB7XG4gICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gIH0gZWxzZSBpZiAodGhpcy5ob3N0bmFtZSkge1xuICAgIGhvc3QgPSBhdXRoICsgKHRoaXMuaG9zdG5hbWUuaW5kZXhPZignOicpID09PSAtMSA/XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgOlxuICAgICAgICAnWycgKyB0aGlzLmhvc3RuYW1lICsgJ10nKTtcbiAgICBpZiAodGhpcy5wb3J0KSB7XG4gICAgICBob3N0ICs9ICc6JyArIHRoaXMucG9ydDtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5xdWVyeSAmJlxuICAgICAgdXRpbC5pc09iamVjdCh0aGlzLnF1ZXJ5KSAmJlxuICAgICAgT2JqZWN0LmtleXModGhpcy5xdWVyeSkubGVuZ3RoKSB7XG4gICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gIH1cblxuICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKHRoaXMuc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHBhdGhuYW1lID0gcGF0aG5hbWUucmVwbGFjZSgvWz8jXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQobWF0Y2gpO1xuICB9KTtcbiAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoJyMnLCAnJTIzJyk7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZShyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmVPYmplY3QodXJsUGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKSkuZm9ybWF0KCk7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmVPYmplY3QocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmVPYmplY3QgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICBpZiAodXRpbC5pc1N0cmluZyhyZWxhdGl2ZSkpIHtcbiAgICB2YXIgcmVsID0gbmV3IFVybCgpO1xuICAgIHJlbC5wYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgIHJlbGF0aXZlID0gcmVsO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBVcmwoKTtcbiAgdmFyIHRrZXlzID0gT2JqZWN0LmtleXModGhpcyk7XG4gIGZvciAodmFyIHRrID0gMDsgdGsgPCB0a2V5cy5sZW5ndGg7IHRrKyspIHtcbiAgICB2YXIgdGtleSA9IHRrZXlzW3RrXTtcbiAgICByZXN1bHRbdGtleV0gPSB0aGlzW3RrZXldO1xuICB9XG5cbiAgLy8gaGFzaCBpcyBhbHdheXMgb3ZlcnJpZGRlbiwgbm8gbWF0dGVyIHdoYXQuXG4gIC8vIGV2ZW4gaHJlZj1cIlwiIHdpbGwgcmVtb3ZlIGl0LlxuICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgLy8gaWYgdGhlIHJlbGF0aXZlIHVybCBpcyBlbXB0eSwgdGhlbiB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBkbyBoZXJlLlxuICBpZiAocmVsYXRpdmUuaHJlZiA9PT0gJycpIHtcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIC8vIHRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICB2YXIgcmtleXMgPSBPYmplY3Qua2V5cyhyZWxhdGl2ZSk7XG4gICAgZm9yICh2YXIgcmsgPSAwOyByayA8IHJrZXlzLmxlbmd0aDsgcmsrKykge1xuICAgICAgdmFyIHJrZXkgPSBya2V5c1tya107XG4gICAgICBpZiAocmtleSAhPT0gJ3Byb3RvY29sJylcbiAgICAgICAgcmVzdWx0W3JrZXldID0gcmVsYXRpdmVbcmtleV07XG4gICAgfVxuXG4gICAgLy91cmxQYXJzZSBhcHBlbmRzIHRyYWlsaW5nIC8gdG8gdXJscyBsaWtlIGh0dHA6Ly93d3cuZXhhbXBsZS5jb21cbiAgICBpZiAoc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmICFyZXN1bHQucGF0aG5hbWUpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gcmVzdWx0LnBhdGhuYW1lID0gJy8nO1xuICAgIH1cblxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHJlc3VsdC5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBrZXlzLmxlbmd0aDsgdisrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1t2XTtcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgICB9XG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgaWYgKCFyZWxhdGl2ZS5ob3N0ICYmICFob3N0bGVzc1Byb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgdmFyIHJlbFBhdGggPSAocmVsYXRpdmUucGF0aG5hbWUgfHwgJycpLnNwbGl0KCcvJyk7XG4gICAgICB3aGlsZSAocmVsUGF0aC5sZW5ndGggJiYgIShyZWxhdGl2ZS5ob3N0ID0gcmVsUGF0aC5zaGlmdCgpKSk7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3QpIHJlbGF0aXZlLmhvc3QgPSAnJztcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gJyc7XG4gICAgICBpZiAocmVsUGF0aFswXSAhPT0gJycpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICBpZiAocmVsUGF0aC5sZW5ndGggPCAyKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHJlc3VsdC5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy8gdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnBhdGhuYW1lIHx8IHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHZhciBwID0gcmVzdWx0LnBhdGhuYW1lIHx8ICcnO1xuICAgICAgdmFyIHMgPSByZXN1bHQuc2VhcmNoIHx8ICcnO1xuICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICB9XG4gICAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB2YXIgaXNTb3VyY2VBYnMgPSAocmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyksXG4gICAgICBpc1JlbEFicyA9IChcbiAgICAgICAgICByZWxhdGl2ZS5ob3N0IHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gcmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSByZXN1bHQucHJvdG9jb2wgJiYgIXNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHJlc3VsdC5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gJyc7XG4gICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgIGlmIChyZXN1bHQuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChyZXN1bHQuaG9zdCk7XG4gICAgfVxuICAgIHJlc3VsdC5ob3N0ID0gJyc7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZS5wb3J0ID0gbnVsbDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgcmVsYXRpdmUuaG9zdCA9IG51bGw7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHJlc3VsdC5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiByZXN1bHQuaG9zdDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiByZXN1bHQuaG9zdG5hbWU7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCF1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKHJlbGF0aXZlLnNlYXJjaCkpIHtcbiAgICAvLyBqdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgLy8gbGlrZSBocmVmPSc/Zm9vJy5cbiAgICAvLyBQdXQgdGhpcyBhZnRlciB0aGUgb3RoZXIgdHdvIGNhc2VzIGJlY2F1c2UgaXQgc2ltcGxpZmllcyB0aGUgYm9vbGVhbnNcbiAgICBpZiAocHN5Y2hvdGljKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKTtcbiAgICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAgIC8vdGhpcyBlc3BlY2lhbGx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKCF1dGlsLmlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICF1dGlsLmlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQuc2VhcmNoKSB7XG4gICAgICByZXN1bHQucGF0aCA9ICcvJyArIHJlc3VsdC5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGlmIGEgdXJsIEVORHMgaW4gLiBvciAuLiwgdGhlbiBpdCBtdXN0IGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgLy8gdGhlbiBpdCBtdXN0IE5PVCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIGxhc3QgPSBzcmNQYXRoLnNsaWNlKC0xKVswXTtcbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSAoXG4gICAgICAocmVzdWx0Lmhvc3QgfHwgcmVsYXRpdmUuaG9zdCB8fCBzcmNQYXRoLmxlbmd0aCA+IDEpICYmXG4gICAgICAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8IGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWxseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgfVxuICB9XG5cbiAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICBpZiAobXVzdEVuZEFicyAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmICghdXRpbC5pc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhdXRpbC5pc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICB9XG4gIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCByZXN1bHQuYXV0aDtcbiAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG59O1xuIiwiaW1wb3J0IHtNZXNzYWdlUG9ydFdyYXBwZXJ9IGZyb20gJy4vbWVzc2FnZS1jaGFubmVsJztcblxuY29uc3QgYWN0aXZlTWVzc2FnZVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW11cblxuY29uc3QgUG9ydFN0b3JlID0ge1xuXG4gICAgYWRkOiBmdW5jdGlvbiAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpIHtcbiAgICAgICAgaWYgKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpID4gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyeWluZyB0byBhZGQgYSBwb3J0IHRoYXQncyBhbHJlYWR5IGJlZW4gYWRkZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYWN0aXZlTWVzc2FnZVBvcnRzLnB1c2gocG9ydCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5zcGxpY2UoYWN0aXZlTWVzc2FnZVBvcnRzLmluZGV4T2YocG9ydCksIDEpO1xuICAgIH0sXG5cbiAgICBmaW5kQnlOYXRpdmVJbmRleDogZnVuY3Rpb24obmF0aXZlSW5kZXg6bnVtYmVyKTpNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleCA9PT0gbmF0aXZlSW5kZXgpO1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgfSxcblxuICAgIGZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgaWYgKCFuYXRpdmVJbmRleCAmJiBuYXRpdmVJbmRleCAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIGEgbmF0aXZlIGluZGV4XCIpXG4gICAgICAgIH1cbiAgICAgIFxuICAgICAgICBsZXQgZXhpc3RpbmcgPSBQb3J0U3RvcmUuZmluZEJ5TmF0aXZlSW5kZXgobmF0aXZlSW5kZXgpO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBoYXZlIGEgcG9ydCBmb3IgdGhpcy4gUmV0dXJuIGl0LlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgbm90LCBtYWtlIGEgbmV3IG9uZVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKCk7XG4gICAgICAgIG5ld0N1c3RvbS5uYXRpdmVQb3J0SW5kZXggPSBuYXRpdmVJbmRleDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IHdlYiBNZXNzYWdlUG9ydCBmb3IgbmF0aXZlIGluZGV4XCIsIG5hdGl2ZUluZGV4KVxuICAgICAgICBcbiAgICAgICAgLy8gdGhpcyBhbHJlYWR5IGhhcyBhIGJyaWRnZSwgc28gd2UgY29uc2lkZXIgaXQgJ2FjdGl2ZSdcbiAgICAgICAgUG9ydFN0b3JlLmFkZChuZXdDdXN0b20pO1xuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tXG4gICAgfSxcblxuICAgIGZpbmRPcldyYXBKU01lc3NzYWdlUG9ydDogZnVuY3Rpb24ocG9ydDpNZXNzYWdlUG9ydCk6IE1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGxldCBleGlzdGluZyA9IGFjdGl2ZU1lc3NhZ2VQb3J0cy5maWx0ZXIoKHApID0+IHAuanNNZXNzYWdlUG9ydCA9PSBwb3J0KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIHBvcnQgZm9yIHRoaXMuIFJldHVybiBpdC5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuXG4gICAgICAgIC8vIHRoaXMgaGFzIG5vdCB5ZXQgYmVlbiBnaXZlbiBhIG5hdGl2ZSBpbmRleCwgc28gd2UgZG8gbm90XG4gICAgICAgIC8vIGNvbnNpZGVyIGl0IGFjdGl2ZS5cblxuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUG9ydFN0b3JlO1xuXG4vLyBmb3IgdGVzdGluZ1xuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZFBvcnRTdG9yZSA9IFBvcnRTdG9yZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH1cblxudmFyIGhhc1Byb3AgPSAoe30pLmhhc093blByb3BlcnR5O1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChjaGlsZCwgcGFyZW50KSB7XG4gICAgZm9yICh2YXIga2V5IGluIHBhcmVudCkge1xuICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkge1xuICAgICAgICAgICAgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICB9XG4gICAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuXG52YXIgVGltZW91dEVycm9yID0gZXhwb3J0cy5UaW1lb3V0RXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW1lb3V0RXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGltZW91dEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBiZXR0ZXIsIGJlY2F1c2UgaXQgbWFrZXMgdGhlIHJlc3VsdGluZyBzdGFjayB0cmFjZSBoYXZlIHRoZSBjb3JyZWN0IGVycm9yIG5hbWUuICBCdXQsIGl0XG4gICAgICAgIC8vIG9ubHkgd29ya3MgaW4gVjgvQ2hyb21lLlxuICAgICAgICBUaW1lb3V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhY2tpbmVzcyBmb3Igb3RoZXIgYnJvd3NlcnMuXG4gICAgICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IobWVzc2FnZSkuc3RhY2s7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gXCJUaW1lb3V0RXJyb3JcIjtcbn07XG5leHRlbmQoVGltZW91dEVycm9yLCBFcnJvcik7XG5cbi8qXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBgbXNgIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQuICBUaGUgcmV0dXJuZWQgUHJvbWlzZSB3aWxsIG5ldmVyIHJlamVjdC5cbiAqL1xuZXhwb3J0cy5kZWxheSA9IGZ1bmN0aW9uIChtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBSZXR1cm5zIGEgYHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9YCBvYmplY3QuICBUaGUgcmV0dXJuZWQgYHByb21pc2VgIHdpbGwgcmVzb2x2ZSBvciByZWplY3Qgd2hlbiBgcmVzb2x2ZWAgb3JcbiAqIGByZWplY3RgIGFyZSBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuZGVmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFuc3dlciA9IHt9O1xuICAgIGFuc3dlci5wcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBhbnN3ZXIucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIGFuc3dlci5yZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFuc3dlcjtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHNlcmllcywgb25seVxuICogY2FsbGluZyB0aGUgbmV4dCBmdW5jdGlvbiBvbmNlIHRoZSBwcmV2aW91cyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLlxuICovXG5leHBvcnRzLnNlcmllcyA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgcmV0dXJuIHRhc2tzLnJlZHVjZShmdW5jdGlvbiAoc2VyaWVzLCB0YXNrKSB7XG4gICAgICAgIHJldHVybiBzZXJpZXMudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5LCBgdGFza3NgLCBvZiBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIFByb21pc2VzLCBleGVjdXRlcyBlYWNoIGZ1bmN0aW9uIGluIGB0YXNrc2AgaW4gcGFyYWxsZWwuXG4gKiBJZiBgbGltaXRgIGlzIHN1cHBsaWVkLCB0aGVuIGF0IG1vc3QgYGxpbWl0YCB0YXNrcyB3aWxsIGJlIGV4ZWN1dGVkIGNvbmN1cnJlbnRseS5cbiAqL1xuZXhwb3J0cy5wYXJhbGxlbCA9IGV4cG9ydHMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uICh0YXNrcywgbGltaXQpIHtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSB8fCBsaW1pdCA+PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzLm1hcChmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4odGFzayk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHZhciBjdXJyZW50VGFzayA9IDA7XG4gICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgc3RhcnRUYXNrID0gZnVuY3Rpb24gc3RhcnRUYXNrKCkge1xuICAgICAgICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFza051bWJlciA9IGN1cnJlbnRUYXNrKys7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzW3Rhc2tOdW1iZXJdO1xuICAgICAgICAgICAgcnVubmluZysrO1xuXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbdGFza051bWJlcl0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgcnVubmluZy0tO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGFzayA8IHRhc2tzLmxlbmd0aCAmJiBydW5uaW5nIDwgbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChydW5uaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdGFydCB1cCBgbGltaXRgIHRhc2tzLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXkgYGFycmAgb2YgaXRlbXMsIGNhbGxzIGBpdGVyKGl0ZW0sIGluZGV4KWAgZm9yIGV2ZXJ5IGl0ZW0gaW4gYGFycmAuICBgaXRlcigpYCBzaG91bGQgcmV0dXJuIGFcbiAqIFByb21pc2UuICBVcCB0byBgbGltaXRgIGl0ZW1zIHdpbGwgYmUgY2FsbGVkIGluIHBhcmFsbGVsIChkZWZhdWx0cyB0byAxLilcbiAqL1xuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbiAoYXJyLCBpdGVyLCBsaW1pdCkge1xuICAgIHZhciB0YXNrTGltaXQgPSBsaW1pdDtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSkge1xuICAgICAgICB0YXNrTGltaXQgPSAxO1xuICAgIH1cbiAgICBpZiAobGltaXQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICB0YXNrTGltaXQgPSBhcnIubGVuZ3RoO1xuICAgIH1cblxuICAgIHZhciB0YXNrcyA9IGFyci5tYXAoZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcihpdGVtLCBpbmRleCk7XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyYWxsZWwodGFza3MsIHRhc2tMaW1pdCk7XG59O1xuXG4vKlxuICogQWRkIGEgdGltZW91dCB0byBhbiBleGlzdGluZyBQcm9taXNlLlxuICpcbiAqIFJlc29sdmVzIHRvIHRoZSBzYW1lIHZhbHVlIGFzIGBwYCBpZiBgcGAgcmVzb2x2ZXMgd2l0aGluIGBtc2AgbWlsbGlzZWNvbmRzLCBvdGhlcndpc2UgdGhlIHJldHVybmVkIFByb21pc2Ugd2lsbFxuICogcmVqZWN0IHdpdGggdGhlIGVycm9yIFwiVGltZW91dDogUHJvbWlzZSBkaWQgbm90IHJlc29sdmUgd2l0aGluICR7bXN9IG1pbGxpc2Vjb25kc1wiXG4gKi9cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uIChwLCBtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLlRpbWVvdXRFcnJvcihcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiBcIiArIG1zICsgXCIgbWlsbGlzZWNvbmRzXCIpKTtcbiAgICAgICAgfSwgbXMpO1xuXG4gICAgICAgIHAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogQ29udGludWFsbHkgY2FsbCBgZm4oKWAgd2hpbGUgYHRlc3QoKWAgcmV0dXJucyB0cnVlLlxuICpcbiAqIGBmbigpYCBzaG91bGQgcmV0dXJuIGEgUHJvbWlzZS4gIGB0ZXN0KClgIGlzIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0cnVlIG9mIGZhbHNlLlxuICpcbiAqIGB3aGlsc3RgIHdpbGwgcmVzb2x2ZSB0byB0aGUgbGFzdCB2YWx1ZSB0aGF0IGBmbigpYCByZXNvbHZlZCB0bywgb3Igd2lsbCByZWplY3QgaW1tZWRpYXRlbHkgd2l0aCBhbiBlcnJvciBpZlxuICogYGZuKClgIHJlamVjdHMgb3IgaWYgYGZuKClgIG9yIGB0ZXN0KClgIHRocm93LlxuICovXG5leHBvcnRzLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBmbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBsYXN0UmVzdWx0ID0gbnVsbDtcbiAgICAgICAgdmFyIGRvSXQgPSBmdW5jdGlvbiBkb0l0KCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZm4pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsYXN0UmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGZuLCB0ZXN0KSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB2YXIgZG9UZXN0ID0gZnVuY3Rpb24gZG9UZXN0KCkge1xuICAgICAgICB2YXIgYW5zd2VyID0gZmlyc3QgfHwgdGVzdCgpO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH07XG4gICAgcmV0dXJuIGV4cG9ydHMud2hpbHN0KGRvVGVzdCwgZm4pO1xufTtcblxuLypcbiAqIGtlZXAgY2FsbGluZyBgZm5gIHVudGlsIGl0IHJldHVybnMgYSBub24tZXJyb3IgdmFsdWUsIGRvZXNuJ3QgdGhyb3csIG9yIHJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMuIGBmbmAgd2lsbCBiZVxuICogYXR0ZW1wdGVkIGB0aW1lc2AgbWFueSB0aW1lcyBiZWZvcmUgcmVqZWN0aW5nLiBJZiBgdGltZXNgIGlzIGdpdmVuIGFzIGBJbmZpbml0eWAsIHRoZW4gYHJldHJ5YCB3aWxsIGF0dGVtcHQgdG9cbiAqIHJlc29sdmUgZm9yZXZlciAodXNlZnVsIGlmIHlvdSBhcmUganVzdCB3YWl0aW5nIGZvciBzb21ldGhpbmcgdG8gZmluaXNoKS5cbiAqIEBwYXJhbSB7T2JqZWN0fE51bWJlcn0gb3B0aW9ucyBoYXNoIHRvIHByb3ZpZGUgYHRpbWVzYCBhbmQgYGludGVydmFsYC4gRGVmYXVsdHMgKHRpbWVzPTUsIGludGVydmFsPTApLiBJZiB0aGlzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGlzIGEgbnVtYmVyLCBvbmx5IGB0aW1lc2Agd2lsbCBiZSBzZXQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuIHRoZSB0YXNrL2NoZWNrIHRvIGJlIHBlcmZvcm1lZC4gQ2FuIGVpdGhlciByZXR1cm4gYSBzeW5jaHJvbm91cyB2YWx1ZSwgdGhyb3cgYW4gZXJyb3IsIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhIHByb21pc2VcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5leHBvcnRzLnJldHJ5ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGZuKSB7XG4gICAgdmFyIHRpbWVzID0gNTtcbiAgICB2YXIgaW50ZXJ2YWwgPSAwO1xuICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgdmFyIGxhc3RBdHRlbXB0ID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIG1ha2VUaW1lT3B0aW9uRXJyb3IodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yICd0aW1lcyc6IFwiICsgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKHZhbHVlKSkpO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2Ygb3B0aW9ucykgZm4gPSBvcHRpb25zO2Vsc2UgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygb3B0aW9ucykgdGltZXMgPSArb3B0aW9ucztlbHNlIGlmICgnb2JqZWN0JyA9PT0gKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob3B0aW9ucykpKSB7XG4gICAgICAgIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMudGltZXMpIHRpbWVzID0gK29wdGlvbnMudGltZXM7ZWxzZSBpZiAob3B0aW9ucy50aW1lcykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucy50aW1lcykpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmludGVydmFsKSBpbnRlcnZhbCA9ICtvcHRpb25zLmludGVydmFsO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucykpO2Vsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gcGFyYW1ldGVycyBnaXZlbicpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbihsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICB9KS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICAgIGxhc3RBdHRlbXB0ID0gZXJyO1xuICAgICAgICAgICAgICAgIGlmICh0aW1lcyAhPT0gSW5maW5pdHkgJiYgYXR0ZW1wdHMgPT09IHRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChkb0l0LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvSXQoKTtcbiAgICB9KTtcbn07IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBQb3J0U3RvcmUgZnJvbSAnLi9wb3J0LXN0b3JlJztcbmltcG9ydCBQcm9taXNlVG9vbHMgZnJvbSAncHJvbWlzZS10b29scyc7XG5cbmxldCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwibWVzc2FnZUNoYW5uZWxcIik7XG5cbi8vIFdlIG5lZWQgdGhpcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlIHNvIHRoYXQgd2UgY2FuIHRyaWdnZXIgcmVjZWl2ZVxuLy8gZXZlbnRzIG1hbnVhbGx5XG5cbih3aW5kb3cgYXMgYW55KS5fX21lc3NhZ2VDaGFubmVsQnJpZGdlID0gcHJvbWlzZUJyaWRnZTtcblxuaW50ZXJmYWNlIE1lc3NhZ2VQb3J0TWVzc2FnZSB7XG4gICAgZGF0YTpzdHJpbmcsXG4gICAgcGFzc2VkUG9ydElkczogbnVtYmVyW11cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UocG9ydEluZGV4Om51bWJlciwgbWVzc2FnZTpNZXNzYWdlUG9ydE1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQgaW5jb21pbmcgbWVzc2FnZSBmcm9tIG5hdGl2ZSwgdG8gcG9ydFwiLCBwb3J0SW5kZXgsIFwid2l0aCBtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgICAgICBsZXQgdGhpc1BvcnQgPSBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChwb3J0SW5kZXgpO1xuXG4gICAgICAgIGlmICghdGhpc1BvcnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlY2VpdmUgbWVzc2FnZSBvbiBpbmFjdGl2ZSBwb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hcHBlZFBvcnRzID0gbWVzc2FnZS5wYXNzZWRQb3J0SWRzLm1hcCgoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHBhc3MgaW4gYWN0dWFsIG1lc3NhZ2UgcG9ydHMsIHNvIGluc3RlYWQgd2UgcGFzcyBpblxuICAgICAgICAgICAgLy8gdGhlaXIgSURzLiBOb3cgd2UgbWFwIHRoZW0gdG8gb3VyIHdyYXBwZXIgQ3VzdG9tTWVzc2FnZVBvcnRcbiAgICAgICAgICAgIHJldHVybiBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChpZCkuanNNZXNzYWdlUG9ydDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG1lc3NhZ2UgdG8gbmF0aXZlIGluZGV4XCIsIHRoaXNQb3J0Lm5hdGl2ZVBvcnRJbmRleCk7XG4gICAgICAgIHRoaXNQb3J0LnNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKSwgbWFwcGVkUG9ydHMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICB9XG5cbn1cblxucHJvbWlzZUJyaWRnZS5hZGRMaXN0ZW5lcihcImVtaXRcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuXG5leHBvcnQgY2xhc3MgTWVzc2FnZVBvcnRXcmFwcGVyIHtcblxuICAgIG9wZW46Ym9vbGVhbjtcbiAgICBuYXRpdmVQb3J0SW5kZXg6bnVtYmVyO1xuICAgIGpzTWVzc2FnZVBvcnQ6TWVzc2FnZVBvcnQ7XG4gICAganNNZXNzYWdlQ2hhbm5lbDpNZXNzYWdlQ2hhbm5lbDtcbiAgICBwcml2YXRlIG9yaWdpbmFsSlNQb3J0Q2xvc2U6RnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3Rvcihqc1BvcnQ6TWVzc2FnZVBvcnQgPSBudWxsKSB7XG4gICAgICAgIHRoaXMubmF0aXZlUG9ydEluZGV4ID0gbnVsbDtcbiAgICAgICAgaWYgKGpzUG9ydCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0aW5nIHdyYXBwZXIgZm9yIGFuIGV4aXN0aW5nIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQgPSBqc1BvcnRcblxuICAgICAgICAgICAgLy8gZGlzZ3VzdGluZyBoYWNrLCBidXQgY2FuJ3Qgc2VlIGFueSB3YXkgYXJvdW5kIGlzIGFzIHRoZXJlIGlzIG5vXG4gICAgICAgICAgICAvLyBcImhhcyBkaXNwYXRjaGVkIGEgbWVzc2FnZVwiIGV2ZW50LCBhcyBmYXIgYXMgSSBjYW4gdGVsbCBcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0LnBvc3RNZXNzYWdlID0gdGhpcy5oYW5kbGVKU01lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJNYWtpbmcgd3JhcHBlciBmb3IgYSBuZXcgd2ViIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHdlIGNhbid0IGNyZWF0ZSBhIE1lc3NhZ2VQb3J0IGRpcmVjdGx5LCBzbyB3ZSBoYXZlIHRvIG1ha2VcbiAgICAgICAgICAgIC8vIGEgY2hhbm5lbCB0aGVuIHRha2Ugb25lIHBvcnQgZnJvbSBpdC4gS2luZCBvZiBhIHdhc3RlLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IHRoaXMuanNNZXNzYWdlQ2hhbm5lbC5wb3J0MTtcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQyLm9ubWVzc2FnZSA9IChldjpNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4ndCByZWxpYWJseSBob29rIGludG8gcG9zdE1lc3NhZ2UsIHNvIHdlIHVzZSB0aGlzXG4gICAgICAgICAgICAgICAgLy8gdG8gY2F0Y2ggcG9zdE1lc3NhZ2VzIHRvby4gTmVlZCB0byBkb2N1bWVudCBhbGwgdGhpcyBtYWRuZXNzLlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSlNNZXNzYWdlKGV2LmRhdGEsIGV2LnBvcnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbWUgZm9yIHRoZSBsYWNrIG9mIGEgJ2Nsb3NlJyBldmVudC5cbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlID0gdGhpcy5qc01lc3NhZ2VQb3J0LmNsb3NlO1xuICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2UgPSB0aGlzLmNsb3NlO1xuICAgIH1cblxuICAgIHNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKGRhdGE6IGFueSwgcG9ydHM6IE1lc3NhZ2VQb3J0W10pIHtcbiAgICAgICAgTWVzc2FnZVBvcnQucHJvdG90eXBlLnBvc3RNZXNzYWdlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCwgW2RhdGEsIHBvcnRzXSk7XG4gICAgfVxuXG4gICAgaGFuZGxlSlNNZXNzYWdlKGRhdGE6YW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSwgaXNFeHBsaWNpdFBvc3Q6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgXG4gICAgICAgIC8vIEdldCBvdXIgY3VzdG9tIHBvcnQgaW5zdGFuY2VzLCBjcmVhdGluZyB0aGVtIGlmIG5lY2Vzc2FyeVxuICAgICAgICBsZXQgY3VzdG9tUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChwb3J0cykge1xuICAgICAgICAgICAgY3VzdG9tUG9ydHMgPSBwb3J0cy5tYXAoKHA6TWVzc2FnZVBvcnQpID0+IFBvcnRTdG9yZS5maW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQocCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja0Zvck5hdGl2ZVBvcnQoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGV5IHdlcmUgY3JlYXRlZCwgdGhlbiB3ZSBuZWVkIHRvIGFzc2lnbiB0aGVtIGEgbmF0aXZlIElEIGJlZm9yZVxuICAgICAgICAgICAgLy8gd2Ugc2VuZC5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGVja2luZyB0aGF0IGFkZGl0aW9uYWwgcG9ydHMgaGF2ZSBuYXRpdmUgZXF1aXZhbGVudHNcIilcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYW4gZXhwbGljaXQgcG9zdE1lc3NhZ2UgY2FsbCwgd2UgbmVlZCB0aGUgbmF0aXZlXG4gICAgICAgICAgICAvLyBzaWRlIHRvIHBpY2sgdXAgb24gaXQgKHNvIGl0IGRvZXMgc29tZXRoaW5nIHdpdGggdGhlIE1lc3NhZ2VQb3J0KVxuXG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJzZW5kVG9Qb3J0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBpc0V4cGxpY2l0UG9zdDogaXNFeHBsaWNpdFBvc3QsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBjdXN0b21Qb3J0cy5tYXAoKHApID0+IHAubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjaGVja0Zvck5hdGl2ZVBvcnQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKHRoaXMubmF0aXZlUG9ydEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuZGVidWcoXCJQb3J0IGFscmVhZHkgaGFzIG5hdGl2ZSBpbmRleFwiLCB0aGlzLm5hdGl2ZVBvcnRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJjcmVhdGVcIlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocG9ydElkOm51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IG5hdGl2ZSBNZXNzYWdlUG9ydCBhdCBpbmRleCBcIiwgU3RyaW5nKHBvcnRJZCkpXG4gICAgICAgICAgICB0aGlzLm5hdGl2ZVBvcnRJbmRleCA9IHBvcnRJZDtcblxuICAgICAgICAgICAgLy8gb25seSBhZGQgdG8gb3VyIGFycmF5IG9mIGFjdGl2ZSBjaGFubmVscyB3aGVuXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIGEgbmF0aXZlIElEXG4gICAgICAgICAgICBQb3J0U3RvcmUuYWRkKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG5cbiAgICAgICAgLy8gcnVuIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3ZSBvdmVyd3JvdGVcbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCk7XG4gICAgICAgIFxuICAgICAgICAvLyByZW1vdmUgZnJvbSBvdXIgY2FjaGUgb2YgYWN0aXZlIHBvcnRzXG4gICAgICAgIFBvcnRTdG9yZS5yZW1vdmUodGhpcyk7XG4gICAgIFxuICAgICAgICAvLyBmaW5hbGx5LCB0ZWxsIHRoZSBuYXRpdmUgaGFsZiB0byBkZWxldGUgdGhpcyByZWZlcmVuY2UuXG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiZGVsZXRlXCIsXG4gICAgICAgICAgICBwb3J0SW5kZXg6IHRoaXMubmF0aXZlUG9ydEluZGV4XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZTphbnksIHBvcnRzOiBbTWVzc2FnZVBvcnRdKSB7XG5cbiAgICBsZXQgcG9ydEluZGV4ZXM6bnVtYmVyW10gPSBbXTtcblxuICAgIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKHBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlci5uYXRpdmVQb3J0SW5kZXg7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oKHBvcnRJbmRleGVzOm51bWJlcltdKSA9PiB7XG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicG9zdE1lc3NhZ2VcIixcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpLFxuICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBwb3J0SW5kZXhlc1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG5cbiAgICBcblxufSIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQge3Bvc3RNZXNzYWdlfSBmcm9tICcuLi9tZXNzYWdlcy9tZXNzYWdlLWNoYW5uZWwnO1xuXG5leHBvcnQgY29uc3Qgc2VydmljZVdvcmtlckJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcInNlcnZpY2VXb3JrZXJcIik7XG5cbmNsYXNzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQsIHVzZUNhcHR1cmU6Ym9vbGVhbikge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBkaXNwYXRjaEV2ZW50KGV2dDpFdmVudCk6IGJvb2xlYW4ge1xuICAgICAgICB0aGlzLmVtaXQoZXZ0LnR5cGUsIGV2dCk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfVxufVxuXG5jbGFzcyBIeWJyaWRTZXJ2aWNlV29ya2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlciB7XG4gICAgc2NvcGU6c3RyaW5nO1xuICAgIHNjcmlwdFVSTDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaWQ6bnVtYmVyO1xuXG4gICAgaW5zdGFsbFN0YXRlOlNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGVcbiAgICBnZXQgc3RhdGUoKTpzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuQWN0aXZhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0ZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0aW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsaW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuUmVkdW5kYW50KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJyZWR1bmRhbnRcIlxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBpbnN0YWxsIHN0YXRlOlwiICsgdGhpcy5pbnN0YWxsU3RhdGUpXG4gICAgfVxuXG4gICAgb25zdGF0ZWNoYW5nZTooc3RhdGVjaGFuZ2V2ZW50OmFueSkgPT4gdm9pZDtcbiAgICBvbm1lc3NhZ2U6KGV2Ok1lc3NhZ2VFdmVudCkgPT4gYW55O1xuICAgIG9uZXJyb3I6IChldjpFcnJvckV2ZW50KSA9PiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihpZDpudW1iZXIsIHNjcmlwdFVSTDpzdHJpbmcsIHNjb3BlOnN0cmluZywgc3RhdGU6U2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuX2lkID0gaWQ7XG4gICAgICAgIHRoaXMuc2NyaXB0VVJMID0gc2NyaXB0VVJMO1xuICAgICAgICB0aGlzLnNjb3BlID0gc2NvcGU7XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoc3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlID09PSB0aGlzLmluc3RhbGxTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLm9uc3RhdGVjaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMub25zdGF0ZWNoYW5nZSh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFxuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2U6YW55LCBvcHRpb25zOiBhbnlbXSkge1xuICAgICAgICBpZiAoUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBwb3N0TWVzc2FnZSB0byBhY3RpdmUgc2VydmljZSB3b3JrZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sZW5ndGggPiAxIHx8IG9wdGlvbnNbMF0gaW5zdGFuY2VvZiBNZXNzYWdlUG9ydCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIHNlbmRpbmcgb25lIE1lc3NhZ2VQb3J0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdwb3N0IG1lc3NhZ2U/JywgbWVzc2FnZSlcbiAgICAgICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgW29wdGlvbnNbMF0gYXMgTWVzc2FnZVBvcnRdKTtcblxuICAgIH0gXG5cbiAgICB0ZXJtaW5hdGUoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNob3VsZCBub3QgaW1wbGVtZW50IHRoaXMuXCIpO1xuICAgIH1cbn1cblxuY2xhc3MgSHlicmlkUmVnaXN0cmF0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbiB7XG4gICAgXG4gICAgYWN0aXZlOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgaW5zdGFsbGluZzogSHlicmlkU2VydmljZVdvcmtlclxuICAgIHdhaXRpbmc6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBwdXNoTWFuYWdlcjogYW55XG4gICAgb251cGRhdGVmb3VuZDogKCkgPT4gdm9pZFxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcInVwZGF0ZWZvdW5kXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9udXBkYXRlZm91bmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9udXBkYXRlZm91bmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLnB1c2hNYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHVzaD8nKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0TW9zdFJlY2VudFdvcmtlcigpOkh5YnJpZFNlcnZpY2VXb3JrZXIge1xuICAgICAgICAvLyB3aGVuIHdlIHdhbnQgdGhlIG1vc3QgY3VycmVudCwgcmVnYXJkbGVzcyBvZiBhY3R1YWwgc3RhdHVzXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZSB8fCB0aGlzLndhaXRpbmcgfHwgdGhpcy5pbnN0YWxsaW5nO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJ1cGRhdGVcIixcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRNb3N0UmVjZW50V29ya2VyKCkuc2NyaXB0VVJMXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0IHNjb3BlKCk6c3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlLnNjb3BlO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB5ZXRcIilcbiAgICB9XG5cbiAgICBjbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKTp2b2lkIHtcbiAgICAgICAgLy8gSWYgYSBzZXJ2aWNlIHdvcmtlciBoYXMgY2hhbmdlZCBzdGF0ZSwgd2Ugd2FudCB0byBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBpdCBkb2Vzbid0IGFwcGVhciBpbiBhbnkgb2xkIHN0YXRlc1xuICAgIFxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsaW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsaW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmcgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG5cbiAgICAgICAgdGhpcy5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRlZCAmJiAhdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gc3c7XG4gICAgICAgICAgICBTZXJ2aWNlV29ya2VyQ29udGFpbmVyLmNvbnRyb2xsZXIgPSBzdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBzdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGluZyA9IHN3O1xuICAgICAgICAgICAgdGhpcy5lbWl0KFwidXBkYXRlZm91bmRcIiwgc3cpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBSZWdpc3RyYXRpb25JbnN0YW5jZSA9IG5ldyBIeWJyaWRSZWdpc3RyYXRpb24oKTtcblxuY2xhc3MgSHlicmlkU2VydmljZVdvcmtlckNvbnRhaW5lciBleHRlbmRzIEV2ZW50RW1pdHRlciBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXJDb250YWluZXIgIHtcbiAgICBjb250cm9sbGVyOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgXG4gICAgb25jb250cm9sbGVyY2hhbmdlOiAoKSA9PiB2b2lkXG4gICAgb25lcnJvcjogKCkgPT4gdm9pZFxuICAgIG9ubWVzc2FnZTogKCkgPT4gdm9pZFxuXG4gICAgZ2V0IHJlYWR5KCk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICBpZiAodGhpcy5jb250cm9sbGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VydmljZVdvcmtlciByZWFkeSByZXR1cm5pbmcgaW1tZWRpYXRlbHkgd2l0aCBhY3RpdmF0ZWQgaW5zdGFuY2VcIik7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VydmljZVdvcmtlciByZWFkeSByZXR1cm5pbmcgcHJvbWlzZSBhbmQgd2FpdGluZy4uLlwiKTtcbiAgICAgICAgICAgIHRoaXMub25jZShcImNvbnRyb2xsZXJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZXJ2aWNlV29ya2VyIHJlYWR5IHJlY2VpdmVkIHJlc3BvbnNlXCIpXG4gICAgICAgICAgICAgICAgZnVsZmlsbChSZWdpc3RyYXRpb25JbnN0YW5jZSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJjb250cm9sbGVyY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uY29udHJvbGxlcmNoYW5nZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBpdCBleHBlY3QgYXJndW1lbnRzPyBVbmNsZWFyLlxuICAgICAgICAgICAgICAgIHRoaXMub25jb250cm9sbGVyY2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29udHJvbGxlciA9IFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFjdGl2ZTtcbiAgICB9XG5cbiAgICByZWdpc3Rlcih1cmxUb1JlZ2lzdGVyOnN0cmluZywgb3B0aW9uczogU2VydmljZVdvcmtlclJlZ2lzdGVyT3B0aW9ucyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICBcbiAgICAgICAgbGV0IHBhdGhUb1NXID0gdXJsLnJlc29sdmUod2luZG93LmxvY2F0aW9uLmhyZWYsIHVybFRvUmVnaXN0ZXIpXG5cbiAgICAgICAgY29uc29sZS5pbmZvKFwiQXR0ZW1wdGluZyB0byByZWdpc3RlciBzZXJ2aWNlIHdvcmtlciBhdFwiLCBwYXRoVG9TVyk7XG4gICAgXG4gICAgICAgIHJldHVybiBzZXJ2aWNlV29ya2VyQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgb3BlcmF0aW9uOiBcInJlZ2lzdGVyXCIsXG4gICAgICAgICAgICBzd1BhdGg6IHBhdGhUb1NXLFxuICAgICAgICAgICAgc2NvcGU6IG9wdGlvbnMgPyBvcHRpb25zLnNjb3BlIDogbnVsbFxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocmVzcG9uc2U6U2VydmljZVdvcmtlck1hdGNoKSA9PiB7XG4gICAgICAgICAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKHJlc3BvbnNlKTtcbiAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gUmVnaXN0cmF0aW9uSW5zdGFuY2U7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjbGFpbWVkQnlOZXdXb3JrZXIoc3c6SHlicmlkU2VydmljZVdvcmtlcikge1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFjdGl2ZSA9IHN3O1xuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBzdztcbiAgICAgICAgdGhpcy5lbWl0KFwiY29udHJvbGxlcmNoYW5nZVwiLCBzdyk7XG4gICAgfVxuXG4gICAgZ2V0UmVnaXN0cmF0aW9uKHNjb3BlOnN0cmluZyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBnZXRSZWdpc3RyYXRpb25zKCk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbltdPiB7XG4gICAgICAgIC8vIE5vdCBzdXJlIHdoeSB3ZSBlbmQgdXAgd2l0aCBtb3JlIHRoYW4gb25lIHJlZ2lzdHJhdGlvbiwgZXZlci5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbUmVnaXN0cmF0aW9uSW5zdGFuY2VdKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBTZXJ2aWNlV29ya2VyQ29udGFpbmVyID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXJDb250YWluZXIoKTsgXG5cbmVudW0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSB7XG4gICAgSW5zdGFsbGluZyA9IDAsXG4gICAgSW5zdGFsbGVkLFxuICAgIEFjdGl2YXRpbmcsXG4gICAgQWN0aXZhdGVkLFxuICAgIFJlZHVuZGFudFxufVxuXG5pbnRlcmZhY2UgU2VydmljZVdvcmtlck1hdGNoIHtcbiAgICB1cmw6IHN0cmluZyxcbiAgICBpbnN0YWxsU3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUsXG4gICAgaW5zdGFuY2VJZDpudW1iZXIsXG4gICAgc2NvcGU6IHN0cmluZ1xufVxuXG5jb25zdCBzZXJ2aWNlV29ya2VyUmVjb3Jkczoge1tpZDpudW1iZXJdIDogSHlicmlkU2VydmljZVdvcmtlcn0gPSB7fTtcblxuZnVuY3Rpb24gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG5ld01hdGNoOlNlcnZpY2VXb3JrZXJNYXRjaCkge1xuICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCwgdXNlIHRoYXQgb25lXG4gICAgbGV0IHdvcmtlciA9IHNlcnZpY2VXb3JrZXJSZWNvcmRzW25ld01hdGNoLmluc3RhbmNlSWRdO1xuXG4gICAgaWYgKCF3b3JrZXIpIHtcbiAgICAgICAgLy8gb3RoZXJ3aXNlLCBtYWtlIGEgbmV3IG9uZVxuICAgICAgICB3b3JrZXIgPSBuZXcgSHlicmlkU2VydmljZVdvcmtlcihuZXdNYXRjaC5pbnN0YW5jZUlkLCBuZXdNYXRjaC51cmwsIG5ld01hdGNoLnNjb3BlLCBuZXdNYXRjaC5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBzZXJ2aWNlV29ya2VyUmVjb3Jkc1tuZXdNYXRjaC5pbnN0YW5jZUlkXSA9IHdvcmtlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3b3JrZXIudXBkYXRlU3RhdGUobmV3TWF0Y2guaW5zdGFsbFN0YXRlKTtcbiAgICB9XG5cbiAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZSh3b3JrZXIpO1xuXG4gICAgY29uc29sZS5sb2coXCJTVyBDSEFOR0VcIiwgbmV3TWF0Y2gpO1xuICAgIHJldHVybiB3b3JrZXI7XG59XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ3N3LWNoYW5nZScsIHByb2Nlc3NOZXdXb3JrZXJNYXRjaCk7XG5cbnNlcnZpY2VXb3JrZXJCcmlkZ2UuYWRkTGlzdGVuZXIoJ2NsYWltZWQnLCBmdW5jdGlvbihtYXRjaDpTZXJ2aWNlV29ya2VyTWF0Y2gpIHtcbiAgICBsZXQgd29ya2VyID0gcHJvY2Vzc05ld1dvcmtlck1hdGNoKG1hdGNoKTtcbiAgICBjb25zb2xlLmxvZyhcIkNsYWltZWQgYnkgbmV3IHdvcmtlclwiKVxuICAgIFNlcnZpY2VXb3JrZXJDb250YWluZXIuY2xhaW1lZEJ5TmV3V29ya2VyKHdvcmtlcik7XG59KVxuLy8gT24gcGFnZSBsb2FkIHdlIGdyYWIgYWxsIHRoZSBjdXJyZW50bHkgYXBwbGljYWJsZSBzZXJ2aWNlIHdvcmtlcnNcblxuc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICBvcGVyYXRpb246IFwiZ2V0QWxsXCJcbn0pLnRoZW4oKHdvcmtlcnM6IFNlcnZpY2VXb3JrZXJNYXRjaFtdKSA9PiB7XG4gICAgd29ya2Vycy5mb3JFYWNoKCh3b3JrZXIpID0+IHtcbiAgICAgICAgc2VydmljZVdvcmtlclJlY29yZHNbd29ya2VyLmluc3RhbmNlSWRdID0gbmV3IEh5YnJpZFNlcnZpY2VXb3JrZXIod29ya2VyLmluc3RhbmNlSWQsIHdvcmtlci51cmwsIFwiXCIsIHdvcmtlci5pbnN0YWxsU3RhdGUpO1xuICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0pO1xuICAgIH0pXG59KSIsImltcG9ydCB7c2VydmljZVdvcmtlckJyaWRnZSwgU2VydmljZVdvcmtlckNvbnRhaW5lcn0gZnJvbSAnLi9zdy1tYW5hZ2VyJztcblxubGV0IG5hdmlnYXRvckFzQW55OmFueSA9IG5hdmlnYXRvcjtcblxubmF2aWdhdG9yQXNBbnkuc2VydmljZVdvcmtlciA9IFNlcnZpY2VXb3JrZXJDb250YWluZXI7IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwiY29uc29sZVwiKTtcblxuY29uc3QgbWFrZVN1aXRhYmxlID0gKHZhbDphbnkpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFwibnVsbFwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHJldHVyblN0cmluZyA9IFwiKG5vdCBzdHJpbmdpZnlhYmxlKTogXCJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuU3RyaW5nICs9IGVyci50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHVyblN0cmluZ1xuICAgIH1cbn1cblxubGV0IGxldmVscyA9IFsnZGVidWcnLCdpbmZvJywgJ2xvZycsICdlcnJvcicsICd3YXJuJ107XG5cbmxldCBjb25zb2xlOntbbGV2ZWw6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5cbmxldCBvcmlnaW5hbENvbnNvbGUgPSB3aW5kb3cuY29uc29sZSBhcyBhbnk7XG5cbih3aW5kb3cgYXMgYW55KS5jb25zb2xlID0gY29uc29sZTtcblxubGV2ZWxzLmZvckVhY2goKGxldmVsKSA9PiB7XG4gICAgY29uc29sZVtsZXZlbF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcmlnaW5hbENvbnNvbGUpIHtcbiAgICAgICAgICAgIC8vIHN0aWxsIGxvZyBvdXQgdG8gd2VidmlldyBjb25zb2xlLCBpbiBjYXNlIHdlJ3JlIGF0dGFjaGVkXG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVbbGV2ZWxdLmFwcGx5KG9yaWdpbmFsQ29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcmdzQXNKU09OID0gQXJyYXkuZnJvbShhcmd1bWVudHMpLm1hcChtYWtlU3VpdGFibGUpO1xuXG4gICAgICAgIHByb21pc2VCcmlkZ2Uuc2VuZCh7XG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICBhcmdzOiBhcmdzQXNKU09OXG4gICAgICAgIH0pXG4gICAgfVxufSkiLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcblxubGV0IGV2ZW50c0JyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImV2ZW50c1wiKTtcblxuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZEV2ZW50cyA9IHtcbiAgICBlbWl0OiBmdW5jdGlvbihuYW1lOlN0cmluZywgZGF0YTpTdHJpbmcpIHtcbiAgICAgICAgZXZlbnRzQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbmFtZSwgZGF0YVxuICAgICAgICB9KVxuICAgIH1cbn0iLCJpbXBvcnQge1Byb21pc2VPdmVyV0tNZXNzYWdlfSBmcm9tICcuLi91dGlsL3Byb21pc2Utb3Zlci13a21lc3NhZ2UnO1xuXG5leHBvcnQgZGVmYXVsdCBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJub3RpZmljYXRpb25zXCIpO1xuIiwiaW1wb3J0IHByb21pc2VCcmlkZ2UgZnJvbSAnLi9ub3RpZmljYXRpb24tYnJpZGdlJztcblxuZXhwb3J0IGNvbnN0IG5vdGlmaWNhdGlvbiA9IHtcbiAgICBwZXJtaXNzaW9uOiBcInVua25vd25cIixcbiAgICByZXF1ZXN0UGVybWlzc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJyZXF1ZXN0UGVybWlzc2lvblwiXG4gICAgICAgfSlcbiAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVxdWVzdCByZXN1bHQ6XCIsIHJlc3VsdCk7XG4gICAgICAgfSlcbiAgICB9XG59O1xuXG5wcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgIG9wZXJhdGlvbjogXCJnZXRTdGF0dXNcIlxufSlcbi50aGVuKChzdGF0dXM6c3RyaW5nKSA9PiB7XG4gICAgLy8gY29uc29sZS5kZWJ1ZyhcIk5vdGlmaWNhdGlvbiBwZXJtaXNzaW9uOlwiLCBzdGF0dXMpXG4gICAgbm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPSBzdGF0dXM7XG59KTtcblxucHJvbWlzZUJyaWRnZS5vbihcIm5vdGlmaWNhdGlvbi1wZXJtaXNzaW9uLWNoYW5nZVwiLCAobmV3U3RhdHVzOnN0cmluZykgPT4ge1xuICAgIC8vIGNvbnNvbGUuZGVidWcoXCJSZWNlaXZlZCB1cGRhdGVkIG5vdGlmaWNhdGlvbiBwZXJtaXNzaW9uOlwiICsgbmV3U3RhdHVzKTtcbiAgICBub3RpZmljYXRpb24ucGVybWlzc2lvbiA9IHN0YXR1cztcbn0pO1xuXG4od2luZG93IGFzIGFueSkuTm90aWZpY2F0aW9uID0gbm90aWZpY2F0aW9uOyIsIi8vIGltcG9ydCAnd2hhdHdnLWZldGNoJztcbi8vIGltcG9ydCAnLi91dGlsL292ZXJyaWRlLWxvZ2dpbmcnO1xuaW1wb3J0ICcuL25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlcic7XG5pbXBvcnQgJy4vY29uc29sZSc7XG5pbXBvcnQgJy4vbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsJztcbmltcG9ydCAnLi91dGlsL2dlbmVyaWMtZXZlbnRzJztcbmltcG9ydCAnLi9ub3RpZmljYXRpb24vbm90aWZpY2F0aW9uJ1xuXG53aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbn1cblxuLy8gZG9jdW1lbnQuYm9keS5pbm5lckhUTUw9XCJUSElTIExPQURFRFwiIl0sIm5hbWVzIjpbImFyZ3VtZW50cyIsInRoaXMiLCJjb21tb25qc0hlbHBlcnMuY29tbW9uanNHbG9iYWwiLCJjb21tb25qc0hlbHBlcnMuaW50ZXJvcERlZmF1bHQiLCJ3ZWJraXQiLCJ1cmwucmVzb2x2ZSIsInByb21pc2VCcmlkZ2UiLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLFlBQVksQ0FBQzs7QUFFYixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQzs7Ozs7Ozs7OztBQVUxQyxJQUFJLE1BQU0sR0FBRyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssVUFBVSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7QUFVL0QsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7RUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztFQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLENBQUM7Q0FDM0I7Ozs7Ozs7OztBQVNELFNBQVMsWUFBWSxHQUFHLHdCQUF3Qjs7Ozs7Ozs7QUFRaEQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDOzs7Ozs7Ozs7QUFTM0MsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxVQUFVLEdBQUc7RUFDeEQsSUFBSSxN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QyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQ2xFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUN0RSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO01BQzFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO0tBQy9FOztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDbEQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsV0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVCOztJQUVELFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDN0MsTUFBTTtJQUNMLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNO1FBQ3pCLENBQUMsQ0FBQzs7SUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMzQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUVDLE1BQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDOztNQUVwRixRQUFRLEdBQUc7UUFDVCxLQUFLLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzFELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQzlELEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNsRTtVQUNFLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHRCxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDNUI7O1VBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNyRDtLQUNGO0dBQ0Y7O0VBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYixDQUFDOzs7Ozs7Ozs7O0FBVUYsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUM7TUFDdEMsR0FBRyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7RUFFMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7T0FDaEQ7SUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRztNQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVE7S0FDNUIsQ0FBQztHQUNIOztFQUVELE9BQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7Ozs7Ozs7OztBQVVGLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQzlELElBQUksUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQztNQUM1QyxHQUFHLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDOztFQUUxQyxJQUFJLENBQUMsSUFBSSxD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R0FBRyxFQUFFLElBQUksRUFBRTtJQUN0RCxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0gsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDakU7O0FBRUQsQUFBTyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzdCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUM1Rzs7QUFFRCxBQUFPLFNBQVMsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7SUFDM0MsT0FBTyxVQUFVLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUFFO0NBQ3hFOztBQUVELEFBQU8sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQ3pELE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtRQUN2RCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQzNGLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDM0YsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDL0ksSUFBSSxDQUFDLENBQUMsU0FBUyxH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QUFDO01BQzdELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO01BQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO01BQy9DLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQzNDLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztNQUM1QyxNQUFNLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDckMsTUFBTTtNQUNMLE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztLQUNyQztJQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxNQUFNLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7SUFDOUIsTUFBTSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUNsQyxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDNUIsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDckQsTUFBTSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDOztJQUU1QixJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtNQUNwQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztNQUM5QixJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztNQUM1QixNQUFNLENBQUMsSUFBSSxHQUFH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
