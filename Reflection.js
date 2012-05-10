//Reflection

~function (extern) {

    var Reflection = this.Reflection = (function () { return Reflection; });

    Reflection.prototype = Reflection;

    Reflection.constructor = Reflection;

    Reflection.getArguments = function (func) {
        var symbols = func.toString(),
            start, end, register;
        start = symbols.indexOf('function');
        if (start !== 0 && start !== 1) return undefined;
        start = symbols.indexOf('(', start);
        end = symbols.indexOf(')', start);
        var args = [];
        symbols.substr(start + 1, end - start - 1).split(',').forEach(function (argument) {
            args.push(argument);
        });
        return args;
    };

    extern.Reflection = extern.reflection = Reflection;

    Function.prototype.getArguments = function () { return Reflection.getArguments(this); }

    Function.prototype.getExpectedReturnType = function () { /*ToDo*/ }

} (this);