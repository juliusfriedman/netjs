﻿~function (extern, REBUILD_CLR) {

    return (typeof CollectGarbadge === 'undefined' && Boolean(REBUILD_CLR) === true) ? undefined : new (function () {

        //.Net JavaScript (this should be a new scope)
        var newScope = this,

        //Security
        addSafeScope = function (argumentz, expectedCallerDepth, expectedCaller/*,Boolean noVerify = false*/) {
            var noVerify = arguments[3] || false;
            if (noVerify === false) expectedCallerDepth += 2; //Protect against CLR Checks unless noVerify is given
            try { if (noVerify !== false) checkScope(); }
            catch (_) { throw _; }
            if (typeof addSafeScope.registered[expectedCaller] === 'undefined') addSafeScope.registered[expectedCaller] = expectedCallerDepth //This allow patch in and multiple callers
            else addSafeScope.registered[expectedCaller] += expectedCallerDepth;
        }

        addSafeScope.registered = {};

        var checkScope = function () {
            try {
                var stackPointer = undefined,
                cycle = -1;
                //Iterate all registered
                for (var r in addSafeScope.registered) {
                    //If there is a registered caller and it is equal to the expectedCaller then ensure the cyclic depth is also correct
                    if (addSafeScope.registered.hasOwnProperty(r)) {
                        cycle = addSafeScope.registered[r];
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

        //This verification is ugly... the proper way to do this is to have a list of allowed entry points and do a compare on the caller chain to all of the qualified safe entry points
        function $isCLR() {
            try { checkScope(); return true; }
            catch (e) {
                return false;
            }
            return this === newScope;
        }

        //Export $isCLR as isCLR
        Export($isCLR, window, 'isCLR');

        //Checks for CLR Scope
        function $checkCLR() { if (!$isCLR()) throw 'The CLR is required to access this scope'; }

        //Export $checkCLR as checkCLR
        Export($checkCLR, window, 'checkCLR');

        //Backup the old apply function
        var Function$prototype$apply = Function.prototype.apply;

        //Ensures functions cannot operate on CLR Classes unless they are bound in the rules of the CLR
        Function.prototype.apply = function () { $checkCLR(); return Function$prototype$apply; }

        //Object.prototype._constructor = Object.prototype.constructor;

        Object.prototype.constructor = function () { return this === extern ? new Class(Object) : Class({}); }

        if (!Function.prototype.bind) {
            /*<!ES5-bind>*/
            Function.prototype.bind = function (that) {
                var self = this,
			args = arguments.length > 1 ? Array.slice(arguments, 1) : null,
			F = function () { };

                var bound = function () {
                    var context = that, length = arguments.length;
                    if (this instanceof bound) {
                        F.prototype = self.prototype;
                        context = new F;
                    }
                    var result = (!args && !length)
				? self.call(context)
				: self.apply(context, args && length ? args.concat(Array.slice(arguments)) : args || arguments);
                    return context == that ? result : context;
                };
                return bound;
            }
            /*</!ES5-bind>*/
            addSafeScope(Function.prototype.call, 2, Function.prototype.bind);
            addSafeScope(Function.prototype.bind, 2, Function.prototype.apply);
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
                    var result = type.toString().split(' ')[1];
                    result = result.toString().substring(0, result.indexOf('(')); return result;
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
        if (!Object.defineProperty) {
            var descriptorHash = {};

            function legacyGet(object, property, descriptor) {
                return descriptor.value ? descriptor.value.valueOf() :
                descriptor.get ? descriptor.get.bind(object)() : object[property];
            }

            function legacySet(object, property, descriptor, value) {
                if (!descriptor.writeable || (descriptor.enforceType && !(value instanceof descriptor.value))) return;
                object[property] = value;
            }

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
        function $subclass(constructor, derivedConstructor) {

            $checkSealed(constructor, derivedConstructor);

            var linkedName = '_type_' + derivedConstructor.toString() + '_^_' + constructor.toString(),
                isInstance = $isNewObject(constructor);

            if ($subclass.linker[linkedName] && $subclass.linker[linkedName].constructor === constructor) return derivedConstructor;

            if (constructor.$abstract && !derivedConstructor) abstractConstructor(constructor);

            var surrogateConstructor = $subclass.linker['_ctor_' + linkedName + '_^_SurrogateConstructor'] = function () { return constructor.apply ? constructor.apply(derivedConstructor) : undefined; }

            //Todo
            //Check for Disposable and implement unload?

            surrogateConstructor.prototype = derivedConstructor.prototype;

            var prototypeObject = $subclass.linker[linkedName] = new surrogateConstructor();
            prototypeObject.constructor = constructor;

            constructor.prototype = prototypeObject;

            //Store __TypeName if this is not a instance because Class stored the __TypeName for Classes
            if (!isInstance) Object.defineProperty(derivedConstructor, '__TypeName', {
                get: function () { return linkedName; }
            });
            return derivedConstructor;
        }

        //Memory for the pseudo type system
        $subclass.linker = {};

        Export($subclass, window, 'subclass');

        addSafeScope(Class, 3, $subclass);

        if (typeof window.addEventListener === 'undefined') {
            /*<ltIE9>*/
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
            $subclass(this, base); // $subclass all classes

            //Function to return the TypeName member
            //this.GetTypeName = function () { return this.__TypeName; }

            //this.toString = this.GetTypeName;

            CLRObject.apply(this);

            return base.$abstract ? base.apply(this) : $subclass(this, base); // Return the base constructor
        }
        Class.toString = function () { return /*'[object */'Class'/*]'*/; };
        Class.cast = Function.prototype.cast;

        //Export Class keyword to the window
        Export(Class, window);

        addSafeScope(Class, 1, Function.prototype.apply);
        addSafeScope(Class, 4, $cast);

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
            var base = new Class(baseClass),
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

    })();

} (this, false);