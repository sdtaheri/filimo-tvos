class SearchDocumentController extends DocumentController {

    dataItemsFromJSONItems(items) {
        let data = items.data
        return data.map((movie) => {
            let dataItem = new DataItem("searchArtwork", movie.uid)
            Object.keys(movie).forEach((key) => {
                dataItem.setPropertyPath(key, movie[key])
            })
            return dataItem
        })
    }

    setupDocument(document) {
        super.setupDocument(document)

    }

    search(document) {
        let searchField = document.getElementsByTagName("searchField").item(0)
        let keyboard = searchField.getFeature("Keyboard")
     
        keyboard.onTextChange = function() {
                var searchText = keyboard.text
                searchResults(document, searchText)
        }    
    }

    searchResults(document, searchText) {

    }
}
registerAttributeName("searchDocumentURL", SearchDocumentController)