import {refreshServiceWorkers} from '../navigator/sw-manager';

let loadedIndicator:HTMLDivElement = null;

(window as any).__setHTML = function(htmlString:string, baseURL:string) {
    let insideHTMLTag = /<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(htmlString)[1].replace("</body>","TEXT</body>");
    // insideHTMLTag = insideHTMLTag.replace("<head>",`<head><base href='${baseURL}'/>`)
    history.replaceState(null,null,baseURL);
    refreshServiceWorkers();
    document.documentElement.innerHTML = insideHTMLTag;

    // we use this on the native side to detect somewhat reliably when a page has loaded
    loadedIndicator = document.createElement("div");
    loadedIndicator.style.position = "absolute";
    loadedIndicator.style.right = "0px";
    loadedIndicator.style.top = "0px";
    loadedIndicator.style.width = "1px";
    loadedIndicator.style.height = "1px";
    loadedIndicator.style.backgroundColor = "rgb(0,255,255)";
    document.body.appendChild(loadedIndicator);
};

(window as any).__removeLoadedIndicator = function() {
    document.body.removeChild(loadedIndicator);
}