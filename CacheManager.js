//var Helper = require('./Helper');
var mc = require('mc');

var CacheManager = function () { };
CacheManager.exptime = 7200;


CacheManager.getClient = function (callbackFun) {
    if (CacheManager.client) {
        callbackFun(CacheManager.client);
    } else {
        CacheManager.client = new mc.Client('127.0.0.1', function (results) { 
            try {
                return JSON.parse(results.buffer.toString('utf8'));
            } catch (x) {
                return results.buffer.toString('utf8');
            }
        });
        CacheManager.client.connect(function () {
            callbackFun(CacheManager.client);
        });
    }
};

//CacheManager.datas = {};

CacheManager.get = function (key, callbackFun) {
    CacheManager.getClient(function (client) {
        client.get(key, function (err, resp) {
            if (err) {
                //Helper.log("CacheManager.get(key=" + key + ") Exception: " + err);
            }
            if (callbackFun) {
                callbackFun(resp ? resp[key] : null);
            }
        });
    });
};

CacheManager.set = function (key, value, exptime, callbackFun) {
    CacheManager.getClient(function (client) {
        if (typeof (value) != 'string') { 
            value = JSON.stringify(value);
        }
        client.set(key, value, { exptime: exptime > 0 ? exptime : CacheManager.exptime }, function (err, status) {
            if (err) { 
                //Helper.log("CacheManager.set(key=" + key + ") Exception: " + err);
            }
            if (callbackFun) {
                callbackFun(status);
            }
        });
    });
    //CacheManager.datas[key] = value;
};

CacheManager.remove = function (key, callbackFun) { 
    //delete CacheManager.datas[key];
    CacheManager.getClient(function (client) {
        client.del(key, function (err, status) {
            if (err) { 
                //Helper.log("CacheManager.remove(key=" + key + ") Exception: " + err);
            }
            if (callbackFun) {
                callbackFun(status);
            }
        });
    });
};



module.exports = CacheManager;