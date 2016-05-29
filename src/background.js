/**
 * Add a listener for incoming messages from the content script.
 * Right now, the only action taken is to open a new tab at the
 * given URL, and scroll to the given position.
 */
chrome.runtime.onMessage.addListener(request => {
    if (request.action === 'open') return openNewTab(request);
});

/**
 * Opens a new tab at the given URL and scroll position.
 *
 * @param  {Object} data - Object containing the `url` and `scroll` keys.
 */
function openNewTab(data) {
    var url = data.url,
        scroll = data.scroll;

    // Scroll To JS code
    var code = `
(function () {
    function goTo(n) {
        // Try max 5 times
        if (n === 6) return false;

        document.body.scrollTop = ${scroll};

        if (document.body.scrollTop != ${scroll}) {
            window.setTimeout(goTo.bind(this, n+1), n * 250);
        }
    }

    goTo(1);
})();
`;

    // Create the new tab
    chrome.tabs.create({ url: url }, tab => {
        // Execute script to scroll to the saved position
        chrome.tabs.executeScript(tab.id, { code: code });
    });
}
