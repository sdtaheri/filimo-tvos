/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

const legacyBaseURL = 'https://www.filimo.com/etc/api';

class DataLoader {

    constructor(documentLoader, dataParser) {
        this._documentLoader = documentLoader;
        this._dataParser = dataParser;

        this._searchRequest = null;
        this._searchTextCache = null;
    }

    _fetchJSONData(dataURL, itemCallback, errorCallback, httpRequest) {
        return new Promise((resolve, reject) => {
            let xhr = httpRequest || new XMLHttpRequest();

            let url = dataURL;
            if (dataURL.substr(-1) !== "/") {
                url += "/";
            }
            if (isLoggedIn()) {
                url += "luser/" + localStorage.getItem("username");
                url += "/ltoken/" + localStorage.getItem("token") + "/";
            }

            if (dataURL.includes(legacyBaseURL)) {
                url += "devicetype/site/";
            } else {
                url += "devicetype/appletv/";
            }

            xhr.open("GET", url);
            xhr.responseType = "json";
            xhr.setRequestHeader("JsonType", "simple");
            xhr.onload = () => {
                itemCallback(xhr.response);
                resolve();
            };
            xhr.onerror = () => {
                reject(xhr);
                if (errorCallback !== undefined) {
                    errorCallback();
                }
            };
            xhr.send();
        });
    }

    fetchVitrine(itemsCallback) {
        let url = baseURL + '/movie/movie/list/tagid/1';
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchVitrineNextPage(url, itemsCallback) {
        if (url == null) {
            return;
        }
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchCategoriesList(itemsCallback) {
        let url = baseURL + '/category/category/list';
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseCategoriesResponse(response, itemsCallback);
        });
    }

    fetchSearchResults(query, itemsCallback, errorCallback) {
        let searchText = query.trim().replace(/\s+/g, ' ');

        if (this._searchTextCache && searchText === this._searchTextCache) {
            return;
        }

        this._searchTextCache = searchText;

        if (this._searchRequest && this._searchRequest.readyState !== XMLHttpRequest.DONE) {
            this._searchRequest.abort();
        }

        let url = baseURL + `/movie/movie/list/tagid/1000300/text/${encodeURIComponent(searchText)}/sug/on`;

        this._searchRequest = new XMLHttpRequest();
        this._fetchJSONData(url, (response) => {
            this._dataParser.parseSearchResponse(response, itemsCallback);
            this._searchRequest = null;
            this._searchTextCache = null;
        }, errorCallback, this._searchRequest);
    }
}
