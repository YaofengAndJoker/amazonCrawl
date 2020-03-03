"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const extractors_1 = require("./extractors");
const utils_1 = require("./utils");
function scrapeItemReviews() {
    return __awaiter(this, void 0, void 0, function* () {
        const { browser, workers, workerProps, date } = yield _1.initialize();
        const results = _1.loadFromData(`${date}-items.csv`);
        for (const [idx, { asin, totalReviews, url }] of results.entries()) {
            const itemReviews = [];
            let currentPage = 1;
            const totalPage = Math.ceil(totalReviews / 10);
            const itemProgress = `${idx + 1} of ${results.length}`;
            while (currentPage <= totalPage) {
                const finishedWorkers = yield Promise.all(workers.reduce((finished, worker) => {
                    if (currentPage <= totalPage) {
                        const page = currentPage++;
                        const url = utils_1.createReviewUrl({ asin, page });
                        const pageProgress = `page ${page} of ${totalPage}`;
                        console.log(`Getting ${asin} (${itemProgress}, ${pageProgress})... (${url})`);
                        return finished.concat(worker.goto(url, workerProps).then(() => worker));
                    }
                    return finished;
                }, []));
                const extracted = yield Promise.all(finishedWorkers.map(function evaluate(worker, i) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            return worker.evaluate(extractors_1.extractReviewPage);
                        }
                        catch (e) {
                            console.log(`Evaluation failed on worker #${i + 1}, reloading page...`);
                            yield worker.reload(workerProps);
                            return evaluate(worker, i);
                        }
                    });
                }));
                extracted.forEach(pageReviews => {
                    itemReviews.push(...pageReviews.map(r => (Object.assign({ asin }, r))));
                });
            }
            if (typeof results[idx].brand !== 'string') {
                console.log(`${asin} has no brand name, saving brand name...`);
                const firstWorker = workers[0];
                results[idx].brand = yield firstWorker
                    .goto(url)
                    .then(() => firstWorker.evaluate(extractors_1.extractBrandPage));
            }
            console.log(`Saving ${asin} reviews...`);
            _1.saveToData(itemReviews, 'reviews', `${date}-${asin}.csv`);
        }
        yield browser.close();
        console.log('Updating items with no brands...');
        _1.saveToData(results, `${date}-items.csv`);
        let mergedReviews = [];
        console.log('Merging all reviews into one file...');
        for (const { asin } of results) {
            const reviews = _1.loadFromData('reviews', `${date}-${asin}.csv`);
            mergedReviews.push(...reviews);
        }
        console.log('Saving reviews...');
        _1.saveToData(mergedReviews, `${date}-reviews.csv`);
    });
}
exports.scrapeItemReviews = scrapeItemReviews;
//scrapeItemReviews()
//# sourceMappingURL=scrapeItemReviews.js.map