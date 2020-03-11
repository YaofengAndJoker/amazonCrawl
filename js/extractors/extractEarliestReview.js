function extractEarliestReview() {
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1];
    let reviews = [];
    document.querySelectorAll('.review.a-section').forEach(el => {
        const $date = el.querySelector('.review-date');
        reviews.push({
            asin: asin,
            date: $date.innerText.trim().replace(/[^\d]*(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]*/,"$1-$2-$3"),
        });
    });
    reviews.splice(0,reviews.length-1);
    return {reviews};
}
