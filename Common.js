/*
Common JS Library Functions
Part of the tcm Web Application
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: MooTools.Common namesapce
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[andrew@alarkindesign.com, andrew@asti-trans.com] - Web Developer
globals: win = window, doc = document, undef = undefined, m = MooTools
*/
~function (win, doc, undef, m) {
    //Add the common library
    if (m.Common) return;
    m.Common = {};
    //Assingns Events from a ElementPrototype to an Element
    var $bindEvents = function ($EventProtoType, $element) {
        if (!$EventProtoType || !$element) return;
        Object.each($EventProtoType, function ($obj, $e) {
            $element.addEvent($e.toString().toLowerCase(), $obj.bind($element));
        });
    };
    m.Common.bindEvents = $bindEvents,
    //Remove Events
    $removeEvents = function (element) {
        if (!element) return;
        element.removeEvents();
    },
    m.Common.removeEvent = $removeEvents,
    //Quantifiers
    Quantifiers = {
        prepend: '',
        postpend: Date.now(),
        quantify: function (quantifyString) {
            return quantifyString.isNullOrEmpty() ? Quantifiers.postpend : quantifyString.match('&') ? quantifyString += '&q=' + Quantifiers.postpend : quantifyString += '?q=' + Quantifiers.postpend;
        }
    },
    m.Common.quantify = Quantifiers.quantify;

    //Element intercept
    //Back up the element constructor and redirect new Element calls to our fallback code
    if (!m.elementConstructor) m.elementConstructor = Element;
    Element = function (htmlTag, options) {
        switch (htmlTag.toLowerCase()) {
            case "image": return new Element.Image(options);
            case "video": return new Element.Video(options);
            case "input": return new Element.Input(options);
            case "button": return new Element.Button(options);
            case "form": return new Element.Form(options);
            case "textarea": return new Element.Textarea(options);
            default: return new m.elementConstructor(htmlTag, options); //if no htmlTag or fallback script not loaded fall through to default element
        };
    };
    Element = Object.merge(Element, m.elementConstructor),
    __default = function (object) {
        try {
            return (object['constructor'].from() || object['prototype'].from() || Object.from());
        } catch (Error) { return null; }
    };


    if (window.location.toString().match('DevelopmentTesting')) Quantifiers.prepend = '../';
} (window, document, undefined, MooTools);