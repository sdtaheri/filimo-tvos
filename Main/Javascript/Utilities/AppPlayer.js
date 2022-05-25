class AppPlayer {
  constructor (options) {
    if (options && options.event) {
      const linkType = options.event.target['dataItem']['linkType']
      const source = options.event.target['dataItem']['uid']
      const title = options.event.target['dataItem']['title']
      const thumbnail = options.event.target['dataItem']['logo'] ||
        options.event.target['dataItem']['image']

      if (linkType === 'player' || linkType === 'live') {
        if (isValidHttpUrl(source)) {
          this.playVideo(source, title, thumbnail)
        } else {
          const dataLoader = new DataLoader(null, new DataParser())
          dataLoader.fetchLiveInfo(source, (url) => {
            if (url === null || url === undefined || url === '') {
              return
            }

            this.playVideo(url, title, thumbnail, url)
          })
        }
      }
    }
  }

  playVideo (
    url, title, thumbnail, description, resumeTime, visitStats, castSkip, uid,
    subtitles, nextEpisode) {
    if (url === null || url === undefined || url === '') {
      return
    }

    if (subtitles !== undefined && subtitles !== null && subtitles.length > 0 &&
      Device.appVersion > 2203120) {
      this.subtitleProvider = SubtitleProvider.createWithIdUrlSubtitles(
        uid,
        url,
        subtitles,
      )

      this.subtitleProvider.prepareM3U8WithCompletion(
        (result) => {
          url = result
          setTimeout(() => {
            this.loadPlayer(
              url, title, description, thumbnail,
              resumeTime, castSkip, visitStats, uid, true,
              nextEpisode,
            )
          }, 100)
        },
      )
    } else {
      this.loadPlayer(url, title, description, thumbnail, resumeTime,
        castSkip, visitStats, uid, false,
        nextEpisode,
      )
    }
  }

  loadPlayer (
    url, title, description, thumbnail, resumeTime, castSkip, visitStats, uid,
    hasSubtitles, nextEpisode) {
    console.log(url)

    const video = new MediaItem('video', url)
    video.title = title
    video.description = description || ''
    video.artworkImageURL = thumbnail || null
    if (resumeTime) {
      video.resumeTime = resumeTime
    }

    video.loadAssetID = function assetID (url, callback) {
      console.log(`Load AssetID: ${url}`)
      callback(null)
    }

    video.loadCertificate = function certificate (url, callback) {
      console.log(`Load Certificate: ${url}`)
      callback(null)
    }

    video.loadKey = function getKey (url, requestData, callback) {
      console.log(`Load Key: ${url}`)
      callback(null)
    }

    const player = new Player()
    player.playlist = new Playlist()
    player.playlist.push(video)

    this.setupSkipIntroOverlayOnPlayer(castSkip, player)
    this.setupVisitStatsListener(visitStats, player, uid, hasSubtitles)
    this.setupNextEpisodeOverlayOnPlayer(nextEpisode, castSkip, player)

    player.play()
  }

  setupSkipIntroOverlayOnPlayer (skipIntro, player) {
    if (skipIntro && skipIntro.introStart >= 0 && skipIntro.introEnd > 0) {
      const documentLoader = new DocumentLoader(jsBaseURL)
      const documentURL = documentLoader.prepareURL('/XMLs/SkipIntro.xml')
      documentLoader.fetch({
        url: documentURL,
        success: (skipIntroDoc) => {
          let didAddOverlay = false

          const introStart = Math.max(skipIntro.introStart, 1)

          const overlayTimeDidChangeListener = (event) => {
            if (event.target['playbackState'] !== 'playing') {
              return
            }

            const elapsedTime = Math.floor(event['time'])

            if (!didAddOverlay &&
              (elapsedTime >= introStart && elapsedTime < skipIntro.introEnd)) {
              didAddOverlay = true
              player.interactiveOverlayDocument = skipIntroDoc
              player.interactiveOverlayDismissable = true
            } else if (didAddOverlay &&
              (elapsedTime >= skipIntro.introEnd || elapsedTime < introStart)) {
              didAddOverlay = false
              player.interactiveOverlayDocument = null
            }
          }

          skipIntroDoc.getElementById(
            'skipButtonTitle').textContent = string_skip_intro
          skipIntroDoc.getElementById('skipButton').
            addEventListener('select', () => {
              player.seekToTime(skipIntro.introEnd)
              player.interactiveOverlayDocument = null
            })

          skipIntroDoc.addEventListener('disappear', () => {
            player.removeEventListener('timeDidChange',
              overlayTimeDidChangeListener)
          })

          player.addEventListener('timeDidChange', overlayTimeDidChangeListener,
            { interval: 1 })
        },
        error: () => {
        },
      })
    }
  }

  setupVisitStatsListener (visitStats, player, uid, hasSubtitles) {
    if (visitStats === null || visitStats === undefined) {
      return
    }

    function postWatchStats (elapsedTime) {
      if (action === null || action === '') {
        return
      }

      if (uid !== undefined && uid !== null) {
        resumeTimeObject[`${uid}`] = elapsedTime
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', action)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.responseType = 'json'
      xhr.onload = () => {
        const visitPost = xhr.response['visitpost']
        if (visitPost) {
          action = visitPost['formAction']
          id = visitPost['frm-id'] || id
        }
      }
      xhr.onerror = () => {}

      let payload = `frm-id=${id}&data[user_stat]=`
      let stat = '['

      const count = visitStats.callPeriod / 10
      for (let i = 0; i < count; i++) {
        stat += `{"current_buffer_length":0,"current_player_time":${Math.max(0,
          elapsedTime - 10 * (count - (i +
          1)))},"playing_buffer_time":0,"current_state":"playing","player_type":"appletv","counter":${i *
        10 + 10}},`
      }
      stat = stat.slice(0, -1) + ']'
      payload += stat

      xhr.send(payload)
    }

    let id = visitStats.id
    let action = visitStats.action

    const timeDidChangePostStatsHandler = (event) => {
      const elapsedTime = Math.floor(event.time)

      if (elapsedTime < visitStats.callPeriod || action === null) {
        return
      }

      postWatchStats(elapsedTime)
    }

    player.addEventListener('timeDidChange', timeDidChangePostStatsHandler,
      { interval: visitStats.callPeriod })

    player.addEventListener('stateDidChange', (event) => {
      if (event.state === 'end' || event.state === 'paused') {
        postWatchStats(Math.floor(event['elapsedTime']))
        player.removeEventListener('timeDidChange',
          timeDidChangePostStatsHandler)
      }

      if (hasSubtitles && event.state === 'end') {
        this.subtitleProvider.stop()
      }
    })
  }

  setupNextEpisodeOverlayOnPlayer (
    nextEpisode, castSkip, player,
  ) {
    const nextEpisodeUid = getSafe(() => { return nextEpisode.uid }, null)
    if (nextEpisodeUid === null) {
      return
    }

    const nextEpisodeTitle = nextEpisode.title
    const nextEpisodeThumbnail = nextEpisode.thumbnail

    let didAddOverlay = false

    const playerTimeChangeListenerForNextEpisode = (event) => {
      const duration = Math.floor(player.currentMediaItemDuration)
      let castStart = duration - 10.0
      if (castSkip !== undefined && castSkip.castStart !== undefined &&
        castSkip.castStart > 0) {
        castStart = castSkip.castStart
      }

      const elapsedTime = Math.floor(event.time)

      if (!didAddOverlay && elapsedTime >= castStart) {
        const documentLoader = new DocumentLoader(jsBaseURL)
        const documentURL = documentLoader.prepareURL('/XMLs/NextEpisode.xml')
        const remainingSeconds = duration - elapsedTime

        new NextEpisodeDocumentController(
          {
            documentLoader, documentURL,
            nextEpisodeUid, nextEpisodeTitle, nextEpisodeThumbnail,
            player, remainingSeconds,
          }, () => {
            player.removeEventListener('timeDidChange',
              playerTimeChangeListenerForNextEpisode)
          },
        )

        didAddOverlay = true
      }
    }

    player.addEventListener('timeDidChange',
      playerTimeChangeListenerForNextEpisode, { interval: 1 })

    player.addEventListener('stateDidChange', (event) => {
      if (event.state === 'end') {
        didAddOverlay = false
        player.removeEventListener('timeDidChange',
          playerTimeChangeListenerForNextEpisode)
      }
    })
  }
}

let resumeTimeObject = {}

registerAttributeName('playDirectly', AppPlayer)
