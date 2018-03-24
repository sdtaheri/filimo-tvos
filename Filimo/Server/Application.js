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

// Registry of attribute name used to define the URL to template (e.g. documentURL or GridDocumentURL)
// to controller type (e.g. DocumentController or GridDocumentController)
const attributeToController = {};
const attributeKeys = [];
var baseURL;

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
App.onLaunch = function(options) {
    baseURL = options.baseURL;

    // Specify all the URLs for helper JavaScript files
    const helperScriptURLs = [
        "Utilities/DocumentLoader",
        "Utilities/DocumentController",
        "Utilities/DataLoader",
        "MenuBarController",
        "HomeDocumentController",
        "CategoriesDocumentController",
        "Index"
    ].map(
        moduleName => `${baseURL}${moduleName}.js`
    );
    
    // Show a loading spinner while additional JavaScript files are being evaluated
    let loadingDocument = createLoadingDocument();
    if (typeof navigationDocument !== "undefined") {
        navigationDocument.pushDocument(loadingDocument);
    }

    evaluateScripts(helperScriptURLs, function(scriptsAreLoaded) {
        if (scriptsAreLoaded) {
            console.log("Scripts have been successfully evaluated.");
        } else {
            // Handle error cases in your code. You should present a readable and user friendly
            // error message to the user in an alert dialog.
            const alertDocument = createEvalErrorAlertDocument();
            navigationDocument.replaceDocument(alertDocument, loadingDocument);
            throw new EvalError("Application.js: unable to evaluate scripts.");
        }
    });
}


App.onWillResignActive = function() {

}

App.onDidEnterBackground = function() {

}

App.onWillEnterForeground = function() {
    
}

App.onDidBecomeActive = function() {
    
}

App.onWillTerminate = function() {
    
}

/**
 * Convenience function to create a TVML loading document with a specified title.
 */
function createLoadingDocument(title) {
    // If no title has been specified, fall back to "Loading...".
    title = title || "در حال دریافت اطلاعات …";

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
 * This convenience function returns an alert template, which can be used to present errors to the user.
 */
var createAlertDocument = function(title, description) {

    var alertString = `<?xml version="1.0" encoding="UTF-8" ?>
        <document>
          <alertTemplate>
            <title>${title}</title>
            <description>${description}</description>
          </alertTemplate>
        </document>`

    var parser = new DOMParser();

    var alertDoc = parser.parseFromString(alertString, "application/xml");

    return alertDoc
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
