
export function numberFormat(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function isEmptyObject(obj) {
  return window.$.isEmptyObject(obj);
}
export function havePermission(id) {
  let flag = false;
  this.currentAdminPermissions.map((item) => {
    if (item.id == id) {
      flag = true;
    }
  });
  return flag;
}
export function getAllPermissions() {
  this.$axios.get(this.baseUrl + "/api/admin/permissions").then((response) => {
    this.allPermissions = response.data.data;
  });
}
export function getAdmin() {
  // this.loading = true
  this.$axios.get(this.baseUrl + "/api/admin/check/user").then((response) => {
    this.adminProfile = response.data.data;
  });
  // window.$.get('/admin/check/user', (response) => {
  //   if (response.success) {
  //     this.user = response.data
  //   }
  // }).always(() => {
  //   this.loading = false
  // })
}
export function getAdminProfile() {
  this.$axios
    .get(this.$root.baseUrl + "/api/admin/profile")
    .then((response) => {
      this.profile = response.data.data;

      this.currentAdminPermissions = this.profile.permissions;
    });
}
export function setCookie(name, value, day = 365) {
  // افزودن پارمتر روز به تابع
  let Day = day * 24 * 3600 * 1000;
  var expires = "";
  var date = new Date();
  date.setTime(date.getTime() + Day);
  expires = "; expires=" + date;
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
export function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
export function deleteCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}
export function CheckAdmin() {
  if (this.getCookie("adminAuthorization")) {
    return true;
  } else {
    return false;
  }
}
export function successNotif(message) {
  if (typeof message != "string") {
    if (message.data && message.data.message) {
      message = message.data.message;
    } else {
      message = "موفق";
    }
  }
  this.$notify({
    group: "success",
    type: "success",
    title: "پیام سیستم",
    duration: 6000,
    text: message,
  });
}
export function errorNotif(error) {
  let delay = 6000;
  if (error.response) {
    if (error.response.errors && error.response.status == 422) {
      Object.values(error.response.data.errors).map((item) => {
        this.$notify({
          group: "error",
          type: "error",
          title: "پیام سیستم",
          duration: delay,
          text: item[0],
        });
      });
    } else if (error.response.status == 400 && error.response.data.message) {
      this.$notify({
        group: "error",
        type: "error",
        title: "پیام سیستم",
        duration: delay,
        text: error.response.data.message,
      });
    } else if (
      error.response.status == 400 &&
      error.response.data.data != null
    ) {
      Object.values(error.response.data.data).map((item) => {
        this.$notify({
          group: "error",
          type: "error",
          title: "پیام سیستم",
          duration: delay,
          text: item.message,
        });
      });
    } else if (
      error.response.status == 422 &&
      error.response.data.data != null
    ) {
      Object.values(error.response.data.data.messages).map((item) => {
        this.$notify({
          group: "error",
          type: "error",
          title: "پیام سیستم",
          duration: delay,
          text: item[0],
        });
      });
    } else if (
      error.response.status == 422 &&
      error.response.data.errors != null
    ) {
      Object.values(error.response.data.errors).map((item) => {
        this.$notify({
          group: "error",
          type: "error",
          title: "پیام سیستم",
          duration: delay,
          text: item[0],
        });
      });
    } else if (
      error.response.status == 400 &&
      error.response.data.data == null
    ) {
      this.$notify({
        group: "error",
        type: "error",
        title: "پیام سیستم",
        duration: delay,
        text: error.response.data.message,
      });
    } else if (error.response.data.message) {
      this.$notify({
        group: "error",
        type: "error",
        title: "پیام سیستم",
        duration: delay,
        text: error.response.data.message,
      });
    } else {
      this.$notify({
        group: "error",
        type: "error",
        title: "پیام سیستم",
        duration: delay,
        text: "مشکلی رخ داد",
      });
    }
  } else {
    console.error(error);
    this.$notify({
      group: "error",
      type: "error",
      title: "پیام سیستم",
      duration: delay,
      text: "مشکلی رخ داد",
    });
  }
}
export function errorNotify(message) {
  this.$notify({
    group: "error",
    type: "error",
    title: "پیام سیستم",
    duration: 6000,
    text: message,
  });
}
export function warningNotif(message) {
  this.$notify({
    group: "warning",
    type: "warn",
    title: "پیام سیستم",
    duration: 3000,
    text: message,
  });
}
export function notify(r, type = "error") {
  switch (type) {
    case "error":
      this.errorNotif(r);
      break;
    case "success":
      this.successNotif(r);
      break;
    case "warning":
      this.warningNotif(r);
      break;
  }
}

export function scrollTo(selector, behavior = "smooth", mobileOnly = true) {
  if (mobileOnly && window.innerWidth > 700) {
    return;
  }
  setTimeout(() => {
    let mainEl = this.$(selector)[0];
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: behavior });
    }
  }, 100);
}

export function isPart(partName) {
  return window.location.href.indexOf(partName) > -1;
}

export function loadScript(src) {
  // Check if already loaded
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }
  let script = document.createElement("script");
  script.src = src;
  script.async = false;
  document.querySelector("head").append(script);
}

