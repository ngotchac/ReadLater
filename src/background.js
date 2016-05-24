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
    var code = 'window.onload = function() { document.body.scrollTop = ' + scroll + '; };';

    // Create the new tab
    chrome.tabs.create({ url: url }, tab => {
        // Execute script to scroll to the saved position
        chrome.tabs.executeScript(tab.id, { code: code });
    });
}
