/*
http://www.w3schools.com/html5/tag_form.asp
HTML Element.Form Plug-In
Part of the Element.HTML5 Addon Pack
Compatibility IE 6-9(/Mobile), Firefox, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3
Provides: Element.Form enchancements to DOM Form
Created: 02/18/2011
Authors:
ASTI Transportation :
Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
Andrew Larkin[andrew@alarkindesign.com, andrew@asti-trans.com] - Web Developer
globals: win = window, doc = document, undef = undefined, m = MooTools
*/
~function (win, doc, undef, m) {

    //If we do not have MooTools then we should not do anything further
    if (!m || !m.elementConstructor) return;

    var $validationSupport = ('novalidate' in document.createElement('form')),
    $autofocusSupport = ('autofocus' in document.createElement('form'));
    Browser.Features.ValidationSupport = $validationSupport;
    Browser.Features.AutoFocusSupport = $autofocusSupport;

    Element.NativeEvents['invalid'] = 2

    var $Element$Form = {
        novalidate: false,
        autocomplete: false,
        validated: false,
        required: [],
        passed: [],
        failed: [],
        submitContinue: null
    },
    $EventPrototypes = {
        enable: function (e) {
            this.disabled = false;
            this.setAttribute('disabled', false);
            this.getElements('input').each(function (input) {
                input.fireEvent('enable');
            });
        },
        disable: function (e) {
            this.disabled = true;
            this.setAttribute('disabled', true);
            this.getElements('input').each(function (input) {
                input.fireEvent('disable');
            });
        },
        submit: function (e) {
            if (e) e.stop();
            this.fireEvent('beforevalidate');
        },
        beforeValidate: function () {
            //this.required = this.toElement().getElements('*.[required] *.[formnovalidate = false]');
            this.required = this.getElements('*[required=true]');
            this.required.include(this.getElements('*[formnovalidate = false]'));
            this.required.include($$('*.input[form = \'' + this.name + '\''));
            this.passed = [];
            this.failed = [];
            this.fireEvent('onvalidate');
        },
        onValidate: function () {
            Array.each(this.required, function (requirement, index) {
                if (!requirement.required || requirement.disabled || requirement.getParent().disabled) return;
                var result = false;
                if (requirement.type && $ValidationRules[requirement.pattern]) {
                    //If there is a built in pattern the utilize it
                    result = $ValidationRules[requirement.pattern].test(requirement.value); //To replicate the behavior of browsers like Chrome we test the type of the input first against our Validation rules
                } else if (requirement.pattern) {
                    //If the type did not have a validation pattern proceed with checking against the pattern provided (if any)
                    result = new RegExp(requirement.pattern).test(requirement.value); //Make a regular expression object out of the provided pattern                    
                } else result = !requirement.value.isNullOrEmptyOrEqual(requirement.get('placeholder') || ''); //We want to know if the value is *not* null or empty or the same as the placeholder
                if (result) this.passed.include(requirement);
                else this.failed.include(requirement);
            }, this);
            this.validated = !this.failed.length;
            this.fireEvent('aftervalidate');
        },
        afterValidate: function () {
            if (this.failed.length) this.fireEvent('invalid')
            else this.fireEvent('validationsucceeded');
        }
    },
    $ValidationRules = { //Validation rules for input types
        //Some Regexps Shamelessly lifted from Scott Gonzalez via the Bassistance Validation plugin http://projects.scottsplayground.com/email_address_validation/ or //http://regexlib.com/DisplayPatterns.aspx?cattabindex=0&categoryId=1
        email: /((([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-zA-Z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?/,
        //email: /^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))$/,
        url: /(https?|ftp):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/,
        //uri: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/,
        //phoneNumber: /(\s*\(?0\d{4}\)?(\s*|-)\d{3}(\s*|-)\d{3}\s*)|(\s*\(?0\d{3}\)?(\s*|-)\d{3}(\s*|-)\d{4}\s*)|(\s*(7|8)(\d{7}|\d{3}(\-|\s{1})\d{4})\s*)/,
        //phone: /([\+][0-9]{1,3}([ \.\-])?)?([\(]{1}[0-9]{3}[\)])?([0-9A-Z \.\-]{1,32})((x|ext|extension)?[0-9]{1,4}?)/,
        //creditCard: /^((4\d{3})|(5[1-5]\d{2}))(-?|\040?)(\d{4}(-?|\040?)){3}|^(3[4,7]\d{2})(-?|\040?)\d{6}(-?|\040?)\d{5}/,
        //uuid: /^[{|\(]?[0-9a-fA-F]{8}[-]?([0-9a-fA-F]{4}[-]?){3}[0-9a-fA-F]{12}[\)|}]?$/,
        //integer: /-?\d+/,
        //number: /^(\d|-)?(\d|,)*\.?\d*$/,
        number: /-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?/,
        color: /^#[a-fA-F0-9]{6}/,
        //alpha: /[a-zA-Z]+/,
        //alphaNumeric: /\w+/,
        //alphaNumeric: /^[a-zA-Z0-9]+$/,
        //character: /^[a-zA-Z]$/,
        date: /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
        //date: /^(((0?[1-9]|1[012])/(0?[1-9]|1\\d|2[0-8])|(0?[13456789]|1[012])/(29|30)|(0?[13578]|1[02])/31)/(19|[2-9]\\d)\\d{2}|0?2/29/((19|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|(([2468][048]|[3579][26])00)))$/,
        //time: /^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])(:([0-5]?[0-9]))?$/,
        //dateTime: /(?! (?:10(?<sep>[-./])(?:0?[5-9]|1[0-4])\k<sep>(?:1582))| (?:0?9(?<sep>[-./])(?:0?[3-9]|1[0-3])\k<sep>(?:1752))  ) (?n:^(?=\d) ( (?<month> (0?[13578])|1[02]| (0?[469]|11)(?!.31)|  0?2 (?(.29) (?=.29. (?! (?:(?:1[^0-6]|[2468][^048]|[3579][^26])00) ) (?:(?:(?:\d\d) (?:[02468][048]|[13579][26]) (?!\x20BC))|(?:00(?:42|3[0369]|2[147]|1[258]|09)\x20BC)) )| (?!.3[01]) ) ) (?<sep>[-./]) (?<day>0?[1-9]|[12]\d|3[01]) \k<sep> (?!0000) (?<year>(?=(?:00(?:4[0-5]|[0-3]?\d)\x20BC)|(?:\d{4}(?:\z|(?:\x20\d))))\d{4}(?:\x20BC)? ) (?(?=\x20\d)\x20|$))? (?<time> ( (0?[1-9]|1[012]) (:[0-5]\d){0,2} (?i:\x20[AP]M)  )| ( [01]\d|2[0-3]) (:[0-5]\d){1,2}) ?$)/,
        //timeZone: /[-+]((0[0-9]|1[0-3]):([03]0|45)|14:00)/
    };
    $Element$Form$Add$Event = function (type, fn, implements) {
        if (type === 'submit') type = 'validationsucceeded';
        Element.addEvent(this, type, fn, implements);
    };
    //Add a new Element Type Constructor for Form
    //Adds Form.Validatior to all form DOM elements
    Element.Form = function (htmlAttributes) {
        var el = new m.elementConstructor('form');
        if (!$validationSupport) {
            m.Common.bindEvents($EventPrototypes, el);
            el.addEvent = $Element$Form$Add$Event.bind(el);
        }
        el.set(htmlAttributes);
        return el;
    };
    //If there is no validation support implement our geomentry
    if (!$validationSupport) {
        m.elementConstructor.implement($Element$Form);
        //Also add the element properties
        //if there is no support, we'll add the property to Element.Properties    
        Element.Properties.novalidate = {
            get: function () {
                return this.getAttribute('novalidate') || this.novalidate;
            },
            set: function (value) {
                this.setAttribute('novalidate', value);
            },
            erase: function () {
                this.set('novalidate', null);
            }
        };
    };

    //If there is no autofocus support find all forms and focus the first autofocus element
    if (!$autofocusSupport) {
        win.addEvent('domready', function () {
            var focusables = $$(('form.input[autofocus]'));
            if (focusables && focusables.length) focusables[0].focus();
            focusables = null;
        });
        //Also add the element properties
        //if there is no support, we'll add the property to Element.Properties    
        Element.Properties.autofocus = {
            get: function () {
                return this.getAttribute('autofocus') || this.autofocus;
            },
            set: function (value) {
                this.setAttribute('autofocus', value);
            },
            erase: function () {
                this.set('autofocus', null);
            }
        };
    }

    //We can't intercept the Mooml function here.  If we do, any children elements will not not render properly.
    //if (Mooml) Mooml.engine.tags.form = Element.Form;

} (window, document, undefined, MooTools);