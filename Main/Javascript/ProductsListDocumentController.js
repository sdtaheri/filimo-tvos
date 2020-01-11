class ProductsListDocumentController extends DocumentController {
    constructor(controllerOptions) {
        super(controllerOptions)
        this._sourceDataItem = controllerOptions.event.target.dataItem
    }
    
    setupDocument(document) {
        super.setupDocument(document)

        const stackTemplate = document.getElementsByTagName("stackTemplate").item(0)
        const banner = document.getElementsByTagName("banner").item(0)
        const grid = document.getElementsByTagName("grid").item(0)
        
        let gridSection = grid.getElementsByTagName("section").item(0)    
        gridSection.dataItem = new DataItem()

        const requestType = this._sourceDataItem.requestType
        let dataLoadingURL = null

        const dataLoader = this._dataLoader
        const documentLoader = this._documentLoader

        switch (requestType) {
            case 'search':
                banner.getElementsByTagName("title").item(0).textContent = this._sourceDataItem.queryString
                
                dataLoadingURL = filimoAPIBaseURL + '/search/text/' + encodeURIComponent(this._sourceDataItem.queryString) + '/perpage/20' 
                dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                    fillGrid(dataObj)
                })

                break
            case 'category':
                banner.getElementsByTagName("title").item(0).textContent = this._sourceDataItem.title

                dataLoadingURL = filimoAPIBaseURL + '/movielistbycat/catid/' + this._sourceDataItem.id + '/perpage/20/'
                dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                    fillGrid(dataObj)
                })
            
                break
            case 'castSearch':
                banner.getElementsByTagName("title").item(0).textContent = this._sourceDataItem.queryString
            
                dataLoadingURL = this._sourceDataItem.searchURL + '/perpage/20' 
                dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                    fillGrid(dataObj)
                })

                break
    
            default: return
        }

        stackTemplate.addEventListener('needsmore', (event) => {
            if (dataLoadingURL == null) {
                return
            }
            dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                fillGrid(dataObj)
            })
        })

        function fillGrid(dataObj) {
            let movies = null

            switch (requestType) {
                case 'search':
                    movies = dataObj.search
                    break
                case 'category':
                    movies = dataObj.movielistbycat
                    break
                case 'castSearch':
                    movies = dataObj.movie
                    break
                default: return
            }

            if (dataObj.ui.pagingForward && dataObj.ui.pagingForward.length > 0) {
                dataLoadingURL = dataObj.ui.pagingForward
            } else {
                dataLoadingURL = null
            }

            if (movies) {
                if (gridSection.dataItem.items) {
                    Array.prototype.push.apply(gridSection.dataItem.items, dataItemsFromJSONItems(movies))
                    gridSection.dataItem.touchPropertyPath("items")
                } else {
                    gridSection.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
                }
            }
        }

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("productsList", movie.uid)
                Object.keys(movie).forEach((key) => {
                    let value = movie[key]
                    if (value && key === 'user_watched_info') {
                        let percent = value['percent']
                        if (percent) {
                            dataItem.setPropertyPath('watch_fraction', percent / 100.0)
                        } else {
                            dataItem.setPropertyPath('watch_fraction', 0.0)
                        }
                    }
                    if (key === 'movie_title' || key === 'descr') {
                        value = toPersianDigits(value)
                    }
                    if (key === 'movie_title_en') {
                        value = removeHTMLEntities(value)
                    }
                    dataItem.setPropertyPath(key, value)
                })
                return dataItem
            })
        }    
    }
}
registerAttributeName("productsListDocumentURL", ProductsListDocumentController)
