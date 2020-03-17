/**
 * await 等待一个promise 的状态变成resolve 或reject ,
 * resolve是用来改变promise状态为resolve的,
 * reject的改变promise状态为reject的
 * 在回调中调这两个方法,可以使Promise状态变化
 * /
 //-------------------- 右键菜单演示 ------------------------//
 /*
 chrome.contextMenus.create({
	title: "测试右键菜单",
	onclick: function(){
		chrome.notifications.create(null, {
			type: 'basic',
			iconUrl: 'img/icon.png',
			title: '这是标题',
			message: '您刚才点击了自定义右键菜单！'
		});
	}
});*/
/*
chrome.contextMenus.create({
	title: '使用度娘搜索：%s', // %s表示选中的文字
	contexts: ['selection'], // 只有当选中文字时才会出现此右键菜单
	onclick: function(params)
	{
		// 注意不能使用location.href，因为location是属于background的window对象
		chrome.tabs.create({url: 'https://www.baidu.com/s?ie=utf-8&wd=' + encodeURI(params.selectionText)});
	}
});
*/
let debugMode = false;
/*
chrome.storage.sync.get({debugMode: true}, function (items) {
    debugMode = items.debugMode;
});*/
let tabsWithTask = [];  //记录了分配的任务的tab有哪几个,到时候要催数据
let waitTabs = [];  //记录需要等待完成状态的URL有哪些
let db = undefined;

let NUM_OF_WORKERS = 10;

// 是否显示图片,字体和CSS
let showImage = true;
let showFont = true;
let showStyle = true;
let currentTabid = undefined;
let MAX_ONE_PAGE_NUMBERS = 10;
let REVIEW_YEAR_RANGE = 4;

function DexieDBinit() { //https://dexie.org/docs/Version/Version.stores()
    if (db === undefined) {  // database table operate just need once
        db = new Dexie("products_database");
        db.version(1).stores({
            productsList: '&asin,title,url,image,rating,reviewUrl,totalReviews,price,originalPrice,fromUrl,keywords,page',
            reviewsList: '++,asin,name,rating,date,verified,title,body,votes,withHelpfulVotes,withBrand',
            productCorrect: '&asin,totalReviews,rating',  /*修正评论数量*/
            earliestReview: '&asin,date',
            productDetail: '&asin,brand,upDate,sellerName'
            /*加一个保存进度的东西? 如何?*/
        });
    }
}
function clearDB() {
    try {
        DexieDBinit();
        db.productsList.clear();  // after download dataset,also need clear table datas?
        db.reviewsList.clear();
        db.productCorrect.clear();
        db.earliestReview.clear();
        db.productDetail.clear();
    } catch (error) {
        console.log("data clear failed");
    }
}

function CreateTask(getURL, urls, extractor, table_name, checkstopCondition, checkSaveCondition) {
    this.getURL = getURL;
    this.urls = urls;
    this.extractor = extractor;
    this.table_name = table_name;
    this.checkstopCondition = checkstopCondition;
    this.checkSaveCondition = checkSaveCondition;
}

function getUrls(tabid, getURL) {
    return new Promise((resolve, reject) => {  // 根据tabid获取url列表
        chrome.tabs.executeScript(tabid, {code: getURL/*,runAt:"document_end"*/}, (data) => {
            resolve(JSON.parse(data));
        });
    });
}

function awaitPageLoading() {
    return new Promise((resolve, reject) => {     // 页面可能有重定向,location.href可能被脚本改变,不再看url,而是看tab.id
        let callbackFun = function (id, info, tab) {
            if (tab.status === 'complete' && info["status"] !== undefined) {  //complte 事件会触发多次,一次info为{status:'complete'} 一次为 favIconUrl: "https://www.amazon.cn/favicon.ico",如果页面有ifame,complete次数会更多,这时候需要通过url对比来判断
                let index = waitTabs.indexOf(tab.id);
                if (index !== -1) {// find complete in waitURLS
                    waitTabs.splice(index, 1)
                }
                if (waitTabs.length === 0) {
                    chrome.tabs.onUpdated.removeListener(callbackFun);
                    resolve("awaitPageLoading complete");
                }
            }
        };
        chrome.tabs.onUpdated.addListener(callbackFun);
    });
}

function afterGetDataFun(data, table_name, checkSaveCondition) {
    //console.dir(data);
    if(data === undefined) { // 可能有一个页面加载超时了,得到是不是空数组,而是undefined
        throw new Error("didn't get any data");
    }
    if (data[0] === undefined)
        console.log("没有抓取到数据");
    let DataSaved = checkSaveCondition(data[0]);
    db[table_name].bulkPut(DataSaved/*,['asin']*/).then(
        () => {
            console.log("data save end");
        }
    ).catch(function (error) {
        console.error("Ooops: " + error);
    });
}

