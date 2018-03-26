class LoginController extends DocumentController {

    verificationCodeReceived(code, document) {
        document.getElementById("verificationCode").textContent = code

        let dataLoader = this._dataLoader
        let documentLoader = this._documentLoader
        let refreshIntervalId = setInterval(function() {
            let verifyURL = 'https://www.filimo.com/etc/api/verifycodecheck/ref_type/tv/code/' 
            + code + '/devicetype/tvweb'
            dataLoader._fetchJSONData(documentLoader.prepareURL(verifyURL), (dataObj) => {
            let token = dataObj.verifycodecheck.ltoken
            if (token !== null && token !== undefined) {
                clearInterval(refreshIntervalId)
                localStorage.setItem("token", token)
                localStorage.setItem("username", dataObj.verifycodecheck.username)

                navigationDocument.dismissModal()
            }
        })
        }, 5000)
        this._refreshIntervalId = refreshIntervalId
    }

    setupDocument(document) {
        super.setupDocument(document)

        let verifyCodeGetURL = 'https://www.filimo.com/etc/api/verifycodeget/devicetype/tvweb'
        this._dataLoader._fetchJSONData(this._documentLoader.prepareURL(verifyCodeGetURL), (dataObj) => {
            this.verificationCodeReceived(dataObj.verifycodeget.code, document)
        })
    }

    handleDocument(document, loadingDocument) {
        navigationDocument.presentModal(document);
        if (loadingDocument) {
            navigationDocument.removeDocument(loadingDocument);
        }
    }

    handleEvent(event) {
        clearInterval(this._refreshIntervalId)
    }
}
registerAttributeName("loginDocumentURL", LoginController)