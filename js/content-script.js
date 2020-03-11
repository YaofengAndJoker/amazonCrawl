console.log('这是content script!');

// 注意，必须设置了run_at=document_start 此段代码才会生效
document.addEventListener('DOMContentLoaded', function () {
    //console.log("funciton start");
    //let temp = extractItemReviewPage();// for debug
    //console.log(temp);
    // 注入自定义JS
    injectCustomJs();
    // 给谷歌搜索结果的超链接增加 _target="blank"
    if (location.host === 'www.google.com.tw') {
        var objs = document.querySelectorAll('h3.r a');
        for (var i = 0; i < objs.length; i++) {
            objs[i].setAttribute('_target', 'blank');
        }
        console.log('已处理谷歌超链接！');
    } else if (location.host == 'www.baidu.com' || location.host.indexOf('amazon') != -1) {
        function fuckBaiduAD() {
            if (document.getElementById('my_custom_css')) return;
            var temp = document.createElement('style');
            temp.id = 'my_custom_css';
            (document.head || document.body).appendChild(temp);
            var css = `
			/* 移除百度右侧广告 */
			#content_right{display:none;}
			/* 覆盖整个屏幕的相关推荐 */
			.rrecom-btn-parent{display:none;}'
			/* 难看的按钮 */
			.result-op.xpath-log{display:none !important;}`;
            temp.innerHTML = css;
            console.log('已注入自定义CSS！');
            // 屏蔽百度推广信息
            removeAdByJs();
            // 这种必须用JS移除的广告一般会有延迟，干脆每隔一段时间清楚一次
            interval = setInterval(removeAdByJs, 2000);

            // 重新搜索时页面不会刷新，但是被注入的style会被移除，所以需要重新执行
            temp.addEventListener('DOMNodeRemoved', function (e) {
                console.log('自定义CSS被移除，重新注入！');
                if (interval) clearInterval(interval);
                fuckBaiduAD();
            });
        }

        let interval = 0;

        function removeAdByJs() {
            $('[data-tuiguang]').parents('[data-click]').remove();
        }

        fuckBaiduAD();
        initCustomPanel();
        initCustomEventListen();
    }

    /*判断页面是商品列表页，还是商品详情页 */
    //if(location.host == "www.amazon.cn"  && location.href.indexOf("product-reviews")>-1)  //说明是评论页
    //{;//return;  //后面的不执行}

});

function initCustomPanel() {
    var panel = document.createElement('div');
    panel.className = 'chrome-plugin-demo-panel';
    /*panel.innerHTML = `
        <h2>injected-script操作content-script演示区：</h2>
        <div class="btn-area">
            <a href="javascript:sendMessageToContentScriptByPostMessage('你好，我是普通页面！')">通过postMessage发送消息给content-script</a><br>
            <a href="javascript:sendMessageToContentScriptByEvent('你好啊！我是通过DOM事件发送的消息！')">通过DOM事件发送消息给content-script</a><br>
            <a href="javascript:invokeContentScript('sendMessageToBackground(\\\'download\\\')')">发送消息到后台或者popup</a><br>
        </div>
        <div id="my_custom_log">
        </div>
    `;*/
    panel.innerHTML = `
		<h2>Amazon Data scraper状态</h2>
		<div id="my_custom_log">
		<p id="get_data_process">数据获取未开始!</p>
		<div class="btn-area">
			<a href="javascript:invokeContentScript('sendMessageToBackground(\\\'download\\\')')">下载已获取的数据</a><br>
		</div>
		</div>
	`;
    document.body.appendChild(panel);
}

// 向页面注入JS
function injectCustomJs(jsPath) {
    jsPath = jsPath || 'js/inject.js';
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.src = chrome.extension.getURL(jsPath);
    temp.onload = function () {
        // 放在页面不好看，执行完后移除掉
        this.parentNode.removeChild(this);
    };
    document.body.appendChild(temp);
}


// 接收来自后台的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('收到来自 ' + (sender.tab ? "content-script(" + sender.tab.url + ")" : "popup或者background") + ' 的消息：', request);
    if (request.cmd === 'update_process') {
        let ele = document.getElementById('get_data_process');
        ele.innerText = request.value;

    } else if (request.cmd === 'update_font_size') {
        let ele = document.createElement('style');
        ele.innerHTML = `* {font-size: ${request.size}px !important;}`;
        document.head.appendChild(ele);
    } else if(request.cmd === 'debug'){
        console.log("background message: start");
        console.dir(request.value);
        console.log("background message: end")

    }else{
        ;// do nothing
        //tip(JSON.stringify(request));
        //sendResponse('我收到你的消息了：'+JSON.stringify(request));
    }
});
// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
function sendMessageToBackground(message) {
    chrome.runtime.sendMessage({greeting: message || '你好，我是content-script呀，我主动发消息给后台！'}, function (response) {
        ;//tip('收到来自后台的回复：' + response);
    });
}

