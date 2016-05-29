export default class ChromeStorage {

    constructor() {
        this.links = [];
    }

    /**
     * Return the number of links on client cache (might differ...)
     *
     * @return {Number}
     */
    countLinks() {
        return this.links.length;
    }

    /**
     * Fetch the link from the Chrome Synced storage
     *
     * @param  {Function} callback - Callback called when links have been
     *                               fetched, with the links as argument.
     */
    fetchLinks(callback) {
        // Gets the links from the storage
        chrome.storage.sync.get(items => {
            var links = Object.keys(items)
                    // Filter to keep only links (thus with a url key)
                    .filter(k => items[k] && items[k].url)
                    // Add the key to the link
                    .map(k => {
                        items[k].key = k;
                        return items[k];
                    })
                    // Sort by timestamp
                .sort((a, b) => b.timestamp - a.timestamp);

            this.links = links;
            callback(links);
        });
    }

    /**
     * Add a new link to the Chrome Synced storage, and
     * update the local version of the links.
     * @param {[type]}   link     [description]
     * @param {Function} callback [description]
     */
    addLink(link, callback) {
        var item = {};
        item[link.url] = link;

        chrome.storage.sync.set(item, () => {
            this.links.push(link);
            callback();
        });
    }

    /**
     * Remove the link with the given key from the Chrome Synced storage.
     * Removes the link in the local copy too.
     *
     * @param  {String}   key      - The key of the link in the Chrome Synced storage
     * @param  {Function} callback - Callback called (empty) when link is removed
     */
    removeLink(key, callback) {
        chrome.storage.sync.remove(key, () => {
            // Update the local links
            this.links = this.links.filter(link => link.key !== key);
            callback();
        });
    }

    /**
     * Removes all the links in the Chrome Synced Storage
     *
     * @param  {Function} callback
     */
    clearLinks(callback) {
        chrome.storage.sync.clear(() => callback());
    }

};
