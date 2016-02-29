'use strict';
var util = require('util');
var crypto = require('crypto');
var path = require('path');
var log4js = require('log4js');
var request = require('request');
var CacheManager = require('./CacheManager');
var AppTimer = require('./AppTimer');

var Helper = {};

/**加密 */
Helper.encrypt = function (str, hashType) {
    if (!hashType) { 
        hashType = 'md5';
    }
    var m = crypto.createHash(hashType);
    m.update(str, 'utf8');
    return m.digest('hex').toUpperCase();
};

Helper.md5 = function (str) {
    return Helper.encrypt(str, 'md5');
};

Helper.sha1 = function (str) {
    return Helper.encrypt(str, 'sha1');
};


Helper.__aes_cnf = {
    key: '2015070118112826',
    algorithm: 'aes-128-ecb',
    clearEncoding: 'utf8',
    iv: '',
    cipherEncoding:'hex'
};
Helper.aes = function (str) {
    var cipher = crypto.createCipheriv(Helper.__aes_cnf.algorithm, Helper.__aes_cnf.key, Helper.__aes_cnf.iv),
        cipherChunks = [];
    cipherChunks.push(cipher.update(str, Helper.__aes_cnf.clearEncoding, Helper.__aes_cnf.cipherEncoding));
    cipherChunks.push(cipher.final(Helper.__aes_cnf.cipherEncoding));
    return cipherChunks.join('');
};

Helper.deAes = function (str) {
    var decipher = crypto.createDecipheriv(Helper.__aes_cnf.algorithm, Helper.__aes_cnf.key, Helper.__aes_cnf.iv),
        plainChunks = [];
    for (var i = 0; i < str.length; i+=2) {
        plainChunks.push(decipher.update(str.substr(i, 2), Helper.__aes_cnf.cipherEncoding, Helper.__aes_cnf.clearEncoding));
    }
    plainChunks.push(decipher.final(Helper.__aes_cnf.clearEncoding));
    return plainChunks.join('');
};

/**简单的cache */
Helper.cache = {};

Helper.cache.get = function (key, callbackFun) {
    return CacheManager.get(key, callbackFun);
};

Helper.cache.set = function (key, value, exptime, callbackFun) {
    CacheManager.set(key, value, exptime, callbackFun);
};

Helper.cache.remove = function (key, callbackFun) {
    CacheManager.remove(key, callbackFun);
};

/**
 * 对日期进行格式化，
 * @param date 要格式化的日期
 * @param format 进行格式化的模式字符串
 *     支持的模式字母有：
 *     y:年,
 *     M:年中的月份(1-12),
 *     d:月份中的天(1-31),
 *     h:小时(0-23),
 *     m:分(0-59),
 *     s:秒(0-59),
 *     S:毫秒(0-999),
 *     q:季度(1-4)
 * @return String
 * @author yanis.wang@gmail.com
 */
Helper.dateFormat = function(date, format) {
    if(format === undefined){
        format = date;
        date = new Date();
    }
    var map = {
        "M": date.getMonth() + 1, //月份
        "d": date.getDate(), //日
        "h": date.getHours(), //小时
        "m": date.getMinutes(), //分
        "s": date.getSeconds(), //秒
        "q": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    format = format.replace(/([yMdhmsqS])+/g, function(all, t){
        var v = map[t];
        if(v !== undefined){
            if(all.length > 1){
                v = '0' + v;
                v = v.substr(v.length-2);
            }
            return v;
        }
        else if(t === 'y'){
            return (date.getFullYear() + '').substr(4 - all.length);
        }
        return all;
    });
    return format;
};
Helper.nowDate = Helper.dateFormat('yyyy')+
    Helper.dateFormat('-MM')+
    Helper.dateFormat('-dd')+
    Helper.dateFormat(' hh')+
    Helper.dateFormat(':mm')+
    Helper.dateFormat(':ss');
/**Date原型扩展方法，格式化*/
Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4- RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
};
//计算天数，昨天：GetDateStr(-1) 今天：GetDateStr(0) 明天：GetDateStr(1),计算结果类似：'2015-09-11'
Helper.calDate = function(AddDayCount) {
    var dd = new Date();
    dd.setDate(dd.getDate()+AddDayCount);//获取AddDayCount天后的日期
    var y = dd.getFullYear();
    var m = dd.getMonth()+1;//获取当前月份的日期
    var d = dd.getDate();
    m=('00' + m).length == 4 ? ('00' + m).substr(2) : ('00' + m).substr(1);
    d=('00' + d).length == 4 ? ('00' + d).substr(2) : ('00' + d).substr(1);
    return y+"-"+m+"-"+d;
};

//计算天数，昨天：calDate(-1) 今天：calDate(0) 明天：calDate(1),计算结果类似：'20150911'
Helper.calDateNew = function(AddDayCount) {
    var dd = new Date();
    dd.setDate(dd.getDate()+AddDayCount);//获取AddDayCount天后的日期
    var y = dd.getFullYear();
    var m = dd.getMonth()+1;//获取当前月份的日期
    var d = dd.getDate();
    m=('00' + m).length == 4 ? ('00' + m).substr(2) : ('00' + m).substr(1);
    d=('00' + d).length == 4 ? ('00' + d).substr(2) : ('00' + d).substr(1);
    return y+""+m+""+d;
};


