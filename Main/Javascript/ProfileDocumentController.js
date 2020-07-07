class ProfileDocumentController extends DocumentController {

    constructor(controllerOptions) {
        super(controllerOptions);

        this._needMoreMap = {};
        this._addedSectionNames = [];
    }


    setupDocument(document) {
        super.setupDocument(document);

        document.getElementById('bookmarksSegmentBarTitle').textContent = string_bookmarks;
        document.getElementById('historySegmentBarTitle').textContent = string_history;

        const rootNode = document.getElementsByTagName('head').item(0).parentNode;
        const stackTemplate = document.getElementsByTagName('stackTemplate').item(0);
        const identityBanner = stackTemplate.getElementsByTagName('identityBanner').item(0);
        const separator = stackTemplate.getElementsByTagName('separator').item(0);
        const segmentBar = document.getElementById('resultsMode');
        const collectionList = document.getElementsByTagName('collectionList').item(0);
        const errorMessage = document.getElementById('errorMessage');

        let selectedSegment = null;
        let needMoreMap = {};
        let isLoadingMore = false;
        let didAddNeedsMoreListener = false;

        errorMessage.textContent = string_no_items_available;

        segmentBar.addEventListener('highlight', (event) => {
            const selectedElement = event.target;
            const selectedMode = selectedElement.getAttribute('value');

            if (selectedMode !== selectedSegment) {
                setResultsMode.bind(this)(selectedMode);
            }
        });

        stackTemplate.removeChild(identityBanner);
        stackTemplate.removeChild(separator);
        collectionList.removeChild(errorMessage);

        document.addEventListener('appear', loadPage.bind(this));

        function loadPage() {

            if (UserManager.isLoggedIn()) {

                if (identityBanner.parentNode === undefined) {
                    //We have never loaded profile. Let's add a loading indicator.
                    rootNode.insertAdjacentHTML('beforeend', loadingTemplateString());
                    if (stackTemplate.parentNode) {
                        rootNode.removeChild(stackTemplate);
                    }
                }

                this.dataLoader.fetchProfile((profile) => {

                    if (profile.subscriptionText === null) {
                        this.dataLoader.logout(profile.logoutLink);
                        UserManager.logout();
                        resetLayout();
                        loadPage();
                        return;
                    }

                    identityBanner.getElementsByTagName('title')
                        .item(0).textContent = string_username(profile.username);
                    identityBanner.getElementsByTagName('subtitle')
                        .item(0).textContent = toPersianDigits(profile.subscriptionText);

                    if (identityBanner.parentNode === undefined) {
                        stackTemplate.insertBefore(identityBanner, stackTemplate.firstChild);

                        let payButton = identityBanner.getElementsByTagName('buttonLockup').item(0);
                        payButton.getElementsByTagName('title')
                            .item(0)
                            .textContent = string_pay;

                        if (payButton.getAttribute('added-select-listener') !== 'true') {
                            payButton.addEventListener('select', (event) => {
                                const eventTarget = event.target;
                                eventTarget.setAttribute('added-select-listener', 'true');

                                let alertDoc = createAlertDocument(string_buy_or_extend,
                                    string_go_to_payment_website(), true);
                                navigationDocument.pushDocument(alertDoc);
                            });
                        }

                        let logoutButton = identityBanner.getElementsByTagName('buttonLockup').item(1);
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
                                        this.dataLoader.logout(profile.logoutLink);
                                        UserManager.logout();
                                        resetLayout();
                                        loadPage();
                                    });
                            });
                        }
                    }

                    setResultsMode.bind(this)(selectedSegment || 'bookmarks');
                });

            } else {
                if (stackTemplate.parentNode) {
                    rootNode.removeChild(stackTemplate);
                }

                if (rootNode.getElementsByTagName('divTemplate').item(0) === undefined) {
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
        }

        function setResultsMode(selectedMode) {
            selectedSegment = selectedMode;
            isLoadingMore = false;

            if (selectedMode === 'bookmarks') {
                this.dataLoader.fetchBookmarks((dataObject) => {
                    fillGridWithDataObject.bind(this)(dataObject);
                    showStackView();
                });
            }

            if (selectedMode === 'history') {
                this.dataLoader.fetchHistory((dataObject) => {
                    fillGridWithDataObject.bind(this)(dataObject);
                    showStackView();
                });
            }
        }

        function showStackView() {
            let loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);
            if (loadingTemplate) {
                rootNode.removeChild(loadingTemplate);
            }

            let loginTemplate = document.getElementsByTagName('divTemplate').item(0);
            if (loginTemplate) {
                rootNode.removeChild(loginTemplate);
            }

            if (stackTemplate.parentNode === undefined) {
                rootNode.appendChild(stackTemplate);
            }

            if (separator.parentNode === undefined) {
                stackTemplate.insertBefore(separator, collectionList);
            }
        }

        function resetLayout() {
            while (collectionList.firstChild) {
                collectionList.removeChild(collectionList.firstChild);
            }
            collectionList.appendChild(errorMessage);

            if (identityBanner.parentNode) {
                stackTemplate.removeChild(identityBanner);
            }
            if (separator.parentNode) {
                stackTemplate.removeChild(separator);
            }
            if (collectionList.parentNode) {
                stackTemplate.removeChild(collectionList);
            }

            stackTemplate.appendChild(identityBanner);
            stackTemplate.appendChild(separator);
            stackTemplate.appendChild(collectionList);

            while (rootNode.childNodes.length > 1) {
                rootNode.removeChild(rootNode.lastChild);
            }
            rootNode.appendChild(stackTemplate);
        }

        function fillGridWithDataObject(dataObject) {

            function reloadSectionDataItems(items) {
                const section = collectionList.getElementsByTagName('section').item(0);

                if (section) {
                    section.dataItem['movies'] = items;
                    section.dataItem.touchPropertyPath('movies');
                } else {
                    let gridToAdd = `<grid>
                        <section binding="items:{movies};" />
                    </grid>`;
                    collectionList.insertAdjacentHTML('beforeend', gridToAdd);

                    const lastAddedGrid = collectionList.lastChild;

                    if (!didAddNeedsMoreListener) {
                        didAddNeedsMoreListener = true;

                        stackTemplate.addEventListener('needsmore', () => {
                            if (isLoadingMore) {
                                return;
                            }
                            loadMoreForGrid.bind(this)(lastAddedGrid);
                        });
                    }

                    let addedSection = lastAddedGrid.getElementsByTagName('section').item(0);
                    addedSection.dataItem = new DataItem();
                    addedSection.dataItem.setPropertyPath("movies", items);
                }
            }

            if (dataObject.rows.length === 0) {
                if (errorMessage.parentNode === undefined) {
                    collectionList.appendChild(errorMessage);
                }

                reloadSectionDataItems.bind(this)([]);
                return;
            }

            if (dataObject.rows.length > 0 && errorMessage.parentNode) {
                collectionList.removeChild(errorMessage);
            }

            for (let i = 0; i < dataObject.rows.length; i++) {
                let row = dataObject.rows[i];
                needMoreMap[selectedSegment] = row.nextPage;
                reloadSectionDataItems.bind(this)(row.dataItems);
            }
        }

        function loadMoreForGrid(grid) {
            function flattenDataItems(dataObject) {
                return dataObject.rows.flatMap((item) => {
                    return item.dataItems;
                });
            }

            isLoadingMore = true;

            this.dataLoader.fetchVitrineNextPage(needMoreMap[selectedSegment], (dataObject) => {
                const flattenedItems = flattenDataItems(dataObject);
                if (flattenedItems.length > 0) {
                    const currentSection = collectionList.getElementsByTagName('section').item(0);
                    Array.prototype.push.apply(currentSection.dataItem['movies'], flattenedItems);
                    currentSection.dataItem.touchPropertyPath('movies');
                    console.log("Next Page");

                    dataObject.rows.forEach((newRow) => {
                        if (needMoreMap[selectedSegment] === newRow.nextPage) {
                            needMoreMap[selectedSegment] = null;
                        } else {
                            needMoreMap[selectedSegment] = newRow.nextPage;
                        }
                    });
                }
                isLoadingMore = false;
            }, () => {
                isLoadingMore = false;
            });
        }
    }
}

registerAttributeName("profileDocumentURL", ProfileDocumentController);
