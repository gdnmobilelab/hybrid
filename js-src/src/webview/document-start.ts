// import 'whatwg-fetch';
// import './util/override-logging';
import './navigator/service-worker';
import './console';
import './messages/message-channel';
import './util/generic-events';

window.onerror = function(err) {
    console.error(err);
}

// document.body.innerHTML="THIS LOADED"