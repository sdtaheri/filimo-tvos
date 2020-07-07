class VitrineDocumentController extends DocumentController {

    constructor(options) {
        super(options);

        if (options.event) {
            const dataItem = options.event.target['dataItem'];
            this.linkKey = dataItem.uid || 'home';
            this.pageTitle = dataItem.title;
        } else {
            this.linkKey = options.linkKey || 'home';
            this.pageTitle = null;
        }
        this.isHomePage = this.linkKey === 'home';
    }

    setupDocument(document) {
        super.setupDocument(document);

        if (this.isHomePage) {
            let logoIdentifier = isFilimo() ? "filimo" : "televika";
            let logoResource = jsBaseURL + `Resources/logo_${logoIdentifier}.png (theme:light), ` + jsBaseURL + `Resources/logo_${logoIdentifier}_dark.png (theme:dark)`;
            document.getElementById("headerLogo").setAttribute("srcset", logoResource);
        }

        if (this.pageTitle) {
            document.getElementById('pageTitle').textContent = this.pageTitle;
        }

        this._nextPageURL = null;
        this._isLoadingMore = false;

        const stackTemplate = document.getElementsByTagName('stackTemplate').item(0);
        const collectionList = document.getElementsByTagName("collectionList").item(0);
        const rootNode = stackTemplate.parentNode;

        // Add a loading indicator until we make stackTemplate ready
        rootNode.insertAdjacentHTML('beforeend', loadingTemplateString());
        rootNode.removeChild(stackTemplate);
        let loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);

        this.dataLoader.fetchList(this.linkKey,(dataObject) => {

            this.fillGridInCollectionList(dataObject, collectionList);

            rootNode.appendChild(stackTemplate);
            rootNode.removeChild(loadingTemplate);

            stackTemplate.addEventListener('needsmore', (event) => {
                if (this._nextPageURL != null) {

                    if (this._isLoadingMore) {
                        return;
                    }

                    this._isLoadingMore = true;
                    this.dataLoader.fetchVitrineNextPage(this._nextPageURL, (dataObject) => {
                        this.fillGridInCollectionList(dataObject, collectionList);
                        this._isLoadingMore = false;
                    }, () => {
                        this._isLoadingMore = false;
                    });
                }
            });
        });
    }

    fillGridInCollectionList(dataObject, collectionList) {
        this._nextPageURL = dataObject.nextPage;

        for (let i = 0; i < dataObject.rows.length; i++) {
            const row = dataObject.rows[i];

            const shouldAddHeader = row.title && (row.title !== '') && row.title !== this.pageTitle;

            const sectionToAdd = `<${row.header}>
               ${shouldAddHeader ? `<header>
                <title>${toPersianDigits(row.title)}</title>
                </header>` : ''}
               <section binding="items:{movies};" />
               </${row.header}>`;
            collectionList.insertAdjacentHTML('beforeend', sectionToAdd);

            let section = (collectionList.getElementsByTagName("section")).item(collectionList.children.length - 1);
            section.dataItem = new DataItem();
            section.dataItem.setPropertyPath("movies", row.dataItems);
        }
    }
}

registerAttributeName("vitrineDocumentURL", VitrineDocumentController)