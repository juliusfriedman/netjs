//Reflection
~function (extern) {

    var Reflection = this.Reflection = (function () { return Reflection; });

    Reflection.prototype = Reflection;

    Reflection.constructor = Reflection;

    //Possibly should utilize RegEx...
    //Possibly should find hidden arguments
    //Possibly should only find/retrieve arguments of certain type
    //Possibly should find type of returned arguments
    //Possibly should contain ParameterInfo for returned arguments
    Reflection.getArguments = function (func) {
        var symbols = func.toString(),
            start, end, register;
        start = symbols.indexOf('function');
        if (start !== 0 && start !== 1) return undefined;
        start = symbols.indexOf('(', start);
        end = symbols.indexOf(')', start);
        var args = [];
        (symbols.substr(start + 1, end - start - 1).split(',').forEach(function (argument) { args.push(argument); }));
        //Deterine if I should use RegExp
        //I know that using RegExp on a string may be faster then using the instanceof in certain cases as well as looping scopes
        return args;
    };

    $export(Reflection, window, 'reflection');

    Function.prototype.getArguments = function () { return Reflection.getArguments(this); }

    Function.prototype.getExpectedReturnType = function () { /*ToDo*/ }

} (this);