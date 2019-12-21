/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

var filimoAPIBaseURL = 'https://www.filimo.com/etc/api'

class DataLoader {

    constructor(documentLoader) {
        this._documentLoader = documentLoader;
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

            url += "devicetype/ios/"

            xhr.open("GET", url);
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
