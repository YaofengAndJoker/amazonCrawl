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
let completeTabsId = [];  // 网页加载完成的列表
let tabsWithTask = [];  //记录了分配的任务的tab有哪几个,到时候要催数据
let db = undefined;

let NUM_OF_WORKERS = 1;

// 是否显示图片,字体和CSS
let showImage = true;
let showFont = true;
let showStyle = true;
let currentTabid = undefined;

function awaitPageLoading() {
    return new Promise((resolve, reject) => {
        let callbackFun = function (id, info, tab) {
            if (tabsWithTask.indexOf(tab.id) === -1)//只关注我们脚本创建的标签页的状态
                return;
            if (tab.status === 'complete' && info["status"] !== undefined)  //complte 事件会触发多次,一次info为{status:'complete'} 一次为 favIconUrl: "https://www.amazon.cn/favicon.ico",如果页面有ifame,complete次数会更多,这时候需要通过url对比来判断
            {
                if (completeTabsId.indexOf(tab.id) === -1)//不知道为什么,同一个标签页会触发多次的complete,这里是为了去重
                    completeTabsId.push(tab.id);
                if (completeTabsId.sort().toString() === tabsWithTask.sort().toString()) {
                    chrome.tabs.onUpdated.removeListener(callbackFun);
                    completeTabsId.length = 0;//清空
                    resolve("页面都已经加载完毕");
                }
            }
        };
        chrome.tabs.onUpdated.addListener(callbackFun);
    });
}

function CreateTask(getURL, urls, extractor, table_name, checkstopCondition) {
    this.getURL = getURL;
    this.urls = urls;
    this.extractor = extractor;
    this.table_name = table_name;
    this.checkstopCondition = checkstopCondition;
}

function update_process(tabid, value) {
    chrome.tabs.sendMessage(tabid, {cmd: 'update_process', value: value}, function (response) {
        console.log(response);
    });
}

function getCurrentTabid() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            console.log(tabs[0].id);
            resolve(tabs[0].id);
        })
    });
}

function getUrls(tabid, getURL) {
    return new Promise((resolve, reject) => {  // 根据tabid获取url列表
        chrome.tabs.executeScript(tabid, {code: getURL/*,runAt:"document_end"*/}, (data) => {
            resolve(JSON.parse(data));
        });
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

function afterGetDataFun(data, table_name) {
    //console.dir(data);
    if (data[0] === undefined)
        console.log("没有抓取到数据");

    db[table_name].bulkPut(data[0]/*,['asin']*/).then(
        () => {
            console.log("data save end");
        }
    ).catch(function (error) {
        console.error("Ooops: " + error);
    });
}

function closeAllTabs(newTabsId) {
    for (let item of newTabsId) {
        chrome.tabs.remove(item);
    }
    newTabsId.length = 0;
}

function awaitTabsExeScript(tabsWithTask, extractor, afterGetDataFun, table_name) {
    let awaitExeScript = [];
    for (let item of tabsWithTask) {
        awaitExeScript.push(new Promise((resolve, reject) => {
            chrome.tabs.executeScript(item, {code: extractor /*,runAt:"document_end"*/}, async (data) => {
                afterGetDataFun(data, table_name);
                resolve(data);
            });  //end of executeScript
        }));// end of push
    }
    return Promise.all(awaitExeScript).then(() => {
        console.log("分配了任务的tabs任务完成")
    });
}

function DexieDBinit() {
    if (db === undefined) {  // database table operate just need once
        db = new Dexie("products_database");
        db.version(1).stores({
            productsList: '++,asin,title,url,image,rating,reviewUrl,totalReviews,price,originalPrice,fromUrl,keywords,page',
            reviewsList: 'date,star,content'
        });
    }
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

async function main_control(task) {
    DexieDBinit();
    let newTabsId = await createTabs();
    update_process(currentTabid, "数据获取开始");
    // 依次给tabs分配任务,所有tab完成后,分配下一次任务
    let currentURLIndex = 0;
    while (currentURLIndex < task.urls.length) {
        update_process(currentTabid, '正在获取第' + (currentURLIndex + 1) + "页" + ",总共" + task.urls.length + "页");

        tabsWithTask = [];//清空一下,认为所有tab都没有任务
        for (let tabId of newTabsId) {
            if (currentURLIndex < task.urls.length) {
                tabsWithTask.push(tabId);
                PageUpdate(tabId, task.urls[currentURLIndex]);
                currentURLIndex++;
            }
        }
        await awaitPageLoading();  //监听onUpdated  等待页面加载完成 awaitPageLoading每次都要再承诺一次(新建一个Promise)
        let extractorDatas = await awaitTabsExeScript(tabsWithTask, task.extractor, afterGetDataFun, task.table_name);

        if (task.checkstopCondition(extractorDatas)) {
            return;
        }
    } // end of while

    closeAllTabs(newTabsId);

    update_process(currentTabid, "数据获取完成");

    createNotify('数据获取完成', '所有数据已获取完成,可以下载保存了', true);
}

chrome.contextMenus.create({
    "title": "获取商品列表和商品评论",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": async function () {
        currentTabid = await getCurrentTabid();

        let productsTask = new CreateTask("getProductsURLs()", [], "giveProductsResult()", "productsList", (datas) => {
        });
        productsTask.urls = await getUrls(currentTabid, productsTask.getURL);

        //获取url列表的方式抽出来,有的URL是由前端抓的,有的是background的数据库生成的;

        //var reviewssTask = new createTask('reviewssList',"getURLs()",[],"giveReviewsResult()","reviewsList");
        showImage = showStyle = showFont = false;  //屏蔽图片  CSS和font
        await main_control(productsTask);
        showImage = showStyle = showFont = true;  //恢复图片  CSS和font的显示
        //main_control(reviewssTask);
    }
});
chrome.contextMenus.create({
    "title": "删除之前获取的数据",
    "contexts": ["page", "all"],
    documentUrlPatterns: [
        "*://*.amazon.com/*", "*://*.amazon.cn/*", "*://*.amazon.ca/*", "*://*.amazon.in/*", "*://*.amazon.co.uk/*", "*://*.amazon.com.au/*", "*://*.amazon.de/*", "*://*.amazon.fr/*", "*://*.amazon.it/*", "*://*.amazon.es/*"
    ],
    "onclick": function () {
        try {
            DexieDBinit();
            db.productsList.clear();  // after download dataset,also need clear table datas?
            db.reviewsList.clear();
        } catch (error) {
            console.log("data clear failed");
        }
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
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('收到来自content-script的消息：');
    if (request['greeting'] === 'download') {
        exportCSV("productsList");
    }
    console.log(request, sender, sendResponse);
    sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});


async function exportCSV(table) {//从indexedDB中导出数据到文件
    DexieDBinit();
    let coll = db[table].toCollection();
    /*
    coll.each(
        (item)=>{
            console.dir(item);
            dataList.push(item);
        }
    );*/
    let dataList = await new Promise((resolve, reject) => {
            coll.toArray((array) => {
                resolve(array);
            });
        }
    );

    let config = {
        quotes: false, //or array of booleans
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        header: true,
        newline: "\r\n",
        skipEmptyLines: false, //or 'greedy',
        columns: null //or array of strings
    };
    var csv_content = Papa.unparse(JSON.stringify(dataList), config);// change dataList Array to csv File  use papaparse
    downloadData(csv_content);

}

function downloadData(csv_content) {
    let url = "data:text/csv;charset=utf-8,%EF%BB%BF" + csv_content;
    let link = document.createElement("a");
    link.href = url;
    link.download = "datas.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    }
}, {urls: ["<all_urls>"]}, ["blocking"]);