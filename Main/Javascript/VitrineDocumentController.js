class VitrineDocumentController extends DocumentController {

    setupDocument(document) {
        super.setupDocument(document);

        let logoIdentifier = isFilimo() ? "filimo" : "televika";
        let logoResource = jsBaseURL + `Resources/logo_${logoIdentifier}.png (theme:light), ` + jsBaseURL + `Resources/logo_${logoIdentifier}_dark.png (theme:dark)`;
        document.getElementById("headerLogo").setAttribute("srcset", logoResource);

        this._nextPageURL = null;
        this._isLoadingMore = false;

        const stackTemplate = document.getElementsByTagName('stackTemplate').item(0);
        const collectionList = document.getElementsByTagName("collectionList").item(0);
        const rootNode = stackTemplate.parentNode;

        // Add a loading indicator until we make stackTemplate ready
        rootNode.insertAdjacentHTML('beforeend', loadingTemplateString());
        rootNode.removeChild(stackTemplate);
        let loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);

        this.dataLoader.fetchVitrine((dataObject) => {

            this._fillGridInCollectionList(dataObject, collectionList);

            rootNode.appendChild(stackTemplate);
            rootNode.removeChild(loadingTemplate);

            stackTemplate.addEventListener('needsmore', (event) => {
                if (this._nextPageURL != null) {

                    if (this._isLoadingMore) {
                        return;
                    }

                    this._isLoadingMore = true;
                    this.dataLoader.fetchVitrineNextPage(this._nextPageURL, (dataObject) => {
                        this._fillGridInCollectionList(dataObject, collectionList);
                        this._isLoadingMore = false;
                    }, () => {
                        this._isLoadingMore = false;
                    });
                }
            });
        });
    }

    _fillGridInCollectionList(dataObject, collectionList) {
        this._nextPageURL = dataObject.nextPage;

        for (let i = 0; i < dataObject.rows.length; i++) {
            let row = dataObject.rows[i];

            let sectionTag = (row.type === 'poster-theater') ? 'carousel' : 'shelf';

            let sectionToAdd = `<${sectionTag}>
               <header>
               <title>${toPersianDigits(row.title)}</title>
               </header>
               <section binding="items:{movies};" />
               </${sectionTag}>`;
            collectionList.insertAdjacentHTML('beforeend', sectionToAdd);

            let section = (collectionList.getElementsByTagName("section")).item(collectionList.children.length - 1);
            section.dataItem = new DataItem();
            section.dataItem.setPropertyPath("movies", row.dataItems);
        }
    }
}

registerAttributeName("vitrineDocumentURL", VitrineDocumentController)