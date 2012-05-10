﻿~function (extern) {

    return Function.prototype.cast ? undefined : (function () {

        //Operator Overloading
        function abstractError(constructor) { throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + constructor; }

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        //Description: Helps interpreterd code to function correctly after compile with respect to instanceof
        function subclass(constructor, derivedConstructor) {

            //Possibly should augment derived to ensure it is not subclassed on accident again

            if (constructor.abstract && !derivedConstructor) abstractError(constructor);

            function surrogateConstructor() { constructor.apply(derivedConstructor); }

            surrogateConstructor.prototype = derivedConstructor.prototype;

            var prototypeObject = new surrogateConstructor();
            prototypeObject.constructor = constructor;

            constructor.prototype = prototypeObject;

            return derivedConstructor;
        }

        //Make the concept of abstract
        //Possibly should be true so functions cannot be called new on accident
        if (Object.definePropety) {
            Object.definePropety(Function.prototype, 'abstract', {
                writable: true,
                enumerable: true,
                configurable: true,
                get: function () {
                    return this.abstract || false;
                },
                set: function (value) { return this.abstract = value; }
            });
        } else Function.prototype.abstract = false;

        //Classes for testing
        var baseClass = abstractError; //(this);
        baseClass.abstract = true;

        //Test class which can be instantiated derived from base
        var myClass = function () {

            //Privates
            var base = baseClass,
                intValue = Number(0),
                stringValue = String('');

            //Publics
            this.valueOf = function () {
                if (this instanceof myClass) return intValue;
                return stringValue;
            }

            this.cast = Function.prototype.cast;

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
                if (this instanceof myClass) return myInt;
                return myString;
            }

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
        Function.prototype.call = function () { return this.abstract ? abstractError(this.base || this.constructor || this.prototype || this) : Function.prototype._call.bind(this)(arguments) };

        //Ensure instanceof works correctly
        subclass(anotherClass, myClass);

        //Export Defined Classes for Unit Tests
        window.baseClass = baseClass;
        window.myClass = myClass;
        window.anotherClass = anotherClass;


    })();

} (this);