/**生成订单编号，年月日后加五位数字*/
var Random4Num="";
for (var i=0;i<4;i++) {
    Random4Num += Math.floor(Math.random()*10);
}
Helper.orderno_create = Helper.dateFormat('yyyy')+Helper.dateFormat('MM')+Helper.dateFormat('dd')+Random4Num;

/**验证数组*/
Helper.isArray = function (arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
};


var s_chs = "abcdefghijklmnopqrstuvwxyz0123456789_-@.", t_chs = "01az2bc4dDeoCfi67kgnpBrshtulvwxqy3m5j8A9";

Helper.encryptStr = function (pStr) {
    pStr = pStr.toLowerCase();
    var _s = [], _len = pStr.length, _slen = s_chs.length;
    for (var _i = 0; _i < _len; _i++) {
        var _ch = pStr[_i], _index = -1;
        for (var _j = 0; _j < _slen; _j++) {
            if (s_chs[_j] == _ch) {
                _index = _j;
                break;
            }
        }
        _s[_i] = _index >= 0 ? t_chs[_index] : _ch;
    }
    var _m = Math.floor(_len / 2);
    for (var _n = 0; _n < _m; _n++) {
        var _tIndex = _m + _n;
        var _chT = _s[_n];
        _s[_n] = _s[_tIndex];
        _s[_tIndex] = _chT;
    }
    return _s.join("");
}

Helper.decryptStr = function (pStr) {
    var len = pStr.Length,
        m = len / 2;
    for (var i = 0; i < m; i++) {
        var tIndex = m + i,
            chT = pStr[i];
        pStr[i] = pStr[tIndex];
        pStr[tIndex] = chT;
    }
    for (var i = 0; i < len; i++) {
        var ch = pStr[i],
            idx = t_chs.indexOf(ch);
        if (idx >= 0) {
            pStr[i] = s_chs[idx];
        }
    }
    return pStr;
};

function GUID() {
    this.date = new Date();

    /* 判断是否初始化过，如果初始化过以下代码，则以下代码将不再执行，实际中只执行一次 */
    if (typeof this.newGUID != 'function') {

        /* 生成GUID码 */
        GUID.prototype.newGUID = function () {
            this.date = new Date();
            var guidStr = '';
            var sexadecimalDate = this.hexadecimal(this.getGUIDDate(), 16);
            var sexadecimalTime = this.hexadecimal(this.getGUIDTime(), 16);
            for (var i = 0; i < 9; i++) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            guidStr += sexadecimalDate;
            guidStr += sexadecimalTime;
            while (guidStr.length < 32) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            return this.formatGUID(guidStr);
        };

        /*
         * 功能：获取当前日期的GUID格式，即8位数的日期：19700101
         * 返回值：返回GUID日期格式的字条串
         */
        GUID.prototype.getGUIDDate = function () {
            return this.date.getFullYear() + this.addZero(this.date.getMonth() + 1) + this.addZero(this.date.getDay());
        };

        /*
         * 功能：获取当前时间的GUID格式，即8位数的时间，包括毫秒，毫秒为2位数：12300933
         * 返回值：返回GUID日期格式的字条串
         */
        GUID.prototype.getGUIDTime = function () {
            return this.addZero(this.date.getHours()) + this.addZero(this.date.getMinutes()) + this.addZero(this.date.getSeconds()) + this.addZero(parseInt(this.date.getMilliseconds() / 10));
        };

        /*
         * 功能: 为一位数的正整数前面添加0，如果是可以转成非NaN数字的字符串也可以实现
         * 参数: 参数表示准备再前面添加0的数字或可以转换成数字的字符串
         * 返回值: 如果符合条件，返回添加0后的字条串类型，否则返回自身的字符串
         */
        GUID.prototype.addZero = function (num) {
            if (Number(num).toString() != 'NaN' && num >= 0 && num < 10) {
                return '0' + Math.floor(num);
            } else {
                return num.toString();
            }
        };

        /*
         * 功能：将y进制的数值，转换为x进制的数值
         * 参数：第1个参数表示欲转换的数值；第2个参数表示欲转换的进制；第3个参数可选，表示当前的进制数，如不写则为10
         * 返回值：返回转换后的字符串
         */
        GUID.prototype.hexadecimal = function (num, x, y) {
            if (y != undefined) {
                return parseInt(num.toString(), y).toString(x);
            } else {
                return parseInt(num.toString()).toString(x);
            }
        };

        /*
         * 功能：格式化32位的字符串为GUID模式的字符串
         * 参数：第1个参数表示32位的字符串
         * 返回值：标准GUID格式的字符串
         */
        GUID.prototype.formatGUID = function (guidStr) {
            var str1 = guidStr.slice(0, 8) + '-',
                    str2 = guidStr.slice(8, 12) + '-',
                    str3 = guidStr.slice(12, 16) + '-',
                    str4 = guidStr.slice(16, 20) + '-',
                    str5 = guidStr.slice(20);
            return str1 + str2 + str3 + str4 + str5;
        };
    }
}

