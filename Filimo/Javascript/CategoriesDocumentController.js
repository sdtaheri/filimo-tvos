class CategoriesDocumentController extends DocumentController {
    setupDocument(document) {
        super.setupDocument(document)

        let section = document.getElementsByTagName("section").item(0)
        let url = filimoAPIBaseURL + '/category'
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let categories = dataObj.category
            section.dataItem = new DataItem()
            section.dataItem.setPropertyPath("items", dataItemsFromJSONItems(categories))
        })

        function dataItemsFromJSONItems(items) {
            return items.map((category) => {
                let dataItem = new DataItem("categoryArtwork", category.id)
                Object.keys(category).forEach((key) => {
                    dataItem.setPropertyPath(key, category[key])
                })
                return dataItem
            })
        }    
    }
}
registerAttributeName("categoriesDocumentURL", CategoriesDocumentController)