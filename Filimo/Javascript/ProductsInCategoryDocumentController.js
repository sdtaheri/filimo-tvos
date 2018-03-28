class ProductsInCategoryDocumentController extends DocumentController {
    constructor(controllerOptions) {
        super(controllerOptions)
        this._category = controllerOptions.event.target.dataItem
    }
    
    setupDocument(document) {
        super.setupDocument(document)

        let banner = document.getElementsByTagName("banner").item(0)
        banner.getElementsByTagName("title").item(0).textContent = this._category.title

        let url = filimoAPIBaseURL + '/movielistbycat/catid/'
            + this._category.id 
            + "/perpage/50/"
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let movies = dataObj.movielistbycat

            let grid = document.getElementsByTagName("grid").item(0)
            let section = grid.getElementsByTagName("section").item(0)    
            section.dataItem = new DataItem()
            section.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
        })

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("productsInCategory", movie.uid)
                Object.keys(movie).forEach((key) => {
                    let value = movie[key]
                    if (key === 'movie_title' || key === 'descr') {
                        value = toPersianDigits(value)
                    }
                    dataItem.setPropertyPath(key, value)
                })
                return dataItem
            })
        }    
    }
}
registerAttributeName("productsInCategoryDocumentURL", ProductsInCategoryDocumentController)
