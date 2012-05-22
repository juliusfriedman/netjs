~function (extern, REBUILD_CLR) {

    return (typeof CollectGarbadge === 'undefined' && Boolean(REBUILD_CLR) === true) ? undefined : new (function () {


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
            selectList = new List(list.$type);
            //possibly need to bind query on this if query instanceof function
            list.array.forEach(function (tEl) {
                var result = undefined;
                try {
                    result = !lambda && bind ? //Bind the query if there is no lambda
                    (query.bind(tEl)()) :
                        !lambda && pass ? (query(tEl)) : //Pass the element to the query if there is no lambda
                            lambda ? $ProcessLambda(query).bind(tEl)(tEl) : //Process the lambda if present
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
                    Export.remove(List);
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
            if (!list.$type && !object) return;
            else if (object.constructor !== list.$type || !object.constructor instanceof list.$type) throw "Only one object type is allowed in a list";
        }

        //Array like Getter/Setter Logic, creates a getter for the List to access the inner array at the given index
        function $CreateGetterSetter(list, index) {
            try {
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
            }
            catch (_) { }
        }

        // Method: Constructor
        // Description: Returns a new List instance based on the given parameters.
        function List(/*type, array, capacity*/) {

            // ===============  Private Attributes  =================================================

            var /*base = new Class(IEnumerable),*/
        key = ++$List$Created,  // Identify each List instance with an incremented Id.
        oType = arguments[0] || undefined,      // Used to ensure that all objects added to the list are of the same type.
        listArray = arguments[3] || [],         // Stores all the list data.
        capacity = arguments[2] || 10,        // Used to create getters and setters until I have worked out a different way        
        $containsLastResult = undefined; //Storage pointer for the last result of Contains call
            $List$Instances[key] = this; // Store instance with key                

            // ===============  Public Methods  ======================================================

            // Method:  Add
            // Description:  Add an element to the end of the list.
            this.Add = function (object) {
                //object = object || $Default(object);
                if (!oType) oType = object.constructor;
                try { $Validate(this, object); }
                catch (ex) { throw ex; }
                listArray.push(object);
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
            //for (var p in this) if (!this.hasOwnProperty(p)) delete this.p;
            CleanPrototype(this);

            //Add event for destructor in executed closure
            window.addEventListener('unload', function () { $List$Dispose(key, true); });

            // ===============  Public Properties  =================================================

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
                       capacity = newCapacity;
                       return new List(this);
                   } else {
                       return new List(this.Take(0, newCapacity - 1));
                   }
               }
           });

            //Inline the getter creation (65535 crashes IE9)
            //What I am doing here is defining the getters so Array Like access works before we freeze the Object
            //The alternative would be to not freeze the object and Augment it on Insert or Add
            //The other option would be to implement Capacity and when the List resizes define new getters.
            //This will only be until we have Proxy, then we can even seal this Instance and referece the proxy.
            (function (self, counter) { while (counter >= 0) $CreateGetterSetter(self, --counter); })(this, capacity * 2);

            //And I bet before then I could even use Object.watch or a polyfill of it to enfore a pseudo 'missing_method' and then invoke this function... how fortuitist

            //freeze new instance
            return Object.freeze(this);

        }

        List.toString = function () { return /*'[object Class */'List'/*]'*/; };

        //.Net JavaScript (this should be a new scope)
        var newScope = this,
        args = arguments,
        callee = arguments.callee,
        caller = arguments.caller,
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

        Export(List, window, 'List');

        //The void
        function Void() { return { toString: function () { return Void.toString(); }, valueOf: function () { javascript: void (arguments); } }; }
        Void.toString = 'Void';

        Export(Void, window, 'Void');

        //Security
        var Security = {
            valueOf: function () { return this; },
            toString: function () { return 'Security'; }
        };

        //Adds an allowed scope with expected depth
        Security.addSafeScope = function (argumentz, expectedCallerDepth, expectedCaller/*,Boolean noVerify = false*/) {
            var noVerify = arguments[3] || false;
            if (noVerify === false) expectedCallerDepth += 2; //Protect against CLR Checks unless noVerify is given
            try { if (noVerify !== false) Security.checkScope(); }
            catch (_) { throw _; }
            if (IsNullOrUndefined(Security.addSafeScope.registered[expectedCaller])) Security.addSafeScope.registered[expectedCaller] = expectedCallerDepth //This allow patch in and multiple callers
            else Security.addSafeScope.registered[expectedCaller] += expectedCallerDepth;
        }

        Security.addSafeScope.registered = {};

        //Checks a scope
        Security.checkScope = function () {
            if (this === newScope || this === CLRItself) return true;
            if (this === callee || this === caller) return false;
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
        //$Export(Security, window);

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

        //Checks for CLR Binding or a safe hook as the context of the caller or associated call chain
        function $isCLR() {
            try { Security.checkScope(); return true; }
            catch (_) { return false; }
            return this === newScope; //Should never happen unless ...
        }

        //Export $isCLR as IsCLR
        Export($isCLR, window, 'IsCLR');

        //Checks for CLR Scope
        function $checkCLR() { if (!$isCLR()) throw 'The CLR is required to access this scope'; }

        //Export $checkCLR as CheckCLRAccess
        Export($checkCLR, window, 'CheckCLRAccess');

        //Backup the old apply function
        var Function$prototype$apply = Function.prototype.apply

        //Ensures functions cannot operate on CLR Classes unless they are bound in the rules of the CLR
        Function.prototype.apply = function () {
            $checkCLR();
            try { return Function$prototype$apply(this, arguments); }
            catch (_) { return Function$prototype$apply; }
            return void (this);
        }

        //Object.prototype._constructor = Object.prototype.constructor;

        //Replace object constructor
        Object.prototype.constructor = function () { return this === extern ? new Class(Object) : Class({}); }

        //Backup GarbadgeCollector
        var _CollectGarbadge = typeof CollectGarbadge === 'undefined' ? new Function('return delete this') : CollectGarbadge;

        //Garbadge Collector
        function $CollectGarbadge() { javascript: with (new Void) _CollectGarbadge(); }
        $CollectGarbadge.toString = function () { return '$CollectGarbadge' }
        $CollectGarbadge.$abstract = true;

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
            if (!Function.prototype.bind) {
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

        //Polyfill for freeze
        if (!Object.freeze) {

            //Memory for frozen objects
            var $freezer = {}

            //Puts the ice on
            function ice(object) { $freezer[object] = true; }

            //Takes the ice off
            function thaw(object) { delete $freezer[object]; }

            //Freeze the object
            function freeze(object) { return ice(object); }

            function isFrozen(object) { return $freezer[object] === true; }

            //Export
            Object.freeze = freeze;
            Object.isFrozen = isFrozen;
        }

        //Polyfill for seal
        if (!Object.seal) {

            //Memory for sealed objects
            var $sealed = {};

            function seal(object) { $sealed[object] = true; }

            function isSealed(object) { return $sealed[object] ? true : false; }

            //Export
            Object.seal = seal;
            Object.isSealed = isSealed;
        }

        //Replace
        CollectGarbage = $CollectGarbadge;

        //Hash of known Object, Handles with a live timeOut
        $CollectGarbadge.timeOuts = {};

        //Define the property of TimeToLive = 5 + Minutes in milliseconds
        Object.defineProperty($CollectGarbadge, 'TimeToLive', { value: 300025 });

        Object.seal($CollectGarbadge);
        Object.freeze($CollectGarbadge);

        //Export $CollectGarbadge
        $Export($CollectGarbadge, window, 'CollectGarbadge');

        //Gets the Type name from the Constructor given (Native/Declared Types Only)
        function $getTypeName(type) {
            try {
                type = typeof type !== 'undefined' ? IsNullOrUndefined(type.GetTypeName) ? type : type.GetTypeName() : type;
                if (!(typeof type === 'string' || type instanceof String)) {
                    var result = type.toString().split(' ');
                    if (result.length === 1) return result[0]; // Qualified Type
                    else result = result[1];
                    result = result.toString().substring(0, result.indexOf('(')); //Native
                    return result;
                }
                throw new Error();
            }
            catch (_) { return type === null ? null : type === undefined ? undefined : type; }
        }; //0 = function, 1 = name and  so on => {, [native / code], }

        //Allows a constructor to determine if new was called
        function $isNewObject(object) { return ((new Object() === object) || (object.toString() === '[object Object]')); }

        //Export $getTypeName to the window as GetTypeName
        Export($getTypeName, window, 'GetTypeName');

        //Is function
        function $Is(what, type) {
            try {
                if (!type) return $getTypeName(what) === $getTypeName(type);
                else if (typeof what === $getTypeName(type).toLowerCase()) return true;
                else if (($getTypeName(what) + '') === ($getTypeName(type) + '')) return true;
                else if (what instanceof type) return true;
                else if ($As(what, type)) return true;
                else for (var i in what.constructor) if (what.constructor.i === type || what.constructor.i === type.constructor) return true;
                else return false;
            }
            catch (_) { return false; }
        }

        function $IsNull(what) { return what === null; };
        Export($IsNull, window, 'IsNull');

        function $IsUndefined(what) { return typeof what === 'undefined' || what === undefined; };
        Export($IsUndefined, window, 'IsUndefined');

        function $IsNullOrUndefined(what) { debugger; return !$IsNull(what) ? false : $IsUndefined(what); }
        Export($IsUndefined, window, 'IsNullOrUndefined');

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

        //Polyfills

        /*<ltIE9>*/
        if (IsNullOrUndefined(window.addEventListener)) {
            if (window.attachEvent && !window.addEventListener) {
                var unloadEvent = function () {
                    window.detachEvent('onunload', unloadEvent);
                    CollectGarbadge();
                    document.head = document.html = document.window = null;
                } .bind(window);
                window.attachEvent('onunload', unloadEvent);
                window.addEventListener = window.attachEvent;
            }
        }

        //Throws for sealed attribute
        function $checkSealed(constructor, derivedConstructor) { if (Object.isSealed(constructor)) throw derivedConstructor.toString() + 'cannot inherit from sealed class' + constructor.toString() + '.'; };

        //Polyfill for defineProperty
        if (IsNullOrUndefined(Object.defineProperty)) {
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
                if (!IsNullOrUndefined(descriptor.value) && !IsNullOrUndefined(descriptor.get)) throw 'Descriptor cannot contain a value and a getter';
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
                var getterSetter = function (value) { return (IsNullOrUndefined(value) || value == descriptor.value) ? legacyGet(object, name, descriptor) : legacySet(object, name, descriptor, value); }

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

        //The abstract class constructor
        function abstractConstructor(constructor) { throw 'Cannot create an instance of an abstract class without a derived class! Type = ' + '[' + JSON.stringify(constructor) + ', ' + this.$abstract.toString() + ']'; }

        //http://www.golimojo.com/etc/js-subclass.html
        //Modified for netjs by Julius Friedman
        //Description: Helps interpreterd code to function correctly after compile with respect to instanceof
        function $subclass(constructor, derivedConstructor/*,Boolean inheritMembers = false, Boolean inheritPrototype = false*/) {

            //Ensure constructor is not sealed
            $checkSealed(constructor, derivedConstructor);

            var inheritMembers = arguments[2] || false,
                inheritPrototype = arguments[3] || false,
                linkedName = '_type_' + derivedConstructor.toString() + '_^_' + constructor.toString(),
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

            //Copy prototype if indicted
            if (inheritPrototype && isInstance && derivedConstructor.$inheritsMembers === true) for (var i in constructor.prototype) if (!(i === 'constructor')) derivedConstructor.prototype[i] = constructor.prototype[i];

            //Copy members if indicted
            if (inheritMembers && isInstance && derivedConstructor.$inheritsMembers === true) for (var j in constructor) if (!(j === 'prototype')) derivedConstructor[j] = constructor[j];

            //Store __TypeName only if previously undefined
            if (IsNullOrUndefined(derivedConstructor.__TypeName)) Object.defineProperty(derivedConstructor, '__TypeName', {
                get: function () { return linkedName; }
            });

            //Return the new constructor
            return derivedConstructor;
        }

        //Memory for the pseudo type system
        $subclass.linker = {};

        Export($subclass, window, 'Subclass');

        Security.addSafeScope(Class, 3, $subclass);

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

        //        //Make the concept of abstract
        //        //Possibly should be true so functions cannot be called new on accident
        //        Object.defineProperty(Function.prototype, 'abstract', {
        //            //writable: false,
        //            enumerable: true,
        //            configurable: false,
        //            get: function () {
        //                return this.$abstract || false;
        //            },
        //            set: function (value) { return this.$abstract = value; }
        //        });

        //Pseudo Classes
        var baseClass = defaultConstructor; //(this);
        baseClass.$base = baseClass.constructor = abstractConstructor;
        baseClass.$abstract = true;
        baseClass.toString = function () { return /*'[object Class */'baseClass'/*]'*/; };

        //Export Defined Classes for Unit Tests and make pseudo keyword 'abstract'
        Export(baseClass, window, '$abstract');
        Export(baseClass, window);


        //If the base class is abstract return the reference to it otherwise return the reference to the result of $subclass given this instance and the baseClass
        function Class(base) {
            Object.defineProperty(this, '__TypeName', { value: base.__TypeName }); // Ensure the __TypeName is present
            Object.defineProperty(this, 'base', { value: base }); // Ensure the base keyword works in the scope
            $subclass(this, base, $isNewObject(this)); // $subclass all classes            
            return base.$abstract && typeof (base = base.apply(this)) !== 'undefined' ? base : $subclass(this, base); // Return the base constructor
        }
        Class.toString = function () { return /*'[object */'Class'/*]'*/; };
        Class.cast = Function.prototype.cast;

        //Export Class keyword to the window
        Export(Class, window);

        Security.addSafeScope(Class, 1, Function.prototype.apply);
        Security.addSafeScope(Class, 4, $cast);

        function $default(type) { var result = null; try { result = new type(); } catch (_) { result = arguments[0] || null; } return result ? result.valueOf() : result; }
        $Export($default, window, 'Default');

        //Method: using
        //Description: Allows using of disposable objects
        function $using(disposable) {
            //If there is no disposable return
            if (IsNullOrUndefined(disposable) || IsNullOrUndefined(disposable.Dispose)) return;
            //Scope the finalizer
            var finalizer = disposable.Dispose,
                token = new Date().getTime(), //The token which will invoke the real finalizer
                earlyCalls = []; //The references to who called before

            //Override the Dispose method incase the user calls dispose inside on accident
            disposable.Dispose = function (when) {
                if (when && when === token) finalizer(true);
                else earlyCalls.push(arguments.callee);
            }

            $CollectGarbadge.timeOuts[disposable] = $CollectGarbadge.timeOuts[disposable] || [];
            var handle = $CollectGarbadge.timeOuts[disposable].push(setInterval(function () {
                if (earlyCalls.length === 0 || new Date().getMilliseconds() - token >= $CollectGarbadge.TimeToLive) finalizer(token);
                delete earlyCalls;
                clearInterval($CollectGarbadge.timeOuts[disposable][handle]);
                $CollectGarbadge.timeOuts[disposable].splice(handle, 1); //Remove call in object history
                if ($CollectGarbadge.timeOuts[disposable].length === 0) delete $CollectGarbadge.timeOuts[disposable]; //Remove object from history if there are no more timeouts registered.
            }, (($CollectGarbadge.timeOuts[disposable].length + 1) * 1000))); //Set the interval for the length of known timeouts + 1 * 1000 (1 Second for the first, 2 for the next etc)

        }

        Export($using, window, 'using');

        //The CLRObject which will be the base class of all classes going forward... It will be exported under System.Object
        function CLRObject() {
            Class.apply(this, arguments);
            this.toString = function () { return this.__TypeName; }
        }

        CLRObject.toString = function () { return /*'[object Class */'CLRObject'/*]'*/; }

        CLRObject = Subclass(Class, CLRObject);

        Export(CLRObject, window, 'CLRObject');

        //The System Object
        var System = {}; //Might need a namespace construct

        //Array like Getter/Setter Logic, creates a getter for the List to access the inner array at the given index
        function $CreateGetterSetter(clrString, index) {
            try {
                Object.defineProperty(clrString, index, {
                    get: function () {
                        if (index < 0 || index >= clrString.Length) throw "index parameter out of range in String.Get";
                        return clrString.toString().charAt(index);
                    },
                    set: function (value) {
                        if (!value instanceof System.Char) return;
                        if (index < 0 || index >= clrString.Length) throw "index parameter out of range in String.Set";
                        clrString[index] = value;
                    }
                });
            }
            catch (_) { }
        }

        /*public struct */System.Char = function (c) {
            c = String(c);

            var base = c, //Might need a struct construct
                innerChar = c.charAt(0),
                innerNumber = Number(innerChar),
                innerString = String(c);

            if (base.length > 1 || innerChar < 0 || innerChar > 255) throw 'Invalid Value for Char';

            this.ToString = function () { return new System.String(base); }

            this.toString = function () { return base.toString(); }

            this.ToLowerCase = function () { return base.toLowerCase(); }

            this.ToUpperCase = function () { return base.toUpperCase(); }

            this.valueOf = function () {
                if (this instanceof System.Char) return innerChar;
                else if (this instanceof System.String) return innerString;
                else if (this instanceof String) return innerString;
                else if (this instanceof Number) return innerNumber;
                else return this;
            }

        }
        System.Char.toString = function () { return 'System.Char'; }


        Subclass(Class, System.Char);

        //TODO Implement GetTypeName from CLRObject

        /*public sealed class */System.String = function (jsString) {
            jsString = String(jsString); //Promote string to String and guard against undefined or null

            var base = jsString,
                length = jsString.length;

            this.StartsWith = function (str) {
                try {
                    str = str + ''; //Guard against null and undefined
                    //return base.substring(0, str.length) === str;
                    return base.indexOf(str) === 0;
                } catch (_) { return false; }
            }

            this.EndsWith = function (str) {
                try {
                    str = str + ''; //Guard against null and undefined
                    //return base.substring(base.length - str.length) === str;
                    return base.indexOf(str) === base.length - str.length
                } catch (_) { return false; }
            }

            this.Substring = function (start, count) { if (start < 0 || start > length || count > length || count < 0) throw 'Argument start or count is Out Of Range in String.Substring'; return new System.String(base.substr(start, count)); }

            this.IndexOf = function (what, start) { if (start < 0 || start > length) throw 'Argument start or count is Out Of Range in String.IndexOf'; return what ? base.indexOf(what, start || 0) : -1; }

            this.LastIndexOf = function (what, start) { if (start < 0 || start > length) throw 'Argument start or count is Out Of Range in String.LastIndexOf'; return what ? base.lastIndexOf(what, start || 0) : -1; }

            this.ToString = function () { return this; }

            this.valueOf = function () { return base; };

            this.toString = function () { return base; };

            this.ToCharArray = function () {
                var result = [];
                for (var c = 0; c < this.Length; ++c) result.push(new System.Char(this.Substring(c, 1).toString()));
                return result;
            }

            this.Reverse = function () { return new System.String(this.ToCharArray().reverse().join(System.String.Empty)); }

            Object.defineProperty(this, 'Length', {
                enumerable: true,
                get: function () { return length; }
            });

            (function (self, counter) { while (counter >= 0) $CreateGetterSetter(self, --counter); })(this, length);

            CleanPrototype(this);

            Object.seal(this);

            Object.freeze(this);
        }

        Subclass(Class, System.String);

        Subclass(String, System.String);

        System.String.Empty = '';

        System.String.Intern = function (str) { return str; }

        System.String.toString = function () { return 'System.String'; }

        System.String.prototype.IsNull = function (/*String what*/) { var what = arguments[0] || this; return what.Length === 0; }

        System.String.prototype.IsNullOrEmpty = function (/*String what*/) { var what = arguments[0] || this; return this.IsNull() || this.toString.trim() === System.String.Empty; }

        System.String.prototype.GetTypeName = System.String.toString;

        Object.freeze(System.String);

        Object.seal(System.String);

        //Diagnostics

        function ObjectKeysEqual(a, b) {
            for (var p in a) if (a.hasOwnProperty(p) && !a[p] === b[p]) return false;
            return true;
        }

        System.Diagnostics = {};

        System.Diagnostics.Assert = function Verify(result, expected) {
            if (!result.forEach || !result || !isNaN(result) || (true === expected || false === expected)) return result === expected || ObjectKeysEqual(result, expected);
            if (expected.length) {
                result = Object.keys(result);
                expected = Object.keys(expected);
                if (result.length !== expected.length) return false;
            }
            try { result.forEach(function (o, i) { if (o !== expected[i]) throw Error; }); }
            catch (_) { return false; }
            return true;
        }

        System.Diagnostics.Except = function Except(ex) { alert(+ex ? 'Message: ' + ex : this.caller.toString()); }

        Export(System, window, 'System');



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
        Subclass(myClass, baseClass);

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
        Subclass(anotherClass, myClass);

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
        Function.prototype.call = function () {
            if (IsCLR()) {
                //Should ConvertLegacyArguments before call and save them seprately. After which it should check for any parameters with IsIn
                //After calling it should then check for any parameters with IsOut and ensure value was set in function. 
            }
            return this.$abstract ? abstractConstructor(this.base || this.constructor || this.prototype || this) : $Function$prototype$call.apply(this, arguments)
        };

        //Calls the function with named arguments if given using call intercept
        function callWithArguments(/*bind*/) {
            if (arguments.length) {
                var args = [], bind = arguments[0] || this;
                for (var i = 0, e = arguments.length - 1; i < e; ++i) args.push(arguments[i]);
                args.push(bind ? bind : bind.bind(bind));
                return ((new Function(args)).call());
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
            symbols.substr(start + 1, end - start - 1).split(',').forEach(function (argument) { args.push(argument); });
            //(symbols.substr(start + 1, end - start - 1).split(',').forEach(Array.prototype.push.bind(args)));
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

        System.Reflection = Reflection;

        //Function.prototype.getArguments = function () { return Reflection.getArguments(this); }

        //Function.prototype.getExpectedReturnType = function () { /*ToDo*/ }

        Object.seal(Reflection);

        Object.freeze(Reflection);

        return CLRItself;

    })();

} (this, false);