function awaitTabsExeScript(tabsWithTask, extractor, afterGetDataFun, table_name, checkSaveCondition) {
    let awaitExeScript = [];
    for (let item of tabsWithTask) {
        awaitExeScript.push(new Promise((resolve, reject) => {
            chrome.tabs.executeScript(item, {code: extractor /*,runAt:"document_end"*/}, async (data) => {
                afterGetDataFun(data, table_name, checkSaveCondition);
                resolve(data[0]);
            });  //end of executeScript
        }));// end of push
    }
    return Promise.all(awaitExeScript).then((datas) => {
        return datas;
    });
}

function update_process(tabid, value) {
    chrome.tabs.sendMessage(tabid, {cmd: 'update_process', value: value}, function (response) {
        console.log(response);
    });
}

function update_debug_msg(tabid, value) {
    if (debugMode) {
        chrome.tabs.sendMessage(tabid, {cmd: 'debug', value: value}, function (response) {
            console.log(response);
        });
    }
}

function getCurrentTabid() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            console.log(tabs[0].id);
            resolve(tabs[0].id);
        })
    });
}

function createTabs() {
    let workerTabList = [];
    for (let i = 0; i < NUM_OF_WORKERS; i++) {  //打开每个标签页
        workerTabList.push(new Promise((resolve, reject) => {
                chrome.tabs.create({"active": false}, (tab) => {
                    resolve(tab.id);
                });// end of create
            }) // end of promise
        );// end of push
    }// end of for
    return Promise.all(workerTabList);  // 等待所有标签页创建完成
}

function closeAllTabs(newTabsId) {
    for (let item of newTabsId) {
        chrome.tabs.remove(item);
    }
    newTabsId.length = 0;
}

function PageUpdate(item, url) {
    chrome.tabs.update(item, {url: url}, (tab) => {
    });
}

function createNotify(title, message, requireInteraction) {
    chrome.notifications.create(null, {
        type: 'basic',   // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Notifications/TemplateType
        iconUrl: 'img/icon.png',
        title: title,
        message: message,
        //buttons: [{title:'点击此处下载文件'/*,iconUrl:'icon3.png'*/}],//,{title:'按钮2的标题',iconUrl:'icon4.png'}],//https://stackoverflow.com/questions/20188792/is-there-any-way-to-insert-action-buttons-in-notification-in-google-chrome#answer-20190702
        requireInteraction: requireInteraction
    });
}

async function main_control(task, processInfo = true) {
    DexieDBinit();
    let newTabsId = await createTabs();
    if (processInfo) {
        update_process(currentTabid, "数据获取开始");
    }
    // 依次给tabs分配任务,所有tab完成后,分配下一次任务
    let currentURLIndex = 0;
    while (currentURLIndex < task.urls.length) {
        if (processInfo) {
            update_process(currentTabid, '正在获取第' + (currentURLIndex + 1) + "页" + ",总共" + task.urls.length + "页");
        }
        tabsWithTask = [];//清空一下,认为所有tab都没有任务
        for (let tabId of newTabsId) {
            if (currentURLIndex < task.urls.length) {
                tabsWithTask.push(tabId);
                waitTabs.push(tabId);
                PageUpdate(tabId, task.urls[currentURLIndex]);
                currentURLIndex++;
            }
        }
        await awaitPageLoading();  //监听onUpdated  等待页面加载完成 awaitPageLoading每次都要再承诺一次(新建一个Promise)
        let extractorDataArray;
        try {
            extractorDataArray = await awaitTabsExeScript(tabsWithTask, task.extractor, afterGetDataFun, task.table_name, task.checkSaveCondition);
            update_debug_msg(currentTabid, "extractorDataArray start");
            update_debug_msg(currentTabid, extractorDataArray);
            update_debug_msg(currentTabid, "extractorDataArray end");
        }
        catch (e) {  // if get data error ,then reload all tab ,redo flow
            /*
            waitTabs=[];
            for(let tabid of tabsWithTask){
                chrome.tabs.reload(tabid);
                waitTabs.push(tabid);
            }*/
            waitTabs.length = 0 ; // clear array
            currentURLIndex = currentURLIndex - tabsWithTask.length; // forget this tasks,redo it
            continue ;
        }
        if (task.checkstopCondition(extractorDataArray)) {
            break;
        }
    } // end of while

    if (!debugMode) {
        closeAllTabs(newTabsId);
    }
    if (processInfo) {
        update_process(currentTabid, "数据获取完成");
    }

}

