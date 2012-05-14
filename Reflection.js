//Reflection
~function (extern) {

    var Reflection = this.Reflection = (function () { return Reflection; });
    Reflection.prototype = Reflection;
    Reflection.constructor = Reflection;
    Reflection.$abstract = true;

    function ParameterInfo(/*func*/) {

        //Lex the given function to get C# style attributes
        function Lex(func) {
            if (!func) return undefined;
            var symbols = func.toString(),
            start, end;
            start = symbols.indexOf('function');
            if (start !== 0 && start !== 1) return undefined;
            start = symbols.indexOf('(', start);
            end = symbols.indexOf(')', start);
            var args = [];
            (symbols.substr(start + 1, end - start - 1).split(',').forEach(function (argument) { args.push(argument); }));
            return args;
        };

        // ===============  Private Attributes  =================================================
        var attributes,
            defaultValue,
            isIn, isLcid, isOptional, isOut, isRetval,
            member, metadataToken,
            name, parameterType,
            position, rawDefaultValue;

        if (Is(arguments[0], String) || Is(arguments[0], Function)) {
            //We are given a single parameter to lex and return a series of ParameterInfo in a List
            var results = new List(ParameterInfo);

            //Get raw declarations and iterate
            Lex(arguments[0]).forEach(function (raw, index) {
                //Determine values based on matches inter alia
                results.Add(new ParameterInfo({
                    position: index,
                    name: raw,
                    parameterType: '', //ToDo with match
                    optional: raw.indexOf('=') !== -1                    
                }));
            });
            
            return results.array;

        } else if (Is(arguments[0], Object)) {
            attributes = arguments[0].attributes || new List(/*Attribute*/);
            name = arguments[0].name;
            position = arguments[0].position;
            defaultValue = arguments[0].defaultValue;

            member = arguments[0].member;
            metadataToken = arguments[0].metadataToken;
            parameterType = arguments[0].parameterType;
            position = arguments[0].position;
            rawDefaultValue = arguments[0].rawDefaultValue;

            isIn = arguments[0].isIn;
            isLcid = arguments[0].isLcid;
            isOptional = arguments[0].isOptional;
            isLcid = arguments[0].isLcid;
            isOut = arguments[0].isOut;
            isRetval = arguments[0].isRetval;
        }

        // ===============  Public Properties  =================================================

        /*
        It seems I could make Properties auto-implement by overriding call to check the caller to be an instance of class. 
        If it is then return Object.defineProperty(arguments);
        It would look like this:
        */
        // /* readonly Attribute[] Attributes = */ (function(ParameterInfo.prototype, 'Attributes', {
        //     get: function () { return attributes; }
        // }){}();

        //Gets the attributes for this parameter.
        Object.defineProperty(this, 'Attributes', {
            get: function () { return attributes; }
        });

        //Gets a value indicating the default value if the parameter has a default value.
        Object.defineProperty(this, 'DefaultValue', {
            get: function () { }
        });

        //Gets a value indicating whether this is an input parameter.
        Object.defineProperty(this, 'IsIn', {
            get: function () { }
        });

        //Gets a value indicating whether this parameter is a locale identifier (lcid).
        Object.defineProperty(this, 'IsLcid', {
            get: function () { }
        });

        //Gets a value indicating whether this is optional
        Object.defineProperty(this, 'IsOptional', {
            get: function () { }
        });

        //Gets a value indicating whether this is an output parameter.
        Object.defineProperty(this, 'IsOut', {
            get: function () { }
        });

        //Gets a value indicating whether this is a Retval parameter
        Object.defineProperty(this, 'IsRetval', {
            get: function () { }
        });

        //Gets a value indicating the member in which the parameter is implemented.
        Object.defineProperty(this, 'Member', {
            get: function () { }
        });

        //Gets a value that identifies this parameter in metadata.
        Object.defineProperty(this, 'MemberdataToken', {
            get: function () { }
        });

        //Gets the name of the parameter.
        Object.defineProperty(this, 'Name', {
            get: function () { return name = name.replace($JavascriptReflectionMatch, '') }
        });

        //Gets the Type of this parameter.
        Object.defineProperty(this, 'ParameterType', {
            get: function () { }
        });

        //Gets the zero-based position of the parameter in the formal parameter list.
        Object.defineProperty(this, 'Position', {
            get: function () { }
        });

        //Gets a value indicating the default value if the parameter has a default value.
        Object.defineProperty(this, 'RawDefaultValue', {
            get: function () { }
        });

    }

    //Possibly should utilize RegEx...
    //Possibly should find hidden arguments
    //Possibly should only find/retrieve arguments of certain type
    //Possibly should find type of returned arguments
    //Possibly should contain ParameterInfo for returned arguments
    Reflection.getArguments = function (func) { return new ParameterInfo(func); }

    $export(Reflection, window, 'reflection');

    Function.prototype.getArguments = function () { return Reflection.getArguments(this); }

    Function.prototype.getExpectedReturnType = function () { /*ToDo*/ }

} (this);