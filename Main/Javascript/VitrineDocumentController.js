class VitrineDocumentController extends DocumentController {

    constructor(options) {
        super(options);

        const HOME = "1";

        if (options.event) {
            const dataItem = options.event.target["dataItem"];
            this.linkKey = dataItem.uid || dataItem.linkKey || HOME;
            this.pageTitle = dataItem.title;
        } else {
            this.linkKey = options.linkKey || HOME;
            this.pageTitle = null;
        }
        this.isHomePage = this.linkKey === HOME;
        this.isPendingUpdate = false;

        this.refreshInterval = 1000 * 60 * 30;
        this.lastRefreshDate = new Date();
    }

    setupDocument(document) {
        super.setupDocument(document);

        const stackTemplate = document.getElementsByTagName("stackTemplate").item(0);
        this.collectionList = document.getElementsByTagName("collectionList").item(0);
        this.pageTitleElement = document.getElementById("pageTitle");
        const rootNode = stackTemplate.parentNode;

        if (this.isHomePage) {
            let logoIdentifier = isFilimo() ? "filimo" : "televika";
            let logoResource = jsBaseURL + `Resources/logo_${logoIdentifier}.png (theme:light), ` + jsBaseURL + `Resources/logo_${logoIdentifier}_dark.png (theme:dark)`;
            document.getElementById("headerLogo").setAttribute("srcset", logoResource);

            this.refreshIntervalId = setInterval(() => {
                this.isPendingUpdate = true;
                this.refreshData(false);
            }, this.refreshInterval);

            document.addEventListener("appear", this.handleEvent);
            document.addEventListener("disappear", this.handleEvent);
            document.addEventListener('holdselect', this.handleEvent)
        }

        if (this.pageTitle && !this.isHomePage) {
            this.pageTitleElement.textContent = this.pageTitle;
        } else {
            this.pageTitleElement.textContent = '';
        }

        this._nextPageURL = null;
        this._isLoadingMore = false;

        // Add a loading indicator until we make stackTemplate ready
        rootNode.insertAdjacentHTML("beforeend", loadingTemplateString());
        rootNode.removeChild(stackTemplate);
        let loadingTemplate = document.getElementsByTagName("loadingTemplate").item(0);

        this.dataLoader.fetchList(this.linkKey, (dataObject) => {

            this.fillGridInCollectionList(dataObject, true);

            rootNode.appendChild(stackTemplate);
            rootNode.removeChild(loadingTemplate);

            stackTemplate.addEventListener("needsmore", () => {
                if (this._nextPageURL !== null) {

                    if (this._isLoadingMore) {
                        return;
                    }

                    this._isLoadingMore = true;
                    this.dataLoader.fetchVitrineNextPage(this._nextPageURL, (moreDataObject) => {
                        this.fillGridInCollectionList(moreDataObject, false);
                        this._isLoadingMore = false;
                    }, () => {
                        this._isLoadingMore = false;
                    });
                }
            });
        });
    }

    refreshData(isForced) {
        if (isForced || (this.isOnScreen && appForegroundedDate !== null &&
            this.isPendingUpdate === true && new Date() - this.lastRefreshDate > this.refreshInterval)) {
            this.dataLoader.fetchList(this.linkKey, (dataObject) => {
                this.fillGridInCollectionList(dataObject, true);
            });
            this.lastRefreshDate = new Date();
            this.isPendingUpdate = false;
        }
    }

    fillGridInCollectionList(dataObject, isRefresh) {
        this._nextPageURL = dataObject.nextPage;

        if (isRefresh && this.collectionList.childElementCount !== 0) {
            const stackTemplate = this.collectionList.parentNode;
            stackTemplate.removeChild(this.collectionList);

            stackTemplate.insertAdjacentHTML("beforeend", "<collectionList />");
            this.collectionList = stackTemplate.getElementsByTagName("collectionList").item(0);
        }

        for (let i = 0; i < dataObject.rows.length; i++) {
            const row = dataObject.rows[i];

            if (dataObject.rows.length === 1 && row.title && row.title.length !== 0) {
                this.pageTitle = this.isHomePage ? '' : row.title;
                this.pageTitleElement.textContent = this.pageTitle;
            }

            const shouldAddHeader = row.title && (row.title.length !== 0) && row.title !== this.pageTitle;

            if (row.type === "crew-single") {
                const item = row.dataItems[0] || null;
                if (item === null) {
                    continue;
                }

                this.pageTitle = item.title || item.titleEn || null;
                this.pageTitleElement.textContent = this.pageTitle;

                if (item.desc === null || item.desc === '') {
                    continue;
                }

                const rowToAdd = `<${row.header}>
                <section>
                    <card class="crewCard">
                        <monogramLockup class="crewCardImage" disabled="true">
                            <monogram firstName="${item.firstName}" lastName="${item.lastName}" src="${item.image}" />
                        </monogramLockup>
                        <text class="crewCardTitle">${item.desc}</text>
                    </card>
                </section>
                </${row.header}>`;

                this.collectionList.insertAdjacentHTML("beforeend", rowToAdd);

                const allSections = this.collectionList.getElementsByTagName("section");
                const section = allSections.item(allSections.length - 1);

                section.getElementsByTagName("card").item(0).addEventListener("select", () => {
                    presentAlertDocument(item.title, item.desc, false, true);
                });
            } else {
                const rowToAdd = `<${row.header}>
               ${shouldAddHeader ? `<header>
                <title>${toPersianDigits(row.title)}</title>
                </header>` : ''}
               <section binding="items:{movies};" />
               </${row.header}>`;

                this.collectionList.insertAdjacentHTML("beforeend", rowToAdd);

                if (row.header === "grid" && this._nextPageURL === null) {
                    this._nextPageURL = row.nextPage;
                }

                const allSections = this.collectionList.getElementsByTagName("section");
                const section = allSections.item(allSections.length - 1);
                section.dataItem = new DataItem();
                section.dataItem.setPropertyPath("movies", row.dataItems);
            }
        }

        if (dataObject.rows.length === 0) {
            this.collectionList.insertAdjacentHTML("beforeend",
                `<title class="message">${string_no_items_available}</title>`);
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case "appear": {
                this.isOnScreen = true;
                if (this.isPendingUpdate) {
                    this.refreshData(false);
                    return;
                }

                if (appForegroundedDate !== null
                    && appBackgroundedDate !== null
                    && appForegroundedDate - appBackgroundedDate > this.refreshInterval) {
                    this.isPendingUpdate = true;
                    appBackgroundedDate = null;
                    this.refreshData(false);
                    return;
                }

                if (UserManager.needsHomePageRefresh) {
                    this.isPendingUpdate = true;
                    this.refreshData(true);
                    UserManager.needsHomePageRefresh = false
                    return;
                }

                break;
            }

            case "disappear": {
                this.isOnScreen = false;
                break;
            }

            case 'load': {
                App.onResume = () => {
                    if (this.isPendingUpdate) {
                        this.refreshData(false)
                    }
                }
                break
            }
            case "unload": {
                if (this.refreshIntervalId) {
                    clearInterval(this.refreshIntervalId);
                }
                App.onResume = function (options) {
                }
                break;
            }

            case 'holdselect': {
                this.isPendingUpdate = true
                this.refreshData(true)
                return
            }

            case "select":
            case "play": {
                const linkType = getSafe(() => { return event.target.dataItem.linkType }, null);
                if (linkType !== null && linkType === "web") {
                    return;
                }

                break;
            }
        }

        super.handleEvent(event);
    }
}

registerAttributeName("vitrineDocumentURL", VitrineDocumentController)