chrome.contextMenus.create({
    "title": "获取商品列表",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();

        let productsTask = new CreateTask("getProductsURLs()", [], "giveProductsResult()", "productsList", (datas) => {
            return false;
        }, (data) => {
            return data;  // filter data
        });
        productsTask.urls = await getUrls(currentTabid, productsTask.getURL);
        update_debug_msg(currentTabid, "productsTask value:");
        update_debug_msg(currentTabid, productsTask);
        //获取url列表的方式抽出来,有的URL是由前端抓的,有的是background的数据库生成的;

        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        await main_control(productsTask);
        createNotify('数据获取完成', '所有数据已获取完成,可以下载保存了', true);
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
    }
});
chrome.contextMenus.create({
    "title": "获取商品详情页",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();
        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        let dataList = await getDataList("productsList");// 1. get asins
        update_process(currentTabid, "获取商品详情页开始");
        let asinReviewsTask = new CreateTask(``, [], "givAsinDetail()", "productDetail", (datas) => {
            return false; // don't need stop ,only one page
        }, (data) => {
            return data; // don't filter any data
        });
        for (let data of dataList) { //create task for one asin
            let asin = data['asin'];
            /*if(data['totalReviews'] === 0) {  // skip no reviews asin
                continue;
            }*/
            asinReviewsTask.urls = asinReviewsTask.urls.concat( await getUrls(currentTabid, `getAsinDetailURL('${asin}')` ));
            //asinReviewsTask.urls = ["https://www.amazon.cn/product-reviews/B00HU65SEU/?pageNumber=1&sortBy=recent"];
            update_process(currentTabid, (dataList.indexOf(data) + 1) + "/" + dataList.length);
        }
        await main_control(asinReviewsTask);
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
        createNotify('获取商品详情页 完成', '获取商品详情页完成', false);
    }
});
chrome.contextMenus.create({
    "title": "修正商品列表评论数",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();
        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        let dataList = await getDataList("productsList");// 1. get asins
        update_process(currentTabid, "Reviews数量修正开始");
        let asinReviewsTask = new CreateTask(``, [], "correctsReviewsAndStar()", "productCorrect", (datas) => {
            return false; // don't need stop ,only one page
        }, (data) => {
            return data; // don't filter any data
        });
        for (let data of dataList) { //create task for one asin
            let asin = data['asin'];
            /*if(data['totalReviews'] === 0) {  // skip no reviews asin
                continue;
            }*/
            const totalPage = 1;//为获得reviews的数量,只看第一页就有的

            asinReviewsTask.urls = asinReviewsTask.urls.concat( await getUrls(currentTabid, `getReviewURLs('${asin}',${totalPage})`));
            //asinReviewsTask.urls = ["https://www.amazon.cn/product-reviews/B00HU65SEU/?pageNumber=1&sortBy=recent"];
            update_process(currentTabid, `${dataList.indexOf(data) + 1}/${dataList.length}`);

        }
        await main_control(asinReviewsTask);
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
        createNotify('修正reviews完成', '获取reviews完成', false);
    }
});
chrome.contextMenus.create({
    "title": "获取最早的评论",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();
        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        let dataList = await getDataList("productCorrect");// 1. get asins
        update_process(currentTabid, "Reviews数量修正开始");
        let asinReviewsTask = new CreateTask(``, [], "getEarliestReview()", "earliestReview", (datas) => {
            return false; // don't need stop ,only one page
        }, (data) => {
            // only get the last one ,already filter in extractor
            return data; // don't filter any data
        });

        for (let data of dataList) { //create task for one asin
            let asin = data['asin'];
            if (data['totalReviews'] === 0) {  // skip no reviews asin
                continue;
            }
            const Page = Math.ceil(data['totalReviews'] / MAX_ONE_PAGE_NUMBERS);//为获得reviews的数量,只看第一页就有的

            asinReviewsTask.urls = asinReviewsTask.urls.concat (await getUrls(currentTabid, `getCertainReviewURLs('${asin}',${Page})`) );
            //asinReviewsTask.urls = ["https://www.amazon.cn/product-reviews/B00HU65SEU/?pageNumber=1&sortBy=recent"];
            update_process(currentTabid, `${dataList.indexOf(data) + 1}/${dataList.length}`);

        }
        await main_control(asinReviewsTask);
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
        createNotify('获取最早的reviews完成', '获取最早reviews完成', false);
    }
});
// 修正review的数量和星级,因为商品列表的不准,有时候代表是是亚马逊美国  评论数为0,不需要修正
// 获取最早评论时间(该任务依赖review数的正确性)     评论数为0,不需要获取
// 获得asin的卖家信息,有可能没有  https://www.amazon.com/dp/B07QWJBVVJ/?th=1     评论数为0,不需要获取  ,这里也有品牌信息,不过评论页面也有品牌信息的
// 获得asin的创建日期  https://www.amazon.cn/dp/B07NC189JJ/ref=cm_cr_arp_d_product_top?ie=UTF8  可能有,可能没有  评论数为0,不需要获取创建日期
//  获得asin的品牌,在review页面就有的   已修正    评论数为0的,不需要获取品牌信息
chrome.contextMenus.create({
    "title": "get reviews ",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();
        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        let currentYear = new Date().getFullYear();
        let dataList = await getDataList("productCorrect");// 1. get asins
        update_process(currentTabid, "Reviews数据获取开始");
        for (let data of dataList) { //create task for one asin
            let asin = data['asin'];
            if (data['totalReviews'] === 0) {  // skip no reviews asin
                continue;
            }
            const totalPage = Math.ceil(data['totalReviews'] / MAX_ONE_PAGE_NUMBERS);//获得reviews的数量,计算页数
            let asinReviewsTask = new CreateTask(`getReviewURLs('${asin}',${totalPage})`, [], "giveReviewsResult()", "reviewsList", (datas) => {
                for (let data of datas) {// 评论数组1 评论数组2
                    if (data["length"] === undefined || data.length === 0) {  // don't get anything ,stop this asin task
                        return true;
                    }
                    for (let oneReview of data) {
                        let reviewYear = parseInt(oneReview['date'].split('-')[0]);
                        if ((currentYear - reviewYear) > REVIEW_YEAR_RANGE) {  // 如果是4年前的,那表示不需要抓了  // for test only get one year
                            return true;
                        }
                    }
                }
                return false;// false ,don't stop
            }, (data) => {
                let result = [];
                if (data["length"] === undefined || data.length === 0) {  // don't get anything ,stop this asin task
                    return []; // false ,don't save
                }
                for (let oneReview of data) {
                    let reviewYear = oneReview['date'].split('-')[0];
                    if ((currentYear - reviewYear) <= REVIEW_YEAR_RANGE) {  // 如果是4年前的,那表示不需要抓了  // for test only get one year
                        result.push(oneReview);
                    }
                }
                return result;
            });
            asinReviewsTask.urls = await getUrls(currentTabid, asinReviewsTask.getURL);
            update_process(currentTabid, `${dataList.indexOf(data) + 1}/${dataList.length}`);
            await main_control(asinReviewsTask, false);
        }
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
        createNotify('获取reviews完成', '获取reviews完成', false);
    }

});


