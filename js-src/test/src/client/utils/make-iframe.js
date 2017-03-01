
class IframeWrapper {

    constructor(url) {
        this.url = url;
    }

    cleanAllRegistrations() {
        return this.iframe.contentWindow.navigator.serviceWorker.getRegistrations()
        .then((allRegistrations) => {
            return Promise.all(allRegistrations.map((r) => r.unregister()))
        })
    }

    load() {
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.url;

        return new Promise((fulfill, reject) => {
            this.iframe.onload = () => {
                this.cleanAllRegistrations()
                .then(() => {
                    fulfill(this.iframe);
                })
            }

            document.body.appendChild(this.iframe);
        });
    }

    cleanup() {
        console.log(`Cleaning up existing registrations for ${this.url}...`);
        return this.cleanAllRegistrations()
        .then(() => {

            // Tests never end on Safari if we don't put this in a setTimeout
            // no idea why

            setTimeout(() => {
                document.body.removeChild(this.iframe);
            }, 0)
        })
    }

}

IframeWrapper.withIframe = function(url, func, {timeout} = {}) {

    let wrapper = new IframeWrapper(url);
    return wrapper.load()
    .then(() => {

        return new Promise((fulfill, reject) => {
      
            let completed = false;

            Promise.resolve(func(wrapper.iframe))
            .then(() => {
                fulfill();
            })
            .catch((err) => {
                reject(err);
            })
            .then(() => {
                completed = true;
            })

            if (timeout) {
                setTimeout(() => {
                    if (completed == false) {
                        reject(new Error("Test timed out"))
                    }
                }, timeout);
            }
           
        })
    })
    .then(() => {
        return wrapper.cleanup();
    })
    .catch((err) => {
        return wrapper.cleanup()
        .then(() => {
            throw err;
        })
    })

}

module.exports = IframeWrapper;