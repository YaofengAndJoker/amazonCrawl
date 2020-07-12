
function showgraph(data) {
    let result;
    if (data === undefined || data === null) {
        resultnode = document.getElementById("result");
        result = resultnode.innerHTML;
        result = JSON.parse(result);
    } else {
        result = data;
        //将数据写入上面的节点
        document.getElementById("result").innerHTML = JSON.stringify(data);
    }

    window.testResult = result;

    let year = new Date().getFullYear();
    let annual_key = [(year - 2) + "", (year - 1) + "", (year) + "", (year + 1) + ""];
    var annual_total_result = echarts.init(document.getElementById('annual_total_result_pic'));
    var annual_total_result_option = {
        title: {
            text: "总体需求及年趋势"
        },
        tooltip: {},
        legend: {
            data: ["销售额"]
        },
        xAxis: {
            data: annual_key
        },
        yAxis: {},
        series: [{
            name: "销量",
            type: 'bar',
            data: result["annual_total_result"]
        }]
    };
    annual_total_result.setOption(annual_total_result_option);


    var annual_mean_result = echarts.init(document.getElementById('annual_mean_result_pic'));
    var annual_mean_result_option = {
        title: {
            text: "平均每个商品的需求及年趋势"
        },
        tooltip: {},
        legend: {
            data: ["销售额"]
        },
        xAxis: {
            data: annual_key
        },
        yAxis: {},
        series: [{
            name: "销量",
            type: 'bar',
            data: result["annual_mean_result"]
        }]
    };
    annual_mean_result.setOption(annual_mean_result_option);
    var third_part_official_result = echarts.init(document.getElementById('third_part_official_pic'));
    third_part_official_result_option = {
        title: {
            text: '第三方卖家与官方卖家比例',
            subtext: '统计结果'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['第三方卖家', '官方']
        },
        toolbox: {
            show: true,
            feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
            }
        },
        calculable: true,
        xAxis: [{
            type: 'category',
            data: annual_key
        }],
        yAxis: [{
            type: 'value'
        }],
        series: [{
                name: '第三方',
                type: 'bar',
                data: result['third_part']
            },
            {
                name: '官方',
                type: 'bar',
                data: result['official_part']
            }
        ]
    };
    third_part_official_result.setOption(third_part_official_result_option);
    //每个价格区间的比例
    var priceDic = JSON.parse(result["sum_data"]);
    var keyList = [];
    var valueList = [];
    for (let key in priceDic) {
        keyList.push(key);
        valueList.push(priceDic[key]);
    }
    var sum_data_result = echarts.init(document.getElementById('sum_data_pic'));
    var sum_data_result_option = {
        title: {
            text: "每个价格区间的销售额"
        },
        tooltip: {},
        legend: {
            data: ["销售区间"]
        },
        xAxis: {
            type: 'category',
            data: keyList,
            axisLabel: {
                rotate: -90
            }
        },
        yAxis: {},
        series: [{
            name: "销量",
            type: 'bar',
            data: valueList
        }]
    };
    sum_data_result.setOption(sum_data_result_option);

    //计算每年新品占比
    var newcome_perform_result = echarts.init(document.getElementById('newcome_perform_result_pic'));
    var newcome_perform_result_option = {
        title: {
            text: "每年新品的占比"
        },
        tooltip: {},
        legend: {
            data: ["销售额"]
        },
        xAxis: {
            data: annual_key
        },
        yAxis: {},
        series: [{
            name: "销量",
            type: 'bar',
            data: result["newcome_perform_result"]
        }]
    };
    newcome_perform_result.setOption(newcome_perform_result_option);
    //newcome_avg_perform_result_pic  不同年份的新品发展趋势
    var temp = JSON.parse(result["newcome_avg_perform_result"]);
    //列为  0 1 2 3,行为  2017年(YTD)，2018年YTD
    var newcome_avg_perform_result = echarts.init(document.getElementById('newcome_avg_perform_result_pic'));

    var newcome_avg_perform_result_option = {
        title: {
            text: '新品趋势',
            subtext: '不同年份上架的新品的发展趋势'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: annual_key
        },
        toolbox: {
            show: true,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: { readOnly: false },
                magicType: { type: ['line', 'bar'] },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: annual_key
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value} '
            }
        },
        series: [{
                name: (year - 2) + '',
                type: 'line',
                data: [
                    [(year - 2) + '', temp[(year - 2) + '(YTD)'][0]],
                    [(year - 1) + '', temp[(year - 1) + '(YTD)'][0]],
                    [(year) + '', temp[year + '(YTD)'][0]],
                    [(year + 1) + '', temp[(year + 1) + '(YTD)'][0]]
                ],
            },
            {
                name: (year - 1) + '',
                type: 'line',
                data: [
                    [(year - 1) + '', temp[(year - 1) + '(YTD)'][1]],
                    [(year) + '', temp[year + '(YTD)'][1]],
                    [(year + 1) + '', temp[(year + 1) + '(YTD)'][1]]
                ],
            },
            {
                name: (year) + '',
                type: 'line',
                data: [
                    [year + '', temp[year + '(YTD)'][2]],
                    [(year + 1) + '', temp[(year + 1) + '(YTD)'][2]]
                ],
            },
            {
                name: (year + 1) + '',
                type: 'line',
                data: [
                    [(year + 1) + '', temp[(year + 1) + '(YTD)'][3]]
                ],
            }

        ]
    };

    newcome_avg_perform_result.setOption(newcome_avg_perform_result_option);
    //处理band，
    //对于占有率小于1%的品牌，直接过滤  0.01
    var band_result = JSON.parse(result.band_proportion_result);
    var band_display = [];
    var other = 0;
    for (let key in band_result) {
        //进行筛选,因为是排过序，所以找到第一个即可
        if (band_result[key] < 0.001) {
            other += band_result[key];
            //delete (band_result[key]);
        } else {
            band_display.push({ 'name': key, 'value': band_result[key] });
        }
    }
    band_display.push({ 'name': '占有率小于0.1%\n的品牌累积和', 'value': other });
    let band_proportion_result = echarts.init(document.getElementById('band_proportion_result_pic'));
    let band_proportion_result_option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {d}%'
        },
        legend: {
            orient: 'vertical',
            left: 10,
            data: Object.keys(band_display)
        },
        series: [{
            name: '品牌预估占比',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
                normal: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    show: true,
                    textStyle: {
                        fontSize: '30',
                        fontWeight: 'bold'
                    }
                }
            },
            labelLine: {
                normal: {
                    show: false
                }
            },
            data: band_display
        }]
    };
    band_proportion_result.setOption(band_proportion_result_option);
}

