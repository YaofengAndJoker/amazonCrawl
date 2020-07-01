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

function getProductsURLs() {
    const args = getQueryStringArgs();
    if (args['k'] == undefined) {
        window.alert("请输入关键词再执行步骤1");
        return null;
    }
    let urls = []; //爬取url列表,传给background
    //https://www.amazon.cn/s?k=phone+case&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_1
    //https://www.amazon.cn/s?k=phone+case&page=2&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_2
    //https://www.amazon.cn/s?k=phone+case&page=3&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_3
    urls.push(document.querySelector('.a-pagination .a-selected').children[0].href); //当前页,也就是第一页
    let temp = document.querySelectorAll('.a-pagination .a-normal'); //第二页和第三页的url
    for (let url of temp) {
        //console.log(url);
        urls.push(url.children[0].href);
    }
    if (urls.length <= 0) {
        window.alert("请确认当前页面是否加载完成！是否输入错关键词，建议稍等后重试");
        return null;
    }
    //console.dir(urls);
    //将url信息发给background
    return urls;
}
getProductsURLs();