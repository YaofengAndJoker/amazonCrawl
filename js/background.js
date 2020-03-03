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
const NUM_OF_WORKS = 1;
var newTabsId = [];

/*
	//爬完关闭所有的tab
	for(const item of newTabsId){
		chrome.tabs.remove(item);
	}
	newTabsId.length = 0;	
}
*/
// 是否显示图片
var showImage = true;
var showFont = true;
var showStyle = true;

/*chrome.storage.sync.get({showImage: true}, function(items) {
	showImage = items.showImage;
});
*/
var completeTabsId = [];
var tasked=[];  //记录了分配的任务的tab有哪几个,到时候要催数据
function awaitPageLoading(){
	return new Promise((resolve,reject)=>{
		var callbackFun = function (id,info,tab) {
			if(tasked.indexOf(tab.id)==-1)//只关注我们脚本创建的标签页的状态
				return ;
			if(tab.status == 'complete' &&info["status"]!=undefined)  //complte 事件会触发多次,一次info为{status:'complete'} 一次为 favIconUrl: "https://www.amazon.cn/favicon.ico",如果页面有ifame,complete次数会更多,这时候需要通过url对比来判断
			{	
				/*for debug code start*/
				//console.log("tab");console.dir(tab);console.log("info");console.dir(info);console.log("id");console.dir(id);
				/*for debug code end */
				if(completeTabsId.indexOf(tab.id)==-1)//不知道为什么,同一个标签页会触发多次的complete,这里是为了去重
					completeTabsId.push(tab.id);
				if(completeTabsId.sort().toString() == tasked.sort().toString() )
				{
					chrome.tabs.onUpdated.removeListener(callbackFun);
					completeTabsId.length = 0;//清空
					resolve("页面都已经加载完毕");
				}
			}
		};
		chrome.tabs.onUpdated.addListener(callbackFun);
	});
}
var stage = 0;
var resultList = [];
var asinList = [];
//stage =1 在获取url list 
//stage =2 在依次打开tab,获取商品列表
//stage = 3 在获取每个商品的评论
chrome.contextMenus.create({
    "title": "爬取商品列表和商品评论",
    "contexts": ["page"],
    documentUrlPatterns: [
        "*://*.amazon.com/*","*://*.amazon.cn/*","*://*.amazon.ca/*","*://*.amazon.in/*","*://*.amazon.co.uk/*","*://*.amazon.com.au/*","*://*.amazon.de/*","*://*.amazon.fr/*","*://*.amazon.it/*","*://*.amazon.es/*"
    ],
    "onclick" : async function(item, tab) {
		showImage = false;showStyle=false;showFont=false;  //屏蔽图片  CSS和font
		
		asinList = [];//任务开始前,清空一下
		//Stage1. 获取第一页 第二页 第三页..... 的url    
		let currentTabid = await new Promise((resolve,reject)=>{ //Stage1.1 获取tabid  
			chrome.tabs.query({active: true},(tabs)=>{
				resolve(tabs[0].id);
			})
		});   
		//更新操作进度
		chrome.tabs.sendMessage(currentTabid, {cmd:'update_process',value:'数据获取开始'}, function(response){console.log(response);});
		resultList= await new Promise((resolve,reject)=>{
			chrome.tabs.executeScript(currentTabid, {code:"getURLs()"/*,runAt:"document_end"*/}, (data)=>{
				resolve(JSON.parse(data));
			});
		}); 
		
		//Stage2. 打开标签页,然后打开url,爬取数据
		//stage 2.1 标签页的处理
		newTabsId.length = 0; 	
		let workerTabList =[];
		for(let i =0;i<NUM_OF_WORKS;i++){  //打开每个标签页
			workerTabList.push( new Promise((resolve,reject)=>{   
					chrome.tabs.create({"active":false},(tab)=>{
						newTabsId.push(tab.id);// newTabsId  是脚本打开的所有的标签项
						resolve(tab.id);
					});// end of create	
				}) // end of promise
			);// end of push
		};// end of for
		await Promise.all(workerTabList);
			
		let currentURLIndex = 0 ;
		while(currentURLIndex<resultList.length){
			//更新操作进度
			chrome.tabs.sendMessage(currentTabid, {cmd:'update_process',value:'正在获取第'+(currentURLIndex+1)+"页"+",总共"+resultList.length+"页"}, function(response){console.log(response);});
			tasked = [];//清空一下,认为所有tab都没有任务
			for(let item of newTabsId){   
				if(currentURLIndex<resultList.length){
					await new Promise((resolve,reject)=>{  //一个tab,分配了url
						chrome.tabs.update(item,{url:resultList[currentURLIndex]},(tab)=>{
							tasked.push(tab.id);// 记录已经分配url的tab
							resolve();
						});
					});
					currentURLIndex++;
				}
			}
			
			await awaitPageLoading();  //监听onUpdated  等待页面加载完成 awaitPageLoading每次都要再承诺一次(新建一个Promise)
			let promiseList = [];
			for(let item of tasked){
				promiseList.push(new Promise((resolve,reject)=>{
					chrome.tabs.executeScript(item, {code:"giveResult()"/*,runAt:"document_end"*/}, async (data)=>{
						//for debug code
							//console.dir(data);
						if(data[0]==undefined)
							reject("没有抓取到数据");
				
						/*data operate start*/   //对爬取到的所有结果进行处理,放入storage中
						var db = new Dexie("products_database");
						db.version(1).stores({
							productList: '++,asin,title,url,image,rating,reviewUrl,totalReviews,price,originalPrice,fromUrl,keywords,page,ReviewsDetail'
						});
						db.productList.bulkPut(data[0]/*,['asin']*/).then (
							()=>{console.log("data save end");}
						).catch(function(error) {
						   alert ("Ooops: " + error);
						});
						/*data operate end*/
						resolve(data);
						
					});  //end of executeScript
				}) );// end of push
			}
			await Promise.all(promiseList).then(()=>{console.log("分配了任务的tabs任务完成")});

		} // end of while
		//爬完关闭所有的tab
		for(const item of newTabsId){
			chrome.tabs.remove(item);
		}

		newTabsId.length = 0;	
		showImage = true;showStyle=true;showFont=true;  //恢复图片  CSS和font的显示
		//更新操作进度
		chrome.tabs.sendMessage(currentTabid, {cmd:'update_process',value:'数据获取完成'}, function(response){console.log(response);});
		chrome.notifications.create(null, {
			type: 'basic',   // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Notifications/TemplateType
			iconUrl: 'img/icon.png',
			title: '数据获取完成',
			message: '所有数据已获取完成,可以下载保存了' ,
			buttons: [{title:'点击此处下载文件'/*,iconUrl:'icon3.png'*/}],//,{title:'按钮2的标题',iconUrl:'icon4.png'}],
			requireInteraction:true
		});
    }
});
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

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log('收到来自content-script的消息：');
	console.log(request, sender, sendResponse);
	sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});



