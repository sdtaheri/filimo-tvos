class DataParser {

    parseVitrineResponse(response, itemCallback) {

        let availableTypes = ['poster', 'movie', 'livetv'];

        let result = {};
        result.meta = response.meta;
        result.nextPage = (response.links !== undefined) ? response.links.forward : null;

        let filteredItems = response.data.filter((item) => {
            return availableTypes.includes(item['output_type']);
        });

        result.rows = filteredItems.map((item) => {
            let row = {};
            row.title = item['link_text'];
            row.type = item['output_type'] + '-' + item['theme'];

            switch (row.type) {
                case 'movie-theater': {
                    row.dataItems = null;
                    break;
                }

                case 'movie-thumbnail': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        let objectItem = new DataItem(row.type, movie['link_key']);
                        objectItem.title = toPersianDigits(movie['movie_title']);
                        objectItem.titleEn = movie['movie_title_en'];
                        objectItem.desc = null;
                        objectItem.image = movie['pic']['movie_img_m'];
                        objectItem.logo = null;
                        objectItem.uid = movie['link_key'];
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'movie-thumbplay': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        let objectItem = new DataItem(row.type, movie['link_key']);
                        objectItem.title = toPersianDigits(movie['movie_title']);
                        objectItem.titleEn = movie['movie_title_en'];
                        objectItem.desc = null;
                        objectItem.image = movie['thumbplay']['thumbplay_img_b'];
                        objectItem.logo = null;
                        objectItem.uid = movie['link_key'];
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'poster-theater': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        let objectItem = new DataItem(row.type, poster['link_key']);
                        objectItem.title = null;
                        objectItem.titleEn = null;
                        objectItem.desc = null;
                        objectItem.image = poster['pic'];
                        objectItem.logo = null;
                        objectItem.uid = poster['link_key'];
                        objectItem.linkType = poster['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'poster-brick': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        let objectItem = new DataItem(row.type, poster['link_key']);
                        objectItem.title = null;
                        objectItem.titleEn = null;
                        objectItem.desc = null;
                        objectItem.image = poster['pic']['pic_brick']['url'];
                        objectItem.logo = null;
                        objectItem.uid = poster['link_key'];
                        objectItem.linkType = poster['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'livetv-thumbplay': {
                    row.dataItems = item['livetvs'].data.map((tv) => {
                        let objectItem = new DataItem(row.type, tv['link_key']);
                        objectItem.title = toPersianDigits(tv['title']);
                        objectItem.titleEn = tv['title_en'];
                        objectItem.desc = toPersianDigits(tv['desc']);
                        objectItem.image = tv['img'];
                        objectItem.logo = tv['logo'];
                        objectItem.uid = tv['link_key'];
                        objectItem.linkType = tv['link_type'];
                        return objectItem;
                    });
                    break;
                }

                default:
                    row.dataItems = null;
                    break;
            }

            return row;
        }).filter((item) => {
            return item.dataItems != null;
        });

        itemCallback(result);
    }
}