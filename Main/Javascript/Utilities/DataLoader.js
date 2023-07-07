/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

class DataLoader {

    constructor(documentLoader, dataParser) {
        this._documentLoader = documentLoader;
        this._dataParser = dataParser;

        this._searchRequest = null;
        this._searchTextCache = null;

        this.userAgent = {
            an: appNameEn(),
            os: "appletv",
            vc: Device.appVersion,
            vn: Device.appVersion,
            sdk: Device.systemVersion,
            ds: App.traitCollection.displayScale,
            sz: App.traitCollection.screenWidth + "X" + App.traitCollection.screenHeight,
            loc: "fa",
            dt: "TV*l",
            di: `Apple*${Device.model}*${Device.productType}*${Device.productType}*${Device.productType}`,
            s: "ab",
            oui: "",
            pkg: Device.appIdentifier
              .replace("com.saeedtaheri", "com.sabaidea")
              .replace("com.bluevod.f", "com.sabaidea.filimo")
              .replace("com.bluevod.t", "com.sabaidea.televika"),
            afcn: Device.vendorIdentifier
        }

        this.slashedUserAgent = "";
        Object.keys(this.userAgent).forEach((key) => {
            this.slashedUserAgent += this.userAgent[key] + "/";
        });
    }

    _fetchJSONData(dataURL, params, responseCallback, errorCallback, httpRequest) {
        let xhr = httpRequest || new XMLHttpRequest();

        let url = dataURL;
        if (dataURL.substr(-1) !== "/") {
            url += "/";
        }

        url += "devicetype/appletv/";

        if (params !== null) {
            url += "?" + Object
            .keys(params)
            .map((key) => {
                return key + "=" + encodeURIComponent(params[key])
            })
            .join("&")
        }

        xhr.open("GET", url);

        if (UserManager.isLoggedIn()) {
            xhr.setRequestHeader("Authorization", "Bearer " + UserManager.jwtToken());
            xhr.setRequestHeader("luser", UserManager.username());
            xhr.setRequestHeader("ltoken", UserManager.lToken());
        }
        xhr.setRequestHeader("PlainJsonApi", "1");
        xhr.setRequestHeader("JsonType", "simple");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("cache-control", "no-cache");
        xhr.setRequestHeader("UserAgent", JSON.stringify(this.userAgent));
        xhr.setRequestHeader("User-AgentV2", this.slashedUserAgent);

        xhr.responseType = "json";
        xhr.onload = () => {
            console.log(xhr.status + ": " + url);
            responseCallback(xhr.response);
        };
        xhr.onerror = () => {
            console.log(xhr.status + ": " + url);
            if (errorCallback !== undefined) {
                errorCallback();
            }
        };
        xhr.send();
    }

