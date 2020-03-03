var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


function scrapeSearchResults() {
    const {   workers, workerProps } ;
    workerProps = "";
    //worker 负责打开连接，阻止'font', 'image', 'stylesheet'，它是一个标签页
    //workerProps  指定核实算脚本加载完成 1. dom load完成时  2. 网络空闲时等等
    //date是当前日期
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    config={categories:"both"};
    const brands = [
        'ASUS',
        'Apple',
        'Google',
        'HUAWEI',
        'Motorola',
        'Nokia',
        'OnePlus',
        'Samsung',
        'Sony',
        'Xiaomi',
      ];
    const brandKeywords = [
        { brand: 'Apple', keywords: ['iPhone'] },
        { brand: 'Google', keywords: ['Pixel'] },
        { brand: 'HUAWEI', keywords: ['Honor'] },
        { brand: 'Motorola', keywords: ['Moto'] },
        { brand: 'Samsung', keywords: ['Haven'] },
        { brand: 'Sony', keywords: ['Xperia'] },
      ];
    const categories = config.categories === 'both'
        ? [true, false]
        : [config.categories === 'locked'];
    let items = [];
    for (const unlocked of categories) {
        let categoryItems = [];
        const category = (unlocked ? 'unlocked' : 'locked');
        const worker = workers[0];
        const url = createSearchUrl({ brands, unlocked });
        console.log(`Getting page 1 of ??? for ${category} category...`);
        yield worker.goto(url, workerProps);
        const { meta, results } = yield worker.evaluate(extractSearchResultPage);
        categoryItems.push(...results.map(r => (Object.assign(Object.assign({}, r), { category }))));
        let currentPage = 2;
        let totalPage = meta.totalPages;
        while (currentPage <= totalPage) { //每个标签页依次打开各自的url
            const finishedWorkers = yield Promise.all(workers.reduce(//除了第一个元素，剩下的都要执行这个函数  
            //[x1, x2, x3, x4].reduce(f) = f(f(f(x1, x2), x3), x4)
            (finished, worker) => {
                if (currentPage <= totalPage) {
                    const page = currentPage++;
                    const url = createSearchUrl({ brands, page, unlocked });
                    console.log(`Getting page ${page} of ${totalPage} for ${category} category... (${url})`);
                    return finished.concat(worker.goto(url, workerProps).then(() => worker));
                }
                return finished;
            }, [] // 初始值设置为空 reduce的initialValue   https://www.jianshu.com/p/e375ba1cfc47
            ));
            const extracted = yield Promise.all(finishedWorkers.map(function evaluate(worker, i) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        return worker.evaluate(extractSearchResultPage);
                    }
                    catch (e) {
                        console.log(`Evaluation failed on worker #${i + 1}, reloading page...`);
                        yield worker.reload(workerProps);
                        return evaluate(worker, i);
                    }
                });
            }));
            extracted.forEach(({ meta, results }) => {
                if (meta.totalPages > totalPage) {
                    totalPage = meta.totalPages;
                }
                categoryItems.push(...results);
            });
            console.log(`Saving ${category} results to separate file...`);
            saveToData(categoryItems, `${date}-items-${category}.csv`);
            items.push(...categoryItems);
        }
    }
    //yield browser.close();//关闭浏览器   这步我们不会做
    if (brands.length > 0) {
        console.log('Detecting result brands...');
        items = items.map((_a) => {
            var { asin } = _a, item = __rest(_a, ["asin"]);
            const lowerUrl = item.url.toLowerCase();
            const lowerTitle = item.title.toLowerCase();
            const fromKnownBrands = brands.find((b) => {
                const lower = b.toLowerCase();
                return lowerUrl.match(lower) || lowerTitle.match(lower);
            });
            const fromKeywordsResult = brandKeywords.find((kw) => {
                return kw.keywords.find((w) => {
                    const lower = w.toLowerCase();
                    return lowerUrl.match(lower) || lowerTitle.match(lower);
                });
            });
            const fromKeywords = typeof fromKeywordsResult !== 'undefined'
                ? fromKeywordsResult.brand
                : undefined;
            const brand = fromKnownBrands || fromKeywords;
            return Object.assign({ asin, brand }, item);
        });
    }
    else {
        console.log('Brands config is empty, skipping brand detecting...');
    }
    console.log('Sorting and finding duplicates...');
    const asins = [...new Set(items.map(({ asin }) => asin))].sort();
    items = asins.map(asin => items.find(item => item.asin === asin));
    console.log(`Saving results...`);
    saveToData(items, `${date}-items.csv`);
    
}
