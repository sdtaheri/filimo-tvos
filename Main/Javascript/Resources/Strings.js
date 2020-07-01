const string_loading = 'در حال دریافت اطلاعات…';

function string_search_placeholder() {
    return `در ${appName} جستجو کنید`;
}

const string_error_in_search = 'خطا در دریافت نتایج جستجو';

function string_nothing_found_for(query) {
    return `نتیجه‌ای برای «${query}» پیدا نشد.`;
}


function toPersianDigits(str) {
    if (str == null) {
        return null;
    }

    return str.replace(/0/g, "۰")
        .replace(/1/g, "۱")
        .replace(/2/g, "۲")
        .replace(/3/g, "۳")
        .replace(/4/g, "۴")
        .replace(/5/g, "۵")
        .replace(/6/g, "۶")
        .replace(/7/g, "۷")
        .replace(/8/g, "۸")
        .replace(/9/g, "۹");
}

function removeHTMLEntities(str) {
    if (str == null) {
        return null;
    }

    return str.replace("&hellip;", "…")
        .replace("&zwnj;", "‌")
        .replace("&#039;", "'")
        .replace(/\&\w+;/g, '');
}

function cleanup(str) {
    return removeHTMLEntities(toPersianDigits(str));
}