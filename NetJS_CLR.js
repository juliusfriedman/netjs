~function (extern, REBUILD_CLR) {

    return (typeof CollectGarbadge === 'undefined' && Boolean(REBUILD_CLR) === true) ? undefined : new (function () {

        //.Net JavaScript (this should be a new scope)
        var newScope = this,
        CLRItself = {
            version: {
                major: 0.1,
                minor: 0.0001
            },
            valueOf: function () { return newScope; },
            toString: function () { return 'CLR ' + [CLRItself.version.major, CLRItself.version.minor].join('.'); }
        };

        newScope.valueOf = CLRItself.valueOf;
        newScope.toString = CLRItself.toString;
        newScope.version = CLRItself.version;

        // Method: Export 
        // Description: The Export function takes the given what and puts it where (optionally as 'as')
        function $Export(what, where/*, as*/) {
            if (!what && !where) return;
            var as = arguments[2] || what;
            $Export.exported[as] = where;
            where[as] = what;
        }

        //Memory for exported members
        $Export.exported = {};

        //Export Export to the window as export
        $Export($Export, window, 'Export');

        //Removes the given object from the exports if it was exported
        $Export.remove = function (what) {
            //Enumerate exported members
            for (var t in $Export.exported) // t is type or typeName
            //If there is a member with the same type name as what
                if ($Export.exported.hasOwnProperty(t)) {
                    //Express the typename to get where it was exported to and delete it as well as the Export entry
                    delete ($Export.exported[t])[t]
                    delete $Export.exported[t];
                }
        }



        //Security
        var Security = {
            valueOf: function () { return this; },
            toString: function () { return 'Security'; }
        };

        //Adds an allowed scope with expected depth
        Security.addSafeScope = function(argumentz, expectedCallerDepth, expectedCaller/*,Boolean noVerify = false*/) {
            var noVerify = arguments[3] || false;
            if (noVerify === false) expectedCallerDepth += 2; //Protect against CLR Checks unless noVerify is given
            try { if (noVerify !== false) Security.checkScope(); }
            catch (_) { throw _; }
            if (typeof Security.addSafeScope.registered[expectedCaller] === 'undefined') Security.addSafeScope.registered[expectedCaller] = expectedCallerDepth //This allow patch in and multiple callers
            else Security.addSafeScope.registered[expectedCaller] += expectedCallerDepth;
        }

        Security.addSafeScope.registered = {};

        //Checks a scope
        Security.checkScope = function() {
            if (this.toString() === CLRItself.toString()) return true; //Not very secure :P
            try {
                var stackPointer = undefined,
                cycle = -1;
                //Iterate all registered
                for (var r in Security.addSafeScope.registered) {
                    //If there is a registered caller and it is equal to the expectedCaller then ensure the cyclic depth is also correct
                    if (Security.addSafeScope.registered.hasOwnProperty(r)) {
                        cycle = Security.addSafeScope.registered[r];
                        stackPointer = arguments.callee;
                        while (cycle >= 0) {
                            stackPointer = stackPointer.caller;
                            cycle--;
                            if (stackPointer == r) return;
                        }

                    }
                }

                //Throw
                throw new Error('Invalid expectedCaller at expectedCallerDepth');
            }
            catch (_) { throw _; }
        }
        $Export(Security, window);

        //Cleanup prototype
        function $cleanPrototype(object) { for (var p in object) if (!object.hasOwnProperty(p)) delete object.p; }
        $Export($cleanPrototype, window, 'CleanPrototype');

        //Converts arguments into ParameterInfo's
        function $convertLegacyArguments(argumentz) {
            if (!argumentz || argumentz.length && argumentz[0] instanceof ParameterInfo) return argumentz;
            for (var i = 0, e = argumentz.length; i < e; ++i) {
                argumentz[i] = new ParameterInfo({
                    position: i,
                    value: argumentz[i],
                    defaultValue: argumentz[i],
                    rawDefaultValue: argumentz[i],
                    parameterType: $getTypeName(argumentz[i]) || typeof argumentz[i],
                    optional: false,
                    name: argumentz[i].toString()
                });
            }
            return argumentz;
        }
        $Export($convertLegacyArguments, window, 'ConvertArguments');

        //This verification is ugly... the proper way to do this is to have a list of allowed entry points and do a compare on the caller chain to all of the qualified safe entry points
        function $isCLR() {
            try { Security.checkScope(); return true; }
            catch (_) { return false; }
            return this === newScope; //Should never happen unless ...
        }

        //Export $isCLR as isCLR
        Export($isCLR, window, 'isCLR');

        //Checks for CLR Scope
        function $checkCLR() { if (!$isCLR()) throw 'The CLR is required to access this scope'; }

        //Export $checkCLR as checkCLR
        Export($checkCLR, window, 'checkCLR');

        //Backup the old apply function
        var Function$prototype$apply = Function.prototype.apply

        //Ensures functions cannot operate on CLR Classes unless they are bound in the rules of the CLR
        Function.prototype.apply = function () {
            $checkCLR();
            try { return Function$prototype$apply($convertLegacyArguments(arguments), this); }
            catch (_) { return Function$prototype$apply; }
        }

        //Object.prototype._constructor = Object.prototype.constructor;

        Object.prototype.constructor = function () { return this === extern ? new Class(Object) : Class({}); }

        /*<ltIE9>*/
        if ((navigator.appVersion.indexOf('7.') !== -1 || navigator.appVersion.indexOf('8.') !== -1 && navigator.appVersion.indexOf('MSIE') !== -1)) {
            //Backup prototype
            var Object$prototyoe = Object.prototype;
            //Set the prototype to the Element Constructor
            Object.prototype = document.createElement;
            //Backup defineProperty cause IE8 has it but only is valid for Elements.
            var Object$defineProperty = Object.defineProperty;
            //Undefine defineProperty
            Object.defineProperty = undefined;
        }

        if (!Function.prototype.bind) {
            if (typeof (Function.prototype.bind) == 'undefined') {
                Function.prototype.bind = function (context) {
                    var oldRef = this;
                    return function () {
                        return oldRef.apply(context || null, Array.prototype.slice.call(arguments));
                    };
                }
            }
            Security.addSafeScope(Function.prototype.call, 2, Function.prototype.bind);
            Security.addSafeScope(Function.prototype.bind, 2, Function.prototype.apply);
        }

        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function (item, from) {
                var length = this.length >>> 0;
                for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
                    if (this[i] === item) return i;
                }
                return -1;
            }
        }

        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function (fn, bind) {
                for (var i = 0, l = this.length; i < l; i++) {
                    if (i in this) fn.call(bind, this[i], i, this);
                }
            }
        }

        if (!Object.forEach) {
            Object.forEach = function (object, fn, bind) {
                for (var key in object) {
                    if (Object.hasOwnProperty(object, key)) fn.call(bind, object[key], key, object);
                }
            }
        }

        if (!Object.keys) {
            Object.keys = function (that) {
                var results = [];
                for (var p in that)
                    if (that.hasOwnProperty(p))
                        results.push(that.p);
                return results;
            };
        }

        //Backup GarbadgeCollector
        var _CollectGarbadge = typeof CollectGarbage === 'undefined' ? undefined : CollectGarbage;

        //Garbadge Collector
        function $CollectGarbadge() { CollectGarbage(); }
        $CollectGarbadge.toString = function () { return '$CollectGarbadge' }
        $CollectGarbadge.$abstract = true;

        //Replace
        CollectGarbage = $CollectGarbadge;

        //Hash of known Object, Handles with a live timeOut
        $CollectGarbadge.timeOuts = {};

        //Export $CollectGarbadge
        $Export($CollectGarbadge, window, 'CollectGarbadge');

        //Gets the Type name from the Constructor given (Native/Declared Types Only)
        function $getTypeName(type) {
            try {
                type = typeof type !== 'undefined' ? type : this.GetTypeName();
                if (!(typeof type === 'string' || type instanceof String)) {
                    var result = type.toString().split(' ');
                    if (result.length === 1) return result; // Qualified Type
                    else result = result[1];
                    result = result.toString().substring(0, result.indexOf('(')); return result; //Native
                    return result;
                }
                throw new Error();
            }
            catch (_) { return type; }
        }; //0 = function, 1 = name and  so on => {, [native code], }

        //Allows a constructor to determine if new was called
        function $isNewObject(object) { return object.toString() === '[object Object]'; }

        //Export $getTypeName to the window as GetTypeName
        Export($getTypeName, window, 'GetTypeName');

        //Is function
        function $Is(what, type) {
            try {
                if (typeof what === $getTypeName(type).toLowerCase()) return true;
                else return what instanceof type;
            }
            catch (_) { return false; }
        }

        //Export $Is to the window as Is
        Export($Is, window, 'Is');

        //As
        function $As(what, type) { try { return new type(what); } catch (_) { return $cast(what, type); } }

        //Export to static
        Object.as = $As;

        //Export $As to the window as Is
        Export($As, window, 'As');

        //Export $Is to the window as Is
        Export($Is, window, 'Is');

        //Export to static
        Object.is = $Is;

        Export($Is, window, 'Is');

        //Export to prototype
        //Object.prototype.is = Object.is;

        //Polyfill for freeze
        if (!Object.freeze) {

            //Puts the ice on
            function ice(object) { freeze.freezer[object] = true; }

            //Takes the ice off
            function thaw(object) { delete freeze.freezer[object]; }

            //Freeze the object
            function freeze(object) { return ice(object); }

            function isFrozen(object) { return freeze.freezer[object] === true; }

            //Memory for frozen objects
            freeze.freezer = {}

            //Export
            Object.freeze = freeze;
            Object.isFrozen = isFrozen;
        }

        //Polyfill for seal
        if (!Object.seal) {

            function seal(object) { seal.sealed[object] = true; }

            function isSealed(object) { return seal.sealed[object] ? true : false; }

            //Memory for sealed objects
            seal.sealed = {};

            //Export
            Object.seal = seal;
            Object.isSealed = isSealed;
        }

        //Throws for sealed attribute
        function $checkSealed(constructor, derivedConstructor) { if (Object.isSealed(constructor)) throw derivedConstructor.toString() + 'cannot inherit from sealed class' + constructor.toString() + '.'; };

        //Polyfill for defineProperty
        if (typeof Object.defineProperty === 'undefined') {
            var descriptorHash = {};

            function legacyGet(object, property, descriptor) {
                return descriptor.value ? descriptor.value.valueOf() :
                descriptor.get ? descriptor.get.bind(object)() : object[property];
            }

            $Export(legacyGet, window, 'legacyGet');

            function legacySet(object, property, descriptor, value) {
                if (!descriptor.writeable || (descriptor.enforceType && !(value instanceof descriptor.value))) return;
                object[property] = value;
            }

            $Export(legacyGet, window, 'legacySet')

            function legacyIterate(object) {
                ///TODO
                for (var m in object) {
                    //Kinda Need LINQ Yield here
                }
            }

            function setDescriptor(object, property, newDescriptor) {
                if (!object || !property) return;
                var existing = descriptorHash[object][property];
                if (existing && !existing.configurable) throw 'Cannot modify the existing descriptor for the non-configurable property: "' + property + '"';
                defineProperty(object, name, newDescriptor || {
                    enumerable: newDescriptor.enumerable || false,
                    writeable: newDescriptor.writeable || false,
                    configurable: descriptor.configurable || false,
                    value: newDescriptor.value || null,
                    enforceType: descriptor.enforceType || false,
                    get: newDescriptor.get || undefined,
                    set: newDescriptor.set || undefined
                });
                //Store last version
                descriptorHash[object][property]._previous = existing;
            }

            $Export(setDescriptor, window, 'setDescriptor');


            //Adds a property to an object with getter, setter and descriptor support
            function defineProperty(object, name, descriptor) {
                if (!object || !name) return;
                if (typeof descriptor.value !== 'undefined' && typeof descriptor.get !== 'undefined') throw 'Descriptor cannot contain a value and a getter';
                descriptor = {
                    enumerable: descriptor.enumerable || false,
                    writeable: descriptor.writeable || false,
                    configurable: descriptor.configurable || false,
                    value: descriptor.value || null,
                    enforceType: descriptor.enforceType || false,
                    get: descriptor.get ? descriptor.get : function () { return legacyGet(object, name, descriptor); } .bind(object),
                    set: descriptor.set ? descriptor.set : descriptor.writable ? function (value) { return legacySet(object, name, descriptor, value); } .bind(object) : function () { }
                };

                //Create getter / setter - might need to do a call scan to determine if this is an assignment
                var getterSetter = function (value) { return (typeof value === 'undefined' || value == descriptor.value) ? legacyGet(object, name, descriptor) : legacySet(object, name, descriptor, value); }

                //Create value proxy object
                var valueProxy = {
                    valueOf: function () { return getterSetter(arguments); },
                    toString: function () { return this.valueOf().toString(); }
                }

                //Store on object if enumerable
                if (descriptor.enumerable) object[name] = valueProxy;

                //Store in descriptor hash
                descriptorHash[object] = {};
                descriptorHash[object][name] = descriptor;
            }

            //Augment Object
            Object.defineProperty = defineProperty;
        }

        //Expose the CLR as readonly
        Object.defineProperty(window, 'CLR', { value: newScope });

        //Define the property of TimeToLive = 5 + Minutes in milliseconds
        Object.defineProperty($CollectGarbadge, 'TimeToLive', { value: 300025 });

        //The abstract class constructor
        function abstractConstructor(constructor) { throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + '[' + JSON.stringify(constructor) + ', ' + this.$abstract.toString() + ']'; }

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        //Description: Helps interpreterd code to function correctly after compile with respect to instanceof
        function $subclass(constructor, derivedConstructor/*,Boolean inheritMembers = false*/) {

            $checkSealed(constructor, derivedConstructor);

            var inheritMembers = arguments[2] || false, linkedName = '_type_' + derivedConstructor.toString() + '_^_' + constructor.toString(),
                isInstance = $isNewObject(constructor);

            if (!($subclass.linker[linkedName] && $subclass.linker[linkedName].constructor === constructor)) {

                //Note weather or not the derivedConstructor inherits the members of the base
                derivedConstructor.$inheritsMembers = inheritMembers;

                if (constructor.$abstract && !derivedConstructor) abstractConstructor(constructor);

                var surrogateConstructor = $subclass.linker['_ctor_' + linkedName + '_^_SurrogateConstructor'] = function () { return constructor.apply ? constructor.apply(derivedConstructor) : undefined; }

                //Todo
                //Check for Disposable and implement unload?

                surrogateConstructor.prototype = derivedConstructor.prototype;

                var prototypeObject = $subclass.linker[linkedName] = new surrogateConstructor();
                prototypeObject.constructor = constructor;

                constructor.prototype = prototypeObject;
            }

            $cleanPrototype(derivedConstructor);

            //Copy members if indicted
            if (inheritMembers && isInstance && derivedConstructor.$inheritsMembers === true) for (var p in constructor) {
                //derivedConstructor.prototype.p = constructor.prototype.p; //Copy above
                if (!p === 'prototype') derivedConstructor[p] = constructor[p]; //Copy local                
            }

            //Store __TypeName
            if (typeof derivedConstructor.__TypeName === 'undefined') Object.defineProperty(derivedConstructor, '__TypeName', {
                get: function () { return linkedName; }
            });

            return derivedConstructor;
        }

        //Memory for the pseudo type system
        $subclass.linker = {};

        Export($subclass, window, 'Subclass');

        Security.addSafeScope(Class, 3, $subclass);

        /*<ltIE9>*/
        if (typeof window.addEventListener === 'undefined') {
            if (window.attachEvent && !window.addEventListener) {
                var unloadEvent = function () {
                    window.detachEvent('onunload', unloadEvent);
                    document.head = document.html = document.window = null;
                } .bind(window);
                window.attachEvent('onunload', unloadEvent);
                window.addEventListener = window.attachEvent;
            }
        }

        window.addEventListener('unload', function () {
            //For each type in the linker
            for (var t in $subclass.linker) {
                //If there is a type in the linker with the name t
                if ($subclass.linker.hasOwnProperty(t)) {
                    //If the t is a constructor
                    if (!$subclass.linker[t] instanceof Function || typeof $subclass.linker[t] === 'function') {
                        //Buffer
                        var z = $subclass.linker[t];
                        //Enumerate constructor (looking for nested exports)
                        for (var T in z) if (z.hasOwnProperty(T)) {
                            $Export.remove($subclass.linker[T]); //Remove the exports to the constructor
                            delete $subclass.linker[T] // Remove the constructor
                            $Export.remove(z[T]); //Remove any exports of the constructor link reference
                            delete z[T]; //Remove the constructor link reference
                        }
                        //Remove the exports
                        $Export.remove(z);
                        //Delete the link
                        delete z;
                    }
                    //Remove the exports
                    $Export.remove($subclass.linker[t]);
                    //Delete the link
                    delete $subclass.linker[t];
                }
            }
            delete $subclass.linker;
            $subclass = null;

            //Should remove class memory also
            Class = null;
        });

        //The default constructor of the soon to be pseudo Class / Type system
        //The reason this is here is because constructors must return void this we cannot return the apply call to the top of the stack with the defaultConstructor
        function applyInstance(constructor, derivedConstructor) {
            try { $checkSealed(constructor, derivedConstructor); return constructor.apply(derivedConstructor); }
            catch (_) { return new constructor(); }
        }

        //The default constructor of the soon to be pseudo Class / Type system
        function defaultConstructor(instance) {
            instance = instance || this;
            try { applyInstance(instance, instance.$base || Object); }
            catch (_) { throw abstractConstructor(instance); }
        }

        //Make the concept of abstract
        //Possibly should be true so functions cannot be called new on accident
        Object.defineProperty(Function.prototype, 'abstract', {
            //writable: false,
            enumerable: true,
            configurable: false,
            get: function () {
                return this.$abstract || false;
            },
            set: function (value) { return this.$abstract = value; }
        });

        //Pseudo Classes
        var baseClass = defaultConstructor; //(this);
        baseClass.$base = baseClass.constructor = abstractConstructor;
        baseClass.$abstract = true;
        baseClass.toString = function () { return /*'[object Class */'baseClass'/*]'*/; };

        //Export Defined Classes for Unit Tests and make pseudo keyword 'abstract'
        Export(baseClass, window, '$abstract');
        Export(baseClass, window);

        //The Class which represents classes
        //The Mother of All Mother Functions
        //The Constructor of No Contructor
        //All in one line
        //Featuring more comments than code
        //And none of them are even relevant...
        //NOW I JUST HAVE TO FIGURE OUT HOW TO GET CONSTRUCTOR CHAINING TO WORK!!!! UGH!

        //If the base class is abstract return the reference to it otherwise return the reference to the result of $subclass given this instance and the baseClass
        function Class(base) {
            Object.defineProperty(this, '__TypeName', { value: base.__TypeName }); // Ensure the __TypeName is present
            Object.defineProperty(this, 'base', { value: base }); // Ensure the base keyword works in the scope
            $subclass(this, base, $isNewObject(this)); // $subclass all classes

            //Function to return the TypeName member
            //this.GetTypeName = function () { return this.__TypeName; }

            //this.toString = this.GetTypeName;

            CLRObject.apply(this);

            return base.$abstract && typeof (base = base.apply(this)) !== 'undefined' ? base : $subclass(this, base); // Return the base constructor
        }
        Class.toString = function () { return /*'[object */'Class'/*]'*/; };
        Class.cast = Function.prototype.cast;

        //Export Class keyword to the window
        Export(Class, window);

        Security.addSafeScope(Class, 1, Function.prototype.apply);
        Security.addSafeScope(Class, 4, $cast);

        //Method: using
        //Description: Allows using of disposable objects
        function $using(disposable) {
            //If there is no disposable return
            if (!disposable) return;
            //Scope the finalizer
            var finalizer = disposable.Dispose,
                token = new Date().getMilliseconds(),
                earlyCalls = [];

            //Override the Dispose method incase the user calls dispose inside on accident
            disposable.Dispose = function (when) {
                if (when === token) finalizer(true);
                else earlyCalls.push(new Date().getMilliseconds());
            }

            $CollectGarbadge.timeOuts[disposable] = $CollectGarbadge.timeOuts[disposable] || [];
            var handle = $CollectGarbadge.timeOuts[disposable].push(setInterval(function () {
                if (earlyCalls.length === 0 || new Date().getMilliseconds() - token >= $CollectGarbadge.TimeToLive) finalizer(token);
                delete earlyCalls;
                clearInterval($CollectGarbadge.timeOuts[disposable][handle]);
                $CollectGarbadge.timeOuts[disposable].splice(handle, 1); //Remove call in object history
                if ($CollectGarbadge.timeOuts[disposable].length === 0) delete $CollectGarbadge.timeOuts[disposable]; //Remove object from history if there are no more timeouts registered.
            }, (($CollectGarbadge.timeOuts[disposable].length + 1) * 1000))); //Set the timeout for the length of known timeouts + 1 * 1000 (1 Second for the first, 2 for the next etc)

        }

        Export($using, window, 'using');

        //The CLRObject which will be the base class of all classes going forward
        function CLRObject() {
            Class.apply(arguments, this);
            this.toString = function () { return this.__TypeName; }
        }

        CLRObject.prototype.toString = function () { return 'CLRObject'; }

        //Classes for testing

        //Test class which can be instantiated derived from base
        function myClass() {

            //Privates
            var base = Class(baseClass),
                intValue = Number(0),
                stringValue = String('');



            //Publics
            this.valueOf = function () {
                if (this instanceof baseClass) return intValue;
                return stringValue;
            }

            this.cast = $cast;
        }

        myClass.toString = function () { return /*'[object baseClass */'myClass'/*]'*/; };

        //Ensure instanceof works correctly
        $subclass(myClass, baseClass);

        Export(myClass, window);

        //Derived class from myClass
        function anotherClass() {

            //Store the base reference
            var base = new myClass();
            //If you would like the inherited base members to be public then utilize the latter
            //var base = myClass; base.apply(this);

            var myString = 'Test',
                myInt = 1;

            this.valueOf = function () {
                if (this instanceof baseClass) return myInt;
                return myString;
            }

        }

        anotherClass.toString = function () { return /*'[object myClass */'anotherClass'/*]'*/; };

        //Ensure instanceof works correctly
        $subclass(anotherClass, myClass);

        Export(anotherClass, window);

        //This is maybe not the best place
        function $cast(type, call) {
            if (!type) return;
            if (!call) return type.bind(this);
            return call.bind(new type(this)).call(this);
        }

        Export($cast, window, 'cast');

        //Probably not needed
        var $Function$prototype$call = Function.prototype.call;

        //New call function intercept, should never call the abstractConstructor unless from a derived class and this ensures it
        Function.prototype.call = function () { return this.$abstract ? abstractConstructor(this.base || this.constructor || this.prototype || this) : $Function$prototype$call.apply(this, arguments) };

        //Calls the function with named arguments if given using call intercept
        function callWithArguments(/*bind*/) {
            if (arguments.length) {
                var args = [];
                for (var i = 0, e = arguments.length; i < e; ++i)
                    args.push(arguments[i]);
                //args.push(bind ? self : self.bind(bind));
                var actual = new Function(args);
                return actual.call();
            }
        }

        //Reflection
        var Reflection = this.Reflection = (function () { return Reflection; });
        Reflection.prototype = Reflection;
        Reflection.constructor = Reflection;
        Reflection.toString = function () { return 'Reflection'; }
        Reflection.$abstract = true;

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

        function ParameterInfo(/*func*/) {

            // ===============  Private Attributes  =================================================
            var attributes,
            defaultValue,
            isIn, isLcid, isOptional, isOut, isRetval,
            member, metadataToken,
            name, parameterType,
            position, rawDefaultValue;

            // Constructor Logic for a raw string or function
            if (Is(arguments[0], String) || Is(arguments[0], Function)) {
                //We are given a single parameter to lex and return a series of ParameterInfo in a List
                var results = new List(ParameterInfo), //Used to ensure only ParameterInfo[] is returned from this function (encase new ParameterInfo fails)
                inComment = false, //Used for optional
                rawType = undefined, //Used for parameterType
                retVal = false, //Unused as of now
                lookAhead = Lex(arguments[0]), //Get raw declarations
                skipUntilIndex = -1,
                _rawDefaultValue = undefined,
                _defaultValue = undefined;


                //Iterate raw declarations
                lookAhead.forEach(function (/*String*/raw, /*Number*/index) {

                    //Allow look ahead
                    if (index < skipUntilIndex) return;

                    //Check for Type name preceeding parameter
                    for (var t in Types) if (raw === Types[t]) return;

                    //Optional values
                    if (inComment && raw === '=') {
                        _defaultValue = new Function('return' + lookAhead[index + 1])();
                        skipUntilIndex = index + 2;
                    }

                    //Determine if inside a comment (only /**/ style is supported for function arguments
                    inComment = raw.indexOf('*') !== -1 && raw.indexOf('//') !== -1;

                    //Determine retVal
                    retVal = raw.indexOf('ret');

                    //Prepare name
                    raw = raw.replace('*', '');
                    raw = raw.replace('//', '');

                    if (retVal !== -1) {//Default value if ret is preset?
                        skipUntilIndex = index + 2;
                        _rawDefaultValue = raw.subString(retVal, lookAhead[skipUntilIndex++]);
                        raw = raw.replace('return', '');
                        raw = raw.replace('ret', '');
                        retVal = true;
                    } else retVal = false;

                    //Determine values based on matches inter alia
                    if (index < skipUntilIndex) results.Add(new ParameterInfo({
                        position: index,
                        name: raw,
                        parameterType: '', //ToDo with match
                        optional: inComment,
                        isReturn: retVal,
                        rawDefaultValue: _rawDefaultValue
                    }));
                });

                return results.array;

            } else if (Is(arguments[0], Object)) {  // Constructor logic for Object parameters
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
            } else {    // Constructor logic for arguments style            
                //ToDo
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
                get: function () { return name; }
            });

            //Gets the Type of this parameter.
            Object.defineProperty(this, 'ParameterType', {
                get: function () { return parameterType; }
            });

            //Gets the zero-based position of the parameter in the formal parameter list.
            Object.defineProperty(this, 'Position', {
                get: function () { }
            });

            //Gets a value indicating the default value if the parameter has a default value.
            Object.defineProperty(this, 'RawDefaultValue', {
                get: function () { }
            });

            this.toString = function () { return name || position + '_' + parameterType; }

            this.valueOf = function () { return defaultValue; }

        }

        ParameterInfo.toString = function () { return /*'[object Class */'ParameterInfo'/*]'*/; }

        //Possibly should utilize RegEx...
        //Possibly should find hidden arguments
        //Possibly should only find/retrieve arguments of certain type
        //Possibly should find type of returned arguments
        //Possibly should contain ParameterInfo for returned arguments
        Reflection.getArguments = function (func) { return new ParameterInfo(func); }

        Export(Reflection, window, 'Reflection');

        //Function.prototype.getArguments = function () { return Reflection.getArguments(this); }

        //Function.prototype.getExpectedReturnType = function () { /*ToDo*/ }

        Object.seal(Reflection);

        Object.freeze(Reflection);

        return CLRItself;

    })();

} (this, false);