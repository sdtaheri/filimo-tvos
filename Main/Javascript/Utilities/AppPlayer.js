class AppPlayer {

    constructor(options) {
        if (options.event) {
            this.linkType = options.event.target['dataItem']['linkType'];
            this.source = options.event.target['dataItem']['uid'];
            this.title = options.event.target['dataItem']['title'];
            this.thumbnail = options.event.target['dataItem']['logo'] || options.event.target['dataItem']['image'];

            if (this.linkType === 'player' && this.source !== null) {
                this.playVideo(this.source, this.title, this.thumbnail);
            }
        }
    }

    playVideo(url, title, thumbnail) {
        if (url === null || url === undefined || url === '') {
            return;
        }

        const video = new MediaItem('video', url);
        video.title = title;
        video.artworkImageURL = thumbnail;

        const player = new Player()
        player.playlist = new Playlist();
        player.playlist.push(video);

        player.play();
    }

}

registerAttributeName("playDirectly", AppPlayer);