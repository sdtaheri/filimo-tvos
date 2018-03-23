/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class provides basic functionality for document controllers; subclassable.
*/

class DocumentController {

    constructor({ documentLoader, documentURL, loadingDocument }) {
        this.handleEvent = this.handleEvent.bind(this);
        this._documentLoader = documentLoader;
        this._dataLoader = new DataLoader(documentLoader);
        this.fetchDocument(documentURL, loadingDocument);
    }

    fetchDocument(documentURL, loadingDocument) {
        this._documentLoader.fetch({
            url: documentURL,
            success: (document) => {
                // Resolve data first.
                this._dataLoader.prepareDocument(document, () => {
                    // Add the event listener for document
                    this.setupDocument(document);
                    // Allow subclass to do custom handling for this document
                    this.handleDocument(document, loadingDocument);
                });
            },
            error: (xhr) => {
                const alertDocument = createLoadErrorAlertDocument(documentURL, xhr, false);
                this.handleDocument(alertDocument, loadingDocument);
            }
        });
    }

    setupDocument(document) {
        document.addEventListener("select", this.handleEvent);
        document.addEventListener("play", this.handleEvent);
    }

    handleDocument(document, loadingDocument) {
        if (loadingDocument) {
            navigationDocument.replaceDocument(document, loadingDocument);
        } else {
            navigationDocument.pushDocument(document);
        }
    }

    handleEvent(event) {
        const targetElem = event.target;
        let controllerOptions = resolveControllerFromElement(targetElem);
        if (controllerOptions) {
            const controllerClass = controllerOptions.type;
            if (!controllerClass.preventLoadingDocument) {
                let loadingDocument = createLoadingDocument();
                navigationDocument.pushDocument(loadingDocument);
                controllerOptions.loadingDocument = loadingDocument;
            }
            controllerOptions.event = event;
            controllerOptions.documentLoader = this._documentLoader;
            // Create the subsequent controller based on the atribute and its value. Controller would handle its presentation.
            new controllerClass(controllerOptions);
        }
        else if (targetElem.tagName === "description") {
            // Handle description tag, if no URL was specified
            const body = targetElem.textContent;
            const alertDocument = createDescriptiveAlertDocument('', body);
            navigationDocument.presentModal(alertDocument);
        }
        return createLoadingDocument();
    }

    fetchNextPageAtURL(url, section) {
        //fetch the next page
        this._dataLoader._fetchJSONData(this._dataLoader._documentLoader.prepareURL(url), (dataObj) => {
            let newItems = this._dataLoader._dataItemFromJSONItems(dataObj.items)

            //append them to the list of current items 
            if (newItems == undefined || newItems.length == 0) { return }
            section.dataItem.items = section.dataItem.items.concat(newItems)
            section.dataItem.touchPropertyPath("items")
        });
    }
}
registerAttributeName("documentURL", DocumentController);