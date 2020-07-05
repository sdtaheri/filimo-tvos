/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class handles loading of data for prototypes in templates.
*/

const legacyBaseURL = 'https://www.filimo.com/etc/api';

class DataLoader {

    constructor(documentLoader, dataParser) {
        this._documentLoader = documentLoader;
        this._dataParser = dataParser;

        this._searchRequest = null;
        this._searchTextCache = null;
    }

    _fetchJSONData(dataURL, params, itemCallback, errorCallback, httpRequest) {
        return new Promise((resolve, reject) => {
            let xhr = httpRequest || new XMLHttpRequest();

            let url = dataURL;
            if (dataURL.substr(-1) !== "/") {
                url += "/";
            }
            if (UserManager.isLoggedIn()) {
                url += "luser/" + UserManager.username();
                url += "/ltoken/" + UserManager.lToken() + "/";
            }

            if (dataURL.includes(legacyBaseURL)) {
                url += "devicetype/site/";
            } else {
                url += "devicetype/appletv/";
            }

            if (params != null) {
                url += "?" + Object
                    .keys(params)
                    .map( (key) => {
                        return key + "=" + encodeURIComponent(params[key])
                    })
                    .join("&")
            }

            xhr.open("GET", url);

            if (UserManager.isLoggedIn()) {
                xhr.setRequestHeader("Authorization", "Bearer " + UserManager.jwtToken());
            }
            xhr.setRequestHeader("JsonType", "simple");

            xhr.responseType = "json";
            xhr.onload = () => {
                itemCallback(xhr.response);
                resolve();
            };
            xhr.onerror = () => {
                reject(xhr);
                if (errorCallback !== undefined) {
                    errorCallback();
                }
            };
            xhr.send();
        });
    }

    fetchVitrine(itemsCallback) {
        let url = baseURL + '/movie/movie/list/tagid/1';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchVitrineNextPage(url, itemsCallback) {
        if (url == null) {
            return;
        }
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchCategoriesList(itemsCallback) {
        let url = baseURL + '/category/category/list';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseCategoriesResponse(response, itemsCallback);
        });
    }

    fetchSearchResults(query, itemsCallback, errorCallback) {
        let searchText = query.trim().replace(/\s+/g, ' ');

        if (this._searchTextCache && searchText === this._searchTextCache) {
            return;
        }

        this._searchTextCache = searchText;

        if (this._searchRequest && this._searchRequest.readyState !== XMLHttpRequest.DONE) {
            this._searchRequest.abort();
        }

        let url = baseURL + `/movie/movie/list/tagid/1000300/text/${encodeURIComponent(searchText)}/sug/on`;

        this._searchRequest = new XMLHttpRequest();
        this._fetchJSONData(url, null, (response) => {
            this._dataParser.parseSearchResponse(response, itemsCallback);
            this._searchRequest = null;
            this._searchTextCache = null;
        }, errorCallback, this._searchRequest);
    }

    fetchLoginCode(callback) {
        let url = baseURL + '/user/Authenticate/get_verify_code';
        this._fetchJSONData(url, {'ref_type': 'tv'}, (response) => {
            this._dataParser.parseLoginCode(response, callback);
        });
    }

    verifyLogin(code, callback) {
        if (code == null || code === '') {
            return;
        }

        let url = baseURL + '/user/Authenticate/sync_account_verify';
        this._fetchJSONData(url, {'ref_type': 'tv', 'code': code}, (response) => {
            this._dataParser.parseVerifyCode(response, callback);
        });
    }

    fetchProfile(callback) {
        let profileAccountUrl = baseURL + '/user/user/profile_account';
        let profileMenuUrl = baseURL + '/user/user/menu';

        this._fetchJSONData(profileAccountUrl, null, (accountResponse) => {
            this._fetchJSONData(profileMenuUrl, null, (menuResponse) => {
                this._dataParser.parseProfileResponse({'account': accountResponse, 'menu': menuResponse}, callback);
            });
        });
    }

    fetchUserMovies(itemsCallback) {
        let bookmarksUrl = baseURL + '/movie/movie/list/tagid/bookmark';
        let historyUrl = baseURL + '/movie/movie/list/tagid/history';

        this._fetchJSONData(this._documentLoader.prepareURL(bookmarksUrl), null, (bookmarksResponse) => {
            this._fetchJSONData(this._documentLoader.prepareURL(historyUrl), null, (historyResponse) => {
                this._dataParser.parseUserMoviesResponse(bookmarksResponse, historyResponse, itemsCallback);
            });
        });

    }

    fetchBookmarks(itemsCallback) {
        let url = baseURL + '/movie/movie/list/tagid/bookmark';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

    fetchHistory(itemsCallback) {
        let url = baseURL + '/movie/movie/list/tagid/history';
        this._fetchJSONData(this._documentLoader.prepareURL(url), null, (response) => {
            this._dataParser.parseVitrineResponse(response, itemsCallback);
        });
    }

}
