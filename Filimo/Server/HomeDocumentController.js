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
    
    setupLoginButtonAppearance(button) {
        if (isLoggedIn()) {
            button.getElementsByTagName("title").item(0).textContent = "خروج از حساب کاربری"
            button.removeAttribute("loginDocumentURL")
        } else {
            button.getElementsByTagName("title").item(0).textContent = "ورود به حساب کاربری"
            button.setAttribute("loginDocumentURL", "/XMLs/Login.xml")
        }
    }

    handleEvent(event) {
        if (isLoggedIn() && event.target == this._loginButton) {
            let button = this._loginButton
            let setupLoginButtonAppearance = this.setupLoginButtonAppearance
            presentAlertQuestion("خروج از فیلیمو", "آیا می‌خواهید از حساب کاربری خود خارج شوید؟", "بله", "خیر", function() {
                localStorage.removeItem("token")
                localStorage.removeItem("username")
                setupLoginButtonAppearance(button)
            })
        } else {
            super.handleEvent(event)
        }
    }

    setupDocument(document) {
        super.setupDocument(document)
        
        this._loginButton = document.getElementById("loginButton")
        this.setupLoginButtonAppearance(this._loginButton)

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