    fetchVitrineNextPage(url, itemsCallback, errorCallback) {
        if (url === null || url === undefined) {
            if (errorCallback) {
                errorCallback();
            }
            return;
        }
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        }, errorCallback);
    }

    fetchCategoriesList(itemsCallback) {
        const url = baseURL + '/category/category/list';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseCategoriesResponse(response, itemsCallback);
        });
    }

    fetchList(linkKey, itemsCallback) {
        if (linkKey === undefined || linkKey === null) {
            return;
        }

        if (linkKey === 'categories') {
            this.fetchCategoriesList(itemsCallback);
        } else {
            const path = '/movie/movie/list/tagid/';
            const url = linkKey.includes(path) ? linkKey : (baseURL + '/movie/movie/list/tagid/' + linkKey);
            this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
                this._dataParser.parseVitrineResponse(response, itemsCallback);
            });
        }
    }

    fetchSearchResults(query, itemsCallback, errorCallback) {
        const searchText = query.trim().replace(/\s+/g, ' ');

        if (this._searchTextCache && searchText === this._searchTextCache) {
            return;
        }

        this._searchTextCache = searchText;

        if (this._searchRequest && this._searchRequest.readyState !== XMLHttpRequest.DONE) {
            this._searchRequest.abort();
        }

        const url = baseURL + `/movie/movie/list/tagid/1000300/text/${encodeURIComponent(searchText)}/sug/on`;

        this._searchRequest = new XMLHttpRequest();
        this._fetchJSONData(url, null, (response) => {
            this._dataParser.parseSearchResponse(response, itemsCallback);
            this._searchRequest = null;
            this._searchTextCache = null;
        }, errorCallback, this._searchRequest);
    }

    fetchLoginCode(callback) {
        const url = baseURL + '/user/Authenticate/get_verify_code';
        this._fetchJSONData(url, {'ref_type': 'tv'}, (response) => {
            this._dataParser.parseLoginCode(response, callback);
        });
    }

    verifyLogin(code, callback) {
        if (code === null || code === undefined || code === '') {
            return;
        }

        const url = baseURL + "/user/Authenticate/sync_account_verify";
        this._fetchJSONData(url, { ref_type: "tv", code: code }, (response) => {
            this._dataParser.parseVerifyCode(response, callback);
        });
    }

    fetchProfile(callback) {
        const profileAccountUrl = baseURL + '/user/user/profile_account';
        const profileMenuUrl = baseURL + '/user/user/menu';

        this._fetchJSONData(profileAccountUrl, null, (accountResponse) => {
            this._fetchJSONData(profileMenuUrl, null, (menuResponse) => {
                this._dataParser.parseProfileResponse({'account': accountResponse, 'menu': menuResponse}, callback);
            });
        });
    }

    fetchBookmarks(itemsCallback) {
        const url = baseURL + '/movie/movie/list/tagid/bookmark';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchHistory(itemsCallback) {
        const url = baseURL + '/movie/movie/list/tagid/1000200';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchFollowedSeries(itemsCallback) {
        const url = baseURL + '/movie/movie/list/tagid/following';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchMovie(uid, callback) {
        if (uid === null || uid === '') {
            return;
        }

        const oneUrl = baseURL + '/movie/movie/one/uid/' + uid;
        const detailUrl = baseURL + '/review/review/moviedetail/uid/' + uid;
        const commentUrl = baseURL + '/comment/comment/list/uid/' + uid;
        const recommendationUrl = baseURL + '/movie/movie/recom/uid/' + uid;
        const seasonsUrl = baseURL + '/movie/serial/allepisode/uid/' + uid;

        this._fetchJSONData(this._documentLoader.prepareURL(oneUrl), null, (oneResponse) => {

            checkIfAllRequestsAreDone = checkIfAllRequestsAreDone.bind(this);

            const isSerial = oneResponse['data']['General']['serial']['enable'];
            const requestsCount = isSerial === true ? 5 : 4;

            const responses = {};
            responses.one = oneResponse;

            this._fetchJSONData(this._documentLoader.prepareURL(detailUrl), null, (detailResponse) => {
                responses.detail = detailResponse;
                checkIfAllRequestsAreDone();
            }, () => {
                responses.detail = null;
                checkIfAllRequestsAreDone();
            });

            this._fetchJSONData(this._documentLoader.prepareURL(commentUrl), null, (commentsResponse) => {
                responses.comments = commentsResponse;
                checkIfAllRequestsAreDone();
            }, () => {
                responses.comments = null;
                checkIfAllRequestsAreDone();
            });

            if (isSerial) {
                this._fetchJSONData(this._documentLoader.prepareURL(seasonsUrl), null, (seasonsResponse) => {
                    responses.seasons = seasonsResponse;
                    checkIfAllRequestsAreDone();
                }, () => {
                    responses.seasons = null;
                    checkIfAllRequestsAreDone();
                });
            }

            this._fetchJSONData(this._documentLoader.prepareURL(recommendationUrl), null, (recommendationResponse) => {
                responses.recommendations = recommendationResponse;
                checkIfAllRequestsAreDone();
            }, () => {
                responses.recommendations = null;
                checkIfAllRequestsAreDone();
            });

            function checkIfAllRequestsAreDone() {
                if (Object.keys(responses).length === requestsCount) {
                    this._dataParser.parseMovieDetailResponse(responses, callback);
                }
            }
        });
    }

    fetchLiveInfo(linkKey, callback) {
        if (linkKey === null || linkKey === '') {
            callback(null);
            return;
        }

        const liveDetailUrl = baseURL + '/live/live/one/live_name/' + linkKey;

        this._fetchJSONData(liveDetailUrl, null, (successResult) => {
            this._dataParser.parseLiveResponse(successResult, callback);
        }, () => {
            callback(null);
        });
    }

    toggleWish(url, successCallback, failureCallback) {
        if (url === null || url === '') {
            failureCallback();
            return;
        }

        this._fetchJSONData(url, null, (successResult) => {
            this._dataParser.parseWishToggleResponse(successResult, successCallback, failureCallback);
        }, () => {
            failureCallback();
        });
    }

    logout(url) {
        this._fetchJSONData(url, null, (result) => {
            console.log(result);
        });
    }
}