chrome.contextMenus.create({
    "title": "删除之前获取的数据",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": function () {
        clearDB();
        createNotify('数据清除完成', '已清除旧数据', false);
    }

});
/*
//-------------------- badge演示 ------------------------//
(function()
{
	var showBadge = false;
	var menuId = chrome.contextMenus.create({
		title: '显示图标上的Badge',
		type: 'checkbox',
		checked: false,
		onclick: function() {
			if(!showBadge)
			{
				chrome.browserAction.setBadgeText({text: 'New'});
				chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
				chrome.contextMenus.update(menuId, {title: '隐藏图标上的Badge', checked: true});
			}
			else
			{
				chrome.browserAction.setBadgeText({text: ''});
				chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
				chrome.contextMenus.update(menuId, {title: '显示图标上的Badge', checked: false});
			}
			showBadge = !showBadge;
		}
	});
})();
*/

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    console.log('收到来自content-script的消息：');
    if (request['greeting'] === 'download') {
        let stringDate = new Date();
        stringDate = `${stringDate.getFullYear()}/${stringDate.getMonth()+1}/${stringDate.getDate()}`
        let dataList = await getDataList("productsList");
        downloadFile(dataList, `productsList-${stringDate}.csv`);
        dataList = await getDataList("reviewsList");
        downloadFile(dataList, `reviewsList-${stringDate}.csv`);
        dataList = await getDataList("productCorrect");
        downloadFile(dataList, `productCorrect-${stringDate}.csv`);
        dataList = await getDataList("earliestReview");
        downloadFile(dataList, `earliestReview-${stringDate}.csv`);
        dataList = await getDataList("productDetail");
        downloadFile(dataList, `productDetail-${stringDate}.csv`);
    }

    //console.log(request, sender, sendResponse);
    //sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});

