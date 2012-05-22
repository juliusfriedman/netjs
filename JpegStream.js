/*
    JpegStream.js
    Defines a Class and supporting utility functions for allowing a browser to gracefully degrade and display a succession of Images in emulation of a video.
    Other image types besides Jpeg can be used however the mechanism for retrieving the images must remain the same.
    The class works by making a request to a base uri which retrieves the image, the request is cached in the browser and than an Image is created and eventually injected
    into the document where it will be placed on top of the existing frame.
*/
(function (w, d, u, n, $, c) {

    // Constants
    var $MinimumFrameRequestTime = 333, // The minimum amount of time to allow each request to timeout in (Further successful frames will not reduce the delay past this number in milliseconds)
        $MaximumRenderedFrames = 60,    // The max amount of frames each JpegStream will retain by default
        $Canvas2dSupport = !!window.CanvasRenderingContext2D;     // Determines if Canvas 2d is available for use. (Maybe mobile browsers will have false positive here due to incorrect implementation)


    //A Constant representing the events each JpegStream Class will have
    this.$JpegStreamEvents = {
        //Fired when a frame is downloaded successfully
        'onsuccess': function (request, frame) { /*ToDo*/ },
        //Fired when a frame failes to download
        'onfail': function (request, frame) { /*ToDo*/ },
        //Fired when a frame download is canceled
        'onabort': function (request, frame) { /*ToDo*/ },
        //Fired when the JpegStream has downloaded minRequiredFrames
        'onstreamready': function () { /*ToDo*/ },
        //Fired when the JpegStream has maxStoredFrames in completedFrames
        'onstoragefull': function () { /*ToDo*/ },
        //Fired when the failureCounter is equal to maxFailures
        'onmaxfailures': function () { /*ToDo*/ },
        //Fired when the JpegStream is played
        'onplay': function () { /*ToDo*/ },
        //Fired when the JpegStream is paused
        'onpause': function () { /*ToDo*/ },
        //Fired when the JpegStream is stopped
        'onstop': function () { /*ToDo*/ },
        //Fired when the JpegStream play direction is changed
        'ondirectionchange': function () { /*ToDo*/ },
        //Fired when the JpegStream is advanced by a frame and the frame is rendered successfully
        'onframerender': function () { /*ToDo*/ },
        //Fired when the JpegStream has reached the restart either by error or due to the stream reaching the end
        'onrestart': function () { /*ToDo*/ },
        //Fired when the JpegStream has reached maxStoredFrames
        'oncleanup': function () { /*ToDo*/ },
        //Fired when the JpegStream has started buffering
        'onbuffer': function () { /*ToDo*/ },
        //Fired when the displaySurface of the JpegStream is changed
        'onsurfacechange': function () { /*ToDo*/ }
    };

    /*
    Class JpegStream
    Uses a Request to download data from a remote uri which normally contains image data which the browser can natively render with an Image element.
    After a request is successful the Class creates a new Image element and injects it into the displaySurface given in the options.
    */
    this.JpegStream = new Class({
        Implements: [Options, Events],
        options: {
            //The uri which will be quantified with a random GET varaible on each request
            baseUri: 'http://',
            //The option indicating if the stream is paused
            paused: false,
            //The option indicating if the stream is stopped
            stopped: false,
            //The option indicating if the stream is playing
            playing: false,
            //The option indicating if the stream is to start buffering automatically
            autoBuffer: true,
            //The option indicating if the stream is to start playing automatically
            autoPlay: true,
            //The option indicating if the stream is to stop downloading automatically on maxStoredFrames
            autoStop: true,
            //The option indicating if the stream is to restart playing automatically either on error or at the end of the stream
            restartPlay: true,
            //The option indicating the amount of Milliseconds to delay after reaching the restart event in Milliseconds
            restartDelayMS: 3000,
            //The option indicating the maximum amount of failures each the class may encounter before stopping the retrival of frames and firing the restart event
            maxFailures: 5,
            //The option indicating how many failures have currently occured
            failureCounter: 0,
            //The option which specifies how many frames to download before playing
            minRequiredFrames: 10,
            //The option which specifies the maximum amount of frames to hold in the completedFrames member before cleaning up
            maxStoredFrames: 60,
            //The option which specifies the frames successfully downloaded from the stream
            completedFrames: [],
            //The option which specifies the frames successfully rendered from the stream
            renderedFrames: [],
            //The option which is allocated for each frameRequest
            frameRequest: u,
            //The option which specifies how many milliseconds to delay each frame request
            frameRequestDelay: 700,
            //The option which specifies how much to increment the frameRequestDelay by when a failure on frame download occurs in Milliseconds
            failureIncreaseMS: 100,
            //The option which specifies how much to decrease the frameRequestDelay by when a successful frame download occurs in Milliseconds
            successDecreaseMS: 15.3,
            //The option which specifies where to draw the new frames
            displaySurface: u,
            //The option which specifies how to iterate completed frames in a loop, -1 indicates reverse, etc...            
            streamAdvanceDirection: 1
        },
        //Constructor
        initialize: function (options) {
            //Set the options from the provided options
            this.setOptions(options);
            //Add the standard events
            this.addEvents($JpegStreamEvents);
            //Check if the stream should start buffering
            if (this.options.autoBuffer) this.fireEvent('onbuffer');
        },
        /****    Methods     ****/

        //Gets the value of the minRequiredFrames member which is used to determine when the stream can begin playing automatically
        getMinRequiredFrames: function () { return this.options.minRequiredFrames; },

        //Sets the value of the minRequiredFrames member which is used to determine when the stream can begin playing automatically
        setMinRequiredFrames: function (value) {
            //Ensure value is Number
            if (!Type.isNumber(value)) return;
            //Set the options member
            this.options.minRequiredFrames = value;
            //Return this
            return this;
        },

        //Gets the value of the maxStoredFrames member which is used to determine if more buffering should occur from the stream
        getMaxStoredFrames: function () { return this.options.maxStoredFrames; },

        //Sets the value of the maxStoredFrames member which is used to determine if more buffering should occur from the stream
        setMaxStoredFrames: function (value) {
            //Ensure value is Number
            if (!Type.isNumber(value)) return;
            //Set the options member
            this.options.maxStoredFrames = value;
            //Return this
            return this;
        },

        //Gets the value of the completedFrames member which is used to store frames brokered from the stream
        getCompletedFrames: function () { return this.options.completedFrames; },

        //Sets the value of the completedFrames member which is used to store frames brokered from the stream, **returns the old completedFrames**
        setCompletedFrames: function (value) {
            //Ensure value is a instance of Request
            if (Type.isArray(value)) return;
            //Allocate memory to return the old completedFrames member value
            var result = this.options.completedFrames;
            //Set the options member
            this.options.completedFrames = value;
            //Return the old completedFrames
            return result;
        },

        //Gets the value of the frameRequest member which is used to broker frames from the stream
        getFrameRequest: function () { return this.options.frameRequest; },

        //Sets the value of the frameRequest member which is used to broker frames from the stream
        setFrameRequest: function (value) {
            //Ensure value is a instance of Request
            if (value instanceof Request) return;
            //Set the options member
            this.options.frameRequest = value;
            //Return this
            return this;
        },

        //Gets the value of the frameRequestDelay member which is used to determine the amount of delay before retrieving the next frame from the stream
        getFrameRequestDelay: function () { return this.options.frameRequestDelay; },

        //Sets the value of the frameRequestDelay member which is used to determine the amount of delay before retrieving the next frame from the stream
        setFrameRequestDelay: function (value) {
            //Ensure value is a number
            if (!Type.isNumber(value)) return;
            //Set the options member
            return this.options.frameRequestDelay = value;
        },

        //Gets the value of the failureIncreaseMS member which is used to increase the amount of delay before retrieving the next frame from the stream
        getFailureIncreaseMS: function () { return this.options.failureIncreaseMS; },

        //Sets the value of the failureIncreaseMS member which is used to decrease the amount of delay before retrieving the next frame from the stream
        setFailureIncreaseMS: function (value) {
            //Ensure value is a number
            if (!Type.isNumber(value)) return;
            //Set the options member
            this.options.failureIncreaseMS = value;
            //Return this
            return this;
        },

        //Gets the value of the successDecreaseMS member which is used to decrease the amount of delay before retrieving the next frame from the stream
        getSuccessDecreaseMS: function () { return this.options.successDecreaseMS; },

        //Sets the value of the successDecreaseMS member which is used to decrease the amount of delay before retrieving the next frame from the stream
        setSuccessDecreaseMS: function (value) {
            //Ensure value is a number
            if (!Type.isNumber(value)) return;
            //Set the options member
            this.options.successDecreaseMS = value;
            //Return this
            return this;
        },

        //Gets the value of the displaySurface member which is used to render new frames
        getDisplaySurface: function () { return this.options.displaySurface; },

        //Sets the value of the displaySurface member which is used to render new frames
        setDisplaySurface: function (value) {
            this.options.displaySurface = value;
            //Return this
            return this;
        },

        //Gets the value of the streamAdvanceDirection member which is used on the iteration of the compeltedFrames in the play or frame advance logic
        getStreamAdvanceDirection: function () { return this.options.streamAdvanceDirection; },

        //Sets the value to the streamAdvanceDirection member which contains the iteration of the completedFrames in the play or frame advance logic
        setStreamAdvanceDirection: function (value) {
            //Ensure value is a number
            if (!Type.isNumber(value)) return;
            //Set the options member
            this.options.streamAdvanceDirection = value;
            //Return this
            return this;
        }
    });

    //Something I wrote for a example on why jQuery sucks @ http://stackoverflow.com/questions/10619972/removing-some-html-code-using-jquery/10620049#10620049
    //and block rendering is also sucky but not suckier

    ~function anonymous() {
        start = new Date(), html = [document.createComment('Begin - AutoGenerated ' + start.toDateString() + '@' + start.toTimeString()),
        document.createElement('div'),
        document.createComment('End - AutoGenerated')];

        function callOffset(object, attributes, offset/* = setAttribute, verify = false*/) {
            if (!object) return;
            offset = offset || 'setAttribute',
            type = typeof object[offset],
            verify = arguments[3] || false;
            if (verify === true && type === 'undefined') throw 'Object does not contain offset "' + method + '"!';
            else return (object[attribute].apply(attributes[attribute], object) || (object[attribute] = attributes[attribute]));
        }

        (function Sleep(anElementArray, whatToDo) { for (var zZz in whatToDo) callOffset(anElementArray[1], whatToDo[zZz]) })(html, [
            { setAttribute: ['innerHTML', '<b> I am smart </b>'] },
            ['innerHTML', '<h1> NOT !!!</h2>'],
            ['setAttribute', ['innerHTML', '<b> I am smart </b>']]
        ]);
    } ();


})(window, document, undefined, null, document.id, MooTools.Common);