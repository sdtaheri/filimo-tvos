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
            if (button === undefined || button === null) {
                return
            }

            let attribute = button.getAttribute("loginDocumentURL")
            if (isLoggedIn()) {
                if (attribute !== "") {
                    button.getElementsByTagName("title").item(0).textContent = "خروج"
                    button.getElementsByTagName("badge").item(0).setAttribute("srcset", baseURL + "Resources/logout.png 1x, " + baseURL + "Resources/logout@2x.png 2x")
                    button.removeAttribute("loginDocumentURL")
                }
            } else {
                if (attribute === "") {
                    button.getElementsByTagName("title").item(0).textContent = "ورود"
                    button.getElementsByTagName("badge").item(0).setAttribute("srcset", baseURL + "Resources/login.png 1x, " + baseURL + "Resources/login@2x.png 2x")
                    button.setAttribute("loginDocumentURL", "/XMLs/Login.xml")    
                }
            }
        }    
    }

    setupDocument(document) {

        super.setupDocument(document)

        const loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0)
        const stackTemplate = document.getElementsByTagName('stackTemplate').item(0)
        const mainNode = loadingTemplate.parentNode

        this._loginButton = document.getElementById("loginButton")
        this._reloadButton = document.getElementById("reloadButton")

        const collectionList = document.getElementsByTagName("collectionList").item(0)

        mainNode.removeChild(stackTemplate)

        let url = filimoAPIBaseURL + '/homepage'
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(url), (dataObj) => {
            let sections = dataObj.homepage.filter((item) => {
                return item.data != undefined
            })
            for (let i = 0; i < sections.length; i++) {
               let sectionToAdd = `<shelf>
               <header>
               <title>${toPersianDigits(sections[i].category.title)}</title>
               </header>
               <section>
               </section>
               </shelf>`
               collectionList.insertAdjacentHTML('beforeend', sectionToAdd)

               let section = (collectionList.getElementsByTagName("section")).item(i)
               for (let j = 0; j < (sections[i]).data.length; j++) {
                   let item = ((sections[i]).data)[j]
                   let hasOverlay = item.movie_status_txt && item.movie_status_txt !== ''
                   
                   let lockup = `<lockup productDocumentURL="/XMLs/Product.xml">
                    <img class="${hasOverlay ? 'imageDisabled' : 'image'}" src="${item.movie_img_b}" width="275" height="366" />
                    <title>${toPersianDigits(item.movie_title)}</title>`
                   if (hasOverlay) {
                       lockup += `<overlay>
                       <title class="overlayTitle">${item.movie_status_txt}</title>
                       </overlay>`
                   }
                   lockup += `</lockup>`
                   
                   let dataItem = new DataItem("homeArtwork", item.uid)
                   Object.keys(item).forEach((key) => {
                       let value = item[key]
                       if (key === 'movie_title' || key === 'descr') {
                           value = toPersianDigits(value)
                       }
                       dataItem.setPropertyPath(key, value)
                   })   

                   section.insertAdjacentHTML('beforeend', lockup)
                   let lockupNode = section.getElementsByTagName('lockup').item(j)
                   lockupNode.dataItem = dataItem
               }
            }

            mainNode.removeChild(loadingTemplate)
            mainNode.appendChild(stackTemplate)
        })
    }
}
registerAttributeName("homeDocumentURL", HomeDocumentController)
