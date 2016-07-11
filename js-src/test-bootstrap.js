// Need to emulate our JSContext in Node

global.self = {};
global.hybrid = {};
require('./src/service-worker/include')