function displayanalysisResult(data, graphtitle) {
    try {
        showgraph(data);
        //修改title
        let title = document.getElementById('keywordtitle');
        if (graphtitle !== undefined)
            title.innerText = ("关键词:  " + graphtitle);
        else {
            title.innerText = "分析图示例";
        }
    } catch (error) {
        console.log(error);
    }
}
displayanalysisResult();

const readcsvfun = (files) => new Promise((resolve, reject) => {
    Papa.parse(files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (x) => {
            resolve(x.data);
        }
    });
});
let startButton = document.getElementById("analysisdata");
startButton.onclick = async function() {
    files = document.getElementById("files").files;
    if (files[0].length) {
        alert("Please choose at least one file to parse.");
    } else {
        let filecontent = await readcsvfun(files);
        //进行数据分析
        computeYTD(filecontent);
        let reviewPartion = computePartion(filecontent);
        let datePartion = computeDatePartion(filecontent);
        let annual_total_result = annual_total(filecontent, reviewPartion);
        let annual_mean_result = annual_mean(filecontent, reviewPartion);
        let proportion_result = proportion(filecontent, datePartion);
        let price_scope_result = price_scope(filecontent);
        let newcome_perform_result = newcome_perform(filecontent, datePartion);
        let newcome_trend_perform_result = newcome_trend_perform(filecontent, reviewPartion);
        let band_proportion_result = band_proportion(filecontent, datePartion);
        // console.log(annual_total_result);
        // console.log(annual_mean_result);
        // console.log(proportion_result);
        // console.log(price_scope_result);
        // console.log(newcome_perform_result);
        // console.log(newcome_trend_perform_result);
        // console.log(band_proportion_result);
        let displayresult = {
            "annual_total_result": annual_total_result,
            "annual_mean_result": annual_mean_result,
            "third_part": proportion_result[0],
            "official_part": proportion_result[1],
            "sum_data": JSON.stringify(price_scope_result),
            "newcome_perform_result": newcome_perform_result[0],
            "newcome_avg_perform_result": JSON.stringify(newcome_trend_perform_result),
            "band_proportion_result": JSON.stringify(band_proportion_result)
        };
        //写结果，并调用显示函数
        let graphtitle = filecontent[0]["keywords"];
        displayanalysisResult(displayresult, graphtitle);
    }
};

