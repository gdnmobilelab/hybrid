function send(msg) {
    if (typeof msg.arguments === "object") {
        msg.arguments = JSON.stringify(msg.arguments);
    }
    window.webkit.messageHandlers.hybrid.postMessage(msg);
}
// WebKit messageHandlers don't actually allow a response, so instead
// we store an array of callback functions, which we then call in-app
// with a window._hybridCallback call. 
var callbackArray = [];
function sendAndReceive(msg) {
    var callbackIndex = 0;
    while (callbackArray[callbackIndex]) {
        callbackIndex++;
    }
    return new Promise(function (fulfill, reject) {
        callbackArray[callbackIndex] = function (err, resp) {
            callbackArray[callbackIndex] = null;
            if (err) {
                return reject(err);
            }
            else {
                return fulfill(resp);
            }
        };
        msg._callbackIndex = callbackIndex;
        send(msg);
    });
}
;
window._hybridCallback = function (callbackIndex, err, resp) {
    console.log('idx', callbackIndex);
    callbackArray[callbackIndex](err, resp);
};

var makeSuitable = function (val) {
    if (val instanceof Error) {
        return val.toString();
    }
    else {
        return JSON.stringify(val);
    }
};
if (!console._hybridHooked) {
    var levels = ['info', 'log', 'error'];
    levels.forEach(function (level) {
        var original = console[level];
        console[level] = function () {
            // Still output to web console in case we have Safari debugger attached.
            if (original) {
                original.apply(console, arguments);
            }
            // Array.from because otherwise it transforms to an object like {"0": "", "1": ""}
            var argsAsJSON = Array.from(arguments).map(makeSuitable);
            send({
                command: 'console',
                arguments: {
                    level: level,
                    text: argsAsJSON.join(",")
                }
            });
        };
    });
    // send errors to XCode debug
    if (window) {
        window.onerror = function (message, file, line, col, error) {
            console.error(arguments);
        };
    }
    console._hybridHooked = true;
}

