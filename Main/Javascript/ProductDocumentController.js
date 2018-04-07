class ProductDocumentController extends DocumentController {
    
    constructor(controllerOptions) {
        super(controllerOptions)  
        if (controllerOptions.event) {
            this._movieUID = controllerOptions.event.target.dataItem.uid
            this._shouldPlayMovie = (controllerOptions.event.type === "play")
        } else if (controllerOptions.movieUID) {
            this._movieUID = controllerOptions.movieUID
            this._shouldPlayMovie = controllerOptions.shouldPlayMovie
        }     
    }

    setupDocument(document) {
        super.setupDocument(document)

        const loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0)
        const productTemplate = document.getElementsByTagName('productTemplate').item(0)
        const mainNode = loadingTemplate.parentNode

        if (this._movieUID == null || this._movieUID == undefined) {
            return
        }

        const dataLoader = this._dataLoader
        const documentLoader = this._documentLoader

        const playButton = document.getElementById("playButton")
        const bookmarkButton = document.getElementById('bookmarkButton')
        const previewButton = document.getElementById('previewButton')
        
        const castsShelf = document.getElementById('castsShelf')

        previewButton.parentNode.removeChild(previewButton)
        mainNode.removeChild(productTemplate)

        let shouldPlay = this._shouldPlayMovie || false
        let moreInfoURL = filimoAPIBaseURL + '/movie/uid/' + this._movieUID
        dataLoader._fetchJSONData(documentLoader.prepareURL(moreInfoURL), (dataObj) => {
            mainNode.removeChild(loadingTemplate)
            mainNode.appendChild(productTemplate)

            let movieInfo = dataObj.movie
            
            document.getElementsByTagName("stack").item(0).getElementsByTagName("title").item(0).textContent = toPersianDigits(movieInfo.movie_title)
            document.getElementById("productDescription").textContent = toPersianDigits(movieInfo.description)
            document.getElementsByTagName("heroImg").item(0).setAttribute("src", movieInfo.movie_img_b)

            document.getElementById("genre1").textContent = movieInfo.category_1
            if (movieInfo.category_2 != null) {
                let genreToAdd = `<text>${movieInfo.category_2}</text>`
                document.getElementById("genreInfo").insertAdjacentHTML('beforeend', genreToAdd)
            }    

            let ratingCardNode = document.getElementsByTagName("ratingCard").item(0)
            let rateValue = null
            if (movieInfo.rate_avrage != null) {
                rateValue = Math.max(0, Math.min(5, movieInfo.rate_avrage))
                ratingCardNode.getElementsByTagName("title").item(0).textContent = toPersianDigits(rateValue + " از " + "5")
                ratingCardNode.getElementsByTagName("ratingBadge").item(0).setAttribute("value", rateValue / 5.0)
                ratingCardNode.getElementsByTagName("description").item(0).textContent = toPersianDigits("میانگین امتیاز از بین " + movieInfo.rate_cnt + " نظر")
            } else {
                ratingCardNode.parentNode.parentNode.parentNode.removeChild(ratingCardNode.parentNode.parentNode)
            }

            let infoRowToAdd = `<text>محصول ${movieInfo.country_1}</text>`
            if (movieInfo.produced_year && movieInfo.produced_year > 0) {
                infoRowToAdd += `<text>${toPersianDigits(movieInfo.produced_year)}</text>`
            }
            infoRowToAdd += `<text>${productDuration(movieInfo)}</text>`
            
            if (rateValue) {
                infoRowToAdd += `<ratingBadge value="${rateValue / 5.0}" />`
            }
            if (movieInfo.hd === 'yes') {
                infoRowToAdd += `<badge src="resource://hd" class="badge" />`
            }
            document.getElementById("infoRow").insertAdjacentHTML('beforeend', infoRowToAdd)

            if (movieInfo.is_serial) {
                let seriesURL = filimoAPIBaseURL + '/movieserial/uid/' + movieInfo.uid
                dataLoader._fetchJSONData(documentLoader.prepareURL(seriesURL), (dataObj) => {
                    let seriesAllEpisodes = dataObj.movieserial
                    
                    let episodesShelf = document.getElementById("allEpisodes")
                    let nodesToAdd = `<header>
                    <title>سایر قسمت‌ها</title>
                    </header>
                    <section binding="items:{episodes};">
                    </section>`
                    episodesShelf.insertAdjacentHTML('beforeend', nodesToAdd)
    
                    episodesShelf.dataItem = new DataItem()
                    episodesShelf.dataItem.setPropertyPath("episodes", dataItemsFromJSONItems(seriesAllEpisodes))    
                })    
            }

            let recommendationSectionNode = document.getElementById("recommendation")
            let recommendationURL = filimoAPIBaseURL + '/recom/uid/' + this._movieUID
            dataLoader._fetchJSONData(documentLoader.prepareURL(recommendationURL), (dataObj) => {
                let movies = dataObj.recom
                recommendationSectionNode.dataItem = new DataItem()
                recommendationSectionNode.dataItem.setPropertyPath("items", dataItemsFromJSONItems(movies))

                document.getElementById("recommendationStaticTitle").textContent = "پیشنهادها"
            })

            let detailInfoURL = filimoAPIBaseURL + '/moviedetail/uid/' + this._movieUID
            dataLoader._fetchJSONData(documentLoader.prepareURL(detailInfoURL), (dataObj) => {
                if (dataObj.moviedetail == null || dataObj.moviedetail == undefined) {
                    return
                }

                if (dataObj.moviedetail.trailer && dataObj.moviedetail.trailer.length > 0) {
                    playButton.parentNode.insertBefore(previewButton, playButton)
                    previewButton.addEventListener('select', (event) => {
                        playTrailer(dataObj.moviedetail.trailer[0])
                    })
                    previewButton.addEventListener('play', (event) => {
                        playTrailer(dataObj.moviedetail.trailer[0])
                    })
                }
                
                if (dataObj.moviedetail.crew && dataObj.moviedetail.crew.length > 0) {
                    let castsSection = castsShelf.getElementsByTagName("section").item(0)
                    castsShelf.getElementsByTagName("title").item(0).textContent = 'عوامل'
                    createLockups(dataObj.moviedetail.crew, castsSection)
                }

                function createLockups(crew, castsSection) {
                    let directorNode = document.getElementById("directorInfo")
                    let actors = []
                    for(let i = 0; i < crew.length; i++) {
                        let item = crew[i]
                        item.profile.forEach((profile) => {
                            if (profile.name_fa == null || profile.name_fa === '') {
                                return
                            }
                            if (item.post_info.title_fa == null || item.post_info.title_fa === '') {
                                return
                            }
                            let names = profile.name_fa.split(' ')
                            if (names.length < 2) {
                                return
                            }
                            let lockup = `<monogramLockup productsListDocumentURL="/XMLs/ProductsList.xml">
                            <monogram firstName="${names[0]}" lastName="${names[names.length - 1]}" />
                                <title>${profile.name_fa}</title>
                                <subtitle>${item.post_info.title_fa}</subtitle>
                            </monogramLockup>`
                            
                            if (item.post_info.title_fa === 'کارگردان' && directorNode.textContent === '') {
                                directorNode.textContent = profile.name_fa
                            }

                            if (item.post_info.title_fa.includes('بازیگر')) {
                                actors.push(profile.name_fa)
                            }
                            castsSection.insertAdjacentHTML('beforeend', lockup)

                            let dataItem = new DataItem()
                            dataItem.setPropertyPath('requestType', 'search')
                            dataItem.setPropertyPath('queryString', profile.name_fa)
                            castsSection.lastChild['dataItem'] = dataItem
                        })
                    }
                    if (directorNode.textContent === '') {
                        directorNode.parentNode.parentNode.removeChild(directorNode.parentNode)
                    } else {
                        directorNode.parentNode.getElementsByTagName('title').item(0).textContent = 'کارگردان'
                    }
                    if (actors.length > 0) {
                        let infoNode = `<info>
                        <header>
                            <title>بازیگران</title>
                        </header>`
                        for (let i = 0; i < Math.min(3, actors.length); i++) {
                            infoNode += `<text>${actors[i]}</text>
                            `
                        }
                        infoNode += '</info>'

                        let infoListNode = document.getElementsByTagName('infoList').item(0)
                        infoListNode.insertAdjacentHTML('beforeend', infoNode)
                    }
                }
            })

            let reviewsURL = filimoAPIBaseURL + '/commentList/uid/' + this._movieUID + '/perpage/25/'
            dataLoader._fetchJSONData(documentLoader.prepareURL(reviewsURL), (dataObj) => {
                let commentList = dataObj.commentlist
                if (commentList && commentList.length > 0) {
                    const reviewsSection = document.getElementById("reviewsSection")
                    commentList.forEach((comment) => {
                        let jalaliDate = t2j(Date.parse(comment.sdate.replace(' ','T')) / 1000, true)
                        let hourSection = comment.sdate.split(' ')[1].substr(0,5)
                        
                        let nodeToAdd = `<reviewCard>
                        <title>${comment.name || comment.username || 'بی نام'}</title>
                        <description>${toPersianDigits(comment.body)}</description>
                        <text>${toPersianDigits(jalaliDate + ' ' + hourSection)}</text>
                        </reviewCard>
                        `
                        reviewsSection.insertAdjacentHTML('beforeend', nodeToAdd)
                    })
                }
            })

            playButton.addEventListener('select', (event) => {
                handlePlayScenario(movieInfo)
            })

            playButton.addEventListener('play', (event) => {
                handlePlayScenario(movieInfo)
            })

            setupBookmarkButton(movieInfo)

            bookmarkButton.addEventListener('select', (event) => {
                handleBookmarkScenario(movieInfo)
            })

            bookmarkButton.addEventListener('appear', (event) => {
                setupBookmarkButton(movieInfo)
            })

            if (shouldPlay) {
                handlePlayScenario(movieInfo)
            }
        })    

        function setupBookmarkButton(movieMoreInfo) {
            if (movieMoreInfo.has_wish) {
                bookmarkButton.getElementsByTagName("badge").item(0).setAttribute('src', 'resource://button-remove')
                bookmarkButton.getElementsByTagName("title").item(0).textContent = 'حذف از نشان‌ها'
            } else {
                bookmarkButton.getElementsByTagName("badge").item(0).setAttribute('src', 'resource://button-add')
                bookmarkButton.getElementsByTagName("title").item(0).textContent = 'افزودن به نشان‌ها'
            }
        }

        function handleBookmarkScenario(movieMoreInfo) {
            if (movieMoreInfo.wish_link && movieMoreInfo.wish_link !== '') {
                movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                setupBookmarkButton(movieMoreInfo)

                let xhr = new XMLHttpRequest()
                xhr.open("POST", movieMoreInfo.wish_link)
                xhr.responseType = "json";
                xhr.onload = () => {
                    let response = xhr.response

                    let success = false
                    if (movieMoreInfo.wish_link.includes('wishadd')) {
                        success = response.wishadd === 'success'
                    } else if (movieMoreInfo.wish_link.includes('wishdel')) {
                        success = response.wishdel === 'success'
                    }
                    if (!success) {
                        movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                        setupBookmarkButton(movieMoreInfo)
                    } else {
                        movieMoreInfo.wish_link = response.link
                    }
                }
                xhr.onerror = () => {
                    movieMoreInfo.has_wish = !movieMoreInfo.has_wish
                    setupBookmarkButton(movieMoreInfo)
                }
                xhr.send()
            }
        }

        function handlePlayScenario(movieInfo) {
            if (isLoggedIn()) {
                if (movieInfo.watch_permision) {
                    playMovie(movieInfo)
                } else {
                    navigationDocument.presentModal(createAlertDocument("خطای پخش", "امکان پخش این فیلم وجود ندارد. اعتبار حساب کاربری خود را بررسی کنید."))
                }
            }
        }

        function playMovie(movieFullInfo) {
            if (movieFullInfo == null) {
                return
            }
            if (movieFullInfo.watch_permision) {
                if (movieFullInfo.watch_action.movie_src && movieFullInfo.watch_action.movie_src != "") {
                    var player = new Player()
                    var video = new MediaItem('video', movieFullInfo.watch_action.movie_src)
                    video.title = toPersianDigits(movieFullInfo.movie_title)
                    video.description = toPersianDigits(movieFullInfo.description)
                    video.resumeTime = movieFullInfo.watch_action.last_watch_position
                    video.artworkImageURL = movieFullInfo.movie_img_b
                  
                    player.playlist = new Playlist()
                    player.playlist.push(video)
                  
                    setPlaybackEventListeners(player, movieFullInfo)

                    player.play()
                }    
            }
        }
        
        function playTrailer(movieTrailer) {
            if (movieTrailer == null) {
                return
            }
            var player = new Player()
            var video = new MediaItem('video', movieTrailer.file_link)
            video.title = movieTrailer.title
            video.artworkImageURL = movieTrailer.thumb
            
            player.playlist = new Playlist()
            player.playlist.push(video)
          
            player.play()
        }

        function setPlaybackEventListeners(currentPlayer, movie) {
            if (movie.visit_url.formAction == null || movie.visit_url.formAction == undefined) {
                return
            }

            let elapsedTime = 0
            let formAction = movie.visit_url.formAction
            let frmID = movie.visit_url["frm-id"]

            currentPlayer.addEventListener("stateDidChange", function(event) {
                if (event.state === 'end') {
                    movie.watch_action.last_watch_position = elapsedTime                    
                }
            });

            currentPlayer.addEventListener("timeDidChange", function(event) {
                elapsedTime = Math.floor(event.time)
                postWatchTime()
            }, { interval: movie.visit_url.visitCallPeriod });

            function postWatchTime() {
                if (elapsedTime < movie.visit_url.visitCallPeriod) {
                    return
                }
                let xhr = new XMLHttpRequest()
                xhr.open("POST", formAction)
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.responseType = 'json'
                xhr.onload = () => {
                    if (xhr.response.visitpost) {
                        formAction = xhr.response.visitpost.formAction
                        frmID = xhr.response.visitpost['frm-id'] || frmID
                    }
                }
                xhr.onerror = () => {
                }

                if (frmID == undefined) {
                    return
                }
                let payload = `frm-id=${frmID}&movie_id=${movie.uid}&movie_type=${movie.is_serial ? 'serial' : 'film'}&`
                payload += 'data[user_stat]='
            
                let stat = "["

                let count = movie.visit_url.visitCallPeriod / 10
                for (let i = 0; i < count; i++) {
                    stat += `{"current_buffer_length":0,"current_player_time":${Math.max(0, elapsedTime - 10 * (count - (i + 1)))},"playing_buffer_time":0,"current_state":"playing","player_type":"tvos","counter":${i * 10 + 10}},`
                }
                stat = stat.slice(0, -1) + ']'
                payload += stat

                xhr.send(payload)
           }
        }

        function productDuration(productInfo) {
            let durationHour = parseInt(productInfo.duration / 60 + "", 10)
            let durationMinute = parseInt(productInfo.duration % 60 + "", 10)
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
            return toPersianDigits(duration)
        }    


        function dataItemsFromJSONItems(items) {
            return items.filter((movie) => { return movie.uid != null }).map((movie) => {
                let dataItem = new DataItem("similarArtwork", movie.uid)
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

    handleEvent(event) {
        if (isLoggedIn() && 
            (event.target.getAttribute("id") === "playButton" || 
            event.target.getAttribute("id") === "bookmarkButton" ||
            event.target.getAttribute("id") === "previewButton")) {
            return
        }
        super.handleEvent(event)
    }
}
registerAttributeName("productDocumentURL", ProductDocumentController)