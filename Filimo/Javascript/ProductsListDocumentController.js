class ProductsListDocumentController extends DocumentController {
    constructor(controllerOptions) {
        super(controllerOptions)
        this._sourceDataItem = controllerOptions.event.target.dataItem
    }
    
    setupDocument(document) {
        super.setupDocument(document)

        const banner = document.getElementsByTagName("banner").item(0)

        switch (this._sourceDataItem.requestType) {
            case 'search':
                banner.getElementsByTagName("title").item(0).textContent = this._sourceDataItem.queryString
                
                let searchURL = filimoAPIBaseURL + '/search/text/' + encodeURIComponent(this._sourceDataItem.queryString) + '/perpage/50' 
                this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(searchURL), (dataObj) => {
                    fillGrid(dataObj.search)
                })

                break
            case 'category':
                banner.getElementsByTagName("title").item(0).textContent = this._sourceDataItem.title

                let url = filimoAPIBaseURL + '/movielistbycat/catid/' + this._sourceDataItem.id + '/perpage/50/'
                this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
                    fillGrid(dataObj.movielistbycat)
                })
            
                break
            default: return
        }

        function fillGrid(movies) {
            if (movies) {
                let grid = document.getElementsByTagName("grid").item(0)
                let section = grid.getElementsByTagName("section").item(0)    
                section.dataItem = new DataItem()
                section.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
            }
        }

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("productsList", movie.uid)
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
registerAttributeName("productsListDocumentURL", ProductsListDocumentController)
