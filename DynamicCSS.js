/*
DynamicCSS.js
A Dynamic StyleSheet Engine
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari(/Mobile), Chrome(/Mobile), Konquer and others.
Requires: MooTools 1.3
Provides: DynamicCSS Class
Created: 03/38/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[ andrew@alarkindesign.com ] - Web Developer
globals: win = window, screen = window.screen, doc = document, body = document.body, moo = MooTools, $ = document.id, nil = undefined

//Information and reference see:
http://kentbrewster.com/creating-dynamic-stylesheets/
http://www.hunlock.com/blogs/Howto_Dynamically_Insert_Javascript_And_CSS
http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript

*/
~function(win, doc, moo, $, nil) {

    var loadedStyleSheets = [], //an array of all stylesheets loaded by the DynamicCSSEngine
    styleSheets = document.styleSheets, //the array of styleSheets loaded in the document head,
    $styleSheetSupport = styleSheets ? true : false,
    head = doc.getElement('head'); //the document head element

    //Get all stylesheets that have been loaded already and add them to our loaded styleSheets array
    Array.each(styleSheets, function(styleSheet) {
        loadedStyleSheets.include(styleSheet);
    });

    //Gets a cssRule from the current document Stylesheet
    getCSSRule = function(ruleName, deleteFlag) { // Return requested style obejct
        var styleSheet, cssRule, ii;
        ruleName = ruleName.toLowerCase(); // Convert test string to lower case.
        if ($styleSheetSupport) {
            for (var i = 0, e = loadedStyleSheets.length; i < e; ++i) { // For each loaded stylesheet
                styleSheet = loadedStyleSheets[i]; // Get the current Stylesheet
                cssRule = false; //reinitialize the cssRule for each loop
                if (!styleSheet) continue;
                ii = 0; // reinitialize the subcounter for each loop.
                try {
                    do { // For each rule in stylesheet
                        if (styleSheet.cssRules) cssRule = styleSheet.cssRules[ii]; // Browser uses cssRules? Yes --Mozilla Style 
                        else cssRule = styleSheet.rules[ii]; // Browser usses rules? Yes IE style. 
                        if (cssRule) { // If we found a rule...
                            if (cssRule.selectorText && cssRule.selectorText.toLowerCase() === ruleName) { // match ruleName?
                                if (deleteFlag === 'delete') { // Yes. Are we deleteing?
                                    if (styleSheet.cssRules) styleSheet.deleteRule(ii); // Delete rule, Moz Style                                    
                                    else styleSheet.removeRule(ii); // Delete rule IE style.
                                    return true; // return true, class deleted.
                                } else return cssRule; // found and not deleting. return the style object.
                            } // End found rule name
                        } // end found cssRule
                        ++ii; // Increment sub-counter
                    } while (cssRule); // end While loop
                } catch (ex) {
                    continue; //if an exception occurs, continue to the next iteration
                }
            } // end For loop
        } // end styleSheet ability check
        return false; // we found NOTHING!
    } // end getCSSRule

    //Deletes a cssRule from the current document Stylesheet
    killCSSRule = function(ruleName) { // Delete a CSS rule 
        return getCSSRule(ruleName, 'delete'); // just call getCSSRule w/delete flag.
    }, // end killCSSRule

    //Adds a cssRule from the current document Stylesheet or returns the rule if it already exists
    addCSSRule = function(ruleName) { // Create a new css rule
        if ($styleSheetSupport) { // Can browser do styleSheets?
            if (!getCSSRule(ruleName)) { // if rule doesn't exist...
                if (loadedStyleSheets[0].addRule) loadedStyleSheets[0].addRule(ruleName, null, 0); // Browser is IE? Yes, add IE style
                else loadedStyleSheets[0].insertRule(ruleName + ' { }', 0); // Yes, add Moz style.
            }; // End already exist check.
        }; // End browser ability check.
        return getCSSRule(ruleName); // return rule we just created.
    },

    //Takes a jsonCss string and then  parses it for validity and ensures it is not already loaded
    JSCSSParserText = function(jsonCss) {
    },

    //The DynamicCSSEngine Class itself
    DynamicCSSEngine = new Class({
        Singleton: true,
        //Fields
        //Methods
        createStyleSheet: function(media, title, id, lang, load) {
            var styleSheet = doc.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.rel = 'stylesheet';
            styleSheet.media = media;
            styleSheet.title = title;
            styleSheet.id = id;
            styleSheet.lang = lang;
            if (load) {
                this.loadStyleSheet(styleSheet);
            }
            return styleSheet;
        },
        //Loads a styleSheet into the document
        loadStyleSheet: function(path, callBack) {
            callBack = Function.from(callBack);
            if (this.getStyleSheet(path)) {
                return callBack();
            } else if (typeOf(path) === 'element') {
                head.appendChild(path);
                if (path.styleSheet) {
                    loadedStyleSheets.include(path.styleSheet);
                } else if (path.sheet) { //For webkit
                    loadedStyleSheets.include(path.sheet);
                }
                callBack(path);
            } else {
                var link = Asset.css(path, {
                    onLoad: function() {
                        if (link.styleSheet) {
                            loadedStyleSheets.include(link.styleSheet);
                            callBack(link);
                        }
                    }
                });
            }
        },
        //iterates through the loaded style sheets and returns that stylesheet or returns false if none is found
        getStyleSheet: function(path) {
            var styleSheet = path.sheet || path.styleSheet || path;
            for (var i = 0, e = loadedStyleSheets.length; i < e; ++i) { //iterate through 
                if ((typeOf(styleSheet) === 'string' && loadedStyleSheets[i].href === styleSheet) || styleSheet === loadedStyleSheets[i] ) {
                    return loadedStyleSheets[i];
                }
            }
            return false;
        },
        //Loads a Dynamic JavascriptCSS document
        loadJSCSS: function(path, callBack) {
            if (!loadedStyleSheets.contains(path)) {
                Asset.js(path, {
                    onLoad: function() {
                        loadedStyleSheets.include(JSCSSParserText());
                        callBack();
                    }
                });
            }

        },
        addCSSRule: function(ruleName) {
            return addCSSRule(ruleName);
        },
        getCSSRule: function(ruleName) {
            return getCSSRule(ruleName);
        },
        deleteCSSRule: function(ruleName) {
            return killCSSRule(ruleName);
        }
    });

    //Instantiate the class and globalize it
    win.DynamicCSS = new DynamicCSSEngine();

    //If there are no styleSheets loaded, we'll create a default styleSheet
    if (!loadedStyleSheets.length) {
        win.DynamicCSS.createStyleSheet('all', 'DynamicCSS', 'dynamiccss', 'en-us', true);
    }

} (window, document, MooTools, document.id, null);