function exportCSV(){//从indexedDB中导出数据到文件
	// list all data in indexedDB start
	var dataList = [];
	var db = new Dexie("friend_database");
	db.version(1).stores({
		friends: 'asin,title,url,image,rating,reviewUrl,totalReviews,price,originalPrice,fromUrl,keywords,page,ReviewsDetail'
	});
	var coll = db.friends.toCollection();
	coll.each(
		(item)=>{
			dataList.push(item);
		}
	);		
	// change dataList Array to csv File  use papaparse
	// list all data in indexedDB end
	let uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent("xxx");
    let link = document.createElement("a");
    link.href = uri;
    link.download =  "json数据表.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



// 获取当前选项卡ID
function getCurrentTabId(callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		if(callback) callback(tabs.length ? tabs[0].id: null);
	});
}

// 当前标签打开某个链接
function openUrlCurrentTab(url)
{
	getCurrentTabId(tabId => {
		chrome.tabs.update(tabId, {url: url});
	})
}

// 新标签打开某个链接
function openUrlNewTab(url)
{
	chrome.tabs.create({url: url});
}

// omnibox 演示
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
	console.log('inputChanged: ' + text);
	if(!text) return;
	if(text == '美女') {
		suggest([
			{content: '中国' + text, description: '你要找“中国美女”吗？'},
			{content: '日本' + text, description: '你要找“日本美女”吗？'},
			{content: '泰国' + text, description: '你要找“泰国美女或人妖”吗？'},
			{content: '韩国' + text, description: '你要找“韩国美女”吗？'}
		]);
	}
	else if(text == '微博') {
		suggest([
			{content: '新浪' + text, description: '新浪' + text},
			{content: '腾讯' + text, description: '腾讯' + text},
			{content: '搜狐' + text, description: '搜索' + text},
		]);
	}
	else {
		suggest([
			{content: '百度搜索 ' + text, description: '百度搜索 ' + text},
			{content: '谷歌搜索 ' + text, description: '谷歌搜索 ' + text},
		]);
	}
});

// 当用户接收关键字建议时触发
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log('inputEntered: ' + text);
	if(!text) return;
	var href = '';
    if(text.endsWith('美女')) href = 'http://image.baidu.com/search/index?tn=baiduimage&ie=utf-8&word=' + text;
	else if(text.startsWith('百度搜索')) href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text.replace('百度搜索 ', '');
	else if(text.startsWith('谷歌搜索')) href = 'https://www.google.com.tw/search?q=' + text.replace('谷歌搜索 ', '');
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
	if(!showImage && details.type == 'image') return {cancel: true};  //'font', 'image', 'stylesheet'
	if(!showFont && details.type == 'font') return {cancel: true};
	if(!showStyle && details.type == 'stylesheet') return {cancel: true};
	// 简单的音视频检测
	// 大部分网站视频的type并不是media，且视频做了防下载处理，所以这里仅仅是为了演示效果，无实际意义
	if(details.type == 'media') {
		chrome.notifications.create(null, {
			type: 'basic',   // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/Notifications/TemplateType
			iconUrl: 'img/icon.png',
			title: '检测到音视频',
			message: '音视频地址：' + details.url,
			//requireInteraction:true
		});
	}
}, {urls: ["<all_urls>"]}, ["blocking"]);