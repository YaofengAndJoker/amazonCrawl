function extractItemReviewPage() {
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
        const withHelpfulVotes = extracted
            ? { helpfulVotes: (extracted === 'One' ? 1 : parseInt(extracted)) || 0 }
            : {};
        const withBrand = $brand !== null ? { brand: $brand.innerText } : {};
        reviews.push(Object.assign(Object.assign({ 
            name: $name.innerText.trim(), 
            rating: parseFloat(/^[0-9.]+/.exec($rating.innerText)[0]), 
            date: $date.innerText.trim(), 
            verified: el.querySelector("[data-hook='avp-badge']") !== null, 
            title: $reviewTitle.innerText.replace(lineBreakRegex, ' ').trim(), 
            body: $reviewBody.innerText.replace(lineBreakRegex, ' ').trim() 
        }, withHelpfulVotes), withBrand));
    });
    return reviews;
}
