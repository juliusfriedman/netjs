/*
HTML Element.Video Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.Video as way to gracefully degrade a video element to all clients in all browsers
Created: 02/18/2011
Authors:
ASTI Transportation :
                    Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
                    Andrew Larkin[ , ] - Web Developer
globals: win = window, doc = document, undef = undefined, brow = MooTools.Browser
*/
~function(win, doc, undef, m) {

    //If we don't have Browser then return
    if (!m || !m.elementConstructor) return;


    // Add HTML 5 media events to Element.NativeEvents, if needed.
    if (!Element.NativeEvents.timeupdate) {
        Element.NativeEvents = Object.merge({
            abort: 1,
            canplay: 1,
            canplaythrough: 1,
            durationchange: 1,
            emptied: 1,
            ended: 1,
            loadeddata: 1,
            loadedmetadata: 1,
            loadstart: 1,
            pause: 1,
            play: 1,
            playing: 1,
            progress: 2,
            ratechange: 1,
            seeked: 1,
            seeking: 1,
            stalled: 1,
            suspend: 1,
            timeupdate: 1,
            volumechange: 1,
            waiting: 1
        }, Element.NativeEvents);
    };


    //Determine the most efficient method of rendering video.

    //Prefered method
    var $supports_video = ~function() { return !!document.createElement('video').canPlayType; } ();

    //method for images which are non video
    var $supports_canvas = ~function() { return !!document.createElement('canvas').getContext; } ();

    //Secondary method for video
    var $supports_vlc = ~function() {
        try {
            var theVersion = revolunet.VLCObjectUtil.getPlayerVersion(),
            toCompare = theVersion.major + theVersion.minor + theVersion.ref;
            return theVersion && toCompare > 0;
        } catch (E) { return false; }
    } ();

    //Tetrinary method for video
    var $supports_bwt;

    //Least prefered method
    var $flash = Browser.Plugins.Flash;

    //Even less prefered
    var $supports_java;

    //Modify Browser
    Browser.Features.canvas = $supports_canvas;
    Browser.Features.video = $supports_video;
    Browser.Plugins.BWT = $supports_bwt;
    Browser.Plugins.Java = $supports_java;

    //Utility Types and Functions for Element.Video
    var $Element$Video = {
        //The various ways video can be rendered
        $renderType: {
            invalid: -1,
            native: 0,
            vlc: 1,
            bwt: 2,
            flash: 4,
            java: 8,
            image: 16,
            canvas: 32,
            //The preferred render of the VideoElement
            $prefferedType: ~function() {
                if ($supports_video) return $renderType.native;
                if ($supports_canvas) $renderType.canvas;
                if ($supports_vlc) return $renderType.vlc;
                if ($supports_bwt) return $renderType.bwt;
                if ($flash) return $renderType.flash;
                if ($supports_java) return $renderType.java;
                return $renderType.image;
            } (),
            //Determines the RenderType of a VideoElement
            $getRenderType: function($videoElement) {
                return $videoElement.options.renderType || $prefferedType;
            }
        },
        //The geometry our Video Elements will have
        $videoBase: {
            loadTime: null, //The DateTime this video was loaded
            maxLength: 0, //The maximum length of the video in frames (default: 0 means unlimited)
            width: 0, //width and height of the container
            height: 0,
            videoWidth: 0, //Element width and height
            videoHeight: 0,
            duration: 0, //Duration in seconds
            currentTime: 0, //Current place in the movie
            seeking: false, //Seeking
            paused: false, //Paused
            ended: false, //At the end of the video        
            loop: true, //Should the video start over again when complete
            autobuffer: true, //Should the video automatically buffer when needed
            autoplay: true, //Should the video start to play automatically        
            controls: true, //Should the video player have controls
            volume: 0, //Volume
            muted: false,
            poster: 'imageLoading.jpg', //Loading image
            src: 'google.com/images', //Where to get the video from, if it is a .jpg or other image extension then the canvas render will be used if possible otherwise img if movie then flash or java :(
            lastFrame: null, //The last frame drawn either a canvas or a Image or frame index to from the player
            canvasContext: null, //Used if canvas method
            frameBuffer: null//Used if canvas or Image method
        }
    };

    //The Events of the Video Element
    var $VideoEventPrototypes = {
        //Element Events
        OnBeforeLoad: function() {
            this.loadTime = new Date();
            this.fireEvent('onafterload');
        },
        OnLoad: function() {
            this.$renderType = Function.from($Element$Video.$renderType.$getRenderType(this));
        },
        OnAfterLoad: function() {
            return;
        },
        //Frame Events
        OnFrameBeforeLoad: function() {
        },
        OnFrameOnLoad: ~function() {

            if ($supports_video);

            //Special Logic for canvas
            var $frameOnLoadCanvas = function(videoEl, canv, binaryData) {
            };

            if ($supportsCanvas) {
                return $frameOnLoadCanvas.overloadSetter();
            } else if ($supports_vlc) {
                //use the revolunet player
            } else if ($supports_bwt) {
                //use the BWT player
            } else if ($flash) {
                //We need to load a video player and set it to the url
            } else if ($supports_java) {
                //We need to use a applet
            } else {
                //Fall back to Image
                //Manage the frameBuffer
            };

        } (),
        OnFrameAfterLoad: function() {
        },
        ////State Events
        //Before
        OnBeforeStop: function() {
        },
        OnBeforePlay: function() {
        },
        OnBeforeSeek: function() {
        },
        OnBeforePause: function() {
        },
        //After
        OnAfterStop: function() {
        },
        OnAfterPlay: function() {
        },
        OnAfterSeek: function() {
        },
        OnAfterPause: function() {
        },
        //Events
        OnPlay: function() {
        },
        OnStop: function() {
        },
        OnPause: function() {
        },
        OnSeek: function() {
        },
        //Volume Events
        OnBeforeVolumeChange: function() {
        },
        OnVolumeChange: function() {
        },
        OnAfterVolumeChange: function() {
        }
    };

//    //Override the Element constructor
//    var elementConstructor = Element;

//    //Ensure we have MooTools
//    if (!elementConstructor) throw new Error('MooTools Element constructor not found! Please load MooTools 1.3 before this script.');
//    else Element = function(type, options) {
//        type = type ? type.toString().toLowerCase() : 'div';
//        options = options || {};
//        switch (type) {
//            case 'video': return Element.Video(options);
//            default: return elementConstructor(type, options);
//        };
//    };

//    Element = Object.merge(Element, elementConstructor);

    //Provide the Element.Video
    Element.Video = function(options) {

        //Create the Video Element
        //Maybe allow force canvas renderer, expose lastFrame etc...
        var videoElement = new m.elementConstructor('video', options || {});

        //AddEvents
        common.bindEvents($VideoEventPrototypes, videoElement);

        //Return the result
        return videoElement;
    };

    //Implement our geometry
    Element.Video.implement($Element$Video.$videoBase);

    //Determine if we need to Augment Mooml for our new elements
    if (window.Mooml) {
        window.Mooml.tags.video = Element.Video;
    };

} (window, document, undefined, MooTools);

