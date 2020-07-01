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
    }

    _fetchJSONData(dataURL, itemCallback) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();

            let url = dataURL
            if (dataURL.substr(-1) !== "/") {
                url += "/"
            }
            if (isLoggedIn()) {
                url += "luser/" + localStorage.getItem("username")
                url += "/ltoken/" + localStorage.getItem("token") + "/"
            }

            if (dataURL.includes(legacyBaseURL)) {
                url += "devicetype/site/"
            } else {
                url += "devicetype/appletv/"
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
            };
            xhr.send();
        });
    }

    fetchVitrine(itemCallback) {
        let url = baseURL + '/movie/movie/list/tagid/1';
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseVitrineResponse(response, itemCallback);
        });
    }

    fetchVitrineNextPage(url, itemCallback) {
        if (url == null) {
            return;
        }
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseVitrineResponse(response, itemCallback);
        });
    }

    fetchCategoriesList(itemCallback) {
        let url = baseURL + '/category/category/list';
        this._fetchJSONData(this._documentLoader.prepareURL(url), (response) => {
            this._dataParser.parseCategoriesResponse(response, itemCallback);
        });
    }
}