navigator.serviceWorker = {
    register: function (swPath, opts) {
        if ( opts === void 0 ) opts = {};

        var pathToSW = window.location.origin + resolve(window.location.pathname, swPath);
        console.info("Attempting to register service worker at", pathToSW);
        return sendAndReceive({
            command: "navigator.serviceWorker.register",
            arguments: {
                path: swPath,
                options: opts
            }
        })
            .then(function (response) {
            console.log("done?", response);
        });
        // fetch("http://localhost:" + HANDLER_PORT + "/sw/register", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         url: pathToSW,
        //         scope: opts.scope
        //     })
        // })
        // .then((res) => res.json())
        // .then(function(json) {
        //       console.log("done?", json);
        // })
        // .catch((err) => {
        //     console.error(err, err.stack)
        // })
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3RhcnQuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL3drLW1lc3NhZ2luZy50cyIsIi4uLy4uL2pzLXNyYy9zcmMvd2Vidmlldy91dGlsL292ZXJyaWRlLWxvZ2dpbmcudHMiLCIuLi8uLi9qcy1zcmMvc3JjL3dlYnZpZXcvZG9jdW1lbnQtc3RhcnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIHNlbmQobXNnKSB7XG4gICAgaWYgKHR5cGVvZiBtc2cuYXJndW1lbnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1zZy5hcmd1bWVudHMgPSBKU09OLnN0cmluZ2lmeShtc2cuYXJndW1lbnRzKTtcbiAgICB9XG4gICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMuaHlicmlkLnBvc3RNZXNzYWdlKG1zZyk7XG59XG5cbi8vIFdlYktpdCBtZXNzYWdlSGFuZGxlcnMgZG9uJ3QgYWN0dWFsbHkgYWxsb3cgYSByZXNwb25zZSwgc28gaW5zdGVhZFxuLy8gd2Ugc3RvcmUgYW4gYXJyYXkgb2YgY2FsbGJhY2sgZnVuY3Rpb25zLCB3aGljaCB3ZSB0aGVuIGNhbGwgaW4tYXBwXG4vLyB3aXRoIGEgd2luZG93Ll9oeWJyaWRDYWxsYmFjayBjYWxsLiBcblxuY29uc3QgY2FsbGJhY2tBcnJheSA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gc2VuZEFuZFJlY2VpdmUobXNnKSB7XG4gICAgXG4gICAgbGV0IGNhbGxiYWNrSW5kZXggPSAwO1xuXG4gICAgd2hpbGUgKGNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0pIHtcbiAgICAgICAgY2FsbGJhY2tJbmRleCsrO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVsZmlsbCwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNhbGxiYWNrQXJyYXlbY2FsbGJhY2tJbmRleF0gPSAoZXJyLCByZXNwKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdWxmaWxsKHJlc3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBtc2cuX2NhbGxiYWNrSW5kZXggPSBjYWxsYmFja0luZGV4O1xuICAgICAgICBzZW5kKG1zZyk7XG4gICAgfSk7XG59O1xuXG53aW5kb3cuX2h5YnJpZENhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2tJbmRleCwgZXJyLCByZXNwKSB7XG4gICAgY29uc29sZS5sb2coJ2lkeCcsY2FsbGJhY2tJbmRleClcbiAgICBjYWxsYmFja0FycmF5W2NhbGxiYWNrSW5kZXhdKGVyciwgcmVzcCk7XG59IiwiaW1wb3J0IHtzZW5kfSBmcm9tICcuL3drLW1lc3NhZ2luZyc7XG5cbmNvbnN0IG1ha2VTdWl0YWJsZSA9ICh2YWwpID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHZhbC50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgICB9XG59XG5cbmlmICghY29uc29sZS5faHlicmlkSG9va2VkKSB7XG4gICAgbGV0IGxldmVscyA9IFsnaW5mbycsICdsb2cnLCAnZXJyb3InXTtcblxuICAgIGxldmVscy5mb3JFYWNoKChsZXZlbCkgPT4ge1xuICAgICAgICBsZXQgb3JpZ2luYWwgPSBjb25zb2xlW2xldmVsXTtcbiAgICAgICAgY29uc29sZVtsZXZlbF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU3RpbGwgb3V0cHV0IHRvIHdlYiBjb25zb2xlIGluIGNhc2Ugd2UgaGF2ZSBTYWZhcmkgZGVidWdnZXIgYXR0YWNoZWQuXG4gICAgICAgICAgICBpZiAob3JpZ2luYWwpIHtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbC5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBcnJheS5mcm9tIGJlY2F1c2Ugb3RoZXJ3aXNlIGl0IHRyYW5zZm9ybXMgdG8gYW4gb2JqZWN0IGxpa2Uge1wiMFwiOiBcIlwiLCBcIjFcIjogXCJcIn1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IGFyZ3NBc0pTT04gPSBBcnJheS5mcm9tKGFyZ3VtZW50cykubWFwKG1ha2VTdWl0YWJsZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlbmQoe1xuICAgICAgICAgICAgICAgIGNvbW1hbmQ6ICdjb25zb2xlJyxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBhcmdzQXNKU09OLmpvaW4oXCIsXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICAvLyBzZW5kIGVycm9ycyB0byBYQ29kZSBkZWJ1Z1xuICAgIGlmICh3aW5kb3cpIHtcbiAgICAgICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBmaWxlLCBsaW5lLCBjb2wsIGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgICAgIFxuICAgIGNvbnNvbGUuX2h5YnJpZEhvb2tlZCA9IHRydWU7XG59XG5cbiIsIi8vIGltcG9ydCAnd2hhdHdnLWZldGNoJztcbmltcG9ydCAnLi91dGlsL292ZXJyaWRlLWxvZ2dpbmcnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aC1icm93c2VyaWZ5JztcbmltcG9ydCB7c2VuZEFuZFJlY2VpdmV9IGZyb20gJy4vdXRpbC93ay1tZXNzYWdpbmcnO1xuXG5cbm5hdmlnYXRvci5zZXJ2aWNlV29ya2VyID0ge1xuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihzd1BhdGgsIG9wdHMgPSB7fSkge1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBsZXQgcGF0aFRvU1cgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcmVzb2x2ZSh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsIHN3UGF0aCk7IFxuICAgIFxuICAgICAgICBjb25zb2xlLmluZm8oXCJBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIHNlcnZpY2Ugd29ya2VyIGF0XCIsIHBhdGhUb1NXKTtcblxuICAgICAgICByZXR1cm4gc2VuZEFuZFJlY2VpdmUoe1xuICAgICAgICAgICAgY29tbWFuZDogXCJuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlclwiLFxuICAgICAgICAgICAgYXJndW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgcGF0aDogc3dQYXRoLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IG9wdHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImRvbmU/XCIsIHJlc3BvbnNlKTtcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBmZXRjaChcImh0dHA6Ly9sb2NhbGhvc3Q6XCIgKyBIQU5ETEVSX1BPUlQgKyBcIi9zdy9yZWdpc3RlclwiLCB7XG4gICAgICAgIC8vICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAvLyAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAvLyAgICAgICAgIHVybDogcGF0aFRvU1csXG4gICAgICAgIC8vICAgICAgICAgc2NvcGU6IG9wdHMuc2NvcGVcbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vIH0pXG4gICAgICAgIC8vIC50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG4gICAgICAgIC8vIC50aGVuKGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgICAgLy8gICAgICAgY29uc29sZS5sb2coXCJkb25lP1wiLCBqc29uKTtcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLy8gLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLCBlcnIuc3RhY2spXG4gICAgICAgIC8vIH0pXG4gICAgICAgIFxuICAgIH1cbn0iXSwibmFtZXMiOlsiY29uc3QiLCJsZXQiXSwibWFwcGluZ3MiOiJjQUFxQixHQUFHO0lBQ3BCLElBQUksT0FBTyxHQUFHLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRTtRQUNuQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ2pEO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN6RDs7OztBQU1EQSxJQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFekIsd0JBQStCLEdBQUc7SUFFOUJDLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztJQUV0QixPQUFPLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUNqQyxhQUFhLEVBQUUsQ0FBQztLQUNuQjtJQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixhQUFhLENBQUMsYUFBYSxDQUFDLEdBQUcsVUFBQyxHQUFHLEVBQUUsSUFBSTtZQUNyQyxhQUFhLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLElBQUksR0FBRyxFQUFFO2dCQUNMLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3RCO2lCQUFNO2dCQUNILE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3hCO1NBQ0osQ0FBQztRQUNG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