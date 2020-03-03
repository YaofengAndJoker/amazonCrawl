function createReviewUrl({ asin, page = 1, }) {
    if (asin === undefined) {
        throw new Error('asin is not defined');  
    }
    return `https://www.amazon.com/product-reviews/${asin}/?pageNumber=${page}`;
}
