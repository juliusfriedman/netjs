//Operator Overloading

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
this.constructor = myClass.apply(this);

var myString = 'Test',
    myInt = 1;

this.valueOf = function () {
    if (this instanceof myClass) return myInt;
    return myString;
}

}


//Tests

var test = new myClass(),
anotherTest = new anotherClass(),
composed = test + anotherTest,
yaComposed = test.cast(Number, function () {
    return this + anotherTest
}),
yaCComposed = anotherTest.cast(Number, function () {
    return this + test;
}),
t = test.cast(anotherClass, function () {
    return this + anotherTest
}),
tt = anotherTest.cast(myClass, function () {
    return this + test;
});

debugger;