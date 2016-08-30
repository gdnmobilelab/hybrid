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
        console.log('url register?');
        var fullSWURL = resolve(window.location.href, urlToRegister);
        // let fullScopeURL:string = null;
        // if (options && options.scope) {
        //     fullScopeURL = url.resolve(window.location.href, options.scope);
        // }
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

var loadedIndicator = null;
window.__setHTML = function (htmlString, baseURL) {
    var insideHTMLTag = /<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(htmlString)[1].replace("</body>", "TEXT</body>");
    // insideHTMLTag = insideHTMLTag.replace("<head>",`<head><base href='${baseURL}'/>`)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcm9sbHVwLXBsdWdpbi10eXBlc2NyaXB0L3NyYy90eXBlc2NyaXB0LWhlbHBlcnMuanMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlLnRzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvbm9kZV9tb2R1bGVzL3B1bnljb2RlL3B1bnljb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXRpbC5qcyIsIi4uLy4uL2pzLXNyYy9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmcvZGVjb2RlLmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy9lbmNvZGUuanMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL25vZGVfbW9kdWxlcy91cmwvdXJsLmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL3BvcnQtc3RvcmUudHMiLCIuLi8uLi9qcy1zcmMvbm9kZV9tb2R1bGVzL3Byb21pc2UtdG9vbHMvbGliL2luZGV4LmpzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L21lc3NhZ2VzL21lc3NhZ2UtY2hhbm5lbC50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc3ctbWFuYWdlci50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9uYXZpZ2F0b3Ivc2VydmljZS13b3JrZXIudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvY29uc29sZS50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL2dlbmVyaWMtZXZlbnRzLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25vdGlmaWNhdGlvbi9ub3RpZmljYXRpb24tYnJpZGdlLnRzIiwiLi4vLi4vanMtc3JjL3NyYy93ZWJ2aWV3L25vdGlmaWNhdGlvbi9ub3RpZmljYXRpb24udHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvdXRpbC9zZXQtZG9jdW1lbnQtaHRtbC50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy9kb2N1bWVudC1zdGFydC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn1cbiIsImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5jb25zdCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG4vLyBXZSBuZWVkIHRoZXNlIGNhbGxiYWNrcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlLlxuY29uc3QgcHJvbWlzZUNhbGxiYWNrczoge1trZXk6c3RyaW5nXTogRnVuY3Rpb259ID0ge307XG5jb25zdCBwcm9taXNlQnJpZGdlczoge1trZXk6c3RyaW5nXTogUHJvbWlzZU92ZXJXS01lc3NhZ2V9ID0ge307XG4od2luZG93IGFzIGFueSkuX19wcm9taXNlQnJpZGdlQ2FsbGJhY2tzID0gcHJvbWlzZUNhbGxiYWNrcztcbih3aW5kb3cgYXMgYW55KS5fX3Byb21pc2VCcmlkZ2VzID0gcHJvbWlzZUJyaWRnZXM7XG5cbmV4cG9ydCBjbGFzcyBQcm9taXNlT3ZlcldLTWVzc2FnZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICBwcml2YXRlIGNhbGxiYWNrQXJyYXk6W0Z1bmN0aW9uLCBGdW5jdGlvbl1bXSA9IFtdXG4gICAgcHJpdmF0ZSBuYW1lOnN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6c3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgaWYgKCF3ZWJraXQubWVzc2FnZUhhbmRsZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1lc3NhZ2UgaGFuZGxlciBcIiR7bmFtZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdlYmtpdC5tZXNzYWdlSGFuZGxlcnNbbmFtZV0uX3JlY2VpdmUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvbWlzZSBicmlkZ2UgZm9yIFwiJHtuYW1lfVwiIGFscmVhZHkgZXhpc3RzXCJgKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwcm9taXNlQ2FsbGJhY2tzW25hbWVdID0gdGhpcy5yZWNlaXZlUmVzcG9uc2UuYmluZCh0aGlzKTtcbiAgICAgICAgcHJvbWlzZUJyaWRnZXNbbmFtZV0gPSB0aGlzO1xuICAgIH1cblxuICAgIGJyaWRnZVByb21pc2UobWVzc2FnZTphbnkpIHtcblxuICAgICAgICAvLyBGaW5kIHRoZSBuZXh0IGF2YWlsYWJsZSBzbG90IGluIG91ciBjYWxsYmFjayBhcnJheVxuXG4gICAgICAgIGxldCBjYWxsYmFja0luZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSkge1xuICAgICAgICAgICAgY2FsbGJhY2tJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIE5vdyBpbnNlcnQgb3VyIGNhbGxiYWNrIGludG8gdGhlIGNhY2hlZCBhcnJheS5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdID0gW2Z1bGZpbGwsIHJlamVjdF07XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VuZGluZ1wiLCB7Y2FsbGJhY2tJbmRleCwgbWVzc2FnZX0pXG4gICAgICAgICAgICB3ZWJraXQubWVzc2FnZUhhbmRsZXJzW3RoaXMubmFtZV0ucG9zdE1lc3NhZ2Uoe2NhbGxiYWNrSW5kZXgsIG1lc3NhZ2V9KTtcblxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgc2VuZChtZXNzYWdlOmFueSkge1xuICAgICAgICBcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB3ZSBvbmx5IHdhbnQgdG8gc2VuZCBhbmQgYXJlIG5vdCBleHBlY3RpbmcgYSByZXNwb25zZVxuICAgICAgICB3ZWJraXQubWVzc2FnZUhhbmRsZXJzW3RoaXMubmFtZV0ucG9zdE1lc3NhZ2Uoe21lc3NhZ2V9KTtcbiAgICB9XG5cbiAgICByZWNlaXZlUmVzcG9uc2UoY2FsbGJhY2tJbmRleDpudW1iZXIsIGVycjpzdHJpbmcsIHJlc3BvbnNlOiBhbnkpIHtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdGhpc0NhbGxiYWNrID0gdGhpcy5jYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXRoaXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHVzZSBhIGNhbGxiYWNrIHRoYXQgZGlkbid0IGV4aXN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmcmVlIHVwIHRoaXMgc2xvdCBmb3IgbmV4dCBvcGVyYXRpb25cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcnJheVtjYWxsYmFja0luZGV4XSA9IG51bGw7XG5cbiAgICAgICAgICAgIGxldCBbZnVsZmlsbCwgcmVqZWN0XSA9IHRoaXNDYWxsYmFjaztcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZ1bGZpbGwocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsIi8qISBodHRwczovL210aHMuYmUvcHVueWNvZGUgdjEuMy4yIGJ5IEBtYXRoaWFzICovXG47KGZ1bmN0aW9uKHJvb3QpIHtcblxuXHQvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGVzICovXG5cdHZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiZcblx0XHQhZXhwb3J0cy5ub2RlVHlwZSAmJiBleHBvcnRzO1xuXHR2YXIgZnJlZU1vZHVsZSA9IHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmXG5cdFx0IW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cdHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWw7XG5cdGlmIChcblx0XHRmcmVlR2xvYmFsLmdsb2JhbCA9PT0gZnJlZUdsb2JhbCB8fFxuXHRcdGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsIHx8XG5cdFx0ZnJlZUdsb2JhbC5zZWxmID09PSBmcmVlR2xvYmFsXG5cdCkge1xuXHRcdHJvb3QgPSBmcmVlR2xvYmFsO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcHVueWNvZGVgIG9iamVjdC5cblx0ICogQG5hbWUgcHVueWNvZGVcblx0ICogQHR5cGUgT2JqZWN0XG5cdCAqL1xuXHR2YXIgcHVueWNvZGUsXG5cblx0LyoqIEhpZ2hlc3QgcG9zaXRpdmUgc2lnbmVkIDMyLWJpdCBmbG9hdCB2YWx1ZSAqL1xuXHRtYXhJbnQgPSAyMTQ3NDgzNjQ3LCAvLyBha2EuIDB4N0ZGRkZGRkYgb3IgMl4zMS0xXG5cblx0LyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuXHRiYXNlID0gMzYsXG5cdHRNaW4gPSAxLFxuXHR0TWF4ID0gMjYsXG5cdHNrZXcgPSAzOCxcblx0ZGFtcCA9IDcwMCxcblx0aW5pdGlhbEJpYXMgPSA3Mixcblx0aW5pdGlhbE4gPSAxMjgsIC8vIDB4ODBcblx0ZGVsaW1pdGVyID0gJy0nLCAvLyAnXFx4MkQnXG5cblx0LyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cblx0cmVnZXhQdW55Y29kZSA9IC9eeG4tLS8sXG5cdHJlZ2V4Tm9uQVNDSUkgPSAvW15cXHgyMC1cXHg3RV0vLCAvLyB1bnByaW50YWJsZSBBU0NJSSBjaGFycyArIG5vbi1BU0NJSSBjaGFyc1xuXHRyZWdleFNlcGFyYXRvcnMgPSAvW1xceDJFXFx1MzAwMlxcdUZGMEVcXHVGRjYxXS9nLCAvLyBSRkMgMzQ5MCBzZXBhcmF0b3JzXG5cblx0LyoqIEVycm9yIG1lc3NhZ2VzICovXG5cdGVycm9ycyA9IHtcblx0XHQnb3ZlcmZsb3cnOiAnT3ZlcmZsb3c6IGlucHV0IG5lZWRzIHdpZGVyIGludGVnZXJzIHRvIHByb2Nlc3MnLFxuXHRcdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdFx0J2ludmFsaWQtaW5wdXQnOiAnSW52YWxpZCBpbnB1dCdcblx0fSxcblxuXHQvKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5cdGJhc2VNaW51c1RNaW4gPSBiYXNlIC0gdE1pbixcblx0Zmxvb3IgPSBNYXRoLmZsb29yLFxuXHRzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxuXG5cdC8qKiBUZW1wb3JhcnkgdmFyaWFibGUgKi9cblx0a2V5O1xuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIGVycm9yIHR5cGUuXG5cdCAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cblx0ICovXG5cdGZ1bmN0aW9uIGVycm9yKHR5cGUpIHtcblx0XHR0aHJvdyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG5cdH1cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuXHQgKiBpdGVtLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXAoYXJyYXksIGZuKSB7XG5cdFx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0XHRyZXN1bHRbbGVuZ3RoXSA9IGZuKGFycmF5W2xlbmd0aF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncyBvciBlbWFpbFxuXHQgKiBhZGRyZXNzZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeVxuXHQgKiBjaGFyYWN0ZXIuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgc3RyaW5nIG9mIGNoYXJhY3RlcnMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrXG5cdCAqIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwRG9tYWluKHN0cmluZywgZm4pIHtcblx0XHR2YXIgcGFydHMgPSBzdHJpbmcuc3BsaXQoJ0AnKTtcblx0XHR2YXIgcmVzdWx0ID0gJyc7XG5cdFx0aWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdC8vIEluIGVtYWlsIGFkZHJlc3Nlcywgb25seSB0aGUgZG9tYWluIG5hbWUgc2hvdWxkIGJlIHB1bnljb2RlZC4gTGVhdmVcblx0XHRcdC8vIHRoZSBsb2NhbCBwYXJ0IChpLmUuIGV2ZXJ5dGhpbmcgdXAgdG8gYEBgKSBpbnRhY3QuXG5cdFx0XHRyZXN1bHQgPSBwYXJ0c1swXSArICdAJztcblx0XHRcdHN0cmluZyA9IHBhcnRzWzFdO1xuXHRcdH1cblx0XHQvLyBBdm9pZCBgc3BsaXQocmVnZXgpYCBmb3IgSUU4IGNvbXBhdGliaWxpdHkuIFNlZSAjMTcuXG5cdFx0c3RyaW5nID0gc3RyaW5nLnJlcGxhY2UocmVnZXhTZXBhcmF0b3JzLCAnXFx4MkUnKTtcblx0XHR2YXIgbGFiZWxzID0gc3RyaW5nLnNwbGl0KCcuJyk7XG5cdFx0dmFyIGVuY29kZWQgPSBtYXAobGFiZWxzLCBmbikuam9pbignLicpO1xuXHRcdHJldHVybiByZXN1bHQgKyBlbmNvZGVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcblx0ICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuXHQgKiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udmVydCBhIHBhaXIgb2Ygc3Vycm9nYXRlIGhhbHZlcyAoZWFjaCBvZiB3aGljaFxuXHQgKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcblx0ICogbWF0Y2hpbmcgVVRGLTE2LlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmVuY29kZWBcblx0ICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGRlY29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgY291bnRlciA9IDAsXG5cdFx0ICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG5cdFx0ICAgIHZhbHVlLFxuXHRcdCAgICBleHRyYTtcblx0XHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKHZhbHVlID49IDB4RDgwMCAmJiB2YWx1ZSA8PSAweERCRkYgJiYgY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gbG93IHN1cnJvZ2F0ZVxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcblx0XHRcdFx0XHQvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0Y291bnRlci0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHN0cmluZyBiYXNlZCBvbiBhbiBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZW5jb2RlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJlbmNvZGUoYXJyYXkpIHtcblx0XHRyZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0dmFyIG91dHB1dCA9ICcnO1xuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XG5cdFx0XHRcdHZhbHVlIC09IDB4MTAwMDA7XG5cdFx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApO1xuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fSkuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuXHQgKiBAc2VlIGBkaWdpdFRvQmFzaWMoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQgKGZvciB1c2UgaW5cblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuXHQgKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGJhc2ljVG9EaWdpdChjb2RlUG9pbnQpIHtcblx0XHRpZiAoY29kZVBvaW50IC0gNDggPCAxMCkge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDIyO1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gNjUgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDY1O1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gOTcgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDk3O1xuXHRcdH1cblx0XHRyZXR1cm4gYmFzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRpZ2l0L2ludGVnZXIgaW50byBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGlnaXQgVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuXHQgKiBgMGAgdG8gYGJhc2UgLSAxYC4gSWYgYGZsYWdgIGlzIG5vbi16ZXJvLCB0aGUgdXBwZXJjYXNlIGZvcm0gaXNcblx0ICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcblx0ICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cblx0ICovXG5cdGZ1bmN0aW9uIGRpZ2l0VG9CYXNpYyhkaWdpdCwgZmxhZykge1xuXHRcdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdFx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdFx0cmV0dXJuIGRpZ2l0ICsgMjIgKyA3NSAqIChkaWdpdCA8IDI2KSAtICgoZmxhZyAhPSAwKSA8PCA1KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuXHQgKiBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG5cdCAqIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG5cdCAqIHRvIFVuaWNvZGUuIE9ubHkgdGhlIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgaW5wdXQgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS5cblx0ICogaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgb24gYSBzdHJpbmcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuXG5cdCAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZWQgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleFB1bnljb2RlLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG5cdCAqIFB1bnljb2RlLiBPbmx5IHRoZSBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLFxuXHQgKiBpLmUuIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW5cblx0ICogQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG8gY29udmVydCwgYXMgYVxuXHQgKiBVbmljb2RlIHN0cmluZy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZSBvclxuXHQgKiBlbWFpbCBhZGRyZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShpbnB1dCkge1xuXHRcdHJldHVybiBtYXBEb21haW4oaW5wdXQsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4Tm9uQVNDSUkudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5cdHB1bnljb2RlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBTdHJpbmdcblx0XHQgKi9cblx0XHQndmVyc2lvbic6ICcxLjMuMicsXG5cdFx0LyoqXG5cdFx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0XHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHRcdCAqIEBzZWUgPGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmIGZyZWVNb2R1bGUpIHtcblx0XHRpZiAobW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMpIHsgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7IC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXG5cdFx0XHRmb3IgKGtleSBpbiBwdW55Y29kZSkge1xuXHRcdFx0XHRwdW55Y29kZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChmcmVlRXhwb3J0c1trZXldID0gcHVueWNvZGVba2V5XSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgeyAvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXNTdHJpbmc6IGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiB0eXBlb2YoYXJnKSA9PT0gJ3N0cmluZyc7XG4gIH0sXG4gIGlzT2JqZWN0OiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbiAgfSxcbiAgaXNOdWxsOiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gYXJnID09PSBudWxsO1xuICB9LFxuICBpc051bGxPclVuZGVmaW5lZDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGFyZyA9PSBudWxsO1xuICB9XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeVByaW1pdGl2ZSA9IGZ1bmN0aW9uKHYpIHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdjtcblxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHYgPyAndHJ1ZScgOiAnZmFsc2UnO1xuXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBpc0Zpbml0ZSh2KSA/IHYgOiAnJztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBzZXAsIGVxLCBuYW1lKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgb2JqID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubWFwKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBrcyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUoaykpICsgZXE7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpba10pKSB7XG4gICAgICAgIHJldHVybiBvYmpba10ubWFwKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHB1bnljb2RlID0gcmVxdWlyZSgncHVueWNvZGUnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbmV4cG9ydHMucGFyc2UgPSB1cmxQYXJzZTtcbmV4cG9ydHMucmVzb2x2ZSA9IHVybFJlc29sdmU7XG5leHBvcnRzLnJlc29sdmVPYmplY3QgPSB1cmxSZXNvbHZlT2JqZWN0O1xuZXhwb3J0cy5mb3JtYXQgPSB1cmxGb3JtYXQ7XG5cbmV4cG9ydHMuVXJsID0gVXJsO1xuXG5mdW5jdGlvbiBVcmwoKSB7XG4gIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICB0aGlzLnNsYXNoZXMgPSBudWxsO1xuICB0aGlzLmF1dGggPSBudWxsO1xuICB0aGlzLmhvc3QgPSBudWxsO1xuICB0aGlzLnBvcnQgPSBudWxsO1xuICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgdGhpcy5oYXNoID0gbnVsbDtcbiAgdGhpcy5zZWFyY2ggPSBudWxsO1xuICB0aGlzLnF1ZXJ5ID0gbnVsbDtcbiAgdGhpcy5wYXRobmFtZSA9IG51bGw7XG4gIHRoaXMucGF0aCA9IG51bGw7XG4gIHRoaXMuaHJlZiA9IG51bGw7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG52YXIgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaSxcbiAgICBwb3J0UGF0dGVybiA9IC86WzAtOV0qJC8sXG5cbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIGEgc2ltcGxlIHBhdGggVVJMXG4gICAgc2ltcGxlUGF0aFBhdHRlcm4gPSAvXihcXC9cXC8/KD8hXFwvKVteXFw/XFxzXSopKFxcP1teXFxzXSopPyQvLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbiAgICAvLyBXZSBhY3R1YWxseSBqdXN0IGF1dG8tZXNjYXBlIHRoZXNlLlxuICAgIGRlbGltcyA9IFsnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCddLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgbm90IGFsbG93ZWQgZm9yIHZhcmlvdXMgcmVhc29ucy5cbiAgICB1bndpc2UgPSBbJ3snLCAnfScsICd8JywgJ1xcXFwnLCAnXicsICdgJ10uY29uY2F0KGRlbGltcyksXG5cbiAgICAvLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG4gICAgYXV0b0VzY2FwZSA9IFsnXFwnJ10uY29uY2F0KHVud2lzZSksXG4gICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbiAgICAvLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4gICAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4gICAgLy8gdGhlbS5cbiAgICBub25Ib3N0Q2hhcnMgPSBbJyUnLCAnLycsICc/JywgJzsnLCAnIyddLmNvbmNhdChhdXRvRXNjYXBlKSxcbiAgICBob3N0RW5kaW5nQ2hhcnMgPSBbJy8nLCAnPycsICcjJ10sXG4gICAgaG9zdG5hbWVNYXhMZW4gPSAyNTUsXG4gICAgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eWythLXowLTlBLVpfLV17MCw2M30kLyxcbiAgICBob3N0bmFtZVBhcnRTdGFydCA9IC9eKFsrYS16MC05QS1aXy1dezAsNjN9KSguKikkLyxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbiAgICB1bnNhZmVQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbiAgICBob3N0bGVzc1Byb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG4gICAgc2xhc2hlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2h0dHBzOic6IHRydWUsXG4gICAgICAnZnRwOic6IHRydWUsXG4gICAgICAnZ29waGVyOic6IHRydWUsXG4gICAgICAnZmlsZTonOiB0cnVlXG4gICAgfSxcbiAgICBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbmZ1bmN0aW9uIHVybFBhcnNlKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKHVybCAmJiB1dGlsLmlzT2JqZWN0KHVybCkgJiYgdXJsIGluc3RhbmNlb2YgVXJsKSByZXR1cm4gdXJsO1xuXG4gIHZhciB1ID0gbmV3IFVybDtcbiAgdS5wYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KTtcbiAgcmV0dXJuIHU7XG59XG5cblVybC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICghdXRpbC5pc1N0cmluZyh1cmwpKSB7XG4gICAgY29uc29sZS5sb2coXCJVUkwgSVNcIiwgdXJsKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICAvLyBDb3B5IGNocm9tZSwgSUUsIG9wZXJhIGJhY2tzbGFzaC1oYW5kbGluZyBiZWhhdmlvci5cbiAgLy8gQmFjayBzbGFzaGVzIGJlZm9yZSB0aGUgcXVlcnkgc3RyaW5nIGdldCBjb252ZXJ0ZWQgdG8gZm9yd2FyZCBzbGFzaGVzXG4gIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gIHZhciBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKSxcbiAgICAgIHNwbGl0dGVyID1cbiAgICAgICAgICAocXVlcnlJbmRleCAhPT0gLTEgJiYgcXVlcnlJbmRleCA8IHVybC5pbmRleE9mKCcjJykpID8gJz8nIDogJyMnLFxuICAgICAgdVNwbGl0ID0gdXJsLnNwbGl0KHNwbGl0dGVyKSxcbiAgICAgIHNsYXNoUmVnZXggPSAvXFxcXC9nO1xuICB1U3BsaXRbMF0gPSB1U3BsaXRbMF0ucmVwbGFjZShzbGFzaFJlZ2V4LCAnLycpO1xuICB1cmwgPSB1U3BsaXQuam9pbihzcGxpdHRlcik7XG5cbiAgdmFyIHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiB1cmwuc3BsaXQoJyMnKS5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUcnkgZmFzdCBwYXRoIHJlZ2V4cFxuICAgIHZhciBzaW1wbGVQYXRoID0gc2ltcGxlUGF0aFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgICBpZiAoc2ltcGxlUGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gcmVzdDtcbiAgICAgIHRoaXMuaHJlZiA9IHJlc3Q7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5zZWFyY2guc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gdGhpcy5zZWFyY2guc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICAgICAgdGhpcy5xdWVyeSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSlcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcblxuICAgIHRoaXMuaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIC8vIElETkEgU3VwcG9ydDogUmV0dXJucyBhIHB1bnljb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgICAgLy8gSXQgb25seSBjb252ZXJ0cyBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgICAgLy8gaGF2ZSBub24tQVNDSUkgY2hhcmFjdGVycywgaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZlxuICAgICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgQVNDSUktb25seS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHRoaXMuaG9zdG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBwID0gdGhpcy5wb3J0ID8gJzonICsgdGhpcy5wb3J0IDogJyc7XG4gICAgdmFyIGggPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuICAgIHRoaXMuaHJlZiArPSB0aGlzLmhvc3Q7XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIGlmIChyZXN0WzBdICE9PSAnLycpIHtcbiAgICAgICAgcmVzdCA9ICcvJyArIHJlc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIGlmIChyZXN0LmluZGV4T2YoYWUpID09PSAtMSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgdGhpcy5xdWVyeSA9IHJlc3Quc3Vic3RyKHFtICsgMSk7XG4gICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIHRoaXMuc2VhcmNoID0gJyc7XG4gICAgdGhpcy5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmICh0aGlzLnBhdGhuYW1lIHx8IHRoaXMuc2VhcmNoKSB7XG4gICAgdmFyIHAgPSB0aGlzLnBhdGhuYW1lIHx8ICcnO1xuICAgIHZhciBzID0gdGhpcy5zZWFyY2ggfHwgJyc7XG4gICAgdGhpcy5wYXRoID0gcCArIHM7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgdGhpcy5ocmVmID0gdGhpcy5mb3JtYXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmb3JtYXQgYSBwYXJzZWQgb2JqZWN0IGludG8gYSB1cmwgc3RyaW5nXG5mdW5jdGlvbiB1cmxGb3JtYXQob2JqKSB7XG4gIC8vIGVuc3VyZSBpdCdzIGFuIG9iamVjdCwgYW5kIG5vdCBhIHN0cmluZyB1cmwuXG4gIC8vIElmIGl0J3MgYW4gb2JqLCB0aGlzIGlzIGEgbm8tb3AuXG4gIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGNhbGwgdXJsX2Zvcm1hdCgpIG9uIHN0cmluZ3NcbiAgLy8gdG8gY2xlYW4gdXAgcG90ZW50aWFsbHkgd29ua3kgdXJscy5cbiAgaWYgKHV0aWwuaXNTdHJpbmcob2JqKSkgb2JqID0gdXJsUGFyc2Uob2JqKTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgVXJsKSkgcmV0dXJuIFVybC5wcm90b3R5cGUuZm9ybWF0LmNhbGwob2JqKTtcbiAgcmV0dXJuIG9iai5mb3JtYXQoKTtcbn1cblxuVXJsLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF1dGggPSB0aGlzLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGVuY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICBhdXRoID0gYXV0aC5yZXBsYWNlKC8lM0EvaSwgJzonKTtcbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IHRoaXMucHJvdG9jb2wgfHwgJycsXG4gICAgICBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgJycsXG4gICAgICBoYXNoID0gdGhpcy5oYXNoIHx8ICcnLFxuICAgICAgaG9zdCA9IGZhbHNlLFxuICAgICAgcXVlcnkgPSAnJztcblxuICBpZiAodGhpcy5ob3N0KSB7XG4gICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gIH0gZWxzZSBpZiAodGhpcy5ob3N0bmFtZSkge1xuICAgIGhvc3QgPSBhdXRoICsgKHRoaXMuaG9zdG5hbWUuaW5kZXhPZignOicpID09PSAtMSA/XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgOlxuICAgICAgICAnWycgKyB0aGlzLmhvc3RuYW1lICsgJ10nKTtcbiAgICBpZiAodGhpcy5wb3J0KSB7XG4gICAgICBob3N0ICs9ICc6JyArIHRoaXMucG9ydDtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5xdWVyeSAmJlxuICAgICAgdXRpbC5pc09iamVjdCh0aGlzLnF1ZXJ5KSAmJlxuICAgICAgT2JqZWN0LmtleXModGhpcy5xdWVyeSkubGVuZ3RoKSB7XG4gICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gIH1cblxuICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKHRoaXMuc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHBhdGhuYW1lID0gcGF0aG5hbWUucmVwbGFjZSgvWz8jXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQobWF0Y2gpO1xuICB9KTtcbiAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoJyMnLCAnJTIzJyk7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZShyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmVPYmplY3QodXJsUGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKSkuZm9ybWF0KCk7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmVPYmplY3QocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmVPYmplY3QgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICBpZiAodXRpbC5pc1N0cmluZyhyZWxhdGl2ZSkpIHtcbiAgICB2YXIgcmVsID0gbmV3IFVybCgpO1xuICAgIHJlbC5wYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgIHJlbGF0aXZlID0gcmVsO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBVcmwoKTtcbiAgdmFyIHRrZXlzID0gT2JqZWN0LmtleXModGhpcyk7XG4gIGZvciAodmFyIHRrID0gMDsgdGsgPCB0a2V5cy5sZW5ndGg7IHRrKyspIHtcbiAgICB2YXIgdGtleSA9IHRrZXlzW3RrXTtcbiAgICByZXN1bHRbdGtleV0gPSB0aGlzW3RrZXldO1xuICB9XG5cbiAgLy8gaGFzaCBpcyBhbHdheXMgb3ZlcnJpZGRlbiwgbm8gbWF0dGVyIHdoYXQuXG4gIC8vIGV2ZW4gaHJlZj1cIlwiIHdpbGwgcmVtb3ZlIGl0LlxuICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgLy8gaWYgdGhlIHJlbGF0aXZlIHVybCBpcyBlbXB0eSwgdGhlbiB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBkbyBoZXJlLlxuICBpZiAocmVsYXRpdmUuaHJlZiA9PT0gJycpIHtcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIC8vIHRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICB2YXIgcmtleXMgPSBPYmplY3Qua2V5cyhyZWxhdGl2ZSk7XG4gICAgZm9yICh2YXIgcmsgPSAwOyByayA8IHJrZXlzLmxlbmd0aDsgcmsrKykge1xuICAgICAgdmFyIHJrZXkgPSBya2V5c1tya107XG4gICAgICBpZiAocmtleSAhPT0gJ3Byb3RvY29sJylcbiAgICAgICAgcmVzdWx0W3JrZXldID0gcmVsYXRpdmVbcmtleV07XG4gICAgfVxuXG4gICAgLy91cmxQYXJzZSBhcHBlbmRzIHRyYWlsaW5nIC8gdG8gdXJscyBsaWtlIGh0dHA6Ly93d3cuZXhhbXBsZS5jb21cbiAgICBpZiAoc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmICFyZXN1bHQucGF0aG5hbWUpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gcmVzdWx0LnBhdGhuYW1lID0gJy8nO1xuICAgIH1cblxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHJlc3VsdC5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBrZXlzLmxlbmd0aDsgdisrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1t2XTtcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgICB9XG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgaWYgKCFyZWxhdGl2ZS5ob3N0ICYmICFob3N0bGVzc1Byb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgdmFyIHJlbFBhdGggPSAocmVsYXRpdmUucGF0aG5hbWUgfHwgJycpLnNwbGl0KCcvJyk7XG4gICAgICB3aGlsZSAocmVsUGF0aC5sZW5ndGggJiYgIShyZWxhdGl2ZS5ob3N0ID0gcmVsUGF0aC5zaGlmdCgpKSk7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3QpIHJlbGF0aXZlLmhvc3QgPSAnJztcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gJyc7XG4gICAgICBpZiAocmVsUGF0aFswXSAhPT0gJycpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICBpZiAocmVsUGF0aC5sZW5ndGggPCAyKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHJlc3VsdC5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy8gdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnBhdGhuYW1lIHx8IHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHZhciBwID0gcmVzdWx0LnBhdGhuYW1lIHx8ICcnO1xuICAgICAgdmFyIHMgPSByZXN1bHQuc2VhcmNoIHx8ICcnO1xuICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICB9XG4gICAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB2YXIgaXNTb3VyY2VBYnMgPSAocmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyksXG4gICAgICBpc1JlbEFicyA9IChcbiAgICAgICAgICByZWxhdGl2ZS5ob3N0IHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gcmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSByZXN1bHQucHJvdG9jb2wgJiYgIXNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHJlc3VsdC5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gJyc7XG4gICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgIGlmIChyZXN1bHQuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChyZXN1bHQuaG9zdCk7XG4gICAgfVxuICAgIHJlc3VsdC5ob3N0ID0gJyc7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZS5wb3J0ID0gbnVsbDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgcmVsYXRpdmUuaG9zdCA9IG51bGw7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHJlc3VsdC5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiByZXN1bHQuaG9zdDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiByZXN1bHQuaG9zdG5hbWU7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCF1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKHJlbGF0aXZlLnNlYXJjaCkpIHtcbiAgICAvLyBqdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgLy8gbGlrZSBocmVmPSc/Zm9vJy5cbiAgICAvLyBQdXQgdGhpcyBhZnRlciB0aGUgb3RoZXIgdHdvIGNhc2VzIGJlY2F1c2UgaXQgc2ltcGxpZmllcyB0aGUgYm9vbGVhbnNcbiAgICBpZiAocHN5Y2hvdGljKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKTtcbiAgICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAgIC8vdGhpcyBlc3BlY2lhbGx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKCF1dGlsLmlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICF1dGlsLmlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQuc2VhcmNoKSB7XG4gICAgICByZXN1bHQucGF0aCA9ICcvJyArIHJlc3VsdC5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGlmIGEgdXJsIEVORHMgaW4gLiBvciAuLiwgdGhlbiBpdCBtdXN0IGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgLy8gdGhlbiBpdCBtdXN0IE5PVCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIGxhc3QgPSBzcmNQYXRoLnNsaWNlKC0xKVswXTtcbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSAoXG4gICAgICAocmVzdWx0Lmhvc3QgfHwgcmVsYXRpdmUuaG9zdCB8fCBzcmNQYXRoLmxlbmd0aCA+IDEpICYmXG4gICAgICAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8IGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWxseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgfVxuICB9XG5cbiAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICBpZiAobXVzdEVuZEFicyAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmICghdXRpbC5pc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhdXRpbC5pc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICB9XG4gIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCByZXN1bHQuYXV0aDtcbiAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG59O1xuIiwiaW1wb3J0IHtNZXNzYWdlUG9ydFdyYXBwZXJ9IGZyb20gJy4vbWVzc2FnZS1jaGFubmVsJztcblxuY29uc3QgYWN0aXZlTWVzc2FnZVBvcnRzOk1lc3NhZ2VQb3J0V3JhcHBlcltdID0gW11cblxuY29uc3QgUG9ydFN0b3JlID0ge1xuXG4gICAgYWRkOiBmdW5jdGlvbiAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpIHtcbiAgICAgICAgaWYgKGFjdGl2ZU1lc3NhZ2VQb3J0cy5pbmRleE9mKHBvcnQpID4gLTEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyeWluZyB0byBhZGQgYSBwb3J0IHRoYXQncyBhbHJlYWR5IGJlZW4gYWRkZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgYWN0aXZlTWVzc2FnZVBvcnRzLnB1c2gocG9ydCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKHBvcnQ6TWVzc2FnZVBvcnRXcmFwcGVyKSB7XG4gICAgICAgIGFjdGl2ZU1lc3NhZ2VQb3J0cy5zcGxpY2UoYWN0aXZlTWVzc2FnZVBvcnRzLmluZGV4T2YocG9ydCksIDEpO1xuICAgIH0sXG5cbiAgICBmaW5kQnlOYXRpdmVJbmRleDogZnVuY3Rpb24obmF0aXZlSW5kZXg6bnVtYmVyKTpNZXNzYWdlUG9ydFdyYXBwZXIge1xuICAgICAgICBsZXQgZXhpc3RpbmcgPSBhY3RpdmVNZXNzYWdlUG9ydHMuZmlsdGVyKChwKSA9PiBwLm5hdGl2ZVBvcnRJbmRleCA9PT0gbmF0aXZlSW5kZXgpO1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdbMF07XG4gICAgfSxcblxuICAgIGZpbmRPckNyZWF0ZUJ5TmF0aXZlSW5kZXg6IGZ1bmN0aW9uKG5hdGl2ZUluZGV4Om51bWJlcik6TWVzc2FnZVBvcnRXcmFwcGVyIHtcbiAgICAgICAgaWYgKCFuYXRpdmVJbmRleCAmJiBuYXRpdmVJbmRleCAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIGEgbmF0aXZlIGluZGV4XCIpXG4gICAgICAgIH1cbiAgICAgIFxuICAgICAgICBsZXQgZXhpc3RpbmcgPSBQb3J0U3RvcmUuZmluZEJ5TmF0aXZlSW5kZXgobmF0aXZlSW5kZXgpO1xuXG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBoYXZlIGEgcG9ydCBmb3IgdGhpcy4gUmV0dXJuIGl0LlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgbm90LCBtYWtlIGEgbmV3IG9uZVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKCk7XG4gICAgICAgIG5ld0N1c3RvbS5uYXRpdmVQb3J0SW5kZXggPSBuYXRpdmVJbmRleDtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IHdlYiBNZXNzYWdlUG9ydCBmb3IgbmF0aXZlIGluZGV4XCIsIG5hdGl2ZUluZGV4KVxuICAgICAgICBcbiAgICAgICAgLy8gdGhpcyBhbHJlYWR5IGhhcyBhIGJyaWRnZSwgc28gd2UgY29uc2lkZXIgaXQgJ2FjdGl2ZSdcbiAgICAgICAgUG9ydFN0b3JlLmFkZChuZXdDdXN0b20pO1xuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tXG4gICAgfSxcblxuICAgIGZpbmRPcldyYXBKU01lc3NzYWdlUG9ydDogZnVuY3Rpb24ocG9ydDpNZXNzYWdlUG9ydCk6IE1lc3NhZ2VQb3J0V3JhcHBlciB7XG4gICAgICAgIGxldCBleGlzdGluZyA9IGFjdGl2ZU1lc3NhZ2VQb3J0cy5maWx0ZXIoKHApID0+IHAuanNNZXNzYWdlUG9ydCA9PSBwb3J0KTtcblxuICAgICAgICBpZiAoZXhpc3RpbmcubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgaGF2ZSBhIHBvcnQgZm9yIHRoaXMuIFJldHVybiBpdC5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXdDdXN0b20gPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuXG4gICAgICAgIC8vIHRoaXMgaGFzIG5vdCB5ZXQgYmVlbiBnaXZlbiBhIG5hdGl2ZSBpbmRleCwgc28gd2UgZG8gbm90XG4gICAgICAgIC8vIGNvbnNpZGVyIGl0IGFjdGl2ZS5cblxuICAgICAgICByZXR1cm4gbmV3Q3VzdG9tO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUG9ydFN0b3JlO1xuXG4vLyBmb3IgdGVzdGluZ1xuKHdpbmRvdyBhcyBhbnkpLmh5YnJpZFBvcnRTdG9yZSA9IFBvcnRTdG9yZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH1cblxudmFyIGhhc1Byb3AgPSAoe30pLmhhc093blByb3BlcnR5O1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChjaGlsZCwgcGFyZW50KSB7XG4gICAgZm9yICh2YXIga2V5IGluIHBhcmVudCkge1xuICAgICAgICBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkge1xuICAgICAgICAgICAgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICB9XG4gICAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuXG52YXIgVGltZW91dEVycm9yID0gZXhwb3J0cy5UaW1lb3V0RXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW1lb3V0RXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGltZW91dEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBiZXR0ZXIsIGJlY2F1c2UgaXQgbWFrZXMgdGhlIHJlc3VsdGluZyBzdGFjayB0cmFjZSBoYXZlIHRoZSBjb3JyZWN0IGVycm9yIG5hbWUuICBCdXQsIGl0XG4gICAgICAgIC8vIG9ubHkgd29ya3MgaW4gVjgvQ2hyb21lLlxuICAgICAgICBUaW1lb3V0RXJyb3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhY2tpbmVzcyBmb3Igb3RoZXIgYnJvd3NlcnMuXG4gICAgICAgIHRoaXMuc3RhY2sgPSBuZXcgRXJyb3IobWVzc2FnZSkuc3RhY2s7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gXCJUaW1lb3V0RXJyb3JcIjtcbn07XG5leHRlbmQoVGltZW91dEVycm9yLCBFcnJvcik7XG5cbi8qXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBgbXNgIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQuICBUaGUgcmV0dXJuZWQgUHJvbWlzZSB3aWxsIG5ldmVyIHJlamVjdC5cbiAqL1xuZXhwb3J0cy5kZWxheSA9IGZ1bmN0aW9uIChtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBSZXR1cm5zIGEgYHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9YCBvYmplY3QuICBUaGUgcmV0dXJuZWQgYHByb21pc2VgIHdpbGwgcmVzb2x2ZSBvciByZWplY3Qgd2hlbiBgcmVzb2x2ZWAgb3JcbiAqIGByZWplY3RgIGFyZSBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuZGVmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFuc3dlciA9IHt9O1xuICAgIGFuc3dlci5wcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBhbnN3ZXIucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIGFuc3dlci5yZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFuc3dlcjtcbn07XG5cbi8qXG4gKiBHaXZlbiBhbiBhcnJheSwgYHRhc2tzYCwgb2YgZnVuY3Rpb25zIHdoaWNoIHJldHVybiBQcm9taXNlcywgZXhlY3V0ZXMgZWFjaCBmdW5jdGlvbiBpbiBgdGFza3NgIGluIHNlcmllcywgb25seVxuICogY2FsbGluZyB0aGUgbmV4dCBmdW5jdGlvbiBvbmNlIHRoZSBwcmV2aW91cyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLlxuICovXG5leHBvcnRzLnNlcmllcyA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgcmV0dXJuIHRhc2tzLnJlZHVjZShmdW5jdGlvbiAoc2VyaWVzLCB0YXNrKSB7XG4gICAgICAgIHJldHVybiBzZXJpZXMudGhlbih0YXNrKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9LCBQcm9taXNlLnJlc29sdmUoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pO1xufTtcblxuLypcbiAqIEdpdmVuIGFuIGFycmF5LCBgdGFza3NgLCBvZiBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIFByb21pc2VzLCBleGVjdXRlcyBlYWNoIGZ1bmN0aW9uIGluIGB0YXNrc2AgaW4gcGFyYWxsZWwuXG4gKiBJZiBgbGltaXRgIGlzIHN1cHBsaWVkLCB0aGVuIGF0IG1vc3QgYGxpbWl0YCB0YXNrcyB3aWxsIGJlIGV4ZWN1dGVkIGNvbmN1cnJlbnRseS5cbiAqL1xuZXhwb3J0cy5wYXJhbGxlbCA9IGV4cG9ydHMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uICh0YXNrcywgbGltaXQpIHtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSB8fCBsaW1pdCA+PSB0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHRhc2tzLm1hcChmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4odGFzayk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIHZhciBjdXJyZW50VGFzayA9IDA7XG4gICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICB2YXIgc3RhcnRUYXNrID0gZnVuY3Rpb24gc3RhcnRUYXNrKCkge1xuICAgICAgICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudFRhc2sgPj0gdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFza051bWJlciA9IGN1cnJlbnRUYXNrKys7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzW3Rhc2tOdW1iZXJdO1xuICAgICAgICAgICAgcnVubmluZysrO1xuXG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKHRhc2spLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbdGFza051bWJlcl0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgcnVubmluZy0tO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGFzayA8IHRhc2tzLmxlbmd0aCAmJiBydW5uaW5nIDwgbGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChydW5uaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdGFydCB1cCBgbGltaXRgIHRhc2tzLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgICAgICAgIHN0YXJ0VGFzaygpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKlxuICogR2l2ZW4gYW4gYXJyYXkgYGFycmAgb2YgaXRlbXMsIGNhbGxzIGBpdGVyKGl0ZW0sIGluZGV4KWAgZm9yIGV2ZXJ5IGl0ZW0gaW4gYGFycmAuICBgaXRlcigpYCBzaG91bGQgcmV0dXJuIGFcbiAqIFByb21pc2UuICBVcCB0byBgbGltaXRgIGl0ZW1zIHdpbGwgYmUgY2FsbGVkIGluIHBhcmFsbGVsIChkZWZhdWx0cyB0byAxLilcbiAqL1xuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbiAoYXJyLCBpdGVyLCBsaW1pdCkge1xuICAgIHZhciB0YXNrTGltaXQgPSBsaW1pdDtcbiAgICBpZiAoIWxpbWl0IHx8IGxpbWl0IDwgMSkge1xuICAgICAgICB0YXNrTGltaXQgPSAxO1xuICAgIH1cbiAgICBpZiAobGltaXQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICB0YXNrTGltaXQgPSBhcnIubGVuZ3RoO1xuICAgIH1cblxuICAgIHZhciB0YXNrcyA9IGFyci5tYXAoZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcihpdGVtLCBpbmRleCk7XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyYWxsZWwodGFza3MsIHRhc2tMaW1pdCk7XG59O1xuXG4vKlxuICogQWRkIGEgdGltZW91dCB0byBhbiBleGlzdGluZyBQcm9taXNlLlxuICpcbiAqIFJlc29sdmVzIHRvIHRoZSBzYW1lIHZhbHVlIGFzIGBwYCBpZiBgcGAgcmVzb2x2ZXMgd2l0aGluIGBtc2AgbWlsbGlzZWNvbmRzLCBvdGhlcndpc2UgdGhlIHJldHVybmVkIFByb21pc2Ugd2lsbFxuICogcmVqZWN0IHdpdGggdGhlIGVycm9yIFwiVGltZW91dDogUHJvbWlzZSBkaWQgbm90IHJlc29sdmUgd2l0aGluICR7bXN9IG1pbGxpc2Vjb25kc1wiXG4gKi9cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uIChwLCBtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBleHBvcnRzLlRpbWVvdXRFcnJvcihcIlRpbWVvdXQ6IFByb21pc2UgZGlkIG5vdCByZXNvbHZlIHdpdGhpbiBcIiArIG1zICsgXCIgbWlsbGlzZWNvbmRzXCIpKTtcbiAgICAgICAgfSwgbXMpO1xuXG4gICAgICAgIHAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogQ29udGludWFsbHkgY2FsbCBgZm4oKWAgd2hpbGUgYHRlc3QoKWAgcmV0dXJucyB0cnVlLlxuICpcbiAqIGBmbigpYCBzaG91bGQgcmV0dXJuIGEgUHJvbWlzZS4gIGB0ZXN0KClgIGlzIGEgc3luY2hyb25vdXMgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0cnVlIG9mIGZhbHNlLlxuICpcbiAqIGB3aGlsc3RgIHdpbGwgcmVzb2x2ZSB0byB0aGUgbGFzdCB2YWx1ZSB0aGF0IGBmbigpYCByZXNvbHZlZCB0bywgb3Igd2lsbCByZWplY3QgaW1tZWRpYXRlbHkgd2l0aCBhbiBlcnJvciBpZlxuICogYGZuKClgIHJlamVjdHMgb3IgaWYgYGZuKClgIG9yIGB0ZXN0KClgIHRocm93LlxuICovXG5leHBvcnRzLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBmbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBsYXN0UmVzdWx0ID0gbnVsbDtcbiAgICAgICAgdmFyIGRvSXQgPSBmdW5jdGlvbiBkb0l0KCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZm4pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZG9JdCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsYXN0UmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb0l0KCk7XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGZuLCB0ZXN0KSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB2YXIgZG9UZXN0ID0gZnVuY3Rpb24gZG9UZXN0KCkge1xuICAgICAgICB2YXIgYW5zd2VyID0gZmlyc3QgfHwgdGVzdCgpO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5zd2VyO1xuICAgIH07XG4gICAgcmV0dXJuIGV4cG9ydHMud2hpbHN0KGRvVGVzdCwgZm4pO1xufTtcblxuLypcbiAqIGtlZXAgY2FsbGluZyBgZm5gIHVudGlsIGl0IHJldHVybnMgYSBub24tZXJyb3IgdmFsdWUsIGRvZXNuJ3QgdGhyb3csIG9yIHJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMuIGBmbmAgd2lsbCBiZVxuICogYXR0ZW1wdGVkIGB0aW1lc2AgbWFueSB0aW1lcyBiZWZvcmUgcmVqZWN0aW5nLiBJZiBgdGltZXNgIGlzIGdpdmVuIGFzIGBJbmZpbml0eWAsIHRoZW4gYHJldHJ5YCB3aWxsIGF0dGVtcHQgdG9cbiAqIHJlc29sdmUgZm9yZXZlciAodXNlZnVsIGlmIHlvdSBhcmUganVzdCB3YWl0aW5nIGZvciBzb21ldGhpbmcgdG8gZmluaXNoKS5cbiAqIEBwYXJhbSB7T2JqZWN0fE51bWJlcn0gb3B0aW9ucyBoYXNoIHRvIHByb3ZpZGUgYHRpbWVzYCBhbmQgYGludGVydmFsYC4gRGVmYXVsdHMgKHRpbWVzPTUsIGludGVydmFsPTApLiBJZiB0aGlzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGlzIGEgbnVtYmVyLCBvbmx5IGB0aW1lc2Agd2lsbCBiZSBzZXQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuIHRoZSB0YXNrL2NoZWNrIHRvIGJlIHBlcmZvcm1lZC4gQ2FuIGVpdGhlciByZXR1cm4gYSBzeW5jaHJvbm91cyB2YWx1ZSwgdGhyb3cgYW4gZXJyb3IsIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhIHByb21pc2VcbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICovXG5leHBvcnRzLnJldHJ5ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGZuKSB7XG4gICAgdmFyIHRpbWVzID0gNTtcbiAgICB2YXIgaW50ZXJ2YWwgPSAwO1xuICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgdmFyIGxhc3RBdHRlbXB0ID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIG1ha2VUaW1lT3B0aW9uRXJyb3IodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yICd0aW1lcyc6IFwiICsgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKHZhbHVlKSkpO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2Ygb3B0aW9ucykgZm4gPSBvcHRpb25zO2Vsc2UgaWYgKCdudW1iZXInID09PSB0eXBlb2Ygb3B0aW9ucykgdGltZXMgPSArb3B0aW9ucztlbHNlIGlmICgnb2JqZWN0JyA9PT0gKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob3B0aW9ucykpKSB7XG4gICAgICAgIGlmICgnbnVtYmVyJyA9PT0gdHlwZW9mIG9wdGlvbnMudGltZXMpIHRpbWVzID0gK29wdGlvbnMudGltZXM7ZWxzZSBpZiAob3B0aW9ucy50aW1lcykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucy50aW1lcykpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmludGVydmFsKSBpbnRlcnZhbCA9ICtvcHRpb25zLmludGVydmFsO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucykgcmV0dXJuIFByb21pc2UucmVqZWN0KG1ha2VUaW1lT3B0aW9uRXJyb3Iob3B0aW9ucykpO2Vsc2UgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gcGFyYW1ldGVycyBnaXZlbicpKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBkb0l0ID0gZnVuY3Rpb24gZG9JdCgpIHtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbihsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICB9KS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICAgIGxhc3RBdHRlbXB0ID0gZXJyO1xuICAgICAgICAgICAgICAgIGlmICh0aW1lcyAhPT0gSW5maW5pdHkgJiYgYXR0ZW1wdHMgPT09IHRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChsYXN0QXR0ZW1wdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChkb0l0LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvSXQoKTtcbiAgICB9KTtcbn07IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBQb3J0U3RvcmUgZnJvbSAnLi9wb3J0LXN0b3JlJztcbmltcG9ydCBQcm9taXNlVG9vbHMgZnJvbSAncHJvbWlzZS10b29scyc7XG5cbmxldCB3ZWJraXQgPSAod2luZG93IGFzIGFueSkud2Via2l0O1xuXG5jb25zdCBwcm9taXNlQnJpZGdlID0gbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwibWVzc2FnZUNoYW5uZWxcIik7XG5cbi8vIFdlIG5lZWQgdGhpcyB0byBiZSBnbG9iYWxseSBhY2Nlc3NpYmxlIHNvIHRoYXQgd2UgY2FuIHRyaWdnZXIgcmVjZWl2ZVxuLy8gZXZlbnRzIG1hbnVhbGx5XG5cbih3aW5kb3cgYXMgYW55KS5fX21lc3NhZ2VDaGFubmVsQnJpZGdlID0gcHJvbWlzZUJyaWRnZTtcblxuaW50ZXJmYWNlIE1lc3NhZ2VQb3J0TWVzc2FnZSB7XG4gICAgZGF0YTpzdHJpbmcsXG4gICAgcGFzc2VkUG9ydElkczogbnVtYmVyW11cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UocG9ydEluZGV4Om51bWJlciwgbWVzc2FnZTpNZXNzYWdlUG9ydE1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQgaW5jb21pbmcgbWVzc2FnZSBmcm9tIG5hdGl2ZSwgdG8gcG9ydFwiLCBwb3J0SW5kZXgsIFwid2l0aCBtZXNzYWdlXCIsIG1lc3NhZ2UpO1xuICAgICAgICBsZXQgdGhpc1BvcnQgPSBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChwb3J0SW5kZXgpO1xuXG4gICAgICAgIGlmICghdGhpc1BvcnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHJlY2VpdmUgbWVzc2FnZSBvbiBpbmFjdGl2ZSBwb3J0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1hcHBlZFBvcnRzID0gbWVzc2FnZS5wYXNzZWRQb3J0SWRzLm1hcCgoaWQpID0+IHtcbiAgICAgICAgICAgIC8vIFdlIGNhbid0IHBhc3MgaW4gYWN0dWFsIG1lc3NhZ2UgcG9ydHMsIHNvIGluc3RlYWQgd2UgcGFzcyBpblxuICAgICAgICAgICAgLy8gdGhlaXIgSURzLiBOb3cgd2UgbWFwIHRoZW0gdG8gb3VyIHdyYXBwZXIgQ3VzdG9tTWVzc2FnZVBvcnRcbiAgICAgICAgICAgIHJldHVybiBQb3J0U3RvcmUuZmluZE9yQ3JlYXRlQnlOYXRpdmVJbmRleChpZCkuanNNZXNzYWdlUG9ydDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG1lc3NhZ2UgdG8gbmF0aXZlIGluZGV4XCIsIHRoaXNQb3J0Lm5hdGl2ZVBvcnRJbmRleCk7XG4gICAgICAgIHRoaXNQb3J0LnNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKSwgbWFwcGVkUG9ydHMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICB9XG5cbn1cblxucHJvbWlzZUJyaWRnZS5hZGRMaXN0ZW5lcihcImVtaXRcIiwgcmVjZWl2ZU1lc3NhZ2UpO1xuXG5leHBvcnQgY2xhc3MgTWVzc2FnZVBvcnRXcmFwcGVyIHtcblxuICAgIG9wZW46Ym9vbGVhbjtcbiAgICBuYXRpdmVQb3J0SW5kZXg6bnVtYmVyO1xuICAgIGpzTWVzc2FnZVBvcnQ6TWVzc2FnZVBvcnQ7XG4gICAganNNZXNzYWdlQ2hhbm5lbDpNZXNzYWdlQ2hhbm5lbDtcbiAgICBwcml2YXRlIG9yaWdpbmFsSlNQb3J0Q2xvc2U6RnVuY3Rpb247XG5cbiAgICBjb25zdHJ1Y3Rvcihqc1BvcnQ6TWVzc2FnZVBvcnQgPSBudWxsKSB7XG4gICAgICAgIHRoaXMubmF0aXZlUG9ydEluZGV4ID0gbnVsbDtcbiAgICAgICAgaWYgKGpzUG9ydCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0aW5nIHdyYXBwZXIgZm9yIGFuIGV4aXN0aW5nIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQgPSBqc1BvcnRcblxuICAgICAgICAgICAgLy8gZGlzZ3VzdGluZyBoYWNrLCBidXQgY2FuJ3Qgc2VlIGFueSB3YXkgYXJvdW5kIGlzIGFzIHRoZXJlIGlzIG5vXG4gICAgICAgICAgICAvLyBcImhhcyBkaXNwYXRjaGVkIGEgbWVzc2FnZVwiIGV2ZW50LCBhcyBmYXIgYXMgSSBjYW4gdGVsbCBcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VQb3J0LnBvc3RNZXNzYWdlID0gdGhpcy5oYW5kbGVKU01lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJNYWtpbmcgd3JhcHBlciBmb3IgYSBuZXcgd2ViIE1lc3NhZ2VQb3J0XCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHdlIGNhbid0IGNyZWF0ZSBhIE1lc3NhZ2VQb3J0IGRpcmVjdGx5LCBzbyB3ZSBoYXZlIHRvIG1ha2VcbiAgICAgICAgICAgIC8vIGEgY2hhbm5lbCB0aGVuIHRha2Ugb25lIHBvcnQgZnJvbSBpdC4gS2luZCBvZiBhIHdhc3RlLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmpzTWVzc2FnZUNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgICAgIHRoaXMuanNNZXNzYWdlUG9ydCA9IHRoaXMuanNNZXNzYWdlQ2hhbm5lbC5wb3J0MTtcblxuICAgICAgICAgICAgdGhpcy5qc01lc3NhZ2VDaGFubmVsLnBvcnQyLm9ubWVzc2FnZSA9IChldjpNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4ndCByZWxpYWJseSBob29rIGludG8gcG9zdE1lc3NhZ2UsIHNvIHdlIHVzZSB0aGlzXG4gICAgICAgICAgICAgICAgLy8gdG8gY2F0Y2ggcG9zdE1lc3NhZ2VzIHRvby4gTmVlZCB0byBkb2N1bWVudCBhbGwgdGhpcyBtYWRuZXNzLlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSlNNZXNzYWdlKGV2LmRhdGEsIGV2LnBvcnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbWUgZm9yIHRoZSBsYWNrIG9mIGEgJ2Nsb3NlJyBldmVudC5cbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlID0gdGhpcy5qc01lc3NhZ2VQb3J0LmNsb3NlO1xuICAgICAgICB0aGlzLmpzTWVzc2FnZVBvcnQuY2xvc2UgPSB0aGlzLmNsb3NlO1xuICAgIH1cblxuICAgIHNlbmRPcmlnaW5hbFBvc3RNZXNzYWdlKGRhdGE6IGFueSwgcG9ydHM6IE1lc3NhZ2VQb3J0W10pIHtcbiAgICAgICAgTWVzc2FnZVBvcnQucHJvdG90eXBlLnBvc3RNZXNzYWdlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCwgW2RhdGEsIHBvcnRzXSk7XG4gICAgfVxuXG4gICAgaGFuZGxlSlNNZXNzYWdlKGRhdGE6YW55LCBwb3J0czogTWVzc2FnZVBvcnRbXSwgaXNFeHBsaWNpdFBvc3Q6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJQb3N0aW5nIG5ldyBtZXNzYWdlLi4uXCIpXG4gICAgICAgXG4gICAgICAgIC8vIEdldCBvdXIgY3VzdG9tIHBvcnQgaW5zdGFuY2VzLCBjcmVhdGluZyB0aGVtIGlmIG5lY2Vzc2FyeVxuICAgICAgICBsZXQgY3VzdG9tUG9ydHM6TWVzc2FnZVBvcnRXcmFwcGVyW10gPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmIChwb3J0cykge1xuICAgICAgICAgICAgY3VzdG9tUG9ydHMgPSBwb3J0cy5tYXAoKHA6TWVzc2FnZVBvcnQpID0+IFBvcnRTdG9yZS5maW5kT3JXcmFwSlNNZXNzc2FnZVBvcnQocCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja0Zvck5hdGl2ZVBvcnQoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGV5IHdlcmUgY3JlYXRlZCwgdGhlbiB3ZSBuZWVkIHRvIGFzc2lnbiB0aGVtIGEgbmF0aXZlIElEIGJlZm9yZVxuICAgICAgICAgICAgLy8gd2Ugc2VuZC5cbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJDaGVja2luZyB0aGF0IGFkZGl0aW9uYWwgcG9ydHMgaGF2ZSBuYXRpdmUgZXF1aXZhbGVudHNcIilcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKGN1c3RvbVBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydFdyYXBwZXIpID0+IHBvcnQuY2hlY2tGb3JOYXRpdmVQb3J0KCkpIGFzIFByb21pc2U8YW55PlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYW4gZXhwbGljaXQgcG9zdE1lc3NhZ2UgY2FsbCwgd2UgbmVlZCB0aGUgbmF0aXZlXG4gICAgICAgICAgICAvLyBzaWRlIHRvIHBpY2sgdXAgb24gaXQgKHNvIGl0IGRvZXMgc29tZXRoaW5nIHdpdGggdGhlIE1lc3NhZ2VQb3J0KVxuXG4gICAgICAgICAgICBwcm9taXNlQnJpZGdlLmJyaWRnZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogXCJzZW5kVG9Qb3J0XCIsXG4gICAgICAgICAgICAgICAgcG9ydEluZGV4OiB0aGlzLm5hdGl2ZVBvcnRJbmRleCxcbiAgICAgICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBpc0V4cGxpY2l0UG9zdDogaXNFeHBsaWNpdFBvc3QsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBjdXN0b21Qb3J0cy5tYXAoKHApID0+IHAubmF0aXZlUG9ydEluZGV4KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjaGVja0Zvck5hdGl2ZVBvcnQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKHRoaXMubmF0aXZlUG9ydEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuZGVidWcoXCJQb3J0IGFscmVhZHkgaGFzIG5hdGl2ZSBpbmRleFwiLCB0aGlzLm5hdGl2ZVBvcnRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJjcmVhdGVcIlxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocG9ydElkOm51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkNyZWF0ZWQgbmV3IG5hdGl2ZSBNZXNzYWdlUG9ydCBhdCBpbmRleCBcIiwgU3RyaW5nKHBvcnRJZCkpXG4gICAgICAgICAgICB0aGlzLm5hdGl2ZVBvcnRJbmRleCA9IHBvcnRJZDtcblxuICAgICAgICAgICAgLy8gb25seSBhZGQgdG8gb3VyIGFycmF5IG9mIGFjdGl2ZSBjaGFubmVscyB3aGVuXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIGEgbmF0aXZlIElEXG4gICAgICAgICAgICBQb3J0U3RvcmUuYWRkKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG5cbiAgICAgICAgLy8gcnVuIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3ZSBvdmVyd3JvdGVcbiAgICAgICAgdGhpcy5vcmlnaW5hbEpTUG9ydENsb3NlLmFwcGx5KHRoaXMuanNNZXNzYWdlUG9ydCk7XG4gICAgICAgIFxuICAgICAgICAvLyByZW1vdmUgZnJvbSBvdXIgY2FjaGUgb2YgYWN0aXZlIHBvcnRzXG4gICAgICAgIFBvcnRTdG9yZS5yZW1vdmUodGhpcyk7XG4gICAgIFxuICAgICAgICAvLyBmaW5hbGx5LCB0ZWxsIHRoZSBuYXRpdmUgaGFsZiB0byBkZWxldGUgdGhpcyByZWZlcmVuY2UuXG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwiZGVsZXRlXCIsXG4gICAgICAgICAgICBwb3J0SW5kZXg6IHRoaXMubmF0aXZlUG9ydEluZGV4XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZTphbnksIHBvcnRzOiBbTWVzc2FnZVBvcnRdKSB7XG5cbiAgICBsZXQgcG9ydEluZGV4ZXM6bnVtYmVyW10gPSBbXTtcblxuICAgIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlVG9vbHMubWFwKHBvcnRzLCAocG9ydDpNZXNzYWdlUG9ydCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdyYXBwZXIgPSBuZXcgTWVzc2FnZVBvcnRXcmFwcGVyKHBvcnQpO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIuY2hlY2tGb3JOYXRpdmVQb3J0KClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlci5uYXRpdmVQb3J0SW5kZXg7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oKHBvcnRJbmRleGVzOm51bWJlcltdKSA9PiB7XG4gICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicG9zdE1lc3NhZ2VcIixcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpLFxuICAgICAgICAgICAgYWRkaXRpb25hbFBvcnRJbmRleGVzOiBwb3J0SW5kZXhlc1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG5cbiAgICBcblxufSIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4uL3V0aWwvcHJvbWlzZS1vdmVyLXdrbWVzc2FnZSc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQge3Bvc3RNZXNzYWdlfSBmcm9tICcuLi9tZXNzYWdlcy9tZXNzYWdlLWNoYW5uZWwnO1xuXG5leHBvcnQgY29uc3Qgc2VydmljZVdvcmtlckJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcInNlcnZpY2VXb3JrZXJcIik7XG5cbmNsYXNzIEV2ZW50RW1pdHRlclRvSlNFdmVudCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQsIHVzZUNhcHR1cmU6Ym9vbGVhbikge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBkaXNwYXRjaEV2ZW50KGV2dDpFdmVudCk6IGJvb2xlYW4ge1xuICAgICAgICB0aGlzLmVtaXQoZXZ0LnR5cGUsIGV2dCk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlOnN0cmluZywgbGlzdGVuZXI6KGV2OkVycm9yRXZlbnQpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfVxufVxuXG5jbGFzcyBIeWJyaWRTZXJ2aWNlV29ya2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlciB7XG4gICAgc2NvcGU6c3RyaW5nO1xuICAgIHNjcmlwdFVSTDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfaWQ6bnVtYmVyO1xuXG4gICAgaW5zdGFsbFN0YXRlOlNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGVcbiAgICBnZXQgc3RhdGUoKTpzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuQWN0aXZhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0ZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5BY3RpdmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0aW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsZWRcIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluc3RhbGxTdGF0ZSA9PT0gU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZS5JbnN0YWxsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJpbnN0YWxsaW5nXCJcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuUmVkdW5kYW50KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJyZWR1bmRhbnRcIlxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBpbnN0YWxsIHN0YXRlOlwiICsgdGhpcy5pbnN0YWxsU3RhdGUpXG4gICAgfVxuXG4gICAgb25zdGF0ZWNoYW5nZTooc3RhdGVjaGFuZ2V2ZW50OmFueSkgPT4gdm9pZDtcbiAgICBvbm1lc3NhZ2U6KGV2Ok1lc3NhZ2VFdmVudCkgPT4gYW55O1xuICAgIG9uZXJyb3I6IChldjpFcnJvckV2ZW50KSA9PiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihpZDpudW1iZXIsIHNjcmlwdFVSTDpzdHJpbmcsIHNjb3BlOnN0cmluZywgc3RhdGU6U2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuX2lkID0gaWQ7XG4gICAgICAgIHRoaXMuc2NyaXB0VVJMID0gc2NyaXB0VVJMO1xuICAgICAgICB0aGlzLnNjb3BlID0gc2NvcGU7XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoc3RhdGU6IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlID09PSB0aGlzLmluc3RhbGxTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5zdGFsbFN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLm9uc3RhdGVjaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMub25zdGF0ZWNoYW5nZSh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFxuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2U6YW55LCBvcHRpb25zOiBhbnlbXSkge1xuICAgICAgICBpZiAoUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBwb3N0TWVzc2FnZSB0byBhY3RpdmUgc2VydmljZSB3b3JrZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sZW5ndGggPiAxIHx8IG9wdGlvbnNbMF0gaW5zdGFuY2VvZiBNZXNzYWdlUG9ydCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIHNlbmRpbmcgb25lIE1lc3NhZ2VQb3J0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdwb3N0IG1lc3NhZ2U/JywgbWVzc2FnZSlcbiAgICAgICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgW29wdGlvbnNbMF0gYXMgTWVzc2FnZVBvcnRdKTtcblxuICAgIH0gXG5cbiAgICB0ZXJtaW5hdGUoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNob3VsZCBub3QgaW1wbGVtZW50IHRoaXMuXCIpO1xuICAgIH1cbn1cblxuY2xhc3MgSHlicmlkUmVnaXN0cmF0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyVG9KU0V2ZW50IGltcGxlbWVudHMgU2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbiB7XG4gICAgXG4gICAgYWN0aXZlOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgaW5zdGFsbGluZzogSHlicmlkU2VydmljZVdvcmtlclxuICAgIHdhaXRpbmc6IEh5YnJpZFNlcnZpY2VXb3JrZXJcbiAgICBwdXNoTWFuYWdlcjogYW55XG4gICAgb251cGRhdGVmb3VuZDogKCkgPT4gdm9pZFxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcihcInVwZGF0ZWZvdW5kXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9udXBkYXRlZm91bmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9udXBkYXRlZm91bmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLnB1c2hNYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHVzaD8nKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0TW9zdFJlY2VudFdvcmtlcigpOkh5YnJpZFNlcnZpY2VXb3JrZXIge1xuICAgICAgICAvLyB3aGVuIHdlIHdhbnQgdGhlIG1vc3QgY3VycmVudCwgcmVnYXJkbGVzcyBvZiBhY3R1YWwgc3RhdHVzXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZSB8fCB0aGlzLndhaXRpbmcgfHwgdGhpcy5pbnN0YWxsaW5nO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJ1cGRhdGVcIixcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRNb3N0UmVjZW50V29ya2VyKCkuc2NyaXB0VVJMXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0IHNjb3BlKCk6c3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlLnNjb3BlO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB5ZXRcIilcbiAgICB9XG5cbiAgICBjbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKTp2b2lkIHtcbiAgICAgICAgLy8gSWYgYSBzZXJ2aWNlIHdvcmtlciBoYXMgY2hhbmdlZCBzdGF0ZSwgd2Ugd2FudCB0byBlbnN1cmVcbiAgICAgICAgLy8gdGhhdCBpdCBkb2Vzbid0IGFwcGVhciBpbiBhbnkgb2xkIHN0YXRlc1xuICAgIFxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbnN0YWxsaW5nID09PSBzdykge1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsaW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLndhaXRpbmcgPT09IHN3KSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgXG5cbiAgICBhc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG5cbiAgICAgICAgdGhpcy5jbGVhckFsbEluc3RhbmNlc09mU2VydmljZVdvcmtlcihzdyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkFjdGl2YXRlZCAmJiAhdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gc3c7XG4gICAgICAgICAgICBTZXJ2aWNlV29ya2VyQ29udGFpbmVyLmNvbnRyb2xsZXIgPSBzdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdy5pbnN0YWxsU3RhdGUgPT09IFNlcnZpY2VXb3JrZXJJbnN0YWxsU3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRpbmcgPSBzdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3cuaW5zdGFsbFN0YXRlID09PSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlLkluc3RhbGxpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGluZyA9IHN3O1xuICAgICAgICAgICAgdGhpcy5lbWl0KFwidXBkYXRlZm91bmRcIiwgc3cpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBSZWdpc3RyYXRpb25JbnN0YW5jZSA9IG5ldyBIeWJyaWRSZWdpc3RyYXRpb24oKTtcblxuY2xhc3MgSHlicmlkU2VydmljZVdvcmtlckNvbnRhaW5lciBleHRlbmRzIEV2ZW50RW1pdHRlciBpbXBsZW1lbnRzIFNlcnZpY2VXb3JrZXJDb250YWluZXIgIHtcbiAgICBjb250cm9sbGVyOiBIeWJyaWRTZXJ2aWNlV29ya2VyXG4gICAgXG4gICAgb25jb250cm9sbGVyY2hhbmdlOiAoKSA9PiB2b2lkXG4gICAgb25lcnJvcjogKCkgPT4gdm9pZFxuICAgIG9ubWVzc2FnZTogKCkgPT4gdm9pZFxuXG4gICAgZ2V0IHJlYWR5KCk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICBpZiAodGhpcy5jb250cm9sbGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VydmljZVdvcmtlciByZWFkeSByZXR1cm5pbmcgaW1tZWRpYXRlbHkgd2l0aCBhY3RpdmF0ZWQgaW5zdGFuY2VcIik7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFJlZ2lzdHJhdGlvbkluc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiU2VydmljZVdvcmtlciByZWFkeSByZXR1cm5pbmcgcHJvbWlzZSBhbmQgd2FpdGluZy4uLlwiKTtcbiAgICAgICAgICAgIHRoaXMub25jZShcImNvbnRyb2xsZXJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJTZXJ2aWNlV29ya2VyIHJlYWR5IHJlY2VpdmVkIHJlc3BvbnNlXCIpXG4gICAgICAgICAgICAgICAgZnVsZmlsbChSZWdpc3RyYXRpb25JbnN0YW5jZSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoXCJjb250cm9sbGVyY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uY29udHJvbGxlcmNoYW5nZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBpdCBleHBlY3QgYXJndW1lbnRzPyBVbmNsZWFyLlxuICAgICAgICAgICAgICAgIHRoaXMub25jb250cm9sbGVyY2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY29udHJvbGxlciA9IFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFjdGl2ZTtcbiAgICB9XG5cbiAgICByZWdpc3Rlcih1cmxUb1JlZ2lzdGVyOnN0cmluZywgb3B0aW9uczogU2VydmljZVdvcmtlclJlZ2lzdGVyT3B0aW9ucyk6IFByb21pc2U8U2VydmljZVdvcmtlclJlZ2lzdHJhdGlvbj4ge1xuICAgICAgICBjb25zb2xlLmxvZygndXJsIHJlZ2lzdGVyPycpXG4gICAgICAgIGxldCBmdWxsU1dVUkwgPSB1cmwucmVzb2x2ZSh3aW5kb3cubG9jYXRpb24uaHJlZiwgdXJsVG9SZWdpc3Rlcik7XG4gICAgICAgIC8vIGxldCBmdWxsU2NvcGVVUkw6c3RyaW5nID0gbnVsbDtcblxuICAgICAgICAvLyBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNjb3BlKSB7XG4gICAgICAgIC8vICAgICBmdWxsU2NvcGVVUkwgPSB1cmwucmVzb2x2ZSh3aW5kb3cubG9jYXRpb24uaHJlZiwgb3B0aW9ucy5zY29wZSk7XG4gICAgICAgIC8vIH1cblxuXG5cbiAgICAgICAgY29uc29sZS5pbmZvKFwiQXR0ZW1wdGluZyB0byByZWdpc3RlciBzZXJ2aWNlIHdvcmtlciBhdFwiLCBmdWxsU1dVUkwpO1xuICAgIFxuICAgICAgICByZXR1cm4gc2VydmljZVdvcmtlckJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICAgICAgICAgIG9wZXJhdGlvbjogXCJyZWdpc3RlclwiLFxuICAgICAgICAgICAgc3dQYXRoOiBmdWxsU1dVUkwsXG4gICAgICAgICAgICBzY29wZTogb3B0aW9ucyA/IG9wdGlvbnMuc2NvcGUgOiBudWxsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXNwb25zZTpTZXJ2aWNlV29ya2VyTWF0Y2gpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JrZXIgPSBwcm9jZXNzTmV3V29ya2VyTWF0Y2gocmVzcG9uc2UpO1xuICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBSZWdpc3RyYXRpb25JbnN0YW5jZTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNsYWltZWRCeU5ld1dvcmtlcihzdzpIeWJyaWRTZXJ2aWNlV29ya2VyKSB7XG4gICAgICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmNsZWFyQWxsSW5zdGFuY2VzT2ZTZXJ2aWNlV29ya2VyKHN3KTtcbiAgICAgICAgUmVnaXN0cmF0aW9uSW5zdGFuY2UuYWN0aXZlID0gc3c7XG4gICAgICAgIHRoaXMuY29udHJvbGxlciA9IHN3O1xuICAgICAgICB0aGlzLmVtaXQoXCJjb250cm9sbGVyY2hhbmdlXCIsIHN3KTtcbiAgICB9XG5cbiAgICBnZXRSZWdpc3RyYXRpb24oc2NvcGU6c3RyaW5nKTogUHJvbWlzZTxTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoUmVnaXN0cmF0aW9uSW5zdGFuY2UpO1xuICAgIH1cblxuICAgIGdldFJlZ2lzdHJhdGlvbnMoKTogUHJvbWlzZTxTZXJ2aWNlV29ya2VyUmVnaXN0cmF0aW9uW10+IHtcbiAgICAgICAgLy8gTm90IHN1cmUgd2h5IHdlIGVuZCB1cCB3aXRoIG1vcmUgdGhhbiBvbmUgcmVnaXN0cmF0aW9uLCBldmVyLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtSZWdpc3RyYXRpb25JbnN0YW5jZV0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IFNlcnZpY2VXb3JrZXJDb250YWluZXIgPSBuZXcgSHlicmlkU2VydmljZVdvcmtlckNvbnRhaW5lcigpOyBcblxuZW51bSBTZXJ2aWNlV29ya2VySW5zdGFsbFN0YXRlIHtcbiAgICBJbnN0YWxsaW5nID0gMCxcbiAgICBJbnN0YWxsZWQsXG4gICAgQWN0aXZhdGluZyxcbiAgICBBY3RpdmF0ZWQsXG4gICAgUmVkdW5kYW50XG59XG5cbmludGVyZmFjZSBTZXJ2aWNlV29ya2VyTWF0Y2gge1xuICAgIHVybDogc3RyaW5nLFxuICAgIGluc3RhbGxTdGF0ZTogU2VydmljZVdvcmtlckluc3RhbGxTdGF0ZSxcbiAgICBpbnN0YW5jZUlkOm51bWJlcixcbiAgICBzY29wZTogc3RyaW5nXG59XG5cbmNvbnN0IHNlcnZpY2VXb3JrZXJSZWNvcmRzOiB7W2lkOm51bWJlcl0gOiBIeWJyaWRTZXJ2aWNlV29ya2VyfSA9IHt9O1xuXG5mdW5jdGlvbiBwcm9jZXNzTmV3V29ya2VyTWF0Y2gobmV3TWF0Y2g6U2VydmljZVdvcmtlck1hdGNoKSB7XG4gICAgLy8gaWYgd2UgYWxyZWFkeSBoYXZlIGEgcmVjb3JkLCB1c2UgdGhhdCBvbmVcbiAgICBsZXQgd29ya2VyID0gc2VydmljZVdvcmtlclJlY29yZHNbbmV3TWF0Y2guaW5zdGFuY2VJZF07XG5cbiAgICBpZiAoIXdvcmtlcikge1xuICAgICAgICAvLyBvdGhlcndpc2UsIG1ha2UgYSBuZXcgb25lXG4gICAgICAgIHdvcmtlciA9IG5ldyBIeWJyaWRTZXJ2aWNlV29ya2VyKG5ld01hdGNoLmluc3RhbmNlSWQsIG5ld01hdGNoLnVybCwgbmV3TWF0Y2guc2NvcGUsIG5ld01hdGNoLmluc3RhbGxTdGF0ZSk7XG4gICAgICAgIHNlcnZpY2VXb3JrZXJSZWNvcmRzW25ld01hdGNoLmluc3RhbmNlSWRdID0gd29ya2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmtlci51cGRhdGVTdGF0ZShuZXdNYXRjaC5pbnN0YWxsU3RhdGUpO1xuICAgIH1cblxuICAgIFJlZ2lzdHJhdGlvbkluc3RhbmNlLmFzc2lnbkFjY29yZGluZ1RvSW5zdGFsbFN0YXRlKHdvcmtlcik7XG5cbiAgICBjb25zb2xlLmxvZyhcIlNXIENIQU5HRVwiLCBuZXdNYXRjaCk7XG4gICAgcmV0dXJuIHdvcmtlcjtcbn1cblxuc2VydmljZVdvcmtlckJyaWRnZS5hZGRMaXN0ZW5lcignc3ctY2hhbmdlJywgcHJvY2Vzc05ld1dvcmtlck1hdGNoKTtcblxuc2VydmljZVdvcmtlckJyaWRnZS5hZGRMaXN0ZW5lcignY2xhaW1lZCcsIGZ1bmN0aW9uKG1hdGNoOlNlcnZpY2VXb3JrZXJNYXRjaCkge1xuICAgIGxldCB3b3JrZXIgPSBwcm9jZXNzTmV3V29ya2VyTWF0Y2gobWF0Y2gpO1xuICAgIGNvbnNvbGUubG9nKFwiQ2xhaW1lZCBieSBuZXcgd29ya2VyXCIpXG4gICAgU2VydmljZVdvcmtlckNvbnRhaW5lci5jbGFpbWVkQnlOZXdXb3JrZXIod29ya2VyKTtcbn0pXG4vLyBPbiBwYWdlIGxvYWQgd2UgZ3JhYiBhbGwgdGhlIGN1cnJlbnRseSBhcHBsaWNhYmxlIHNlcnZpY2Ugd29ya2Vyc1xuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFNlcnZpY2VXb3JrZXJzKCkge1xuICAgIHNlcnZpY2VXb3JrZXJCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgIG9wZXJhdGlvbjogXCJnZXRBbGxcIlxuICAgIH0pLnRoZW4oKHdvcmtlcnM6IFNlcnZpY2VXb3JrZXJNYXRjaFtdKSA9PiB7XG4gICAgICAgIHdvcmtlcnMuZm9yRWFjaCgod29ya2VyKSA9PiB7XG4gICAgICAgICAgICBzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0gPSBuZXcgSHlicmlkU2VydmljZVdvcmtlcih3b3JrZXIuaW5zdGFuY2VJZCwgd29ya2VyLnVybCwgXCJcIiwgd29ya2VyLmluc3RhbGxTdGF0ZSk7XG4gICAgICAgICAgICBSZWdpc3RyYXRpb25JbnN0YW5jZS5hc3NpZ25BY2NvcmRpbmdUb0luc3RhbGxTdGF0ZShzZXJ2aWNlV29ya2VyUmVjb3Jkc1t3b3JrZXIuaW5zdGFuY2VJZF0pO1xuICAgICAgICB9KVxuICAgIH0pXG59XG5cbnJlZnJlc2hTZXJ2aWNlV29ya2VycygpO1xuXG4iLCJpbXBvcnQge3NlcnZpY2VXb3JrZXJCcmlkZ2UsIFNlcnZpY2VXb3JrZXJDb250YWluZXJ9IGZyb20gJy4vc3ctbWFuYWdlcic7XG5cbmxldCBuYXZpZ2F0b3JBc0FueTphbnkgPSBuYXZpZ2F0b3I7XG5cbm5hdmlnYXRvckFzQW55LnNlcnZpY2VXb3JrZXIgPSBTZXJ2aWNlV29ya2VyQ29udGFpbmVyOyIsImltcG9ydCB7UHJvbWlzZU92ZXJXS01lc3NhZ2V9IGZyb20gJy4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcblxuY29uc3QgcHJvbWlzZUJyaWRnZSA9IG5ldyBQcm9taXNlT3ZlcldLTWVzc2FnZShcImNvbnNvbGVcIik7XG5cbmNvbnN0IG1ha2VTdWl0YWJsZSA9ICh2YWw6YW55KSA9PiB7XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB2YWwudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBcIm51bGxcIlxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCByZXR1cm5TdHJpbmcgPSBcIihub3Qgc3RyaW5naWZ5YWJsZSk6IFwiXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm5TdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVyblN0cmluZyArPSBlcnIudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR1cm5TdHJpbmdcbiAgICB9XG59XG5cbmxldCBsZXZlbHMgPSBbJ2RlYnVnJywnaW5mbycsICdsb2cnLCAnZXJyb3InLCAnd2FybiddO1xuXG5sZXQgY29uc29sZTp7W2xldmVsOnN0cmluZ106IEZ1bmN0aW9ufSA9IHt9O1xuXG5sZXQgb3JpZ2luYWxDb25zb2xlID0gd2luZG93LmNvbnNvbGUgYXMgYW55O1xuXG4od2luZG93IGFzIGFueSkuY29uc29sZSA9IGNvbnNvbGU7XG5cbmxldmVscy5mb3JFYWNoKChsZXZlbCkgPT4ge1xuICAgIGNvbnNvbGVbbGV2ZWxdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAob3JpZ2luYWxDb25zb2xlKSB7XG4gICAgICAgICAgICAvLyBzdGlsbCBsb2cgb3V0IHRvIHdlYnZpZXcgY29uc29sZSwgaW4gY2FzZSB3ZSdyZSBhdHRhY2hlZFxuICAgICAgICAgICAgb3JpZ2luYWxDb25zb2xlW2xldmVsXS5hcHBseShvcmlnaW5hbENvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXJnc0FzSlNPTiA9IEFycmF5LmZyb20oYXJndW1lbnRzKS5tYXAobWFrZVN1aXRhYmxlKTtcblxuICAgICAgICBwcm9taXNlQnJpZGdlLnNlbmQoe1xuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgYXJnczogYXJnc0FzSlNPTlxuICAgICAgICB9KVxuICAgIH1cbn0pIiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5cbmxldCBldmVudHNCcmlkZ2UgPSBuZXcgUHJvbWlzZU92ZXJXS01lc3NhZ2UoXCJldmVudHNcIik7XG5cbih3aW5kb3cgYXMgYW55KS5oeWJyaWRFdmVudHMgPSB7XG4gICAgZW1pdDogZnVuY3Rpb24obmFtZTpTdHJpbmcsIGRhdGE6U3RyaW5nKSB7XG4gICAgICAgIGV2ZW50c0JyaWRnZS5zZW5kKHtcbiAgICAgICAgICAgIG5hbWUsIGRhdGFcbiAgICAgICAgfSlcbiAgICB9XG59IiwiaW1wb3J0IHtQcm9taXNlT3ZlcldLTWVzc2FnZX0gZnJvbSAnLi4vdXRpbC9wcm9taXNlLW92ZXItd2ttZXNzYWdlJztcblxuZXhwb3J0IGRlZmF1bHQgbmV3IFByb21pc2VPdmVyV0tNZXNzYWdlKFwibm90aWZpY2F0aW9uc1wiKTtcbiIsImltcG9ydCBwcm9taXNlQnJpZGdlIGZyb20gJy4vbm90aWZpY2F0aW9uLWJyaWRnZSc7XG5cbmV4cG9ydCBjb25zdCBub3RpZmljYXRpb24gPSB7XG4gICAgcGVybWlzc2lvbjogXCJ1bmtub3duXCIsXG4gICAgcmVxdWVzdFBlcm1pc3Npb246IGZ1bmN0aW9uKCkge1xuICAgICAgIHByb21pc2VCcmlkZ2UuYnJpZGdlUHJvbWlzZSh7XG4gICAgICAgICAgICBvcGVyYXRpb246IFwicmVxdWVzdFBlcm1pc3Npb25cIlxuICAgICAgIH0pXG4gICAgICAgLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlcXVlc3QgcmVzdWx0OlwiLCByZXN1bHQpO1xuICAgICAgIH0pXG4gICAgfVxufTtcblxucHJvbWlzZUJyaWRnZS5icmlkZ2VQcm9taXNlKHtcbiAgICBvcGVyYXRpb246IFwiZ2V0U3RhdHVzXCJcbn0pXG4udGhlbigoc3RhdHVzOnN0cmluZykgPT4ge1xuICAgIC8vIGNvbnNvbGUuZGVidWcoXCJOb3RpZmljYXRpb24gcGVybWlzc2lvbjpcIiwgc3RhdHVzKVxuICAgIG5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID0gc3RhdHVzO1xufSk7XG5cbnByb21pc2VCcmlkZ2Uub24oXCJub3RpZmljYXRpb24tcGVybWlzc2lvbi1jaGFuZ2VcIiwgKG5ld1N0YXR1czpzdHJpbmcpID0+IHtcbiAgICAvLyBjb25zb2xlLmRlYnVnKFwiUmVjZWl2ZWQgdXBkYXRlZCBub3RpZmljYXRpb24gcGVybWlzc2lvbjpcIiArIG5ld1N0YXR1cyk7XG4gICAgbm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPSBzdGF0dXM7XG59KTtcblxuKHdpbmRvdyBhcyBhbnkpLk5vdGlmaWNhdGlvbiA9IG5vdGlmaWNhdGlvbjsiLCJpbXBvcnQge3JlZnJlc2hTZXJ2aWNlV29ya2Vyc30gZnJvbSAnLi4vbmF2aWdhdG9yL3N3LW1hbmFnZXInO1xuXG5sZXQgbG9hZGVkSW5kaWNhdG9yOkhUTUxEaXZFbGVtZW50ID0gbnVsbDtcblxuKHdpbmRvdyBhcyBhbnkpLl9fc2V0SFRNTCA9IGZ1bmN0aW9uKGh0bWxTdHJpbmc6c3RyaW5nLCBiYXNlVVJMOnN0cmluZykge1xuICAgIGxldCBpbnNpZGVIVE1MVGFnID0gLzxodG1sKD86Lio/KT4oKD86LnxcXG4pKik8XFwvaHRtbD4vZ2ltLmV4ZWMoaHRtbFN0cmluZylbMV0ucmVwbGFjZShcIjwvYm9keT5cIixcIlRFWFQ8L2JvZHk+XCIpO1xuICAgIC8vIGluc2lkZUhUTUxUYWcgPSBpbnNpZGVIVE1MVGFnLnJlcGxhY2UoXCI8aGVhZD5cIixgPGhlYWQ+PGJhc2UgaHJlZj0nJHtiYXNlVVJMfScvPmApXG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCxudWxsLGJhc2VVUkwpO1xuICAgIHJlZnJlc2hTZXJ2aWNlV29ya2VycygpO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwgPSBpbnNpZGVIVE1MVGFnO1xuXG4gICAgLy8gd2UgdXNlIHRoaXMgb24gdGhlIG5hdGl2ZSBzaWRlIHRvIGRldGVjdCBzb21ld2hhdCByZWxpYWJseSB3aGVuIGEgcGFnZSBoYXMgbG9hZGVkXG4gICAgbG9hZGVkSW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBsb2FkZWRJbmRpY2F0b3Iuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgbG9hZGVkSW5kaWNhdG9yLnN0eWxlLnJpZ2h0ID0gXCIwcHhcIjtcbiAgICBsb2FkZWRJbmRpY2F0b3Iuc3R5bGUudG9wID0gXCIwcHhcIjtcbiAgICBsb2FkZWRJbmRpY2F0b3Iuc3R5bGUud2lkdGggPSBcIjFweFwiO1xuICAgIGxvYWRlZEluZGljYXRvci5zdHlsZS5oZWlnaHQgPSBcIjFweFwiO1xuICAgIGxvYWRlZEluZGljYXRvci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInJnYigwLDI1NSwyNTUpXCI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsb2FkZWRJbmRpY2F0b3IpO1xufTtcblxuKHdpbmRvdyBhcyBhbnkpLl9fcmVtb3ZlTG9hZGVkSW5kaWNhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsb2FkZWRJbmRpY2F0b3IpO1xufSIsIi8vIGltcG9ydCAnd2hhdHdnLWZldGNoJztcbi8vIGltcG9ydCAnLi91dGlsL292ZXJyaWRlLWxvZ2dpbmcnO1xuaW1wb3J0ICcuL25hdmlnYXRvci9zZXJ2aWNlLXdvcmtlcic7XG5pbXBvcnQgJy4vY29uc29sZSc7XG5pbXBvcnQgJy4vbWVzc2FnZXMvbWVzc2FnZS1jaGFubmVsJztcbmltcG9ydCAnLi91dGlsL2dlbmVyaWMtZXZlbnRzJztcbmltcG9ydCAnLi9ub3RpZmljYXRpb24vbm90aWZpY2F0aW9uJztcbmltcG9ydCAnLi91dGlsL3NldC1kb2N1bWVudC1odG1sJztcblxud2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG59XG5cbi8vIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MPVwiVEhJUyBMT0FERURcIiJdLCJuYW1lcyI6WyJhcmd1bWVudHMiLCJ0aGlzIiwiY29tbW9uanNIZWxwZXJzLmNvbW1vbmpzR2xvYmFsIiwiY29tbW9uanNIZWxwZXJzLmludGVyb3BEZWZhdWx0Iiwid2Via2l0IiwidXJsLnJlc29sdmUiLCJwcm9taXNlQnJpZGdlIiwiY29uc29sZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxZQUFZLENBQUM7O0FBRWIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7Ozs7Ozs7Ozs7QUFVMUMsSUFBSSxNQUFNLEdBQUcsT0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLFVBQVUsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDOzs7Ozs7Ozs7O0FBVS9ELFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0VBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ2IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7RUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxDQUFDO0NBQzNCOzs7Ozs7Ozs7QUFTRCxTQUFTLFlBQVksR0FBRyx3QkFBd0I7Ozs7Ozs7O0FBUWhELFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQzs7Ozs7Ozs7O0FBUzNDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsVUFBVSxHQUFHO0VBQ3hELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPO01BQ3JCLEtBQUssR0FBRyxFQUFFO01BQ1YsSUFBSSxDQUFDOztFQUVULElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxLQUFLLENBQUM7O0VBRTFCLEtBQUssSUFBSSxJQUFJLE1BQU0sRUFBRTtJQUNuQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENB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RSxJQUFJLENBQUM7TUFDdEUsS0FBSyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztNQUMxRSxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztLQUMvRTs7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO01BQ2xELElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUdBLFdBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM1Qjs7SUFFRCxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzdDLE1BQU07SUFDTCxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTTtRQUN6QixDQUFDLENBQUM7O0lBRU4sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDM0IsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFQyxNQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7TUFFcEYsUUFBUSxHQUFHO1FBQ1QsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FB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SyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0lBRWhELElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtLQUNyRCxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDbEI7O0lBRUQsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZixDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQzs7SUFFNUQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO0tBQ2QsTUFBTTtLQUNOOztJQUVELFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLEVBQUU7S0FDbkMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ2xCOztJQUVELENBQUMsSUFBSSxVQUFVLENBQUM7O0lBRWhCOztHQUVELEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztHQUN4QixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQzs7OztHQUl2QyxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsRUFBRTtJQUNoQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbEI7O0dBRUQsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7R0FDcEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQzs7O0dBR1QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0dBRXpCOztFQUVELE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQzFCOzs7Ozs7Ozs7Q0FTRCxTQUFTLE1BQU0sQ0FBQyxLQUFLLEVBQUU7RUFDdEIsSUFBSSxDQUFDO01BQ0QsS0FBSztNQUNMLGNBQWM7TUFDZCxXQUFXO01BQ1gsSUFBSTtNQUNKLENBQUM7TUFDRCxDQUFDO01BQ0QsQ0FBQztNQUNELENBQUM7TUFDRCxDQUFDO01BQ0QsWUFBWTtNQUNaLE1BQU0sR0FBRyxFQUFFOztNQUVYLFdBQVc7O01BRVgscUJBQXFCO01BQ3JCLFVBQVU7TUFDVixPQUFPLENBQUM7OztFQUdaLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7OztFQUcxQixXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7O0VBRzNCLENBQUMsR0FBRyxRQUFRLENBQUM7RUFDYixLQUFLLEdBQUcsQ0FBQyxDQUFDO0VBQ1YsSUFBSSxHQUFHLFdBQVcsQ0FBQzs7O0VBR25CLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0dBQ2pDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDeEIsSUFBSSxZQUFZLEdBQUcsSUFBSSxFQUFFO0lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUM5QztHQUNEOztFQUVELGNBQWMsR0FBRyxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7Ozs7O0VBTTdDLElBQUksV0FBVyxFQUFFO0dBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7R0FDdkI7OztFQUdELE9BQU8sY0FBYyxHQUFHLFdBQVcsRUFBRTs7OztHQUlwQyxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzdDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsSUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLFlBQVksR0FBRyxDQUFDLEVBQUU7S0FDMUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztLQUNqQjtJQUNEOzs7O0dBSUQscUJBQXFCLEdBQUcsY0FBYyxHQUFHLENBQUMsQ0FBQztHQUMzQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUssSUFBSSxxQkFBcUIsQ0FBQyxFQUFFO0lBQzVELEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNsQjs7R0FFRCxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDO0dBQ3pDLENBQUMsR0FBRyxDQUFDLENBQUM7O0dBRU4sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDakMsWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFeEIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLE1BQU0sRUFBRTtLQUN6QyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDbEI7O0lBRUQsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUFFOztLQUV0QixLQUFLLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksc0JBQXNCLENBQUMsSUFBSSxJQUFJLEVBQUU7TUFDeEQsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7TUFDNUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO09BQ1YsTUFBTTtPQUNOO01BQ0QsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7TUFDaEIsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7TUFDdEIsTUFBTSxDQUFDLElBQUk7T0FDVixrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7T0FDN0QsQ0FBQztNQUNGLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDO01BQ2hDOztLQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDcEQsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsY0FBYyxJQUFJLFdBQVcsQ0FBQyxDQUFDO0tBQzFFLEtBQUssR0FBRyxDQUFDLENBQUM7S0FDVixFQUFFLGNBQWMsQ0FBQztLQUNqQjtJQUNEOztHQUVELEVBQUUsS0FBSyxDQUFDO0dBQ1IsRUFBRSxDQUFDLENBQUM7O0dBRUo7RUFDRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdkI7Ozs7Ozs7Ozs7Ozs7Q0FhRCxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUU7RUFDekIsT0FBTyxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsTUFBTSxFQUFFO0dBQ3hDLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7TUFDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7TUFDckMsTUFBTSxDQUFDO0dBQ1YsQ0FBQyxDQUFDO0VBQ0g7Ozs7Ozs7Ozs7Ozs7Q0FhRCxTQUFTLE9BQU8sQ0FBQyxLQUFLLEVBQUU7RUFDdkIsT0FBTyxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsTUFBTSxFQUFFO0dBQ3hDLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7TUFDOUIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7TUFDdkIsTUFBTSxDQUFDO0dBQ1YsQ0FBQyxDQUFDO0VBQ0g7Ozs7O0NBS0QsUUFBUSxHQUFHOzs7Ozs7RUFNVixTQUFTLEVBQUUsT0FBTzs7Ozs7Ozs7RUFRbEIsTUFBTSxFQUFFO0dBQ1AsUUFBUSxFQUFFLFVBQVU7R0FDcEIsUUFBUSxFQUFFLFVBQVU7R0FDcEI7RUFDRCxRQUFRLEVBQUUsTUFBTTtFQUNoQixRQUFRLEVBQUUsTUFBTTtFQUNoQixTQUFTLEVBQUUsT0FBTztFQUNsQixXQUFXLEVBQUUsU0FBUztFQUN0QixDQUFDOzs7OztDQUtGO0VBQ0MsT0FBTyxNQUFNLElBQUksVUFBVTtFQUMzQixPQUFPLE1BQU0sQ0FBQyxHQUFHLElBQUksUUFBUTtFQUM3QixNQUFNLENBQUMsR0FBRztHQUNUO0VBQ0QsTUFBTSxDQUFDLFVBQVUsRUFBRSxXQUFXO0dBQzdCLE9BQU8sUUFBUSxDQUFDO0dBQ2hCLENBQUMsQ0FBQztFQUNILE1BQU0sSUFBSSxXQUFXLElBQUksVUFBVSxFQUFFO0VBQ3JDLElBQUksTUFBTSxDQUFDLE9BQU8sSUFBSSxXQUFXLEVBQUU7R0FDbEMsVUFBVSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7R0FDOUIsTUFBTTtHQUNOLEtBQUssR0FBRyxJQUFJLFFBQVEsRUFBRTtJQUNyQixRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuRTtHQUNEO0VBQ0QsTUFBTTtFQUNOLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0VBQ3pCOztDQUVELENBQUNELGNBQUksQ0FBQyxFQUFFOzs7Ozs7Ozs7OztBQ2poQlQsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUc7RUFDZixRQUFRLEVBQUUsU0FBUyxHQUFHLEVBQUU7SUFDdEIsT0FBTyxPQUFPLEdBQUcsQ0FBQyxLQUFLLFFBQVEsQ0FBQztHQUNqQztFQUNELFFBQVEsRUFBRSxTQUFTLEdBQUcsRUFBRTtJQUN0QixPQUFPLE9BQU8sR0FBRyxDQUFDLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUM7R0FDakQ7RUFDRCxNQUFNLEVBQUUsU0FBUyxHQUFHLEVBQUU7SUFDcEIsT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDO0dBQ3JCO0VBQ0QsaUJBQWlCLEVBQUUsU0FBUyxHQUFHLEVBQUU7SUFDL0IsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDO0dBQ3BCO0NBQ0YsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTUYsWUFBWSxDQUFDOzs7OztBQUtiLFNBQVMsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDakMsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQ3hEOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDOUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUM7RUFDakIsRUFBRSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUM7RUFDZixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7O0VBRWIsSUFBSSxPQUFPLEVBQUUsS0FBSyxRQUFRLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7SUFDN0MsT0FBTyxHQUFHLENBQUM7R0FDWjs7RUFFRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7RUFDbkIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7O0VBRW5CLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztFQUNuQixJQUFJLE9BQU8sSUFBSSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFO0lBQ2xELE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0dBQzNCOztFQUVELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7O0VBRXBCLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsT0FBTyxFQUFFO0lBQ2hDLEdBQUcsR0FBRyxPQUFPLENBQUM7R0FDZjs7RUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzVCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztRQUNoQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDbkIsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztJQUVyQixJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7TUFDWixJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7TUFDeEIsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQzFCLE1BQU07TUFDTCxJQUFJLEdBQUcsQ0FBQyxDQUFDO01BQ1QsSUFBSSxHQUFHLEVBQUUsQ0FBQztLQUNYOztJQUVELENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBRTdCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFO01BQzNCLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDWixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNoQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2hCLE1BQU07TUFDTCxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdEI7R0FDRjs7RUFFRCxPQUFPLEdBQUcsQ0FBQztDQUNaLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMURGLFlBQVksQ0FBQzs7QUFFYixJQUFJLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxFQUFFO0VBQ25DLFFBQVEsT0FBTyxDQUFDO0lBQ2QsS0FBSyxRQUFRO01BQ1gsT0FBTyxDQUFDLENBQUM7O0lBRVgsS0FBSyxTQUFTO01BQ1osT0FBTyxDQUFDLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQzs7SUFFOUIsS0FBSyxRQUFRO01BQ1gsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7SUFFOUI7TUFDRSxPQUFPLEVBQUUsQ0FBQztHQUNiO0NBQ0YsQ0FBQzs7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0VBQzVDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDO0VBQ2pCLEVBQUUsR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0VBQ2YsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQ2hCLEdBQUcsR0FBRyxTQUFTLENBQUM7R0FDakI7O0VBRUQsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7SUFDM0IsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtNQUN0QyxJQUFJLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztNQUN4RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDekIsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1VBQzVCLE9BQU8sRUFBRSxHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkQsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNkLE1BQU07UUFDTCxPQUFPLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQzVEO0tBQ0YsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7R0FFZDs7RUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO0VBQ3JCLE9BQU8sa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFO1NBQ2pELGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDcEQsQ0FBQzs7Ozs7Ozs7Ozs7QUMvREYsWUFBWSxDQUFDOztBQUViLE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBR0UsNEJBQW1CLENBQUM7QUFDckQsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHQSw0QkFBbUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDa0J6RCxZQUFZLENBQUM7O0FBRWIsSUFBSSxRQUFRLEdBQUdBLDBCQUFtQixDQUFDO0FBQ25DLElBQUksSUFBSSxHQUFHQSwwQkFBaUIsQ0FBQzs7QUFFN0IsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7QUFDekIsT0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7QUFDN0IsT0FBTyxDQUFDLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQzs7QUFFM0IsT0FBTyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7O0FBRWxCLFNBQVMsR0FBRyxHQUFHO0VBQ2IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7RUFDcEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7RUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7RUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7RUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7RUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Q0FDbEI7Ozs7OztBQU1ELElBQUksZUFBZSxHQUFHLG1CQUFtQjtJQUNyQyxXQUFXLEdBQUcsVUFBVTs7O0lBR3hCLGlCQUFpQixHQUFHLG9DQUFvQzs7OztJQUl4RCxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDOzs7SUFHcEQsTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDOzs7SUFHdkQsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7Ozs7SUFLbEMsWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDM0QsZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7SUFDakMsY0FBYyxHQUFHLEdBQUc7SUFDcEIsbUJBQW1CLEdBQUcsd0JBQXdCO0lBQzlDLGlCQUFpQixHQUFHLDhCQUE4Qjs7SUFFbEQsY0FBYyxHQUFHO01BQ2YsWUFBWSxFQUFFLElBQUk7TUFDbEIsYUFBYSxFQUFFLElBQUk7S0FDcEI7O0lBRUQsZ0JBQWdCLEdBQUc7TUFDakIsWUFBWSxFQUFFLElBQUk7TUFDbEIsYUFBYSxFQUFFLElBQUk7S0FDcEI7O0lBRUQsZUFBZSxHQUFHO01BQ2hCLE1BQU0sRUFBRSxJQUFJO01BQ1osT0FBTyxFQUFFLElBQUk7TUFDYixLQUFLLEVBQUUsSUFBSTtNQUNYLFFBQVEsRUFBRSxJQUFJO01BQ2QsTUFBTSxFQUFFLElBQUk7TUFDWixPQUFPLEVBQUUsSUFBSTtNQUNiLFFBQVEsRUFBRSxJQUFJO01BQ2QsTUFBTSxFQUFFLElBQUk7TUFDWixTQUFTLEVBQUUsSUFBSTtNQUNmLE9BQU8sRUFBRSxJQUFJO0tBQ2Q7SUFDRCxXQUFXLEdBQUdBLDBCQUFzQixDQUFDOztBQUV6QyxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUU7RUFDMUQsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLFlBQVksR0FBRyxFQUFFLE9BQU8sR0FBRyxDQUFDOztFQUVoRSxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQztFQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0VBQ2xELE9BQU8sQ0FBQyxDQUFDO0NBQ1Y7O0FBRUQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsU0FBUyxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUU7RUFDdkUsa0JBQUE7O0VBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0lBQzFCLE1BQU0sSUFBSSxTQUFTLENBQUMsd0NBQXdDLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQztHQUM1RTs7Ozs7RUFLRCxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztNQUM3QixRQUFRO1VBQ0osQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUc7TUFDcEUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO01BQzVCLFVBQVUsR0FBRyxLQUFLLENBQUM7RUFDdkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQy9DLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztFQUU1QixJQUFJLElBQUksR0FBRyxHQUFHLENBQUM7Ozs7RUFJZixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztFQUVuQixJQUFJLENBQUMsaUJBQWlCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztJQUVyRCxJQUFJLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMsSUFBSSxVQUFVLEVBQUU7TUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztNQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztNQUNqQixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUM5QixJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLGdCQUFnQixFQUFFO1VBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZELE1BQU07VUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BDO09BQ0YsTUFBTSxJQUFJLGdCQUFnQixFQUFFO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO09BQ2pCO01BQ0QsT0FBTyxJQUFJLENBQUM7S0FDYjtHQUNGOztFQUVELElBQUksS0FBSyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDdkMsSUFBSSxLQUFLLEVBQUU7SUFDVCxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyQyxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztJQUMzQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDbEM7Ozs7OztFQU1ELElBQUksaUJBQWlCLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsRUFBRTtJQUNwRSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUM7SUFDekMsSUFBSSxPQUFPLElBQUksRUFBRSxLQUFLLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtNQUNsRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztLQUNyQjtHQUNGOztFQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7T0FDdkIsT0FBTyxLQUFLLEtBQUssSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWtCbkQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDL0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQztRQUNqRCxPQUFPLEdBQUcsR0FBRyxDQUFDO0tBQ2pCOzs7O0lBSUQsSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDO0lBQ2pCLElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxFQUFFOztNQUVsQixNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNoQyxNQUFNOzs7TUFHTCxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekM7Ozs7SUFJRCxJQUFJLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRTtNQUNqQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7TUFDN0IsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdEM7OztJQUdELE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO01BQzVDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDeEMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEtBQUssT0FBTyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUM7UUFDakQsT0FBTyxHQUFHLEdBQUcsQ0FBQztLQUNqQjs7SUFFRCxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUM7TUFDaEIsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7O0lBRXhCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7OztJQUczQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Ozs7SUFJakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQzs7OztJQUlwQyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7UUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7OztJQUdwRCxJQUFJLENBQUMsWUFBWSxFQUFFO01BQ2pCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO01BQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEQsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUztRQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO1VBQ3BDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztVQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzNDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUU7Ozs7Y0FJNUIsT0FBTyxJQUFJLEdBQUcsQ0FBQzthQUNoQixNQUFNO2NBQ0wsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwQjtXQUNGOztVQUVELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7WUFDdkMsSUFBSSxVQUFVLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hDLElBQUksR0FBRyxFQUFFO2NBQ1AsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztjQUN4QixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pCO1lBQ0QsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO2NBQ2xCLElBQUksR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7YUFDdkM7WUFDREYsTUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JDLE1BQU07V0FDUDtTQUNGO09BQ0Y7S0FDRjs7SUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLGNBQWMsRUFBRTtNQUN6QyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztLQUNwQixNQUFNOztNQUVMLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUM3Qzs7SUFFRCxJQUFJLENBQUMsWUFBWSxFQUFFOzs7OztNQUtqQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2pEOztJQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3pDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO0lBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7Ozs7SUFJdkIsSUFBSSxZQUFZLEVBQUU7TUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDbEUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1FBQ25CLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO09BQ25CO0tBQ0Y7R0FDRjs7OztFQUlELElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7Ozs7O0lBSy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDakQsSUFBSSxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3ZCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsU0FBUztNQUNYLElBQUksR0FBRyxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ2pDLElBQUksR0FBRyxLQUFLLEVBQUUsRUFBRTtRQUNkLEdBQUcsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7T0FDbEI7TUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakM7R0FDRjs7OztFQUlELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDN0IsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUU7O0lBRWYsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUM1QjtFQUNELElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDM0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7SUFDYixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNqQyxJQUFJLGdCQUFnQixFQUFFO01BQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDNUM7SUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDMUIsTUFBTSxJQUFJLGdCQUFnQixFQUFFOztJQUUzQixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztHQUNqQjtFQUNELElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0VBQy9CLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQztNQUMzQixJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtJQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQztHQUNyQjs7O0VBR0QsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7SUFDaEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDNUIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7SUFDMUIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ25COzs7RUFHRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztFQUMxQixPQUFPLElBQUksQ0FBQztDQUNiLENBQUM7OztBQUdGLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTs7Ozs7RUFLdEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDNUMsSUFBSSxFQUFFLEdBQUcsWUFBWSxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNqRSxPQUFPLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztDQUNyQjs7QUFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxXQUFXO0VBQ2hDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0VBQzNCLElBQUksSUFBSSxFQUFFO0lBQ1IsSUFBSSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqQyxJQUFJLElBQUksR0FBRyxDQUFDO0dBQ2I7O0VBRUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFO01BQzlCLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUU7TUFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtNQUN0QixJQUFJLEdBQUcsS0FBSztNQUNaLEtBQUssR0FBRyxFQUFFLENBQUM7O0VBRWYsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2IsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0dBQ3pCLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO0lBQ3hCLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRO1FBQ2IsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDL0IsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO01BQ2IsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQ3pCO0dBQ0Y7O0VBRUQsSUFBSSxJQUFJLENBQUMsS0FBSztNQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztNQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUU7SUFDbEMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQzNDOztFQUVELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxLQUFLLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7RUFFM0QsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxRQUFRLElBQUksR0FBRyxDQUFDOzs7O0VBSTdELElBQUksSUFBSSxDQUFDLE9BQU87TUFDWixDQUFDLENBQUMsUUFBUSxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxFQUFFO0lBQzlELElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNCLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLFFBQVEsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDO0dBQ3ZFLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRTtJQUNoQixJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQ1g7O0VBRUQsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7RUFDdEQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7O0VBRTlELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLEtBQUssRUFBRTtJQUNuRCxPQUFPLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQ2xDLENBQUMsQ0FBQztFQUNILE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQzs7RUFFcEMsT0FBTyxRQUFRLEdBQUcsSUFBSSxHQUFHLFFBQVEsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDO0NBQ25ELENBQUM7O0FBRUYsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTtFQUNwQyxPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztDQUN4RDs7QUFFRCxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxTQUFTLFFBQVEsRUFBRTtFQUN6QyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztDQUNyRSxDQUFDOztBQUVGLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTtFQUMxQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sUUFBUSxDQUFDO0VBQzdCLE9BQU8sUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0NBQzlEOztBQUVELEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFNBQVMsUUFBUSxFQUFFO0VBQy9DLGtCQUFBOztFQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtJQUMzQixJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0dBQ2hCOztFQUVELElBQUksTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7RUFDdkIsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUM5QixLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTtJQUN4QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHQSxNQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDM0I7Ozs7RUFJRCxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7OztFQUc1QixJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssRUFBRSxFQUFFO0lBQ3hCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzlCLE9BQU8sTUFBTSxDQUFDO0dBQ2Y7OztFQUdELElBQUksUUFBUSxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7O0lBRTFDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEMsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7TUFDeEMsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ3JCLElBQUksSUFBSSxLQUFLLFVBQVU7UUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNqQzs7O0lBR0QsSUFBSSxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxNQUFNLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtNQUN2QyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0tBQ3JDOztJQUVELE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzlCLE9BQU8sTUFBTSxDQUFDO0dBQ2Y7O0VBRUQsSUFBSSxRQUFRLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRTs7Ozs7Ozs7O0lBUzlELElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO01BQ3ZDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7TUFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDekI7TUFDRCxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztNQUM5QixPQUFPLE1BQU0sQ0FBQztLQUNmOztJQUVELE1BQU0sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztJQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtNQUMxRCxJQUFJLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUNuRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFDN0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7TUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7TUFDL0MsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDM0MsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQzVDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNyQyxNQUFNO01BQ0wsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0tBQ3JDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ2hDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUM5QixNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztJQUM1QixNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQztJQUNyRCxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7O0lBRTVCLElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO01BQ3BDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO01BQzlCLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO01BQzVCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNyQjtJQUNELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDO0lBQ3BELE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzlCLE9BQU8sTUFBTSxD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
