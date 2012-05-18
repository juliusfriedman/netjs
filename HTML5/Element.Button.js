/*
HTML Element.Button Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3, Common.js
Provides: Element.Button enchancements to DOM Button
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[andrew@alarkindesign.com, andrew@asti-trans.com] - Web Developer
globals: win = window, doc = document, undef = undefined, m = MooTools
*/
~function(win, doc, undef, m) {

    //If we do not have MooTools then we should not do anything further
    if (!m || !m.elementConstructor) return;   

    //Add a new Element Type Constructor for Button
    //Adds mouseenter and mouseleave handlers to adjust background position to simulate 'on' and 'off' effects
    Element.Button = function(htmlAttributes) {
        var el = new m.elementConstructor('button', htmlAttributes);
//        el.addEvents({
//            //'mouseenter': function(e) { this.offsetBackground(e, 0, ~(this.getSize().y)) },
//            //'mouseleave': function(e) { this.resetBackground() }
//        });
        return el;
    };

    //Same deal as form!  Element.Button will be called by Mooml
    //if (Mooml) Mooml.engine.tags.button = Element.Button;

} (window, document, undefined, MooTools);