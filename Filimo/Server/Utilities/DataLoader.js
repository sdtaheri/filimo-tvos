/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

class DataLoader {

    constructor(documentLoader) {
        this._documentLoader = documentLoader;
    }

    /*
     * Method to resolved data for data bound elements.
     */
    prepareDocument(document, doneCallback) {
        let waitQueue = [];
        let dataElemsQuery = ".//*[@dataURL]";
        const ORDERED_NODE_SNAPSHOT_TYPE = 7;
        let dataElemsResult = document.evaluate(dataElemsQuery, document, null, ORDERED_NODE_SNAPSHOT_TYPE);
        // Walk through all of the elements that have a 'dataURL' attribute defined
        for (let i = 0, elem, dataPromise; i < dataElemsResult.snapshotLength; i++) {
            elem = dataElemsResult.snapshotItem(i);
            let dataURL = this._documentLoader.prepareURL(elem.getAttribute('dataURL'));
            dataPromise = this._fetchJSONData(dataURL, (dataObj) => {
                elem.dataItem = new DataItem();
                elem.dataItem.items = this._dataItemFromJSONItems(dataObj.items);
            });
            waitQueue.push(dataPromise);
        }
        // Wait for all of the fetch promises to resolve
        if (waitQueue.length) {
            Promise.all(waitQueue).then(() => doneCallback());
        } else {
            doneCallback();
        }
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

    _dataItemFromJSONItems(items) {
        return items.map((item) => {
            let dataItem = new DataItem(item.type, item.ID);
            Object.keys(item).forEach((key) => {
                dataItem.setPropertyPath(key, item[key])
            });

            //Here we define custom getter which always resolves the 'url' attribute. 
            //In your implementation this might not be applicable and require additional logic.
            Object.defineProperty(dataItem, "resolved_url", {
                get: () => {
                    return this._documentLoader.prepareURL(dataItem.url);
                }
            });
            return dataItem;
        });
    }
}
