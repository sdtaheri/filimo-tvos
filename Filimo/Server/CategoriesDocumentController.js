class CategoriesDocumentController extends DocumentController {
    dataItemsFromJSONItems(items) {
        return items.map((category) => {
            let dataItem = new DataItem("categoryArtwork", category.id)
            Object.keys(category).forEach((key) => {
                dataItem.setPropertyPath(key, category[key])
            })
            return dataItem
        })
    }

    setupDocument(document) {
        super.setupDocument(document)

        let section = document.getElementsByTagName("section").item(0)
        let url = section.getAttribute("lazyDataURL")
        if (!url) {
            return
        }
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let categories = dataObj.category
            section.dataItem = new DataItem()
            section.dataItem.setPropertyPath("items", this.dataItemsFromJSONItems(categories))
        })
    }
}
registerAttributeName("categoriesDocumentURL", CategoriesDocumentController)