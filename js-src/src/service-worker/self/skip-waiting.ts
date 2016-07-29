let selfAsAny = self as any;

let __waitSkipped = false;

selfAsAny.skipWaiting = function() {
    __waitSkipped = true;
}

hybrid.__getSkippedWaitingStatus = function() {
    return __waitSkipped;
}