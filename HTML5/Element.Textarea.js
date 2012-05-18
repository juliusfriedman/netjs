/*
HTML Element.Form Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.Form enchancements to DOM Form
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 

globals: win = window, doc = document, undef = undefined, brow = MooTools.Browser
*/
~function(win, doc, undef, m) {

    //If we do not have MooTools then we should not do anything further
    if (!m || !m.elementConstructor) return;

    //Add OverText by default to all textarea elements
    Element.Textarea = function(htmlAttributes) {
        htmlAttributes = htmlAttributes || {};
        var el = new m.elementConstructor('div', { styles: { position: 'relative'} });
        var theTextarea = new m.elementConstructor('textarea', htmlAttributes).inject(el);
        el.setStyle('display', theTextarea.getStyle('display'));
        if (!Browser.Features.Placeholder) Element.Properties.placeholder.bind(theTextarea);
        el.focus();
        return el;
    };

    //if (Mooml) Mooml.engine.tags.textarea = Element.Textarea;

} (window, document, undefined, MooTools);