function extractEarliestReview() {
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1];
    let reviews = [];
    document.querySelectorAll('.review.a-section').forEach(el => {
        let $date = el.querySelector('.review-date');
        $date = $date.innerText.trim().replace(/[^\d]*(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]*/, "$1-$2-$3");
        if ($date.split('-').length === 3) {} else {
            //"Reviewed in the United States on April 16, 2019".replace(/Reviewed in the United States on /,"")
            $date = $date.replace(/Reviewed in the United States on /, "");
            const temp = new Date(Date.parse($date));
            $date = `${temp.getFullYear()}-${temp.getMonth()+1}-${temp.getDate()}`;
        }
        reviews.push({
            asin: asin,
            earliest_date: $date,
        });
    });
    reviews.splice(0, reviews.length - 1);
    return reviews;
}
extractEarliestReview();