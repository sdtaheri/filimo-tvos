class HomeDocumentController extends DocumentController {
        
    handleEvent(event) {
        if (isLoggedIn() && event.target == this._loginButton) {
            let button = this._loginButton
            presentAlertQuestion("خروج از فیلیمو", "آیا می‌خواهید از حساب کاربری خود خارج شوید؟", "بله", "خیر", function() {
                                 localStorage.removeItem("token")
                                 localStorage.removeItem("username")
                                 setupLoginButtonAppearance(button)
                                 })
        } else if (event.type === "appear") {
            setupLoginButtonAppearance(this._loginButton)
        } else if (event.type === 'select' && event.target == this._reloadButton) {
            App.reload()
        } else {
            super.handleEvent(event)
        }

        function setupLoginButtonAppearance(button) {
            if (button === "undefined" || button === "null") {
                return
            }
            if (isLoggedIn()) {
                button.getElementsByTagName("title").item(0).textContent = "خروج"
                button.getElementsByTagName("badge").item(0).setAttribute("srcset", baseURL + "Resources/logout.png 1x, " + baseURL + "Resources/logout@2x.png 2x")
                button.removeAttribute("loginDocumentURL")
            } else {
                button.getElementsByTagName("title").item(0).textContent = "ورود"
                button.getElementsByTagName("badge").item(0).setAttribute("srcset", baseURL + "Resources/login.png 1x, " + baseURL + "Resources/login@2x.png 2x")
                button.setAttribute("loginDocumentURL", "/XMLs/Login.xml")
            }
        }    
    }

    setupDocument(document) {
        super.setupDocument(document)
        
        this._loginButton = document.getElementById("loginButton")
        this._reloadButton = document.getElementById("reloadButton")

        let collectionList = document.getElementsByTagName("collectionList").item(0)
        let url = filimoAPIBaseURL + '/homepage'
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let sections = dataObj.homepage.filter((item) => {
                return item.data !== undefined
            })
            for (let i = 0; i < sections.length; i++) {
               let sectionToAdd = `<shelf>
               <header>
               <title>${toPersianDigits(sections[i].category.title)}</title>
               </header>
               <section binding="items:{items};">
               </section>
               </shelf>`
               collectionList.insertAdjacentHTML('beforeend', sectionToAdd)

               let section = (collectionList.getElementsByTagName("section")).item(i)
               section.dataItem = new DataItem()
               section.dataItem.setPropertyPath("items", dataItemsFromJSONItems(sections[i]))
            }
        })

        function dataItemsFromJSONItems(items) {
            let data = items.data
            return data.map((movie) => {
                let dataItem = new DataItem("homeArtwork", movie.uid)
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
registerAttributeName("homeDocumentURL", HomeDocumentController)
