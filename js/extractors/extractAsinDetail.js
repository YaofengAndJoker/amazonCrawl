
function extractAsinDetail() {
    /*DEBUG CODE*/ // console.log("extractSearchResultPage start");
    const args = getQueryStringArgs();
    
    let brand,upDate,sellerName;
    upDate = 'NA';
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1];
    brand = document.querySelector('a#bylineInfo');
    if(brand !== null) {
        brand = brand.innerText;
    }
    else{
        brand = 'unknown';
    }
    let sellerTemp = document.querySelector('#sellerProfileTriggerId');
    if(sellerTemp!== null) {
        sellerName = sellerTemp.innerText;
    }
    else {
        sellerName = 'unknown';
    }
    let tempSets = document.querySelectorAll("#prodDetails td");
    let currentYear = new Date().getFullYear();
    for(let item of tempSets) {
        let index =item.innerText.search(/\d{4}/);
        if(index!== -1) {
            let year= parseInt(item.innerText.substr(index,4));
            if(year>=1995&&year<=currentYear) { // amazon online at 1995
                upDate = item.innerText;
            }
        }
    }
    let results = [];
    results.push({
        asin:asin,
        brand: brand.trim(),
        upDate: upDate,
        sellerName: sellerName,
    });
    /*DEBUG CODE*/ //console.log("extractSearchResultPage end");
    return results ;
}
