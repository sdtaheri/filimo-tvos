class MovieDocumentController extends DocumentController {

    constructor(options) {
        super(options);

        if (options.event) {
            this.movieUid = options.event.target['dataItem']['uid'];
            this.movieTitle = options.event.target['dataItem'].title || null;
            this.movieThumbnail = options.event.target['dataItem'].image || null;
            this.shouldPlayAtLoad = options.event.type === 'play' || options.event.target['dataItem'].shouldPlayAtLoad;
            this.shouldSkipIntro = options.event.target['dataItem'].shouldSkipIntro;
        } else {
            this.movieUid = options.movieUid || null;
            this.movieTitle = null;
            this.movieThumbnail = null;
            this.shouldPlayAtLoad = options.shouldPlayAtLoad;
            this.shouldSkipIntro = options.shouldSkipIntro;
        }

        this.isLoggedInAtLaunch = UserManager.isLoggedIn()

        if (this.movieUid === null) {
            navigationDocument.popDocument();
        }
    }

    setupDocument(document) {
        super.setupDocument(document);

        const loadingTemplate = document.getElementsByTagName('loadingTemplate').item(0);
        const productTemplate = document.getElementsByTagName('productTemplate').item(0);
        const rootNode = productTemplate.parentNode;

        setLoadingVisible.bind(this)(true);

        this.dataLoader.fetchMovie(this.movieUid, (result) => {
            this.movieImage = result.image

            setLoadingVisible.bind(this)(false);

            fillHeaderInfo(result);
            setupActionButtons.bind(this)(result);
            setupRecommendationsShelf(result);
            setupOtherEpisodesOfCurrentSeasonShelf(result);
            setupCastShelf(result);
            setupCommentsShelf(result);

            document.addEventListener('appear', () => {
                if (UserManager.isLoggedIn() !== this.isLoggedInAtLaunch) {
                    setLoadingVisible.bind(this)(true);
                    refreshMovieActions.bind(this)();
                    this.isLoggedInAtLaunch = UserManager.isLoggedIn();
                }
            });

            if (this.shouldPlayAtLoad) {
                setTimeout( () => {
                    handlePlayScenario.bind(this)()
                }, 500)
            }
        });

        function setLoadingVisible(flag) {
            if (flag) {
                const loadingTitle = loadingTemplate.getElementsByTagName('title').item(0);
                const loadingImage = loadingTemplate.getElementsByTagName('heroImg').item(0);

                loadingTitle.textContent = this.movieTitle || string_loading;

                if (this.movieThumbnail && this.movieThumbnail.length > 0) {
                    loadingImage.setAttribute('src', this.movieThumbnail);
                } else {
                    loadingImage.parentNode.removeChild(loadingImage);
                }

                if (productTemplate.parentNode) {
                    rootNode.removeChild(productTemplate);
                }
                if (loadingTemplate.parentNode === undefined) {
                    rootNode.appendChild(loadingTemplate);
                }
            } else {
                if (loadingTemplate.parentNode) {
                    rootNode.removeChild(loadingTemplate);
                }
                if (productTemplate.parentNode === undefined) {
                    rootNode.appendChild(productTemplate);
                }
            }
        }

        function fillHeaderInfo(result) {
            document.getElementById('title').textContent = result.title;
            document.getElementById('englishTitle').textContent = result.titleEn;

            if (result.cover !== undefined && result.cover !== null && result.cover.length > 0) {
                document.getElementById('movieCover').setAttribute('src', result.cover)
                document.getElementById('movieCover2').setAttribute('src', result.cover)

                document.getElementById('productBanner').removeChild(
                  document.getElementById('movieImage')
                )
            } else {
                document.getElementById('movieImage').setAttribute('src', result.image)

                document.getElementsByTagName('productTemplate').item(0).removeChild(
                  document.getElementById('background')
                )
                document.getElementById('productBanner').removeChild(
                    document.getElementById('background2')
                )
            }

            const descriptionElement = document.getElementById('productDescription');
            descriptionElement.textContent = result.desc;
            descriptionElement.addEventListener('select', () => {
                presentAlertDocument('', result.desc, false, true);
            });

            let infoRowToAdd = '';
            if (result.country !== null) {
                infoRowToAdd += `<text>${result.country}</text>`;
            }
            if (result.productionYear !== null) {
                infoRowToAdd += `<text>${result.productionYear}</text>`;
            }
            if (result.duration > 0) {
                infoRowToAdd += `<text>${result.durationText}</text>`;
            }

            if (result.ageRange) {
                infoRowToAdd += `<text>${result.ageRange}</text>`;
            }

            if (result.isDubbed) {
                infoRowToAdd += `<text>${string_dubbed}</text>`;
            }

            if (result.rate.average !== null && result.rate.average > 0) {
                infoRowToAdd += `<organizer><badge class="imdbBadge" srcset="${jsBaseURL}Resources/like.png 1x, ${jsBaseURL}Resources/like@2x.png 2x" width="22" height="22"/>`;
                infoRowToAdd += `<text class="imdbRate">${' ' + string_percent_sign + toPersianDigits(result.rate.average)}</text></organizer>`;
            }
            if (result.rate.imdb !== null && result.rate.imdb > 0) {
                infoRowToAdd += `<organizer><badge class="imdbBadge" srcset="${jsBaseURL}Resources/imdb.png 1x, ${jsBaseURL}Resources/imdb@2x.png 2x" width="45" height="22"/>`;
                infoRowToAdd += `<text class="imdbRate">${result.rate.imdb}</text></organizer>`;
            }

            if (result.isHD) {
                infoRowToAdd += `<badge src="resource://hd" class="hdBadge" />`
            }

            if (result.subtitles.length > 0) {
                infoRowToAdd += `<badge src="resource://cc" class="hdBadge" />`
            }

            document.getElementById('infoRow').insertAdjacentHTML('beforeend', infoRowToAdd);

            const genreInfo = document.getElementById('genreInfo');
            if (result.categories !== null) {
                const header = `<header>
                    <title>${string_genre}</title>
                </header>
                `;
                genreInfo.insertAdjacentHTML('beforeend', header);

                for (let category of result.categories) {
                    const categoryText = `<text>${category}</text>`;
                    genreInfo.insertAdjacentHTML('beforeend', categoryText);
                }
            } else {
                genreInfo.parentNode.removeChild(genreInfo);
            }

            const directorInfo = document.getElementById('directorInfo');
            if (result.directors.length > 0) {
                const header = `<header>
                    <title>${string_director}</title>
                </header>
                `;
                directorInfo.insertAdjacentHTML('beforeend', header);

                for (let director of result.directors) {
                    const name = `<text>${director.name}</text>`;
                    directorInfo.insertAdjacentHTML('beforeend', name);
                }
            } else {
                directorInfo.parentNode.removeChild(directorInfo);
            }

            const actorsInfo = document.getElementById('actorsInfo');
            const actors = result.cast.filter((cast) => {
                return cast.positionEn.toLowerCase() === 'actor';
            });
            if (actors.length > 0) {
                const header = `<header>
                    <title>${string_actors}</title>
                </header>
                `;
                actorsInfo.insertAdjacentHTML('beforeend', header);

                for (let i = 0; i < Math.min(3, actors.length); i++) {
                    const actor = actors[i];
                    const name = `<text>${actor.name}</text>`;
                    actorsInfo.insertAdjacentHTML('beforeend', name);
                }
            } else {
                actorsInfo.parentNode.removeChild(actorsInfo);
            }
        }

        function setupActionButtons(result) {
            const playButton = document.getElementById('playButton');
            const bookmarkButton = document.getElementById('bookmarkButton');
            const previewButton = document.getElementById('previewButton');
            const seasonsButton = document.getElementById('seasonsButton');

            this.wish = result.wish;
            this.watchAction = result.watchAction;
            this.subtitles = result.subtitles;

            playButton.getElementsByTagName('title')
                .item(0)
                .textContent = result.watchAction.buttonText || result.watchAction.price || string_play_movie;

            playButton.addEventListener('select', () => {
                handlePlayScenario.bind(this)();
            });

            playButton.addEventListener('play', () => {
                handlePlayScenario.bind(this)();
            });

            setBookmarkButtonVisuals(bookmarkButton, result.wish.enabled);

            bookmarkButton.addEventListener('select', () => {
                handleBookmarkScenario.bind(this)();
            });

            if (result.trailer) {
                previewButton.addEventListener('select', () => {
                    (new AppPlayer()).playVideo(result.trailer.url, result.trailer.title, result.trailer.thumbnail);
                });
                previewButton.addEventListener('play', () => {
                    (new AppPlayer()).playVideo(result.trailer.url, result.trailer.title, result.trailer.thumbnail);
                })
                previewButton.getElementsByTagName('title').item(0).textContent = string_preview;
            } else {
                previewButton.parentNode.removeChild(previewButton);
            }

            if (result.seasons !== null && result.seasons.rows.length > 1) {
                seasonsButton.getElementsByTagName('title')
                    .item(0).textContent = toPersianDigits(result.seasons.rows.length + ' ' + string_season);
                seasonsButton.serial = {
                    seasons: result.seasons,
                    title: result.serialTitle
                };
            } else {
                seasonsButton.parentNode.removeChild(seasonsButton);
            }
        }

        function setupRecommendationsShelf(result) {
            const recommendationShelf = document.getElementById('recommendationShelf');
            if (result.recommendations.rows.length === 1) {
                document.getElementById('recommendationShelfTitle').textContent = string_recommendations;
                const section = (recommendationShelf.getElementsByTagName('section')).item(0);
                section.dataItem = new DataItem();
                section.dataItem.setPropertyPath("movies", result.recommendations.rows[0].dataItems);
            } else {
                recommendationShelf.parentNode.removeChild(recommendationShelf);
            }
        }

        function setupCastShelf(result) {
            const castShelf = document.getElementById('castShelf');

            if (result.cast.length > 0) {
                castShelf.getElementsByTagName('title').item(0).textContent = string_cast;
                const section = castShelf.getElementsByTagName('section').item(0);
                section.dataItem = new DataItem();
                section.dataItem.setPropertyPath('cast', result.cast);
            } else {
                castShelf.parentNode.removeChild(castShelf);
            }
        }

        function setupCommentsShelf(result) {
            document.getElementById('commentsShelfTitle').textContent = string_comments;
            const ratingCardNode = document.getElementsByTagName('ratingCard').item(0);
            const ratingShelf = document.getElementById('ratingShelf');
            if (result.rate.average !== null) {
                const title = `<title style="tv-minimum-scale-factor: 0.5;">${string_percent_sign + toPersianDigits(result.rate.average) + ' '}<badge srcset="${jsBaseURL}Resources/like.png 1x, ${jsBaseURL}Resources/like@2x.png 2x" width="50" height="50"/></title>`;
                ratingCardNode.insertAdjacentHTML('afterbegin', title);
                ratingCardNode.getElementsByTagName('description').item(0)
                    .textContent = string_average_between_comments(result.rate.count);
            }

            const commentsSection = document.getElementById('commentsSection');
            if (result.comments.items.length > 0) {
                commentsSection.dataItem = new DataItem();
                commentsSection.dataItem.setPropertyPath('comment', result.comments.items);
            } else {
                ratingShelf.removeChild(commentsSection);
            }

            if (result.rate.average === null && result.comments.items.length === 0) {
                ratingShelf.parentNode.removeChild(ratingShelf);
            }
        }

        function setupOtherEpisodesOfCurrentSeasonShelf(result) {
            const allEpisodesShelf = document.getElementById('allEpisodesShelf');
            if (result.isSerial && result.seasons !== null) {
                const episodesOfCurrentSeason = result.seasons.rows[result.seasonId - 1].dataItems;
                if (episodesOfCurrentSeason.length > 0) {
                    const nodesToAdd = `<header>
                        <title>${result.seasons.rows.length > 1 ? `${string_episodes_of_season} ${toPersianDigits(result.seasonId)}` : string_other_episodes}</title>
                        </header>
                        <section binding="items:{movies};">
                        </section>`

                    allEpisodesShelf.insertAdjacentHTML('beforeend', nodesToAdd);
                    const section = allEpisodesShelf.getElementsByTagName('section').item(0);
                    section.dataItem = new DataItem();
                    section.dataItem.setPropertyPath('movies', [...episodesOfCurrentSeason].reverse());
                } else {
                    allEpisodesShelf.parentNode.removeChild(allEpisodesShelf);
                }
            } else {
                allEpisodesShelf.parentNode.removeChild(allEpisodesShelf);
            }
        }

        function handlePlayScenario() {
            if (this.watchAction.movieSource === null || this.watchAction.movieSource === '') {
              return;
            }

            let lastWatchedPosition = getSafe(
                () => {
                    return resumeTimeObject[`${this.movieUid}`]
                },
                this.watchAction.lastWatchedPosition.seconds
            )

            if (this.shouldPlayAtLoad) {
                lastWatchedPosition = 0
            }

            (new AppPlayer()).playVideo(
              this.watchAction.movieSource,
              document.getElementById('title').textContent,
              this.movieImage || '',
              document.getElementById('productDescription').textContent,
              lastWatchedPosition,
              this.watchAction.visitStats,
              this.watchAction.castSkip,
              this.movieUid,
              this.subtitles,
              this.watchAction.nextEpisode,
              this.shouldSkipIntro
            );
        }

        function handleBookmarkScenario() {
            if (UserManager.isLoggedIn()) {
                if (this.wish.link === null || this.wish.link === undefined) {
                    return;
                }

                const newValue = !this.wish.enabled;
                setBookmarkButtonVisuals(null, newValue);

                this.dataLoader.toggleWish(this.wish.link, (enabled) => {
                    this.wish.enabled = enabled;
                    if (enabled !== newValue) {
                        setBookmarkButtonVisuals(null, enabled);
                    }
                }, () => {
                    setBookmarkButtonVisuals(null, !newValue);
                });
            }
        }

        function setBookmarkButtonVisuals(bookmarkButton, isBookmarked) {
            if (bookmarkButton === null) {
                bookmarkButton = document.getElementById('bookmarkButton');
                if (bookmarkButton === undefined || bookmarkButton === null) {
                    return;
                }
            }

            if (isBookmarked) {
                bookmarkButton.getElementsByTagName('badge').item(0).setAttribute('src', 'resource://button-remove');
                bookmarkButton.getElementsByTagName('title').item(0).textContent = string_remove_bookmark;
            } else {
                bookmarkButton.getElementsByTagName('badge').item(0).setAttribute('src', 'resource://button-add');
                bookmarkButton.getElementsByTagName('title').item(0).textContent = string_add_bookmark;
            }

            const loginAttribute = 'loginDocumentURL';
            if (UserManager.isLoggedIn()) {
                if (bookmarkButton.hasAttribute(loginAttribute)) {
                    bookmarkButton.removeAttribute(loginAttribute);
                }
            } else {
                if (!bookmarkButton.hasAttribute(loginAttribute)) {
                    bookmarkButton.setAttribute(loginAttribute, "/XMLs/Login.xml");
                }
            }
        }

        function refreshMovieActions() {
            this.dataLoader.fetchMovie(this.movieUid, (result) => {
                setLoadingVisible.bind(this)(false);

                const playButton = document.getElementById('playButton');
                const bookmarkButton = document.getElementById('bookmarkButton');

                this.wish = result.wish;
                this.watchAction = result.watchAction;
                this.subtitles = result.subtitles;

                playButton.getElementsByTagName('title')
                    .item(0)
                    .textContent = result.watchAction.buttonText || result.watchAction.price || string_play_movie;

                setBookmarkButtonVisuals(bookmarkButton, result.wish.enabled);
            });
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case 'select':
            case 'play': {
                if (event.target.getAttribute('id') === 'playButton') {
                    if (this.watchAction.actionType === 'watch') {
                        return;
                    }

                    if (this.watchAction.actionType === "commingsoon") {
                        const remainingSeconds = (this.watchAction.publishDate.getTime() - new Date().getTime()) / 1000;
                        if (remainingSeconds > 0) {
                            presentAlertDocument(string_movie_available_in(remainingSeconds), "", true, false);
                        }
                    }

                    if (this.watchAction.actionType === 'pay') {
                        presentAlertDocument(
                            event.target.textContent,
                            string_buy_ticket(this.watchAction.price, this.watchAction.currency, this.watchAction.sessionDuration),
                            true,
                            false
                        )
                        return;
                    }

                    if (this.watchAction.actionType !== 'login') {
                        return;
                    }
                }
                break;
            }

            default: break;
        }

        super.handleEvent(event);
    }
}

registerAttributeName("movieDocumentURL", MovieDocumentController);
