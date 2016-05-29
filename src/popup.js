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

import './style.less';

var storage = new ChromeStorage();

/**
 * Event Function to be called when the user clicks on the remove icon
 */
function removeLinkHandler(e) {
    // Get the key for the corresponding link
    var key = e.target.getAttribute('name');

    storage.removeLink(key, () => {
        Renderer.message('Removed Link');
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
                if (Object.keys(items).length > 0) return Renderer.message('Link Exists');

                // Update the sync storage with the list of links containing the newly added link
                var item = {};
                item[tab.url] = newLink;

                chrome.storage.sync.set(item, () => {
                    Renderer.message('Saved!');
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
            Renderer.message('Cleared!');
            updateBadge();
        });

        document.getElementById('links').innerHTML = '';
    }
});

/**
 * Open the link (via the "url" attribute) in a new
 * window, and set the saved scrolled position.
 * This is done in the background script, so this Function
 * only send a message to it.
 */
function openLink(evt) {
    evt.preventDefault();

    var url = this.getAttribute('url'),
        scroll = parseInt(this.getAttribute('scroll'));

    chrome.runtime.sendMessage({ action: 'open', url: url, scroll: scroll });

    return false;
}


var Renderer = (() => {

    this.links = [];

    return {
        redraw: redraw,
        message: message
    };

    /**
     * Render the links in the Pop-Up window
     */
    function redraw() {
        // Get all the links
        storage.fetchLinks(links => {
            this.links = links;

            // Update the Badge count
            updateBadge(links.length);

            // Remove all existing links
            document.getElementById('links').innerHTML = '';

            // Render each link
            links.forEach(link => renderLink(link));

            Renderer.message('Finished!');
        });
    }

    /**
     * Display the message given in messageStr in the message div.
     */
    function message(messageStr) {
        var msg = document.getElementById('message');

        // Replace by new message
        msg.innerText = messageStr;

        // Restore old message after 1sec
        setTimeout(() => {
            msg.innerText = 'Total links: ' + this.links.length;
        }, 1000);
    }

    function renderLink(link) {
        var li = getLinkElement(link);

        // Attach event listeners to the newly created link for the remove button click
        li.querySelector('#removeBtn').addEventListener('click', removeLinkHandler, false);
        li.querySelector('#link').addEventListener('click', openLink, false);

        document.getElementById('links').appendChild(li);
    }

    /**
     * Create the HTML to be stored sinside each list item for every link
     */
    function getLinkElement(link) {
        var title = link.title;

        if (title.length > 40) {
            title = title.substr(0, 37) + '...';
        }

        var removeE = document.createElement('img');
        removeE.setAttribute('id', 'removeBtn');
        removeE.setAttribute('name', link.url);
        removeE.setAttribute('src', './trash.svg');

        var linkE = document.createElement('a');
        linkE.setAttribute('id', 'link');
        linkE.setAttribute('url', link.url);
        linkE.setAttribute('scroll', link.scrollTop);
        linkE.innerHTML = title;

        var iconE = getIconElement(link.url);

        var liE = document.createElement('li');
        liE.appendChild(removeE);
        liE.appendChild(iconE);
        liE.appendChild(linkE);

        return liE;
    }

    /**
     * Create an Image DOMElement with it's source set to
     * the favicon of the given URL Website
     *
     * @param  {String} url - The URL of the Website to get the Favicon from
     * @return {DOMElement}
     */
    function getIconElement(url){
        var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
        var imgUrl = 'http://www.google.com/s2/favicons?domain=' + domain;

        var img = document.createElement('img');
        img.setAttribute('class', 'favicon');
        img.setAttribute('src', imgUrl);

        return img;
    }

    function updateBadge(count) {
        if (count !== undefined) {
            chrome.browserAction.setBadgeText({ text: badgeText(count) });
            return false;
        }

        storage.fetchLinks(l => {
            count = l.length;
            chrome.browserAction.setBadgeText({ text: badgeText(count) });
        });
    }

    function badgeText(c) {
        return (c > 99) ? '99+' : c.toString();
    }

})();

/**
 * Populate the extension with the list of currently stored links.
 * Initialize the link counter.
 */
Renderer.message('Loading');
Renderer.redraw();

// Log to show that the extension is loaded.
console.log('Extension ReadLater Loaded');
