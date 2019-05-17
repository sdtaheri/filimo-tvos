class MyMoviesDocumentController extends DocumentController {
    
    setupDocument(document) {
        super.setupDocument(document)

        const mainDocument = document.getElementsByTagName("head").item(0).parentNode
        const stackTemplate = document.getElementsByTagName("stackTemplate").item(0)
        const messageAlertTemplate = document.getElementsByTagName("alertTemplate").item(0)
        const segmentBar = document.getElementById("resultsMode")
        const collectionList = document.getElementsByTagName("collectionList").item(0)
        const dataGrid = document.getElementsByTagName("grid").item(0)
        const dataSection = document.getElementsByTagName("section").item(0)

        const dataLoader = this._dataLoader
        const documentLoader = this._documentLoader

        let selectedSegmentBarId = 'wishSegmentBarItem'

        mainDocument.addEventListener('appear', (event) => {
            toggleLoginAlert()
        })

        segmentBar.addEventListener('highlight', (event) => {
            selectedSegmentBarId = event.target.getAttribute('id')
            loadData(selectedSegmentBarId)
        })

        function loadData(segmentBarItemId) {
            let id
            if (segmentBarItemId === 'watchSegmentBarItem') {
                id = 'watch'            
            } else if (segmentBarItemId === 'wishSegmentBarItem') {
                id = 'wish'
            } else {
                return
            }
            let segmentURL = filimoAPIBaseURL + '/movielistby' + id

            while (dataSection.childNodes && dataSection.childNodes.length > 0) {
                dataSection.removeChild(dataSection.lastChild)
            }
            dataSection.dataItem = new DataItem()
            dataLoader._fetchJSONData(documentLoader.prepareURL(segmentURL), (dataObj) => {
                let movies = dataObj['movielistby'+id]
                dataSection.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
            })    
        }

        function toggleLoginAlert() {
            if (stackTemplate.parentNode) {
                stackTemplate.parentNode.removeChild(stackTemplate)
            }
            if (messageAlertTemplate.parentNode) {
                messageAlertTemplate.parentNode.removeChild(messageAlertTemplate)
            }
            if (isLoggedIn()) {
                mainDocument.appendChild(stackTemplate)
                loadData(selectedSegmentBarId)
            } else {
                mainDocument.appendChild(messageAlertTemplate)
            }
        }

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("wishArtwork", movie.uid)
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
registerAttributeName("myMoviesDocumentURL", MyMoviesDocumentController)
