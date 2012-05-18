/*
HTML Element.placeholder Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.placeholder enchancements to input elements
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[andrew@alarkindesign.com, andrew@asti-trans.com] - Web Developer
globals: w = window, d = document, u = undefined, b = MooTools Browser, common = MooTools Common
*/
(function(w, d, u, b, common) {
    //First, we check if the browser supports the placeholder property:
    var $placeholderSupport = ('placeholder' in document.createElement('input'));
    b.Features.Placeholder = $placeholderSupport;
    if ($placeholderSupport) return;

    //We will always bind these  IF there is no native support   
    var $PlaceHolderEventPrototypes = {
        'blur': function(e) {
            if (e) e.stop();
            var thisValue = this.get('value'),
            placeholderValue = this.get('placeholder') || '';
            if (thisValue.isNullOrEmpty() && !placeholderValue.isNullOrEmpty()) this.set('value', placeholderValue);
        },
        'focus': function(e) {
            if (e) e.stop();
            var thisValue = this.get('value'),
            placeholderValue = this.get('placeholder');
            if (thisValue === placeholderValue) this.set('value', '');
        }
    };

    //if there is no support, we'll add the property to Element.Properties    
    Element.Properties.placeholder = {
        get: function() {
            return this.getAttribute('placeholder') || this.placeholder;
        },
        set: function(input) {
            this.setAttribute('placeholder', input);
            this.fireEvent('blur');
        },
        erase: function() {
            this.set('placeholder', null);
            this.fireEvent('blur');
        },
        bind: function(el) {
            common.bindEvents($PlaceHolderEventPrototypes, el);
            el.fireEvent('blur');
        }
    };
})(window, document, undefined, Browser, MooTools.Common);