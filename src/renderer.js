
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
        let iconHTML = this.getIconHTML(link);

        var html = `
            <img id="removeBtn" name="${link.url}" src="images/trash.svg" />
            ${iconHTML}
            <a id="link" class="title" url="${link.url}" scroll="${link.scrollTop}">
                ${link.title}
            </a>
        `;

        var liE = document.createElement('li');
        liE.innerHTML = html;

        liE.querySelector('#link').addEventListener('click', this.openLinkHandler, false);
        liE.querySelector('#removeBtn').addEventListener('click', this.removeLinkHandler, false);

        return liE;
    }

    /**
     * Create an Image DOMElement with it's source set to
     * the favicon of the given URL Website
     *
     * @param  {String} url - The URL of the Website to get the Favicon from
     * @return {DOMElement}
     */
    getIconHTML(link){
        var imgUrl = link.favicon ? link.favicon : 'images/favicon.png';
        return `<img class="favicon" src="${imgUrl}" />`;
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