/**
 * date1 date2 是2019-06-18的格式
 * @param {*} date1 
 * @param {*} date2
 */
function daysDistance(date1, date2) {
    date1 = Date.parse(date1);
    date2 = Date.parse(date2);
    let ms = Math.abs(date2 - date1);
    return Math.floor(ms / (24 * 3600 * 1000));
}

function computeDatePartion(list) {
    let year = new Date().getFullYear();
    let days = daysDistance(list[0]["collect_date"], year + "/1/1");
    return (days / 365).toFixed(2);
}

function computeAVG(list) {
    if (list.length === 0) {
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
        x['currentYTD'] = parseFloat(x['price']) * parseFloat(x['current']);
        x['lastYTD'] = parseFloat(x['price']) * parseFloat(x['last']);
        x['beforeYTD'] = parseFloat(x['price']) * parseFloat(x['before']);
        x['before2YTD'] = parseFloat(x['price']) * parseFloat(x['before2']);
    })
}

function computeOneCloumnSum(list, column_name) {
    let result = 0;
    list.map((x) => {
        let num = parseFloat(x[column_name]);
        if (!isNaN(num))
            result += num;
    });
    return result;
}

function computePartion(list) {
    let numerator = computeOneCloumnSum(list, 'partion');
    let denominator = computeOneCloumnSum(list, 'last');
    if (!denominator)
        return 1;
    return (denominator / numerator).toFixed(2);
}

function annual_total(data, reviewPart) {
    let x = [1, 2, 3];
    let annual_total_list = [computeOneCloumnSum(data, 'beforeYTD'), computeOneCloumnSum(data, 'lastYTD'), computeOneCloumnSum(data, 'currentYTD') * reviewPart];
    let slope_result = computeSlop(x, annual_total_list);
    annual_total_list.push(annual_total_list[2] + slope_result);
    return listTofix(annual_total_list, 2);
}

function annual_mean(data, reviewPart) {
    let x = [1, 2, 3];
    let currentNum = new Date().getFullYear();
    let before = data.filter((x) => {
        if (parseInt(x['estimate_year']) <= (currentNum - 2))
            return true;
    }).length;
    let last = data.filter((x) => {
        if (parseInt(x['estimate_year']) <= (currentNum - 1))
            return true;
    }).length;
    let current = data.filter((x) => {
        if (parseInt(x['estimate_year']) <= (currentNum))
            return true;
    }).length;
    before = before || 1;
    last = last || 1;
    current = current || 1;
    let annual_mean_list = [computeOneCloumnSum(data, 'beforeYTD') / before, computeOneCloumnSum(data, 'lastYTD') / last, computeOneCloumnSum(data, 'currentYTD') * reviewPart / current];
    let slope_result = computeSlop(x, annual_mean_list);
    annual_mean_list.push(annual_mean_list[2] + slope_result);
    return listTofix(annual_mean_list, 2);
}

function listTofix(list, num) {
    let result = [];
    list.map((x) => {
        result.push(x.toFixed(num));
    });
    return result;
}

