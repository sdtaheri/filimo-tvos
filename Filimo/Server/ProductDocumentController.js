class ProductDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions)        
        this._productInfo = controllerOptions.event.target.dataItem
        this._shouldPlayMovie = (controllerOptions.event.type === "play")
    }

    productDuration() {
        let durationHour = parseInt(this._productInfo.duration / 60 + "", 10)
        let durationMinute = parseInt(this._productInfo.duration % 60 + "", 10)
        let duration = ""
        if (durationHour > 0) {
            duration += durationHour + " ساعت"
        }
        if (durationMinute > 0) {
            if (duration !== "") {
                duration += " و "
            }
            duration += durationMinute + " دقیقه"
        }
        return duration
    }

    dataItemsFromJSONItems(items) {
        return items.filter((movie) => { return movie.uid != null }).map((movie) => {
            let dataItem = new DataItem("similarArtwork", movie.uid)
            Object.keys(movie).forEach((key) => {
                dataItem.setPropertyPath(key, movie[key])
            })
            return dataItem
        })
    }

    setupDocument(document) {
        super.setupDocument(document)

        let moreInfoURL = 'https://www.filimo.com/etc/api/movie/uid/' + this._productInfo.uid + "/devicetype/tvweb"

        let shouldPlay = this._shouldPlayMovie
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(moreInfoURL), (dataObj) => {
            this._movieMoreInfo = dataObj.movie
            
            if (this._movieMoreInfo.produced_year > 0) {
                let yearInfo = `<text>${this._movieMoreInfo.produced_year}</text>`
                document.getElementById("infoRow").firstElementChild.insertAdjacentHTML('afterend', yearInfo)
            }

            if (shouldPlay) {
                let button = document.getElementById("playButton")
                button.select()
            }
        })    

        if (this._productInfo.is_serial) {
            let seriesURL = 'https://www.filimo.com/etc/api/movieserial/uid/' + this._productInfo.uid + "/devicetype/tvweb"
            this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(seriesURL), (dataObj) => {
                let seriesAllEpisodes = dataObj.movieserial
                
                let episodesShelf = document.getElementById("allEpisodes")
                let nodesToAdd = `<header>
                <title>سایر قسمت‌ها</title>
                </header>
                <section binding="items:{episodes};">
                </section>`
                episodesShelf.insertAdjacentHTML('beforeend', nodesToAdd)

                episodesShelf.dataItem = new DataItem()
                episodesShelf.dataItem.setPropertyPath("episodes", this.dataItemsFromJSONItems(seriesAllEpisodes))    
            })    
        }

        let stack = document.getElementsByTagName("stack").item(0)
        
        stack.getElementsByTagName("title").item(0).textContent = this._productInfo.movie_title
        document.getElementById("productDescription").textContent = this._productInfo.descr

        let infoRowToAdd = `
                <text>محصول ${this._productInfo.country_1}</text>
                <text>${this.productDuration()}</text>`
        if (this._productInfo.hd) {
            infoRowToAdd += `
            <badge src="resource://hd" class="badge" />`
        }
        document.getElementById("infoRow").insertAdjacentHTML('beforeend', infoRowToAdd)

        let heroImg = document.getElementsByTagName("heroImg").item(0)
        heroImg.setAttribute("src", this._productInfo.movie_img_b)

        document.getElementById("genre1").textContent = this._productInfo.category_1
        if (this._productInfo.category_2 != null) {
            let genreToAdd = `<text>${this._productInfo.category_2}</text>`
            document.getElementById("genreInfo").insertAdjacentHTML('beforeend', genreToAdd)
        }

        let directorNode = document.getElementById("directorInfo")
        if (this._productInfo.director_fa == null) {
            directorNode.parentNode.parentNode.removeChild(directorNode.parentNode)
        } else {
            directorNode.textContent = this._productInfo.director_fa 
        }

        let ratingCardNode = document.getElementsByTagName("ratingCard").item(0)
        if (this._productInfo.rate_avrage != null) {
            ratingCardNode.getElementsByTagName("title").item(0).textContent = this._productInfo.rate_avrage + " از " + "5"
            ratingCardNode.getElementsByTagName("ratingBadge").item(0).setAttribute("value", this._productInfo.rate_avrage / 5.0)
            ratingCardNode.getElementsByTagName("description").item(0).textContent = "میانگین امتیاز از بین " + this._productInfo.rate_cnt + " نظر"
        } else {
            ratingCardNode.parentNode.parentNode.parentNode.removeChild(ratingCardNode.parentNode.parentNode)
        }

        let recommendationSectionNode = document.getElementById("recommendation")
        let recommendationURL = 'https://www.filimo.com/etc/api/recom/uid/' + this._productInfo.uid + "/devicetype/tvweb"
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(recommendationURL), (dataObj) => {
            let movies = dataObj.recom
            recommendationSectionNode.dataItem = new DataItem()
            recommendationSectionNode.dataItem.setPropertyPath("items", this.dataItemsFromJSONItems(movies))

            document.getElementById("recommendationStaticTitle").textContent = "پیشنهادها"
        })

    }

    handleEvent(event) {
        if (event.target.getAttribute("id") === "playButton") {
            if (isLoggedIn()) {
                if (this._movieMoreInfo.watch_permision) {
                    playMovie(this._movieMoreInfo)
                } else {
                    navigationDocument.presentModal(createAlertDocument("خطای پخش", "امکان پخش این فیلم وجود ندارد. اعتبار حساب کاربری خود را بررسی کنید."))
                }
            } else {
                super.handleEvent(event)
            }    
        } else {
            super.handleEvent(event)
        }
    }
}
registerAttributeName("productDocumentURL", ProductDocumentController)