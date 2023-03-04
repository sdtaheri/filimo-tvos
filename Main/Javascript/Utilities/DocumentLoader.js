/*
Abstract:
This class handles loading templates from a remote server.
*/

class DocumentLoader {

    constructor(baseURL) {
        // Bind callback methods to current context
        this.prepareURL = this.prepareURL.bind(this);
        this.prepareElement = this.prepareElement.bind(this);
        // Validate arguments
        if (typeof baseURL !== "string") {
            throw new TypeError("DocumentLoader: baseURL argument must be a string.");
        }
        this.jsBaseURL = baseURL;
    }

    /*
     * Helper method to request templates from the server
     */
    fetch(options) {
        if (typeof options.url !== "string") {
            throw new TypeError("DocumentLoader.fetch: url option must be a string.");
        }
        // Cancel the previous request if it is still in-flight.
        if (options.concurrent !== true) {
            this.cancelFetch();
        }
        // Parse the request URL
        const docURL = this.prepareURL(options.url);
        const xhr = new XMLHttpRequest();
        xhr.open("GET", docURL);
        xhr.responseType = "document";
        xhr.setRequestHeader("cache-control", "no-cache");
        xhr.onload = () => {
            const responseDoc = xhr.response;
            this.prepareDocument(responseDoc);
            if (typeof options.success === "function") {
                options.success(responseDoc);
            } else {
                navigationDocument.pushDocument(responseDoc);
            }
        };
        xhr.onerror = () => {
            if (typeof options.error === "function") {
                options.error(xhr);
            } else {
                const alertDocument = createLoadErrorAlertDocument(docURL, xhr, true);
                navigationDocument.presentModal(alertDocument);
            }
        };
        xhr.send();
        // Preserve the request so it can be cancelled by the next fetch
        if (options.concurrent !== true) {
            this._fetchXHR = xhr;
        }
    }

    /*
     * Helper method to cancel a running XMLHttpRequest
     */
    cancelFetch() {
        const xhr = this._fetchXHR;
        if (xhr && xhr.readyState !== XMLHttpRequest.DONE) {
            xhr.abort();
        }
        delete this._fetchXHR;
    }

    /*
     * Helper method to convert a relative URL into an absolute URL
     */
    prepareURL(url) {
        // Handle URLs relative to the "server root" (baseURL)
        let index = url.indexOf("/");
        if (index !== undefined && index === 0) {
            url = this.jsBaseURL + url.substr(1);
        }
        return url;
    }

    /*
     * Helper method to mangle relative URLs in XMLHttpRequest response documents
     */
    prepareDocument(document) {
        let imgElemsQuery = ".//*[@src | @srcset]";
        const ORDERED_NODE_SNAPSHOT_TYPE = 7;
        let imgElemsResult = document.evaluate(imgElemsQuery, document, null, ORDERED_NODE_SNAPSHOT_TYPE);
        for (let i = 0, elem; i < imgElemsResult.snapshotLength; ++i) {
            elem = imgElemsResult.snapshotItem(i);
            this.prepareElement(elem)
        }
    }

    /*
     * Helper method to mangle relative URLs in DOM elements
     */
    prepareElement(elem) {
        if (elem.hasAttribute("src")) {
            const rawSrc = elem.getAttribute("src");
            const parsedSrc = this.prepareURL(rawSrc);
            elem.setAttribute("src", parsedSrc);
        }
        if (elem.hasAttribute("srcset")) {
            const rawSrcSet = elem.getAttribute("srcset");
            const parsedSrcSet = rawSrcSet.split(/\s*,\s*/).map((source) => {
                source = source.trim();
                const [rawURL] = source.split(/\s+/, 1);
                const parsedURL = this.prepareURL(rawURL);
                const descriptor = source.substr(rawURL.length);
                if (descriptor.length) {
                    return parsedURL + " " + descriptor;
                } else {
                    return parsedURL;
                }
            }).join(", ");
            elem.setAttribute("srcset", parsedSrcSet);
        }
    }

}
