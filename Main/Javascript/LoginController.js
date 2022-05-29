class LoginController extends DocumentController {

  setupDocument (document) {
    super.setupDocument(document)

    const description1 = document.getElementById('descContainer1')
    const description2 = document.getElementById('descContainer2')
    description1.textContent = string_login_description()
    description2.textContent = string_login_description_use_qr_code

    this.dataLoader.fetchLoginCode((result) => {
      const image = document.getElementById('codeImage')
      const codeText = document.getElementById('verificationCode')

      codeText.textContent = result.code
      image.setAttribute('src', result.qrImage)

      let refreshIntervalId = setInterval(() => {
        this.dataLoader.verifyLogin(result.code, (verificationResult) => {
          if (verificationResult.jwtToken !== null) {
            clearInterval(refreshIntervalId)
            UserManager.setJwtToken(verificationResult.jwtToken)
            UserManager.setUsername(verificationResult.username)
            UserManager.setLToken(verificationResult.lToken)
            UserManager.needsHomePageRefresh = true

            navigationDocument.popDocument()
          }
        })
      }, 5000)
      this._refreshIntervalId = refreshIntervalId
    })
  }

  handleEvent (event) {
    if (event.type === 'unload') {
      clearInterval(this._refreshIntervalId)
    }
    super.handleEvent(event)
  }
}

registerAttributeName('loginDocumentURL', LoginController)
