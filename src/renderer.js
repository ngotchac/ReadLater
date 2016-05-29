
export default class Renderer {

    /**
     * Default constructor with the Chrome Storage Object
     */
    constructor(storage, handlers) {
        this.storage = storage;
        this.removeLinkHandler = handlers.removeLink;
        this.openLinkHandler = handlers.openLink;
    }

    /**
     * Render the links in the Pop-Up window
     */
    redraw() {
        // Get all the links
        this.storage.fetchLinks(links => {
            // Update the Badge count
            this.updateBadge(links.length);

            // Remove all existing links
            document.getElementById('links').innerHTML = '';

            // Render each link
            links.forEach(link => this.renderLink(link));

            this.message('Finished!');
        });
    }

    /**
     * Display the message given in messageStr in the message div.
     */
    message(messageStr) {
        var msg = document.getElementById('message');

        // Replace by new message
        msg.innerText = messageStr;

        // Restore old message after 1sec
        setTimeout(() => {
            msg.innerText = 'Total links: ' + this.storage.countLinks();
        }, 1000);
    }

    /**
     * Render the given link, with the stored title and favicon
     *
     * @param  {Object} link - The link Object from the Chrome Storage
     */
    renderLink(link) {
        var li = this.getLinkElement(link);
        document.getElementById('links').appendChild(li);
    }

    /**
     * Create the HTML to be stored sinside each list item for every link
     */
    getLinkElement(link) {
        var title = link.title;

        // If the link is too long, trim it
        if (title.length > 40) {
            title = title.substr(0, 37) + '...';
        }

        // The remove Element (trash icon)
        var removeE = document.createElement('img');
        removeE.setAttribute('id', 'removeBtn');
        removeE.setAttribute('name', link.url);
        removeE.setAttribute('src', './images/trash.svg');
        removeE.addEventListener('click', this.removeLinkHandler.bind(removeE), false);

        // The link Element (anchor)
        var linkE = document.createElement('a');
        linkE.setAttribute('id', 'link');
        linkE.setAttribute('url', link.url);
        linkE.setAttribute('scroll', link.scrollTop);
        linkE.addEventListener('click', this.openLinkHandler.bind(linkE), false);
        linkE.innerHTML = title;

        // The icon Element
        var iconE = this.getIconElement(link.url);

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
    getIconElement(url){
        var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
        var imgUrl = 'http://www.google.com/s2/favicons?domain=' + domain;

        var img = document.createElement('img');
        img.setAttribute('class', 'favicon');
        img.setAttribute('src', imgUrl);

        return img;
    }

    updateBadge() {
        // Get the number of links from the storage
        let count = this.storage.countLinks();
        chrome.browserAction.setBadgeText({ text: this.badgeText(count) });
    }

    /**
     * Return the text for the Extension Badge.
     * If more than 99 links, display '99+'
     *
     * @param  {Number} c - The number of links
     * @return {String}
     */
    badgeText(c) {
        return (c > 99) ? '99+' : c.toString();
    }

};
