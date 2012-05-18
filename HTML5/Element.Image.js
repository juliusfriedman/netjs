 /*
HTML Element.Image Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.Image enchancements to DOM Image
Created: 02/18/2011
Authors:
ASTI Transportation :
                    Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
                    
globals: win = window, doc = document, undef = undefined, brow = MooTools.Browser
*/
~function(win, doc, undef, m) {

    //If we do not have MooTools then we should not do anything further
    if (!m || !m.elementConstructor) return;

    //Utility Types and Functions for Element.Image
    var $Element$Image = {
        //The various types an Image can have
        $imageType: {
            invalid: -1,
            gif47: 0,
            gif49: 1,
            gif: gif47 | gif89,
            png: 2,
            bmp: 4,
            jpg: 8,
            other: 16,
            unknown: other,
            $getImageType: function($imageElement) {
                if (typeOf($imageElement) === Types.TypeOfElement) {
                    if (!$imageElement.$imageType === $Element$Image.$imageType.other) return;
                    //Determine if we have binary data and if we can determine the image type by looking at it
                    if (!$imageElement.binaryData) {
                        var src = imageElement.get('src');
                        var index = src.lastIndexOf('.');
                        $imageElement.$imageType = index >= 0 ? Function.from($Element$Image.$imageType[src.substring(index, src.length - index).toLowerCase()]) : Function.from($Element$Image.$imageType.other);
                    } else if ($imageElement.binaryData[0] == 0xff && $imageElement.binaryData[1] == 0xd8) {
                        $imageElement.$imageType = $Element$Image.$imageType.jpg;
                    } else if ($imageElement.binaryData[0] == 0x42 && $imageElement.binaryData[1] == 0x4d) {
                        $imageElement.$imageType = $Element$Image.$imageType.bmp;
                    } else if ($imageElement.binaryData[0] == 0x47 && $imageElement.binaryData[1] == 0x49 && $imageElement.binaryData[1] == 0x38) {
                        $imageElement.$imageType = $Element$Image.$imageType.gif;
                    } else {
                        $imageElement.$imageType = $Element$Image.$imageType.unknown;
                    };
                };
            }
        },
        $imageBase: {
            $imageType: $imageType.other,
            //If the image is part of a series this will indicate the position in the series, otherwise it will be 0
            index: Number,
            //The DateTime the image was loaded
            loadTime: Date,
            //The binary imageData of the image
            imageData: Array,
            //The size in bytes of the image
            size: Number,
            //A User defined object on the image
            UserData: Object,
            getSize: function() {
                return this.size;
            } .overloadSetter(),
            getImageData: function() {
                return this.imageData;
            } .overloadSetter(),
            getLoadTime: function() {
                return this.loadTime;
            } .overloadSetter(),
            getIndex: function() {
                return this.index;
            } .overloadSetter()
        },
        //should use get_ImageType
        $toDataURL: function(binaryData) {
            binaryData = binaryData || [0, 0, 0];

            var imageType = $Element$Image.$imageTypes.invalid;

            switch (binaryData[0]) {//get_ImageType
            };

            return 'data://imageType:' + "" + ':' + binaryData; ;
        },
        $drawImageFromSrc: function(videoElement, canvas, imgSrc) {
        } .overloadSetter(),
        $drawImageFromData: function(videoElement, canvas, binaryData) {
            $Element$Image.$drawImageFromSrc(videoElement, canvas, $Element$Image.$toDataURL(binaryData));
        } .overloadSetter()
    };

    //The Events of the Image Element
    var $ImageEventPrototypes = {
        load: function(e) {
            if (e) e.stop();
            this.fireEvent('onbeforeload');
        },
        errer: function(e) {
            if (e) e.stop();
            this.fireEvent('onerror');
        },
        onBeforeLoad: function(e) {
            if (e) e.stop();
            this.fireEvent('onload');
        },
        onLoad: function() {
            this.fireEvent('onbeforeload');
            this.loadTime = new Date();
            this.fireEvent('onafterload');
        },
        onAfterLoad: function() {
            this.$imageType = Function.from($Element$Image.$imageType.$getImageType(this));
        },
        onError: function() {
            this.src = "missingImage";//get directory and try directory/missingImage.png
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
    //            case 'image': return Element.Image(options);
    //            default: return elementConstructor(type, options);
    //        };
    //    };

    //    Element = Object.merge(Element, elementConstructor);

    //Provide the Element.Image
    Element.Image = function(options) {

        //Create the Image Element
        var imageElement = new m.elementConstructor('image', options || {});

        //AddEvents
        common.bindEvents($ImageEventPrototypes, imageElement);

        //Return the result
        return imageElement;
    };

    //Implement our geometry
    Element.Image.implement($Element$Image.$imageBase);

    //Determine if we need to Augment Mooml for our new elements
    if (window.Mooml) {
        window.Mooml.tags.img = window.Mooml.tags.image = Element.Image;
    };

} (window, document, undefined, MooTools);