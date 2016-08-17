// import './globals/console';
import './globals/promise';
import './globals/extended-event-types';
import './globals/websql';
import './globals/indexeddb';
import './globals/fetch';
import './globals/cache';
import './globals/clients';

import './hybrid/promise-bridge';
import './hybrid/dispatch-extended-event';

import './self/skip-waiting';
import './self/events';

global.Blob = function(){}