/*
HTML Element.TouchEvents Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: HTML5 / Mobile TouchEvent compatibility
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 

--// For discussion and comments, see: MooTools Forge
globals: win = window, doc = document, undef = undefined, brow = MooTools.Browser
*/
~function(win, doc, undef, brow) {

    //If we do not have MooTools then we should not do anything further
    if (!brow) return;

    //If we are dealing with a touch device we have to provide events which make sense to a touch device
    try {

        var $touchEvent = document.createEvent("TouchEvent");

        var $mapping = {
            'mousedown': 'touchstart',
            'mousemove': 'touchmove',
            'mouseup': 'touchend'
        };

        var $condition = function(event) {
            var theTouch = event.event.changedTouches[0];
            event.page = {
                x: theTouch.pageX,
                y: theTouch.pageY
            };
            return (delete theTouch);
        };

        ['touchstart', 'touchmove', 'touchend'].each(function(type) {
            Element.NativeEvents[type] = 2;
        });

        $mapping.each(function(e) {
            Element.Events.e = {
                base: $mapping.e,
                condition: $condition.bind(e)
            };
        });

        brow.Features.TouchEvents = (delete $touchEvent);

    } catch (e) { }

} (window, document, undefined, Browser);