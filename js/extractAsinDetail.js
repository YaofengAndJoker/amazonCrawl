/*函数,获取地址栏的查询参数*/
//javascript高级程序设计,P207
function getQueryStringArgs() {
    var qs = location.search.length > 0 ? location.search.substring(1) : "";
    var args = {};
    var items = qs.length ? qs.split("&") : [];
    var item = null,
        name = null,
        value = null;
    var i = 0,
        len = items.length;
    for (i = 0; i < len; i++) {
        item = items[i].split("=");
        name = decodeURIComponent(item[0]);
        value = decodeURIComponent(item[1]);
        if (name.length) args[name] = value;
    }
    return args;
}
/*
function extractBrand() {
    const $brand = document.querySelector('a#bylineInfo');
    return $brand !== null ? $brand.innerText : undefined;
}*/

function extractAsinDetail() {
    window.stop(); //停止进一步加载，要放在函数内，不然可能会出返回undefined的问题
    /*DEBUG CODE*/ // console.log("extractSearchResultPage start");
    const args = getQueryStringArgs();

    let brand, upDate, sellerName;
    upDate = 'NA';
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1];
    brand = document.querySelector('a#bylineInfo');
    if (brand !== null) {
        brand = brand.innerText;
    } else {
        brand = 'unknown';
    }
    let sellerTemp = document.querySelector('#sellerProfileTriggerId');
    if (sellerTemp !== null) {
        sellerName = sellerTemp.innerText;
    } else {
        sellerName = 'unknown';
    }
    let tempSets = document.querySelectorAll("#prodDetails td");
    let currentYear = new Date().getFullYear();
    for (let item of tempSets) {
        let index = item.innerText.search(/\d{4}/);
        if (index !== -1) {
            let year = parseInt(item.innerText.substr(index, 4));
            if (year >= 1995 && year <= currentYear) { // amazon online at 1995
                upDate = item.innerText;
            }
        }
    }
    let results = [];
    results.push({
        asin: asin,
        brand: brand.trim(),
        upDate: upDate,
        sellerName: sellerName,
    });
    /*DEBUG CODE*/ //console.log("extractSearchResultPage end");
    return results;
}
extractAsinDetail();