export function uniqueId() {
  return Math.random().toString(36).slice(2);
}

export function dynamicColor(hexcolor) {
  // If a leading # is provided, remove it
  if (hexcolor.slice(0, 1) === "#") {
    hexcolor = hexcolor.slice(1);
  }

  // If a three-character hexcode, make six-character
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split("")
      .map(function (hex) {
        return hex + hex;
      })
      .join("");
  }

  // Convert to RGB value
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);

  // Get YIQ ratio
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Check contrast
  return yiq >= 128 ? "black" : "white";
}
export function deleteArrayRow(index, arr) {
  return [...arr.slice(0, index), ...arr.slice(index + 1, arr.length)];
}

export function deleteArrayColumn(index, arr) {
  const indexColumn = index;
  let newArr = [];
  arr.forEach((InArr) => {
    newArr.push([
      ...InArr.slice(0, indexColumn),
      ...InArr.slice(indexColumn + 1, InArr.length),
    ]);
  });

  return newArr;
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export function decapitalizeFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getUrlSegment(url, segment) {
  if (Number.isNaN(segment) || segment < 0 || typeof segment === "undefined") {
    throw new Error("getUrlSegment bad argument segment: " + segment);
  }
  if (url.charAt(0) == "/") {
    url = url.slice(1);
  }
  if (url.charAt(url.length - 1) !== "/") {
    url += "/";
  }
  let seg = "";
  while (segment >= 0) {
    const firstSlash = url.indexOf("/");
    const secondSlash = url.indexOf("/", firstSlash);
    seg = url.slice(0, firstSlash, secondSlash);
    url = url.slice(secondSlash + 1);
    segment--;
  }
  return seg;
}

export function getUrlSegments(url, startSegment, endSegment) {
  let seg = "";
  while (startSegment <= endSegment) {
    seg += "/" + getUrlSegment(url, startSegment);
    startSegment++;
  }
  return seg;
}

export function loadCkeditor(...ids) {
  if (!this.ckeditorLoaded) {
    this.ckeditorLoaded = true;
    let script = document.createElement("script");
    script.src = "/assets/editors/ckeditor/ckeditor.js";
    window.$("head").append(script);
  }
  setTimeout(() => {
    ids.forEach((id) => {
      window.CKEDITOR.replace(id);
    });
  }, 0);
}

export function addLabel(options) {
  return options.map((opt) => {
    if (opt.title) {
      opt.label = opt.title;
    } else if (opt.name) {
      opt.label = opt.name;
    } else {
      opt.label = opt.value;
    }
    if (opt.children) {
      opt.children = this.$root.addLabel(opt.children);
    }

    return opt;
  });
}

export function hasClass(element, className) {
  let regex = new RegExp("\\b" + className + "\\b");
  do {
    if (regex.exec(element.className)) {
      return true;
    }
    element = element.parentNode;
  } while (element);
  return false;
}

export function hasId(element, id) {
  let regex = new RegExp("\\b" + id + "\\b");
  do {
    if (regex.exec(element.id)) {
      return true;
    }
    element = element.parentNode;
  } while (element);
  return false;
}

export function mergeArrayObjects(objects1, objects2, key = "id") {
  let ids = new Set(objects1.map((d) => d[key]));
  return [...objects1, ...objects2.filter((d) => !ids.has(d[key]))];
}

export function calculatePrice(price, discountType = "", discountPrice = "") {
  switch (discountType) {
    case "percentage":
      return Number.parseInt(price - (price * discountPrice) / 100);
    case "flat":
      return discountPrice;
  }

  return price;
}
// برگرداندن شماره ردیف در جدول ها بر اساس مقدار نمایش در هر صفحه
export function getLine(index, currentPage, per_page) {
  return index + 1 + (currentPage - 1) * per_page;
}
// تبدیل تاریخ میلادی به شمسی
export function convertToPersianDate(date) {
  return new Date(date).toLocaleDateString("fa-IR");
}

// یک پراپرتی میگیره مثلا طول
// بعد میگرده دنبال search
// کوچکترینش و پیدا میکنه
// قرار میده توی replace
// برای هم اندازه کردن عکس ها
export function samisize(property, search, replace = null, minProperty = null) {
  replace = replace ? replace : search;
  let min = 9999999999999;
  document.querySelectorAll(search).forEach((item) => {
    let cs = window.getComputedStyle(item);
    let prop = Number.parseFloat(
      cs.getPropertyValue(property).replace("px", "")
    );
    if (prop < min) {
      min = prop;
    }
  });
  if (min !== 9999999999999) {
    if (min < minProperty) {
      setTimeout(() => {
        samisize(property, search, replace, minProperty - 1);
      }, 200);
    } else {
      document.querySelectorAll(replace).forEach((item) => {
        item.style[property] = min + "px";
      });
    }
  }
}

export function makePath(path, queries) {
  let qS = "?";
  for (let [index, value] of Object.entries(queries)) {
    qS += index + "=" + value + "&";
  }
  qS = qS.slice(0, qS.length - 1);

  return path + qS;
}
