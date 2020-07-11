let startButton = document.getElementById("analysisdata");
let files = null;
let filecontent = null;
startButton.onclick = function() {
    files = document.getElementById("files").files;
    if (files[0].length) {
        alert("Please choose at least one file to parse.");
        return;
    }
    Papa.parse(files[0], { header: true, complete: (x) => { filecontent = x; } })
}

function computeAVG(list) {
    if (list.length == 0) {
        return 0;
    } else {
        let sum = list.reduce((x, y) => {
            return x + y;
        });
        return sum / list.length;
    }
}

function computeSlop(list1, list2) {
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < list1.length; i++) {
        numerator += (list1[i] - computeAVG(list1)) * (list2[i] - computeAVG(list2));
        denominator += (list1[i] - computeAVG(list1)) * (list1[i] - computeAVG(list1));
    }
    if (!denominator)
        return 0;
    else
        return numerator / denominator;
}

function computeYTD(list) {
    list.map((x) => {
        x['currentYTD'] = x['price'] * x['current'];
        x['lastYTD'] = x['price'] * x['last'];
        x['beforeYTD'] = x['price'] * x['before'];
        x['before2YTD'] = x['price'] * x['before2'];
    })
}

function computeOneCloumnSum(list, column_name) {
    let result = 0;
    list.map((x) => {
        result += x['column_name'];
    })
    return result;
}

function computePartion(list) {
    let numerator = computeOneCloumnSum(list, 'partion');
    let denominator = computeOneCloumnSum(list, 'last');
    if (!denominator)
        return 1;
    return numerator / denominator;
}

function annual_total(data, part) {
    let x = [1, 2, 3];
    let annual_total_list = [computeOneCloumnSum(data, 'beforeYTD'), computeOneCloumnSum(data, 'lastYTD'), computeOneCloumnSum(data, 'currentYTD') * part];
    let slope_result = computeSlop(x, annual_total_list);
    annual_total_list.push(annual_total_list[2] + slope_result);
    return annual_total_list;
}

function annual_mean(data, part) {
    let x = [1, 2, 3];
    let currentNum = new Date().getFullYear();
    let before = data.filter((x) => {
        if (x['year'] <= (currentNum - 2))
            return true;
    }).length;
    let last = data.filter((x) => {
        if (x['year'] <= (currentNum - 1))
            return true;
    }).length;
    let current = data.filter((x) => {
        if (x['year'] <= (currentNum))
            return true;
    }).length;
    if (before == 0)
        before = 1;
    if (last == 0)
        last = 1;
    if (current == 0)
        current = 1;

    let annual_mean_list = [computeOneCloumnSum(data, 'beforeYTD') / before, computeOneCloumnSum(data, 'lastYTD') / last, computeOneCloumnSum(data, 'currentYTD') * part / current];
    let slope_result = computeSlop(x, annual_mean_list);
    annual_mean_list.push(annual_mean_list[2] + slope_result);
    return annual_mean_list;
}


function proportion(data, part) {
    let x = [1, 2, 2 + part];
    //获取所有的第三方卖家
    let thirdPart = data.filter((x) => {
        if (x['sellerName'].toLowerCase().indexOf('amazon') === -1) {
            return true;
        }
    });
    let amazonPart = data.filter((x) => { ////获取所有的亚马逊自营
        if (x['sellerName'].toLowerCase().indexOf('amazon') != -1) {
            return true;
        }
    });
    let thirdPartList = [computeOneCloumnSum(thirdPart, 'beforeYTD'), computeOneCloumnSum(thirdPart, 'lastYTD'), computeOneCloumnSum(thirdPart, 'currentYTD')];
    let amazonPartList = [computeOneCloumnSum(amazonPart, 'beforeYTD'), computeOneCloumnSum(amazonPart, 'lastYTD'), computeOneCloumnSum(amazonPart, 'currentYTD')];
    //计算成百分比
    for (let i = 0; i < thirdPartList.length; i++) {
        thirdPartList[i] = thirdPartList[i] / (thirdPartList[i] + amazonPartList[i]);
        amazonPartList[i] = amazonPartList[i] / (thirdPartList[i] + amazonPartList[i]);
    }

    let thirdSlope = computeSlop(x, thirdPartList);
    thirdPartList.push(thirdPartList[2] + thirdSlope);
    let amazonSlope = computeSlop(x, amazonPartList);
    amazonPartList.push(amazonPartList[2] + amazonSlope);
    return [thirdPartList, amazonPartList];
}

