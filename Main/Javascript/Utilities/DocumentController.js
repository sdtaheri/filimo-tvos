/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class provides basic functionality for document controllers; subclassable.
*/

class DocumentController {

    constructor({ documentLoader, documentURL, loadingDocument }) {
        this.handleEvent = this.handleEvent.bind(this);
        this.documentLoader = documentLoader;
        this.dataLoader = new DataLoader(documentLoader, new DataParser());
        this.fetchDocument(documentURL, loadingDocument);
    }

    fetchDocument(documentURL, loadingDocument) {
        this.documentLoader.fetch({
            url: documentURL,
            success: (document) => {
               // Add the event listener for document
               this.setupDocument(document);
               // Allow subclass to do custom handling for this document
               this.handleDocument(document, loadingDocument);
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
        document.addEventListener("unload", this.handleEvent);
        document.addEventListener("load", this.handleEvent);
    }

    handleDocument(document, loadingDocument) {
        if (loadingDocument) {
            navigationDocument.replaceDocument(document, loadingDocument);
        } else {
            navigationDocument.pushDocument(document);
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case "select":
            case "play":
                const targetElem = event.target;
                let controllerOptions = resolveControllerFromElement(targetElem);
                if (controllerOptions) {
                    const controllerClass = controllerOptions.type;
                    controllerOptions.event = event;
                    controllerOptions.documentLoader = this.documentLoader;
                    // Create the subsequent controller based on the attribute and its value. Controller would handle its presentation.
                    new controllerClass(controllerOptions);
                }
                break;
            default:
                break;
        }
    }
}
registerAttributeName("documentURL", DocumentController);
