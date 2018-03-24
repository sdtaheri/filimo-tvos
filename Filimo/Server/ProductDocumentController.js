class ProductDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions)        
        this._productInfo = controllerOptions.event.target.dataItem
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

    setupDocument(document) {
        super.setupDocument(document)

        let stack = document.getElementsByTagName("stack").item(0)
        
        stack.getElementsByTagName("title").item(0).textContent = this._productInfo.movie_title
        document.getElementById("productDescription").textContent = this._productInfo.descr

        let infoRowToAdd = `
                <text>ساخت ${this._productInfo.country_1}</text>
                <text>گروه سنی: ${this._productInfo.audience}</text>
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
    }

}
registerAttributeName("productDocumentURL", ProductDocumentController)