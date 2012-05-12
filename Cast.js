~function (extern) {

    return Function.prototype.cast ? undefined : (function () {

        //Operator Overloading

        //The abstract class constructor
        function abstractConstructor(constructor) { throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + '[' + JSON.stringify(constructor) + ', ' + this.$abstract.toString() + ']'; }

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        //Description: Helps interpreterd code to function correctly after compile with respect to instanceof
        function subclass(constructor, derivedConstructor) {

            var linkedName = derivedConstructor + '_' + constructor;

            if (subclass.linker[linkedName] && subclass.linker[linkedName].constructor === constructor) return derivedConstructor;

            if (constructor.$abstract && !derivedConstructor) abstractConstructor(constructor);

            function surrogateConstructor() { constructor.apply(derivedConstructor); }

            surrogateConstructor.prototype = derivedConstructor.prototype;

            var prototypeObject = new surrogateConstructor();
            prototypeObject.constructor = constructor;

            constructor.prototype = prototypeObject;

            subclass.linker[linkedName] = prototypeObject;

            return derivedConstructor;
        }

        subclass.linker = {};

        window.subclass = subclass;

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

        //The Class which represents classes
        //The Mother of All Mother Functions
        //The Constructor of No Contructor
        //All in one line
        //Featuring more comments than code
        //And none of them are even relevant...
        //NOW I JUST HAVE TO FIGURE OUT HOW TO GET CONSTRUCTOR CHAINING TO WORK!!!! UGH!

        //If the base class is abstract return the reference to it otherwise return the reference to the result of subclass given this instance and the baseClass
        function Class(base) { return base.$abstract ? base : subclass(this, base); }

        window.Class = Class;

        //Classes for testing

        //Test class which can be instantiated derived from base
        var myClass = function () {

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

            this.toString = function () { return /*'[object Class */'baseClass'/*]'*/; };
        }

        //Ensure instanceof works correctly
        subclass(myClass, baseClass);

        //Derived class from myClass
        var anotherClass = function () {

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

            this.toString = function () { return /*'[object Class */'anotherClass'/*]'*/; };

        }

        //This is maybe not the best place
        Function.prototype.cast = function (type, call) {
            if (!type) return;
            if (!call) return type.bind(this);
            return call.bind(new type(this)).call(this);
        }

        //Probably not needed
        Function.prototype._call = Function.prototype.call;

        //New call function intercept
        Function.prototype.call = function () { return this.$abstract ? abstractConstructor(this.base || this.constructor || this.prototype || this) : Function.prototype._call.bind(this)(arguments) };

        //Ensure instanceof works correctly
        subclass(anotherClass, myClass);

        //Export Defined Classes for Unit Tests and make pseudo keyword 'abstract'
        window.baseClass = window.$abstract = baseClass;
        window.myClass = myClass;
        window.anotherClass = anotherClass;


    })();

} (this);