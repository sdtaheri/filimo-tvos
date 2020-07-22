class SearchDocumentController extends DocumentController {

    setupDocument(document) {

        super.setupDocument(document);

        const searchTemplate = document.getElementsByTagName('searchTemplate').item(0);
        const messageElement = document.getElementById("message");
        const resultsList = document.getElementById("resultsList");
        const gridElement = document.getElementById("resultsGridContainer");

        const sectionElement = document.getElementById("resultsSection");
        sectionElement.dataItem = new DataItem();

        const searchFieldElement = document.getElementsByTagName('searchField').item(0);
        const searchKeyboard = searchFieldElement.getFeature('Keyboard');
        searchFieldElement.innerHTML = string_search_placeholder();

        searchKeyboard.onTextChange = performSearchRequest.bind(this);

        showGrid(false);
        showSearchMessage(false);

        function showSearchMessage(bool, message) {
            if (bool) {
                if (message) {
                    messageElement.textContent = message;
                }
                if (!messageElement.parentNode) {
                    searchTemplate.appendChild(messageElement);
                }
            } else {
                if (messageElement.parentNode) {
                    searchTemplate.removeChild(messageElement);
                }
            }
        }

        function showGrid(bool) {
            if (bool) {
                if (!gridElement.parentNode) {
                    resultsList.appendChild(gridElement);
                }
            } else {
                if (gridElement.parentNode) {
                    resultsList.removeChild(gridElement);
                }
            }
        }

        function performSearchRequest() {
            const query = searchKeyboard.text;

            if (query === '') {
                showGrid(false);
                showSearchMessage(false);
                return;
            }

            this.dataLoader.fetchSearchResults(query, (result) => {
                showSearchResponse(result);
            }, showSearchError);

            showSpinner(true);
        }

        function showSearchError() {
            showGrid(false);
            showSearchMessage(true, string_error_in_search);
            showSpinner(false);
        }

        function showSearchResponse(result) {
            showSpinner(false);

            if (result.dataItems.length > 0) {
                appendSearchResults(result.dataItems);
                showSearchMessage(false);
                showGrid(true);
            } else {
                showGrid(false);
                showSearchMessage(true, string_nothing_found_for(searchKeyboard.text));
            }
        }

        function appendSearchResults(items) {
            sectionElement.dataItem.setPropertyPath("movies", items);
        }

        function showSpinner(bool) {
            searchFieldElement.setAttribute('showSpinner', bool);
        }
    }
}

registerAttributeName("searchDocumentURL", SearchDocumentController);
