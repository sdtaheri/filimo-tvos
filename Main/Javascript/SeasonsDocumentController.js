class SeasonsDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions);
        if (controllerOptions.event) {
            this.seasons = controllerOptions.event.target['seasons'];
        }
    }

    setupDocument(document) {
        super.setupDocument(document);

        document.getElementById('pageTitle').textContent = string_seasons;

        const listSection = document.getElementById('listSection');

        for (let season of this.seasons.rows) {
            const listItemToAdd = `<listItemLockup>
                <title>${season.title}</title>
                <decorationLabel>${toPersianDigits(season.dataItems.length)}</decorationLabel>
                <relatedContent>
                    <grid>
                        <section binding="items:{movies};" />
                    </grid>
                </relatedContent>
            </listItemLockup>`;

            listSection.insertAdjacentHTML('beforeend', listItemToAdd);

            const allSections = document.getElementsByTagName('section');
            const lastSection = allSections.item(allSections.length - 1);
            lastSection.dataItem = new DataItem();
            lastSection.dataItem.setPropertyPath('movies', season.dataItems);
        }
    }
}

registerAttributeName("seasonsDocumentURL", SeasonsDocumentController);