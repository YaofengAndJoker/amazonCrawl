//TODO:  清空这个content-script，因为其加载时间无法控制，改用chrome.tabs.exescript({file:xxx.js})的方式
//TODO:  由于其加载时间无法控制，通过chrome.tabs.executescript({code:func})的时候，会出现找不到函数定义的情况

console.log("just haha");