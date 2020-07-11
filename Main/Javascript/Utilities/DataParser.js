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
            row.title = item['link_text'] || item['title'];
            row.type = item['output_type'] + '-' + item['theme'];

            const moreType = item['more_type'];
            if (moreType && moreType === 'infinity') {
                row.header = 'grid';
            } else {
                row.header = (row.type === 'poster-theater') ? 'carousel' : 'shelf';
            }

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
                case 'movie-serialList':
                case 'movie-thumbnail': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        const linkKey = encodeURI(movie['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = cleanup(movie['movie_title']);
                        objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
                        objectItem.desc = cleanup(movie['cat_title_str']);
                        objectItem.image = movie['pic']['movie_img_m'];
                        objectItem.cover = movie['movie_cover'] || null;
                        objectItem.logo = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'movie-thumbplay': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        const linkKey = encodeURI(movie['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = cleanup(movie['movie_title']);
                        objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
                        objectItem.desc = null;
                        objectItem.image = movie['thumbplay']['thumbplay_img_b'];
                        objectItem.cover = null;
                        objectItem.logo = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'poster-theater': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        const linkKey = encodeURI(poster['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = null;
                        objectItem.titleEn = null;
                        objectItem.desc = null;
                        objectItem.image = poster['pic'];
                        objectItem.cover = null;
                        objectItem.logo = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = poster['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'poster-brick': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        const linkKey = encodeURI(poster['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = null;
                        objectItem.titleEn = null;
                        objectItem.desc = null;
                        objectItem.image = poster['pic']['pic_brick']['url'];
                        objectItem.cover = null;
                        objectItem.logo = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = poster['link_type'];
                        return objectItem;
                    });
                    break;
                }

                case 'livetv-thumbplay': {
                    row.dataItems = item['livetvs'].data.map((tv) => {
                        const linkKey = encodeURI(tv['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = cleanup(tv['title']);
                        objectItem.titleEn = removeHTMLEntities(tv['title_en']);
                        objectItem.desc = cleanup(tv['desc']);
                        objectItem.image = tv['img'];
                        objectItem.cover = null;
                        objectItem.logo = tv['logo'];
                        objectItem.uid = linkKey;
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

        const dataItems = response.data.map((item) => {
            const linkKey = encodeURI(item['link_key']);
            const objectItem = new DataItem("category", linkKey);
            objectItem.title = cleanup(item['title']);
            objectItem.titleEn = removeHTMLEntities(item['title_en']);
            objectItem.image = item['cover'];
            objectItem.uid = linkKey;
            objectItem.linkType = item['link_type'];
            return objectItem;
        });

        const rows = {};
        rows.title = '';
        rows.type = 'category';
        rows.header = 'grid';
        rows.dataItems = dataItems;

        result.rows = [rows];

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
            const linkKey = encodeURI(movie['link_key']);
            const objectItem = new DataItem('movie-search', linkKey);
            objectItem.title = cleanup(movie['movie_title']);
            objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
            objectItem.image = movie['pic']['movie_img_m'];
            objectItem.uid = linkKey;
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

        let logoutLink = baseURL + '/user/Authenticate/signout';
        if (logoutRow.length > 0) {
            if (logoutRow[0]['link_key']) {
                logoutLink = encodeURI(logoutRow[0]['link_key']);
            }
        }

        let account = response.account;
        let subscriptionText = getSafe(() => { return account.data['profile_state_info']['descr'].text }, null);

        const result = {};

        result.username = username;
        result.mobileNumber = mobileNumber;
        result.logoutLink = logoutLink;
        result.subscriptionText = subscriptionText || null;

        callback(result);
    }

    parseLoginCode(response, callback) {
        const result = {};

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
        const result = {};

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

    parseMovieDetailResponse(responses, callback) {
        function getSafe(fn, defaultVal) {
            try {
                return fn();
            } catch (e) {
                return defaultVal;
            }
        }

        const result = {};

        result.title = getSafe(() => { return responses.one.data['General'].title}, "") |> cleanup;
        result.titleEn = getSafe(() => { return responses.one.data['General']['title_en']}, "");
        result.desc = getSafe(() => { return responses.one.data['General'].desc}, null) |> cleanup;

        const countries = getSafe(() => { return responses.one.data['General']['countries']}, []).map((country) => {
            return country.title;
        }) |> formatList;
        if (countries !== '') {
            result.country = string_product_of + ' ' + countries;
        } else {
            result.country = null;
        }

        result.productionYear = toPersianDigits(getSafe(() => { return responses.one.data['General']['pro_year']}, null));
        result.duration = getSafe(() => { return responses.one.data['General']['duration']['value'] }, 0);
        result.durationText = result.duration |> productDuration;
        result.isHD = getSafe(() => { return responses.one.data['General']['HD']['enable'] }, false);
        result.isSerial = getSafe(() => { return responses.one.data['General']['serial']['enable'] }, false);
        result.imdbRate = getSafe(() => { return responses.one.data['General']['imdb_rate'] }, null);

        result.rate = {};
        result.rate.average = getSafe(() => { return responses.one.data['action_data']['rate']['movie']['percent'] }, null);
        result.rate.count = getSafe(() => { return responses.one.data['action_data']['rate']['movie']['count'] }, null);

        const categories = getSafe(() => { return responses.one.data['General']['categories']}, []).map((category) => {
            return category.title;
        });
        if (categories.length > 0) {
            result.categories = countries;
        } else {
            result.categories = null;
        }

        const actors = getSafe(() => { return responses.detail.data['ActorCrewData']['profile'] }, []).map((actor) => {
            const uid = encodeURI(actor['link_key']);
            const item = new DataItem(actor['link_type'], uid);
            item.name = cleanup(actor.name);
            item.nameEn = actor.nameEn || null;
            item.position = string_actor;
            item.positionEn = 'Actor';
            item.image = actor['profile_image'] || null;
            item.linkKey = uid;
            return item;
        });

        const otherCrewResponse = getSafe(() => { return responses.detail.data['OtherCrewData'] }, []);
        const crew = [];
        for (let data of otherCrewResponse) {
            for (let profile of otherCrewResponse['profile']) {
                const uid = encodeURI(profile['link_key']);
                const item = new DataItem(profile['link_type'], uid);
                item.name = cleanup(profile.name);
                item.nameEn = cleanup(profile.nameEn || null);
                item.position = getSafe(() => { return data['post_info']['title_fa'] }, null);
                item.positionEn = getSafe(() => { return data['post_info']['title_en'] }, null);
                item.image = profile['profile_image'] || null;
                item.linkKey = uid;
                crew.push(item);
            }
        }

        result.cast = actors.concat(crew);
        result.directors = crew.filter((item) => {
            return item.positionEn.toLowerCase() === 'director';
        });


        result.comments = {
            "nextPageURL": getSafe(() => responses.comments['links']['more'], null)
        }
        result.comments.items = getSafe(() => responses.comments['data'], []).map((item) => {
            const attributes = getSafe(() => responses.comments['data']['attributes'], null);
            const uid = attributes['commentid'];
            const dataItem = new DataItem('comment', uid);
            dataItem.uid = uid;
            dataItem.name = attributes['name'] || '';
            dataItem.jalaliDate = attributes['sdate'] || '';
            dataItem.body = attributes['body'] || '';
            return dataItem;
        });


        this.parseVitrineResponse(responses.recommendations, (parsedResponse) => {
            result.recommendations = parsedResponse;
        });

        if (result.isSerial) {
            result.seasonId = result.isSerial ? getSafe(() => { return responses.one.data['General']['serial']['season_id'] }, null) : null;
            result.seasons = [];
            this.parseVitrineResponse(responses.seasons, (parsedSeasons) => {
                result.seasons = parsedSeasons;
            });
        } else {
            result.seasonId = null;
            result.seasons = null;
        }

        result.watchAction = {
            'buttonText': getSafe(() => { return responses.one.data['watch_action']['link_text']}, null),
            'price': getSafe(() => { return responses.one.data['watch_action']['price']}, null),
            'movieSource': getSafe(() => { return responses.one.data['watch_action']['movie_src']}, null),
            'lastWatchedPosition': {
                'percentage': getSafe(() => { return responses.one.data['watch_action']['last_watch_position']['percent']}, 0),
                'seconds': getSafe(() => { return responses.one.data['watch_action']['last_watch_position']['last_second']}, 0)
            },
            'visitStats': {
                'action': getSafe(() => { return responses.one.data['watch_action']['visit_url']['formAction']}, null),
                'id': getSafe(() => { return responses.one.data['watch_action']['visit_url']['frm_id']}, 0),
                'callPeriod': getSafe(() => { return responses.one.data['watch_action']['visit_url']['visitCallPeriod']}, 60)
            },
            'castSkip': {
                'introStart': getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['intro_s']}, null),
                'introEnd': getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['intro_e']}, null),
                'castStart': getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['cast_s']}, null)
            }
        }

        result.wish = {
            'enabled': getSafe(() => { return responses.one.data['action_data']['wish']['enable']}, false),
            'link': getSafe(() => { return responses.one.data['action_data']['wish']['link']}, null)
        }

        result.trailer = getSafe(() => { return responses.detail.data['aparatTrailer']['file_link'] }, null);

        callback(result);
    }
}