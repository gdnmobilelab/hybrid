function interopDefault(e){return e&&"object"==typeof e&&"default"in e?e.default:e}function createCommonjsModule(e,t){return t={exports:{}},e(t,t.exports),t.exports}function __extends(e,t){function n(){this.constructor=e}for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}function __decorate(e,t,n,r){var o,i=arguments.length,s=i<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(i<3?o(s):i>3?o(t,n,s):o(t,n))||s);return i>3&&s&&Object.defineProperty(t,n,s),s}function __metadata(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)}function __param(e,t){return function(n,r){t(n,r,e)}}function __awaiter(e,t,n,r){return new(n||(n=Promise))(function(o,i){function s(e){try{c(r.next(e))}catch(e){i(e)}}function a(e){try{c(r.throw(e))}catch(e){i(e)}}function c(e){e.done?o(e.value):new n(function(t){t(e.value)}).then(s,a)}c((r=r.apply(e,t)).next())})}function receiveMessage(e,t){try{console.debug("Received incoming message from native, to port",e,"with message",t);var n=PortStore.findOrCreateByNativeIndex(e);if(!n)throw new Error("Tried to receive message on inactive port");var r=t.passedPortIds.map(function(e){return PortStore.findOrCreateByNativeIndex(e).jsMessagePort});console.debug("Posting message to native index",n.nativePortIndex),n.sendOriginalPostMessage(JSON.parse(t.data),r)}catch(e){console.error(e)}}function postMessage(e,t){Promise.resolve().then(function(){return PromiseTools.map(t,function(e){var t=new MessagePortWrapper(e);return t.checkForNativePort().then(function(){return t.nativePortIndex})})}).then(function(t){promiseBridge.bridgePromise({operation:"postMessage",data:JSON.stringify(e),additionalPortIndexes:t})})}function processNewWorkerMatch(e){var t=serviceWorkerRecords[e.instanceId];return t?t.updateState(e.installState):(t=new HybridServiceWorker(e.instanceId,e.url,e.scope,e.installState),serviceWorkerRecords[e.instanceId]=t),RegistrationInstance.assignAccordingToInstallState(t),console.log("SW CHANGE",e),t}function refreshServiceWorkers(){serviceWorkerBridge.bridgePromise({operation:"getAll"}).then(function(e){e.forEach(function(e){serviceWorkerRecords[e.instanceId]=new HybridServiceWorker(e.instanceId,e.url,"",e.installState),RegistrationInstance.assignAccordingToInstallState(serviceWorkerRecords[e.instanceId])})})}var commonjsGlobal="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},index=createCommonjsModule(function(e){"use strict";function t(e,t,n){this.fn=e,this.context=t,this.once=n||!1}function n(){}var r=Object.prototype.hasOwnProperty,o="function"!=typeof Object.create&&"~";n.prototype._events=void 0,n.prototype.eventNames=function(){var e,t=this._events,n=[];if(!t)return n;for(e in t)r.call(t,e)&&n.push(o?e.slice(1):e);return Object.getOwnPropertySymbols?n.concat(Object.getOwnPropertySymbols(t)):n},n.prototype.listeners=function(e,t){var n=o?o+e:e,r=this._events&&this._events[n];if(t)return!!r;if(!r)return[];if(r.fn)return[r.fn];for(var i=0,s=r.length,a=new Array(s);i<s;i++)a[i]=r[i].fn;return a},n.prototype.emit=function(e,t,n,r,i,s){var a=arguments,c=this,l=o?o+e:e;if(!this._events||!this._events[l])return!1;var u,h,f=this._events[l],p=arguments.length;if("function"==typeof f.fn){switch(f.once&&this.removeListener(e,f.fn,void 0,!0),p){case 1:return f.fn.call(f.context),!0;case 2:return f.fn.call(f.context,t),!0;case 3:return f.fn.call(f.context,t,n),!0;case 4:return f.fn.call(f.context,t,n,r),!0;case 5:return f.fn.call(f.context,t,n,r,i),!0;case 6:return f.fn.call(f.context,t,n,r,i,s),!0}for(h=1,u=new Array(p-1);h<p;h++)u[h-1]=a[h];f.fn.apply(f.context,u)}else{var d,v=f.length;for(h=0;h<v;h++)switch(f[h].once&&c.removeListener(e,f[h].fn,void 0,!0),p){case 1:f[h].fn.call(f[h].context);break;case 2:f[h].fn.call(f[h].context,t);break;case 3:f[h].fn.call(f[h].context,t,n);break;default:if(!u)for(d=1,u=new Array(p-1);d<p;d++)u[d-1]=a[d];f[h].fn.apply(f[h].context,u)}}return!0},n.prototype.on=function(e,n,r){var i=new t(n,r||this),s=o?o+e:e;return this._events||(this._events=o?{}:Object.create(null)),this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],i]:this._events[s].push(i):this._events[s]=i,this},n.prototype.once=function(e,n,r){var i=new t(n,r||this,!0),s=o?o+e:e;return this._events||(this._events=o?{}:Object.create(null)),this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],i]:this._events[s].push(i):this._events[s]=i,this},n.prototype.removeListener=function(e,t,n,r){var i=o?o+e:e;if(!this._events||!this._events[i])return this;var s=this._events[i],a=[];if(t)if(s.fn)(s.fn!==t||r&&!s.once||n&&s.context!==n)&&a.push(s);else for(var c=0,l=s.length;c<l;c++)(s[c].fn!==t||r&&!s[c].once||n&&s[c].context!==n)&&a.push(s[c]);return a.length?this._events[i]=1===a.length?a[0]:a:delete this._events[i],this},n.prototype.removeAllListeners=function(e){return this._events?(e?delete this._events[o?o+e:e]:this._events=o?{}:Object.create(null),this):this},n.prototype.off=n.prototype.removeListener,n.prototype.addListener=n.prototype.on,n.prototype.setMaxListeners=function(){return this},n.prefixed=o,"undefined"!=typeof e&&(e.exports=n)}),EventEmitter=interopDefault(index),webkit=window.webkit,promiseCallbacks={},promiseBridges={};window.__promiseBridgeCallbacks=promiseCallbacks,window.__promiseBridges=promiseBridges;var PromiseOverWKMessage=function(e){function t(t){if(e.call(this),this.callbackArray=[],this.name=t,!webkit.messageHandlers[t])throw new Error('Message handler "'+t+'" does not exist');if(webkit.messageHandlers[t]._receive)throw new Error('Promise bridge for "'+t+'" already exists"');promiseCallbacks[t]=this.receiveResponse.bind(this),promiseBridges[t]=this}return __extends(t,e),t.prototype.bridgePromise=function(e){for(var t=this,n=this,r=0;t.callbackArray[r];)r++;return new Promise(function(t,o){n.callbackArray[r]=[t,o],console.debug("Sending",{callbackIndex:r,message:e}),webkit.messageHandlers[n.name].postMessage({callbackIndex:r,message:e})})},t.prototype.emitWithResponse=function(e,t,n){var r=this,o=null,i=function(e){o=e},s={respondWith:i,arguments:t};this.emit(e,s),Promise.resolve(o).then(function(e){console.log("FULFILL",n),r.send({callbackResponseIndex:n,fulfillValue:e})}).catch(function(e){console.log("CATCH",n),r.send({callbackResponseIndex:n,rejectValue:e.toString()})})},t.prototype.send=function(e){webkit.messageHandlers[this.name].postMessage({message:e})},t.prototype.receiveResponse=function(e,t,n){try{var r=this.callbackArray[e];if(!r)throw new Error("Tried to use a callback that didn't exist");this.callbackArray[e]=null;var o=r[0],i=r[1];t?i(new Error(t)):o(n)}catch(e){console.error(e)}},t}(EventEmitter),punycode=createCommonjsModule(function(e,t){!function(n){function r(e){throw RangeError(W[e])}function o(e,t){for(var n=e.length,r=[];n--;)r[n]=t(e[n]);return r}function i(e,t){var n=e.split("@"),r="";n.length>1&&(r=n[0]+"@",e=n[1]),e=e.replace(_,".");var i=e.split("."),s=o(i,t).join(".");return r+s}function s(e){for(var t,n,r=[],o=0,i=e.length;o<i;)t=e.charCodeAt(o++),t>=55296&&t<=56319&&o<i?(n=e.charCodeAt(o++),56320==(64512&n)?r.push(((1023&t)<<10)+(1023&n)+65536):(r.push(t),o--)):r.push(t);return r}function a(e){return o(e,function(e){var t="";return e>65535&&(e-=65536,t+=A(e>>>10&1023|55296),e=56320|1023&e),t+=A(e)}).join("")}function c(e){return e-48<10?e-22:e-65<26?e-65:e-97<26?e-97:P}function l(e,t){return e+22+75*(e<26)-((0!=t)<<5)}function u(e,t,n){var r=0;for(e=n?R(e/k):e>>1,e+=R(e/t);e>E*S>>1;r+=P)e=R(e/E);return R(r+(E+1)*e/(e+I))}function h(e){var t,n,o,i,s,l,h,f,p,d,v=[],m=e.length,g=0,y=O,w=j;for(n=e.lastIndexOf(M),n<0&&(n=0),o=0;o<n;++o)e.charCodeAt(o)>=128&&r("not-basic"),v.push(e.charCodeAt(o));for(i=n>0?n+1:0;i<m;){for(s=g,l=1,h=P;i>=m&&r("invalid-input"),f=c(e.charCodeAt(i++)),(f>=P||f>R((b-g)/l))&&r("overflow"),g+=f*l,p=h<=w?x:h>=w+S?S:h-w,!(f<p);h+=P)d=P-p,l>R(b/d)&&r("overflow"),l*=d;t=v.length+1,w=u(g-s,t,0==s),R(g/t)>b-y&&r("overflow"),y+=R(g/t),g%=t,v.splice(g++,0,y)}return a(v)}function f(e){var t,n,o,i,a,c,h,f,p,d,v,m,g,y,w,I=[];for(e=s(e),m=e.length,t=O,n=0,a=j,c=0;c<m;++c)v=e[c],v<128&&I.push(A(v));for(o=i=I.length,i&&I.push(M);o<m;){for(h=b,c=0;c<m;++c)v=e[c],v>=t&&v<h&&(h=v);for(g=o+1,h-t>R((b-n)/g)&&r("overflow"),n+=(h-t)*g,t=h,c=0;c<m;++c)if(v=e[c],v<t&&++n>b&&r("overflow"),v==t){for(f=n,p=P;d=p<=a?x:p>=a+S?S:p-a,!(f<d);p+=P)w=f-d,y=P-d,I.push(A(l(d+w%y,0))),f=R(w/y);I.push(A(l(f,0))),a=u(n,g,o==i),n=0,++o}++n,++t}return I.join("")}function p(e){return i(e,function(e){return C.test(e)?h(e.slice(4).toLowerCase()):e})}function d(e){return i(e,function(e){return $.test(e)?"xn--"+f(e):e})}var v="object"==typeof t&&t&&!t.nodeType&&t,m="object"==typeof e&&e&&!e.nodeType&&e,g="object"==typeof commonjsGlobal&&commonjsGlobal;g.global!==g&&g.window!==g&&g.self!==g||(n=g);var y,w,b=2147483647,P=36,x=1,S=26,I=38,k=700,j=72,O=128,M="-",C=/^xn--/,$=/[^\x20-\x7E]/,_=/[\x2E\u3002\uFF0E\uFF61]/g,W={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},E=P-x,R=Math.floor,A=String.fromCharCode;if(y={version:"1.3.2",ucs2:{decode:s,encode:a},decode:h,encode:f,toASCII:d,toUnicode:p},"function"==typeof define&&"object"==typeof define.amd&&define.amd)define("punycode",function(){return y});else if(v&&m)if(e.exports==v)m.exports=y;else for(w in y)y.hasOwnProperty(w)&&(v[w]=y[w]);else n.punycode=y}(commonjsGlobal)}),punycode$1=interopDefault(punycode),require$$2=Object.freeze({default:punycode$1}),util=createCommonjsModule(function(e){"use strict";e.exports={isString:function(e){return"string"==typeof e},isObject:function(e){return"object"==typeof e&&null!==e},isNull:function(e){return null===e},isNullOrUndefined:function(e){return null==e}}}),util$1=interopDefault(util),isString=util.isString,isObject=util.isObject,isNull=util.isNull,isNullOrUndefined=util.isNullOrUndefined,require$$1=Object.freeze({default:util$1,isString:isString,isObject:isObject,isNull:isNull,isNullOrUndefined:isNullOrUndefined}),decode$1=createCommonjsModule(function(e){"use strict";function t(e,t){return Object.prototype.hasOwnProperty.call(e,t)}e.exports=function(e,n,r,o){n=n||"&",r=r||"=";var i={};if("string"!=typeof e||0===e.length)return i;var s=/\+/g;e=e.split(n);var a=1e3;o&&"number"==typeof o.maxKeys&&(a=o.maxKeys);var c=e.length;a>0&&c>a&&(c=a);for(var l=0;l<c;++l){var u,h,f,p,d=e[l].replace(s,"%20"),v=d.indexOf(r);v>=0?(u=d.substr(0,v),h=d.substr(v+1)):(u=d,h=""),f=decodeURIComponent(u),p=decodeURIComponent(h),t(i,f)?Array.isArray(i[f])?i[f].push(p):i[f]=[i[f],p]:i[f]=p}return i}}),decode$2=interopDefault(decode$1),require$$1$1=Object.freeze({default:decode$2}),encode$1=createCommonjsModule(function(e){"use strict";var t=function(e){switch(typeof e){case"string":return e;case"boolean":return e?"true":"false";case"number":return isFinite(e)?e:"";default:return""}};e.exports=function(e,n,r,o){return n=n||"&",r=r||"=",null===e&&(e=void 0),"object"==typeof e?Object.keys(e).map(function(o){var i=encodeURIComponent(t(o))+r;return Array.isArray(e[o])?e[o].map(function(e){return i+encodeURIComponent(t(e))}).join(n):i+encodeURIComponent(t(e[o]))}).join(n):o?encodeURIComponent(t(o))+r+encodeURIComponent(t(e)):""}}),encode$2=interopDefault(encode$1),require$$0$1=Object.freeze({default:encode$2}),index$1=createCommonjsModule(function(e,t){"use strict";t.decode=t.parse=interopDefault(require$$1$1),t.encode=t.stringify=interopDefault(require$$0$1)}),index$2=interopDefault(index$1),encode=index$1.encode,stringify=index$1.stringify,decode=index$1.decode,parse$1=index$1.parse,require$$0=Object.freeze({default:index$2,encode:encode,stringify:stringify,decode:decode,parse:parse$1}),url=createCommonjsModule(function(e,t){"use strict";function n(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function r(e,t,r){if(e&&c.isObject(e)&&e instanceof n)return e;var o=new n;return o.parse(e,t,r),o}function o(e){return c.isString(e)&&(e=r(e)),e instanceof n?e.format():n.prototype.format.call(e)}function i(e,t){return r(e,!1,!0).resolve(t)}function s(e,t){return e?r(e,!1,!0).resolveObject(t):t}var a=interopDefault(require$$2),c=interopDefault(require$$1);t.parse=r,t.resolve=i,t.resolveObject=s,t.format=o,t.Url=n;var l=/^([a-z0-9.+-]+:)/i,u=/:[0-9]*$/,h=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,f=["<",">",'"',"`"," ","\r","\n","\t"],p=["{","}","|","\\","^","`"].concat(f),d=["'"].concat(p),v=["%","/","?",";","#"].concat(d),m=["/","?","#"],g=255,y=/^[+a-z0-9A-Z_-]{0,63}$/,w=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,b={javascript:!0,"javascript:":!0},P={javascript:!0,"javascript:":!0},x={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},S=interopDefault(require$$0);n.prototype.parse=function(e,t,n){var r=this;if(!c.isString(e))throw console.log("URL IS",e),new TypeError("Parameter 'url' must be a string, not "+typeof e);var o=e.indexOf("?"),i=o!==-1&&o<e.indexOf("#")?"?":"#",s=e.split(i),u=/\\/g;s[0]=s[0].replace(u,"/"),e=s.join(i);var f=e;if(f=f.trim(),!n&&1===e.split("#").length){var p=h.exec(f);if(p)return this.path=f,this.href=f,this.pathname=p[1],p[2]?(this.search=p[2],t?this.query=S.parse(this.search.substr(1)):this.query=this.search.substr(1)):t&&(this.search="",this.query={}),this}var I=l.exec(f);if(I){I=I[0];var k=I.toLowerCase();this.protocol=k,f=f.substr(I.length)}if(n||I||f.match(/^\/\/[^@\/]+@[^@\/]+/)){var j="//"===f.substr(0,2);!j||I&&P[I]||(f=f.substr(2),this.slashes=!0)}if(!P[I]&&(j||I&&!x[I])){for(var O=-1,M=0;M<m.length;M++){var C=f.indexOf(m[M]);C!==-1&&(O===-1||C<O)&&(O=C)}var $,_;_=O===-1?f.lastIndexOf("@"):f.lastIndexOf("@",O),_!==-1&&($=f.slice(0,_),f=f.slice(_+1),this.auth=decodeURIComponent($)),O=-1;for(var M=0;M<v.length;M++){var C=f.indexOf(v[M]);C!==-1&&(O===-1||C<O)&&(O=C)}O===-1&&(O=f.length),this.host=f.slice(0,O),f=f.slice(O),this.parseHost(),this.hostname=this.hostname||"";var W="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!W)for(var E=this.hostname.split(/\./),M=0,R=E.length;M<R;M++){var A=E[M];if(A&&!A.match(y)){for(var N="",T=0,B=A.length;T<B;T++)N+=A.charCodeAt(T)>127?"x":A[T];if(!N.match(y)){var L=E.slice(0,M),q=E.slice(M+1),U=A.match(w);U&&(L.push(U[1]),q.unshift(U[2])),q.length&&(f="/"+q.join(".")+f),r.hostname=L.join(".");break}}}this.hostname.length>g?this.hostname="":this.hostname=this.hostname.toLowerCase(),W||(this.hostname=a.toASCII(this.hostname));var H=this.port?":"+this.port:"",D=this.hostname||"";this.host=D+H,this.href+=this.host,W&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==f[0]&&(f="/"+f))}if(!b[k])for(var M=0,R=d.length;M<R;M++){var J=d[M];if(f.indexOf(J)!==-1){var F=encodeURIComponent(J);F===J&&(F=escape(J)),f=f.split(J).join(F)}}var z=f.indexOf("#");z!==-1&&(this.hash=f.substr(z),f=f.slice(0,z));var K=f.indexOf("?");if(K!==-1?(this.search=f.substr(K),this.query=f.substr(K+1),t&&(this.query=S.parse(this.query)),f=f.slice(0,K)):t&&(this.search="",this.query={}),f&&(this.pathname=f),x[k]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){var H=this.pathname||"",G=this.search||"";this.path=H+G}return this.href=this.format(),this},n.prototype.format=function(){var e=this.auth||"";e&&(e=encodeURIComponent(e),e=e.replace(/%3A/i,":"),e+="@");var t=this.protocol||"",n=this.pathname||"",r=this.hash||"",o=!1,i="";this.host?o=e+this.host:this.hostname&&(o=e+(this.hostname.indexOf(":")===-1?this.hostname:"["+this.hostname+"]"),this.port&&(o+=":"+this.port)),this.query&&c.isObject(this.query)&&Object.keys(this.query).length&&(i=S.stringify(this.query));var s=this.search||i&&"?"+i||"";return t&&":"!==t.substr(-1)&&(t+=":"),this.slashes||(!t||x[t])&&o!==!1?(o="//"+(o||""),n&&"/"!==n.charAt(0)&&(n="/"+n)):o||(o=""),r&&"#"!==r.charAt(0)&&(r="#"+r),s&&"?"!==s.charAt(0)&&(s="?"+s),n=n.replace(/[?#]/g,function(e){return encodeURIComponent(e)}),s=s.replace("#","%23"),t+o+n+s+r},n.prototype.resolve=function(e){return this.resolveObject(r(e,!1,!0)).format()},n.prototype.resolveObject=function(e){var t=this;if(c.isString(e)){var r=new n;r.parse(e,!1,!0),e=r}for(var o=new n,i=Object.keys(this),s=0;s<i.length;s++){var a=i[s];o[a]=t[a]}if(o.hash=e.hash,""===e.href)return o.href=o.format(),o;if(e.slashes&&!e.protocol){for(var l=Object.keys(e),u=0;u<l.length;u++){var h=l[u];"protocol"!==h&&(o[h]=e[h])}return x[o.protocol]&&o.hostname&&!o.pathname&&(o.path=o.pathname="/"),o.href=o.format(),o}if(e.protocol&&e.protocol!==o.protocol){if(!x[e.protocol]){for(var f=Object.keys(e),p=0;p<f.length;p++){var d=f[p];o[d]=e[d]}return o.href=o.format(),o}if(o.protocol=e.protocol,e.host||P[e.protocol])o.pathname=e.pathname;else{for(var v=(e.pathname||"").split("/");v.length&&!(e.host=v.shift()););e.host||(e.host=""),e.hostname||(e.hostname=""),""!==v[0]&&v.unshift(""),v.length<2&&v.unshift(""),o.pathname=v.join("/")}if(o.search=e.search,o.query=e.query,o.host=e.host||"",o.auth=e.auth,o.hostname=e.hostname||e.host,o.port=e.port,o.pathname||o.search){var m=o.pathname||"",g=o.search||"";o.path=m+g}return o.slashes=o.slashes||e.slashes,o.href=o.format(),o}var y=o.pathname&&"/"===o.pathname.charAt(0),w=e.host||e.pathname&&"/"===e.pathname.charAt(0),b=w||y||o.host&&e.pathname,S=b,I=o.pathname&&o.pathname.split("/")||[],v=e.pathname&&e.pathname.split("/")||[],k=o.protocol&&!x[o.protocol];if(k&&(o.hostname="",o.port=null,o.host&&(""===I[0]?I[0]=o.host:I.unshift(o.host)),o.host="",e.protocol&&(e.hostname=null,e.port=null,e.host&&(""===v[0]?v[0]=e.host:v.unshift(e.host)),e.host=null),b=b&&(""===v[0]||""===I[0])),w)o.host=e.host||""===e.host?e.host:o.host,o.hostname=e.hostname||""===e.hostname?e.hostname:o.hostname,o.search=e.search,o.query=e.query,I=v;else if(v.length)I||(I=[]),I.pop(),I=I.concat(v),o.search=e.search,o.query=e.query;else if(!c.isNullOrUndefined(e.search)){if(k){o.hostname=o.host=I.shift();var j=!!(o.host&&o.host.indexOf("@")>0)&&o.host.split("@");j&&(o.auth=j.shift(),o.host=o.hostname=j.shift())}return o.search=e.search,o.query=e.query,c.isNull(o.pathname)&&c.isNull(o.search)||(o.path=(o.pathname?o.pathname:"")+(o.search?o.search:"")),o.href=o.format(),o}if(!I.length)return o.pathname=null,o.search?o.path="/"+o.search:o.path=null,o.href=o.format(),o;for(var O=I.slice(-1)[0],M=(o.host||e.host||I.length>1)&&("."===O||".."===O)||""===O,C=0,$=I.length;$>=0;$--)O=I[$],"."===O?I.splice($,1):".."===O?(I.splice($,1),C++):C&&(I.splice($,1),C--);if(!b&&!S)for(;C--;C)I.unshift("..");!b||""===I[0]||I[0]&&"/"===I[0].charAt(0)||I.unshift(""),M&&"/"!==I.join("/").substr(-1)&&I.push("");var _=""===I[0]||I[0]&&"/"===I[0].charAt(0);if(k){o.hostname=o.host=_?"":I.length?I.shift():"";var j=!!(o.host&&o.host.indexOf("@")>0)&&o.host.split("@");j&&(o.auth=j.shift(),o.host=o.hostname=j.shift())}return b=b||o.host&&I.length,b&&!_&&I.unshift(""),I.length?o.pathname=I.join("/"):(o.pathname=null,o.path=null),c.isNull(o.pathname)&&c.isNull(o.search)||(o.path=(o.pathname?o.pathname:"")+(o.search?o.search:"")),o.auth=e.auth||o.auth,o.slashes=o.slashes||e.slashes,o.href=o.format(),o},n.prototype.parseHost=function(){var e=this.host,t=u.exec(e);t&&(t=t[0],":"!==t&&(this.port=t.substr(1)),e=e.substr(0,e.length-t.length)),e&&(this.hostname=e)}});interopDefault(url);var Url=url.Url,format=url.format,resolveObject=url.resolveObject,resolve=url.resolve,parse=url.parse,activeMessagePorts=[],PortStore={add:function(e){if(activeMessagePorts.indexOf(e)>-1)throw new Error("Trying to add a port that's already been added");activeMessagePorts.push(e)},remove:function(e){activeMessagePorts.splice(activeMessagePorts.indexOf(e),1)},findByNativeIndex:function(e){var t=activeMessagePorts.filter(function(t){return t.nativePortIndex===e});return t[0]},findOrCreateByNativeIndex:function(e){if(!e&&0!==e)throw new Error("Must provide a native index");var t=PortStore.findByNativeIndex(e);if(t)return t;var n=new MessagePortWrapper;return n.nativePortIndex=e,console.debug("Created new web MessagePort for native index",e),PortStore.add(n),n},findOrWrapJSMesssagePort:function(e){var t=activeMessagePorts.filter(function(t){return t.jsMessagePort==e});if(1==t.length)return t[0];var n=new MessagePortWrapper(e);return n}};window.hybridPortStore=PortStore;var index$3=createCommonjsModule(function(e,t){"use strict";function n(e){return e&&"undefined"!=typeof Symbol&&e.constructor===Symbol?"symbol":typeof e}var r={}.hasOwnProperty,o=function(e,t){function n(){this.constructor=e}for(var o in t)r.call(t,o)&&(e[o]=t[o]);return n.prototype=t.prototype,e.prototype=new n,e.__super__=t.prototype,e},i=t.TimeoutError=function(e){return this instanceof i?(Error.captureStackTrace?(i.__super__.constructor.apply(this,arguments),Error.captureStackTrace(this,this.constructor)):this.stack=new Error(e).stack,this.message=e,void(this.name="TimeoutError")):new i(e)};o(i,Error),t.delay=function(e){return new Promise(function(t){setTimeout(t,e)})},t.defer=function(){var e={};return e.promise=new Promise(function(t,n){e.resolve=t,e.reject=n}),e},t.series=function(e){var t=[];return e.reduce(function(e,n){return e.then(n).then(function(e){t.push(e)})},Promise.resolve()).then(function(){return t})},t.parallel=t.parallelLimit=function(e,t){return!t||t<1||t>=e.length?Promise.all(e.map(function(e){return Promise.resolve().then(e)})):new Promise(function(n,r){for(var o=[],i=0,s=0,a=!1,c=function c(){if(!(a||i>=e.length)){var l=i++,u=e[l];s++,Promise.resolve().then(u).then(function(r){o[l]=r,s--,i<e.length&&s<t?c():0===s&&n(o)},function(e){a||(a=!0,r(e))})}},l=0;l<t;l++)c()})},t.map=function(e,n,r){var o=r;(!r||r<1)&&(o=1),r>=e.length&&(o=e.length);var i=e.map(function(e,t){return function(){return n(e,t)}});return t.parallel(i,o)},t.timeout=function(e,n){return new Promise(function(r,o){var i=setTimeout(function(){i=null,o(new t.TimeoutError("Timeout: Promise did not resolve within "+n+" milliseconds"))},n);e.then(function(e){null!==i&&(clearTimeout(i),r(e))},function(e){null!==i&&(clearTimeout(i),o(e))})})},t.whilst=function(e,t){return new Promise(function(n,r){var o=null,i=function i(){try{e()?Promise.resolve().then(t).then(function(e){o=e,setTimeout(i,0)},r):n(o)}catch(e){r(e)}};i()})},t.doWhilst=function(e,n){var r=!0,o=function(){var e=r||n();return r=!1,e};return t.whilst(o,e)},t.retry=function(e,t){function r(e){return new Error("Unsupported argument type for 'times': "+("undefined"==typeof e?"undefined":n(e)))}var o=5,i=0,s=0,a=null;if("function"==typeof e)t=e;else if("number"==typeof e)o=+e;else{if("object"!==("undefined"==typeof e?"undefined":n(e)))return e?Promise.reject(r(e)):Promise.reject(new Error("No parameters given"));if("number"==typeof e.times)o=+e.times;else if(e.times)return Promise.reject(r(e.times));e.interval&&(i=+e.interval)}return new Promise(function(e,n){var r=function r(){Promise.resolve().then(function(){return t(a)}).then(e).catch(function(e){s++,a=e,o!==1/0&&s===o?n(a):setTimeout(r,i)})};r()})}}),PromiseTools=interopDefault(index$3),retry=index$3.retry,doWhilst=index$3.doWhilst,whilst=index$3.whilst,timeout=index$3.timeout,map=index$3.map,parallel=index$3.parallel,parallelLimit=index$3.parallelLimit,series=index$3.series,defer=index$3.defer,delay=index$3.delay,TimeoutError=index$3.TimeoutError,webkit$1=window.webkit,promiseBridge=new PromiseOverWKMessage("messageChannel");window.__messageChannelBridge=promiseBridge,promiseBridge.addListener("emit",receiveMessage);var MessagePortWrapper=function(){function e(e){var t=this;void 0===e&&(e=null),this.nativePortIndex=null,e?(console.debug("Creating wrapper for an existing MessagePort"),this.jsMessagePort=e,this.jsMessagePort.postMessage=this.handleJSMessage.bind(this)):(console.debug("Making wrapper for a new web MessagePort"),this.jsMessageChannel=new MessageChannel,this.jsMessagePort=this.jsMessageChannel.port1,this.jsMessageChannel.port2.onmessage=function(e){t.handleJSMessage(e.data,e.ports)}),this.originalJSPortClose=this.jsMessagePort.close,this.jsMessagePort.close=this.close}return e.prototype.sendOriginalPostMessage=function(e,t){MessagePort.prototype.postMessage.apply(this.jsMessagePort,[e,t])},e.prototype.handleJSMessage=function(e,t,n){var r=this;void 0===n&&(n=!1),console.debug("Posting new message...");var o=[];t&&(o=t.map(function(e){return PortStore.findOrWrapJSMesssagePort(e)})),this.checkForNativePort().then(function(){return console.debug("Checking that additional ports have native equivalents"),PromiseTools.map(o,function(e){return e.checkForNativePort()})}).then(function(){promiseBridge.bridgePromise({operation:"sendToPort",portIndex:r.nativePortIndex,data:JSON.stringify(e),isExplicitPost:n,additionalPortIndexes:o.map(function(e){return e.nativePortIndex})})}).catch(function(e){console.error(e)})},e.prototype.checkForNativePort=function(){var e=this;return null!==this.nativePortIndex?Promise.resolve():promiseBridge.bridgePromise({operation:"create"}).then(function(t){console.debug("Created new native MessagePort at index ",String(t)),e.nativePortIndex=t,PortStore.add(e)})},e.prototype.close=function(){this.originalJSPortClose.apply(this.jsMessagePort),PortStore.remove(this),promiseBridge.bridgePromise({operation:"delete",portIndex:this.nativePortIndex})},e}(),promiseBridge$1=new PromiseOverWKMessage("notifications"),notification={permission:"unknown",requestPermission:function(e){return promiseBridge$1.bridgePromise({operation:"requestPermission"}).then(function(t){return e&&e(t),t})}};promiseBridge$1.bridgePromise({operation:"getStatus"}).then(function(e){notification.permission=e}),promiseBridge$1.on("notification-permission-change",function(e){notification.permission=status}),window.Notification=notification;var HybridPushManager=function(){function e(){}return e.prototype.subscribe=function(){return Promise.resolve(null)},e.prototype.getSubscription=function(){return Promise.resolve(null)},e.prototype.hasPermission=function(){return this.permissionState()},e.prototype.permissionState=function(){var e=notification.permission;return"default"==e&&(e="prompt"),Promise.resolve(e)},e}(),serviceWorkerBridge=new PromiseOverWKMessage("serviceWorker"),EventEmitterToJSEvent=function(e){function t(){e.apply(this,arguments)}return __extends(t,e),t.prototype.addEventListener=function(e,t,n){this.addListener(e,t)},t.prototype.dispatchEvent=function(e){return this.emit(e.type,e),!0},t.prototype.removeEventListener=function(e,t){this.removeListener(e,t)},t}(EventEmitter),HybridServiceWorker=function(e){function t(t,n,r,o){var i=this;e.call(this),this._id=t,this.scriptURL=n,this.scope=r,this.installState=o,this.addListener("message",function(e){i.onmessage&&i.onmessage(e)})}return __extends(t,e),Object.defineProperty(t.prototype,"state",{get:function(){if(this.installState===ServiceWorkerInstallState.Activated)return"activated";if(this.installState===ServiceWorkerInstallState.Activating)return"activating";if(this.installState===ServiceWorkerInstallState.Installed)return"installed";if(this.installState===ServiceWorkerInstallState.Installing)return"installing";if(this.installState===ServiceWorkerInstallState.Redundant)return"redundant";throw new Error("Unrecognised install state:"+this.installState)},enumerable:!0,configurable:!0}),t.prototype.updateState=function(e){e!==this.installState&&(this.installState=e,this.onstatechange&&this.onstatechange({target:this}))},t.prototype.postMessage=function(e,t){if(RegistrationInstance.active!==this)throw new Error("Can only postMessage to active service worker");if(t.length>1||t[0]instanceof MessagePort==!1)throw new Error("Currently only supports sending one MessagePort");postMessage(e,[t[0]])},t.prototype.terminate=function(){throw new Error("Should not implement this.")},t}(EventEmitterToJSEvent),HybridRegistration=function(e){function t(){var t=this;e.call(this),this.addListener("updatefound",function(){t.onupdatefound&&t.onupdatefound()}),this.pushManager=new HybridPushManager}return __extends(t,e),t.prototype.getMostRecentWorker=function(){return this.active||this.waiting||this.installing},t.prototype.update=function(){serviceWorkerBridge.bridgePromise({operation:"update",url:this.getMostRecentWorker().scriptURL})},Object.defineProperty(t.prototype,"scope",{get:function(){return this.active.scope},enumerable:!0,configurable:!0}),t.prototype.unregister=function(){throw new Error("not yet")},t.prototype.clearAllInstancesOfServiceWorker=function(e){this.active===e&&(this.active=null),this.installing===e&&(this.installing=null),this.waiting===e&&(this.waiting=null)},t.prototype.assignAccordingToInstallState=function(e){this.clearAllInstancesOfServiceWorker(e),e.installState!==ServiceWorkerInstallState.Activated||this.active||(this.active=e,ServiceWorkerContainer.controller=e),e.installState===ServiceWorkerInstallState.Installed&&(this.waiting=e),e.installState===ServiceWorkerInstallState.Installing&&(this.installing=e,this.emit("updatefound",e))},t}(EventEmitterToJSEvent),RegistrationInstance=new HybridRegistration,HybridServiceWorkerContainer=function(e){function t(){var t=this;e.call(this),this.addListener("controllerchange",function(){t.oncontrollerchange&&t.oncontrollerchange()}),this.addListener("message",function(e){console.log("FIRED MESSAGE",t.onmessage),t.controller&&t.controller.dispatchEvent(e),t.onmessage&&t.onmessage(e)}),this.controller=RegistrationInstance.active}return __extends(t,e),Object.defineProperty(t.prototype,"ready",{get:function(){var e=this;return this.controller?(console.info("ServiceWorker ready returning immediately with activated instance"),Promise.resolve(RegistrationInstance)):new Promise(function(t,n){console.info("ServiceWorker ready returning promise and waiting..."),e.once("controllerchange",function(){console.debug("ServiceWorker ready received response"),t(RegistrationInstance)})})},enumerable:!0,configurable:!0}),t.prototype.register=function(e,t){var n=resolve(window.location.href,e);return console.info("Attempting to register service worker at",n),serviceWorkerBridge.bridgePromise({operation:"register",swPath:n,scope:t?t.scope:null}).then(function(e){processNewWorkerMatch(e);return RegistrationInstance}).catch(function(e){return console.error(e),null})},t.prototype.claimedByNewWorker=function(e){RegistrationInstance.clearAllInstancesOfServiceWorker(e),RegistrationInstance.active=e,this.controller=e,this.emit("controllerchange",e)},t.prototype.getRegistration=function(e){return Promise.resolve(RegistrationInstance)},t.prototype.getRegistrations=function(){return Promise.resolve([RegistrationInstance])},t}(EventEmitterToJSEvent),ServiceWorkerContainer=new HybridServiceWorkerContainer,ServiceWorkerInstallState;!function(e){e[e.Installing=0]="Installing",e[e.Installed=1]="Installed",e[e.Activating=2]="Activating",e[e.Activated=3]="Activated",e[e.Redundant=4]="Redundant"}(ServiceWorkerInstallState||(ServiceWorkerInstallState={}));var serviceWorkerRecords={};serviceWorkerBridge.addListener("sw-change",processNewWorkerMatch),serviceWorkerBridge.addListener("claimed",function(e){var t=processNewWorkerMatch(e);console.log("Claimed by new worker"),ServiceWorkerContainer.claimedByNewWorker(t)}),refreshServiceWorkers(),serviceWorkerBridge.on("postMessage",function(e){for(var t=e.arguments[0],n=e.arguments[1],r=[],o=[],i=function(e){var t=new MessageChannel;o[e]=null,t.port2.onmessage=function(t){console.log("RECEIVED PORT WRITE",e,t.data),o[e]=t.data},r.push(t)},s=0;s<n;s++)i(s);var a=r.map(function(e){return e.port1}),c=new MessageEvent("message",{data:t,ports:a}),l=null;c.waitUntil=function(e){l=e},ServiceWorkerContainer.dispatchEvent(c),e.respondWith(Promise.resolve(l).then(function(){return new Promise(function(e,t){
setTimeout(function(){e(o.map(function(e){return JSON.stringify(e)}))},1)})}))});var navigatorAsAny=navigator;navigatorAsAny.serviceWorker=ServiceWorkerContainer;var promiseBridge$2=new PromiseOverWKMessage("console"),makeSuitable=function(e){if(e instanceof Error)return e.toString();if("string"==typeof e)return e;if(null===e||void 0===e)return"null";var t="(not stringifyable): ";try{t=JSON.stringify(e)}catch(e){t+=e.toString()}return t},levels=["debug","info","log","error","warn"],console$1={},originalConsole=window.console;window.console=console$1,levels.forEach(function(e){console$1[e]=function(){originalConsole&&originalConsole[e].apply(originalConsole,arguments);var t=Array.from(arguments).map(makeSuitable);promiseBridge$2.send({level:e,args:t})}});var eventsBridge=new PromiseOverWKMessage("events");window.hybridEvents={emit:function(e,t){eventsBridge.send({name:e,data:t})}};var loadedIndicator=null;window.__setHTML=function(e,t){console.log("new base URL is",t);var n=/<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(e)[1];history.replaceState(null,null,t),refreshServiceWorkers(),document.documentElement.innerHTML=n,loadedIndicator=document.createElement("div"),loadedIndicator.style.position="absolute",loadedIndicator.style.right="0px",loadedIndicator.style.top="0px",loadedIndicator.style.width="1px",loadedIndicator.style.height="1px",loadedIndicator.style.backgroundColor="rgb(0,255,255)",document.body.appendChild(loadedIndicator)},window.__removeLoadedIndicator=function(){document.body.removeChild(loadedIndicator);for(var e=document.documentElement.getElementsByTagName("script"),t=0;t<e.length;t++){var n=e[t],r=n.parentElement,o=document.createElement("script");o.async=n.async,o.src=n.src,o.textContent=n.textContent,o.type=n.type,r.insertBefore(o,n),r.removeChild(n)}},window.onerror=function(e){console.error(e)};