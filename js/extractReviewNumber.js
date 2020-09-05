function extractReviewNumber() {
    window.stop(); //停止进一步加载，要放在函数内，不然可能会出返回undefined的问题
    /*
    const selectors = {  // copy from  extractSearResultPage
        pagination: '.a-section.a-spacing-small.a-spacing-top-small>span',
        resultItem: 'div[data-asin][data-index].s-result-item',
        overview: '.a-row.a-size-small',
        itemTitle: '.a-link-normal.a-text-normal',
        prices: '.a-price>.a-offscreen',
    };*/
    // https://www.amazon.com/-/zh/iPhone-Silicone-Miracase-Protection-Shockproof/product-reviews/B074T8NYKW/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews
    //https://www.amazon.cn/dp/B00HU65SEU/   https://www.amazon.cn/product-reviews/B00HU65SEU/?pageNumber=1&sortBy=recent
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1]; // 获取 asin review数 和star // 找不到说明没有评论,对于无评论的,将star清零
    let rating;
    let reviewNum = document.querySelector("#filter-info-section span"); // https://www.amazon.cn/dp/B00HU65SEU/ref=sr_1_fkmr0_1?__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&keywords=Black+Leatherette+Valet+Tray+Desk+Dresser+Drawer+Coin+Case+Catc&qid=1583846475&sr=8-1-fkmr0
    if (reviewNum !== null) {
        // test case 1: "显示 1-10 条评论，共 1,200 条评论"
        // test case 2: "Showing 1-7 of 7 reviews"
        // test case 3 "Showing 1-10 of 141 reviews"
        // test case 4: "Showing 1-10 of 6,202 reviews"
        reviewNum = reviewNum.innerText.replace(/[^\d]*[\d,]+[^\d]+[\d,]+[^\d]+([\d,]+).*/g, "$1");
        reviewNum = reviewNum.replace(',', "");
        reviewNum = parseInt(reviewNum);
    } else {
        reviewNum = 0;
        rating = 0;
    }
    rating = document.querySelector(".AverageCustomerReviews .a-col-right span");
    if (rating !== null) {
        rating = rating.innerText.replace(/[^\d]*([\d.]+).*/g, "$1");
        rating = parseFloat(rating);
    } else {
        rating = 0;
    }
    // extra : add brand info to product Item;

    let reviews = [];
    reviews.push({
        asin: asin,
        totalReviews: reviewNum,
        rating: rating
    });

    return reviews;
}
extractReviewNumber();