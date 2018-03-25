class HomeDocumentController extends DocumentController {
    
    dataItemsFromJSONItems(items) {
        let data = items.data
        return data.map((movie) => {
            let dataItem = new DataItem("homeArtwork", movie.uid)
            Object.keys(movie).forEach((key) => {
                dataItem.setPropertyPath(key, movie[key])
            })
            return dataItem
        })
    }
    
    setupDocument(document) {
        super.setupDocument(document)
        
        let collectionList = document.getElementsByTagName("collectionList").item(0)
        let url = collectionList.getAttribute("lazyDataURL")
        if (!url) {
            return
        }
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let sections = dataObj.homepage.filter((item) => {
                return item.data !== undefined
            })
            for (let i = 0; i < sections.length; i++) {
               let sectionToAdd = `<shelf>
               <header>
               <title>${sections[i].category.title}</title>
               </header>
               <section binding="items:{items};">
               </section>
               </shelf>`
               collectionList.insertAdjacentHTML('beforeend', sectionToAdd)

               let section = (collectionList.getElementsByTagName("section")).item(i)
               section.dataItem = new DataItem()
               section.dataItem.setPropertyPath("items", this.dataItemsFromJSONItems(sections[i]))
            }
        })
    }
}
registerAttributeName("homeDocumentURL", HomeDocumentController)