function getDataList(table) {//从indexedDB中导出数据到文件
    DexieDBinit();
    let coll = db[table].toCollection();
    /*
    coll.each(
        (item)=>{
            console.dir(item);
            dataList.push(item);
        }
    );*/
    return new Promise((resolve, reject) => {
            coll.toArray((array) => {
                resolve(array);
            });
        }
    );
}

function downloadFile(dataList, filename) {
    let config = {
        quotes: true, //or array of booleans
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        header: true,
        newline: "\r\n",
        skipEmptyLines: false, //or 'greedy',
        columns: null //or array of strings
    };  // dataList 里面如果出现#号,就会出错的
    var csv_content = Papa.unparse(dataList, config);// change dataList Array to csv File  use papaparse
    //https://stackoverflow.com/questions/54793997/export-indexeddb-object-store-to-csv
    // if use uri with tag a ,will lose data  --- let url = "data:text/csv;charset=utf-8,%EF%BB%BF" + csv_content; ink.href = url;
    let blob = new Blob(['\uFEFF'+csv_content],{type:"text/csv,charset=UTF-8"});//https://blog.csdn.net/weixin_33963594/article/details/91586662
    let anchor = document.createElement('a');
    anchor.setAttribute('download',filename);
    let url = URL.createObjectURL(blob);
    anchor.setAttribute('href',url);
    anchor.click();
    URL.revokeObjectURL(url);

}

// 获取当前选项卡ID
/*
function getCurrentTabId(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (callback) callback(tabs.length ? tabs[0].id : null);
    });
}

// 当前标签打开某个链接
function openUrlCurrentTab(url) {
    getCurrentTabId(tabId => {
        chrome.tabs.update(tabId, {url: url});
    })
}

// 新标签打开某个链接
function openUrlNewTab(url) {
    chrome.tabs.create({url: url});
}
*/
/*
// omnibox 演示
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    console.log('inputChanged: ' + text);
    if (!text) return;
    if (text == '美女') {
        suggest([
            {content: '中国' + text, description: '你要找“中国美女”吗？'},
            {content: '日本' + text, description: '你要找“日本美女”吗？'},
            {content: '泰国' + text, description: '你要找“泰国美女或人妖”吗？'},
            {content: '韩国' + text, description: '你要找“韩国美女”吗？'}
        ]);
    } else if (text == '微博') {
        suggest([
            {content: '新浪' + text, description: '新浪' + text},
            {content: '腾讯' + text, description: '腾讯' + text},
            {content: '搜狐' + text, description: '搜索' + text},
        ]);
    } else {
        suggest([
            {content: '百度搜索 ' + text, description: '百度搜索 ' + text},
            {content: '谷歌搜索 ' + text, description: '谷歌搜索 ' + text},
        ]);
    }
});
*/
/*
// 当用户接收关键字建议时触发
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log('inputEntered: ' + text);
    if (!text) return;
    var href = '';
    if (text.endsWith('美女')) href = 'http://image.baidu.com/search/index?tn=baiduimage&ie=utf-8&word=' + text;
    else if (text.startsWith('百度搜索')) href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text.replace('百度搜索 ', '');
    else if (text.startsWith('谷歌搜索')) href = 'https://www.google.com.tw/search?q=' + text.replace('谷歌搜索 ', '');
    else href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text;
    openUrlCurrentTab(href);
});
*/
// 预留一个方法给popup调用
function testBackground() {
    alert('你好，我是background！');
}


// web请求监听，最后一个参数表示阻塞式，需单独声明权限：webRequestBlocking
chrome.webRequest.onBeforeRequest.addListener(details => {
    // cancel 表示取消本次请求
    if (!showImage && details.type == 'image') return {cancel: true};  //'font', 'image', 'stylesheet'
    if (!showFont && details.type == 'font') return {cancel: true};
    if (!showStyle && details.type == 'stylesheet') return {cancel: true};
    /*
    // 简单的音视频检测
    // 大部分网站视频的type并不是media，且视频做了防下载处理，所以这里仅仅是为了演示效果，无实际意义
    if (details.type == 'media') {
        chrome.notifications.create(null, {
            type: 'basic',   // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Notifications/TemplateType
            iconUrl: 'img/icon.png',
            title: '检测到音视频',
            message: '音视频地址：' + details.url,
            //requireInteraction:true
        });
    }*/
}, {urls: ["<all_urls>"]}, ["blocking"]);