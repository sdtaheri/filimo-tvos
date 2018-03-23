/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

class DataLoader {

    constructor(documentLoader) {
        this._documentLoader = documentLoader;
    }

    _fetchJSONData(dataURL, itemCallback) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", dataURL);
            xhr.responseType = "json";
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
}
