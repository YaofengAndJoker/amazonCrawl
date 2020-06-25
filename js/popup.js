let showMoreOption = false;

function echo() {
    const bg = chrome.extension.getBackgroundPage();
    let loginDate = bg.echo();
    if (loginDate["Name"] !== undefined) {
        document.getElementById("username").value = loginDate["Name"];
        document.getElementById("validcheck").innerText = "登录成功";
        document.getElementById("expiretime").innerText = "账号到期时间:  " + loginDate["Expire"];
    }
    document.getElementById("works_number").value = loginDate["NUM_OF_WORKERS"];
    document.getElementById("works_number_reviews").value = loginDate["NUM_OF_BIN_SEARCH"];
    document.getElementById("works_time").value = loginDate["generalTime"];
    document.getElementById("works_time_reviews").value = loginDate["reviewTime"];
    document.getElementById("keep_haved").checked = !!loginDate["keep_haved"];
    document.getElementById("batchsize").value = loginDate["batchSize"];
}
echo();
const invokebgButton = document.getElementById("invoke_background_js");
invokebgButton.onclick = function() {
    let bg = chrome.extension.getBackgroundPage();
    bg.downloadDataBg();
};
const setShowPicbutton = document.getElementById("setShowPic");
setShowPicbutton.onclick = function() {
    let bg = chrome.extension.getBackgroundPage();
    bg.showPic();
};
const more_optionbutton = document.getElementById("more_option");
more_optionbutton.onclick = function() {
    showMoreOption = !showMoreOption;
    if (showMoreOption) {
        let more_option_detailButton = document.getElementById("more_option_detail");
        more_option_detailButton.style.display = "block";
        more_optionbutton.innerText = "隐藏更多选项";
    } else {
        let more_option_detailButton = document.getElementById("more_option_detail");
        more_option_detailButton.style.display = "none";
        more_optionbutton.innerText = "显示更多选项";
    }
};
const setWorkNumberbutton = document.getElementById("setWorkNumber");
setWorkNumberbutton.onclick = function() {
    let generalWorksNumber = parseInt(document.getElementById("works_number").value);
    let reviewsWorksNumber = parseInt(document.getElementById("works_number_reviews").value);
    let generalWorksTime = parseInt(document.getElementById("works_time").value);
    let reviewsWorksTime = parseInt(document.getElementById("works_time_reviews").value);
    let batchSize = parseInt(document.getElementById("batchsize").value);
    if (isNaN(generalWorksNumber) || generalWorksNumber <= 0) {
        generalWorksNumber = 10;
    }
    if (isNaN(reviewsWorksNumber) || reviewsWorksNumber <= 0) {
        reviewsWorksNumber = 4;
    }
    if (isNaN(generalWorksTime) || generalWorksTime <= 0) {
        generalWorksTime = 10;
    }
    if (isNaN(reviewsWorksTime) || reviewsWorksTime <= 0) {
        reviewsWorksTime = 1000;
    }
    if (isNaN(batchSize) || batchSize <= 0) {
        batchSize = 200;
    }
    let bg = chrome.extension.getBackgroundPage();
    bg.setNumber(generalWorksNumber, reviewsWorksNumber, generalWorksTime, reviewsWorksTime, document.getElementById("keep_haved").checked, batchSize);
    document.getElementById("setNumberStatus").innerText = "设置完成";
};
const openNewButton = document.getElementById("open_url_new_tab");
openNewButton.onclick = function() {
    chrome.tabs.create({ url: 'http://weibit.cn/register' });
};
const openUsageButton = document.getElementById("open_url_usage");
openUsageButton.onclick = function() {
    chrome.tabs.create({ url: 'https://www.cnblogs.com/laiqun/p/13150063.html' });
};
const loginButton = document.getElementById("login");
loginButton.onclick = function() {
    //调用ajax函数
    ajax({
        url: 'http://weibit.cn/login',
        type: 'GET',
        dataType: 'json',
        data: { username: document.getElementById("username").value },
        success: function(response, xml) {
            //请求成功后执行的代码
            //console.log(JSON.parse(response));
            if (response.indexOf('Not') === -1) {
                let responseData = JSON.parse(response);
                document.getElementById("validcheck").innerText = "登录成功";
                document.getElementById("expiretime").innerText = "账号到期时间:  " + responseData["Expire"];
                if (responseData['info'] !== undefined) {
                    document.getElementById("process_status").innerText = responseData['info'];
                }
                var bg = chrome.extension.getBackgroundPage();
                bg.setValidDate(responseData);
            } else {
                document.getElementById("validcheck").innerText = "没有该账户";
                document.getElementById("expiretime").innerText = "";
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
        if (xhr.readyState === 4) {
            var status = xhr.status;
            if (status >= 200 && status < 300) {
                options.success && options.success(xhr.responseText, xhr.responseXML);
            } else {
                options.error && options.error(status);
            }
        }
    };

    //连接和发送-第二步
    if (options.type === 'GET') {
        xhr.open('GET', options.url + '?' + params, true);
        xhr.send(null);
    } else if (options.type === 'POST') {
        xhr.open('POST', options.url, true);
        //设置表单提交时的内容类型
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(params);
    }
}

//格式化参数
function formatParams(data) {
    let arr = [];
    for (let name in data) {
        arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }
    arr.push(('v=' +
        Math.random()).replace('.', ''));
    return arr.join('&');
}