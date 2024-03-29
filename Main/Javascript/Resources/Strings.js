function appNameEn () {
  return isFilimo() ? 'Filimo' : 'Televika'
}

const string_loading = 'در حال دریافت اطلاعات…'

function string_search_placeholder () {
  return `در ${appName} جستجو کنید`
}

const string_error_in_search = 'خطا در دریافت نتایج جستجو'

function string_nothing_found_for (query) {
  return `نتیجه‌ای برای «${query}» پیدا نشد.`
}

function string_username (name) {
  return `نام کاربری: ${name}`
}

const string_login_to_account = 'ورود به حساب کاربری'

const string_error_getting_login_code = 'خطا در دریافت کد لاگین'

function string_login_description () {
  let url = isFilimo()
    ? 'https://filimo.com/activate'
    : 'https://televika.com/activate'
  return `برای وصل کردن تلویزیون خود به ${appName} مراحل زیر را انجام دهید:
    
    یک دستگاه دیگر مانند گوشی موبایل یا لپ‌تاپ بیاورید و در آن یک مرورگر مثل سافاری یا کروم را باز کنید.
    به آدرس ${url} بروید.
    کد زیر را تایپ کنید تا تلویزیون شما به ${appName} وصل شود.
    `
}

const string_login_description_use_qr_code = '\nهمچنین می‌توانید به جای مراحل بالا، کد QR را اسکن کنید.'

const string_pay = 'پرداخت'
const string_logout = 'خروج'
const string_account_exit = 'خروج از حساب کاربری'
const string_account_exit_alert_desc = 'آیا می‌خواهید از حساب کاربری خود خارج شوید؟'
const string_cancel = 'انصراف'
const string_buy_or_extend = 'خرید یا تمدید اشتراک'
const string_scripts_evaluation_error_title = 'خطای ارزیابی'
const string_scripts_evaluation_error_desc = 'در ارزیابی فایل‌های جاوااسکریپت مشکل پیش آمد.'
const string_check_connection_try_again = 'اتصال به اینترنت را بررسی کرده و دوباره تلاش کنید.'

function string_movie_available_in (remainingInSeconds) {
  return `این فیلم ${productDuration(remainingInSeconds)} دیگر منتشر می‌شود.`
}

function live_since (date) {
  const dt = luxon.DateTime.fromJSDate(date)
  const formattedDate = dt.setLocale('fa-IR').
    toLocaleString(luxon.DateTime.TIME_SIMPLE)

  return `از ${formattedDate}`
}

function string_go_to_payment_website () {
  let site = isFilimo()
    ? 'https://www.filimo.com/purchase'
    : 'https://www.televika.com/purchase'
  return `با استفاده از مرورگر موبایل یا رایانه شخصی خود،
به آدرس ${site}
مراجعه بفرمایید.
    `
}

const string_bookmarks = 'نشان‌ها'
const string_history = 'مشاهده‌ها‌'
const string_series = 'سریال‌ها'
const string_no_items_available = 'ویدئویی در این فهرست وجود ندارد'
const string_and = 'و'
const string_comma = '،'
const string_day = 'روز'
const string_hour = 'ساعت'
const string_minute = 'دقیقه'
const string_season = 'فصل'
const string_seasons = 'فصل‌ها'
const string_toman = 'تومان'
const string_comments = 'نظرات'
const string_percent_sign = '٪'
const string_next_episode = 'قسمت بعد'

function string_average_between_comments (count) {
  return 'میانگین از بین ' + toPersianDigits(count) + ' نظر'
}

function string_play_in_seconds (count) {
  if (count >= 1) {
    return 'قسمت بعد: پخش از ' + toPersianDigits(Math.floor(count)) + ' ثانیه دیگر'
  } else {
    return 'قسمت بعد:'
  }
}

const string_product_of = 'محصول'
const string_actor = 'بازیگر'
const string_actors = 'بازیگران'
const string_genre = 'ژانر'
const string_director = 'کارگردان'
const string_preview = 'پیش‌نمایش'
const string_play_movie = 'پخش فیلم'
const string_remove_bookmark = 'حذف از نشان‌ها'
const string_add_bookmark = 'افزودن به نشان‌ها'
const string_recommendations = 'پیشنهادها'
const string_episodes_of_season = 'قسمت‌های فصل'
const string_other_episodes = 'سایر قسمت‌ها'
const string_cast = 'عوامل'
const string_skip_intro = 'رد کردن تیتراژ'
const string_dubbed = 'دوبله'

function string_buy_ticket (price, currency, sessionDuration) {
  return `با مراجعه به صفحه این فیلم در سایت ${appName} می‌توانید بلیط تماشای این فیلم را با قیمت ${toPersianDigits(
    price) + ' ' + currency} خریداری نمایید.`
    + '\n'
    + `پس از خرید شما فرصت دارید این فیلم را ظرف مدت ${toPersianDigits(
      sessionDuration) + ' ساعت'} ببینید.`

}

function toPersianDigits (str) {
  if (str === null || str === undefined) {
    return null
  }

  return (str + '').replace(/0/g, '۰').
    replace(/1/g, '۱').
    replace(/2/g, '۲').
    replace(/3/g, '۳').
    replace(/4/g, '۴').
    replace(/5/g, '۵').
    replace(/6/g, '۶').
    replace(/7/g, '۷').
    replace(/8/g, '۸').
    replace(/9/g, '۹').
    replace(/(,(?=\S)|:)/g, '، ').
    replace(' ،', string_comma)
}

function removeHTMLEntities (str) {
  if (str === null || str === undefined) {
    return null
  }

  return (str + '').replace('&hellip;', '…').
    replace('&zwnj;', '‌').
    replace('&#039;', '\'').
    replace(/&\w+;/g, '').
    replace('&raquo;', '»').
    replace('&laquo;', '«')
}

function cleanup (str) {
  return removeHTMLEntities(toPersianDigits(str))
}

function formatList (list) {
  switch (list.length) {
    case 0:
      return ''
    case 1:
      return list[0]
    case 2:
      return list[0].trim() + ` ${string_and} ` + list[1].trim()
    default:
      return list[0].trim() + `${string_comma} ` + formatList(list.slice(1))
  }
}

function productDuration (durationInSeconds) {
  const durationInMinute = durationInSeconds / 60

  const day = parseInt(durationInMinute / 60 / 24 + '', 10)
  const hour = parseInt(durationInMinute / ((day + 1) * 60) + '', 10)
  const minute = parseInt(durationInMinute % 60 + '', 10)

  let duration = ''
  if (day > 0) {
    duration += day + ' ' + string_day
  }
  if (hour > 0) {
    if (duration !== '') {
      duration += ` ${string_and} `
    }
    duration += hour + ' ' + string_hour
  }
  if (minute > 0) {
    if (duration !== '') {
      duration += ` ${string_and} `
    }
    duration += minute + ' ' + string_minute
  }
  return toPersianDigits(duration)
}

function isValidHttpUrl (string) {
  let url

  try {
    url = new URL(string)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
