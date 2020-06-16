var bg = chrome.extension.getBackgroundPage();
let loginDate = bg.echo();
if (loginDate !== undefined) {
    document.getElementById("username").value = loginDate["Name"];
    document.getElementById("validcheck").innerText = "登录成功";
    console.log(loginDate);
    document.getElementById("endtime").innerText = "账号到期时间:  " + loginDate["Expire"];
}
var invokebgbutton = document.getElementById("invoke_background_js");
invokebgbutton.onclick = function() {
    var bg = chrome.extension.getBackgroundPage();
    bg.downloadDataBg();
};

var openNewButton = document.getElementById("open_url_new_tab");
openNewButton.onclick = function() {
    chrome.tabs.create({ url: 'http://www.coolcourse.cn/register' });
};
var openNewButton = document.getElementById("open_url_usage");
openNewButton.onclick = function() {
    chrome.tabs.create({ url: 'https://www.cnblogs.com/laiqun/p/13150063.html' });
};
var loginButton = document.getElementById("login");
loginButton.onclick = function() {
    //调用ajax函数
    ajax({
        url: 'http://www.coolcourse.cn/login',
        type: 'GET',
        dataType: 'json',
        data: { username: document.getElementById("username").value },
        success: function(response, xml) {
            //请求成功后执行的代码
            //console.log(JSON.parse(response));
            if (response.indexOf('Not') == -1) {
                let responseData = JSON.parse(response);
                document.getElementById("validcheck").innerText = "登录成功";
                document.getElementById("endtime").innerText = "账号到期时间:  " + responseData["Expire"];
                if (responseData['info'] !== undefined) {
                    document.getElementById("process_status").innerText = responseData['info'];
                }
                var bg = chrome.extension.getBackgroundPage();
                bg.setValidDate(responseData);
            } else {
                document.getElementById("validcheck").innerText = "没有该账户";
                document.getElementById("endtime").innerText = "";
            }
        },
        error: function(status) {
            //失败后执行的代码
        }
    });
};


//创建ajax函数
function ajax(options) {
    options = options || {};
    options.type = (options.type || 'GET').toUpperCase();
    options.dataType = options.dataType || 'json';
    params = formatParams(options.data);

    //创建-第一步
    var xhr;
    //非IE6
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    }

    //接收-第三步
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var status = xhr.status;
            if (status >= 200 && status < 300) {
                options.success && options.success(xhr.responseText, xhr.responseXML);
            } else {
                options.error && options.error(status);
            }
        }
    }

    //连接和发送-第二步
    if (options.type == 'GET') {
        xhr.open('GET', options.url + '?' + params, true);
        xhr.send(null);
    } else if (options.type == 'POST') {
        xhr.open('POST', options.url, true);
        //设置表单提交时的内容类型
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(params);
    }
}

//格式化参数
function formatParams(data) {
    var arr = [];
    for (var name in data) {
        arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }
    arr.push(('v=' +
        Math.random()).replace('.', ''));
    return arr.join('&');
}