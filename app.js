var express = require('express');
var process = require('process');
var domain = require('domain');
var routes = require('./routes');
var user = require('./routes/user');
var mg = require('./routes/mg');
var mgstore = require('./routes/mgstore');
var profile = require('./routes/profile');


/**api模块引入*/
var admin = require('./api/admin.js');
var area = require('./api/area.js');
var syscnf = require('./api/syscnf.js');
var upload = require('./api/upload.js');
var userapi = require('./api/user.js');

var opencrm = require('./open/crm.js');

var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
//var concat = require('concat-stream');
var Helper = require('./Helper');

var app = express();

app.use(function (req, res, next) {
    var d = domain.create();
    d.on('error', function (err) {
        Helper.log('Throw exception(domain)[' + req.url + ']: ' + err.message);
        res.send({ err: 500 });
        d.dispose();
    });
    d.add(req);
    d.add(res);
    d.run(next);
});
//app.use(function (req, res, next) {
//    req.pipe(concat(function (data) {
//        req.bodydata = data;
//        next();
//    }));
//});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(cookieParser());
app.use(function (req, res, next) {
    var contentType = req.headers['content-type'] || '', mime = contentType.split(';')[0];
    if (mime != 'text/xml') {
        return next();
    }
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        req.rawBody = data;
        next();
    });
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: './uploads/' }));
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public'), {index:'index.htm'}));


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//app.get('/', routes.index);
//app.get('/news/', routes.news_index);
app.get('/login', routes.login);
app.get('/logout', routes.logout);
app.get('/reg', routes.reg);
app.get('/resetpwd', routes.resetpwd);
//app.get('/cart', routes.cart);
//app.get('/cart_1', routes.cart_1);
//app.post('/cart_2', routes.cart_2);
app.post('/cart_3', routes.cart_3);
app.post('/savefrom', routes.savefrom);
//app.use('/profile/', profile.profile_router);

app.use('/open/crm/', opencrm.open_crm_router);

app.get('/_mg/', mg.index);
//app.get('/mgstore/', mgstore.index);
app.use('/api/admin/login', admin.login);
app.use('/api/admin/logout', admin.logout);
app.post('/api/admin/user_chgpass', admin.user_chgPass);
app.post('/api/admin/user_chgselfpass', admin.user_chgSelfPass);
app.get('/api/admin/user_gets', admin.user_gets);
app.post('/api/admin/user_remove', admin.user_remove);
app.post('/api/admin/user_add', admin.user_add);
app.post('/api/admin/user_chgroles', admin.user_chgroles);
app.get('/api/admin/role_gets', admin.role_gets);
app.post('/api/admin/role_add', admin.role_add);
app.post('/api/admin/role_remove', admin.role_remove);
app.post('/api/admin/role_update', admin.role_update);
app.get('/api/admin/getmodules', admin.getModules);
app.post('/api/admin/modules_updateidx', admin.updateModuleIdx);
app.post('/api/admin/modules_add', admin.addModule);
app.post('/api/admin/modules_remove', admin.removeModule);
app.post('/api/admin/modules_update', admin.updateModule);
app.get('/api/syscnf_get', syscnf.get);
app.post('/api/admin/syscnf_set', syscnf.set);
app.post('/api/admin/syscnf_remove', syscnf.remove);
app.get('/api/area/getchilds', area.getChilds);
app.get('/api/area/get', area.get);
app.get('/api/area/getfull', area.getFull);
app.use('/api/upimg', upload.upimg);


/**user前端用户api*/
//app.use('/api/user/login',userapi.login);//注册用户登录
//app.use('/api/user/logout',userapi.logout);//注册用户登出
//app.post('/api/user/user_loginstate_check',userapi.user_loginstate_check);//注册用户检测登录状态
//app.get('/api/user/getuserpage',userapi.getuserpage);//分页获取所有用户
//app.post('/api/user/user_address_setdefault',userapi.user_address_setdefault);//设置默认地址
//app.get('/api/user/user_address_gets',userapi.user_address_gets);//获取某个用户的所有地址

/**mall商城api*/

/**体验店api*/


process.on('uncaughtException', function (err) {
    Helper.log('Throw exception(process): ' + err.message);
});

http.createServer(app).listen(app.get('port'), function () {
});