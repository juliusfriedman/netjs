﻿/*******************************************************************************************
Title:  Javascript Generic List Implementation
Description:  An implementation of a Generic List with LINQ support (based off .NET).
Author:  Julius Friedman / Shawn Lawsure
Usage Example:

function Car(make, model)
{
this.make = make;
this.model = model;
}

var myList = new List();
myList.Add(new Car("Honda", "Civic"));
myList.Add(new Car("Nissan", "Sentra"));
myList.Add(new Car("Honda", "Cr-V"));
myList.Add(new Car("Honda", "Cr-V"));

//Where all of the following are equivalent
var selList = myList.Where("make == 'Honda'").OrderByDescending("model").Distinct();
var anotherList = myList.Where(function(){ this.make == 'Honda'}).OrderByDescending("model").Distinct();
var yetAnotherList = myList.Where(function(c){ c.make == 'Honda'}).OrderByDescending("model").Distinct();
var finalList = myList.Where(function(){ make == 'Honda'}).OrderByDescending("model").Distinct();
         
*********************************************************************************************/

/*namespace GenericList*/(function () {

    // ===============  Static Members  =================================================

    var $List$Created = -1, // Id counter used to identify each List instance.
        $List$Instances = {}, // Storage for each instance which has yet to be disposed.        

    // ===============  Private Methods  ====================================================
    //These methods will not be seen in a call of toString on the List constructor
    
    //Destructor Logic
    $List$Dispose = (function (who, disposing) {
        try {

            //Ensure who is a List instance
            if (typeof who === 'number') who = $List$Instances[who];

            //Determine if event was called
            disposing = disposing || this === window;

            //Remove instance from Type storage
            $List$Instances[who.$key] = null;
            delete $List$Instances[who.$key];

            //Dispose Type in a closure
            if (disposing && Object.keys($List$Instances).length === 0) {
                //Anonymously
                (function () {
                    //set a timeout for 0 seconds to dispose the List Type
                    setTimeout((function () {
                        List = null;
                        return delete List;
                    }), 0);
                })();
            }

        } catch (E) { }
    });

    // Method:  $Validate
    // Description:  Make sure that all objects added to the List are of the same type.
    function $Validate(list, object) {
        //If we have not yet determined a type it is determined by the first object added
        if (!list.$type) return;
        else if (object.constructor !== list.$type && !object.constructor instanceof list.$type)
            throw "Only one object type is allowed in a list";
    }

    // Method:  $Select
    // Description:  Return a copy of this List object with only the elements that meet the criteria
    //               as defined by the 'query' parameter.
    // Usage Example:  
    //              var selList = $Select(this,"make == 'Honda'").
    //              var anotherList = $Select(this,function(){ return this.make === 'Honda' });
    //              var yetAnotherList = $Select(this,function(c){ return c.make === 'Honda' });
    function $Select(list, query) {
        if (!query) return this;
        var bind = (query instanceof Function) && query.toString().indexOf('this') !== -1,
            pass = !bind && typeof query !== 'string';
        selectList = new List();
        //possibly need to bind query on this if query instanceof function
        list.array.forEach(function (tEl) {
            var result = undefined;
            if (bind) result = (query.bind(tEl)());
            else if (pass) {
                try { result = (query(tEl)); }
                catch (e) {
                    try { with (tEl) result = (query(tEl)); }
                    catch (e) { result = false; }
                }
            }
            else with (tEl) result = eval(query);
            if (result) selectList.Add(tEl);
        });
        return selectList;
    }

    // Method:  $GenericSort
    // Description:  Sort comparison function using an object property name.  Pass this function to
    //               the Javascript sort function to sort the list by a given property name.
    // Usage Example:
    //              var sortedList = listArray.sort($GenericSort('model'));
    function $GenericSort(property) {
        return function (a, b) {
            return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        }
    }

    //Array like Getter/Setter Logic, creates a getter for the List to access the inner array at the given index
    $CreateGetterSetter = function (list, index) {
        if (Object.defineProperty) {
            Object.defineProperty(list, index, {
                //writable: true, // True if and only if the value associated with the property may be changed. (data descriptors only). Defaults to false.
                //enumerable: true, // true if and only if this property shows up during enumeration of the properties on the corresponding object. Defaults to false.
                //configurable: true, // true if and only if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object. Defaults to false.
                get: function () {
                    if (index < 0 || index > list.array.length) throw "index parameter out of range in List.Get";
                    return list.array[index];
                },
                set: function (value) {
                    if (index < 0 || index > list.array.length) throw "index parameter out of range in List.Set";
                    $Validate(list, value);
                    //if (!(value instanceof list.$type)) throw "Only one object type is allowed in a list";
                    list.array[index] = value;
                }
            });
        } else {
            list[index] = list.array[index];
        }
    }

    //We have not defined properties on the prototype yet
    $DefinedProperties = false;

    // Method: Constructor
    // Description: Returns a new List instance based on the given parameters.
    function List(/*type, array*/) {

        // ===============  Private Attributes  =================================================

        var key = ++$List$Created,  // Identify each List instance with an incremented Id.
        oType = undefined,      // Used to ensure that all objects added to the list are of the same type.
        $containsLastResult = undefined, //Storage pointer for the last result of Contains call
        listArray = [];         // Stores all the list data.
        $List$Instances[key] = this; // Store instance with key        

        // ===============  Public Properties  =================================================

        //If supported define public properties on the List instance being created
        if (Object.defineProperty && !$DefinedProperties) {

            //We have defined the properties after the first class has been instantiated
            $DefinedProperties = true;

            // Property: array
            // Description: Gets or Sets in Native inner array utilized by the List for storage. The elements contained must be of the same type in which this List instance was created with.
            Object.defineProperty(List.prototype, 'array',
           {
               // writable: false, // True if and only if the value associated with the property may be changed. (data descriptors only). Defaults to false.
               enumerable: true, // true if and only if this property shows up during enumeration of the properties on the corresponding object. Defaults to false.
               configurable: true, // true if and only if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object. Defaults to false.
               get: function () {
                   return listArray;
               },
               set: function (value) {
                   //Ensure Array
                   if (value instanceof Array) {
                       //Ensure length
                       if (value.length) {
                           //Ensure types
                           value.forEach(function (v) { if (v.constructor !== oType) throw "Only one object type is allowed in a list"; });
                       }
                       //Set member
                       listArray = value;
                   }
               }
           });

            // Property: $key
            // Description: Gets the machine key which identifies this List instance in the memory of all created List instances.
            Object.defineProperty(List.prototype, '$key',
           {
               configurable: true,
               get: function () {
                   return key;
               }
           });

            // Property: $key
            // Description: Gets the constructor or type in which this List was created with
            Object.defineProperty(List.prototype, '$type',
           {
               enumerable: true,
               configurable: true,
               get: function () {
                   return oType;
               }
           });

            //Inline the getter creation (65535 crashes IE9)
            //What I am doing here is defining the getters so Array Like access works before we freeze the Object
            //The alternative would be to not freeze the object and Augment it on Insert or Add
            //The other option would be to implement Capacity and when the List resizes define new getters.
            //This will only be until we have Proxy, then we can even seal this Instance and referece the proxy.
            for (var i = 0; i < 1000; ++i) $CreateGetterSetter(List.prototype, i);

        } else if (!$DefinedProperties) {
            this.$type = oType;         // Compatibility
            this.array = listArray;
            this.$key = key;
        }        

        // ===============  Public Methods  ======================================================

        // Method:  Add
        // Description:  Add an element to the end of the list.
        this.Add = function (object) {
            if (!oType) oType = object.constructor;
            $Validate(this, object);
            listArray.push(object);
            //$CreateGetterSetter(this, listArray.length - 1);
            return this;
        }

        // Method:  AddRange
        // Description:  Adds each of the elements in the given Array or List to this List instance
        this.AddRange = function (arrayOrList) {
            if (!arrayOrList) return;
            if (arrayOrList instanceof List) arrayOrList = arrayOrList.array;
            try {
                arrayOrList.forEach(function (tEl) {
                    this.Add(tEl);
                }, this);
            } catch (e) { throw e; }
            return this;
        }

        // Method:  Clear
        // Description:  Removes all elements from this List instance
        this.Clear = function () { listArray = []; return this; }

        // Method:  CopyTo
        // Description:  Adds all elemets in this List to the given array, List or Object. Returns the source
        this.CopyTo = function (source) {
            if (!source) return;
            if (source instanceof List) {
                listArray.forEach(function (tEl) {
                    source.Add(tEl);
                });
            } else if (source instanceof Array) {
                listArray.forEach(function (tEl) {
                    source.push(tEl);
                });
            } else {
                listArray.forEach(function (tEl) {
                    source[tEl.toString()] = tEl;
                });
            }
            return source;
        }

        // Method:  Insert
        // Description:  Inserts an element into the List at the specified index (where).
        // Insert and InsertRange are the same physcially. (They alias eachother)
        this.InsertRange = this.Insert = function (where, what) {
            if (where < 0 || where >= listArray.length) throw "Invalid index parameter in call to List.Insert (arguments[0] = '" + where + "')";
            if (!what) return this;
            try {
                if (what.length) {
                    if (!oType) oType = what[0].constructor;
                    what.forEach(function (tEl) {
                        $Validate(this, tEl);
                    }, this);
                } else {
                    if (!oType) oType = what.constructor;
                    $Validate(this, what);
                }
                listArray.splice(where, 0, what);
            } catch (e) { throw e; }
            //$CreateGetterSetter(this, where);
            return this;
        }

        // Method:  Sort
        // Description:  Sorts the elements in the entire List using the specified comparer or $GenericSort
        this.Sort = function (comparer) {
            comparer = comparer || $GenericSort;
            try { listArray.sort(comparer); }
            catch (e) { throw e; }
            return this;
        }

        // Method:  All
        // Description:  returns true if all elements in the List match the given query
        this.All = function (query) { return query ? this.Count() === this.Where(query).Count() : false; }

        // Method:  Remove
        // Description:  Removes occurrences of a specific object from the List or a given amount.
        this.Remove = function (what/*, all, where, howMany */) {
            //Determine arguments for logic
            var all = arguments[1] || false,
            where = arguments[2] || undefined,
            howMany = arguments[3] || 1,
            results = new List();
            //Determine branch
            if (where < 0 || where >= listArray.length) throw "Invalid index parameter in call to List.Remove (arguments[3] = '" + where + "')";
            if (!where && this.Contains(what)) {
                try { results.AddRange(listArray.splice($containsLastResult, howMany)); delete this[where]; }
                catch (e) { throw e; }
            }
            else if (where) {
                try { results.AddRange(listArray.splice(where, howMany)); delete this[where]; }
                catch (e) { throw e; }
            }
            if (all && this.Contains(what)) {
                try { results.AddRange(this.Remove(undefined, undefined, $containsLastResult)); }
                catch (E) { throw e; }
            }
            return results;
        }

        // Method:  RemoveAt
        // Description:  Removes the element at the specified index. Returns the list if nothing is removed or the removed items.
        this.RemoveAt = function (index) {
            if (!index) return this;
            return this.Remove(undefined, undefined, index, 1);
        }

        // Method:  RemoveRange
        // Description:  Removes a range of elements from the List starting at the given index count || 1 time(s). Returns the List if nothing is removed or the removed items.
        this.RemoveRange = function (index, count) {
            if (!index) return this;
            return this.Remove(undefined, undefined, index, count || 1);
        }

        // Method:  RemoveAll
        // Description:  Removes all the elements that match the conditions defined by the specified predicate. Returns the List if nothing is removed or the removed items.
        this.RemoveAll = function (query) {
            if (!query) return this;
            //Run Where with the query to get results then pass the resulting List to ForEach on this instances Remove function
            return this.Where(query).ForEach(this.Remove);
        }

        // Method:  ElementAt
        // Description:  Get the element at a specific index in the list.
        this.ElementAt = function (index) {
            if (index >= listArray.length || index < 0) throw "Invalid index parameter in call to List.ElementAt";
            return listArray[index];
        }

        // Method:  Where
        // Description:  Return a copy of this List object with only the elements that meet the criteria
        //               as defined by the 'query' parameter.
        this.Where = function (query) { return query ? $Select(this, query) : null; }

        // Method:  FirstOrDefault
        // Description:  Return the first object in the list that meets the 'query' criteria or null if no objects are found.        
        this.FirstOrDefault = function (query/*, last*/) {
            var list = $Select(this, query),
            last = arguments[1] || false;
            return list ? list.ElementAt(last ? listArray.length - 1 : 0) : null;
        }

        // Method:  Count
        // Description:  Return the number of elements in the list or optionally the number of elements which are equal to the object given
        this.Count = function (what) {
            if (!what) return listArray.length;
            else {
                var count = 0;
                listArray.forEach(function (el) { if (el === what) ++count; });
                return count;
            }
        }

        //Method: Reverse
        //Description: Reverses the list starting at the given index || 0 count times.
        this.Reverse = function (index, count) {
            index = index || 0;
            count = count || listArray.length - 1;

            if (index < 0 || count >= listArray.length) throw "Invalid index or count parameter in call to List.Reverse";

            for (; count > index; ++index, --count) {
                var temp = listArray[index];
                listArray[index] = listArray[count];
                listArray[count] = temp;
            }

            return;
        }

        //Method: ToArray
        //Description: Copies the elements of the List to a new array.
        this.ToArray = function () { return Array(listArray); }

        // Method:  OrderBy
        // Description:  Order (ascending) the objects in the list by the given object property name.
        this.OrderBy = function (property/*, desc*/) {
            //Make the list and the interval array
            var l = new List(listArray.slice(0).sort($GenericSort(property))),
            //Determine if we need to reverse
            desc = arguments[1] || false;
            if (desc) l.Reverse();
            //return
            return l;
        }

        // Method:  OrderByDescending
        // Description:  Order (descending) the objects in the list by the given object property name.
        this.OrderByDescending = function (property) { return property ? this.OrderBy(property, true) : null; }

        // Method: Contains
        // Description: Determines if the given object is contained in the List. sets the private $containsLastResult to the index found for the given object.
        this.Contains = function (object, start) {
            if (!object) return false;
            var contained = false,
            keys = Object.keys(object);
            start = start || 0;
            //Iterate list
            listArray.forEach(function (tEl) {
                //Iterate keys
                keys.forEach(function (key, index) {
                    if (index < start) return;
                    //Try to ascertain equality
                    try {
                        //contained is equal to the expression of tEl[key] being exactly equal to object[key]'s value
                        if (contained = (tEl[key] === object[key])) $containsLastResult = index; //Store the last index if contained
                        else $containsLastResult = -1;
                    } catch (e) { contained = false; $containsLastResult = -1; }
                });
            });
            return contained;
        }

        // Method:  IndexOf
        // Description:  Returns the index of the specified element in this List or -1 if not found
        this.IndexOf = function (what, start) {
            if (!what) return -1;
            else if (start < 0) throw "Invalid start paramater given in List.IndexOf";
            try { return this.Contains(what, start || 0) ? $containsLastResult : -1; }
            catch (e) { return -1; }
        }

        // Method:  LastIndexOf
        // Description:  Returns the last index of the specified element in this List or -1 if not found
        this.LastIndexOf = function (what, start, end) {
            var lastIndex = -1;
            if (!what) return lastIndex;
            start = start || 0;
            end = end || listArray.length;
            if (start < 0 || end >= listArray.length) throw "Invalid start or end parameter in call to List.LastIndexOf";
            while (this.Contains(what, start++) && start < end) lastIndex = $containsLastResult;
            return lastIndex;
        }

        // Method: Distinct
        // Description: Gets a copy of the list with only unique elements.
        this.Distinct = function () {
            var results = new List();
            try {
                //this.ForEach(function (tEl) { if (!results.Contains(tEl)) results.Add(tEl); });
                //Equivelant to the following except the below is native 
                listArray.forEach(function (tEl) { if (!results.Contains(tEl)) results.Add(tEl); });
            } catch (E) { }
            return results;
        }

        // Method: ForEach
        // Description: Calls the given query on each element of the List
        this.ForEach = function (query, start, end) {
            if (!query) return;
            start = start || 0;
            end = end || listArray.length - 1;
            if (start < 0 || end >= listArray.length) throw "Invalid start or end parameter in call to List.ForEach";
            listArray.forEach(function (tEl, index) {
                if (start > index || end < index) return;
                with (tEl) query();
            });
        }

        // Method: TrueForAll
        // Description: etermines whether every element in the List matches the conditions defined by the specified predicate.
        this.TrueForAll = function (query) { return listArray.length === this.Where(query).Count(); }

        // Extension Methods

        // Method:  First
        // Description:  returns the first element in the List or null if nothing is contained
        this.First = function () { return listArray.length ? listArray[0] : null; }

        // Method:  Last
        // Description:  returns the last element in the List or null if nothing is contained
        this.Last = function () { return listArray.length ? listArray[listArray.length - 1] : null; }

        // Method:  Any
        // Description:  returns true on the first element in the List which meets the given query.
        this.Any = function (query) {
            var result = Boolean(query);
            if (!result) return false;
            result = false;
            try {
                listArray.forEach(function (tEl) {
                    with (tEl)
                        if (query()) {
                            result = true;
                            throw new Error();
                        }
                });
            } catch (E) { }
            return result;
        }

        // Method:  LastOrDefault
        // Description:  Return the last object in the list that meets the 'query' criteria or null if no objects are found.
        this.LastOrDefault = function (query) { return query ? this.FirstOrDefault(query, true) : null; }

        // Method:  Single
        // Description:  Returns the first object in the list that meets the 'query' criteria or null if no objects are found.
        this.Single = function (query) { return query ? this.FirstOrDefault(query) : null; }

        // Method:  Single
        // Description:  Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements. The element's index is used in the logic of the predicate function.
        this.SkipWhile = function (query, start) {
            if (!query) return this;
            start = start || 0;
            if (start < 0 || start >= listArray.length) throw "Invalid start parameter in call to List.SkipWhile";
            var results = new List();
            listArray.forEach(function (tEl, index) {
                if (index < start) return;
                with (tEl) if (!query()) results.Add(tEl);
            });
            return results;
        }

        //Copy constructor (utilized if first parameter in constructor is a List instance
        if (arguments[0] && arguments[0] instanceof List) {
            oType = arguments[0].$type; // Set the type of the List from the given
            listArray = arguments[0].array; // Set the inner array of the List from the given
        } else if (arguments[0] && arguments[0].length) { //If there is a type given it may be contained in an array which is to be used as the interal array..       
            try {
                oType = arguments[0][0].constructor; // Set type of the List from the first element in the given array
                arguments[1] = arguments[1] || arguments[0]; // Make a new argument incase one is not given which should be the array given. This will be used after AddRange is constructed to verify each given item complies with the List logic.
            } catch (e) { }
        };

        //If there is an array given then each member of the array must be added and verified
        if (arguments[1] && arguments[1].length) {
            try {
                this.AddRange(arguments[1]);
            } catch (e) { throw e; }
        }

        //Cleanup instance prototype
        for (var p in this) if (!this.hasOwnProperty(p)) delete this.p;

        //Add event for destructor in executed closure
        window.addEventListener('unload', function (self) { $List$Dispose(self, true); } (this));

        //freeze new instance
        return Object.freeze(this);

    }

    // Method: indexOf
    // Description: adds logic to retrieve the index of an element from an array if present, otherwise -1
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt /*, from*/) {
            var len = this.length,
            from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0) from += len;
            for (; from < len; from++)
                if (from in this && this[from] === elt)
                    return from;
            return -1;
        };
    }

    // Method: forEach
    // Description: Allows you to provide a function and optional binding to invoke on each member of the array
    // -- Borrowed from MooTools --
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fn, bind) {
            for (var i = 0, l = this.length; i < l; ++i) {
                if (i in this) fn.call(bind, this[i], i, this);
            }
        }
    }

    // Method: forEach
    // Description: Allows you to provide a function and optional binding to invoke on each member of the array
    if (!Object.keys) {
        Object.keys = function (that) {
            var results = [];
            for (var p in that)
                if (that.hasOwnProperty(p))
                    results.push(that.p);
            return results;
        };
    }

    // Method: freeze
    // Description: Does nothing since it requires runtime support or modification of apply which can hinder legacy code
    if (!Object.freeze) {
        Object.freeze = function (object) { };
    }

    //Export and Freeze List to the window namespace
    Object.freeze(window.List = List);

})();