// 监听长连接
chrome.runtime.onConnect.addListener(function (port) {
    console.log(port);
    if (port.name == 'test-connect') {
        port.onMessage.addListener(function (msg) {
            console.log('收到长连接消息：', msg);
            tip('收到长连接消息：' + JSON.stringify(msg));
            if (msg.question == '你是谁啊？') {
                setInterval(function () {
                    console.log("2S查数据！");
                }, 2000);

                port.postMessage({answer: '我是你爸啊！'});
            }
        });
    }
});

window.addEventListener("message", function (e) {
    console.log('收到消息：', e.data);
    if (e.data && e.data.cmd == 'invoke') {
        eval('(' + e.data.code + ')');
    } else if (e.data && e.data.cmd == 'message') {
        tip(e.data.data);
    }
}, false);


function initCustomEventListen() {
    var hiddenDiv = document.getElementById('myCustomEventDiv');
    if (!hiddenDiv) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.style.display = 'none';
        hiddenDiv.id = 'myCustomEventDiv';
        document.body.appendChild(hiddenDiv);
    }
    hiddenDiv.addEventListener('myCustomEvent', function () {
        var eventData = document.getElementById('myCustomEventDiv').innerText;
        tip('收到自定义事件：' + eventData);
    });
}

var tipCount = 0;

// 简单的消息通知
function tip(info) {
    info = info || '';
    var ele = document.createElement('div');
    ele.className = 'chrome-plugin-simple-tip slideInLeft';
    ele.style.top = tipCount * 70 + 20 + 'px';
    ele.innerHTML = `<div>${info}</div>`;
    document.body.appendChild(ele);
    ele.classList.add('animated');
    tipCount++;
    setTimeout(() => {
        ele.style.top = '-100px';
        setTimeout(() => {
            ele.remove();
            tipCount--;
        }, 400);
    }, 3000);
}

function getProductsURLs() {
    console.log("getProductsURLs");
    let urls = [];//爬取url列表,传给background
    //https://www.amazon.cn/s?k=phone+case&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_1
    //https://www.amazon.cn/s?k=phone+case&page=2&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_2
    //https://www.amazon.cn/s?k=phone+case&page=3&__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&qid=1582732414&ref=sr_pg_3
    urls.push(document.querySelector('.s-border-bottom .a-selected').children[0].href);//当前页,也就是第一页
    let temp = document.querySelectorAll('.s-border-bottom .a-normal'); //第二页和第三页的url
    for (let url of temp) {
        console.log(url);
        urls.push(url.children[0].href);
    }
    console.dir(urls);
    //将url信息发给background
    return JSON.stringify(urls);

}
function getReviewURLs(asin, totalPage = 1 ) {
    console.log("getReviewURLs");
    if (asin === undefined) {
        throw new Error('asin is not defined');
    }
    let urlList =[];
    for(let page=1;page<=totalPage;page++) {  // page 0 与page 1 所得的内容是一样的
        //https://www.amazon.cn/product-reviews/B07NC189JJ/ref=cm_cr_arp_d_viewopt_srt?pageNumber=1&sortBy=recent
        urlList.push(`https://${location.host}/product-reviews/${asin}/?pageNumber=${page}&sortBy=recent`);
    }
    console.dir(urlList);
    return JSON.stringify(urlList);
}
function getCertainReviewURLs(asin, Page = 1 ) {
    console.log("getReviewURLs");
    if (asin === undefined) {
        throw new Error('asin is not defined');
    }
    let urlList =[];
        //https://www.amazon.cn/product-reviews/B07NC189JJ/ref=cm_cr_arp_d_viewopt_srt?pageNumber=1&sortBy=recent
    urlList.push(`https://${location.host}/product-reviews/${asin}/?pageNumber=${Page}&sortBy=recent`);

    console.dir(urlList);
    return JSON.stringify(urlList);
}
function giveProductsResult(params) {//商品列表页抽取
    console.log("giveProductsResult:  "+location.href);
    const {results} = extractProductsPage();//根据dom情况进行爬取
    console.dir(results);
    return results;
}

function giveReviewsResult(params) {//商品Reviews页抽取
    console.log("giveReviewsResult:  "+location.href);
    let results = extractItemReviewPage();//根据dom情况进行爬取
    console.dir(results);
    return results['reviews'];
}
function correctsReviewsAndStar(){
    console.log("giveReviewsResult:  "+location.href);
    let results = extractReviewNumber();
    console.dir(results);
    return results['reviews'];
}
function getEarliestReview(){
    console.log("getEarliestReview:  "+location.href);
    let results = extractEarliestReview();
    console.dir(results);
    return results['reviews'];
}