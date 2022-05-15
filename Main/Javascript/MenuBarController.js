/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles presenting the Menu Bar template example.
*/

class MenuBarController extends DocumentController {
  setupDocument (document) {
    const menuBarElem = document.getElementsByTagName('menuBar').item(0)

    menuBarElem.addEventListener('select', (event) => {
      this.selectMenuItem(event.target)
    })
  }

  selectMenuItem (menuItemElem) {
    const menuBarElem = menuItemElem.parentNode
    const menuBarFeature = menuBarElem.getFeature('MenuBarDocument')
    const existingDocument = menuBarFeature.getDocument(menuItemElem)

    if (!existingDocument) {
      const controllerOptions = resolveControllerFromElement(menuItemElem)
      if (controllerOptions) {
        menuBarFeature.setDocument(createLoadingDocument(), menuItemElem)
        controllerOptions.documentLoader = this.documentLoader
        controllerOptions.linkKey = menuItemElem.getAttribute('linkKey') ||
          null
        const controllerClass = controllerOptions.type
        const controller = new controllerClass(controllerOptions)
        controller.handleDocument = (document) => {
          setTimeout(() => {
            menuBarFeature.setDocument(document, menuItemElem)
          }, 500)
        }
      }
    }
  }
}

registerAttributeName('menuBarDocumentURL', MenuBarController)
