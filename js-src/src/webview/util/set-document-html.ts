import {refreshServiceWorkers} from '../navigator/sw-manager';

let loadedIndicator:HTMLDivElement = null;

(window as any).__setHTML = function(htmlString:string, baseURL:string) {
    console.log("new base URL is", baseURL)
    let insideHTMLTag = /<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(htmlString)[1];
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

    // Need to "reactivate" script tags or they won't work.
    var s = document.documentElement.getElementsByTagName('script');
    for (var i = 0; i < s.length ; i++) {
        var node=s[i], parent=node.parentElement, d = document.createElement('script');
        d.async=node.async;
        d.src=node.src;
        d.textContent = node.textContent
        d.type = node.type;
        parent.insertBefore(d,node);
        parent.removeChild(node);
    }
}