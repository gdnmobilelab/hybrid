import './navigator/service-worker';
import './console';
import './messages/message-channel';
import './util/generic-events';
import './notification/notification';
import './util/set-document-html';
import './load-handler';

window.onerror = function(err) {
    console.error(err);
}

