function start() {
    chrome.webRequest.onHeadersReceived.addListener(details => {
        details.responseHeaders = details.responseHeaders || [];
        details.responseHeaders.push({
            name: 'Access-Control-Allow-Origin',
            value: 'https://zaif.jp'
        });
        details.responseHeaders.push({
            name: 'Access-Control-Allow-Headers',
            value: 'Key, Sign, Content-Type'
        })
        return {
            responseHeaders: details.responseHeaders
        };
    }, { urls: ['*://api.zaif.jp/*'] }, ['blocking', "responseHeaders"]);
}

chrome.runtime.onInstalled.addListener(() => start());
chrome.runtime.onStartup.addListener(() => start());