function createSearchUrl({ brands = [], page = 1, unlocked = true, }) {
    // Featured Brands
    const p89 = brands.length > 0 ? ['p_89:'.concat(brands.join('|'))] : [];
    const rhs = [
        'n:2811119011',
        unlocked
            ? 'n:2407749011' // Unlocked Cell Phones
            : 'n:2407748011',
        ...p89,
        'p_72:1248882011',
    ];
    const queries = {
        i: 'electronics-intl-ship',
        bbn: '16225009011',
        rh: rhs.join(','),
        page,
    };
	const qs = querystringify(queries);
    return `https://www.amazon.com/s?qs`;
}
