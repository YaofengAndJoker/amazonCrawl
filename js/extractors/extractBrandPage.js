function extractBrand() {
    const $brand = document.querySelector('a#bylineInfo');
    return $brand !== null ? $brand.innerText : undefined;
}