function price_scope(data) {
    //剔除最高的，百分数 最低的百分数
    //然后剩下的等距切分
    //或者留一个汇率参数

    return;
}

function newcome_perform(data, part) {
    let x = [1, 2, 2 + part];
    //用韦恩图的思想，重写
    let longlongago = data.filter((x) => {
        if (x['year'] < (currentNum - 2))
            return true;
    });
    let last = data.filter((x) => {
        if (x['year'] = (currentNum - 1))
            return true;
    });
    let current = data.filter((x) => {
        if (x['year'] = (currentNum))
            return true;
    });
    //计算总和
    //2017年
    let othersumbefore = 0;
    longlongago.map((x) => { //2016以及之前的，在2017年占了多少
        othersumbefore += x['beforeYTD'];
    });
    let othersumlast = 0;
    longlongago.map((x) => { //2016以及之前的，在2018年占了多少
        othersumlast += x['lastYTD'];
    });
    let othersumcurrent = 0;
    longlongago.map((x) => { //2016以及之前的，在2019年占了多少
        othersumcurrent += x['currentYTD'];
    });
    let equalbeforebefore = 0;
    before.map((x) => { //2017，在2017年有多少
        equalbeforebefore += x['beforeYTD'];
    });
    let equalbeforelast = 0;
    before.map((x) => { //2017，在2018年有多少
        equalbeforelast += x['lastYTD'];
    });
    let equalbeforecurrent = 0;
    before.map((x) => { //2017，在2019年有多少
        equalbeforecurrent += x['currentYTD'];
    });
    let equallastlast = 0;
    last.map((x) => { //2018，在2018年有多少
        equallastlast += x['lastYTD'];
    });
    let equallastcurrent = 0;
    last.map((x) => { //2018，在2019年有多少
        equallastcurrent += x['currentYTD'];
    });
    let equalcurrentcurrent = 0;
    current.map((x) => { //2019，在2019年有多少
        currentequalcurrentcurrent += x['currentYTD'];
    });
    //可能会有除数为零的问题
    let result = [equalbeforebefore / (othersumbefore + equalbeforebefore), (equallastlast) / (othersumlast + equalbeforelast + equallastlast), (equalcurrentcurrent) / (equalcurrentcurrent + othersumcurrent + equalbeforecurrent + equallastcurrent)];
    let slope_result = computeSlop(x, result);
    reusult.push(result[2] + slope_result);
    let avg_result = [equalbeforebefore / (othersumbefore + equalbeforebefore) / before.length, (equallastlast) / (othersumlast + equalbeforelast + equallastlast) / last.length, (equalcurrentcurrent) / (equalcurrentcurrent + othersumcurrent + equalbeforecurrent + equallastcurrent) / current.length];
    let avg_slope_result = computeSlop(x, avg_result);
    avg_result.push(avg_result[2] + avg_slope_result);
    return reusult;
}

function newcome_trend_perform(data, part) { //随着时间推移，占比变化如何
    let x = [1, 2, 3];
    //在小于等于2017时候的总价值，在2017年的总价值
    let longlongago = data.filter((x) => {
        if (x['year'] <= (currentNum - 2))
            return true;
    });
    let last = data.filter((x) => {
        if (x['year'] <= (currentNum - 1))
            return true;
    });
    let current = data.filter((x) => {
        if (x['year'] <= (currentNum))
            return true;
    });
    let longlongagosum = 0;
    longlongago.map((x) => { //小于等于2017年上架的，在2017年的总销量
        longlongagosum += x['beforeYTD'];
    });

    let lastsum = 0;
    last.map((x) => { //小于等于2018年上架的，在2018年的总销量
        lastsum += x['lastYTD'];
    });
    let currentsum = 0;
    current.map((x) => { //小于等于2019年上架的，在2019年的总销量
        currentsum += x['current'];
    });
    //2017年上架的，在2017年占的比例  2018年占的比例  2019年占的比例  2020年占的比例（预估）
    //              2018年上架的，在 2018年占的比例  2019年占的比例  2020年占的比例（预估）
    //                                2019上架的   在2019占的比例  2020年占的比例（预估）
    //                                                           2020年占的比例（预估）

    //用韦恩图的方法重写
    //2017年上架的，在2017年的占比，2018年的占比,2019年的占比
    //2017年在2017年的总价值除上小于等于2017的总价值
    //2017年上架的在2018年的总价值，除上小于等于2018的总价值
    //2017年上架的在2019年的总价值，除上小于 等于2019的总价值

    return;
}

function band_proportion(data, part) {
    let x = [1, 2, 2 + part];
    //进行大批量插值
}