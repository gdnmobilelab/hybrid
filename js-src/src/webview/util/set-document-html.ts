
(window as any).__setHTML = function(htmlString:string, baseURL:string) {
    let insideHTMLTag = /<html(?:.*?)>((?:.|\n)*)<\/html>/gim.exec(htmlString)[1].replace("</body>","TEXT</body>");
    // insideHTMLTag = insideHTMLTag.replace("<head>",`<head><base href='${baseURL}'/>`)
    history.replaceState(null,null,baseURL)
    document.documentElement.innerHTML = insideHTMLTag;
}