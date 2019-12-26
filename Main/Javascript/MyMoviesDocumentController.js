class MyMoviesDocumentController extends DocumentController {
    
    setupDocument(document) {
        super.setupDocument(document)

        const mainDocument = document.getElementsByTagName("head").item(0).parentNode
        const stackTemplate = document.getElementsByTagName("stackTemplate").item(0)
        const messageAlertTemplate = document.getElementsByTagName("alertTemplate").item(0)
        const segmentBar = document.getElementById("resultsMode")

        let dataSection = document.getElementsByTagName("section").item(0)
        if (dataSection.dataItem == undefined) {
            dataSection.dataItem = new DataItem()
        }

        const dataLoader = this._dataLoader
        const documentLoader = this._documentLoader

        let dataLoadingURL = null

		if (Device.systemVersion >= "13" && Device.appVersion >= "1906041830") {
			let titleNode = document.getElementById("pageTitle")
			titleNode.innerHTML = " "
		}

        let selectedSegmentBarId = 'wish'

        mainDocument.addEventListener('appear', (event) => {
            toggleLoginAlert()
        })

        mainDocument.addEventListener('myListUpdate', (event) => {
            if (selectedSegmentBarId === 'wish') {
                loadData(selectedSegmentBarId, true)
            }
        })

        segmentBar.addEventListener('highlight', (event) => {
            let targetId = event.target.getAttribute('id')

            let id
            if (targetId === 'watchSegmentBarItem') {
                id = 'watch'            
            } else if (targetId === 'wishSegmentBarItem') {
                id = 'wish'
            } else {
                return
            }

            loadData(id, false)
        })

        stackTemplate.addEventListener('needsmore', (event) => {
            if (dataLoadingURL == null) {
                return
            }
            dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                fillGrid(dataObj, selectedSegmentBarId)
            })
        })

        function loadData(segmentBarId, shouldClear) {            
            dataLoadingURL = filimoAPIBaseURL + '/movielistby' + segmentBarId + '/perpage/20/'

            dataLoader._fetchJSONData(documentLoader.prepareURL(dataLoadingURL), (dataObj) => {
                if (shouldClear) {
                    dataSection.dataItem = new DataItem()
                }
                fillGrid(dataObj, segmentBarId)
            })    
        }

        function fillGrid(dataObj, id) {
            let movies = dataObj['movielistby'+id]

            if (dataObj.ui.pagingForward && dataObj.ui.pagingForward.length > 0) {
                dataLoadingURL = dataObj.ui.pagingForward
            } else {
                dataLoadingURL = null
            }

            let newMoviesID = movies.map((movie) => {
                return movie.uid
            }) || []
            
            let oldMoviesID = []
            if (dataSection.dataItem.items != undefined) {
                oldMoviesID = dataSection.dataItem.items.map((item) => {
                    return item.identifier
                })    
            }

            if (JSON.stringify(newMoviesID) !== JSON.stringify(oldMoviesID)) {
                if (dataSection.dataItem.items && id === selectedSegmentBarId) {
                    Array.prototype.push.apply(dataSection.dataItem.items, dataItemsFromJSONItems(movies))
                    dataSection.dataItem.touchPropertyPath("items")
                } else {
                    dataSection.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))
                }
            }

            selectedSegmentBarId = id
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
                loadData(selectedSegmentBarId, true)
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
registerAttributeName("myMoviesDocumentURL", MyMoviesDocumentController)
