/* ******************************************************************* 
Load dependancies for the application, including stylesheets
******************************************************************* */

(function (w, d, u, n, m) {
    try {
        if (!m) return;

        var prepend = '',
        postpend = '?' + Date.now();
        if (window.location.toString().match('DevelopmentTesting')) prepend = '../';

        /* *******************************
        * Dynamic Application Styles
        **********************************
        * Dynamically generates styles used specifically by the application
        *
        ******************************** */
        if (!d.getElement('style')) d.head.appendChild(DynamicCSS.createStyleSheet({ media: 'all' }));
        var Styles = {};

        Styles.mapContainer = DynamicCSS.addCSSRule('.mapContainer');
        Styles.mapContainer.style.display = 'block';
        Styles.mapContainer.style.background = '#fff none';
        if (Browser.trident && Browser.version < 9 && Browser.version > 5.5) {
            Styles.mapContainer.style.filter = 'progid:DXImageTransform.Microsoft.DropShadow(color=#50000000,offX=1,offY=4)';
        } else {
            Styles.mapContainer.style.boxShadow = '0px 4px 8px rgba(0,0,0,0.5)';
        };
        Styles.mapContainer.style.margin = '0px 10px 0px 10px';

        /* *******************************
        * Native Types
        **********************************
        * Defines the object types utilized by the application
        * ApplicationTypes should be here added to Native Types
        ******************************** */

        var NativeTypes = {
            TypeOfWindow: typeOf(window),
            TypeOfDocument: typeOf(document),
            TypeOfClass: typeOf(Class.prototype),
            TypeOfObject: typeOf(Object.prototype),
            TypeOfNumber: typeOf(Number.prototype),
            TypeOfString: typeOf(String.prototype),
            TypeOfBoolean: typeOf(Boolean.prototype),
            TypeOfFunction: typeOf(Function.prototype),
            TypeOfEvent: typeOf(Event.prototype),
            TypeOfDate: typeOf(Date.prototype),
            TypeOfArray: typeOf(Array.prototype),
            TypeOfNull: typeOf()
        };

        /* *******************************
        * Application Base Settings
        **********************************
        * The base settings of the application
        *
        ******************************** */

        var $App$Settings = {
            'URI': new URI(window.location),
            loadTime: new Date(),
            oldSettings: {
                dispose: function () {
                    Array.each(this.pageProjects, function (project) {
                        project.dispose();
                        this.pageProjects.erase(project);
                        delete project;
                    });
                    delete this.pageProjects;
                    this.pageProjects = [];
                    return;
                },
                //Make this work... if you need the power of Jay just ask but I want this to work!
                fixPoweredByImage: function () { //move to Map class and make work without recursion
                    $(m_Settings.defaultMapID).getElements('div.img').each(function (el) {
                        if (el.src && el.src.match('poweredby')) {
                            el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='crop', src='tcm/resources/images/asti.png')";
                            el.src = 'tcm/resources/images/asti.png';
                            el.set('src', 'tcm/resources/images/asti.png');
                            el.__src__ = 'tcm/resources/images/asti.png'; //setAttribute?
                            el.addEvent('click', window.open.pass('http://www.asti-trans.com'));
                        }
                    });
                }
            }
        };
        $App$Settings.debug = $App$Settings.URI.get('port') != '80';
        $App$Settings.paths = {
            root: $App$Settings.URI.get('scheme') + '://' + $App$Settings.URI.get('host') + ($App$Settings.debug ? ':' + $App$Settings.URI.get('port') : '')
        };
        $App$Settings.paths.applicationDirectory = $App$Settings.paths.root + $App$Settings.URI.parsed.directory.substring(0, $App$Settings.URI.parsed.directory.indexOf('/', 1)) + '/';
        $App$Settings.paths.resources = $App$Settings.paths.applicationDirectory + 'resources/';
        $App$Settings.paths.images = $App$Settings.paths.resources + 'images/';
        $App$Settings.paths.types = $App$Settings.paths.resources + 'javascript/Types/';
        $App$Settings.paths.modules = $App$Settings.paths.resources + 'javascript/Modules/';
        $App$Settings.paths.service = $App$Settings.paths.applicationDirectory + 'ASTIService.asmx/';
        $App$Settings.paths.XML = function (xmlFile) { xmlFile += '.xml'; return $App$Settings.debug ? 'http://208.11.154.237/tcm/resources/xml/' + xmlFile : $App$Settings.paths.root + '/tcm/resources/xml/' + xmlFile; };

        /* *******************************
        * User Class
        **********************************
        * Class instantiates a new User
        ******************************** */

        var User = w.User = new Class({
            TrackInstances: true,
            Implements: [Options, Events],
            /* Possible Events:
            * onRefresh
            * onBeforeRefresh
            * onAfterRefresh
            * onLogin
            * onLogout
            * 
            */
            options: {},
            //Fields
            loggedIn: false,
            userId: null,
            loginToken: null,
            //Constructor
            initialize: function (options) {
                this.setOptions(options)
            },
            //Destructor
            dispose: function () {
                this.token = null;
            },
            toElement: function (force) {
                //should be some sort of user control
                if (!this.element) {
                    //when a user is injected into the dom he has the following geometry
                    this.element = new Element('div', {});
                    this.element.store('user', this.token);
                };
                if (force && this.element) {
                    //Update the element
                };
                return this.element;
            },
            //Function getUserName (String) -- Utility function to get the username of this userObject without invading the options Member from far
            getUserName: function () {
                return this.options.username;
            },
            //Function to ensure that this instance of user has the correct type and properties
            refresh: function (callback, force) {
                //Ensure there is a callback, if there is not an empty function will be created from the given callback parameter
                callback = Function.from(callback);

                //Ascertain the scope of the this pointer
                var self = this;

                //Ensure we are dealing with a User object
                if (!self instanceof User) return;

                //Check for our __type member to be set correctly
                if (this.__type !== 'Classes.DataLayer.User' || force === true) {
                    ASTIService.GetUser(this, function (physical) { //where physical is the user or user session returned from the service request
                        if (physical.error) {
                            self.token = null;
                            return new DOMWindow.alert(self.logout.bind(self), { content: physical.Message, header: w.Application.stringResources.error });
                        };
                        if (self.token && !self.token === physical.loginToken) return self.logout();
                        self = Object.merge(self, (physical.User || physical));
                        callback.delay(0, callback, physical);
                    });
                }
            },
            //Bool - See <Service.UserHasPermission>
            hasPermission: function (permissionName, onComplete, optionalProjectId) {
                ASTIService.UserHasPermission(this, permissionName, onComplete, optionalProjectId);
            },
            //Bool[] - See <Service.UserHasPermissions>
            hasPermissions: function (permissionsArray, onComplete, optionalProjectId) {
                ASTIService.UserHasPermissions(this, permissionsArray, onComplete, optionalProjectId);
            },
            //Bool - See <Application.Callbacks.UserIsCurrentUser>
            isCurrentUser: function () {
                return w.Application.UserIsCurrentUser(this);
            },
            //Page forwarding performed in this class should be added as an event in Login.js
            login: function (username, password) {
                username = username.toLowerCase();
                if (this.isCurrentUser()) return this.refresh.call();
                this.username = username;
                var self = this;
                ASTIService.InvokeMethod('ChipsLoginUser', { Username: username, Password: password }, function (userSession) {
                    if (!userSession || userSession.error || !userSession.User) {
                        var loginResponse = d.id('loginResponse'); //needs to utilize the Event Manager control
                        //This check on the status member and the Message member is looking for a problem with the request
                        if (userSession.status && userSession.status !== 500 && userSession.status !== 200) loginResponse.set('text', Application.stringResources.noConnection);
                        else if (userSession.Message) {
                            //loginResponse.set('text', userSession.Message || Application.stringResources.error);
                            loginForm.fireEvent('invalid', userSession.Message || Application.stringResources.error);
                            return;
                        } else {//This should be done via some event on the loginForm
                            loginResponse.set('html', 'Login Successful!, Please wait...');
                        }
                    };
                    //Store the loginToken
                    self.token = self.loginToken = userSession.loginToken;

                    //Store the userId
                    self.userId = userSession.userId

                    //Ensure the session is properly given to the client in the correct member.
                    self.Session = userSession;
                    //This line is intended to merge the members returned from the Session object to this instance of the User class.
                    //Since there is no User being returned from the Session at the current time then it will have to be retrieved at another time.
                    //When the logic and default pages work together this logic below will make much more sense, until that time it is here as a reminder.

                    //We require a User object from the service as well so we make a request to recieve one and merge it with ourself.
                    //If the current page is not login then we will skip this call for now.
                    if (!window.location.toString().contains('login')) {
                        //Make service call to get real Classes.DataLayer.User object using the userSession
                        ASTIService.GetUser(self, function (userObject) {
                            //When we recieve the userObject we ensure an error has not occured and then we place it unto the User member
                            self.User = user;
                            //We then merge the properties with ourself.
                            self = Object.merge(self, userSession.User);
                        });
                    };

                    self.loggedIn = true;
                    Cookie.write('login', self.token);

                    //Not required but hacked up for now
                    Cookie.write('loginToken', self.token);
                    Cookie.write('userId', self.userId);

                    self.fireEvent('login');
                });
            },
            //Void - Logs the user out at the Service Level and triggers a logout event
            logout: function () {
                var self = this;
                ASTIService.InvokeMethod('ChipsLogoutUser', { sessionToken: this.token }, function (result) {
                    //this.dispose();
                    Cookie.dispose('login');
                    self.fireEvent('logout');
                });
            }
        });

        /* *******************************
        * Application Class
        **********************************
        * This class instantiates an instance of the application
        * and binds events
        ******************************** */
        //Application Object
        //Contains Settings of Application
        var Application = new Class({
            Implements: [Options, Events],
            Singleton: true,
            // Events
            /* 
            * onUserLogin
            * onUserLogout
            * onApplicationReady
            * onResourceLoaded
            * onBeforeResize
            * onResize
            * onAfterResize
            */
            //Options 
            options: {},
            //Fields  
            users: {},
            sessionTimeout: null, //the session timeout interval
            ready: false, //ready state of the applictaion            
            Exceptions: [],
            Console: {
                log: function (value) {
                    if (window.console) window.console.log(value);
                }
            },
            Resources: [],
            LoadedResources: null,
            Types: NativeTypes,
            Exports: {},
            //Namespaces: {},
            Modules: null,
            Settings: $App$Settings, //SettingsBase
            Map: null, //the main application map
            currentUser: null, //new User({ username: 'Guest' }),
            logoutTimer: null,
            //Constructor
            initialize: function (options) {
                this.setOptions(options);
                this.LoadedResources = [];

                this.addEvents({
                    'applicationReady': function () {
                        setTimeout((function () {
                            w.fireEvent('applicationReady');
                        }), 10); // Give time to parse loaded scripts and styles
                        this.ready = true;
                    },
                    'resourceLoaded': function () {
                        if (this.LoadedResources.length >= this.Resources.length) {
                            this.fireEvent('afterResourceLoaded'); //This event will always be fired when all resources queued up have been loaded
                            if (!this.ready) this.fireEvent.delay(100, this, 'applicationReady'); //This event only fires when the Application is initialized for the first time
                        }
                    },
                    'userLogin': function () {
                        this.Modules.loadModule('User');

                        //Send //Authenticate event to message hub

                        //Application Timeout Start
                        if (!this.logoutTimer) this.logoutTimer = new IdleTimer($(document.body), { timeout: ASTI.Utilities.Date.toMilliseconds(59, ASTI.Utilities.Date.Minutes) });
                        var $oneMinuteWarning;
                        this.logoutTimer.addEvents({
                            'idle': function () {
                                if ($oneMinuteWarning) return;
                                var countdown = 60;
                                new DOMWindow.alert(function () {
                                    if ($oneMinuteWarning) {
                                        clearInterval($oneMinuteWarning);
                                        $oneMinuteWarning = null;
                                    }
                                }, { header: 'Your Session Is About To Expire', content: this.stringResources.sessionExpire + 'You will be logged out in <span id="logoutCountdown">' + countdown + '</span> seconds.' });
                                $oneMinuteWarning = setInterval(function () {
                                    if (!(--countdown)) {
                                        clearInterval($oneMinuteWarning);
                                        w.Application.currentUser.logout();
                                    } else
                                        document.id('logoutCountdown').set('html', countdown);
                                }, 1000);
                            } .bind(this)
                        });
                        this.logoutTimer.start();
                    },
                    'userLogout': function () {
                        if (this.logoutTimer) this.logoutTimer.stop();
                        delete this.currentUser;
                        //need some way of identifying scripts defined by the user login so we can unload those scripts on logout.
                    }
                });

                w.addEvent('resize', this.resize.bind(this));
                if (!window.location.toString().match('DevelopmentTesting')) {
                    if (!window.location.toString().toLowerCase().match('login')) w.addEvent('unload', this.dispose.bind(this));
                }

                //Ensure a console is present
                if (typeof window.console === undefined) window.console = Application.Console;

            },
            //Destructor
            dispose: function () {
                //unload all resources
                $$('script').destroy();
                this.removeEvents(); //remove all events
                //logout user
                if (this.Settings.paths.root.contains('localhost')) return; //if we are debugging, do not log out this user
                if (this.currentUser && this.currentUser.loggedIn) this.userLogout();
            },
            //Function resize -- Event handler for resize of Window 
            //e -- the Event Object
            resize: function (e) {
                if (e) e.stop();
                this.fireEvent('beforeResize');
                this.fireEvent('resize');
                this.fireEvent('afterResize');
            },
            userLogin: function (username, password) {
                //If there is no currentUser on the Application object
                if (!this.currentUser) {
                    //Create a new User object and then add the required events to ensure when the user logs in or out that these events will be fired.
                    this.currentUser = new User();
                    this.currentUser.addEvents({
                        'login': this.fireEvent.pass('userLogin', this),
                        'logout': this.fireEvent.pass('userLogout', this)
                    });
                }
                //Call the login method on the user created.
                this.currentUser.login(username, password)
            },
            userLogout: function () {
                if (!this.currentUser) return;
                this.currentUser.logout();
            },
            //Function privilegedUser (Boolean) -- A function to determine if there is a user which is logged in.
            //If there is no currentUser or the currentUser is a guest then false is returned
            privilegedUser: function () {
                //Create a boolean result which is true if the currentUser member of this object (Application) is not cohersibly equal to null or undefined.
                //Also ensure the currentUser member is an instance of the User class
                var result = this.currentUser != n && this.currentUser != u && this.currentUser instanceof User;
                //If there is a false evaluation then return the indication of the user not being privileged
                if (!result) return false;
                //Ensure the currentUser has a member loggedIn which is exactly equal to true
                result = this.currentUser.loggedIn === true;
                //If there is a false evaluation return the indication of the user not being privileged
                if (!result) return false;
                //Ensure the currentUser has a token which is not null or undefined as well as the currentUser has a token which is not equal to the default Empty UUID
                result = this.currentUser.token != n && this.currentUser.token != u && this.currentUser.token != ASTI.Utilities.UUID.EmptyUUID;
                //Return the result which indicated if the user is logged in or not (Should be true unless the user is a Guest)
                result = this.currentUser.getUserName() !== 'Guest';
                return result;
            },
            //Void - Refreshes current user involves a service call under the hood
            refreshCurrentUser: function () {
                this.currentUser.refresh();
            },
            //Bool - Determines weather or not the given user is the current user of this Application
            UserIsCurrentUser: function (user) {
                if (!user) return false;
                var applicationToken = Cookie.read('login');
                return applicationToken && user.token == applicationToken;
            },
            loadScript: function (src, dependsArray, noCache) {
                if (!src) return;
                src = Array.from(src);
                dependsArray = Array.from(dependsArray);
                this.loadScripts(src, dependsArray, noCache);
            },
            loadScripts: function (srcArray, dependsArray, noCache) {
                noCache = noCache === false ? false : true;
                srcArray = Array.from(srcArray);
                dependsArray = Array.from(dependsArray);
                dependsArray = Array.filter(dependsArray, function (dependScript) {
                    return !Application.LoadedResources.contains(dependScript);
                });
                if (dependsArray.length) return this.loadScripts.delay(0, this, [srcArray, dependsArray, noCache]);
                Array.each(srcArray, function (src) {
                    if (Application.Resources.contains(src)) return;
                    Application.Resources.include(src); //Include the unversioned name
                    if (noCache) src += '?' + Date.now();
                    Asset.javascript(src, {
                        onLoad: function () {
                            Application.LoadedResources.include(src); //Include the versioned name
                            Application.fireEvent('resourceLoaded'); //Fire the event indicating the resource was loded.
                        }
                    });
                });
            },
            loadStylesheet: function (path, noCache) {
                if (!path) return;
                path = Array.from(path);
                this.loadStylesheets(path, noCache);
            },
            loadStylesheets: function (pathArry, noCache) {
                pathArry = Array.from(pathArry);
                Array.each(pathArry, function (path) {
                    if (Application.Resources.contains(path)) return;
                    Application.Resources.include(path); //Include the unversioned id
                    if (noCache) path += postpend;
                    Asset.css(path, {
                        onLoad: function () {
                            Application.LoadedResources.include(path); //Include the versioned id
                            Application.fireEvent('resourceLoaded');
                        }
                    });
                });
            },
            authenticateUser: function (optionalUser, optionalPermission) {
                //Verify token using model
                if (optionalUser && !optionalUser.isCurrentUser()) {
                    //optionalUser = Service.GetUser(optionalUser);
                    optionalUser.refresh();
                } else {
                    Application.refreshCurrentUser();
                    optionalUser = Application.Settings.currentUser;
                };
                if (optionalPermission) return optionalUser.hasPermission(optionalPermission);
                else return optionalUser.loggedIn;
            },
            //Object - Creates a Namespace Object and returns it
            createNamespace: function (ns) {
                if (!ns) return null;
                var base = w;
                ns = ns.split('.');
                ns.each(function (nspart) { base = base[nspart] = base[nspart] || {}; });
                return base;
            },
            getSettings: function () {
                return $App$Settings;
            },
            getUser: function (userId, callBack) {
                //If we have the user return in to the callBack
                if (window.Application.users[userId]) callBack(window.Application.users[userId]);
                else {
                    //Get all the users and update the users hash
                    ASTIService.InvokeMethod('ChipsGetUser', { userId: userId, loginToken: window.Application.currentUser.token }, function (user) {
                        window.Application.users[userId] = user;
                        callBack(user);
                    });
                }
            }
        });

        //Common strings utilized by the application
        Application.implement({
            stringResources: {
                invalidInput: 'Please enter a valid entry for the field ',
                invalidPassword: 'Please enter a password',
                invalidEmail: 'Please enter a valid email address',
                passwordNoMatch: 'Passwords do not match.  Please confirm your new password',
                userNoMatch: 'Username cannot be verified, please ensure you have enter the username correctly',
                sessionExpire: 'Your session has been inactive for nearly 30 minutes.  Click OK to remain logged in.',
                resetPassword: 'An ',
                noDevices: 'No Devices Available',
                noConnection: 'No internet connection detected, please check your internet connection',
                welcomeText: 'Welcome {firstName} {lastName}',
                error: 'An Error Occured'
            }
        });


        //If there is not already an Application Instance than export our application object
        if (!w.Application) w.Application = new Application();

        //Allows a function to authenticate using our model
        if (!Function.Authenticate) Function.implement({
            //Ensure the optionalUser or CurrentUser is refreshed,loggedIn and optionally has the optionalPermission
            'Authenticate': w.Application.AuthenticateUser
        });

        /* *******************************
        * Load Application Resources
        **********************************
        * These are resources that are required for the Application
        ******************************** */
        w.Application.loadScripts(
            [$App$Settings.paths.resources + 'javascript/Classes/Loader.js',
            $App$Settings.paths.resources + 'javascript/Classes/DOMWindow.js',
            $App$Settings.paths.resources + 'javascript/Classes/MessageBus.js',
            $App$Settings.paths.resources + 'javascript/Classes/AnimatedLaneView.js',
            $App$Settings.paths.resources + 'javascript/Classes/MessagePreview.js',
        //$App$Settings.paths.resources + 'javascript/Classes/EventLog.js',
            $App$Settings.paths.resources + 'javascript/Classes/IdleTimer.js',
            $App$Settings.paths.resources + 'javascript/Classes/datepicker/datepicker.js',
            $App$Settings.paths.resources + 'javascript/Code/ASTIUtilities.js',
            $App$Settings.paths.resources + 'javascript/Code/ASTITemplates.js',
            $App$Settings.paths.resources + 'javascript/Modules/Modules.js'], null, true);

        w.Application.addEvent('afterResourceLoaded:once', function () {
            w.Application.loadStylesheets(
                [$App$Settings.paths.resources + 'css/DOMWindow.css',
                $App$Settings.paths.resources + 'javascript/Classes/datepicker/datepicker.css'],
                true);
        });

        //Should be moved to Default.js

        /* *******************************
        * Application Loading Methods
        **********************************
        * Functions to be executed by the applicationReady code below
        ******************************** */
        //Loads various Google APIs required by the Applciation, including maps and visualization
        var $initializeGoogleMap = function (onComplete) {
            if (!w.ASTIMap) return onComplete(); //$loadGoogleAPIs();

            if (w.Application.Map) return;

            var mapContainer = $(d.body).getElement('.mapContainer'),
            bottomPanel = mapContainer.getElement('.bottomPanel'),
            rightPanel = mapContainer.getElement('.rightPanel'),
            pageHeader = d.id('pageHeader'),
            mapPanel = d.id('mapFrame');

            mapContainer.setStyle('height', d.documentElement.clientHeight - parseFloat(ASTI.Controls.MenuBar.element.clientHeight) - parseFloat(ASTI.Controls.Dock.element.clientHeight) - parseFloat(pageHeader.clientHeight));
            mapPanel.setStyles({
                'height': mapContainer.clientHeight.toInt() - bottomPanel.clientHeight.toInt(),
                'width': mapContainer.clientWidth.toInt() - rightPanel.clientWidth.toInt()
            });

            w.Application.Map = new ASTIMap({
                mapContainer: mapPanel,
                mapOptions: {
                    minZoom: 3,
                    scrollwheel: true
                }
            });

            var $refreshMask = new Mask(mapPanel, { width: mapPanel.getSize().x });
            refreshMask.hide();
            var $refreshChain = new Chain();

            w.Application.Map.addEvents({
                'beforerefresh': function () {
                    clearInterval(w.Application.Map.options.mapRefreshTimer);
                    w.Application.Map.refreshing = true;
                    $refreshMask.fade('in');
                },
                'refresh': function () {
                    Array.each(ASTIMarker.Project.instances, function (project) {
                        if (project.update) $refreshChain.chain(project.update.pass($refreshChain.callChain.bind($refreshChain), project));
                    });
                    $refreshChain.chain(function () {
                        w.Application.Map.manager.refresh();
                        w.Application.Map.clusterer.redraw();
                        w.Application.Map.refreshing = false;
                        w.Application.Map.options.mapRefreshTimer = setInterval(w.Application.Map.refresh.bind(Application.Map), w.Application.Map.options.mapRefreshDuration);
                        $refreshMask.fade('out');
                        w.Application.Map.fireEvent('afterRefresh');
                        google.maps.event.trigger(w.Application.Map.map, 'idle');
                    });

                    $refreshChain.callChain();
                },
                'afterRefresh': function () {
                    $refreshMask.fade('out');
                }
            });

            var clusterInfoStyles = {
                display: 'block',
                background: '#fff none',
                border: '1px solid #000',
                padding: '5px',
                position: 'absolute',
                bottom: 150,
                right: 75
            },
            clusterInfo;

            google.maps.event.addListener(w.Application.Map.clusterer, 'clusterclick', function (cluster) {
                if (clusterInfo && clusterInfo.getParent()) clusterInfo.dispose();
                //debugger;
            });

            google.maps.event.addListener(w.Application.Map.clusterer, 'clustermouseover', function (cluster) {
                clusterInfo = new Element('div', { html: '<b>Markers In This Cluster:</b>', styles: clusterInfoStyles });
                Array.each(cluster, function (c) {
                    Array.each(c.markers_, function (marker) {
                        var markerDiv = new Element('div', { html: marker.title }).inject(clusterInfo);
                        new Element('img', { src: marker.icon, styles: { height: 15, width: 15} }).inject(markerDiv, 'top');
                    });
                });
                clusterInfo.inject(d.body);
            });

            google.maps.event.addListener(w.Application.Map.clusterer, 'clustermouseout', function (cluster) {
                //dispose of clusterInfo
                if (clusterInfo && clusterInfo.getParent()) clusterInfo.dispose();
            });

            google.maps.event.addListener(w.Application.Map.map, 'zoom_changed', function () {
                //dispose of clusterInfo
                if (clusterInfo && clusterInfo.getParent()) clusterInfo.dispose();
            });

            window.addEvent('resize', function () {
                mapContainer.setStyle('height', document.documentElement.clientHeight - parseFloat(ASTI.Controls.MenuBar.element.clientHeight) - parseFloat(ASTI.Controls.Dock.element.clientHeight) - parseFloat(pageHeader.clientHeight));
                mapPanel.setStyle('height', mapContainer.clientHeight.toInt() - bottomPanel.clientHeight.toInt());
                $refreshMask.options.width = mapPanel.getSize().x;
                google.maps.event.trigger(w.Application.Map.map, 'resize');
            });

            if (onComplete) onComplete();
        },
        //A machine function to handle instantiating ASTIMarker.Project classes for each downloaded clientProject
        $loadProjectClasses = function (projects) {
            var projectSelect = d.id(d.body).getElement('.controlMenu .projectSelect');
            Array.each(projects, function (clientProject) {
                var project = new ASTIMarker.Project(w.Application.Map, { id: clientProject.projectId, title: clientProject.friendlyName });
                ScriptLoader.queueScript('Downloading Data for: ' + clientProject.friendlyName, project.downloadXML.bind(project));
                ScriptLoader.queueScript('Loading ' + clientProject.friendlyName, project.addProjectToMap.bind(project));

                //Project Manager control?
                if (projectSelect) new Element('option', { value: project.id, text: project.projectName }).inject(projectSelect);

                if (clientProject.htmlTemplate && document.id('pageHeader').innerHTML.isNullOrEmpty()) {
                    document.id('pageHeader').set('html', clientProject.htmlTemplate);
                }
                if (clientProject.jsTemplate) {
                    //this block here needs to be addded to ResourceLoader as loadScript
                    var theScript = new Element('script', { type: 'text/javascript' });
                    theScript.text = clientProject.jsTemplate;
                    theScript.inject(d.body);
                }
            });
        },
        $setMapView = function (onComplete) { //This should be replaced by an event that fires each time a project loads
            if (ASTIMarker.Project.instances && ASTIMarker.Project.instances.length === 1) ASTIMarker.Project.instances[0].expand();
            else if (ASTIMarker.Project.instances) {
                var bounds = new google.maps.LatLngBounds();
                ASTIMarker.Project.instances.each(function (project) {
                    if (!project.projectBounds) return;
                    bounds = bounds.union(project.projectBounds);
                });
                w.Application.Map.map.fitBounds(bounds); //ASTIMarkerManager.getProjectView();
                bounds = null; delete bounds;
            };
            w.Application.Map.options.mapRefreshTimer = setInterval(w.Application.Map.refresh.bind(w.Application.Map), w.Application.Map.options.mapRefreshDuration);
            window.fireEvent('resize');
            onComplete.delay(0);
        };

        /* *******************************
        * Application Ready
        **********************************
        * Functions to be executed once the application has finished loading
        ******************************** */

        var locationString = w.location.toString().toLowerCase();
        w.addEvent('applicationReady', function () {
            if (locationString.match('login')) {
                w.Application.loadScripts($App$Settings.paths.resources + 'javascript/login.js');
            } else if (locationString.match('index')) {
                w.Application.loadScripts($App$Settings.paths.resources + 'javascript/index.js');
            } else if (locationString.match('controltest')) {
                w.Application.loadScripts($App$Settings.paths.resources + 'javascript/controlTest.js');
            } else if (locationString.match('reset') /*|| locationString.match('testing')*/) {
                pageLoad();
            } else {
                w.Application.loadScripts($App$Settings.paths.resources + 'javascript/default.js');
            }
        });

        /* *******************************
        * Examples
        **********************************
        * Examples of how to perform certain methods
        ******************************** */

        //Example of how to Authenticate
        function deviceServiceCall(device) {
            if (this.Authenticate(null, 'Permission')) {
                //here is able
            } else {
                //here is not able
            };
        };

        //Example of how to Authenticatelog
        function deviceServiceCall(device, user) {
            if (this.Authenticate(user || Application.Settings.currentUser, 'Permission')) {
                //here is able
            } else {
                //here is not able
            };
        };

    } catch (ex) {
        alert('An error occurred while initializing the appliction.  Please refresh your browser to try again.');
    }

})(window, document, undefined, null, MooTools);