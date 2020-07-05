class DataParser {

    parseVitrineResponse(response, itemsCallback) {

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

            if (item['links'] !== undefined) {
                if (item['links']['more_records'] === true) {
                    row.nextPage = item['links']['next'] || null;
                } else {
                    row.nextPage = null;
                }
            } else {
                row.nextPage = null;
            }

            switch (row.type) {
                case 'movie-theater':
                case 'movie-thumbnail': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        let objectItem = new DataItem(row.type, movie['link_key']);
                        objectItem.title = cleanup(movie['movie_title']);
                        objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
                        objectItem.desc = cleanup(movie['cat_title_str']);
                        objectItem.image = movie['pic']['movie_img_m'];
                        objectItem.cover = movie['movie_cover'] || null;
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
                        objectItem.title = cleanup(movie['movie_title']);
                        objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
                        objectItem.desc = null;
                        objectItem.image = movie['thumbplay']['thumbplay_img_b'];
                        objectItem.cover = null;
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
                        objectItem.cover = null;
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
                        objectItem.cover = null;
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
                        objectItem.title = cleanup(tv['title']);
                        objectItem.titleEn = removeHTMLEntities(tv['title_en']);
                        objectItem.desc = cleanup(tv['desc']);
                        objectItem.image = tv['img'];
                        objectItem.cover = null;
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

            if (row.dataItems != null && row.dataItems.length === 0) {
                row.dataItems = null;
            }

            return row;
        }).filter((item) => {
            return item.dataItems != null;
        });

        itemsCallback(result);
    }

    parseCategoriesResponse(response, itemsCallback) {
        let result = {};

        result.meta = response.meta || null;
        result.nextPage = (response.links !== undefined) ? response.links.forward : null;

        result.dataItems = response.data.map((item) => {
            let objectItem = new DataItem("category", item['link_key']);
            objectItem.title = cleanup(item['title']);
            objectItem.titleEn = removeHTMLEntities(item['title_en']);
            objectItem.image = item['cover'];
            objectItem.linkType = item['link_type'];
            return objectItem;
        });

        itemsCallback(result);
    }

    parseSearchResponse(response, itemsCallback) {
        let result = {};

        result.meta = response.meta || null;
        result.nextPage = (response.links !== undefined) ? response.links.forward : null;

        let filteredItems = response.data.filter((item) => {
            return (item['link_type'] + '-' + item['theme']) === 'movie-search';
        });

        result.dataItems = filteredItems.map((movie) => {
            let objectItem = new DataItem('movie-search', movie['link_key']);
            objectItem.title = cleanup(movie['movie_title']);
            objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
            objectItem.image = movie['pic']['movie_img_m'];
            objectItem.uid = movie['link_key'];
            objectItem.linkType = movie['link_type'];
            objectItem.watchFraction = 0;
            return objectItem;
        });

        itemsCallback(result);
    }

    parseProfileResponse(response, callback) {
        function getSafe(fn, defaultVal) {
            try {
                return fn();
            } catch (e) {
                return defaultVal;
            }
        }

        let menu = response.menu;

        let profileFirstRow = getSafe(() => { return menu.data.menu['main_menu'] }, [])
            .filter((item) => {
                return item['link_type'] === 'profile';
        });
        let username = profileFirstRow['link_text'] || UserManager.username();
        let mobileNumber = profileFirstRow['subtitle'] || "";

        let logoutRow = getSafe(() => { return menu.data.menu['profile_menu'] }, [])
            .filter((item) => {
                return item['link_type'] === 'exit';
        });
        let logoutLink = logoutRow['link_key'] || baseURL + 'user/Authenticate/signout';


        let account = response.account;
        let subscriptionText = getSafe(() => { return account.data['profile_state_info']['descr'].text }, null);

        let result = {};

        result.username = username;
        result.mobileNumber = mobileNumber;
        result.logoutLink = logoutLink;
        result.subscriptionText = subscriptionText;

        callback(result);
    }

    parseUserMoviesResponse(bookmarks, history, itemsCallback) {
        this.parseVitrineResponse(bookmarks, (parsedBookmarks) => {
            this.parseVitrineResponse(history, (parsedHistory) => {
                let result = {};
                result.meta = null;
                result.nextPage = null;
                result.rows = parsedBookmarks.rows.concat(parsedHistory.rows);
                itemsCallback(result);
            });
        });
    }

    parseLoginCode(response, callback) {
        let result = {};

        if (response.data !== undefined) {
            result.code = response.data['code'];
            result.qrImage = response.data['qrURL'];
        } else {
            result.code = string_error_getting_login_code;
            result.qrImage = null;
        }

        callback(result);
    }

    parseVerifyCode(response, callback) {
        let result = {};

        if (response['data'] != null && response['data']['attributes'] !== undefined) {
            result.jwtToken = response.data.attributes['jwt'];
            result.username = response.data.attributes['username'];
            result.lToken = response.data.attributes['ltoken'];
        } else {
            result.jwtToken = null;
            result.username = null;
            result.lToken = null;
        }

        callback(result);
    }
}