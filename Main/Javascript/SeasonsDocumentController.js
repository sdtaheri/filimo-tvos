class SeasonsDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions)  
        if (controllerOptions.event) {
            this._allSeasons = controllerOptions.event.target.dataItem.allSeasons
        }
    }

    setupDocument(document) {
        super.setupDocument(document)

        const allSeasons = this._allSeasons
        const listSection = document.getElementsByTagName('list').item(0).lastChild

        const numberOfSeasons = Object.keys(allSeasons).length

        let nodesCounter = 0
        Object.keys(allSeasons).forEach( (key) => {
            let nodeToAdd = `<listItemLockup>
                <title>${toPersianDigits('فصل ' + key)}</title>
                <decorationLabel>${toPersianDigits('' + allSeasons[key].length)}</decorationLabel>
                <relatedContent>
                    <grid>
                        <section binding="items:{items};">
                        </section>
                    </grid>
                </relatedContent>
            </listItemLockup>`

            listSection.insertAdjacentHTML('beforeend', nodeToAdd)
            
            let itemsSection = listSection.getElementsByTagName('section').item(nodesCounter)
            itemsSection.dataItem = new DataItem()
            itemsSection.dataItem.setPropertyPath("items", dataItemsFromJSONItems(allSeasons[key]))

            nodesCounter += 1
        })

        function dataItemsFromJSONItems(items) {
            return items.map((movie) => {
                let dataItem = new DataItem("productsList", movie.uid)
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
registerAttributeName("seasonsDocumentURL", SeasonsDocumentController)