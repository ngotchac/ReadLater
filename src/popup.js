/**
 * ReadLater 1.0, a Google Chrome extension which enables a user to save the links for later reading.
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

// Create variables for the DOM elements.
var addBtn = document.getElementById("addBtn"),
    clearBtn = document.getElementById("clearBtn"),
    msg = document.getElementById("message"),
    links = document.getElementById("links");

// Count variable
var count = 0;

/**
 * Create the HTML to be stored inside each list item for every link
 */
function createLinkHTML(link){
    var linkBtn = document.createElement('img');
    linkBtn.setAttribute('id', 'removeBtn');
    linkBtn.setAttribute('name', link.url);
    linkBtn.setAttribute('src', './trash.svg');

    var returnHTML = linkBtn.outerHTML;
    returnHTML += getIcon(link.url);
    returnHTML += '<a id="link" href="#" url="'+link.url+'" scroll="'+link.scrollTop+'">' + link.title + '</a>';

    return returnHTML;
}

/**
 * Create an Image DOMElement with it's source set to
 * the favicon of the given URL Website
 *
 * @param  {String} url - The URL of the Website to get the Favicon from
 * @return {DOMElement}
 */
function getIcon(url){
    var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    var imgUrl = 'http://www.google.com/s2/favicons?domain=' + domain;

    var img = document.createElement('img');
    img.setAttribute('class', 'favicon');
    img.setAttribute('src', imgUrl);

    return img.outerHTML;
}


/**
 * Get the child number in its parentNode
 */
function getChildNumber(node) {
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
}


/**
Event Function to be called when the user clicks on the remove icon
*/
function removeLink(e) {
    // Get the caller of the click event
    var linkId = e.target;

    //Get the key for the corresponding link
    var linkDOMId = linkId.getAttribute("name");

    //Get the <ul> list dom element for the current list item
    var parentNode = linkId.parentNode.parentNode;

    if(parentNode){
        // Get the id of the <li> item in the given parentNode
        var i = getChildNumber(linkId.parentNode);

        // Remove the link from the sync storage
        var key = linkDOMId;

        chrome.storage.sync.remove(key, () => {
            message('Removed Link');
            updateBadge();
        });

        // Remove the list item dom element from the UI
        parentNode.removeChild(linkId.parentNode);
    }
}

function badgeText(c) {
    return (c > 99) ? '99+' : c.toString();
}

function getLinks(callback) {
    // Gets the links from the storage
    chrome.storage.sync.get(items => {
        var storedLinks = Object
                .keys(items)
                // Filter to keep only links Object
                .filter(k => items[k] instanceof Object)
                // Add the key to the link
                .map(k => {
                    items[k].key = k;
                    return items[k];
                })
                // Sort by timestamp
                .sort((a, b) => b.timestamp - a.timestamp);

        callback(storedLinks);
    });
}

function updateBadge() {
    getLinks(l => {
        count = l.length;
        chrome.browserAction.setBadgeText({ text: badgeText(count) });
    });
}

/**
Store everything as individual items in sync storage.
MAX LENGTH = 512
MAX SPACE IN BYTES = 102, 400
*/

/**
Populate the extension with the list of currently stored links.
Initialize the link counter.
*/
message("Loading");
updateBadge();
getLinks(storedLinks => {
    storedLinks.forEach(link => addLiLink(link));
    message('Finished!');
});

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
Click Event Listener for the Add button.
1. Gets the title and url of the currently selected tab.
2. Add the object containing the id, title for the key equal to the url of the tab.
3. Increment link counter and update in sync storage
4. Updated the current list to show the newly added link item.
*/
addBtn.addEventListener('click', () => {
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

            if (newLink.title.length > 50) {
                newLink.title = newLink.title.substr(0, 50) + '...';
            }

            chrome.storage.sync.get(tab.url, items => {
                /**
                * Add the link only if it is not present in the sync storage
                * If the storage already contains the item, display message "Already Exists"
                */
                if (Object.keys(items).length > 0) return message('Link Exists');

                // Update the sync storage with the list of links containing the newly added link
                var item = {};
                item[tab.url] = newLink;

                chrome.storage.sync.set(item, function() {
                    message('Saved!');
                    addLiLink(newLink);
                    updateBadge();
                });
            });
        });
    });
});

function addLiLink(link) {
    var li = document.createElement('li');
    li.innerHTML = createLinkHTML(link);

    // Attach event listeners to the newly created link for the remove button click
    li.querySelector('#removeBtn').addEventListener('click', removeLink, false);
    li.querySelector('#link').addEventListener('click', openLink, false);
    links.appendChild(li);
}

function openLink(evt) {
    evt.preventDefault();

    var url = this.getAttribute('url'),
        scroll = parseInt(this.getAttribute('scroll'));

    chrome.runtime.sendMessage({ action: 'open', url: url, scroll: scroll });

    return false;
}


/**
 * Click Event Listener for the Clear button.
 *   1. Clears the local storage.
 *   2. Re-initialize the link counter to 0.
 *   3. Clear the current list.
 */
clearBtn.addEventListener('click', () => {
    var confirmVal = confirm('Are you sure you want to delete all links?');

    if (confirmVal === true) {
        chrome.storage.sync.clear(() => {
            message('Cleared!');
            updateBadge();
        });

        links.innerHTML = '';
    }
});

/**
 * Display the message given in messageStr in the message div.
 */
function message(messageStr) {
    msg.innerText = messageStr;

    setTimeout(() => {
        msg.innerText = 'Total Links: ' + count;
    }, 1000);
}

// Log to show that the extension is loaded.
console.log('Extension ReadLater Loaded');