function proportion(data, datePart) {
    let x = [1, 2, 2 + datePart];
    //获取所有的第三方卖家
    let thirdPart = data.filter((x) => {
        if (x['sellerName'] === undefined)
            console.log(x);
        if (x['sellerName'].toLowerCase().indexOf('amazon') === -1) {
            return true;
        }
    });
    let amazonPart = data.filter((x) => { ////获取所有的亚马逊自营
        if (x['sellerName'] === undefined)
            console.log(x);
        if (x['sellerName'].toLowerCase().indexOf('amazon') !== -1) {
            return true;
        }
    });
    let thirdPartList = [computeOneCloumnSum(thirdPart, 'beforeYTD'), computeOneCloumnSum(thirdPart, 'lastYTD'), computeOneCloumnSum(thirdPart, 'currentYTD')];
    let amazonPartList = [computeOneCloumnSum(amazonPart, 'beforeYTD'), computeOneCloumnSum(amazonPart, 'lastYTD'), computeOneCloumnSum(amazonPart, 'currentYTD')];
    //计算成百分比
    for (let i = 0; i < thirdPartList.length; i++) {
        let total = thirdPartList[i] + amazonPartList[i];
        total = total || 1;
        thirdPartList[i] = thirdPartList[i] / total;
        amazonPartList[i] = amazonPartList[i] / total;
    }

    let thirdSlope = computeSlop(x, thirdPartList);
    thirdPartList.push(thirdPartList[2] + thirdSlope);

    let amazonSlope = computeSlop(x, amazonPartList);
    amazonPartList.push(amazonPartList[2] + amazonSlope);

    return [listTofix(thirdPartList, 2), listTofix(amazonPartList, 2)];
}

function price_scope(data) {
    //获取一下汇率
    let exchange_rate = 1;

    let temp = parseFloat(document.getElementById("exchange_rate").value);
    if (!isNaN(temp))
        exchange_rate = temp;


    data.map((row) => {
        //价格直接除上5，就知道在哪个箱子里 //进行分箱
        let level = parseInt(row['price'] * exchange_rate / 5); //左闭右开
        if (level > 20)
            level = 20;
        row['bin'] = level;
    });
    let resultdict = {};
    //计算不同分箱的销售额,只看今年的
    for (let i = 0; i < 21; i++) {
        let onelevelbin = data.filter((row) => {
            if (row['bin'] === i)
                return true;
        });
        //计算总销售额
        let tradeVolume = computeOneCloumnSum(onelevelbin, 'currentYTD');
        let left = '[' + i * 5;
        let right = '';
        if (i === 20)
            right = 1000 + ')';
        else
            right = (i + 1) * 5 + ')';
        resultdict[left + ',' + right] = tradeVolume.toFixed(2); //设置结果字典
    }
    //剔除最高的，百分数 最低的百分数  //然后剩下的等距切分   //或者留一个汇率参数

    return resultdict;
}

