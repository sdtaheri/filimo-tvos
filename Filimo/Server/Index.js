let documentLoader = new DocumentLoader(baseURL)
let documentURL = documentLoader.prepareURL("/XMLs/Index.xml")
let loadingDocument = getActiveDocument()
new MenuBarController({ documentLoader, documentURL, loadingDocument })
