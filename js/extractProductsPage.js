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

function extractProductsPage() {
    /*DEBUG CODE*/ // console.log("extractSearchResultPage start");
    const args = getQueryStringArgs();

    const selectors = {
        pagination: '.a-section.a-spacing-small.a-spacing-top-small>span',
        resultItem: 'div[data-asin][data-index].s-result-item',
        overview: '.a-row.a-size-small',
        itemTitle: '.a-link-normal.a-text-normal',
        prices: '.a-price>.a-offscreen',
    };
    /*
    //获得分页数据
    const ITEMS_PER_PAGE = 16;
    const $pagination = document.querySelector(selectors.pagination);
    const segments = /^[0-9]+-([0-9])+ of ([0-9]+)/.exec($pagination.innerText);
    const lastIndex = parseInt(segments[1]);//当前商品最后一个商品的编号
    const totalResults = parseInt(segments[2]);//总共的数量
    
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);//总共的页数
    const currentPage = totalPages - Math.ceil((totalResults - lastIndex) / ITEMS_PER_PAGE);//当前页数
    const meta = { currentPage, lastIndex, totalPages, totalResults };//当前是第几页,最后商品的编号是多少 ,总页数,总商品数
    */
    //分页数据要从地址栏获取

    let results = [];
    document.querySelectorAll(selectors.resultItem).forEach(el => {
        let rating;
        let totalReviews;
        try {
            const [$rating, $totalReviews] = el.querySelector(selectors.overview).children;
            rating = parseFloat(/^[0-9.]+/.exec($rating.innerText)[0]);
            totalReviews = parseInt($totalReviews.innerText);
        } catch (error) { //有的商品没有评论,所以rating 和totoalReviews都是空的
            rating = 0;
            totalReviews = 0;
        }
        const $url = el.querySelector(selectors.itemTitle);
        const asin = el.getAttribute('data-asin');
        if (asin === "" || asin === null)
            return;
        let prices = [];
        el.querySelectorAll(selectors.prices).forEach((p) => {
            prices.push(parseFloat(p.innerText.replace(/[^\d.-]/g, ''))); //删除$ ￥等金币符号,只保留数字和点以及正负号
        });
        const { 0: price = 0, 1: originalPrice = 0 } = prices; //价格为0的，可能是有大量的变体商品
        if (price === 0)
            return;
        let title_temp;
        let stringDate = new Date();
        stringDate = `${stringDate.getFullYear()}/${stringDate.getMonth()+1}/${stringDate.getDate()}`;
        try {
            title_temp = el.querySelector('h2').innerText.trim();
            //'[asin],title,url,image,rating,reviewUrl,totalReviews,price,originalPrice,fromUrl,keywords,page,collect_date,earliest_date
            //,brand,upDate,sellerName,current,last,before,before2,partion',            
            results.push({
                asin,
                title: title_temp,
                url: $url.href, //.match(`(^.+${asin}).+`)[1],   // url 可能并没有包含asin,可能是个redirect
                image: el.querySelector('.s-image').src,
                rating: -1,
                reviewUrl: 'https://' + `${location.host}/product-reviews/${asin}`,
                totalReviews: -1,
                price,
                originalPrice,
                fromUrl: location.href,
                keywords: args['k'].replace(/\+/g, " "),
                page: args['page'] === undefined ? "1" : args['page'], //如果没有page参数,说明是第一页
                collect_date: stringDate,
                earliest_date: -1,
                brand: -1,
                upDate: -1,
                sellerName: -1,
                current: -1,
                last: -1,
                before: -1,
                before2: -1,
                partion: -1,
            });
        } catch (error) {
            // just ignore 
            return results;
        }

    });
    /*DEBUG CODE*/ //console.log("extractSearchResultPage end");
    return results;
}
extractProductsPage();