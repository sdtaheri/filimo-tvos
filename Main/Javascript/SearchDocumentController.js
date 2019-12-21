class SearchDocumentController extends DocumentController {

    setupDocument(document) {
        super.setupDocument(document)

        const searchTemplateElem = document.getElementsByTagName('searchTemplate').item(0)
        const searchFieldElem = document.getElementsByTagName('searchField').item(0)
        const messageElem = document.getElementById("message");
        const resultsListElem = document.getElementById("resultsList")
        const resultsGridContainerElem = document.getElementById("resultsGridContainer")
        
        let resultsSectionElem = document.getElementById("resultsSection");
        resultsSectionElem.dataItem = new DataItem()

        let resultsContainerElem = resultsGridContainerElem;
        toggleDefaultResults(true)

        let searchRequest
        let searchTextCache
        const searchKeyboard = searchFieldElem.getFeature('Keyboard')
        searchKeyboard.onTextChange = performSearchRequest

        function toggleSearchMessage(bool, message) {
            if (bool) {
                if (message) {
                    messageElem.textContent = message;
                }
                if (!messageElem.parentNode) {
                    searchTemplateElem.appendChild(messageElem);
                }
            } else {
                if (messageElem.parentNode) {
                    searchTemplateElem.removeChild(messageElem);
                }
            }
        }

        function toggleDefaultResults(bool) {
            if (bool) {
                if (resultsContainerElem.parentNode) {
                    resultsListElem.removeChild(resultsContainerElem)
                }
                toggleSearchMessage(false)
            } else {
                if (!resultsContainerElem.parentNode) {
                    resultsListElem.appendChild(resultsContainerElem)
                }
            }
        }

        function performSearchRequest() {
            const searchText = searchKeyboard.text.trim().replace(/\s+/g, " ")

            if (searchTextCache && searchText === searchTextCache) {
                return
            }
            searchTextCache = searchText

            if (searchRequest && searchRequest.readyState !== XMLHttpRequest.DONE) {
                searchRequest.abort()
            }

            if (searchText.length === 0) {
                toggleDefaultResults(true)
                return
            }

            let searchURL = filimoAPIBaseURL 
                + '/search/text/' + encodeURIComponent(searchText) + '/perpage/20' 
            if (isLoggedIn()) {
                searchURL += "/luser/" + localStorage.getItem("username")
                searchURL += "/ltoken/" + localStorage.getItem("token")
            }
            searchURL += '/devicetype/ios/'

            searchRequest = new XMLHttpRequest()
            searchRequest.open('GET', searchURL)
            searchRequest.responseType = 'json'
            searchRequest.onload = showSearchResponse
            searchRequest.onerror = showSearchError
            searchRequest.send()

            searchFieldElem.setAttribute('showSpinner', true)
        }

        function showSearchError() {
            toggleSearchMessage(true, "خطا در دریافت نتایج جستجو")
            searchFieldElem.setAttribute('showSpinner', false)
        }

        function showSearchResponse() {
            toggleDefaultResults(false)
            searchFieldElem.setAttribute('showSpinner', false)

            const searchResponse = searchRequest.response
            const searchResults = searchResponse.search
            if (searchResults !== null && searchResults.length > 0) {
                appendSearchResults(searchResults)
                toggleSearchMessage(false)
            } else {
                toggleSearchMessage(true, `نتیجه‌ای برای «${searchTextCache}» پیدا نشد.`)
            }
        }

        function appendSearchResults(results) {
            resultsSectionElem.dataItem.setPropertyPath("items", dataItemsFromJSONItems(results))
        }

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("searchArtwork", movie.uid)
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
registerAttributeName("searchDocumentURL", SearchDocumentController)
