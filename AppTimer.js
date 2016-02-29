var AppTimer = function () { };
AppTimer.TODOS = [];
AppTimer._doing = false;
AppTimer._timer = null;


AppTimer.do = function () {
    if (AppTimer.TODOS.length > 0) {
        AppTimer._doing = true;
        var todo = AppTimer.TODOS.shift(), args = []
        if (todo.args) {
            for (var i = 0; i < todo.args.length; i++) {
                args.push(todo.args[i]);
            }
        }
        args.push(AppTimer.do);
        todo.f.apply(null, args);
    } else {
        AppTimer._doing = false;
        AppTimer._timer = setTimeout(AppTimer.do, 100000);
    }
};

AppTimer.append = function (funDo, args) {
    AppTimer.TODOS.push({ f: funDo, args: args });
    if (!AppTimer._doing) {
        if (AppTimer._timer) {
            clearTimeout(AppTimer._timer);
        }
        AppTimer._timer = setTimeout(AppTimer.do, 1);
    }
};


module.exports = AppTimer;