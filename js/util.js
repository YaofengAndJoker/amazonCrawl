/*函数,获取地址栏的查询参数*/
function getQueryStringArgs()//javascript高级程序设计,P207
{
	var qs = (location.search.length>0? location.search.substring(1):"");
	var args = {};
	var items = qs.length? qs.split("&"):[];
	var item = null,name = null,value = null;
	var i = 0,len = items.length;
	for(i=0;i<len;i++){
		item = items[i].split("=");
		name = decodeURIComponent(item[0]);
		value = decodeURIComponent(item[1]);
		if(name.length)
			args[name]=value;
	}
	return args;
}