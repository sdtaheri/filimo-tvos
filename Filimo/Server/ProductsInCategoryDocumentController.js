class ProductsInCategoryDocumentController extends DocumentController {
    constructor(controllerOptions) {
        super(controllerOptions)
        this._category = controllerOptions.event.target.dataItem
    }
    
    dataItemsFromJSONItems(items) {
        return items.map((movie) => {
            let dataItem = new DataItem("productsInCategory", movie.uid)
            Object.keys(movie).forEach((key) => {
                dataItem.setPropertyPath(key, movie[key])
            })
            return dataItem
        })
    }

    setupDocument(document) {
        super.setupDocument(document)

        let banner = document.getElementsByTagName("banner").item(0)
        banner.getElementsByTagName("title").item(0).textContent = this._category.title

        let url = "https://www.filimo.com/etc/api/movielistbycat/catid/" 
            + this._category.id 
            + "/perpage/50/devicetype/tvweb"
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let movies = dataObj.movielistbycat

            let grid = document.getElementsByTagName("grid").item(0)
            let section = grid.getElementsByTagName("section").item(0)    
            section.dataItem = new DataItem()
            section.dataItem.setPropertyPath("items", this.dataItemsFromJSONItems(movies))
        })
    }
}
registerAttributeName("productsInCategoryDocumentURL", ProductsInCategoryDocumentController)
