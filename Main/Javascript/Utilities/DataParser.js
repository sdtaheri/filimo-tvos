class DataParser {

    parseVitrineResponse(response, itemsCallback) {

        let availableTypes = ['poster', 'movie', 'livetv', 'crew', 'headerslider'];

        let result = {};
        result.meta = response.meta;
        result.nextPage = (response.links !== undefined) ? response.links.forward : null;

        let filteredItems = response.data.filter((item) => {
            return availableTypes.includes(item['output_type']);
        });

        result.rows = filteredItems.map((item) => {
            let row = {};
            row.title = cleanup((item['link_text'] || item['title'] || '').replace('  ', ' '));
            if (item["theme"] && item["theme"].length > 0) {
                row.type = item['output_type'] + '-' + item['theme'];
            } else {
                row.type = item['output_type'];
            }

            const moreType = item['more_type'];
            if (moreType && moreType === 'infinity') {
                row.header = 'grid';
            } else {
                row.header = (row.type === 'poster-theater' || row.type === "headerslider") ? 'carousel' : 'shelf';
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
                case 'headerslider':
                    row.dataItems = item['headersliders'].data.map((movie) => {
                        if (!movie['link_key']) {
                            return null;
                        }
                        const linkKey = encodeURI(movie['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = cleanup(movie['title']);
                        objectItem.titleEn = null;
                        objectItem.desc = cleanup(movie['desc']);
                        objectItem.image = getSafe(() => { return movie["cover_mobile"][0]; }, null);
                        objectItem.cover = getSafe(() => { return movie["cover_desktop"][0]; }, null);
                        objectItem.logo = movie["logo"] || "";
                        objectItem.watchFraction = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    }).filter(Boolean);
                    break;
                case 'movie-theater':
                case 'movie-serialList':
                case 'movie-thumbnail': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        if (!movie['link_key']) {
                            return null;
                        }
                        const linkKey = encodeURI(movie['link_key']);
                        const objectItem = new DataItem(row.type, linkKey);
                        objectItem.title = cleanup(movie['movie_title']);
                        objectItem.titleEn = removeHTMLEntities(movie['movie_title_en']);
                        objectItem.desc = cleanup(movie['cat_title_str']);
                        objectItem.image = movie['pic']['movie_img_m'];
                        objectItem.cover = movie['movie_cover'] || null;
                        objectItem.logo = null;
                        objectItem.watchFraction = getSafe(() => { return movie['last_watch']['percent'] / 100.0 }, null);
                        if (objectItem.watchFraction === null) {
                            objectItem.watchFraction = getSafe(() => { return movie['user_watched_info']['percent'] / 100.0 }, 0.0);
                        }
                        objectItem.uid = linkKey;
                        objectItem.linkType = movie['link_type'];
                        return objectItem;
                    }).filter(Boolean);
                    break;
                }

                case 'movie-thumbplay': {
                    row.dataItems = item['movies'].data.map((movie) => {
                        if (!movie['link_key']) {
                            return null;
                        }
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
                    }).filter(Boolean);
                    break;
                }

                case 'poster-theater': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        if (!poster['link_key']) {
                            return null;
                        }
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
                    }).filter(Boolean);
                    break;
                }

                case 'poster-brick': {
                    row.dataItems = item['posters'].data.map((poster) => {
                        if (!poster['link_key']) {
                            return null;
                        }
                        const linkKey = encodeURI(poster['link_key']);

                        let type = row.type;
                        if (poster["link_type"] === "list") {
                            type = "poster-brick-list";
                            row.type = type;
                        }

                        const objectItem = new DataItem(type, linkKey);
                        objectItem.title = null;
                        objectItem.titleEn = null;
                        objectItem.desc = null;
                        objectItem.image = poster['pic']['pic_brick']['url'];
                        objectItem.cover = null;
                        objectItem.logo = null;
                        objectItem.uid = linkKey;
                        objectItem.linkType = poster['link_type'];
                        return objectItem;
                    }).filter(Boolean);
                    break;
                }

                case 'livetv-thumbplay': {
                    row.dataItems = item['livetvs'].data.map((tv) => {
                        if (!tv['link_key']) {
                            return null;
                        }
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
                    }).filter(Boolean);
                    break;
                }

                case 'crew-single': {
                    row.dataItems = item['crews'].data.map((crew) => {
                        if (!crew.id) {
                            return null;
                        }
                        const objectItem = new DataItem(row.type, crew.id);
                        const names = crew['name'];
                        objectItem.title = cleanup(names.split('*')[0]);
                        objectItem.titleEn = removeHTMLEntities(names.split('*')[1] || null);
                        const initials = (objectItem.titleEn || objectItem.title).split(' ');
                        if (initials.length < 2) {
                            objectItem.firstName = '';
                            objectItem.lastName = '';
                        } else {
                            objectItem.firstName = initials[0];
                            objectItem.lastName = initials[initials.length - 1];
                        }
                        objectItem.desc = cleanup(crew['bio']);
                        objectItem.image = crew['profile_image'];
                        objectItem.cover = null;
                        objectItem.logo = null;
                        objectItem.uid = crew.id;
                        objectItem.birthYear = cleanup(crew['birth_year']);
                        objectItem.linkType = null;
                        return objectItem;
                    }).filter(Boolean);
                    break;
                }

                default:
                    row.dataItems = null;
                    break;
            }

            if (row.header === "carousel" && row.dataItems !== null && row.dataItems.length < 3) {
                row.dataItems = null;
            }

            if (row.dataItems !== null && row.dataItems.length === 0) {
                row.dataItems = null;
            }

            return row;
        }).filter((item) => {
            return item.dataItems !== null;
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
        const result = {
            jwtToken: getSafe(() => { return response.data.attributes["jwt"] }, null),
            username: getSafe(() => { return response.data.attributes["username"] }, null),
            lToken: getSafe(() => { return response.data.attributes["ltoken"] }, null)
        };

        callback(result);
    }

    parseMovieDetailResponse(responses, callback) {
        const result = {};

        result.title = cleanup(getSafe(() => { return responses.one.data['General'].title}, ''));
        result.titleEn = removeHTMLEntities(getSafe(() => { return responses.one.data['General']['title_en']}, ''));
        result.desc = cleanup(getSafe(() => { return responses.one.data['General']['descr']}, ''));

        result.image = getSafe(() => { return responses.one.data['General']['thumbnails']['movie_img_b'] }, '');
        result.cover = getSafe(() => { return responses.one.data['General']['cover'] }, '');

        const countries = formatList(getSafe(() => { return responses.one.data['General']['countries']}, []).map((country) => {
            return country.title;
        }));
        if (countries !== '') {
            result.country = string_product_of + ' ' + countries;
        } else {
            result.country = null;
        }

        result.productionYear = toPersianDigits(getSafe(() => { return responses.one.data['General']['pro_year']}, null));
        result.duration = getSafe(() => { return responses.one.data['General']['duration']['value'] }, 0);
        result.durationText = productDuration(result.duration);

        result.isHD = getSafe(() => { return responses.one.data['General']['HD']['enable'] }, false);
        result.isSerial = getSafe(() => { return responses.one.data['General']['serial']['enable'] }, false);

        result.isDubbed = getSafe(() => { return responses.one.data['General']['dubbed']['enable'] }, false);
        result.hasCC = getSafe(() => { return responses.one.data['General']['subtitle']['enable'] }, false);

        const ageRange = getSafe(() => { return responses.one.data['General']['age_range'] }, null);
        result.ageRange = null;
        if (ageRange && ageRange !== '') {
            const minAge = ageRange.split('-');
            if (minAge.length > 0 && !isNaN(minAge[0])) {
                result.ageRange = '+' + toPersianDigits(minAge[0]);
            }
        }

        result.rate = {};
        result.rate.average = getSafe(() => { return responses.one.data['action_data']['rate']['movie']['percent'] }, null);
        result.rate.count = getSafe(() => { return responses.one.data['action_data']['rate']['movie']['count'] }, null);
        result.rate.imdb = getSafe(() => { return responses.one.data['General']['imdb_rate'] }, null);

        const categories = getSafe(() => { return responses.one.data['General']['categories']}, []).map((category) => {
            return cleanup(category.title);
        });
        if (categories.length > 0) {
            result.categories = categories;
        } else {
            result.categories = null;
        }

        const actors = getSafe(() => { return responses.detail.data['ActorCrewData']['profile'] }, []).map((actor) => {
            const uid = encodeURI(actor['link_key']);
            const item = new DataItem('cast', uid);
            item.name = cleanup(actor.name);
            item.nameEn = removeHTMLEntities(actor['name_en'] || null);
            item.position = string_actor;
            item.positionEn = 'Actor';
            item.linkKey = uid;
            item.image = actor['profile_image'] || null;
            const initials = (item.nameEn || item.name).split(' ');
            if (initials.length < 2) {
                item.firstName = '';
                item.lastName = '';
            } else {
                item.firstName = initials[0];
                item.lastName = initials[initials.length - 1];
            }
            return item;
        });

        const otherCrewResponse = getSafe(() => { return responses.detail.data['OtherCrewData'] }, []);
        const crew = [];
        for (let data of otherCrewResponse) {
            for (let profile of data['profile']) {
                const uid = encodeURI(profile['link_key']);
                const item = new DataItem('cast', uid);
                item.name = cleanup(profile.name);
                item.nameEn = removeHTMLEntities(profile['name_en'] || null);
                item.position = getSafe(() => { return data['post_info']['title_fa'] }, null);
                item.positionEn = getSafe(() => { return data['post_info']['title_en'] }, null);
                item.image = profile['profile_image'] || null;
                item.linkKey = uid;
                const initials = (item.nameEn || item.name).split(' ');
                if (initials.length < 2) {
                    item.firstName = '';
                    item.lastName = '';
                } else {
                    item.firstName = initials[0];
                    item.lastName = initials[initials.length - 1];
                }
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
            const attributes = getSafe(() => item['attributes'], null);
            const uid = attributes['commentid'];
            const dataItem = new DataItem('comment', uid);
            dataItem.uid = uid;
            dataItem.name = removeHTMLEntities(attributes['name']) || '';
            dataItem.jalaliDate = cleanup(attributes['sdate']) || '';
            dataItem.body = removeHTMLEntities(attributes['body']) || '';
            return dataItem;
        });


        this.parseVitrineResponse(responses.recommendations, (parsedResponse) => {
            result.recommendations = parsedResponse;
        });

        if (result.isSerial) {
            result.seasonId = result.isSerial ? getSafe(() => { return responses.one.data['General']['serial']['season_id'] }, null) : null;
            if (responses.seasons !== null) {
                result.seasons = [];
                this.parseVitrineResponse(responses.seasons, (parsedSeasons) => {
                    result.seasons = parsedSeasons;
                });
            } else {
                result.seasons = null;
            }
            result.serialTitle = getSafe(() => { return responses.one.data['General']['serial']['title'] }, null);
        } else {
            result.seasonId = null;
            result.seasons = null;
            result.serialTitle = null;
        }

        result.watchAction = {
            buttonText: getSafe(() => { return responses.one.data['watch_action']['link_text']}, null),
            price: getSafe(() => { return responses.one.data['watch_action']['price']}, 0),
            currency: getSafe(() => { return responses.one.data['watch_action']['currency']}, string_toman),
            actionType: getSafe(() => { return responses.one.data['watch_action']['type']}, 'login'),
            sessionDuration: getSafe(() => { return responses.one.data['watch_action']['sans_duration']}, null),
            movieSource: getSafe(() => { return responses.one.data['watch_action']['movie_src']}, null),
            lastWatchedPosition: {
                percentage: getSafe(() => { return responses.one.data['watch_action']['last_watch_position']['percent']}, 0),
                seconds: getSafe(() => { return responses.one.data['watch_action']['last_watch_position']['last_second']}, 0)
            },
            visitStats: {
                action: getSafe(() => { return responses.one.data['watch_action']['visit_url']['formAction']}, null),
                id: getSafe(() => { return responses.one.data['watch_action']['visit_url']['frm_id']}, 0),
                callPeriod: getSafe(() => { return responses.one.data['watch_action']['visit_url']['visitCallPeriod']}, 60)
            },
            castSkip: {
                introStart: getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['intro_s']}, 0),
                introEnd: getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['intro_e']}, null),
                castStart: getSafe(() => { return responses.one.data['watch_action']['cast_skip_arr']['cast_s']}, null)
            },
            publishDate: getSafe(() => {
                const value = responses.one.data["General"]["publish_date"].replace(' ', 'T');
                const DateTime = luxon.DateTime;
                const dateStr = DateTime.fromISO(value, { zone: "Asia/Tehran" }).toString() || null;
                if (dateStr !== null) {
                    return new Date(dateStr);
                } else {
                    return null;
                }
            }, null)
        }

        let resumeTime = result.watchAction.lastWatchedPosition.seconds;
        let resumePercentage = result.watchAction.lastWatchedPosition.percentage;

        if (result.watchAction.castSkip.introStart <= resumeTime && result.watchAction.castSkip.introStart !== 0) {
            resumeTime = 0;
            resumePercentage = 0;
        } else if (result.watchAction.castSkip.introEnd
            && resumeTime <= result.watchAction.castSkip.introEnd) {
            resumeTime = 0;
            resumePercentage = 0;
        } else if (resumePercentage > 95) {
            resumeTime = 0;
            resumePercentage = 0;
        }

        result.watchAction.lastWatchedPosition = {
            percentage: resumePercentage,
            seconds: resumeTime
        }

        result.wish = {
            'enabled': getSafe(() => { return responses.one.data['action_data']['wish']['enable']}, false),
            'link': getSafe(() => { return responses.one.data['action_data']['wish']['link']}, null)
        }

        const trailerLink = getSafe(() => { return responses.detail.data['aparatTrailer']['file_link'] }, null);
        if (trailerLink !== null) {
            result.trailer = {
                'title': getSafe(() => { return responses.detail.data['aparatTrailer']['title'] }, null),
                'url': trailerLink,
                'thumbnail': getSafe(() => { return responses.detail.data['aparatTrailer']['thumb'] }, null)
            };
        } else {
            result.trailer = null;
        }

        callback(result);
    }

    parseWishToggleResponse(response, successCallback, failureCallback) {
        const wishStatus = getSafe(() => { return response.data['status'] }, null);

        if (wishStatus === 'wish') {
            successCallback(true);
        } else if (wishStatus === 'not wish') {
            successCallback(false);
        } else {
            failureCallback();
        }
    }
}
