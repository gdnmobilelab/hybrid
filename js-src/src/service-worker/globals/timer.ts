global.setTimeout = function() {
    return __timeoutManager.setTimeoutTimeout.apply(__timeoutManager, arguments);
}

global.setInterval = function() {
    return __timeoutManager.setIntervalInterval.apply(__timeoutManager, arguments);
}

global.clearTimeout = function() {
    return __timeoutManager.clearTimeout.apply(__timeoutManager, arguments);
}

global.clearInterval = function() {
    return __timeoutManager.clearInterval.apply(__timeoutManager, arguments);
}