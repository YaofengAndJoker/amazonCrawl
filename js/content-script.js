//TODO:  清空这个content-script，因为其加载时间无法控制，改用chrome.tabs.exescript({file:xxx.js})的方式
//TODO:  由于其加载时间无法控制，通过chrome.tabs.executescript({code:func})的时候，会出现找不到函数定义的情况

console.log("just haha");

/*
function giveProductsResult(params) { //商品列表页抽取
    console.log("giveProductsResult:  " + location.href);
    const { results } = extractProductsPage(); //根据dom情况进行爬取
    console.dir(results);
    return results;
}

function giveReviewsResult() { //商品Reviews页抽取
    console.log("giveReviewsResult:  " + location.href);
    let results = extractItemReviewPage(); //根据dom情况进行爬取
    console.dir(results);
    return results['reviews'];
}

function correctsReviewsAndStar() {
    console.log("giveReviewsResult:  " + location.href);
    let results = extractReviewNumber();
    console.dir(results);
    return results['reviews'];
}

function getEarliestReview() {
    console.log("getEarliestReview:  " + location.href);
    let results = extractEarliestReview();
    console.dir(results);
    return results['reviews'];
}

function givAsinDetail() {
    console.log("givAsinDetail:  " + location.href);
    let results = extractAsinDetail();
    console.dir(results);
    return results;
}*/