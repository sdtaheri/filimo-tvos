class LoginController extends DocumentController {


    setupDocument(document) {
        super.setupDocument(document)

        const description = document.getElementById("descTitle");
        description.textContent = string_login_description();

        this.dataLoader.fetchLoginCode((result) => {
            const image = document.getElementById("codeImage");
            const codeText = document.getElementById("verificationCode");

            codeText.textContent = result.code;
            image.setAttribute("src", result.qrImage);

            let refreshIntervalId = setInterval(() => {
                this.dataLoader.verifyLogin(result.code, (verificationResult) => {
                    if (verificationResult.jwtToken != null) {
                        clearInterval(refreshIntervalId);
                        UserManager.setJwtToken(verificationResult.jwtToken);
                        UserManager.setUsername(verificationResult.username);
                        UserManager.setLToken(verificationResult.lToken);

                        navigationDocument.popDocument();
                    }
                });
            }, 5000);
            this._refreshIntervalId = refreshIntervalId
        });
    }

    handleEvent(event) {
        if (event.type === "unload") {
            clearInterval(this._refreshIntervalId)
        }
        super.handleEvent(event)
    }
}
registerAttributeName("loginDocumentURL", LoginController)