Helper.GUID = GUID;

/**去掉html标签*/
Helper.removeHTMLTag = function (str) {
    str = str.replace(/<\/?[^>]*>/g, ''); //去除HTML tag
    //str = str.replace(/[ | ]* /g,' '); //去除行尾空白
    //str = str.replace(/ [\s| | ]* /g,' '); //去除多余空行
    //str=str.replace(/ /ig,'');//去掉
    return str;
};



// 日志
Helper.logger = function () {
};
Helper.logger.init = function () {
    if (!Helper.logger._logger) {
        log4js.configure({
            "appenders": [
                {
                    "type": "console",
                    "layout": {
                        "type": "pattern",
                        "pattern": "%m"
                    },
                    "category": "app"
                }, {
                    "category": "deploy",
                    "type": "dateFile",
                    "filename": path.resolve(__dirname, "./public/logs/log"),
                    "maxLogSize": 2048000000,
                    "backups": 3,
                    "pattern": "_yyyy-MM-dd.log",
                    "alwaysIncludePattern": false,
                    //"layout": {
                    //    "type": "pattern",
                    //    "pattern": "%d{yyyy-MM-dd hh:mm:ss} %-5p %m",
                    //    "alwaysIncludePattern": true
                    //}
                }
            ],
            "replaceConsole": true
        });
        Helper.logger._logger = log4js.getLogger("deploy");
    }
    return Helper.logger._logger;
};
Helper.log = function (msg) {
    Helper.logger.init().info(msg);
};




// 发短信
// to: 接收短信的手机号，多个手机号之间用英文逗号分隔
// templateId: 短信模板ID
// params: 应用到模板中的参数。多个参数之间用英文逗号分隔
// callbackFun 可不传。参数类似于：{"resp":{"respCode":"000000","templateSMS":{"createDate":"20150804192422","smsId":" c864fcab8d2450b53887ceb18cc9b64e "}}}
Helper.sendSMS = function (to, templateId, params, callbackFun) {
    var dt = new Date(), y = dt.getFullYear() + '', M = dt.getMonth() + 1, d = dt.getDate(),
        h = dt.getHours(), m = dt.getMinutes(), s = dt.getSeconds(), S = dt.getMilliseconds();
    if (M < 10) {
        M = '0' + M;
    }
    if (d < 10) {
        d = '0' + d;
    }
    if (h < 10) {
        h = '0' + h;
    }
    if (m < 10) {
        m = '0' + m;
    }
    if (s < 10) {
        s = '0' + s;
    }
    if (S < 10) {
        S = '00' + S;
    } else if (S < 100) {
        S = '0' + S
    }
    var time = y + M + d + h + m + s + S;
    var sid = '6eb4cd1e4fdb67994ea873b82dee2c8f',
        appId = '0590368328a24548b8ca68930ef103fb',
        token = 'cf99780d3b8f8d7065aee05301e39891',
        sign = Helper.md5(sid + time + token).toLowerCase();
    request.post('http://www.ucpaas.com/maap/sms/code',
        {
            form: {
                sid: sid,
                appId: appId,
                sign: sign,
                time: time,
                templateId: templateId,
                to: to,
                param: params
            }
        }, function (error, response, body) {
        if (callbackFun) { 
            callbackFun(body);
        }
    });
};

//20151010180303转为"2015-10-10 18:03:03"，暂时先用这个简版
Helper.numdatetostr = function(numberdate) {
    numberdate = (numberdate+'');
    var d = numberdate.substr(0,4) + '-' + numberdate.substr(4,2) + '-' + numberdate.substr(6,2);
    if (numberdate.length > 8) {
        d += ' '+ numberdate.substr(8,2) + ':' + numberdate.substr(10,2)+':' + numberdate.substr(12,2)
    }
    return d;
};



Helper.appendTimer = function (funDo, args) {
    AppTimer.append(funDo, args);
};

//根据两个百度地图坐标计算两点的距离
Helper.getDistanceFromXtoY = function(lat_a, lng_a, lat_b, lng_b){
    var pk = 180 / 3.14169;
    var a1 = lat_a / pk;
    var a2 = lng_a / pk;
    var b1 = lat_b / pk;
    var b2 = lng_b / pk;
    var t1 = Math.cos(a1) * Math.cos(a2) * Math.cos(b1) * Math.cos(b2);
    var t2 = Math.cos(a1) * Math.sin(a2) * Math.cos(b1) * Math.sin(b2);
    var t3 = Math.sin(a1) * Math.sin(b1);
    var tt = Math.acos(t1 + t2 + t3);
    return 6366000 * tt;
};


module.exports = Helper;