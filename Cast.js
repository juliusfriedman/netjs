~function (extern) {

    return Function.prototype.cast ? undefined : (function () {

        //Operator Overloading

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        function subclass(constructor, derivedConstructor) {

            //Possibly should augment derived to ensure it is not subclassed on accident again

            if (constructor.abstract && !derivedConstructor) throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + constructor;

            function surrogateConstructor() { constructor.apply(derivedConstructor); }

            surrogateConstructor.prototype = derivedConstructor.prototype;

            var prototypeObject = new surrogateConstructor();
            prototypeObject.constructor = constructor;

            constructor.prototype = prototypeObject;

            return derivedConstructor;
        }

        //Make the concept of abstract
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

        var myClass = function () {

            //Privates
            var intValue = Number(0),
                stringValue = String('');

            //Publics
            this.valueOf = function () {
                if (this instanceof myClass) return intValue;
                return stringValue;
            }

            this.cast = function (type, call) {
                if (!type) return;
                if (!call) return type.bind(this);
                return call.bind(new type(this)).call(this);
            }

        }

        //Derived class
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

        //Ensure instanceof works correctly
        subclass(anotherClass, myClass);

        //Export Defined Classes for Unit Tests
        window.myClass = myClass;
        window.anotherClass = anotherClass;


    })();

} (this);