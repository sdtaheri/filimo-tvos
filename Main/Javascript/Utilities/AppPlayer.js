class AppPlayer {

    constructor(options) {
        if (options && options.event) {
            const linkType = options.event.target['dataItem']['linkType'];
            const source = options.event.target['dataItem']['uid'];
            const title = options.event.target['dataItem']['title'];
            const thumbnail = options.event.target['dataItem']['logo'] || options.event.target['dataItem']['image'];

            if (linkType === 'player' || linkType === 'live') {
                if (isValidHttpUrl(source)) {
                    this.playVideo(source, title, thumbnail);
                } else {
                    const dataLoader = new DataLoader(null, new DataParser());
                    dataLoader.fetchLiveInfo(source, (url) => {
                        if (url === null || url === undefined || url === '') {
                            return;
                        }

                        this.playVideo(url, title, thumbnail, url);
                    });
                }
            }
        }
    }

    playVideo(url, title, thumbnail, description, resumeTime, visitStats, skipIntro, uid) {
        if (url === null || url === undefined || url === '') {
            return;
        }

        console.log(url);

        const video = new MediaItem('video', url);
        video.title = title;
        video.description = description || "";
        video.artworkImageURL = thumbnail || null;
        if (resumeTime) {
            video.resumeTime = resumeTime;
        }

        video.loadAssetID = function assetID(url, callback) {
            console.log(`Load AssetID: ${url}`);
            callback(null);
        }

        video.loadCertificate = function certificate(url, callback) {
            console.log(`Load Certificate: ${url}`);
            callback(null);
        }

        video.loadKey = function getKey(url, requestData, callback) {
            console.log(`Load Key: ${url}`);
            callback(null);
        }

        const player = new Player();
        player.playlist = new Playlist();
        player.playlist.push(video);

        this.setupSkipIntroOverlayOnPlayer(skipIntro, player);
        this.setupVisitStatsListener(visitStats, player, uid);

        player.play();
    }

    setupSkipIntroOverlayOnPlayer(skipIntro, player) {
        if (skipIntro && skipIntro.introStart >= 0 && skipIntro.introEnd > 0) {
            const skipIntroDoc = this.createSkipIntroDocument();
            let didAddOverlay = false;

            const introStart = skipIntro.introStart === 0 ? 2 : skipIntro.introStart;

            const overlayTimeDidChangeListener = (event) => {
                if (event.target['playbackState'] !== 'playing') {
                    return;
                }

                const elapsedTime = Math.floor(event['time']);

                if (elapsedTime !== introStart && elapsedTime !== skipIntro.introEnd) {
                    return;
                }

                if (!didAddOverlay && (elapsedTime >= introStart && elapsedTime < skipIntro.introEnd)) {
                    didAddOverlay = true;
                    player.interactiveOverlayDocument = skipIntroDoc;
                    player.interactiveOverlayDismissable = true;
                    return;
                }

                if (didAddOverlay && (elapsedTime >= skipIntro.introEnd || elapsedTime < introStart)) {
                    didAddOverlay = false;
                    player.interactiveOverlayDocument = null;
                }
            }

            skipIntroDoc.getElementById('skipButton').addEventListener('select', () => {
                player.seekToTime(skipIntro.introEnd);
            });

            skipIntroDoc.addEventListener('disappear', () => {
                player.removeEventListener('timeDidChange', overlayTimeDidChangeListener);
            });

            player.addEventListener('timeDidChange', overlayTimeDidChangeListener, { interval: 1 } );
        }
    }

    setupVisitStatsListener(visitStats, player, uid) {
        if (visitStats === null || visitStats === undefined) {
            return;
        }

        function postWatchStats(elapsedTime) {
            if (action === null || action === '') {
                return;
            }

            if (uid !== undefined && uid !== null) {
                resumeTimeObject[`${uid}`] = elapsedTime;
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', action);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.responseType = 'json';
            xhr.onload = () => {
                const visitPost = xhr.response['visitpost'];
                if (visitPost) {
                    action = visitPost['formAction'];
                    id = visitPost['frm-id'] || id;
                }
            };
            xhr.onerror = () => {};

            let payload = `frm-id=${id}&data[user_stat]=`;
            let stat = '[';

            const count = visitStats.callPeriod / 10;
            for (let i = 0; i < count; i++) {
                stat += `{"current_buffer_length":0,"current_player_time":${Math.max(0, elapsedTime - 10 * (count - (i + 1)))},"playing_buffer_time":0,"current_state":"playing","player_type":"appletv","counter":${i * 10 + 10}},`;
            }
            stat = stat.slice(0, -1) + ']';
            payload += stat;

            xhr.send(payload);
        }

        let id = visitStats.id;
        let action = visitStats.action;

        player.addEventListener('timeDidChange', (event) => {
            const elapsedTime = Math.floor(event.time);

            if (elapsedTime < visitStats.callPeriod || action === null) {
                return;
            }

            postWatchStats(elapsedTime);

        }, { interval: visitStats.callPeriod });

        player.addEventListener('stateDidChange', (event) => {
            if (event.state === 'end' || event.state === 'paused') {
                postWatchStats(Math.floor(event['elapsedTime']))
            }
        });
    }

    createSkipIntroDocument() {
        const template = `<?xml version="1.0" encoding="UTF-8" ?>
            <document>
                <head>
                    <style>
                        .skipButton {
                            tv-align: right;
                            tv-position: bottom;
                            tv-text-style: body;
                            margin: 0 60 40 0;
                            padding: 0 20 0 20;
                        }
                    </style>
                </head>
                <divTemplate>
                    <button id="skipButton" class="skipButton">
                        <text>${string_skip_intro}</text>
                    </button>
                </divTemplate>
            </document>
            `;
        return new DOMParser().parseFromString(template, "application/xml");
    }
}

let resumeTimeObject = { };

registerAttributeName("playDirectly", AppPlayer);
