/*******************************************************************************************
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

    // ===============  LINQ Utilities (Private)  =================================================

    function $IsLambda(clause) { return (clause.toString().indexOf("=>") > -1); }

    // This piece of "handling" C#-style Lambda expression was borrowed from:
    // linq.js - LINQ for JavaScript Library - http://jslinq.codeplex.com
    // THANK!!
    function $ProcessLambda(clause) {
        if ($IsLambda(clause)) {
            var expr = clause.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);
            expr[2] = expr[2].replace('select', '');
            return new Function(expr[1], "return (" + expr[2] + ")");
        }
        return clause;
    }

    // Method:  $Select
    // Description:  Return a copy of this List object with only the elements that meet the criteria
    //               as defined by the 'query' parameter.
    // Usage Example:  
    //              var selList = $Select(this,"make == 'Honda'").
    //              var anotherList = $Select(this,function(){ return this.make === 'Honda' });
    //              var yetAnotherList = $Select(this,function(c){ return c.make === 'Honda' });
    //              var  anotherStringForm = myList.Where("(c) => c.make == 'Nissan' ? new Car('Acura', 'TL') : Car.$default");
    //              var  yetAnotherForm = myList.Where(function (c) { return c.make == 'Nissan' ? new Car('Acura', 'TL') : Car.$default });
    function $Select(list, query) {
        if (!query) return this;
        var bind = (query instanceof Function) && query.toString().indexOf('this') !== -1,
            pass = !bind && typeof query !== 'string',
            lambda = $IsLambda(query);
        selectList = new List();
        //possibly need to bind query on this if query instanceof function
        list.array.forEach(function (tEl) {
            var result = undefined;
            try {
                result = !lambda && bind ? //Bind the query if there is no lambda
                    (query.bind(tEl)()) :
                        !lambda && pass ? (query(tEl)) : //Pass the element to the query if there is no lambda
                            lambda ? $ProcessLambda(query).apply(tEl, [tEl]) : //Process the lambda if present
                                (new Function('_', 'with(_) return (' + query + ')')(tEl)); //Fallback to with method
            }
            catch (_) { result = false; }
            //If there is a result add it by determining if there was a lambda or the result is an instance of the list type.
            if (result) selectList.Add(lambda || result instanceof list.$type ? result : tEl);
        });
        return selectList;
    }

    // Method:  $Default
    // Description:  Returns the default value for the list
    function $Default(list) {
        try { return '$default' in list.$type ? list.$type.$default : new list.$type(); } // Try to return the default of the type stored in the List or the result of a newly created type of the List type.
        catch (_) { return null; } // Return null if the default value cannot be found for the or type cannot be created.
    }

    //Alias export
    window.Default = window.$Default = window.$default = $default = $Default;


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

    // ===============  Static Members  =================================================

    var $List$Created = -1, // Id counter used to identify each List instance.
        $List$Instances = {}; // Storage for each instance which has yet to be disposed.        

    // ===============  Private Methods  ====================================================
    //These methods will not be seen in a call of toString on the List constructor    

    //Destructor Logic
    function $List$Dispose(who, disposing) {
        try {

            if (typeof who === 'number') who = $List$Instances[who];
            //Ensure who is a List instance
            if (!who) return;

            //Empty inner array
            who.Clear();

            //Determine if event was called
            disposing = disposing || this === window;

            //Remove instance from Type storage
            $List$Instances[who.$key] = null;
            delete $List$Instances[who.$key];
            who = null;
            delete who;

            //If we are disposing then check for all instances to be disposed and remove the type
            if (disposing && Object.keys($List$Instances).length === 0) {
                //Remove exports
                window.export.remove(List);
                List = null;
                $List$Created = null;
                $List$Instances = null;
                $CreateGetterSetter = null;
                $Select = null;
                $Validate = null;
                $Default = null;
                $List$Dispose = null;
                $IsLambda = null;
                $ProcessLambda = null;
            }

        } catch (_) { console.log(_); }
    };

    // Method:  $Validate
    // Description:  Make sure that all objects added to the List are of the same type.
    function $Validate(list, object) {
        //If we have not yet determined a type it is determined by the first object added
        if (!list.$type) return;
        else if (object.constructor !== list.$type && !object.constructor instanceof list.$type)
            throw "Only one object type is allowed in a list";
    }

    //Array like Getter/Setter Logic, creates a getter for the List to access the inner array at the given index
    function $CreateGetterSetter(list, index) {
        try {
            if (Object.defineProperty) {
                Object.defineProperty(list, index, {
                    //writable: true, // True if and only if the value associated with the property may be changed. (data descriptors only). Defaults to false.
                    //enumerable: true, // true if and only if this property shows up during enumeration of the properties on the corresponding object. Defaults to false.
                    //configurable: true, // true if and only if the type of this property descriptor may be changed and if the property may be deleted from the corresponding object. Defaults to false.
                    get: function () {
                        if (index < 0 || index >= this.array.length) throw "index parameter out of range in List.Get";
                        return this.array[index];
                    },
                    set: function (value) {
                        if (index < 0 || index >= this.array.length) throw "index parameter out of range in List.Set";
                        $Validate(list, value);
                        this.array[index] = value;
                    }
                });
            } else {
                //Create alias
                list[index] = list.array[index];
            }
        }
        catch (_) { }
    }

    // Method: Constructor
    // Description: Returns a new List instance based on the given parameters.
    function List(/*type, array, capacity*/) {

        // ===============  Private Attributes  =================================================

        var base = new Class(IEnumerable),
        key = ++$List$Created,  // Identify each List instance with an incremented Id.
        capacity = arguments[2] || 10,        // Used to create getters and setters until I have worked out a different way
        oType = undefined,      // Used to ensure that all objects added to the list are of the same type.
        $containsLastResult = undefined, //Storage pointer for the last result of Contains call
        listArray = [];         // Stores all the list data.
        $List$Instances[key] = this; // Store instance with key                

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

        // Method:  Take
        // Description:  Retrieves all elements from this List instance where the index is less than the given index, and there are no more than count items
        this.Take = function (index, count) {
            count = count || listArray.length;
            /*
            if (index < 0) throw 'Invalid index given in List.Take'
            if (count >= listArray.length) throw 'Invalid count given in List.Take'
            var taken = new List();
            this.ForEach(function (o) { taken.Add(o); }, index, count);
            return taken;
            */
            return this.Where(function (item, index) { return index < count; }, index, count);
        }

        // Method:  Skip
        // Description:  Retrieves all elements from this List instance where the index is less than the given index, and there are no more than count items
        this.Skip = function (index, count) {
            count = count || listArray.length;
            /*
            if (index < 0) throw 'Invalid index given in List.Skip'
            if (count >= listArray.length) throw 'Invalid count given in List.Skip'
            var skipped = new List();
            this.ForEach(function (o) { taken.Add(o); }, index, count);
            return taken;
            */
            return this.Where(function (item, index) { return index >= count; }, index, count);
        }

        // Method:  CopyTo
        // Description:  Adds all elemets in this List to the given array, List or Object. Returns the source. If no source is given a new Native Array is returned
        this.CopyTo = function (source) {
            source = source || [];
            try {
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
            } catch (e) { throw e; }
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
            return listArray[index] || $Default(this); ;
        }

        // Method:  Where
        // Description:  Return a copy of this List object with only the elements that meet the criteria
        //               as defined by the 'query' parameter.
        this.Where = function (query) { return query ? $Select(this, query) : null; }

        // Method:  FirstOrDefault
        // Description:  Return the first object in the list that meets the 'query' criteria or null if no objects are found.        
        this.FirstOrDefault = function (query/*, last, fromDefault*/) {
            var list = $Select(this, query),
            last = arguments[1] || false,
            fromDefault = arguments[2] || true;
            return list && list.array.length ? list.array[last ? listArray.length - 1 : 0] : fromDefault ? $Default(this) : null;
        }

        // Method:  First
        // Description:  returns the first element in the List or null if nothing is contained.
        this.First = function (query) { return this.FirstOrDefault(query, false, false); }

        // Method:  Last
        // Description:  returns the last element in the List or null if nothing is contained
        this.Last = function (query) { return this.FirstOrDefault(query, true, false); }

        // Method:  LastOrDefault
        // Description:  Return the last object in the list that meets the 'query' criteria or the default of the List type if no objects are found.
        this.LastOrDefault = function (query) { return this.FirstOrDefault(query, true, true); }

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
        this.ToArray = function () { return new Array(listArray); }

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
                    //Try to ascertain equality, contained is equal to the expression of tEl[key] being exactly equal to object[key]'s value
                    try { contained = (tEl[key] === object[key]); contained ? $containsLastResult = index : $containsLastResult = -1; }
                    catch (_) { contained = false; $containsLastResult = -1; }
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
            catch (_) { return -1; }
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
            } catch (_) { }
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
                query(tEl, index);
            });
        }

        // Method: TrueForAll
        // Description: etermines whether every element in the List matches the conditions defined by the specified predicate.
        this.TrueForAll = function (query) { return query ? listArray.length === this.Where(query).Count() : undefined; }

        // Extension Methods    

        // Method: Sum
        // Description: For each element given the query a value is summed and the total is returned from expressing the element to the clause
        this.Sum = function (query) { var sum = undefined; this.ForEach(function (tEl) { sum += query(tEL); }); return sum; }

        // Method: Sum
        // Description: For each element given the query a value is summed and the total is returned / by the amount of conforming items from expressing the element to the caluse
        this.Average = function (query) { var sum = undefined, dividend = 1; this.ForEach(function (tEl) { ++dividend; sum += query(tEL); }); return sum / dividend; }

        // Method:  Any
        // Description:  returns true if any element in the list was matched by the query. (Returns false if there 0 items in the List).
        this.Any = function (query) { return listArray.length > 0 && $Select(this, query).Count() > 0; }

        // Method:  Single
        // Description:  Returns the first object in the list that meets the 'query' criteria or the default of the List type if no objects are found.
        this.Single = function (query, fromDefault) { return query ? this.FirstOrDefault(query) : fromDefault ? $Default(this) : null; }

        // Method:  SingleOrDefault
        // Description:  Returns the first object in the list that meets the 'query' criteria or null if no objects are found.
        this.SingleOrDefault = function (query) { return this.Single(query, true); }

        // Method:  Single
        // Description:  Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements. The element's index is used in the logic of the predicate function.
        this.SkipWhile = function (query, start) {
            if (!query) return this;
            start = start || 0;
            if (start < 0 || start >= listArray.length) throw "Invalid start parameter in call to List.SkipWhile";
            var has = this.Where(query), results = new List();
            listArray.forEach(function (tEl, index) {
                if (index < start) return;
                if (!has.Contains(tEl)) results.Add(tEl);
            });
            return results;
        }

        // Method:  Random
        // Description:  Returns a random element which matches the given query or a random element from the List if no query is given
        this.Random = function (query) { var rand = Math.floor((Math.random() * listArray.length) + 0); return query ? this.Where(query).ElementAt(rand) : this.ElementAt(rand); }

        //Copy constructor (utilized if first parameter in constructor is a List instance
        if (arguments[0] && arguments[0] instanceof List) {
            capacity += arguments[0].length;
            oType = arguments[0].$type; // Set the type of the List from the given
            listArray = arguments[0].array; // Set the inner array of the List from the given
        } else if (arguments[0] && arguments[0].length) try { //If there is a type given it may be contained in an array which is to be used as the interal array..       
            capacity += arguments[0].length;
            oType = arguments[0][0].constructor; // Set type of the List from the first element in the given array
            arguments[1] = arguments[1] || arguments[0]; // Make a new argument incase one is not given which should be the array given. This will be used after AddRange is constructed to verify each given item complies with the List logic.
        } catch (_) { }

        //If there is an array given then each member of the array must be added and verified
        if (arguments[1] && arguments[1].length) {
            if (capacity <= arguments[1].length) capacity += arguments[1].length;
            try { this.AddRange(arguments[1]); } catch (e) { throw e; }
        }

        //Cleanup instance prototype
        for (var p in this) if (!this.hasOwnProperty(p)) delete this.p;

        //Add event for destructor in executed closure
        window.addEventListener('unload', function () { $List$Dispose(key, true); });

        // ===============  Public Properties  =================================================

        //If supported define public properties on the List instance being created
        if (Object.defineProperty) {

            // Property: array
            // Description: Gets or Sets in Native inner array utilized by the List for storage. The elements contained must be of the same type in which this List instance was created with.
            Object.defineProperty(this, 'array',
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
                       if (value.length) value.forEach(function (v) { $Validate(this, v); }, this); //Ensure types
                       //Set member
                       listArray = value;
                   }
               }
           });

            // Property: $key
            // Description: Gets the machine key which identifies this List instance in the memory of all created List instances.
            Object.defineProperty(this, '$key',
           {
               configurable: true,
               get: function () {
                   return key;
               }
           });

            // Property: $key
            // Description: Gets the constructor or type in which this List was created with
            Object.defineProperty(this, '$type',
           {
               enumerable: true,
               configurable: true,
               get: function () {
                   return oType;
               }
           });

            // Property: $capacity
            // Description: Gets the capacity associated with this list upon creation
            Object.defineProperty(this, 'Capacity',
           {
               enumerable: true,
               configurable: true,
               get: function () {
                   return capacity;
               },
               set: function (newCapacity) {
                   if (!newCapacity || isNaN(newCapacity) || newCapacity === capacity) return;
                   if (newCapacity > capacity) {
                       //Size Increase
                       //Todo
                   } else {
                       //Size Decrease
                       //Todo
                   }
                   capacity = newCapacity;
               }
           });

            //Inline the getter creation (65535 crashes IE9)
            //What I am doing here is defining the getters so Array Like access works before we freeze the Object
            //The alternative would be to not freeze the object and Augment it on Insert or Add
            //The other option would be to implement Capacity and when the List resizes define new getters.
            //This will only be until we have Proxy, then we can even seal this Instance and referece the proxy.
            (function (self, counter) { while (counter >= 0) $CreateGetterSetter(self, --counter); })(this, capacity * 2);

            //And I bet before then I could even use Object.watch or a polyfill of it to enfore a pseudo 'missing_method' and then invoke this function... how fortuitist

        } else {
            // Compatibility
            this.Capacity = capacity;
            this.$type = oType;
            this.array = listArray;
            this.$key = key;
        }

        //freeze new instance
        return Object.freeze(this);

    }

    List.toString = function () { return /*'[object Class */'List'/*]'*/; };

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
            for (var i = 0, l = this.length; i < l; ++i)
                if (i in this) fn.call(bind, this[i], i, this);
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

    var IEnumerable = function (dataItems) {
        if (!(this instanceof IEnumerable)) {
            return new IEnumerable(dataItems);
        }

        this.clauses = new Array();
        this.source = dataItems;
    };


    IEnumerable.prototype = {
        getNext: function () {
            var next;

            var clauses = this.clauses;
            this.source.some(function (element, index, array) {
                if (clauses[0](element, index, array)) { // Generic predicate
                    next = element;
                    return true;
                }
                return false;
            });

            return next;
        },

        push: function (clause) {
            this.clauses.push(clause);
            return this;
        }
    };

    IEnumerable.toString = function () { return 'IEnumerable'; }

    IEnumerable.$abstract = true;

    console.log(IEnumerable([2, 3, 5]).push(function (element, index, array) {
        return index > 1 ? true : false;
    }).getNext());


    subclass(IEnumerable, List);

    //Freeze List
    Object.freeze(List);

    //Export
    window.export(List, window);

})();