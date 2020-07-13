class MovieDocumentController extends DocumentController {

    constructor(options) {
        super(options);

        if (options.event) {
            this.movieUid = options.event.target['dataItem']['uid'];
            this.movieTitle = options.event.target['dataItem'].title || null;
            this.movieTumbnail = options.event.target['dataItem'].image || null;
            this.shouldPlayAtLoad = options.event.type === 'play';
        } else {
            this.movieUid = options.movieUid || null;
            this.movieTitle = null;
            this.movieTumbnail = null;
            this.shouldPlayAtLoad = options.shouldPlayAtLoad || false;
        }

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
            setLoadingVisible(false);

            fillHeaderInfo(result);
            setupActionButtons(result);
            setupRecommendationsShelf(result);
            setupOtherEpisodesOfCurrentSeasonShelf(result);
            setupCastShelf(result);

            document.getElementById('commentsShelfTitle').textContent = string_comments;
            const ratingCardNode = document.getElementsByTagName('ratingCard').item(0);
            const ratingShelf = document.getElementById('ratingShelf');
            if (result.rate.average !== null) {
                ratingCardNode.getElementsByTagName('title').item(0)
                    .textContent = string_rating + ' ' + toPersianDigits(result.rate.average) + string_percent_sign;
                ratingCardNode.getElementsByTagName('ratingBadge').item(0)
                    .setAttribute("value", result.rate.average / 100.0 + '');
                ratingCardNode.getElementsByTagName('description').item(0)
                    .textContent = string_average_between_comments(result.rate.count);
            }

            const commentsSection = document.getElementById('commentsSection');
            if (result.comments.items.length > 0) {
                commentsSection.dataItem = new DataItem();
                commentsSection.dataItem.setPropertyPath("comment", result.comments.items);
            } else {
                ratingShelf.removeChild(commentsSection);
            }

            if (result.rate.average === null && result.comments.items.length === 0) {
                ratingShelf.parentNode.removeChild(ratingShelf);
            }
        });

        function setLoadingVisible(flag) {
            if (flag) {
                const loadingTitle = loadingTemplate.getElementsByTagName('title').item(0);
                const loadingImage = loadingTemplate.getElementsByTagName('heroImg').item(0);

                loadingTitle.textContent = this.movieTitle || string_loading;

                if (this.movieTumbnail && this.movieTumbnail.length > 0) {
                    loadingImage.setAttribute('src', this.movieTumbnail);
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
            document.getElementById('productDescription').textContent = result.desc;
            document.getElementsByTagName('heroImg').item(0).setAttribute('src', result.image);

            let infoRowToAdd = '';
            if (result.country !== null) {
                infoRowToAdd += `<text>${result.country}</text>`;
            }
            if (result.productionYear !== null) {
                infoRowToAdd += `<text>${result.productionYear}</text>`;
            }
            infoRowToAdd += `<text>${result.durationText}</text>`;

            if (result.rate.average !== null && result.rate.average > 0) {
                infoRowToAdd += `<ratingBadge value="${result.rate.average / 100.0}" />`
            }
            if (result.rate.imdb !== null && result.rate.imdb > 0) {
                infoRowToAdd += `<organizer><badge class="imdbBadge" srcset="${jsBaseURL}Resources/imdb.png 1x, ${jsBaseURL}Resources/imdb@2x.png 2x" width="45" height="22"/>`;
                infoRowToAdd += `<text class="imdbRate">${result.rate.imdb}</text></organizer>`;
            }

            if (result.isHD) {
                infoRowToAdd += `<badge src="resource://hd" class="hdBadge" />`
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

            playButton.getElementsByTagName('title')
                .item(0)
                .textContent = result.watchAction.buttonText || result.watchAction.price || string_play_movie;

            playButton.addEventListener('select', () => {
                handlePlayScenario();
            });

            playButton.addEventListener('play', () => {
                handlePlayScenario();
            });

            setBookmarkButtonVisuals(bookmarkButton, result.wish.enabled);

            bookmarkButton.addEventListener('select', () => {
                handleBookmarkScenario();
            });

            if (result.trailer) {
                previewButton.addEventListener('select', () => {
                    playTrailer(result.trailer.url, result.trailer.title, result.trailer.thumbnail);
                });
                previewButton.addEventListener('play', () => {
                    playTrailer(result.trailer.url, result.trailer.title, result.trailer.thumbnail);
                })
                previewButton.getElementsByTagName('title').item(0).textContent = string_preview;
            } else {
                previewButton.parentNode.removeChild(previewButton);
            }

            if (result.seasons !== null && result.seasons.rows.length > 1) {
                seasonsButton.getElementsByTagName('title')
                    .item(0).textContent = toPersianDigits(result.seasons.rows.length + ' ' + string_season);
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
                    section.dataItem.setPropertyPath('movies', episodesOfCurrentSeason.reverse());
                } else {
                    allEpisodesShelf.parentNode.removeChild(allEpisodesShelf);
                }
            } else {
                allEpisodesShelf.parentNode.removeChild(allEpisodesShelf);
            }
        }

        function playTrailer(url, title, thumbnail) {
            if (url === null || url === undefined) {
                return;
            }
            const player = new Player();
            const video = new MediaItem('video', url);
            video.title = title;
            video.artworkImageURL = thumbnail;

            player.playlist = new Playlist();
            player.playlist.push(video);

            player.play();
        }

        function handlePlayScenario() {

        }

        function handleBookmarkScenario(link) {
            if (link === null || link === undefined) {
                return;
            }
            if (UserManager.isLoggedIn()) {

            }
        }

        function setBookmarkButtonVisuals(bookmarkButton, isBookmarked) {
            if (isBookmarked) {
                bookmarkButton.getElementsByTagName('badge').item(0).setAttribute('src', 'resource://button-remove');
                bookmarkButton.getElementsByTagName('title').item(0).textContent = string_remove_bookmark;
            } else {
                bookmarkButton.getElementsByTagName('badge').item(0).setAttribute('src', 'resource://button-add');
                bookmarkButton.getElementsByTagName('title').item(0).textContent = string_add_bookmark;
            }
        }
    }

    handleEvent(event) {
        if (UserManager.isLoggedIn()) {
            const targetId = event.target.getAttribute('id');
            if (targetId === 'playButton' || targetId === 'bookmarkButton') {
                return;
            }
        }
        super.handleEvent(event);
    }
}

registerAttributeName("movieDocumentURL", MovieDocumentController);
