// import * as EventEmitter from 'events';

// // Weird disparity between our Rollup generated code and Node
// // test environment. Doing this handles both. No idea why.
// let ee = EventEmitter;
// let emitter = new ((ee as any).default || ee)();

// To stop the Typescript compiler complaining about us doing
// weird things
// let selfAsAny = self as any;

// selfAsAny.addEventListener = emitter.addListener.bind(emitter);
// selfAsAny.removeEventListener = emitter.removeListener.bind(emitter);

// selfAsAny.dispatchEvent = function(evt:Event) {
//     emitter.emit(evt.type, evt);
// }
