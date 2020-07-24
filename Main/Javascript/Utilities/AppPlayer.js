class AppPlayer {

    constructor(options) {
        if (options && options.event) {
            const linkType = options.event.target['dataItem']['linkType'];
            const source = options.event.target['dataItem']['uid'];
            const title = options.event.target['dataItem']['title'];
            const thumbnail = options.event.target['dataItem']['logo'] || options.event.target['dataItem']['image'];

            if (linkType === 'player' && source !== null) {
                this.playVideo(source, title, thumbnail);
            }
        }
    }

    playVideo(url, title, thumbnail, description, resumeTime, visitStats, skipIntro) {
        if (url === null || url === undefined || url === '') {
            return;
        }

        const video = new MediaItem('video', url);
        video.title = title;
        video.description = description || null;
        video.artworkImageURL = thumbnail || null;
        if (resumeTime) {
            video.resumeTime = resumeTime;
        }

        const player = new Player();
        player.playlist = new Playlist();
        player.playlist.push(video);

        this.setupSkipIntroOverlayOnPlayer(skipIntro, player);
        this.setupVisitStatsListener(visitStats, player);

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

    setupVisitStatsListener(visitStats, player) {
        if (visitStats === null || visitStats === undefined) {
            return;
        }

        function postWatchStats(elapsedTime) {
            if (action === null || action === '') {
                return;
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
                            margin: 0 60 30 0;
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

registerAttributeName("playDirectly", AppPlayer);
