//# sourceURL=application.js

//
//  application.js
//  Filimo
//
//  Created by Saeed Taheri on 2/26/18.
//  Copyright © 2018 Filimo. All rights reserved.
//

/*
 * This file provides an example skeletal stub for the server-side implementation 
 * of a TVML application.
 *
 * A javascript file such as this should be provided at the tvBootURL that is 
 * configured in the AppDelegate of the TVML application. Note that  the various 
 * javascript functions here are referenced by name in the AppDelegate. This skeletal 
 * implementation shows the basic entry points that you will want to handle 
 * application lifecycle events.
 */

const attributeToController = {};
const attributeKeys = [];

let appName;
let jsBaseURL;
let baseURL;

let menubarLoaded = false;
let pendingPlayURL = null;

/**
 * @description The onLaunch callback is invoked after the application JavaScript
 * has been parsed into a JavaScript context. The handler is passed an object
 * that contains options passed in for launch. These options are defined in the
 * swift or objective-c client code. Options can be used to communicate to
 * your JavaScript code that data and as well as state information, like if the
 * the app is being launched in the background.
 *
 * The location attribute is automatically added to the object and represents
 * the URL that was used to retrieve the application JavaScript.
 */
App.onLaunch = function (options) {
    if (options['jsBaseURL'] === undefined) {
        // For backward compatibility
        jsBaseURL = options['baseURL'];
        baseURL = 'https://www.filimo.com/api/fa/v1';
        appName = 'فیلیمو';
    } else {
        jsBaseURL = options['jsBaseURL'];
        baseURL = options['baseURL'];
        appName = options['appName'];
    }

    // Specify all the URLs for helper JavaScript files
    const helperScriptURLs = [
        "Resources/Strings",
        "Utilities/Jalali",
        "Utilities/UserManager",
        "Utilities/DocumentLoader",
        "Utilities/DocumentController",
        "Utilities/DataLoader",
        "Utilities/DataParser",
        "MenuBarController",
        "HomeDocumentController",
        "VitrineDocumentController",
        "LoginController",
        "SearchDocumentController",
        "ProductDocumentController",
        "SeasonsDocumentController",
        "ProfileDocumentController"
    ].map(
        moduleName => `${jsBaseURL}${moduleName}.js`
    );

    // Show a loading spinner while additional JavaScript files are being evaluated
    let loadingDocument = createLoadingDocument(appName);
    navigationDocument.pushDocument(loadingDocument);

    evaluateScripts(helperScriptURLs, function (scriptsAreLoaded) {
        if (scriptsAreLoaded) {
            navigationDocument.removeDocument(loadingDocument);

            let documentLoader = new DocumentLoader(jsBaseURL)
            let documentURL = documentLoader.prepareURL("/XMLs/Index.xml")
            new MenuBarController({documentLoader, documentURL})
            menubarLoaded = true
            playMovieFromURL(pendingPlayURL)

        } else {
            const alertDocument = createEvalErrorAlertDocument();
            navigationDocument.replaceDocument(alertDocument, loadingDocument);
            throw new EvalError("Application.js: unable to evaluate scripts.");
        }
    });
}

App.onOpenURL = function (url) {
    pendingPlayURL = url
    if (menubarLoaded) {
        playMovieFromURL(pendingPlayURL)
    }
}

App.onWillResignActive = function () {

}

App.onDidEnterBackground = function () {

}

App.onWillEnterForeground = function () {

}

App.onDidBecomeActive = function () {

}

App.onWillTerminate = function () {

}

function playMovieFromURL(url) {
    if (url == null || url === "") {
        return
    }
    const [protocol, path] = url.split("://");
    const [movieUID, type] = path.split("/")

    let documentLoader = new DocumentLoader(jsBaseURL)
    let documentURL = documentLoader.prepareURL("/XMLs/Product.xml")
    let shouldPlayMovie = type === 'play'
    new ProductDocumentController({documentLoader, documentURL, movieUID, shouldPlayMovie})
    pendingPlayURL = null
}

