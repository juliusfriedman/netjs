/*
http://www.w3schools.com/html5/tag_input.asp
HTML Element.Input Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.Input enchancements to DOM Input
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[ , ] - Web Developer
globals: win = window, doc = document, undef = undefined, m = MooTools
*/
~function (win, doc, undef, m) {

    //If we do not have MooTools then we should not do anything further
    if (!m) return;

    var prepend = '',
    postpend = '?' + Date.now();
    if (window.location.toString().match('DevelopmentTesting')) prepend = '../';

    //Why is this not using the Paths constant?
    //Because paths is loaded with Application, which will not have been loaded at this point.
    //NOTE: Personally I think these files should not be loading any dependant script as it just invites race conditions. This script should be moved
    //to the Element.Date.js file ~AL

    //Combined the Datepicker files into one js file to avoid issues with dependancies not loading fast enough
    //Asset.javascript(prepend + 'resources/javascript/Dependencies/datepicker/Picker_combined.js' + postpend);
    //Asset.css(prepend + 'resources/javascript/Dependencies/datepicker/datepicker.css' + postpend);

    //Add validation for input types

    var supportsDateTimeInput = true,
    supportsEmailInput = true;

    try {
        document.createElement('input').type = 'datetime';
    } catch (E) { supportsDateTimeInput = false; }

    try {
        document.createElement('input').type = 'email';
    } catch (E) { supportsEmailInput = false; }

    var $Element$Input = {
        autocomplete: false,
        autofocus: false,
        //form: null,
        formaction: null,
        formenctype: null,
        formmethod: null,
        formnovalidate: false,
        formtarget: null,
        //height: 0,
        list: null,
        max: null,
        maxlength: null,
        multiple: false,
        pattern: null,
        placeholder: null,
        required: false,
        step: 0
        //width: 0
    };

    var $Element$Input$Password = {
        $TextFacade: {
            events: {
                blur: function (e) {
                    if (e) e.stop();
                    var passwordElement = this.retrieve('passwordElement');
                    if (passwordElement && !passwordElement.getParent() && this.getParent()) {
                        passwordElement.inject(this, 'after');
                        //this.getParent().grab(passwordElement);
                        passwordElement = null;
                    };
                },
                focus: function (e) {
                    if (e) e.stop();
                    var passwordElement = this.retrieve('passwordElement');
                    if (passwordElement && !passwordElement.getParent() && this.getParent()) {
                        passwordElement.inject(this, 'after');
                        //We don't want to validate the textElement, just the password element
                        if (this.required) {
                            passwordElement.setProperty('required', true);
                            this.setProperty('required', false);
                        }
                    };
                    if (passwordElement) {
                        passwordElement.style.cssText = this.style.cssText;
                        this.setStyle('display', 'none');
                        passwordElement.focus();
                        passwordElement = null;
                    };
                },
                disable: function (e) {
                    //Stop the event if present
                    if (e) e.stop();
                    //Set the disabled attribute
                    this.setAttribute('disabled', true);
                    //Get the password element to ensure it is also disabled
                    var passwordElement = this.retrieve('passwordElement');
                    //If there is a password element
                    if (passwordElement) {
                        passwordElement.setAttribute('disabled', true);
                        passwordElement = null;
                    };
                },
                enable: function (e) {
                    //Stop the event if present
                    if (e) e.stop();
                    //Set the disabled attribute
                    this.setAttribute('disabled', false);
                    //Get the password element to ensure it is also disabled
                    var passwordElement = this.retrieve('passwordElement');
                    //If there is a password element
                    if (passwordElement) {
                        passwordElement.setAttribute('disabled', false);
                        passwordElement = null;
                    };
                }
            }
        },
        events: {
            blur: function (e) {
                if (e) e.stop();
                var textElement = this.retrieve('textElement');
                if (textElement && this.value.isNullOrEmptyOrEqual(this.get('placeholder'))) {
                    textElement.setStyle('display', (this.getStyle('display')) || 'inline');
                    this.setStyle('display', 'none');
                    textElement = null;
                };
            }
        }
    };

    //Add new Element Type Constructor for Input
    //Creates a new Input Element as well as adding any event handlers
    Element.Input = function (htmlAttributes) {
        htmlAttributes = htmlAttributes || {};
        var inputType = htmlAttributes['type'] || 'text',
        placeHolder = htmlAttributes['placeholder'];

        //Determine if alt or title is not set and set to the placeholder
        //this will help with autofocus
        if (!htmlAttributes['title'] && placeHolder) htmlAttributes['title'] = placeHolder;
        if (!htmlAttributes['alt'] && placeHolder) htmlAttributes['alt'] = placeHolder;

        switch (inputType) {
            case 'button': return new Element.Button(htmlAttributes);
            case 'number': { } //fall through
            case 'color': { } //fall through
            case 'email':
                {
                    if (!supportsEmailInput) htmlAttributes.type = 'text';
                    var el = new m.elementConstructor('input', htmlAttributes);
                    if (!Browser.Features.Placeholder) Element.Properties.placeholder.bind(el);
                    //if the type of the element is not supported by the browser, define a pattern to be validated for this input
                    if (el.type !== inputType && !htmlAttributes['pattern']) el.setProperty('pattern', ASTI.Utilities.RegExLibrary[inputType].source);
                    return el;
                }
            case 'date':
                {
                    if (!supportsDateTimeInput) htmlAttributes.type = 'text';
                    var el = new m.elementConstructor('input', htmlAttributes);
                    if (!Browser.Features.Placeholder) Element.Properties.placeholder.bind(el);
                    new DatePicker(el, {
                        minDate: htmlAttributes['min'] || null,
                        maxDate: htmlAttributes['max'] || null,
                        timePicker: false,
                        format: '%Y-%m-%d'
                    });
                    return el;
                };
            case 'datetime':
                {
                    if (!supportsDateTimeInput) htmlAttributes.type = 'text';
                    var el = new m.elementConstructor('input', htmlAttributes);
                    if (!Browser.Features.Placeholder) Element.Properties.placeholder.bind(el);
                    new DatePicker(el, {
                        minDate: htmlAttributes['min'] || null,
                        maxDate: htmlAttributes['max'] || null,
                        timePicker: true,
                        format: '%Y-%m-%dT%H:%MZ'
                    });
                    return el;
                };
            case 'password':
                {
                    //If there is no placeholder support then we need to ensure special care is taken for password fields to make the experience work across all browsers
                    if (!Browser.Features.Placeholder) {
                        //Create the password field
                        var passwordElement = new m.elementConstructor('input', htmlAttributes);
                        //Overwrite the type attribute
                        htmlAttributes['type'] = 'text';
                        //Create the Text Element to allow the default value on a password field as a property of the passwordElement
                        var textFacade = new m.elementConstructor('input', htmlAttributes),
                        //Get the displayStyle of the element created or 'inline' for a default
                        displayStyle = passwordElement.getStyle('display') || 'inline';
                        //Set the type back to what it was
                        //htmlAttributes['type'] = inputType;
                        //Set the value of the textElement so users can read what they need to input in the field
                        textFacade.value = passwordElement.get('placeholder') || '';
                        //Erase the name and id properties of the textElement since we will never need to reference it
                        textFacade.set({ name: '', id: '' });
                        //Override the setter on the textFacade so that it intercepts all attempts to override the type
                        var disabledProperties = ['id', 'type', 'name', 'value'];
                        textFacade.set = function (property, value) {
                            if (disabledProperties.contains(property)) return passwordElement.set(property, value);
                            if (property === 'placeholder') property = 'value';
                            var prop = window.Element.Properties[property];
                            (prop && prop.set) ? prop.set.call(this, value) : this.setProperty(property, value);
                        } .overloadSetter();
                        //Store the origional displayStyle of the property
                        passwordElement.store('displayStyle', displayStyle);
                        //Store the textElement on the passwordElement (cicular)
                        passwordElement.store('textElement', textFacade);
                        //Alias the passwordElement from the textElement
                        textFacade.store('passwordElement', passwordElement);
                        //Add events to the textElement so we can ensure the default text is readable on password elements
                        textFacade.addEvents($Element$Input$Password.$TextFacade.events);
                        //Add the event to the password element so the placeholder is displayed on blur
                        passwordElement.addEvent('blur', $Element$Input$Password.events.blur.bind(passwordElement));
                        //Return the newly created textFacade with placeholder property working as expected
                        return textFacade;
                    };
                    //Fall Through

                };
            case 'text':
                {
                    var el = m.elementConstructor('input', htmlAttributes);
                    el.setProperty('type', inputType);
                    if (!Browser.Features.Placeholder) Element.Properties.placeholder.bind(el);
                    return el;
                    //Fall through
                };
            default: return new m.elementConstructor('input', htmlAttributes);
        };
    };

    //Extend Element with the disabled property
    Element.Properties.disabled = {

        get: function () {
            return this.disabled;
        },

        set: function (value) {
            value = !!value;
            this.disabled = value;
            this.setAttribute('disabled', value);
            //I have determined checking the tag and all that shit is weak and expensive, just fire the event
            /*if (this.get('tag') === 'input' || this instanceof Element.Input)*/this.fireEvent(value ? 'enable' : 'disable');
        }

    };

    //m.elementConstructor.implement($Element$Input);
    //if (Mooml) Mooml.engine.tags.input = Element.Input;

} (window, document, undefined, MooTools);