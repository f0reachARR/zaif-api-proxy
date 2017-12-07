function addScript(src) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    document.head.appendChild(script);
}

(() => {
    addScript('sha512.js');
    addScript('api-proxy.js');
})();