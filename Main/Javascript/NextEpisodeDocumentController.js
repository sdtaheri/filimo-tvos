class NextEpisodeDocumentController extends DocumentController {
  constructor (options, dismissHandler) {
    super(options)

    this.nextEpisodeTitle = options.nextEpisodeTitle || ''
    this.nextEpisodeThumbnail = options.nextEpisodeThumbnail || null
    this.nextEpisodeUid = options.nextEpisodeUid
    this.remainingSeconds = Math.min(Math.floor((options.remainingSeconds || 14) / 2.0), 7)
    this.player = options.player
    this.dismissHandler = dismissHandler
  }

  setupDocument (document) {
    super.setupDocument(document)

    document.addEventListener('disappear', this.handleEvent)

    document.getElementById('title').textContent = this.nextEpisodeTitle
    document.getElementById('image').
      setAttribute('src', this.nextEpisodeThumbnail)

    const countDownTitle = document.getElementById('countDownTitle')
    countDownTitle.textContent = string_next_episode

    setTimeout(() => {
      this.player.interactiveOverlayDocument = document

      this.intervalId = setInterval(() => {
        if (this.player.interactiveOverlayDocument === null) {
          clearInterval(this.intervalId)
          return
        } else {
          countDownTitle.textContent = string_play_in_seconds(
            this.remainingSeconds)
          this.remainingSeconds -= 1.0
        }

        if (this.remainingSeconds < 0.0) {
          clearInterval(this.intervalId)

          const event = new Event('select')
          Object.defineProperty(event, 'target',
            { writable: false, value: document.getElementById('card') })
          this.handleEvent(event)
        }
      }, 1000)
    }, 500)
  }

  handleDocument (document, loadingDocument) {
  }

  handleEvent (event) {
    switch (event.type) {
      case 'unload':
      case 'disappear': {
        this.player.interactiveOverlayDocument = null
        clearInterval(this.intervalId)
        this.dismissHandler()
        break
      }
      case 'select':
      case 'play': {
        if (event.target.getAttribute('id') === 'card') {
          let dataItem = new DataItem()
          dataItem.uid = this.nextEpisodeUid
          dataItem.title = this.nextEpisodeTitle
          dataItem.image = this.nextEpisodeThumbnail
          dataItem.shouldPlayAtLoad = true
          event.target.dataItem = dataItem

          this.player.interactiveOverlayDocument = null
          this.player.stop()

          setTimeout(() => {
            navigationDocument.popDocument()
            setTimeout(() => {
              super.handleEvent(event)
            }, 500)
          }, 500)

          return
        }
        break
      }

      default:
        break
    }

    super.handleEvent(event)
  }
}