function newcome_perform(data, datePart) {
    let x = [1, 2, 2 + datePart];
    let currentNum = new Date().getFullYear();
    //用韦恩图的思想，重写
    let longlongago = data.filter((x) => {
        if (parseInt(x['estimate_year']) < (currentNum - 2))
            return true;
    });
    let before = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum - 2))
            return true;
    });
    let last = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum - 1))
            return true;
    });
    let current = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum))
            return true;
    });
    //计算总和
    //2017年
    let othersumbefore = 0;
    longlongago.map((x) => { //2016以及之前的，在2017年占了多少
        othersumbefore += x['beforeYTD'];
    });
    othersumbefore = othersumbefore || 1;
    let othersumlast = 0;
    longlongago.map((x) => { //2016以及之前的，在2018年占了多少
        othersumlast += x['lastYTD'];
    });
    othersumlast = othersumlast || 1;
    let othersumcurrent = 0;
    longlongago.map((x) => { //2016以及之前的，在2019年占了多少
        othersumcurrent += x['currentYTD'];
    });
    othersumcurrent = othersumcurrent || 1;
    let equalbeforebefore = 0;
    before.map((x) => { //2017，在2017年有多少
        equalbeforebefore += x['beforeYTD'];
    });
    equalbeforebefore = equalbeforebefore || 1;
    let equalbeforelast = 0;
    before.map((x) => { //2017，在2018年有多少
        equalbeforelast += x['lastYTD'];
    });
    equalbeforelast = equalbeforelast || 1;
    let equalbeforecurrent = 0;
    before.map((x) => { //2017，在2019年有多少
        equalbeforecurrent += x['currentYTD'];
    });
    equalbeforecurrent = equalbeforecurrent || 1;
    let equallastlast = 0;
    last.map((x) => { //2018，在2018年有多少
        equallastlast += x['lastYTD'];
    });
    equallastlast = equallastlast || 1;
    let equallastcurrent = 0;
    last.map((x) => { //2018，在2019年有多少
        equallastcurrent += x['currentYTD'];
    });
    equallastcurrent = equallastcurrent || 1;
    let equalcurrentcurrent = 0;
    current.map((x) => { //2019，在2019年有多少
        equalcurrentcurrent += x['currentYTD'];
    });
    equalcurrentcurrent = equalcurrentcurrent || 1;
    //可能会有除数为零的问题
    let result = [equalbeforebefore / (othersumbefore + equalbeforebefore), (equallastlast) / (othersumlast + equalbeforelast + equallastlast), (equalcurrentcurrent) / (equalcurrentcurrent + othersumcurrent + equalbeforecurrent + equallastcurrent)];
    let slope_result = computeSlop(x, result);
    result.push(result[2] + slope_result);
    before.length = before.length||1;
    last.length = last.length||1;
    current.length = current.length||1;
    let avg_result = [equalbeforebefore / (othersumbefore + equalbeforebefore) / before.length, (equallastlast) / (othersumlast + equalbeforelast + equallastlast) / last.length, (equalcurrentcurrent) / (equalcurrentcurrent + othersumcurrent + equalbeforecurrent + equallastcurrent) / current.length];
    let avg_slope_result = computeSlop(x, avg_result);
    avg_result.push(avg_result[2] + avg_slope_result);
    return [listTofix(result, 2), listTofix(avg_result, 4)];
}

