function extractItemReviewPage() {
    /*
    const selectors = {  // copy from  extractSearResultPage
        pagination: '.a-section.a-spacing-small.a-spacing-top-small>span',
        resultItem: 'div[data-asin][data-index].s-result-item',
        overview: '.a-row.a-size-small',
        itemTitle: '.a-link-normal.a-text-normal',
        prices: '.a-price>.a-offscreen',
    };*/
    let pathArgs = location.pathname.split('/');
    pathArgs = pathArgs.filter((item) => {
        return item.length !== 0
    });
    let asin = pathArgs[1];
    let reviews = [];
    const lineBreakRegex = /(\r?\n|\r)+/g;
    document.querySelectorAll('.review.a-section').forEach(el => {
        const $name = el.querySelector('.a-profile-name');
        const $rating = el.querySelector('.review-rating');
        const $date = el.querySelector('.review-date');
        const $reviewTitle = el.querySelector('.review-title');
        const $reviewBody = el.querySelector('.review-text');
        const $votes = el.querySelector('.cr-vote-text');
        const $brand = el.querySelector('.product-by-line>a');
        const extracted = $votes !== null ? /^([0-9]+|One)/.exec($votes.innerText)[1] : null;
        const withHelpfulVotes = extracted ? ( (extracted === 'One' ? 1 : parseInt(extracted)) || 0) : 0;

        const withBrand = $brand !== null ? ($brand.innerText) : '';
        reviews.push({
            asin: asin,
            name: $name.innerText.trim(),
            rating: parseFloat(/^[0-9.]+/.exec($rating.innerText)[0]),
            date: $date.innerText.trim().replace(/[^\d]*(\d+).+(\d+).+(\d+).*/,"$1-$2-$3"),
            verified: el.querySelector("[data-hook='avp-badge']") !== null,
            title: $reviewTitle.innerText.replace(lineBreakRegex, ' ').trim(),
            body: $reviewBody.innerText.replace(lineBreakRegex, ' ').trim(),
            withHelpfulVotes: withHelpfulVotes,
            withBrand: withBrand
        });
    });
    return {reviews};
}