function loadingTemplateString(title) {
    title = title || string_loading;

    return `<loadingTemplate>
            <activityIndicator>
                <title>${title}</title>
            </activityIndicator>
        </loadingTemplate>
    `;
}

/**
 * Convenience function to create a TVML loading document with a specified title.
 */
function createLoadingDocument(title) {
    title = title || "در حال دریافت اطلاعات…";

    const template = `<?xml version="1.0" encoding="UTF-8" ?>
        <document>
            <loadingTemplate>
                <activityIndicator>
                    <title>${title}</title>
                </activityIndicator>
            </loadingTemplate>
        </document>
    `;
    return new DOMParser().parseFromString(template, "application/xml");
}

/**
 * Convenience function to create a TVML alert document with a title and description.
 */
function createAlertDocument(title, description, withImage) {
    let logoIdentifier = isFilimo() ? "filimo" : "televika";
    let logoResource = jsBaseURL + `Resources/logo_${logoIdentifier}.png (theme:light), ` + jsBaseURL + `Resources/logo_${logoIdentifier}_dark.png (theme:dark)`;

    const template = `<?xml version="1.0" encoding="UTF-8" ?>
        <document>
            <alertTemplate>
                ${(withImage || false) ? `<img srcset="${logoResource}" width="295" height="90" style="margin: 48;" />` : ''}
                <title style="tv-text-style: title2; margin: 20;">${title}</title>
                <description />
            </alertTemplate>
        </document>
    `;
    let doc = (new DOMParser()).parseFromString(template, "application/xml");
    doc.getElementsByTagName("description").item(0).textContent = description;

    return doc
}

/**
 * Convenience function to create a TVML alert for asking user with two options as answers.
 */
function presentAlertQuestion(title, description, defaultTitle, cancelTitle, defaultHandler) {
    let alertString = `<?xml version="1.0" encoding="UTF-8" ?>
        <document>
          <alertTemplate>
            <title>${title}</title>
            <description>${description}</description>
            <button id="alertDefaultButton">
                <text>${defaultTitle}</text>
            </button>
            <button id="alertCancelButton">
                <text>${cancelTitle}</text>
            </button>
          </alertTemplate>
        </document>`;

    let parser = new DOMParser();

    let alertDoc = parser.parseFromString(alertString, "application/xml");

    alertDoc.getElementById("alertDefaultButton").addEventListener("select", function (element, event) {
        defaultHandler();
        navigationDocument.dismissModal();
    });

    alertDoc.getElementById("alertCancelButton").addEventListener("select", function (element, event) {
        navigationDocument.dismissModal();
    });

    navigationDocument.presentModal(alertDoc);
}

/**
 * Convenience function to create a TVML alert for failed evaluateScripts.
 */
function createEvalErrorAlertDocument() {
    const title = "Evaluate Scripts Error";
    const description = [
        "There was an error attempting to evaluate the external JavaScript files.",
        "Please check your network connection and try again later."
    ].join("\n\n");
    return createAlertDocument(title, description);
}

/**
 * Convenience function to create a TVML alert for a failed XMLHttpRequest.
 */
function createLoadErrorAlertDocument(url, xhr) {
    const title = (xhr.status) ? `Fetch Error ${xhr.status}` : "Fetch Error";
    const description = `Could not load document:\n${url}\n(${xhr.statusText})`;
    return createAlertDocument(title, description);
}

function registerAttributeName(type, func) {
    attributeToController[type] = func;
    attributeKeys.push(type);
}

function resolveControllerFromElement(elem) {
    for (let key of attributeKeys) {
        if (elem.hasAttribute(key)) {
            return {
                type: attributeToController[key],
                documentURL: elem.getAttribute(key)
            };
        }
    }
}

function isFilimo() {
    return baseURL.includes("filimo.com");
}