function newcome_trend_perform(data, reviewPart) { //随着时间推移，占比变化如何
    let x = [1, 2, 3];
    //在小于等于2017时候的总价值，在2017年的总价值
    let currentNum = new Date().getFullYear();

    //2017年上架的，在2017年占的比例  2018年占的比例  2019年占的比例  2020年占的比例（预估）  //2020根据左边3个变量线程插值
    //              2018年上架的，在 2018年占的比例  2019年占的比例  2020年占的比例（预估）  //根据上一行，最后两个数值的比例得知
    //                                2019上架的   在2019占的比例  2020年占的比例（预估）
    //                                                           2020年占的比例（预估）
    let before = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum - 2))
            return true;
    });
    let last = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum - 1))
            return true;
    });
    let current = data.filter((x) => {
        if (parseInt(x['estimate_year']) === (currentNum))
            return true;
    });

    //计算总和
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
        equalbeforecurrent += x['currentYTD'] * reviewPart;
    });
    //根据这3个值，推测一下2020年的
    let arraybefore = [equalbeforebefore, equalbeforelast, equalbeforecurrent];
    let before_slope = computeSlop(x, arraybefore);
    arraybefore.push(arraybefore[2] + before_slope);


    let equallastlast = 0;
    last.map((x) => { //2018，在2018年有多少
        equallastlast += x['lastYTD'];
    });
    let equallastcurrent = 0;
    last.map((x) => { //2018，在2019年有多少
        equallastcurrent += x['currentYTD'] * reviewPart;
    });
    equallastcurrent = equallastcurrent || 1; //如果是0，那么就当做是1
    //根据2018上架的，在2018年，2019年的表现，上一行最后两个数字的比例
    arraybefore[1] = arraybefore[1] || 1;
    let arraylastpredit = arraybefore[2] / arraybefore[1] * equallastcurrent;
    let arraylast = [equallastlast, equallastcurrent, arraylastpredit];

    let equalcurrentcurrent = 0;
    current.map((x) => { //2019，在2019年有多少
        equalcurrentcurrent += x['currentYTD'] * reviewPart;
    });
    //推测的2020的表现
    arraylast[0] = arraylast[0] || 1;
    arraybefore[0] = arraybefore[0] || 1;
    let arraycurrentpredit = (arraylast[1] / arraylast[0] + arraybefore[1] / arraybefore[0]) / 2 * equalcurrentcurrent;
    let arraycurrent = [equalcurrentcurrent, arraycurrentpredit];
    //根据slope推测的2020
    let y = [arraybefore[0], arraylast[0], arraycurrent[0]];
    let sloperesult = computeSlop(x, y);
    let predict_next = y[2] + sloperesult; //写成4*4比较好看一些
    /*
    arraybefore[0] arraybefore[1] arraybefore[2] arraybefore[3]
                    arraylast[0]   arraylast[1]   arraylast[2]
                                 arraycurrent[0] arraycurrent[1]
                                                  predict_next                  
    */
    let beforekey = ((currentNum - 2) + "(YTD)");
    let lastkey = ((currentNum - 1) + "(YTD)");
    let currentkey = ((currentNum) + "(YTD)");
    let nextkey = ((currentNum + 1) + "(YTD)");
    let finalResult = {}; //按列写
    finalResult[beforekey] = { "0": arraybefore[0].toFixed(2), "1": 0, "2": 0, "3": 0 };
    finalResult[lastkey] = { "0": arraybefore[1].toFixed(2), "1": arraylast[0].toFixed(2), "2": 0, "3": 0 };
    finalResult[currentkey] = { "0": arraybefore[2].toFixed(2), "1": arraylast[1].toFixed(2), "2": arraycurrent[0].toFixed(2), "3": 0 };
    finalResult[nextkey] = { "0": arraybefore[3].toFixed(2), "1": arraylast[2].toFixed(2), "2": arraycurrent[1].toFixed(2), "3": predict_next.toFixed(2) };
    return finalResult;
}

function band_proportion(data, datePart) {
    let x = [1, 2, 2 + datePart];
    //统计有哪些品牌
    let brands = [];
    data.map((x) => {
        if (brands.indexOf(x['brand'] === -1)) {
            brands.push(x['brand']);
        }
    });
    let finalResult = {};
    //得知每个品牌，3年的销售额
    brands.map((brand) => {
        let datafilterd = data.filter((row) => {
            return row['brand'] === brand;
        });
        let before = 0;
        datafilterd.map((x) => { //在2017年有多少 //计算这个品牌前年的销售额
            before += x['beforeYTD'];
        });
        let last = 0;
        datafilterd.map((x) => { //在2018年有多少  //计算这个品牌去年的销售额
            last += x['lastYTD'];
        });
        let current = 0;
        datafilterd.map((x) => { //在2019年有多少  //计算这个品牌今年的销售额
            current += x['currentYTD'];
        });
        let yearlist = [before, last, current]; //推测这个品牌明年的销售额
        let slope_result = computeSlop(x, yearlist);
        if ((yearlist[2] + slope_result) < 0)
            yearlist.push(0);
        else {
            yearlist.push(yearlist[2] + slope_result);
        }
        //将结果放入
        finalResult[brand] = (yearlist[2] + slope_result);
    });

    let total = 0; //计算总和
    for (let key in finalResult) {
        total += finalResult[key];
    }
    total = total || 1;
    //除上总的项目
    brands.map((brand) => {
        finalResult[brand] = (finalResult[brand] / total).toFixed(4);
    });
    //排序
    let sortedkey = Object.keys(finalResult).sort(function(a, b) {
        return finalResult[b] - finalResult[a];
    });
    let res = {};
    for (let key of sortedkey) {
        res[key] = finalResult[key];
    }
    return res;
}