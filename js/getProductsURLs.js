function getProductsURLs() {
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
    //console.dir(urls);
    //将url信息发给background
    return urls;
}
getProductsURLs();