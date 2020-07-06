class ProfileDocumentController extends DocumentController {

    constructor(controllerOptions) {
        super(controllerOptions);

        this.fetchContent = this.fetchContent.bind(this);
        this._needMoreMap = {};
        this._addedSectionNames = [];
    }


    setupDocument(document) {
        super.setupDocument(document);

        this._stackTemplate = document.getElementsByTagName('stackTemplate').item(0);
        this._identityBanner = this._stackTemplate.getElementsByTagName('identityBanner').item(0);
        this._dummyShelf = document.getElementById('dummyShelf');
        this._stackTemplate.removeChild(this._identityBanner);

        document.addEventListener('appear', () => {
            this.fetchContent(document);
        });
    }

    fetchContent(document) {

        const collectionList = this._stackTemplate.getElementsByTagName('collectionList').item(0);
        const rootNode = document.getElementsByTagName('head').item(0).parentNode;

        let loginTemplate = document.getElementsByTagName('divTemplate').item(0);
        if (loginTemplate !== undefined && loginTemplate.parentNode) {
            rootNode.removeChild(loginTemplate);
        }

        if (UserManager.isLoggedIn()) {

            if (this._identityBanner.parentNode === undefined) {
                // Add a loading indicator until we make stackTemplate ready
                rootNode.insertAdjacentHTML('beforeend', loadingTemplateString());
                if (this._stackTemplate.parentNode) {
                    rootNode.removeChild(this._stackTemplate);
                }
            }

            this.dataLoader.fetchProfile((profile) => {

                if (this._identityBanner.parentNode === undefined) {
                    this._stackTemplate.insertBefore(this._identityBanner, this._stackTemplate.firstChild);

                    let payButton = this._identityBanner.getElementsByTagName('buttonLockup').item(0);
                    payButton.getElementsByTagName('title')
                        .item(0)
                        .textContent = string_pay;

                    if (payButton.getAttribute('added-select-listener') !== 'true') {
                        payButton.addEventListener('select', (event) => {
                            const eventTarget = event.target;
                            eventTarget.setAttribute('added-select-listener', 'true');

                            let alertDoc = createDescriptiveAlertDocument(string_buy_or_extend,
                                string_go_to_payment_website());
                            navigationDocument.pushDocument(alertDoc);
                        });
                    }

                    let logoutButton = this._identityBanner.getElementsByTagName('buttonLockup').item(1);
                    logoutButton.getElementsByTagName('title')
                        .item(0)
                        .textContent = string_logout;

                    if (logoutButton.getAttribute('added-select-listener') !== 'true') {
                        logoutButton.addEventListener('select', (event) => {
                            const eventTarget = event.target;
                            eventTarget.setAttribute('added-select-listener', 'true');

                            presentAlertQuestion(string_account_exit,
                                string_account_exit_alert_desc,
                                string_logout,
                                string_cancel,
                                () => {
                                    this._needMoreMap = {};
                                    this._addedSectionNames = [];

                                    this.dataLoader.logout(profile.logoutLink);
                                    UserManager.logout();

                                    this.fetchContent(document);
                                });
                        });
                    }

                }

                this._identityBanner.getElementsByTagName('title').item(0).textContent = string_username(profile.username);
                this._identityBanner.getElementsByTagName('subtitle').item(0).textContent = toPersianDigits(profile.subscriptionText);
            });

            let loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);

            this.dataLoader.fetchUserMovies((dataObject) => {
                this._needMoreMap = {};
                this._fillGridInCollectionList(dataObject, collectionList);

                if (loadingTemplate !== undefined) {
                    rootNode.appendChild(this._stackTemplate);
                    rootNode.removeChild(loadingTemplate);
                }
            });

        } else {
            if (this._stackTemplate.parentNode) {
                rootNode.removeChild(this._stackTemplate);
            }

            let template = `<divTemplate>
                <img class="centeredInPage" width="150" height="150"
                    srcset="${jsBaseURL}Resources/profile.png 1x, ${jsBaseURL}Resources/profile@2x.png 2x" />         
                <button class="centeredInPage" loginDocumentURL="/XMLs/Login.xml">
                    <text class="buttonTitle">${string_login_to_account}</text>
                </button>
            </divTemplate>`;

            rootNode.insertAdjacentHTML('beforeend', template);
        }
    }

    _fillGridInCollectionList(dataObject, collectionList) {
        function flattenDataItems(dataObject) {
            return dataObject.rows.flatMap((item) => {
                return item.dataItems;
            });
        }

        if (dataObject.rows.length > 0 && this._dummyShelf.parentNode !== undefined) {
            collectionList.removeChild(this._dummyShelf);
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

                if (lastAddedShelf.getAttribute('added-needs-more-listener') !== 'true') {
                    lastAddedShelf.addEventListener('needsmore', (event) => {
                        const targetElement = event.target;
                        targetElement.setAttribute('added-needs-more-listener', 'true');
                        this.dataLoader.fetchVitrineNextPage(this._needMoreMap[row.title], (items) => {
                            let currentSection = lastAddedShelf.getElementsByTagName('section').item(0);
                            Array.prototype.push.apply(currentSection.dataItem['movies'], flattenDataItems(items));
                            currentSection.dataItem.touchPropertyPath("movies");

                            items.rows.forEach((newRow) => {
                                this._needMoreMap[row.title] = newRow.nextPage;
                            });
                        });
                    });
                }

                let section = (collectionList.getElementsByTagName("section")).item(collectionList.children.length - 1);
                section.dataItem = new DataItem();
                section.dataItem.setPropertyPath("movies", row.dataItems);
            }
        }
    }
}

registerAttributeName("profileDocumentURL", ProfileDocumentController);
