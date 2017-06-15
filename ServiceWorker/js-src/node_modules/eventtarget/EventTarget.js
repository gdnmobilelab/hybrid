/**
 * @author mrdoob / http://mrdoob.com
 * @author Jesús Leganés Combarro "Piranna" <piranna@gmail.com>
 */


function EventTarget()
{
  var listeners = {};

  this.addEventListener = function(type, listener)
  {
    if(!listener) return

    var listeners_type = listeners[type]
    if(listeners_type === undefined)
      listeners[type] = listeners_type = [];

    for(var i=0,l; l=listeners_type[i]; i++)
      if(l === listener) return;

    listeners_type.push(listener);
  };

  this.dispatchEvent = function(event)
  {
    if(event._dispatched) throw 'InvalidStateError'
    event._dispatched = true

    var type = event.type
    if(type == undefined || type == '') throw 'UNSPECIFIED_EVENT_TYPE_ERR'

    var listenerArray = (listeners[type] || []);

    var dummyListener = this['on' + type];
    if(typeof dummyListener == 'function')
      listenerArray = listenerArray.concat(dummyListener);

    var stopImmediatePropagation = false

    // [ToDo] Use read-only properties instead of attributes when availables
    event.cancelable = true
    event.defaultPrevented = false
    event.isTrusted = false
    event.preventDefault = function()
    {
      if(this.cancelable)
        this.defaultPrevented = true
    }
    event.stopImmediatePropagation = function()
    {
      stopImmediatePropagation = true
    }
    event.target = this
    event.timeStamp = new Date().getTime()

    for(var i=0,listener; listener=listenerArray[i]; i++)
    {
      if(stopImmediatePropagation) break

      listener.call(this, event);
    }

    return !event.defaultPrevented
  };

  this.removeEventListener = function(type, listener)
  {
    if(!listener) return

    var listeners_type = listeners[type]
    if(listeners_type === undefined) return

    for(var i=0,l; l=listeners_type[i]; i++)
      if(l === listener)
      {
        listeners_type.splice(i, 1);
        break;
      }

    if(!listeners_type.length)
      delete listeners[type]
  };
};


if(typeof module !== 'undefined' && module.exports)
  module.exports = EventTarget;
