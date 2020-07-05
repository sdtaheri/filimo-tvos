class ProfileDocumentController extends DocumentController {

    constructor(controllerOptions) {
        super(controllerOptions);

        this.fetchContent = this.fetchContent.bind(this);
        this._needMoreMap = {};
        this._addedSectionNames = [];
    }


    setupDocument(document) {
        super.setupDocument(document);

        const stackTemplate = document.getElementsByTagName('stackTemplate').item(0);
        const collectionList = document.getElementsByTagName('collectionList').item(0);
        const rootNode = stackTemplate.parentNode;

        document.addEventListener('appear', (event) => {
            this.fetchContent(document, stackTemplate, collectionList, rootNode);
        });
    }

    fetchContent(document, stackTemplate, collectionList, rootNode) {
        if (UserManager.isLoggedIn()) {

            if (this._addedSectionNames.length === 0) {
                // Add a loading indicator until we make stackTemplate ready
                rootNode.insertAdjacentHTML('beforeend', loadingTemplateString());
                rootNode.removeChild(stackTemplate);
            }

            let loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);

            this.dataLoader.fetchProfile((profile) => {
                let identityBanner = stackTemplate.getElementsByTagName('identityBanner').item(0);

                identityBanner.getElementsByTagName('title').item(0).textContent = string_username(profile.username);
                identityBanner.getElementsByTagName('subtitle').item(0).textContent = toPersianDigits(profile.subscriptionText);
            });

            this.dataLoader.fetchUserMovies((dataObject) => {
                this._needMoreMap = {};
                this._fillGridInCollectionList(dataObject, collectionList);

                if (loadingTemplate !== undefined) {
                    rootNode.appendChild(stackTemplate);
                    rootNode.removeChild(loadingTemplate);
                }
            });

        } else {
            rootNode.removeChild(stackTemplate);

            let loginAlert = `<divTemplate>
                <img class="centeredInPage" width="150" height="150"
                    srcset="${jsBaseURL}Resources/profile.png 1x, ${jsBaseURL}Resources/profile@2x.png 2x" />         
                <button class="centeredInPage" loginDocumentURL="/XMLs/Login.xml">
                    <text class="buttonTitle">${string_login_to_account}</text>
                </button>
            </divTemplate>`;

            rootNode.insertAdjacentHTML('beforeend', loginAlert);
        }
    }

    _fillGridInCollectionList(dataObject, collectionList) {
        function flattenDataItems(dataObject) {
            return dataObject.rows.flatMap((item) => {
                return item.dataItems;
            });
        }

        for (let i = 0; i < dataObject.rows.length; i++) {
            let row = dataObject.rows[i];

            this._needMoreMap[row.title] = row.nextPage;

            let indexOfAddedSection = this._addedSectionNames.findIndex((item) => {
                return row.title === item;
            });
            if (indexOfAddedSection !== -1) {
                let section = (collectionList.getElementsByTagName("section")).item(indexOfAddedSection);
                section.dataItem['movies'] = row.dataItems;
                section.dataItem.touchPropertyPath("movies");
            } else {
                this._addedSectionNames.push(row.title);

                let sectionToAdd = `<shelf>
               <header>
               <title>${toPersianDigits(row.title)}</title>
               </header>
               <section binding="items:{movies};" />
               </shelf>`;
                collectionList.insertAdjacentHTML('beforeend', sectionToAdd);

                let lastAddedShelf = collectionList.lastChild;
                lastAddedShelf.addEventListener('needsmore', (event) => {
                    this.dataLoader.fetchVitrineNextPage(this._needMoreMap[row.title], (items) => {
                        let currentSection = lastAddedShelf.getElementsByTagName('section').item(0);
                        Array.prototype.push.apply(currentSection.dataItem['movies'], flattenDataItems(items));
                        currentSection.dataItem.touchPropertyPath("movies");

                        items.rows.forEach((newRow) => {
                           this._needMoreMap[row.title] = newRow.nextPage;
                        });
                    });
                });

                let section = (collectionList.getElementsByTagName("section")).item(collectionList.children.length - 1);
                section.dataItem = new DataItem();
                section.dataItem.setPropertyPath("movies", row.dataItems);
            }
        }
    }
}

registerAttributeName("profileDocumentURL", ProfileDocumentController);
