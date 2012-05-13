~function (extern, REBUILD_CLR) {

    return Function.prototype.cast && !REBUILD_CLR ? undefined : (function () {

        //.Net JavaScript

        function $Export(what, where, as) {
            if (!what && !where) return;
            as = as || what;
            $Export.exported[as] = where;
            where[as] = what;
        }

        $Export.exported = {};

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

        //Export $Export to the window as export
        $Export($Export, window, '$export');

        function legacyGet(object, property, descriptor) {
            //Scan caller for loop constrcturs and return based on descriptor.enumerble
        }

        function legacySet(object, property, descriptor, value) {
            //Scan caller for and return bas on descriptor.writeable
            if (!descriptor.writeable) return;
            object[property] = value;
        }

        //Polyfill for defineProperty
        if (!Object.defineProperty) {
            //Adds a property to an object with getter, setter and descriptor support
            function defineProperty(object, name, descriptor) {
                if (!object || !name) return;
                descriptor = {
                    enumerable: descriptor.enumerable || false,
                    writeable: descriptor.writeable || false,
                    configurable: descriptor.configurable || false,
                    value: descriptor.value || null,
                    get: descriptor.get ? descriptor.get : function () { return legacyGet(this, name, descriptor); } .bind(object),
                    set: descriptor.set ? descriptor.set : descriptor.writable ? function (value) { return legacySet(this, name, descriptor, value); } .bind(object) : function () { }
                }
                if (Object.defineProperty) return Object.defineProperty(object, name, descriptor);
                else {
                    //Assign property
                    object[name] = descriptor.value;

                    //Create getter
                    if (descript.get) object['get_' + name] = descriptor.get;
                    //else object['get_' + name] = function () { return legacyGet(this, name, descriptor); } //legacyGet.apply([this, name, descriptor], this);

                    //Create setter
                    if (descriptor.set) object['set_' + name] = descriptor.set;
                    //else object['set_' + name] = function (value) { return legacySet(this, name, descriptor, value); } //legacySet.apply([this, name, descriptor, undefined], this);
                }
            }

            //Augment Object
            Object.defineProperty = defineProperty;
        }

        //The abstract class constructor
        function abstractConstructor(constructor) { throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + '[' + JSON.stringify(constructor) + ', ' + this.$abstract.toString() + ']'; }

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        //Description: Helps interpreterd code to function correctly after compile with respect to instanceof
        function subclass(constructor, derivedConstructor) {

            var linkedName = '_type_' + derivedConstructor.toString() + '_^_' + constructor.toString();

            if (subclass.linker[linkedName] && subclass.linker[linkedName].constructor === constructor) return derivedConstructor;

            if (constructor.$abstract && !derivedConstructor) abstractConstructor(constructor);

            var surrogateConstructor = subclass.linker['_ctor_' + linkedName + '_^_SurrogateConstructor'] = function () { constructor.apply(derivedConstructor); }

            //Todo
            //Check for Disposable and implement unload?

            surrogateConstructor.prototype = derivedConstructor.prototype;

            var prototypeObject = subclass.linker[linkedName] = new surrogateConstructor();
            prototypeObject.constructor = constructor;

            constructor.prototype = prototypeObject;

            //Store __TypeName
            Object.defineProperty(derivedConstructor, '__TypeName', {
                get: function () { return linkedName; }
            });
            return derivedConstructor;
        }

        //Memory for the pseudo type system
        subclass.linker = {};

        $Export(subclass, window, 'subclass');

        window.addEventListener('unload', function () {
            //For each type in the linker
            for (var t in subclass.linker) {
                //If there is a type in the linker with the name t
                if (subclass.linker.hasOwnProperty(t)) {
                    //If the t is a constructor
                    if (!subclass.linker[t] instanceof Function || typeof subclass.linker[t] === 'function') {
                        //Buffer
                        var z = subclass.linker[t];
                        //Enumerate constructor (looking for nested exports)
                        for (var T in z) if (z.hasOwnProperty(T)) {
                            $Export.remove(subclass.linker[T]); //Remove the exports to the constructor
                            delete subclass.linker[T] // Remove the constructor
                            delete z[T]; //Remove the constructor link reference
                        }

                        //Remove the exports
                        $Export.remove(z);
                        //Delete the link
                        delete z;
                    }
                    //Remove the exports
                    $Export.remove(subclass.linker[t]);
                    //Delete the link
                    delete subclass.linker[t];
                }
            }
            delete subclass.linker;
            subclass = null;

            //Should remove class memory also
            Class = null;
        });

        //The default constructor of the soon to be pseudo Class / Type system
        //The reason this is here is because constructors must return void this we cannot return the apply call to the top of the stack with the defaultConstructor
        function applyInstance(constructor, derivedConstructor) {
            try { return constructor.apply(derivedConstructor); }
            catch (_) { return new constructor(); }
        }

        //The default constructor of the soon to be pseudo Class / Type system
        function defaultConstructor(instance) {
            instance = instance || this;
            try { applyInstance(instance, instance.$base || Object); }
            catch (ex) { throw abstractConstructor(instance); }
        }

        //Make the concept of abstract
        //Possibly should be true so functions cannot be called new on accident
        if (Object.definePropety) {
            Object.definePropety(Function.prototype, 'abstract', {
                writable: true,
                enumerable: true,
                configurable: true,
                get: function () {
                    return this.$abstract || false;
                },
                set: function (value) { return this.$abstract = value; }
            });
        } else Function.prototype.$abstract = false;

        //Pseudo Classes
        var baseClass = defaultConstructor; //(this);
        baseClass.$base = baseClass.constructor = abstractConstructor;
        baseClass.$abstract = true;
        baseClass.toString = function () { return /*'[object Class */'baseClass'/*]'*/; };

        //Export Defined Classes for Unit Tests and make pseudo keyword 'abstract'
        $Export(baseClass, window, '$abstract');
        $Export(baseClass, window);

        //The Class which represents classes
        //The Mother of All Mother Functions
        //The Constructor of No Contructor
        //All in one line
        //Featuring more comments than code
        //And none of them are even relevant...
        //NOW I JUST HAVE TO FIGURE OUT HOW TO GET CONSTRUCTOR CHAINING TO WORK!!!! UGH!

        //If the base class is abstract return the reference to it otherwise return the reference to the result of subclass given this instance and the baseClass
        function Class(base) { return base.$abstract ? base : subclass(this, base); }
        Class.toString = function () { return /*'[object */'Class'/*]'*/; };
        Class.cast = Function.prototype.cast;

        $Export(Class, window);

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

            this.cast = Function.prototype.cast;
        }

        myClass.toString = function () { return /*'[object baseClass */'myClass'/*]'*/; };

        //Ensure instanceof works correctly
        subclass(myClass, baseClass);

        $Export(myClass, window);

        //Derived class from myClass
        function anotherClass() {

            //Store the base reference
            var base = myClass;
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
        subclass(anotherClass, myClass);

        $Export(anotherClass, window);

        //This is maybe not the best place
        Function.prototype.cast = function (type, call) {
            if (!type) return;
            if (!call) return type.bind(this);
            return call.bind(new type(this)).call(this);
        }

        //Probably not needed
        Function.prototype._call = Function.prototype.call;

        //New call function intercept, should never call the abstractConstructor unless from a derived class and this ensures it
        Function.prototype.call = function () { return this.$abstract ? abstractConstructor(this.base || this.constructor || this.prototype || this) : Function.prototype._call.apply(this, arguments) };

    })();

} (this, false);