(function (w, d, u) {

    var nullOrUndefined = {
        '': true,
        'string': true,
        'null': true,
        'undefined': true
    };

    Array.implement({
        remove: function (from, to) {
            var rest = this.slice((to || from) + 1 || this.length);
            this.length = from < 0 ? this.length + from : from;
            return this.push.apply(this, rest);
        }
    });

    Element.implement({
        addOption: function (newOption) {
            if (this.get('tag') === 'select') {
                if ((Browser.ie6 || Browser.ie7)) {
                    this.add(newOption, this.options[null]);
                } else {
                    try {
                        this.add(newOption, null);
                    } catch (e) {
                        this.add(newOption);
                    }
                }
            }
        }
    });

    String.implement({
        isNullOrEmpty: function () {
            try { return nullOrUndefined[this.toLowerCase().clean()]; }
            catch (E) { return true; }
        },
        isNullOrEmptyOrEqual: function (theOtherString, options) {
            options = options || {};
            if (!theOtherString || theOtherString.isNullOrEmpty()) return this.isNullOrEmpty();
            var theString = this.toString();
            if (theString.isNullOrEmpty()) return true;
            //tilde evals to -1 for undefined, false and any string value.  It evals to -2 for true and 1.
            //if (~options.caseSensitive && (theString = theString.toString().toLowerCase()) === (theOtherString = theOtherString.toString().toLowerCase())) return true;
            if (options.caseSensitive && (theString = theString.toLowerCase()) === (theOtherString = theOtherString.toString().toLowerCase())) return true;
            //not sure what the goal of replaceString is, will ask.
            //if (!options.replaceString.isNullOrEmpty() && (theString = theString.replace(options.replaceString)) === (theOtherString = theOtherString.replace(options.replaceString))) return true;
            if (options.stripScripts && ((theString = theString.stripScripts()) === (theOtherString = theOtherString.stripScripts()))) return true;
            return theString.clean() === theOtherString.clean();
        }
    });

    /* *******************************
    * Singleton Mutator
    **********************************
    * Class mutator that instantiates a class as a single instance.
    *
    ******************************** */

    //The Unbound initializer
    var $init = function (init) {
        if (this.constructor._instance === u) {
            if (init !== u && typeOf(init) === Application.Types.TypeOfFunction) init.apply(this, arguments);
            this.constructor._instance = this;
        };
        return this.constructor._instance;
    },
    //The instance Getter 
    $instanceGetter = function () {
        return this.constructor._instance || $init.bind(this.initialize).call();
    },
    //The disposer of a Type
    $disposer = function (klass) {
        if (klass && klass.instances && klass.instances.length) {
            while (klass.instances.length) klass.instances.shift().dispose();
            klass.instances = null;
            delete klass.instances;
        };
    };

    //The Class Mutator
    Class.Mutators.Singleton = function (flag) {
        if (!flag) return;
        //This singleton class is designed to reduce overhead by returning an instantiated version of the ModulesBase class for every instance that is created
        //with the new properties extended.
        this.constructor._instance = u;
        ////Check to see if there is an initialize function; if so, assign it to init for later use
        this.initialize = $init.bind(this).pass(this.initialize);
        return this.initialize.call();
    };

    //A Class Definition
    //Used by Extending Class.Singleton or by having Singleton true in your class or by merging with the result of this class or extending
    Class.Singleton = new Class({
        Singleton: true,
        getInstance: $instanceGetter.bind(this)
    });

    /* *******************************
    * Track Instances Mutator (Possible merge this with the AuthroizationRequired to perform two checks with one Mutator
    **********************************
    * Class mutator to track the number of instantiated instances of said class
    * script: Class.Mutators.TrackInstances.js 
    * description: Allows a class to track its instances by having instances array as a class property  
    * license: MIT-style license 
    * authors: - Elad Ossadon ( http://devign.me | http://twitter.com/elado )
    * modified by: Julius Friedman (jfriedman@asti-trans.com)
    * requires: - core:1.2.4  
    * provides: [Class.Mutators.TrackInstances]
    ******************************** */

    Class.Mutators.TrackInstances = function (allow) {
        if (!allow) return;
        // save current initialize method
        var oldInit = this.prototype.initialize;
        var klass = this;
        // overwrite initialize method
        klass.prototype.initialize = function () {
            (klass.instances = klass.instances || []).push(this);
            oldInit.apply(this, arguments);
        };
        //Add an event to the window to clean up the instances on unload
        w.addEvent('unload', $disposer.pass(klass));
    };


    /* *******************************
    * Authentication Required Mutator
    **********************************
    * Implicitly calls TrackInstances
    * If the Application.currentUser is undefined or null then the class will not instantiate
    ******************************** */

    Class.Mutators.AuthorizationRequired = function (allow) {
        if (!allow) return;
        var self = this;
        // save current initialize method
        var oldInit = self.prototype.initialize;
        var klass = self;
        if (!Application.currentUser || Application.currentUser === null || !Application.currentUser.loggedIn) klass.prototype.initialize = Function.from();
        //Call TrackInstances
        Class.Mutators.TrackInstances.apply(self, [allow]);
    };


})(window, document, undefined);