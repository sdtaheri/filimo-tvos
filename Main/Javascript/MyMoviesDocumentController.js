class MyMoviesDocumentController extends DocumentController {
    
    setupDocument(document) {
        super.setupDocument(document)

        const mainDocument = document.getElementsByTagName("head").item(0).parentNode
        const stackTemplate = document.getElementsByTagName("stackTemplate").item(0)
        const messageAlertTemplate = document.getElementsByTagName("alertTemplate").item(0)
        const segmentBar = document.getElementById("resultsMode")
        const dataGrid = document.getElementsByTagName("grid").item(0)

        let dataSection = document.getElementsByTagName("section").item(0)
        if (dataSection.dataItem === undefined) {
            dataSection.dataItem = new DataItem()
        }

        const dataLoader = this._dataLoader
        const documentLoader = this._documentLoader

		if (Device.systemVersion >= "13" && Device.appVersion >= "1906041830") {
			let titleNode = document.getElementById("pageTitle")
			titleNode.innerHTML = " "
		}

        let selectedSegmentBarId = 'wishSegmentBarItem'

        mainDocument.addEventListener('appear', (event) => {
            toggleLoginAlert()
        })

        segmentBar.addEventListener('highlight', (event) => {
            loadData(event.target.getAttribute('id'))
            selectedSegmentBarId = event.target.getAttribute('id')
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

            dataLoader._fetchJSONData(documentLoader.prepareURL(segmentURL), (dataObj) => {
                let movies = dataObj['movielistby'+id]
                let newMoviesID = movies.map((movie) => {
                    return movie.uid
                }) || []
                let oldMoviewsID = []
                if (dataSection.dataItem.items !== undefined) {
                    oldMoviewsID = dataSection.dataItem.items.map((item) => {
                        return item.identifier
                    })    
                }

                if (JSON.stringify(newMoviesID) !== JSON.stringify(oldMoviewsID)) {
                    dataSection.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
                }
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
