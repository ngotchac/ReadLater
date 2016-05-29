/**
 * ReadLater 3.0.1, a Google Chrome extension which enables a user to save the links for later reading.
 * These links are automatically synced across all the chrome browsers on which the user is logged in.
 *
 * The extension uses local storage of the user for storing links.
 *
 * Author: Shubhanshu Mishra
 * Source Code: https://github.com/napsternxg/ReadLater
 * Version: 4.0.1
 * Date Created: 28th September, 2012
 * Last Modified: 24th May, 2016
 */

import ChromeStorage from './storage';
import Renderer from './renderer';

var storage = new ChromeStorage();

var handlers = {
    openLink: openLinkHandler,
    removeLink: removeLinkHandler
};

var renderer = new Renderer(storage, handlers);

/**
 * Open the link (via the "url" attribute) in a new
 * window, and set the saved scrolled position.
 * This is done in the background script, so this Function
 * only send a message to it.
 */
function openLinkHandler(evt) {
    evt.preventDefault();

    var url = this.getAttribute('url'),
        scroll = parseInt(this.getAttribute('scroll'));

    chrome.runtime.sendMessage({ action: 'open', url: url, scroll: scroll });

    return false;
}

/**
 * Event Function to be called when the user clicks on the remove icon
 */
function removeLinkHandler(e) {
    // Get the key for the corresponding link
    var key = e.target.getAttribute('name');

    storage.removeLink(key, () => {
        renderer.message('Removed Link');
        render();
    });
}

function getScrollTop(tabId, callback) {
    chrome.tabs.getSelected(null, tab => {
        // Retrieve the scroll position in order to
        // then store it
        chrome.tabs.executeScript(tab.id, {
            code: 'document.body.scrollTop'
        }, result => {
            var scrollTop = result[0];
            callback(scrollTop);
        });
    });
}

/**
 * Click Event Listener for the Add button.
 * 1. Gets the title and url of the currently selected tab.
 * 2. Add the object containing the id, title for the key equal to the url of the tab.
 * 3. Increment link counter and update in sync storage
 * 4. Updated the current list to show the newly added link item.
 */
document.getElementById('addBtn').addEventListener('click', () => {
    //Access the currently selected tab of chrome browser.
    chrome.tabs.getSelected(null, tab => {
        // Retrieve the scroll position in order to then store it
        getScrollTop(tab.id, scrollTop => {
            //Create list items and append them to the current list.
            var newLink = {
                title: tab.title,
                url: tab.url,
                scrollTop: scrollTop,
                timestamp: new Date().getTime()
            };

            chrome.storage.sync.get(tab.url, items => {
                /**
                 * Add the link only if it is not present in the sync storage
                 * If the storage already contains the item, display message 'Already Exists'
                 */
                if (Object.keys(items).length > 0) return renderer.message('Link Exists');

                // Update the sync storage with the list of links containing the newly added link
                var item = {};
                item[tab.url] = newLink;

                chrome.storage.sync.set(item, () => {
                    renderer.message('Saved!');
                    render();
                });
            });
        });
    });
});

/**
 * Click Event Listener for the Clear button.
 *   1. Clears the local storage.
 *   2. Re-initialize the link counter to 0.
 *   3. Clear the current list.
 */
document.getElementById('clearBtn').addEventListener('click', () => {
    var confirmVal = confirm('Are you sure you want to delete all links?');

    if (confirmVal === true) {
        chrome.storage.sync.clear(() => {
            renderer.message('Cleared!');
            updateBadge();
        });

        document.getElementById('links').innerHTML = '';
    }
});

/**
 * Populate the extension with the list of currently stored links.
 * Initialize the link counter.
 */
renderer.message('Loading');
renderer.redraw();

// Log to show that the extension is loaded.
console.log('Extension ReadLater Loaded');
