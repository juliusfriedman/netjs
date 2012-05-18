/*
Control.js
Part of the User Interface Framework
Compatibility IE 6-9(/Mobile), Firefox 3-5, Opera(/Mobile), Safari, Chrome, Konquer and others.
Requires: MooTools 1.3, MooToolsMore 1.3, MooToolsASTI.js, DynamicCSS.js 
Provides: ControlStyles, ControlFlags, ControlManger, WindowManager, Control, Panel, Button, Window, WindowFrame
Created: 03/38/2011
Authors:
    ASTI Transportation :
    Origional Author: Julius R. Friedman[juliusfriedman@gmail.com, jfriedman@asti-trans.com] - Senior Software Engineer 
    Modified for Asthetics by Andrew Larkin[andrew@alarkindesign.com , andrew@asti-trans.com] - Web Developer
globals: win = window, screen = window.screen, doc = document, body = document.body, moo = MooTools, $ = document.id, nil = null, undef = undefines
*/
(function (win, screen, doc, body, moo, $, nil, undef) {
    //If the libraries we require are not present then return
    if (!moo && $) return;

    //Determine the root path of the website
    var $URI = new URI(window.location),
    $Application$Path = $URI.get('scheme') + '://' + $URI.get('host') + ($URI.get('port') != '80' ? ':' + $URI.get('port') : '') + $URI.parsed.directory.substring(0, $URI.parsed.directory.indexOf('/', 1)) + '/';

    //----------------
    //Define the Controls Namespace
    //----------------
    if (!win.ASTI) win.ASTI = {};
    var Controls = win.ASTI.Controls = {};

    //----------------
    //Control Styles
    //----------------
    // Here we will dynamically generate a stylesheet for our control library.  These styles will be stored and referenced in the Style object
    // and can be dynamically updated in the code.  This should be done in lieu of class swapping.
    //----------------
    var Styles = {}, //An object to store references to all our dynamically created styles
    DynamicCSS = win.DynamicCSS;
    //If there is not already a style tag loaded into the page, create one using the DynamicSS class
    if (!doc.styleSheets.length) {
        DynamicCSS.createStyleSheet('all', 'Controls', 'controls', 'en-us', true);
    }

    /* ** A note on visual presentation and cross-browser css **
    An effort has been made to make the visual presentation of these controls consistant across all supported browsers.  In some rare 
    cases this is not possible.
    
    In these cases, best approximations have been made to duplicate the effect without using solutions that would add additional overhead.
    Examples are:
    - rounded corners: rather than use a bulky fallback solution, browsers that do not support the border-radius style have traditional 
    blocky corners.
    - drop shadows: Browsers that support the box-shadow style have a feathered shadow.  IE browsers that do not (namely 8 and earlier) 
    instead use the dropShadow filter which retains transparency but is not feathered.
    - translucent backgrounds: In most cases, translucency is supported for all browsers.  The exception is in IE 8 and earlier where there
    is a combination of drop shadow and translucency.  In these cases both the gradient and dropShadow filters are used.  The use of the 
    dropShadow disables the alpha transparency of the gradient somehow (why I do not know).  In these cases, the transulcent backgrounds are 
    opaque.
    Browsers that do not support rgba will fall back to using opaque colors.  This includes IE 5.5 or earlier and Firefox 2.
    - gradient backgrounds: Ideally, the Desktop Control should have a radial gradient.  However, not all browsers support the use of radial gradients.
    Those that do will display the gradient as radial.  The others will display the gradient as linear.
    */

    //.noSelect
    Styles.noSelect = DynamicCSS.addCSSRule('.noSelect');
    Styles.noSelect.style.userSelect = 'none';
    if (Browser.chrome || Browser.safari) Styles.noSelect.style.WebkitUserSelect = 'none';
    if (Browser.firefox) Styles.noSelect.style.MozUserSelect = 'none';

    //.noVisible
    Styles.noVisible = DynamicCSS.addCSSRule('.noVisible');
    Styles.noVisible.style.cssText = 'display: none!important';

    //.minTransiton
    Styles.minTransiton = DynamicCSS.addCSSRule('.minTransiton');
    if (Browser.chrome || Browser.safari) {
        Styles.minTransiton.style.webkitTransition = '-webkit-transform .5s ease-in';
    } else if (Browser.firefox && Browser.version > 4) {
        Styles.minTransiton.style.MozTransition = '-moz-transform .5s ease-in';
    } else if (Browser.opera) {
        Styles.minTransiton.style.oTransition = '-o-transform .5s ease-in';
    }

    //.inlineBlock
    Styles.inlineBlock = DynamicCSS.addCSSRule('.inlineBlock');
    if (Browser.firefox) {
        Styles.inlineBlock.style.display = '-moz-inline-stack';
    }
    if (Browser.ie && Browser.version < 8) Styles.inlineBlock.style.display = 'inline';
    else Styles.inlineBlock.style.display = 'inline-block';
    Styles.inlineBlock.style.zoom = 1;
    Styles.inlineBlock.style.verticalAlign = 'top';

    //body
    Styles.body = DynamicCSS.addCSSRule('body');
    Styles.body.style.margin = 0;
    Styles.body.style.padding = 0;
    Styles.body.style.overflow = 'hidden';

    ///* Control Base Styles */

    //Desktop Styles
    //.desktop
    Styles.desktop = DynamicCSS.addCSSRule('.desktop');
    //If the Browser is IE and the Browser version is Less then 5.5 utilize a Proprietary method for drawing a gradient
    if (Browser.ie && Browser.version > 5.5) Styles.desktop.style.filter = 'progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=#0047AF, endColorstr=#389FFC)';
    else if (Browser.firefox && Browser.version >= 3.6) Styles.desktop.style.background = '-moz-radial-gradient(#389FFC, #0047AF)';
    else if ((Browser.chrome && Browser.version >= 10) || (Browser.safari && Browser.version >= 5.1)) Styles.desktop.style.background = '-webkit-radial-gradient(#389FFC, #0047AF)';
    else if (Browser.chrome || Browser.safari || Browser.ios || Browser.android) Styles.desktop.style.background = '-webkit-gradient(radial, 50% 50%, 0, 50% 50%, 800, from(#389FFC), to(#0047AF))';
    else if (Browser.opera) Styles.desktop.style.background = '-o-radial-gradient(#389FFC, #0047AF)';
    else Styles.desktop.style.background = '#009EFF'; //Fallback for browsers that do not support gradients
    Styles.desktop.style.position = 'absolute';
    Styles.desktop.style.top = 0;
    Styles.desktop.style.left = 0;
    //Styles.desktop.style.zIndex = -99;//Andrew has this f*k3d up so we have to use this for now
    Styles.desktop.style.zIndex = 0;

    //Panel Styles
    Styles.panel = DynamicCSS.addCSSRule('.panel');
    Styles.panel.style.overflow = 'hidden';

    //Label Styles
    Styles.label = DynamicCSS.addCSSRule('.label');
    Styles.label.style.overflow = 'hidden';
    if (!Browser.firefox) Styles.label.style.textOverflow = 'ellipsis';
    Styles.label.style.whiteSpace = 'nowrap';

    //Window Styles
    //.window
    Styles.window = DynamicCSS.addCSSRule('.window');
    Styles.window.style.display = 'block';
    Styles.window.style.position = 'absolute';
    Styles.window.style.padding = '4px';
    Styles.window.style.border = '1px outset #71C2DB';
    Styles.window.style.background = '#E4F4F9'; //fallback for IE 5.5 and Firefox 2
    if (Browser.ie && Browser.version < 9 && Browser.version > 5.5) { //Note that versions of IE before 5.5 do not support filters
        Styles.window.style.filter = "progid:DXImageTransform.Microsoft.DropShadow(color=#50000000,offX=1,offY=4) progid:DXImageTransform.Microsoft.gradient(startColorStr=#75E4F4F9, endColorStr=#75E4F4F9)";
    } else {
        Styles.window.style.boxShadow = '0px 4px 8px rgba(0,0,0,0.5)';
        Styles.window.style.background = 'rgba(288,244,249,0.75)';
    }
    Styles.window.style.borderRadius = '10px';
    //.window .header
    Styles.windowHeader = DynamicCSS.addCSSRule('.window .header');
    //This handly css trick will allow us to have cross-browser support for the inline-block style.  This is primarily useful for IE 6 & 7,
    //neither of which support the property.  Use when we need an inline element that has fixed dimension properties.
    if (Browser.firefox) Styles.windowHeader.style.display = '-moz-inline-stack';
    if (Browser.ie && Browser.version < 8) Styles.windowHeader.style.display = 'inline';
    else Styles.windowHeader.style.display = 'inline-block';
    Styles.windowHeader.style.zoom = 1;

    Styles.windowHeader.style.height = '12px';
    Styles.windowHeader.style.cursor = 'pointer';
    Styles.windowHeader.style.verticalAlign = 'top';
    Styles.windowHeader.style.font = '.75em sans-serif';
    Styles.windowHeader.style.background = '#fff';
    Styles.windowHeader.style.border = '1px outset #E2E2E2';
    Styles.windowHeader.style.borderRadius = '4px';
    Styles.windowHeader.style.marginLeft = '2px';
    Styles.windowHeader.style.padding = '1px';
    if (Browser.ie && Browser.version < 9 && Browser.version > 5.5) {
        Styles.windowHeader.style.filter = 'progid:DXImageTransform.Microsoft.DropShadow(color="#50000000",offX=1,offY=1)';
    } else {
        Styles.windowHeader.style.boxShadow = '0px 1px 2px rgba(0,0,0,0.5)';
    }
    //.window .statusBar
    Styles.windowStatusBar = DynamicCSS.addCSSRule('.window .statusBar');
    Styles.windowStatusBar.style.font = '.7em sans-serif';
    Styles.windowStatusBar.style.display = 'block';
    Styles.windowStatusBar.style.color = '#4D4D4D';
    Styles.windowStatusBar.style.width = '100%';
    Styles.windowStatusBar.style.height = '18px';
    //.windowFrame 
    Styles.windowFrame = DynamicCSS.addCSSRule('.windowFrame');
    Styles.windowFrame.style.display = 'block';
    Styles.windowFrame.style.position = 'relative';
    Styles.windowFrame.style.borderRadius = '10px';
    //.windowFrame .windowPanel
    Styles.windowPanel = DynamicCSS.addCSSRule('.windowFrame .windowPanel');
    Styles.windowPanel.style.display = 'block';
    Styles.windowPanel.style.padding = '4px';
    Styles.windowPanel.style.background = '#ffffff';
    Styles.windowPanel.style.overflow = 'auto';
    Styles.windowPanel.style.border = '1px outset #71C2DB';
    Styles.windowPanel.style.borderRadius = '4px';
    //.window .controlButton
    Styles.windowControlButton = DynamicCSS.addCSSRule('.window .controlButton');
    Styles.windowControlButton.style.height = '15px';
    Styles.windowControlButton.style.width = '15px';
    Styles.windowControlButton.style.border = 0;
    Styles.windowControlButton.style.margin = '0px 2px 2px 2px';
    Styles.windowControlButton.style.backgroundPosition = '0px 0px';
    Styles.windowControlButton.style.verticalAlign = 'top';
    Styles.windowControlButton.style.cursor = 'pointer';
    //.window .close
    Styles.windowClose = DynamicCSS.addCSSRule('.window .close');
    Styles.windowClose.style.background = 'transparent url(' + $Application$Path + 'resources/images/buttons/button_close_window.png) no-repeat';
    //.window .minimize
    Styles.windowMinimize = DynamicCSS.addCSSRule('.window .minimize');
    Styles.windowMinimize.style.background = 'transparent url(' + $Application$Path + 'resources/images/buttons/button_minimize.png) no-repeat';
    //.window .maximize
    Styles.windowMaximize = DynamicCSS.addCSSRule('.window .maximize');
    Styles.windowMaximize.style.background = 'transparent url(' + $Application$Path + 'resources/images/buttons/button_maximize.png) no-repeat';
    //.window .resizeControl
    Styles.resizeControl = DynamicCSS.addCSSRule('.window .resizeControl');
    Styles.resizeControl.style.position = 'absolute';
    Styles.resizeControl.style.bottom = 0;
    Styles.resizeControl.style.right = 0;
    Styles.resizeControl.style.border = 0;
    Styles.resizeControl.style.height = '20px';
    Styles.resizeControl.style.width = '20px';
    Styles.resizeControl.style.border = '1px solid #4E83C3';
    Styles.resizeControl.style.background = 'transparent';
    Styles.resizeControl.style.cursor = 'nw-resize';
    //.window .resizeControl:hover
    Styles.resizeControlHover = DynamicCSS.addCSSRule('.window .resizeControl:hover');
    Styles.resizeControlHover.style.background = '#fff';

    //Tabbed Window Styles
    //.tabPanel
    Styles.tabPanel = DynamicCSS.addCSSRule('.tabPanel');
    Styles.tabPanel.style.display = 'block';
    Styles.tabPanel.style.position = 'absolute';
    Styles.tabPanel.style.top = 0;
    Styles.tabPanel.style.padding = '4px 2px 2px 2px';
    Styles.tabPanel.style.margin = '0px, 2px';
    Styles.tabPanel.style.width = '80px';
    Styles.tabPanel.style.border = '1px outset #71C2DB';
    Styles.tabPanel.style.background = '#EDF3F4';
    Styles.tabPanel.style.overflowY = 'auto';

    Styles.tabPanelButton = DynamicCSS.addCSSRule('.tabPanel button');
    Styles.tabPanelButton.style.background = 'transparent';
    Styles.tabPanelButton.style.color = '#4E83C3';
    Styles.tabPanelButton.style.fontSize = '.75em';
    Styles.tabPanelButton.style.border = '1px solid transparent';
    Styles.tabPanelButton.style.overflow = 'hidden';
    Styles.tabPanelButton.style.display = 'block';
    Styles.tabPanelButton.style.textOverflow = 'ellipsis';
    Styles.tabPanelButton.style.whiteSpace = 'nowrap';
    Styles.tabPanelButton.style.width = '100%';

    Styles.tabPanelButtonHover = DynamicCSS.addCSSRule('.tabPanel button:hover');
    Styles.tabPanelButtonHover.style.background = 'transparent';
    Styles.tabPanelButtonHover.style.color = '#80ACD8';

    Styles.tabPanelButtonActive = DynamicCSS.addCSSRule('.tabPanel button.active');
    Styles.tabPanelButtonActive.style.background = '#FFF1B6';
    Styles.tabPanelButtonActive.style.border = '1px solid #4E83C3';

    Styles.tabPanelButtonActiveHover = DynamicCSS.addCSSRule('.tabPanel button.active:hover');
    Styles.tabPanelButtonActiveHover.style.background = '#FFFEF8';

    //Menu Bar Styles
    //.menuBar
    Styles.menuBar = DynamicCSS.addCSSRule('.menuBar');
    if (Browser.ie && Browser.version > 5.5) Styles.menuBar.style.filter = 'progid:DXImageTransform.Microsoft.gradient(startColorstr=#E2E2E2, endColorstr=#AAAAAA)';
    else if (Browser.firefox && Browser.version >= 3.6) Styles.menuBar.style.background = '-moz-linear-gradient(#E2E2E2, #AAAAAA)';
    else if ((Browser.chrome && Browser.version >= 10) || (Browser.safari && Browser.version >= 5.1)) Styles.menuBar.style.background = '-webkit-linear-gradient(top, #E2E2E2, #AAAAAA)';
    else if (Browser.chrome || Browser.safari) Styles.menuBar.style.background = '-webkit-gradient(linear, center top, center bottom, from(#E2E2E2), to(#AAAAAA))';
    else if (Browser.opera) Styles.menuBar.style.background = '-o-linear-gradient(#E2E2E2, #AAAAAA)';
    else Styles.menuBar.style.background = '#E2E2E2';
    Styles.menuBar.style.height = '25px';
    Styles.menuBar.style.width = '100%';
    Styles.menuBar.style.display = 'block';
    Styles.menuBar.style.position = 'fixed';
    Styles.menuBar.style.top = 0;
    Styles.menuBar.style.border = '1px outset #666666';
    //.menuBar .menuButton
    Styles.menuBarButton = DynamicCSS.addCSSRule('.menuBar .menuButton');
    Styles.menuBarButton.style.background = 'transparent none';
    Styles.menuBarButton.style.height = '20px';
    Styles.menuBarButton.style.borderWidth = '1px';
    Styles.menuBarButton.style.borderStyle = 'solid';
    Styles.menuBarButton.style.borderColor = 'transparent';
    Styles.menuBarButton.style.borderRadius = '4px';
    Styles.menuBarButton.style.margin = '3px';
    Styles.menuBarButton.style.padding = '2px';
    Styles.menuBarButton.style.fontWeight = 'bold';
    //.menuBar .menuButton:hover
    Styles.menuBarButtonHover = DynamicCSS.addCSSRule('.menuBar .menuButton:hover');
    Styles.menuBarButtonHover.style.background = '#E6E6E6 none';
    Styles.menuBarButtonHover.style.borderColor = '#808080';
    //.menuBar .menuButton.active
    Styles.menuBarButtonActive = DynamicCSS.addCSSRule(".menuBar .menuButtonActive");
    Styles.menuBarButtonActive.style.background = '#D1E9F2 none';
    Styles.menuBarButtonActive.style.borderColor = '#808080';
    //.menuBar .menuButton.active:hover
    Styles.menuBarButtonActive = DynamicCSS.addCSSRule(".menuBar .menuButtonActive:hover");
    Styles.menuBarButtonActive.style.background = '#EAF5F9 none';

    //Menu Styles

    //.menu
    Styles.menu = DynamicCSS.addCSSRule('.menu');
    Styles.menu.style.display = 'block';
    Styles.menu.style.position = 'absolute';
    Styles.menu.style.background = '#ffffff';
    Styles.menu.style.border = '1px solid #3FA9F5';
    Styles.menu.style.borderRadius = '4px 4px 0px 0px';
    Styles.menu.style.zIndex = 1000;

    //Dock Styles
    //.dock
    Styles.dock = DynamicCSS.addCSSRule('.dock');
    Styles.dock.style.bottom = 0;
    Styles.dock.style.left = 0;
    Styles.dock.style.width = '100%'
    Styles.dock.style.height = '35px'
    Styles.dock.style.display = 'block';
    Styles.dock.style.zIndex = 9999;
    Styles.dock.style.overflow = 'visible';
    if (Browser.ie && Browser.version < 9) {
        Styles.dock.style.filter = 'progid:DXImageTransform.Microsoft.gradient(startColorStr=#75000000, endColorStr=#75000000)';
    } else {
        Styles.dock.style.background = 'rgba(0,0,0,0.5)';
    }
    Styles.dock.style.border = '1px outset #A8A8A8';
    //.dock .controlMenu
    Styles.dockMenu = DynamicCSS.addCSSRule('.controlMenu');
    Styles.dockMenu.style.position = 'absolute';
    Styles.dockMenu.style.display = 'block';
    Styles.dockMenu.style.bottom = '20px';
    Styles.dockMenu.style.left = 0;
    Styles.dockMenu.style.height = '300px';
    Styles.dockMenu.style.width = '200px';
    Styles.dockMenu.style.padding = '4px';
    Styles.dockMenu.style.border = '1px solid #000000';
    if (Browser.ie && Browser.version > 5.5) Styles.dockMenu.style.filter = 'progid:DXImageTransform.Microsoft.gradient(startColorstr=#50D1E9F2, endColorstr=#75ffffff)';
    else if (Browser.firefox && Browser.version >= 3.6) Styles.dockMenu.style.background = '-moz-linear-gradient(bottom, rgba(255,255,255,0.75) 0%, rgba(209,233,242,0.5) 15%)';
    else if ((Browser.chrome && Browser.version >= 10) || (Browser.safari && Browser.version >= 5.1)) Styles.dockMenu.style.backgroundImage = '-webkit-linear-gradient(bottom, rgba(255,255,255,0.75) 0%, rgba(209,233,242,0.5) 15%)';
    else if (Browser.chrome || Browser.safari) Styles.dockMenu.style.backgroundImage = '-webkit-gradient(linear, bottom, top, color-stop(0, rgba(255,255,255,0.75), color-stop(0.15, rgba(209,233,242,0.5))';
    else if (Browser.opera) Styles.dockMenu.style.background = '-o-linear-gradient(#D1E9F2, #ffffff)';
    else Styles.dockMenu.style.background = '#D1E9F2';
    Styles.dockMenu.style.borderRadius = '10px 10px 0px 0px';
    Styles.dockMenu.style.zIndex = 900;
    //.dock .controlMenu .controlMenuItem
    Styles.dockMenuItem = DynamicCSS.addCSSRule('.controlMenuItem');
    Styles.dockMenuItem.style.display = 'block';
    Styles.dockMenuItem.style.padding = '4px';
    Styles.dockMenuItem.style.margin = '4px';
    Styles.dockMenuItem.style.borderRadius = '4px';
    Styles.dockMenuItem.style.background = '#ffffff';
    Styles.dockMenuItem.style.cursor = 'pointer';
    //.dock .controlMenu .controlMenuItem:hover
    Styles.dockMenuItemHover = DynamicCSS.addCSSRule('.controlMenuItem:hover');
    Styles.dockMenuItemHover.style.background = '#D1E9F2'
    //.dock .menuButton
    Styles.dockMenuButton = DynamicCSS.addCSSRule('.dock .menuButton');
    if (Browser.firefox) Styles.dockMenuButton.style.display = '-moz-inline-stack';
    if (Browser.ie && Browser.version < 8) Styles.dockMenuButton.style.display = 'inline';
    else Styles.dockMenuButton.style.display = 'inline-block';
    Styles.dockMenuButton.style.verticalAlign = 'top';
    Styles.dockMenuButton.style.zoom = 1;
    Styles.dockMenuButton.style.height = '35px';
    Styles.dockMenuButton.style.width = '110px';
    Styles.dockMenuButton.style.color = '#fff';
    Styles.dockMenuButton.style.border = 0;
    Styles.dockMenuButton.style.fontSize = '1.5em';
    Styles.dockMenuButton.style.background = 'transparent url(' + $Application$Path + 'resources/images/buttons/button_dock_menu.png) no-repeat 0px 0px';
    Styles.dockMenuButton.style.textAlign = 'right';
    Styles.dockMenuButton.style.cursor = 'pointer';
    Styles.dockMenuButton.style.margin = '0px 4px 0px 4px';
    //.dock .dockClock
    Styles.dockClock = DynamicCSS.addCSSRule('.dock .dockClock');
    if (Browser.firefox) Styles.dockClock.style.display = '-moz-inline-stack';
    if (Browser.ie && Browser.version < 8) Styles.dockClock.style.display = 'inline';
    else Styles.dockClock.style.display = 'inline-block';
    Styles.dockClock.style.position = 'absolute';
    Styles.dockClock.style.right = 0;
    Styles.dockClock.style.top = 0;
    Styles.dockClock.style.width = '100px';
    Styles.dockClock.style.font = '.75em sans-serif';
    Styles.dockClock.style.color = '#fff';
    Styles.dockClock.style.textAlign = 'center';

    //.windowPreview
    Styles.windowPreview = DynamicCSS.addCSSRule('.windowPreview');
    Styles.windowPreview.style.margin = '2px';
    Styles.windowPreview.style.border = '2px outset #4d4d4d';
    Styles.windowPreview.style.height = '30px';
    Styles.windowPreview.style.borderRadius = '4px';
    Styles.windowPreview.style.color = '#ffffff';
    Styles.windowPreview.style.background = 'transparent';
    if (Browser.ie && Browser.version > 5.5) Styles.windowPreview.style.filter = 'progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=#50ffffff, endColorstr=#75000000)';
    else if (Browser.firefox && Browser.version >= 3.6) Styles.windowPreview.style.background = '-moz-linear-gradient(rgba(255,255,255,50), rgba(0,0,0,75))';
    else if ((Browser.chrome && Browser.version >= 10) || (Browser.safari && Browser.version >= 5.1)) Styles.windowPreview.style.background = '-webkit-linear-gradient(rgba(255,255,255,50), rgba(0,0,0,75))';
    else if (Browser.chrome || Browser.safari) Styles.windowPreview.style.background = '-webkit-gradient(radial, 50% 50%, 0, 50% 50%, 800, from(rgba(255,255,255,50)), to(rgba(0,0,0,75)))';
    else if (Browser.opera) Styles.windowPreview.style.background = '-o-linear-gradient(rgba(255,255,255,50), rgba(0,0,0,75))';
    else Styles.windowPreview.style.background = '#4d4d4d'; //Fallback for browsers that do not support gradients

    //.windowPreview:hover
    Styles.windowPreviewHover = DynamicCSS.addCSSRule('.windowPreview:hover');
    if (Browser.ie && Browser.version > 5.5) Styles.windowPreview.style.filter = 'progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=#80ffffff, endColorstr=#000000)';
    else if (Browser.firefox && Browser.version >= 3.6) Styles.windowPreview.style.background = '-moz-linear-gradient(rgba(255,255,255,80), rgba(0,0,0,100))';
    else if ((Browser.chrome && Browser.version >= 10) || (Browser.safari && Browser.version >= 5.1)) Styles.windowPreview.style.background = '-webkit-linear-gradient(rgba(255,255,255,80), rgba(0,0,0,100))';
    else if (Browser.chrome || Browser.safari) Styles.windowPreview.style.background = '-webkit-gradient(radial, 50% 50%, 0, 50% 50%, 800, from(rgba(255,255,255,80)), to(rgba(0,0,0,100)))';
    else if (Browser.opera) Styles.windowPreview.style.background = '-o-linear-gradient(rgba(255,255,255,80), rgba(0,0,0,100))';
    else Styles.windowPreview.style.background = '#ffffff'; //Fallback for browsers that do not support gradients

    //User Styles
    //.userDirectory
    Styles.userDirectory = DynamicCSS.addCSSRule('.userDirectory');
    Styles.userDirectory.style.width = '150px';
    Styles.userDirectory.style.verticalAlign = 'top';
    Styles.userDirectory.style.overflowX = 'hidden';
    Styles.userDirectory.style.overflowY = 'auto';
    Styles.userDirectory.style.border = '1px solid #D1E9F2';
    //.userView
    Styles.userView = DynamicCSS.addCSSRule('.userView');
    Styles.userView.style.overflow = 'hidden';
    Styles.userView.style.verticalAlign = 'top';
    Styles.userView.style.background = '#D1E9F2';
    Styles.userView.style.padding = '5px 10px';

    //.userDirectory button
    Styles.userEntry = DynamicCSS.addCSSRule('button.user');
    Styles.userEntry.style.padding = '2px 4px';
    Styles.userEntry.style.width = '100%';
    Styles.userEntry.style.height = '25px';
    Styles.userEntry.style.border = '1px solid #fff';
    Styles.userEntry.style.whiteSpace = 'nowrap';
    Styles.userEntry.style.textOverflow = 'ellipsis';
    Styles.userEntry.style.textAlign = 'left';
    Styles.userEntry.style.cursor = 'pointer';
    Styles.userEntry.style.display = 'block';
    Styles.userEntry.style.overflow = 'hidden';

    Styles.userEntryHover = DynamicCSS.addCSSRule('button.user:hover');
    Styles.userEntryHover.style.backgroundColor = '#EFF7F9';

    //.userDirectory button.selected
    Styles.userEntrySelected = DynamicCSS.addCSSRule('.userDirectory button.selected');
    Styles.userEntrySelected.style.backgroundColor = '#D1E9F2';

    //.userField
    Styles.userField = DynamicCSS.addCSSRule('.userField');
    Styles.userField.style.display = 'block';
    Styles.userField.style.margin = '4px 0px';
    Styles.userField.style.whiteSpace = 'nowrap';
    Styles.userField.style.textOverflow = 'ellipsis';
    Styles.userField.style.overflow = 'hidden';

    //----------------
    //The Types of this namespace
    //----------------

    //----------------
    //The ControlStyles of a Control
    //----------------
    // These flags activate certain stylistic properties on a control and are usually applied when the control is rendered.  Multiple ControlStyles can 
    // be applied to a control using bitwise computations (|).
    var ControlStyles = new Type('ControlStyles', function () { });
    ControlStyles.None = 0;
    ControlStyles.Fill = 1; //Control will fill its parent control
    ControlStyles.Fixed = 2; //Control position is fixed
    ControlStyles.noSelect = 4; //Prevents text and images inside this control from being highlighted
    ControlStyles.hasControlStyle = function (controlStyle, controlStyleCheck) {
        return (controlStyle & controlStyleCheck) === controlStyleCheck;
    };

    //----------------
    //The ControlFlags of a Control
    // Control Flags
    //----------------
    // Much like the ControlStyles, the ControlFlags can be applied to a control using a bitwise computation to flag multiple properties
    // ControlFlags indicate various behaviors of the control and are usually used to prevent default functionality, such as the ability to close
    // or minimize a window or prevent a control from being hidden or shown.
    var ControlFlags = new Type('ControlFlags', function () { });
    ControlFlags.None = 0;
    ControlFlags.ControlFlagsMask = 0x10000;
    ControlFlags.noHide = ControlFlags.ControlFlagsMask | 1; //Control cannot be hidden (but can be removed)
    ControlFlags.noShow = ControlFlags.ControlFlagsMask | 2; //Control is not visible 
    ControlFlags.noClose = ControlFlags.ControlFlagsMask | 4; //Control cannot be disposed while the application is running (but can be hidden)
    ControlFlags.noOpen = ControlFlags.ControlFlagsMask | 8; //Control cannot be opened
    ControlFlags.noMinimize = ControlFlags.ControlFlagsMask | 16; //Control cannot be minimized to the Dock
    ControlFlags.noMaximize = ControlFlags.ControlFlagsMask | 32; //Control cannot be maximized (set to full-size)
    ControlFlags.noFocus = ControlFlags.ControlFlagsMask | 64; //Control cannot recieve focus
    ControlFlags.noSelect = ControlFlags.ControlFlagsMask | 128; //Control cannot be selected
    ControlFlags.Drag = ControlFlags.ControlFlagsMask | 256; //Control can be moved 
    ControlFlags.noScroll = ControlFlags.ControlFlagsMask | 512; //Users cannot scroll the content of this control using the mousewheel or scrollbar
    ControlFlags.noPreview = ControlFlags.noMinimize; //////ControlFlags.ControlFlagsMask | 1024; //Control has no preview when minimized
    ControlFlags.noResize = ControlFlags.ControlFlagsMask | 2048; //Control cannot be resized
    ControlFlags.Modal = ControlFlags.ControlFlagsMask | 4096 //Indicates the modality of the Control.  Modal indicates the control has one modality
    ControlFlags.noCascade = ControlFlags.ControlFlagsMask | 8192 //Determines if a Control will cascade with other like controls
    ControlFlags.All = ControlFlags.noHide | ControlFlags.noShow | ControlFlags.noClose | ControlFlags.noOpen | ControlFlags.noMinimize | ControlFlags.noMaximize | ControlFlags.noFocus | ControlFlags.noSelect | ControlFlags.Drag | ControlFlags.noScroll | ControlFlags.noPreview;
    ControlFlags.hasControlFlag = function (controlFlag, controlFlagCheck) {
        return (controlFlag & controlFlagCheck) === controlFlagCheck;
    };

    Controls.ControlFlags = ControlFlags;

    //----------------
    //The Singleton Control Manager
    //----------------
    // The control manager class contains methods that assist in manipulating instantiated controls
    var ControlManager = new Class({
        Singleton: true,
        currentId: 0,
        //Gets the next available controlId
        NextId: function () {
            return ++this.currentId;
        },
        //Delete an instance of a control from memory.
        //Note: The control will perist in memory until there are no pointers.
        //If the control's parent control is rendered and such a pointer still exists, this can have the effect of unintentionaly
        //re-rendering the control.  This bug needs to be addressed.
        disposeControl: function (control) {
            //call erase on the Control.instances, which will collapse the array
            if (Control.instances) Control.instances.erase(control);
            //then call delete on the control
            var result = delete control;
            //debugger;
        },
        //Find a control by the given controlId, narrowing the search based on the optional parentControl
        findControlByID: function (controlId, parentControl) {
            if (!parentControl) parentControl = Control.instances;
            else if (parentControl && parentControl.children) parentControl = parentControl.children;
            return parentControl.filter(function (control) {
                return control.id === controlId;
            })[0];
        },
        //Find a control by the given controlName, narrowing the search based on the optional parentControl
        findControlByName: function (controlName, parentControl) {
            if (!parentControl) parentControl = Control.instances;
            else if (parentControl && parentControl.children) parentControl = parentControl.children;
            return parentControl.filter(function (control) {
                return control.name === controlName;
            })[0];
        },
        //Find all control by the given Control Prototype, narrowing the search based on the optional parentControl
        findControlsByType: function (controlType, parentControl) {
            if (!parentControl) parentControl = Control.instances;
            else if (parentControl && parentControl.children) parentControl = parentControl.children;
            return parentControl.filter(function (control) {
                return control instanceof controlType;
            });
        },
        //Find all control by the given ControFlag, narrowing the search based on the optional parentControl
        findControlsByControlFlag: function (controlFlag, parentControl) {
            if (!parentControl) parentControl = Control.instances;
            else if (parentControl && parentControl.children) parentControl = parentControl.children;
            return parentControl.filter(function (control) {
                return ControlFlags.hasFlag(control.options.ControlFlags, controlFlag);
            });
        }      
    });

    //Instantiate the ControlManager
    Controls.ControlManager = new ControlManager();

    //----------------
    //The Singleton Window Manager
    //----------------
    //The WindowManager class manages all instantiated instances of the Window control class.  This includes cascading windows, retrieving the 
    //topmost window by zIndex and tracking windows by Id and name.
    var WindowManager = new Class({
        Singleton: true,
        //Cascades all windows
        cascadeWindows: function () {
            Array.each(Window.instances, function (window, index) {
                window.cascade();
                window.bringToFront();
            });
        },
        //Iterates through all instances of the Window class and calls the minimize function
        minimizeAll: function () {
            Window.instances.each(function (window, index) {
                window.minimize();
            });
        },
        //Iterates through all instances of the Window class and calls the restore function, which restores a minimized window
        restoreAll: function () {
            Window.instances.each(function (window, index) {
                window.show();
                window.restore();
            });
        },
        //Finds a window by name
        findWindowByName: function (windowName) {
            return ControlManager.findControlByName(Window.instances, windowName);
        },
        //Finds a window by controlId
        findWindowById: function (windowId) {
            return ControlManager.findControlByID(Window.instances, windowId);
        },
        //Retrieves the window with the highest zIndex(if a window has the alwaysOnTop property, it will retrieve that window)
        getTopmostWindow: function () {
            var topMostWindow;
            Array.each(Window.instances, function (win) {
                if (!win.element || !win.element.getParent()) return;
                if (topMostWindow && topMostWindow.alwaysOnTop) return;
                if (!topMostWindow || win.alwaysOnTop || win.element.getStyle('zIndex').toInt() > topMostWindow.element.getStyle('zIndex').toInt())
                    topMostWindow = win;
            });
            return topMostWindow;
        }
    });

    //Instantiate the WindowManger
    Controls.WindowManager = new WindowManager();

    //----------------
    //The Singleton Timer
    //----------------
    //This internal class is responsible for triggering events that update dateTime related controls
    //The intention was originally to allow users to set a time zone for the application.  This would allow users to view times locally to the
    //project they are working on, not based on where they are currently located.  This functionality still needs to be implemented.
    //Currrently this class is used by the Clock control
    var Timer = new Class({
        Implements: Events,
        Singleton: true,
        //Fields
        time: nil,
        timeZone: nil,
        timer: nil,
        interval: 10,
        ticks: 0,
        initialize: function () {
            this.time = new Date();
            this.ticks = Date.parse(this.time.toString()); //this.ticks represents the parsed date value, in milliseconds.  We will use it to determine the current time rather than calling new Date() at a specified interval
            this.timer = setInterval(this.timeInterval.bind(this), this.interval); //The timer will fire the timeInterval every x miliseconds, where x is the value of this.interval.
            //NOTE: setting this.interval to less than 10 milliseconds may cause the performance of the class to decrease.
        },
        //Destructor
        dispose: function () {
            clearInterval(this.timer);
        },
        //Methods
        //Gets the time based on the current timezone and (optional) output format
        getTime: function (format) {
            return new Date().format(format);
        },
        //Sets the GMT offset value *NOTE* This is currently not implemented.  The value passed should be a number betweeen -12 and 14 (reprenting the UTC offset)
        setTimeZone: function (value) {
            value = value.toInt();
            if (!(value >= -12 && value <= 14) || isNaN(value)) throw 'An invalid UTC offset was provided';
            this.timeZone = value;
        },
        //Fires increment events, passing this as an argument
        timeInterval: function () {
            this.ticks = this.ticks + this.interval; //Increment the number of ticks by our interval value (how many miliseconds have gone by)
            if (!(this.ticks % 1000)) this.fireEvent('second');
            if (!(this.ticks % 60000)) this.fireEvent('minute');
            if (!(this.ticks % 3600000)) this.fireEvent('hour');
            if (!(this.ticks % 86400000)) this.fireEvent('day');
            if (!(this.ticks % 31536000000)) this.fireEvent('year');
            //If there is no remainder for this.ticks divided by an interval value, then fire that interval's event
        }
    });

    //Instantiate the Timer class
    Controls.Timer = new Timer();

    //----------------
    // Control Setters and Getters
    //----------------

    //Override for setStyle which also sets the appropriate field value on the Control class itself
    //A few things of note here: First off, notice we are synchronizing the style property with the control class itself.
    //The idea is to have the control be a true facade for the Element class, so rather than referencing Control.element.style.height,
    //we are referencing Control.height (or
    var $Control$Set$Style = function (property, value) {
        if (!this.element) return;
        Element.setStyle(this.element, property, value);
        if (!this.saveState) this[property] = this.element.getStyle(property);
        this.fireEvent(property + '_changed');
    },
    $Invoke = function (object, method, args) {
        object[method](args);
    },

    //----------------
    // Control Helper Methods
    // Machine functions to perform specific, non-exposed tasks
    //----------------

    /* Calculate all relevant dimensions of a control object with the option of specifying a relative parentControl
    -Height -
    -Width -
    -Padding (top, right, bottom, left) -
    -Margin (top, right, bottom, left) -
    -Border (top, right, bottom, left) -
    -Actual Height - width including border, margin and padding
    -Actual Width - width including border, margin and padding
    -Maximum Height - Maximum allowable height of the control based on the constraints of the parent control
    -Maximum Width - Maximum allowable width of the control based on the constraints of the parent control
    -Top: Relative position from the top of the control's parent element
    -Left: Relative position from the left of the control's parent element
    */
    $Calculate$Control$Dimensions = function (control, parentControl) {
        if (!control.element) return;
        parentControl = parentControl || control.parentControl;
        //If there is an instantiated Desktop control and the parentControl is the document.body, set the parentControl
        //to the Desktop (for purposes of determining max sizes
        if (parentControl === body && Controls.Desktop && !(control instanceof Desktop)) parentControl = Controls.Desktop;
        parentControl = parentControl.element || doc.documentElement;
        //NOTE: we are calling parseInt on all values rather than passing strings.
        var parentHeight = parseInt(parentControl.clientHeight),
        parentWidth = parseInt(parentControl.clientWidth),
        controlHeight = parseInt(control.element.clientHeight),
        controlWidth = parseInt(control.element.offsetWidth),
        parentPadding = {}, //We will be determining the top, right, bottom and left values of each of the following styles
        elementMargin = {},
        elementBorder = {},
        elementPadding = {},
        actualHeight, actualWidth, maxHeight, maxWidth, top, left;

        //Get the element's padding, border and margin values, as well as the parent's padding                   
        Array.each(['top', 'right', 'bottom', 'left'], function (pad) {
            elementMargin[pad] = parseInt(control.element.getStyle('margin-' + pad) || 0);
            elementBorder[pad] = parseInt(control.element.getStyle('border-' + pad + '-width') || 0); //We are actually interested in the border-width style, not the entire border style
            elementPadding[pad] = parseInt(control.element.getStyle('padding-' + pad) || 0);
            parentPadding[pad] = parseInt($(parentControl).getStyle('padding-' + pad) || 0);
        });

        //Define the actual height and width of the control, including all padding and margins
        actualHeight = controlHeight + elementBorder.top + elementBorder.bottom + elementPadding.top + elementPadding.bottom + elementMargin.top + elementMargin.bottom;
        actualWidth = controlWidth + elementBorder.left + elementBorder.right + elementPadding.left + elementPadding.right + elementMargin.left + elementMargin.right;

        //Define the max height and width as the parent dimensions less the borders, margins and padding pof the control
        maxHeight = parentHeight - parentPadding.top - parentPadding.bottom - elementMargin.top - elementMargin.bottom - elementBorder.top - elementBorder.bottom - elementPadding.top - elementPadding.bottom;
        maxWidth = parentWidth - parentPadding.left - parentPadding.right - elementMargin.left - elementMargin.right - elementBorder.left - elementBorder.right - elementPadding.left - elementPadding.right;

        top = parseInt(control.get('top'));
        left = parseInt(control.get('left'));
        //If the control does not have a top or left value, pass the offetTop and offsetLeft values
        if (isNaN(top)) top = control.element.offsetTop;
        if (isNaN(left)) left = control.element.offsetLeft;
        //Lastly, return an object containing all the dimension values
        return {
            height: controlHeight,
            width: controlWidth,
            padding: elementPadding,
            border: elementBorder,
            margin: elementMargin,
            actualHeight: actualHeight,
            actualWidth: actualWidth,
            maxHeight: maxHeight,
            maxWidth: maxWidth,
            top: top,
            left: left
        };
    },

    //----------------
    //The base of all controls
    //----------------
    Control = Controls.Control = new Class({
        Implements: [Events, Options],
        //Options / Events
        options: {
            /*
            //Events
            onBeforeRender,
            onRender,
            onAfterRender,
            OnBeforeShow,
            OnShow,
            OnAfterShow,
            OnBeforeHide,
            OnHide,
            OnAfterHide,
            oncontroladded,
            oncontrolremoved,
            */
            //The element this control will create on toElement or nil
            elementBase: 'div',
            //The options this control will create on the element with the toElement method or nil
            elementOptions: {
                events: {},
                'class': 'control',
                title: nil
            },
            //The title of this control seen on mouseover
            title: nil,
            //The parentControl of this Control
            parent: nil,
            //The childrenControls of this Control
            children: nil,
            //The ControlFlags of this Control
            ControlFlags: 0,
            //The ControlStyles of this Control
            ControlStyles: 0
        },

        //Fields,
        name: nil, //The name of this control
        id: nil, //The id of this control
        rendered: false, //the property indicating if this Control has been rendered
        isVisible: true, //Indicates if the control is visible
        element: nil, //The Element Of this Control
        parentControl: nil, //The parent Control of this Control
        children: nil, //The children of this Control
        drag: nil, //The Drag instance for this Control

        //Dimensions
        height: nil, //The actual height, including padding, margins and borders, of this control in pixels
        maxHeight: nil, //The maximum allowable height of this control
        width: nil, //The width, including padding, margins and borders, of this control in pixels
        maxWidth: nil, //The maximum allowable width of this control
        left: nil, //The left in pixels of this control from the screen's left edge
        top: nil, //The top in pixels of this control from the screen's top edge
        zIndex: -1, //The zIndex of this control

        //Constructor
        initialize: function (options) {
            //ensure we have options in the propper place 
            if (options && options.elementOptions) {
                options = Object.merge(options, options.elementOptions);
                if (options.elementOptions.events) options = Object.merge(options, options.elementOptions.events);
                if (options.elementOptions.styles) options = Object.merge(options, options.elementOptions.styles);
            };

            //To avoid running out of stack space if we are rendering many controls, store the parent on the instance itself and delete it from options. 
            //This will prevent the setOptions method from having to set each parent option each time a new child control is rendered.
            //If there is no parentControl defined, set the parentControl as the documentBody
            if (options && options.parent) {
                this.parentControl = options.parent;
                delete options.parent;
            } else this.parentControl = body;

            //Maintain default ControlFlags by OR'ing with the provided ControlFlags
            if (options && options.ControlFlags) {
                options.ControlFlags = this.options.ControlFlags | options.ControlFlags;
            };

            //Same with ControlStyles
            if (options && options.ControlStyles) {
                options.ControlStyles = this.options.ControlStyles | options.ControlStyles;
            };

            //Define the children field as an array
            this.children = [];

            //Set the options on the instance
            this.setOptions(options);

            //Get the id of the control
            this.id = Controls.ControlManager.NextId();

            //Set the name of the control
            this.name = this.options.name;

            //Keep self reference
            var self = this;

            //Set Events
            self.addEvent('afterRender', function () {
                //if the draggable option is true, set an instance of Drag to this element
                if (self.hasControlFlag(ControlFlags.Drag)) {
                    self.drag = new Drag.Move(self.element, {
                        handle: self.element,
                        snap: 0,
                        container: $(self.parentControl)
                    });
                }
                //IE6 7 8 problem is here, thanks andrew
                if (self.element) {
                    self.element.addEvent('click', function (e) {
                        try {
                            //if (e) e.stop(); //prevent the click event from bubbling up through the DOM
                            //Check for the existence of the Dock...
                            //... and make sure the menu is visible...
                            //... and double check that this isn't the menu we've clicked on...
                            //... or that we haven't clicked on the menu button....
                            //... then ensure that the target of our click event isn't the menu (different than "this" being the control menu, this will handle clicking on something that may be behind the control menu)
                            //..ensure that the target is not a child of the control menu...
                            //... lastly, ensure the element clicked was not a child of the control menu
                            if (e && Controls.Dock && Controls.Dock.menu.isVisible && self !== Controls.Dock.menu && self !== Controls.Dock.menuButton && e.target !== Controls.Dock.menu.element && !e.target.getParent('.controlMenu') && !self.element.getParent('.controlMenu')) {
                                Controls.Dock.menu.hide();
                            };
                        }
                        catch (Error) {
                            return;
                        }
                    });
                }; //End if
            });
        },
        //This class will keep track of all instantiated instances of Control
        //The instances of Control are used by the ControlManager class
        TrackInstances: true,
        //Destructor
        dispose: function () {
            //Traverse the children of each control calling their destructor
            //if (!this.rendered) return;
            this.children.each(function (child, index) {
                //remove the child from the DOM
                child.dispose.attempt();
            }, this);
            //if there is a DOM element, dispose it
            if (this.element && $(this.element).getParent()) {
                this.element.dispose();
            }
            this.element = null;
            this.rendered = false;
            Controls.ControlManager.disposeControl(this);
        },
        //Methods
        //Overrides the class set and get methods
        set: function (property, value) {
            property = property.camelCase();
            //If this Control has an element and this property is a style, set the element with that style as well
            if (this.element && this.element.style[property] !== undef) {
                this.element.setStyle(property, value);
                if (!this.saveState) this[property] = value; //if the control is in save state mode, simply return the value, else set the value
            } else {
                if (this.element && this.element[property] != undef) this.element.set(property, value);
                this[property] = value; //if the property is not a stylistic property, set the property
            }
            this.fireEvent(property + '_changed'); //fire changed event
            return value;
        } .overloadSetter(),
        get: function (property) {
            property = property.camelCase();
            return this[property] || $(this).getStyle(property) || null;
        } .overloadGetter(),
        //This should be the only place a toElement is called, if force is specified we need to update the element using the properties
        toElement: function (force) {
            //If there is no element but we specify a baseElement create it
            if (!this.element && this.options.elementBase) {
                this.element = new Element(this.options.elementBase);
                if (this.options.elementOptions && this.options.elementOptions.events) {
                    this.element.addEvents(this.options.elementOptions.events);
                    delete this.options.elementOptions.events;
                }
                //Override the default setStyle method with one that will also apply the style property to the Control class
                this.element.setStyle = $Control$Set$Style.bind(this);
            }

            //If we are forced then this is a call from render to update the element and we already have an element
            if (force === true && this.isVisible) {
                //Check this control's ControlStyles
                if (this.hasControlStyle(ControlStyles.Fill)) {//Set the element to fill the parent container
                    this.element.setStyles({ width: '100%', height: '100%' });
                }
                if (this.hasControlStyle(ControlStyles.noSelect)) {
                    this.element.addClass('noSelect');
                    this.element.unselectable = 'on';
                }
                if (this.hasControlStyle(ControlStyles.Fixed)) {
                    this.element.setStyle('position', 'fixed');
                }
                this.element.set(this.options.elementOptions);
            }
            //return the element
            return this.element;
        },
        //This is how toElement should be called from our API
        render: function (all) {
            //Get a reference to yourself
            var self = this;
            //If yourself is the window we are not bound correctly!
            if (self === window) return;

            //check if the control is a) visible and b) already rendered
            if (self.isVisible && !self.rendered) {
                self.fireEvent('beforeRender');
                self.fireEvent('render');
                //render the element with all elementOptions
                self.toElement(all);

                //Once we have called the toElement method, the control itself is rendered, so we flag it as such
                //Note: because the render function checks the rendered status of a Control, it is necessary
                //to set the rendered status to true here, thus avoiding an endless loop
                self.rendered = true;

                if (all) {
                    //For each of the children of this parent we will call the child's render method, which returns the Control instance
                    //This parent will then grab the control
                    Array.each(self.children, function (child, index) {
                        //IE 8 Needs this scope to be retained with the try
                        try {
                            $(self).grab($(child.render(all)));
                        } catch (err) { }
                    });
                }

                //If this control's parent is the document.body then it needs to be injected into the DOM
                if (self.parentControl === body) $(self.parentControl).grab($(self));

                self.fireEvent('afterRender');
            };

            //Call the top most render function until we find a control with a parent of the documentBody
            //Note that this is outside the isVisible/rendered check.  We still want to render any parent controls even if this control
            //has been previously rendered
            if (all && this.parentControl && this.parentControl !== body) this.parentControl.render(all);

            return this;
        },
        //Resets all fields from the original options
        reset: function (children, render) {
            this.set(this.options);
            //Indicate this control is not rendered
            this.rendered = false;
            //It we should reset children too then reset the children
            if (children) {
                this.children.each(function (child, index) {
                    child.reset(children, render);
                }, this);
            }
            //If we want to render
            if (render) {
                this.render(true);
            }
        },
        show: function () {
            if (!this.hasControlFlag(ControlFlags.noShow) && this.element && !this.isVisible) {
                this.isVisible = true; //Flag the Control as visible...
                this.fireEvent('beforeShow');
                this.fireEvent('show');
                this.element.removeClass('noVisible'); //To avoid having to track what the default display property is for the Control, we'll simply add/remove a class that overrides the display property
                this.fireEvent('afterShow');
            }
        },
        hide: function () {
            if (!this.hasControlFlag(ControlFlags.noHide) && this.element && this.isVisible) {
                this.isVisible = false;
                this.fireEvent('beforeHide');
                this.fireEvent('hide');
                this.element.addClass('noVisible');
                this.fireEvent('afterHide');
            }
        },
        //Gets the actual dimensions, as integers.  The parentControl property can specify the control's dimensions realative to another control
        getDimensions: function (parentControl) {
            return $Calculate$Control$Dimensions(this, parentControl);
        },
        /*possible other methdos:
        grabControl: logic to have one control grab another control.  If rendered, this would move it to the grabbing control
        removeControls: remove multiple controls simultaneously
        */
        //Adds a single control to as a child to this control
        addControl: function (childControl) {
            this.addControls(Array.from(childControl));
        },
        //Adds an array of controls to this control and flags this control as not rendered
        addControls: function (childControls) {
            this.children.append(childControls);
            this.rendered = false;
            this.fireEvent('controlLoaded', childControls);
        },
        //Removes a control from a this control and disposes it.
        removeControl: function (childControl) {
            this.children.erase(childControl);
            childControl.dispose();
            this.rendered = false;
            this.fireEvent('controlRemoved', childControl);
        },
        removeAllControls: function () {
            var children = this.children;
            children.each(function (child) {
                child.dispose();
            });
            this.children = [];
            this.rendered = false;
            this.fireEvent('controlRemoved', children);
        },
        //removes children from this control that have a different control as a parent
        removeChildrenOf: function (parentControl) {
            Array.each(this.children, function (childControl, index) { //Find and Remove the child preview control associated with the control
                if (childControl.parentControl === parentControl) {
                    this.removeControl(childControl);
                };
            }, this);
        },
        //Find a control by the given controlId
        findControlByID: function (controlId) {
            return Controls.ControlManager.findControlByID(controlId, this);
        },
        //Find a control by the given controlName
        findControlByName: function (controlName) {
            return Controls.ControlManager.findControlByName(controlName, this);
        },
        //Find all control by the given Control Prototype
        findControlsByType: function (controlType) {
            return Controls.ControlManager.findControlsByType(controlType, this);
        },
        //Find all control by the given ControFlag
        findControlsByControlFlag: function (controlFlag) {
            return Controls.ControlManager.findControlsByFlag(controlFlag, this);
        },
        hasControlFlag: function (controlFlag) {
            return ControlFlags.hasControlFlag(this.options.ControlFlags, controlFlag);
        },
        hasControlStyle: function (controlStyle) {
            return ControlStyles.hasControlStyle(this.options.ControlStyles, controlStyle);
        }
    }),
    //----------------
    //A Textarea Control
    //----------------

    Textarea = Controls.Textarea = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options / Events
        options: {
            click: nil,
            //SomeOption
            someTextareaOption: nil,
            //The element this control will create on toElement or nil
            elementBase: 'div',
            //The options this control will create on the element with the toElement method or nil
            elementOptions: {
                contentEditable: true,
                events: {},
                title: nil,
                'class': 'textArea'
            }
        },
        //Fields,
        caretPosition: -1,
        //Constructor
        initialize: function (options) {
            this.parent(options);
        },
        someTextareaMethod: function () { },
        getCaretPosition: function () {
            return this.caretPosition;
        }
    }),

    //----------------
    //A Clock Control
    //----------------
    //A control for showing the current time.  
    Clock = Controls.Clock = new Class({
        Extends: Control,
        options: {
            elementOptions: {
                events: {},
                styles: {},
                'class': 'clock'
            },
            format: nil,
            ControlStyles: ControlStyles.noSelect
        },
        //Fields
        time: nil,
        //Constructor
        initialize: function (options) {
            if (!Controls.Timer) throw 'No Timer instance found!';
            this.parent(options);
            this.addEvents({
                'afterRender': this.displayTime,
                'second': this.displayTime
            });
            Controls.Timer.addEvents({ //Trigger events from on the timer tick events
                'second': this.fireEvent.pass('second', this),
                'minute': this.fireEvent.pass('minute', this),
                'hour': this.fireEvent.pass('hour', this),
                'day': this.fireEvent.pass('day', this),
                'year': this.fireEvent.pass('year', this)
            });
        },
        //gets the current time in the format specified by the options
        getTime: function () {
            return this.time = Controls.Timer.getTime(this.options.format);
        },
        //displays the current time 
        displayTime: function () {
            return this.element.innerHTML = this.getTime();
        }
    }),

    //----------------
    //A Button Control
    //----------------
    Button = Controls.Button = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options / Events
        options: {
            //The element this control will create on toElement or nil
            elementBase: 'button',
            //The options this control will create on the element with the toElement method or nil
            elementOptions: {
                events: {},
                'class': 'button',
                title: nil,
                text: nil
            }
        },
        //Fields
        backgroundPosition: nil, //the default background position of the button control
        //Constructor
        initialize: function (options) {
            this.parent(options);
            this.backgroundPosition = '0px 0px';
            this.addEvent('afterRender', this.resetBackground.bind(this));
        },
        toElement: function (force) {
            if (!this.element) {
                this.parent(force);
                this.element.addEvents({
                    'mouseenter': function () {
                        this.offsetBackground(0, -(this.getDimensions().height))
                    } .bind(this),
                    'mouseleave': this.resetBackground.bind(this),
                    'mouseup': this.element.blur //Some browsers will continue to focus on a button after it has been clicked
                });
                return this.element;
            } else return this.parent(force);
        },
        //Offset the background of the button to accommodate mouseover effects.  This original background is stored.
        offsetBackground: function (x, y) {
            if (!this.rendered) return;
            this.saveState = true;
            var size = this.getDimensions();
            if (x != 0) x = x || size.width;
            if (y != 0) y = y || size.height;
            this.set('backgroundPosition', x + 'px ' + y + 'px');
            return this;
        },
        resetBackground: function () {
            if (this.backgroundPosition) this.set('backgroundPosition', this.backgroundPosition);
            this.saveState = false;
            return this;
        }
    }),

    //----------------
    //A ScrollBar Control
    //----------------
    ////TODO

    //A Control with a Panel and 3 buttons, 1 Button is the Move up, the middle is the position button and the 3rd is the Move down button,
    //The middle button should be draggable
    //When the buttons are clicked the parents panel's scrollTop is offset the amount of the moveUP / moveDown or the different in position from the middle button's new position to where it was
    //The parent should definitely be a control and maybe should even be a Panel
    //----------------

    //----------------
    //A Form Control
    //----------------
    Form = Controls.Form = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options
        options: {
            elementBase: 'form',
            elementOptions: {}
        },
        //Fields
        disabled: false,
        //Constructor
        initialize: function (options) {
            this.parent(options);
            //This event triggers disabling the entire form which prevents the inputs from being selected or validated
            this.addEvent('disabled_changed', function () {
                var disabled = this.get('disabled');
                this.children.each(function (child) {
                    if (child instanceof Input) {
                        child.set('disabled', disabled);
                    }
                });
            });
        }
    }),

    Legend = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options
        options: {
            elementBase: 'legend',
            elementOptions: {}
        },
        //Constructor
        initialize: function (options) {
            if (options && options.parent && !(options.parent instanceof Fieldset)) { //Add Details and Figure
                this.dispose();
                throw new Error('Legend must have a Fieldset, Details or Figure parent');
            }
            this.parent(options);
        }
    }),

    Fieldset = Controls.Fieldset = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options
        options: {
            elementBase: 'fieldset',
            legend: nil,
            elementOptions: {}
        },
        //Fields
        disabled: false,
        //Constructor
        initialize: function (options) {
            if (options && options.parent && !options.parent instanceof Form) {
                this.dispose();
                throw new Error('Fieldset must have a Form parent');
            };
            this.parent(options);
            if (this.options.legend) {
                this.children.include(new Legend({
                    elementOptions: {
                        html: this.options.legend
                    }
                }));
            };
            //As with Form, this event disables any child inputs
            this.addEvent('disabled_changed', function () {
                var disabled = this.get('disabled');
                this.children.each(function (child) {
                    if (child instanceof Input) {
                        child.set('disabled', disabled);
                    }
                });
            });
        }
    }),

    //----------------
    //An Input Control
    //----------------
    // Various Inputs, including text, password, checkbox, etc
    Input = Controls.Input = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options
        options: {
            elementBase: 'input',
            elementOptions: {}
        },
        //Fields
        type: nil,
        //Constructor
        initialize: function (options) {
            this.parent(options);
        },
        //Override toElement method
        toElement: function (force) {
            //This looks similar to the toElement method on the base Control class, but we also ensure we add a type
            if (!this.element && this.options.elementBase && this.options.elementOptions.type) {
                this.element = new Element(this.options.elementBase, { type: this.options.elementOptions.type });
                //Override the default setStyle method with one that will also apply the style property to the Control class
                this.element.setStyle = $Control$Set$Style.bind(this);
            };
            return this.parent(force);
        }
    });

    Input.Text = Controls.Input.Text = new Class({
        Extends: Input,
        Implements: [Events, Options],
        //Options
        options: {
            elementOptions: {
                type: 'text'
            }
        },
        //Constructor
        initialize: function (options) {
            this.parent(options);
        }
    });

    Input.Password = Controls.Input.Password = new Class({
        Extends: Input.Text,
        Implements: [Events, Options],
        //Options
        options: {
            elementOptions: {
                type: 'password'
            }
        },
        //Constructor
        initialize: function (options) {
            this.parent(options);
        }
    });

    Input.Submit = Controls.Input.Submit = new Class({
        Extends: Button, //Note that this input class extends Button, not Input, as it shares stylistic commonalities with the Button class
        Implements: [Events, Options],
        //Options
        options: {
            elementBase: 'input',
            elementOptions: {
                type: 'submit'
            }
        },
        //Constructor
        initialize: function (options) {
            this.parent(options);
        }
    });

    var Header = Controls.Header = new Class({
        Extends: Control,
        options: {
            elementBase: 'h1',
            elementOptions: {
                'class': 'headerLarge'
            }
        }
    });

    Header.Medium = Controls.Header.Medium = new Class({
        Extends: Header,
        options: {
            elementBase: 'h2',
            elementOptions: {
                'class': 'headerMedium'
            }
        }
    });

    Header.Small = Controls.Header.Small = new Class({
        Extends: Header,
        options: {
            elementBase: 'h3',
            elementOptions: {
                'class': 'headerSmall'
            }
        }
    });

    //----------------
    //A Panel Control
    //----------------
    //Panel will eventually need to link up with a Scrollbar control to display custom scrollbars
    var Panel = Controls.Panel = new Class({
        Extends: Control,
        //Fields
        scrollTop: nil, //Indicates how much this panel is scrolled from the top in pixel
        scrollLeft: nil, //Indicates how much this panel is scrolled from the left in pixel
        //Options / Events
        options: {
            somePanelOption: nil,
            //The element this control will create on toElement or nil
            elementBase: 'div',
            header: nil,
            //The options this control will create on the element with the toElement method or nil
            elementOptions: {
                'class': 'panel'
            }
        },
        //Fields,
        //Constructor
        initialize: function (options) {
            if (options && !options.parent instanceof Control) {
                this.dispose();
                throw new Error('Panel must have a Control parent');
            } else {
                this.parent(options);
            }
            if (this.options.header) {
                this.children.push(new Controls.Header.Medium({ elementOptions: { html: this.options.header} }));
            }
        },
        //Methods
        somePanelMethod: function () { },
        scrollLeft: function (amount) {
            if (this.hasControlFlag(ControlFlags.noScroll) || !this.element) return;
            //adjust scrollLeft in this class and then render
            this.render(true);
        },
        scrollRight: function (amount) {
            if (this.hasControlFlag(ControlFlags.noScroll) || !this.element) return;
            //adjust scrollLeft in this class and then render
            this.render(true);
        },
        scrollUp: function (amount) {
            if (this.hasControlFlag(ControlFlags.noScroll) || !this.element) return;
            //adjust scrollTop in this class and then render
            this.render(true);
        },
        scrollDown: function (amount) {
            if (this.hasControlFlag(ControlFlags.noScroll) || !this.element) return;
            //adjust scrollTop in this class and then render
            this.render(true);
        },
        scrollTo: function (x, y) {
            if (this.hasControlFlag(ControlFlags.noScroll) || !this.element) return;
            //adjust scrollTop, scrollLeft in this class and then render
            this.render(true);
        }
    }),

    //A Control that wraps a DOMElement in a Control class, allowing it to be added to other controls
    //This is particularly useful in passing non-Control templates to a control.
    DOMElement = Controls.DOMElement = new Class({
        Extends: Panel,
        //options
        options: {
            element: nil
        },
        //constructor
        initialize: function (options) {
            this.parent(options);
        },
        toElement: function () {
            if (!this.element && this.options.element) {
                this.element = this.options.element || new Element('div');
            }
            return this.element;
        },
        //Cannot add children to a DOMElement control
        addControls: function () {
            return false;
        }
    }),

    //----------------
    //The WindowFrame of a Window Control
    //----------------

    WindowFrame = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options / Events
        options: {
            /*
            //Events
            OnBeforeClose,
            OnClose,
            OnAfterClose,
            OnBeforeMinimize,
            OnMinimize,
            OnAfterMinimize,
            OnBeforeMaximize,
            OnMaximize,
            OnAfterMaximize,
            OnBeforeResize,
            OnResize,
            OnAfterResize
            */
            //Options
            elementOptions: {
                title: '',
                events: {},
                'class': 'windowFrame'
            },
            //indicates the text, if any, that appears at the top of the window
            header: nil,
            ControlStyles: ControlStyles.Fill
        },
        //Fields,
        //The Header of this WindowFrame
        header: nil,
        //The Panel of this WindowFrame
        panel: nil,
        //The Status Bar of the WindowFrame
        statusBar: nil,
        //The Resize Control of the WindowFrame
        resizeControl: nil,
        //Constructor
        initialize: function (options) {
            if (options && options.parent && !options.parent instanceof Window) {
                this.dispose();
                throw new Error('WindowFrame must have a Window parent');
            }
            this.parent(options);
            var self = this;
            //If the Control cannot be minimized, then don't add the minimize button
            //Create three buttons in the WindowFrame without using addControl to keep event overhead down when not needed
            if (!this.parentControl.hasControlFlag(ControlFlags.noMinimize))
                this.children.include(new Button({
                    parent: this,
                    name: 'Minimize',
                    elementOptions: {
                        title: 'Minimize',
                        'class': 'button controlButton minimize',
                        styles: {
                            'vertical-align': 'top'
                        },
                        events: {
                            'click': this.parentControl.minimize.bind(this.parentControl)
                        }
                    }
                }));
            if (!this.parentControl.hasControlFlag(ControlFlags.noMaximize))
                this.children.include(new Button({
                    parent: this,
                    name: 'Maximize',
                    elementOptions: {
                        title: 'Maximize',
                        'class': 'button controlButton maximize',
                        events: {
                            'click': this.parentControl.maximize.bind(this.parentControl)
                        }
                    }
                }));
            //Add the close button which all Windows have
            this.children.include(new Button({
                parent: this,
                name: 'Close',
                elementOptions: {
                    title: 'Close',
                    'class': 'button controlButton close',
                    styles: {
                        'vertical-align': 'top'
                    },
                    events: {
                        'click': function (e) {
                            //this.parentControl.close.bind(this.parentControl);
                            self.parentControl['close']();
                        }
                    }
                }
            }));

            this.header = new Label({
                parent: this,
                elementOptions: {
                    html: this.options.header,
                    'class': 'label header'
                },
                ControlStyles: ControlStyles.noSelect
            });
            this.children.include(this.header);
            //Create a panel in the WindowFrame without using addControl to keep event overhead down when not needed
            //Assign the panel Field
            this.panel = new Panel({
                parent: this,
                elementOptions: {
                    'class': 'panel windowPanel'
                }
            });
            this.children.include(this.panel);
            //Create a status bar at the bottom of the windowFrame which will be updated by the parent window control.
            this.statusBar = new Label({
                parent: this,
                elementOptions: {
                    'class': 'label statusBar'
                },
                ControlStyles: ControlStyles.noSelect
            });
            this.children.include(this.statusBar);
            //var $statusBarText;

            this.resizeControl = new Button({
                parent: this,
                elementOptions: {
                    'class': 'button resizeControl'
                }
            });
            this.children.include(this.resizeControl);
        }
        //Methods
    }),
    matrixString2D = 'matrix({a},{c},{b},{d},{tX},{tY})',
    //----------------
    //A Window Control
    //----------------
    Window = Controls.Window = new Class({
        Extends: Control,
        Implements: [Events, Options],
        //Options / Events
        options: {
            /*
            //Events
            OnBeforeClose,
            OnClose,
            OnAfterClose,
            OnBeforeMinimize,
            OnMinimize,
            OnAfterMinimize,
            OnBeforeMaximize,
            OnMaximize,
            OnAfterMaximize,
            */
            //Options
            elementOptions: {
                title: '',
                events: {},
                'class': 'window'
            },
            //defines the text, if any, that appears at the top of the window
            header: nil,
            //determines if this window will always appear on top of other windows
            alwaysOnTop: false,
            //sets the ability to move this window
            ControlFlags: ControlFlags.Drag
        },
        //Fields
        //The WindowFrame of this Window
        windowFrame: nil,
        //The Header of this Window
        header: nil,
        //The Panel of this Window
        panel: nil,
        //The Status Bar of this Window
        statusBar: nil,
        //The Resize control of this Window
        resizeControl: nil,
        //Modalities of this window
        modals: [],
        //The minimize effect for this window
        minimizeFx: nil,
        //The maximize effect for this window
        maximizeFx: nil,
        minimized: false,
        maximized: false,
        //Constructor
        initialize: function (options) {
            if (options && options.parent) {
                this.dispose();
                throw new Error('Window must not have a parent');
            }
            this.parent(options);
            this.name = this.options.header || 'New Window';
            //Create the WindowFrame of the Window without using addControl to keep event overhead down when not needed
            //the include call here may be redundant since passing a parent option will automatically add the new control to the parent's children array
            this.windowFrame = new WindowFrame({ parent: this, header: this.name });

            this.children.include(this.windowFrame);
            this.header = this.windowFrame.header;
            //Assign the Panel Field
            this.panel = this.windowFrame.panel;
            this.statusBar = this.windowFrame.statusBar;
            this.resizeControl = this.windowFrame.resizeControl;

            var self = this;

            this.panel.addEvent('resize', function () {
                //set the panel to fill the entire windowFrame, minus the controls and statusBar
                var panelSize = self.panel.getDimensions(),
                //frameSize = this.windowFrame.getDimensions(), //calculate the dimensions of the windowFrame, header, and statusBar
                headerSize = self.header.getDimensions(),
                statusBarSize = self.statusBar.getDimensions();
                if (!panelSize || !headerSize || !statusBarSize) return;
                var panelHeight = panelSize.maxHeight - headerSize.actualHeight - statusBarSize.actualHeight,
                panelWidth = panelSize.maxWidth;

                if (panelHeight <= 0) panelHeight = 'auto';
                if (panelWidth <= 0) panelWidth = 'auto';

                $(self.panel).setStyles({ 'height': panelHeight, 'width': panelWidth });
            });

            this.header.addEvent('resize', function () {
                var headerSize = self.header.getDimensions(), buttonControlWidth = 0, headerWidth;

                ['Close', 'Maximize', 'Minimize'].each(function (buttonControl) {
                    buttonControl = self.windowFrame.findControlByName(buttonControl);
                    if (buttonControl) buttonControlWidth += buttonControl.getDimensions().actualWidth;
                });

                headerWidth = headerSize.maxWidth - buttonControlWidth;

                if (headerWidth <= 0) headerWidth = 'auto';

                self.header.set('width', headerWidth);
            });

            if (!self.hasControlFlag(ControlFlags.noResize)) {
                self.resizeControl.addEvents({
                    'afterRender': function () {
                        $(self).makeResizable({
                            handle: $(self.resizeControl),
                            limit: { x: [200, document.documentElement.clientWidth], y: [200, document.documentElement.clientHeight] },
                            onStart: function (element, event) {
                                if (self.maximized) {
                                    self.maximized = self.saveState = false;
                                }
                                //$statusBarText = self.statusBar.element.get('text');
                                if (event) {
                                    if (event.page.x >= document.documentElement.clientWidth) event.stop();
                                    if (event.page.y >= document.documentElement.clientHeight) event.stop();
                                }
                            },
                            onDrag: function (element, event) {
                                if (element) {
                                    self.fireEvent('resize');
                                    //should be done on render?
                                    //self.setStatus(self.statusBar.element.get('text'));
                                }
                            },
                            onComplete: function (element, event) {
                                if (element) {
                                    self.height = element.getStyle('height').toInt();
                                    self.width = element.getStyle('width').toInt();
                                    self.top = element.getStyle('top').toInt();
                                    self.left = element.getStyle('left').toInt();
                                }
                            }
                        });
                    }
                    //add mousedown & mouseup bindings to attach/detach drag
                });
            } else {
                $(self.resizeControl).setStyle('cursor', 'not-allowed');
            };

            this.addEvents({
                'beforeRender': function () {
                    if (!self.rendered) {
                        self.windowFrame.rendered = false;
                        self.panel.rendered = false;
                        self.statusBar.rendered = false;
                    }
                },
                'afterRender': function () {
                    //if there is a drag instance set for this control...
                    if (self.drag) {
                        //detach the drag from this element so it doesn't interfere with the resize event
                        self.drag.detach();
                        //Add events to the header to attach and detach the drag instance.  This essentailly makes the header the 'handle'
                        $(self.header).addEvents({
                            mousedown: self.drag.attach.bind(self.drag),
                            mouseup: self.drag.detach.bind(self.drag)
                        });
                        //Add event to check if the window is maximized.  If it is, 'un-maximize' it.
                        self.drag.addEvent('beforeStart', function (el) {
                            if (self.maximized) self.maximize();
                        });
                    }

                    //Cascade the window relative to the topmost cascade-able window
                    //this.cascade();
                    self.bringToFront();

                    if (!self.hasControlFlag(ControlFlags.noMinimize)) {
                        //Pure CSS3 (Safari, Chrome, Opera, Firefox 4+)
                        if (!Browser.ie && !(Browser.firefox && Browser.version < 3.7)) {
                            self.element.addClass('minTransiton'); //simply add the transition class, which defines the transition property on all transforms   
                            self.element.addEvents({
                                'transitionEnded': function () {
                                    if (self.minimized) {
                                        self.hide();
                                    } else {
                                        self.show();
                                    }
                                }
                            });
                            self.element.addListener('webkitTransitionEnd', function () {
                                self.fireEvent('transitionEnded');
                            });
                            self.element.addListener('oTransitionEnd', function () {
                                self.fireEvent('transitionEnded');
                            });
                            self.element.addListener('transitionend', function () {
                                self.fireEvent('transitionEnded');
                            });
                        } else {
                            self.minimizeFx = new Fx.Morph(self.element, {
                                duration: 300,
                                onStart: self.fireEvent.pass('minimize', self),
                                onComplete: function () {
                                    self.saveState = false;
                                    self.hide();
                                    self.fireEvent('afterMinimize');
                                },
                                transition: Fx.Transitions.Expo.easeIn
                            });
                            self.restoreFx = new Fx.Morph(self.element, {
                                duration: 300,
                                onComplete: function () {
                                    self.show();
                                },
                                transition: Fx.Transitions.Expo.easeOut
                            });
                        }
                    }
                    if (!self.hasControlFlag(ControlFlags.noMaximize)) {
                        self.maximizeFx = new Fx.Morph(this.element, {
                            duration: 100,
                            onStart: self.fireEvent.pass('maximize', self),
                            onComplete: function () {
                                self.fireEvent('afterMaximize');
                                self.saveState = self.maximized;
                            }
                        });
                    }
                    //Add an event to this element so that when it is clicked this window comes to the front
                    self.element.addEvent('mousedown', self.bringToFront.bind(self));
                    //Set the zIndex of the window to the index of this window.  This will layer windows in the order they were initialized.
                    self.element.setStyle('zIndex', Window.instances.indexOf(self));
                    //trigger the resize event to ensure the window fits inside the current desktop view
                    self.fireEvent('resize');
                    //Set the status bar to indicate the window was loaded correctly
                    self.setStatus('Loaded!');
                },
                'afterMaximize': function () {
                    self.windowFrame.fireEvent('afterMaximize');
                    self.fireEvent('resize');
                },
                'afterMinimize': self.windowFrame.fireEvent.pass('afterMaximize', self.windowFrame),
                'afterMinimize': self.windowFrame.fireEvent.pass('afterMinimize', self.windowFrame),
                'resize': function () {
                    if (!self.rendered) return; //If this Window is not rendered, no sense continuing.
                    var controlSize = self.getDimensions(); //get the actual dimensions of the window
                    //One of the main purposes of this code is to ensure that the size of the window never exceeds the available desktop size.
                    //This ensures that windows are not 'lost' outside the bounds of the desktop or become partially inaccessable.
                    if (controlSize.maxHeight < 0) {
                        controlSize.maxHeight = 0; //We have to check for negative values for the height and width.  Setting a negative style for a height will cause an error.
                    }
                    if (controlSize.maxWidth < 0) {
                        controlSize.maxWidth = 0;
                    }
                    if (controlSize.actualHeight > controlSize.maxHeight) { //In the event that the Window height or width exceeds the maximum allowed value, set the height/width to the maximum size
                        controlSize.actualHeight = self.set('height', controlSize.maxHeight);
                    }
                    if (controlSize.actualHeight + controlSize.top > controlSize.maxHeight) { //we also need to make sure that the window is positioned so that no part of it is outside the bounds of the desktop
                        self.set('top', controlSize.top - ((controlSize.actualHeight + controlSize.top) - controlSize.maxHeight));
                    }
                    if (controlSize.actualWidth > controlSize.maxWidth) {
                        controlSize.actualWidth = self.set('width', controlSize.maxWidth);
                    }
                    if (controlSize.actualWidth + controlSize.left > controlSize.maxWidth) {
                        self.set('left', controlSize.left - ((controlSize.actualWidth + controlSize.left) - controlSize.maxWidth));
                    }
                    //set the panel height to fill the entire windowFrame
                    self.panel.fireEvent('resize');
                    //set the header to expand the entire width of the windowFrame
                    self.header.fireEvent('resize');
                },
                'afterResize': self.windowFrame.fireEvent.pass('afterResize', self.windowFrame),
                'beforeHide': function () {
                    $(self).fade('out');
                },
                'beforeShow': function () {
                    $(self).fade('in');
                }
            });

            //When the desktop is resized, trigger an event to resize the window to fit.
            if (Controls.Desktop) Controls.Desktop.addEvent('resize', self.fireEvent.pass('resize', self));

            //Notify the TaskManager if present
            if (Controls.TaskManager) Controls.TaskManager.fireEvent('windowCreated', self);
        },
        //This will allow WindowManager to track all window instances.
        TrackInstances: true,
        //Methods
        //Override the .addControls and removeControl methods.  Children are added to this window's panel
        addControls: function (childControls) {
            //Because the nature of a window is to house content we will override each childControl's parentControl property with this.panel
            Array.each(childControls, function (control) {
                if (control instanceof WindowFrame) this.children.include(control);
                else this.panel.children.include(control);
            }, this);
            this.rendered = false;
            this.fireEvent('controlLoaded', childControls);
        },
        removeControl: function (childControl) {
            this.panel.children.erase(childControl);
            this.panel.rendered = false;
            this.windowFrame.rendered = false;
            this.rendered = false;
            this.fireEvent('controlRemoved', childControl);
        },
        close: function (noCheck) {
            if (this.hasControlFlag(ControlFlags.noClose) || !this.element) return;
            //Ensure Modals are not open
            if (this.modals.length) {
                var modal = this.modals[this.modals.length - 1]; //was 0 giving the first, i want the last
                modal.show();
                modal.bringToFront();
                return modal.minimized ? modal.restore() : modal.shake();
            };
            this.fireEvent('beforeClose');
            this.fireEvent('close');
            //Notify the TaskManager if present
            if (Controls.TaskManager) Controls.TaskManager.fireEvent('windowDestroyed', this);
            if (Controls.Dock) Controls.Dock.fireEvent('windowDestroyed', this);
            Window.instances.erase(this);
            this.dispose();
            this.fireEvent('afterClose');
        },
        minimize: function (e) {
            if (this.hasControlFlag(ControlFlags.noMinimize) || !this.element || this.minimized) {
                return;
            }
            this.fireEvent('beforeMinimize');

            var height, width, top, left;

            //preserve our current settings so we can restore to this state;
            this.saveState = true;

            var previewButton = Controls.Dock.panel.findControlByName(this.id);

            if (!previewButton) return;
            var previewPosition = $(previewButton).getCoordinates(),
            dockPosition = $(Controls.Dock).getCoordinates(),
            windowPosition = $(this).getCoordinates(),
            windowSize = this.getDimensions(),
            scaleFactor = .2,
            xOffset = previewPosition.left - windowPosition.left,
            yOffset = dockPosition.top - windowPosition.top - (windowSize.actualHeight * scaleFactor),
            top = dockPosition.top - (windowSize.actualHeight * scaleFactor);

            yOffset = yOffset.toFixed(0);
            top = top.toFixed(0);

            if (Browser.safari || Browser.chrome) {
                this.element.style.webkitTransformOrigin = '0% 0%';
                this.element.style.webkitTransform = matrixString2D.substitute({ a: scaleFactor, b: 0, c: 0, d: scaleFactor, tX: xOffset, tY: yOffset });
            } else if (Browser.firefox && Browser.version > 3.5) {
                this.element.style.MozTransformOrigin = '0% 0%';
                this.element.style.MozTransform = matrixString2D.substitute({ a: scaleFactor, b: 0, c: 0, d: scaleFactor, tX: xOffset + 'px', tY: yOffset + 'px' });
            } else if (Browser.ie && Browser.version >= 9) {
                this.element.style.msTransformOrigin = '0% 0%';
                this.element.style.msTransform = 'scale(' + scaleFactor + ')';
            } else if (Browser.ie) {
                this.element.style.zoom = '20%';
            }
            if (this.minimizeFx instanceof Fx) { //If we don't support CSS3 transitions, we've instantiated the Fx fallback; if so, use it
                //start the effect, moving the element to the top-left corner and expanding it down the whole of the document
                this.minimizeFx.start({
                    top: top,
                    left: previewPosition.left
                });
            }
            this.minimized = true;
            this.hide.delay(333, this);

            if (Controls.TaskManager) Controls.TaskManager.fireEvent('windowMinimized', this);
        },
        maximize: function (e, force) {
            if (this.hasControlFlag(ControlFlags.noMaximize) || !this.element || this.minimized) return;
            //fire the beforeMaximize event prior to making any calculations
            this.fireEvent('beforeMaximize');
            //maximize and afterMaximize events are fired by the Fx class

            var height, width, top, left;

            //preserve our current settings so we can restore to this state;
            this.saveState = true;

            if (this.maximized && !force) {
                height = this.height.toInt();
                width = this.width.toInt();
                top = this.top.toInt();
                left = this.left.toInt();
                this.maximized = false;
            } else {
                //Next we get the height and width of the parentControl (if thie parent control is the document.body, we'll get the height and width of the document)
                var controlSize = this.getDimensions();

                height = controlSize.maxHeight;
                width = controlSize.maxWidth;
                left = 0;
                if (Controls.MenuBar) top = Controls.MenuBar.getDimensions().actualHeight;
                else top = 0;

                this.maximized = true;
            }
            //start the effect, moving the element to the top-left corner and expanding it down the whole of the document
            this.maximizeFx.start({
                top: top,
                left: left,
                height: height,
                width: width
            });
            //lastly, fire the windowMaximized event on the TaskManager
            if (Controls.TaskManager) Controls.TaskManager.fireEvent('windowMaximized', this);
        },
        restore: function (e) {
            //the window should be minimized at this time, restore it the location from where it was minimzed from
            if (!this.minimized) return;
            this.show(); //Show the window
            this.minimized = false;
            if (this.maximized) {
                this.maximize(e, true);
            }
            if (Browser.safari || Browser.chrome) {
                this.element.style.webkitTransform = 'scale(1)';
            } else if (Browser.firefox && Browser.version >= 3.5) {
                this.element.style.MozTransform = 'scale(1)';
            } else if (Browser.ie && Browser.version >= 9) {
                this.element.style.msTransform = 'scale(1)';
            } else {
                this.element.style.zoom = 1;
            }
            if (this.restoreFx instanceof Fx) { //If we don't support CSS3 transitions, we've instantiated the Fx fallback; if so, use it
                //start the effect, moving the element to the top-left corner and expanding it down the whole of the document
                this.restoreFx.start({
                    top: this.top,
                    left: this.left
                });
            }
            if (Controls.TaskManager) Controls.TaskManager.fireEvent('windowRestore', this);
        },
        shake: function () {
            if (!this.element) return;
            this.element.set('morph', { duration: 'short', transition: 'bounce:out' });
            this.element.morph({ 'margin': [0, -20] });
            this.element.morph({ 'margin': [-20, 0] });
            this.element.morph({ 'margin': [0, 20] });
            this.element.morph({ 'margin': [20, 0] });
        },
        center: function () {
            //add a control flag which does this for resize event?
            this.element.setStyle('left', (document.getCoordinates().width * .5) - (this.element.getComputedSize().width / 2));
            this.element.setStyle('top', (document.getCoordinates().height * .5) - (this.element.getComputedSize().height / 2));
        },
        bringToFront: function () {
            if (!this.element) return;
            //get the window that is currently on top
            var topWindow = Controls.WindowManager.getTopmostWindow();
            //if this is the top window, don't do anything.
            if (topWindow === this || !topWindow) return;
            //set the zIndex of this window to 1 more than the number of windows
            //Since window zIndex is initially it's index in the instance array, this guarantees this one will be on top
            this.element.setStyle('zIndex', Window.instances.length)
            //Set the zIndex of the topmost window to one less
            topWindow.element.setStyle('zIndex', this.element.getStyle('zIndex').toInt() - 1);
            if (Controls.TaskManager && !(this instanceof TaskManager)) Controls.TaskManager.fireEvent('windowBringToFront', this);
        },
        sendToBack: function () {
            if (this.options.alwaysOnTop || !this.element) return;
            this.element.setStyle('zIndex', ~(Window.instances.length + 1));
        },
        openModalWindow: function (windowOptions) {
            //You can only open ModalWindows relevant to this window instance from this method
            windowOptions = windowOptions || {};
            windowOptions.ControlStyles |= ControlStyles.Modal;
            windowOptions.ControlFlags |= ControlFlags.noResize | ControlFlags.noMinimize | ControlFlags.noMaximize | ControlFlags.noPreview;
            var modalWindow = new ASTI.Controls.Window(windowOptions);
            this.modals.push(modalWindow);
            //Remove the modal from the modal array when the modal closes
            modalWindow.addEvent('afterClose', function () {
                this.modals.erase(modalWindow);
            } .bind(this));
            //Return the modal window
            return modalWindow;
        },
        cascade: function () {
            if (this.hasControlFlag(ControlFlags.noCascade)) return;
            var topWindow = Controls.WindowManager.getTopmostWindow(),
            windowSize = this.getDimensions(),
            top, left;
            if (!topWindow) top = left = 0;
            else if (topWindow === this) return;
            else {
                var topWindowSize = topWindow.getDimensions();
                top = topWindowSize.top + 10;
                left = topWindowSize.left + 20;
            }
            if (top + windowSize.top + windowSize.height > Controls.Desktop.height.toInt()) top = 0;
            if (left + windowSize.left + windowSize.width > Controls.Desktop.width.toInt()) left = 0;
            this.set('top', top);
            this.set('left', left);
        },
        getStatus: function () {
            return this.statusBar;
        },
        setStatus: function (statusText) {
            $(this.statusBar).set('html', statusText);
        },
        scrollLeft: function (amount) {
            this.panel.scrollLeft(amount);
        },
        scrollRight: function (amount) {
            this.panel.scrollRight(amount);
        },
        scrollUp: function (amount) {
            this.panel.scrollUp(amount);
        },
        scrollDown: function (amount) {
            this.panel.scrollDown(amount);
        },
        scrollTo: function (x, y) {
            this.panel.scrollTo(x, y);
        }
    }),

    //Extends the Window class to display different content in the panel that can be selected from a menu
    TabbedWindow = Controls.TabbedWindow = new Class({
        Extends: Window,
        //options
        options: {
            elementOptions: {}
        },
        //Fields
        tabs: nil,
        activeTabId: nil, //the name/id of the tab that is currently being displayed
        tabMenu: nil,
        //constructor
        initialize: function (options) {
            var self = this;
            this.parent(options);
            this.tabMenu = new Panel({
                parent: this.windowFrame,
                elementOptions: {
                    'class': 'tabPanel'
                }
            });
            this.windowFrame.children.include(this.tabMenu);
            this.tabs = {}; //initialize the tab repository
            this.panel.addEvent('resize', function () { //Add an event to resize the panel to take into accommodation the tabMenu
                var panelSize = self.panel.getDimensions(),
                tabMenuSize = self.tabMenu.getDimensions();
                if (tabMenuSize) {
                    width = panelSize.maxWidth - tabMenuSize.actualWidth;
                    if (!width || (!isNaN(width) && width < 0)) {
                        width = 'auto';
                    }
                    if (panelSize.margin.left !== tabMenuSize.actualWidth) {
                        self.panel.set('width', width);
                        self.panel.set('margin-left', tabMenuSize.actualWidth);
                    }
                }
            });
            this.addEvents({
                afterRender: function () { //This event will check all the rendered controls in the panel and hide the ones that are not active                    
                    self.panel.children.each(function (child) {
                        if (self.activeTabId && self.tabs[self.activeTabId].contains(child)) {
                            child.show();
                        } else {
                            child.hide();
                        }
                    });
                },
                resize: function () { //On resize we need to ensure that the tabMenu height fills the entire window
                    var headerSize = self.header.getDimensions(),
                    tabMenuSize = self.tabMenu.getDimensions(),
                    statusBarSize = self.statusBar.getDimensions(),
                    panelSize = self.panel.getDimensions(),
                    height, top;
                    if (tabMenuSize) {
                        height = tabMenuSize.maxHeight - headerSize.actualHeight - statusBarSize.actualHeight
                        if (height <= 0) height = 'auto';
                        top = headerSize.actualHeight + tabMenuSize.margin.top;
                        if (!isNaN(top) && tabMenuSize.top !== top) {
                            this.tabMenu.set('top', top);
                        }
                        this.tabMenu.set('height', height);
                    }
                }
            });
        },
        //Methods 
        getTabByName: function (tabName) {
            if (!tabName || tabName.isNullOrEmpty()) return;
            else tabName = tabName.toLowerCase();
            var self = this,
            tab = null;
            this.tabs.some(function (tab, index) {
                if (tab.toLowerCase() === tabName) {
                    tab = self.getTabByIndex(index);
                    return true;
                };
                return false;
            });
            return tab;
        },
        selectTabByName: function (tabName) {
            if (!tabName || tabName.isNullOrEmpty()) return;
            else tabName = tabName.toLowerCase();
            var self = this;
            this.tabs.each(function (tab, index) {
                if (tab.toLowerCase() === tabName) self.selectTabByIndex(index);
            });
        },
        selectTabByIndex: function (intIndex) {
            if (!intIndex || intIndex < 0 || intIndex > this.tabMenu.children.length - 1) return;
            this.tabMenu.children[intIndex].element.fireEvent('click')
        },
        getTabByIndex: function (intIndex) {
            if (!intIndex || intIndex < 0 || intIndex > this.tabMenu.children.length - 1) return;
            return this.tabMenu.children[intIndex];
        },
        addControl: function (childControl, tabId) {
            this.addControls(Array.from(childControl), tabId);
        },
        //Here we override the addControl functionality to load controls into a specified tab
        addControls: function (childControls, tabId) {
            tabId = tabId || 'Default'; //if no tabId is specified, add it to a default tab
            var self = this;
            Array.each(childControls, function (control) {
                if (control instanceof WindowFrame) {
                    self.children.include(control); //This still being a Window, the same rules apply.  If it's a windowFrame control, add it to the window's children array
                } else { //Otherwise, this control needs to be added to the appropriate tab array.
                    if (!self.tabs[tabId]) { //If there is no tab array for this tabId..
                        self.tabs[tabId] = []; //..create it.
                        var active = ''; //We need to determine if this is the first tab added to the window and, if it is, make it the active tab
                        if (!self.activeTabId) {//If no activeTabId has been specified, we know there are currently no other tabs or, at the very least, that this should be the active tab
                            self.activeTabId = tabId; //We'll set the activeTabId to this tabId
                            active = 'active'; //The purpose of this active string is to determine if we should add the active class to the new tab button.  It will either be an empty string or 'active'.
                        }
                        self.tabMenu.addControl(new Button({ //Next we need to create a button to show this new tab's content
                            elementOptions: {
                                'class': 'button tabButton ' + active, //note that the active string is added to the classes.  If this is the active tab, the active class will be applied
                                title: tabId,
                                text: tabId,
                                id: tabId,
                                events: {
                                    'click': function (e) {
                                        if (e) e.stop(); //Prevent the event from bubbling up through the DOM
                                        if (self.activeTabId !== this.id) { //If we are not clicking on an already active tabButton...
                                            self.activeTabId = this.id; //make this the active tab
                                            var active = self.tabMenu.element.getElement('.active'); //find the currently active tab...
                                            if (active) {
                                                active.removeClass('active'); //...and if one exists, remove the active class
                                            }
                                            this.addClass('active'); //Add the active class to this button
                                            self.panel.children.each(function (child) { //We'll iterate through *all* child controls
                                                if (self.activeTabId && self.tabs[self.activeTabId].contains(child)) {
                                                    child.show(); //if the control is a member of this tab's array, show it...
                                                } else {
                                                    child.hide(); //otherwise hide it
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }));
                    } //all of the above only happens when adding a control to a NEW tab.  If the tab exists already, we'll skip to here
                    self.tabs[tabId].include(control); //add the control to the appropriate tab array
                    self.panel.children.include(control); //The control still needs to be added to the panel so it can be rendered.  After the Window is rendered, the non-active controls will be hidden
                }
            });
            this.rendered = false;
            this.fireEvent('controlLoaded', childControls);
        }
    }),

    //    ModalWindow = new Class({
    //        Extends: Window,
    //        //options
    //        options: {
    //            elementOptions: {
    //                'class': modalWindow
    //            }
    //        },
    //        //Fields
    //        parentWindow: nil
    //        //Constructor
    //        initialize: function(options){
    //        
    //        }
    //    }),

    //----------------
    //A Map Window
    //----------------
    //    MapWindow = Conrols.MapWindow = new Class({
    //        Extends: Window,
    //        options: {}
    //    });

    //----------------
    //A Label Control
    //----------------
    Label = Controls.Label = new Class({
        Extends: Control,
        //Options / Events
        options: {
            elementBase: 'span',
            //The options this control will create on the element with the toElement method or nil
            elementOptions: {
                events: {},
                'class': 'label',
                text: nil
            }
        },
        //Fields
        text: nil,
        //Constructor
        initialize: function (options) {
            this.parent(options);
        }
        //Methods
    }),

    //----------------
    //An Image Control
    //----------------
    Image = Controls.Image = new Class({
        Extends: Control,
        options: {
            elementBase: 'img',
            elementOptions: {
                'class': 'image',
                events: {},
                styles: {
                    height: 'auto',
                    width: 'auto'
                }
            }
        },
        //Fields
        src: nil,
        //Constructor
        initialize: function (options) {
            this.parent(options);
        }
        //Methods
    }),

    //----------------
    //A WindowPreview Control
    //----------------

    ////TODO
    ////A Control with a Panel which has a label indicating the name of the window and a color indicating if the window is focused,
    ////Clicking the panel should restore and focus the window
    //----------------
    WindowPreview = new Class({
        Extends: Button,
        options: {
            elementOptions: {
                'class': 'button windowPreview inlineBlock'
            }
        },
        //Fields
        //constructor
        initialize: function (options) {
            this.parent(options);
            var self = this;
            ASTI.Controls.Dock.previews.include(this);
            this.addEvent('afterRender', function () {
                self.element.addEvents({
                    click: function () {
                        if (self.parentControl.minimized) {
                            self.parentControl.restore();
                        } // else this.parentControl.minimize();
                        self.parentControl.bringToFront();
                        self.parentControl.shake();
                    },
                    mouseenter: function () {
                        if (self.parentControl.minimized) {
                            self.parentControl.render(true);
                            self.parentControl.show();
                        }
                    },
                    mouseleave: function () {
                        if (self.parentControl.minimized) {
                            self.parentControl.hide()
                        }
                    }
                });
            });
        }
    }),

    //----------------
    //Menu
    //----------------
    //A menu control is a free-floating control that displays options.  These controls are injected into the Desktop with a very high z-index
    Menu = Controls.Menu = new Class({
        Extends: Control,
        options: {
            elementBase: 'ul',
            elementOptions: {
                'class': 'menu'
            }
        },
        initialize: function (options) {
            options = options || {};
            if (options.parent) {
                options.parent = nil;
                delete options.parent;
            }
            this.parent(options);
            if (Controls.Desktop) {
                Controls.Desktop.fireEvent('menuCreated', this);
            }
        },
        addControls: function (childControls) {
            Array.each(childControls, function (child, index) {
                var menuItem;
                if (child instanceof MenuItem) {
                    menuItem = child;
                } else {
                    menuItem = new MenuItem({
                        parent: this,
                        label: child.name
                    });
                    menuItem.addControl(child);
                }
                this.children.include(menuItem);
            }, this);
            this.rendered = false;
            this.fireEvent('controlAdded');
        }
    }),

    MenuItem = Controls.MenuItem = new Class({
        Extends: Control,
        options: {
            elementBase: 'li',
            label: nil,
            elementOptions: {
                'class': 'menuItem'
            }
        },
        initialize: function (options) {
            if (!options || !options.parent instanceof Menu) {
                this.dispose();
                throw 'A MenuItem Control must be a child of a Menu Control';
            }
            this.parent(options);
        }
    }),

    //----------------
    //The Desktop
    //----------------
    //A control meant to contain icons and shortcuts, as well as act as the boundaries of the application
    Desktop = new Class({
        Extends: Control,
        Singleton: true,
        //Options
        options: {
            elementOptions: {
                'class': 'desktop'
            },
            ControlStyles: ControlStyles.Fixed
        },
        //Fields
        //Contsructor
        initialize: function (options) {
            if (options && options.parent) {
                this.dispose();
                throw new Error('Window must not have a parent');
            }
            this.parent(options);
            //Add an event to resize the desktop, taking into consideration the menu bar and dock.  
            this.addEvents({
                'resize': function () {
                    var desktopSize = this.getDimensions();
                    if (!desktopSize) return;
                    if (Controls.Dock) {
                        var dockHeight = Controls.Dock.getDimensions().actualHeight;
                        if (dockHeight && !isNaN(dockHeight) && desktopSize.padding.bottom != dockHeight) {
                            desktopSize.maxHeight -= dockHeight;
                            this.set('padding-bottom', dockHeight);
                        }
                    }
                    if (Controls.MenuBar) {
                        var menuHeight = Controls.MenuBar.getDimensions().actualHeight;
                        if (menuHeight && !isNaN(menuHeight) && desktopSize.padding.top != menuHeight) {
                            desktopSize.maxHeight -= menuHeight;
                            this.set('padding-top', menuHeight);
                        }
                    }
                    if (desktopSize.maxHeight < 0) {
                        desktopSize.maxHeight = 0;
                    }
                    if (desktopSize.maxWidth < 0) {
                        desktopSize.maxWidth = 0;
                    }
                    this.set('width', desktopSize.maxWidth);
                    this.set('height', desktopSize.maxHeight);
                },
                'menuCreated': function (menu) {
                    if (menu && menu instanceof Menu) {
                        this.children.include(menu);
                        this.rendered = false;
                    }
                }

            });

            win.addEvent('resize', this.fireEvent.pass('resize', this));

            this.addEvent('afterRender', this.fireEvent.pass('resize', this));
        }
    });

    Controls.Desktop = new Desktop();

    //----------------
    //The Dock Control
    //----------------

    var Dock = new Class({
        Extends: Control,
        Singleton: true,
        //Fields,
        //The panel of the Dock
        panel: nil,
        menu: nil,
        previews: [],
        //Options
        options: {
            elementOptions: {
                'class': 'dock'
            },
            ControlStyles: ControlStyles.Fixed
        },
        //Constructor
        initialize: function (options) {
            this.parent(options);

            this.menu = new Menu({
                name: 'controlMenu',
                elementOptions: {
                    'class': 'controlMenu'
                },
                onAfterRender: function () {
                    this.hide();
                }
            });
            //this.addEvent('afterRender', this.menu.render.pass(true, this.menu));
            var self = this;

            self.menuButton = new Button({
                parent: self,
                name: 'menuButton',
                elementOptions: {
                    'class': 'button menuButton',
                    text: 'Menu',
                    events: {
                        'click': function (e) {
                            if (e) e.stop();
                            if (!self.menu.rendered) {
                                self.menu.show();
                                self.menu.render(true);
                            }
                            if (!self.menu.isVisible) self.menu.show();
                            else self.menu.hide();
                        }
                    }
                }
            });
            this.children.include(this.menuButton);

            //Create a panel in the Dock without using addControl to keep event overhead down when not needed
            this.panel = new Panel({
                parent: this,
                elementOptions: {
                    styles: {
                        display: 'inline'
                    }
                },
                ControlStyles: ControlStyles.Fill
            });

            this.children.include(this.panel);

            this.clock = new Clock({
                parent: this,
                elementOptions: {
                    'class': 'dockClock',
                    format: '%l:%M %p</br>%x'
                }
            });

            this.children.include(this.clock);

            this.addEvents({
                'windowMinimized': function () { this.render(true); },
                'windowMaximized': function () { this.render(true); },
                'windowBringToFront': function () { this.render(true); },
                'windowRestore': function () { this.render(true); },
                'windowCreated': function (window) {
                    if (window instanceof Window && !window.hasControlFlag(ControlFlags.noPreview)) {
                        this.addControl(new WindowPreview({
                            parent: window,
                            name: window.id, //uniquely identifies the windowPreview
                            elementOptions: {
                                html: window.name
                            }
                        }));
                        this.render(true);
                    }
                },
                'windowDestroyed': function (window) {
                    if (window instanceof Window) this.removeChildrenOf.pass(window, this.panel).call();
                    //Fix all window previews
                    this.previews.each(function (prev) {
                        try {
                            if (window === prev.parentControl) return;
                            $(prev.parentControl).setStyle('left', $(prev).getCoordinates().left + 'px');
                        } catch (e) { }
                    });
                },
                'controlLoaded': function () { this.render(true); },
                'controlRemoved': function () { this.render(true); },
                'beforeRender': function () {
                    if (!this.rendered)
                        this.panel.rendered = false;
                } .bind(this)
            });
        },
        addControls: function (childControls) {
            //if the panel exists, all children are added as children of the dock's panel control
            //This check exists to essentially allow the panel to be added when the control is initialized
            var parentControl = this.panel || this;
            Array.each(childControls, function (child) {
                parentControl.children.include(child);
            });
            this.rendered = false;
            this.fireEvent('controlLoaded', childControls);
        }
        //Methods
    });

    //Create the Dock which is where windows are minimized to
    Controls.Dock = new Dock();

    //----------------
    //The TaskManager
    //----------------

    var TaskManager = new Class({
        Extends: Window,
        Singleton: true,
        //Options
        options: {
            header: 'Window Task Manager',
            elementOptions: {
                styles: {
                    left: 'auto',
                    right: 0,
                    width: 400,
                    height: 500
                }
            },
            ControlFlags: ControlFlags.Drag | ControlFlags.noCascade | ControlFlags.noMinimize | ControlFlags.noPreview
        },
        //Constructor
        initialize: function (options) {
            this.parent(options);
        },
        //Methods
        close: function () {
            this.fireEvent('beforeClose');
            this.fireEvent('close');
            this.hide(); //Rather than dispose of the Task manager, we'll just hide it.
            this.fireEvent('afterClose');
        }
    });
    //Create the TaskManager which is a Window with a updateable panel which is given a new Label whenever a window is created clicking the Label in the panel brings the assoicated window to the front
    Controls.TaskManager = new TaskManager({
        onWindowMinimized: function (window) {
            if (Controls.Dock) Controls.Dock.fireEvent('windowMinimized', window);
        },
        onWindowMaximized: function (window) {
            if (Controls.Dock) Controls.Dock.fireEvent('windowMaximized', window);
        },
        onWindowBringToFront: function (window) {
            if (Controls.Dock) Controls.Dock.fireEvent('windowBringToFront', window);
        },
        onWindowRestore: function (window) {
            if (Controls.Dock) Controls.Dock.fireEvent('windowRestore', window);
        },
        onWindowCreated: function (window) {
            if (window instanceof Window) {//Create a new Label for the Window with a Click that will bring the window to the front of all open windows
                this.addControl(new Label({
                    parent: window,
                    elementOptions: {
                        text: 'Window Name: ' + window.name + ', WindowId: ' + window.id,
                        name: window.name,
                        events: {
                            click: window.bringToFront.bind(window)
                        },
                        styles: {
                            cursor: 'pointer',
                            display: 'block',
                            border: '1px solid #000'
                        }
                    }
                }));
                this.render(true);
                this.setStatus('New Window Opened: ' + window.name);
            }
            if (Controls.Dock) Controls.Dock.fireEvent('windowCreated', window);
        },
        onWindowDestroyed: function (window) {
            if (window instanceof Window) {
                this.removeChildrenOf.pass(window, this.panel).call();
                this.setStatus('Window Closed: ' + window.name);
            }
            if (Controls.Dock) Controls.Dock.fireEvent('windowDestroyed', window);
        },
        onControlLoaded: function (control) {
            //            if (control instanceof Window && !(control instanceof TaskManager)) {//Create a new Label for the Window with a Click that will bring the window to the front of all open windows
            //                this.addControl(new Label({ parent: control, click: control.bringToFront, text: 'Window Name: ' + window.name + ', WindowId: ' + window.id }));
            //                this.render(true);   
            //            }
        },
        onControlRemoved: function (control) {
            //            if (control instanceof Window && !(control instanceof TaskManager)) { //Find and Remove the child label associated with the control
            //                this.removeChildrenOf(control);
            //                this.render(true);
            //            }
        }
    });

    //----------------
    //The Menu Bar Control
    //----------------
    //A control to provide utilities and display system alerts and updates.  

    var MenuBar = new Class({
        Extends: Control,
        Singleton: true,
        options: {
            elementOptions: {
                'class': 'menuBar'
            }
            //ControlStyles: ControlStyles.Fixed
        },
        //Fields
        //Constructor
        initialize: function (options) {
            this.parent(options);
            if (Controls.TaskManager)
                this.children.include(new Controls.Button({
                    parent: this,
                    elementOptions: {
                        text: 'Open Task Manager',
                        'class': 'menuButton',
                        events: {
                            'click': function () {
                                if (!Controls.TaskManager) return;
                                this.addClass('menuButtonActive');
                                Controls.TaskManager.addEvent('close', function () {
                                    this.removeClass('menuButtonActive');
                                } .bind(this));
                                Controls.TaskManager.show();
                                Controls.TaskManager.render(true);
                            }
                        }
                    }
                }));
        }
    });

    //Controls.MenuBar = new MenuBar();

    //    EventManager = new Class({
    //        Extends: Window,
    //        Singleton: true,
    //        options: {
    //            header: 'System Alerts',
    //            elementOptions: {
    //                styles: {
    //                    width: 350,
    //                    height: 300
    //                }
    //            }
    //        },
    //        //Fields
    //        //Constructor
    //        initialize: function (options) {
    //            this.parent(options);
    //            if (win.MessageBus) win.MessageBus.addEvent('messageRecieved', function (message) {
    //                this.addControl(new Label({
    //                    parent: this,
    //                    elementOptions: {
    //                        styles: {
    //                            display: 'block',
    //                            border: '1px solid #000'
    //                        },
    //                        html: message
    //                    }
    //                }));
    //                this.render(true);
    //                this.setStatus('New Message');
    //            } .bind(this));
    //        }
    //    });

    //Controls.EventManager = new EventManager();

    Controls.Dock.render(true);
    //Controls.MenuBar.render(true);
    Controls.Desktop.render(true);
    Controls.TaskManager.render(true);

    Controls.TaskManager.hide();

    //Controls.EventManager.render(true);

    //Special Use Controls
    //These Controls are used for specific purposes within the UI

    var UserManager = new Class({
        Extends: TabbedWindow,
        Singleton: true,
        options: {
            header: 'Manage Users and Permissions',
            name: 'User Manager',
            elementOptions: {
                styles: {
                    width: '634px',
                    height: '400px',
                    top: 75
                }
            }
        },
        users: {},
        selectedUser: nil,
        directory: nil,
        details: nil,
        editPanel: nil,
        addPanel: nil,
        initialize: function (options) {
            this.parent(options);
            this.directory = new Panel({
                parent: this,
                elementOptions: {
                    'class': 'userDirectory inlineBlock'
                }
            });

            this.details = new Panel({
                parent: this,
                elementOptions: {
                    'class': 'userView inlineBlock'
                }
            });
            this.addControls([this.directory, this.details], 'Users');

            var name, email, sendEmail, contactData, status, online, lastLogin;
            name = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'Name',
                    'class': 'userField'
                }
            });

            email = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'Email Address',
                    'class': 'userField inlineBlock'
                }
            });

            sendEmail = new Button({
                parent: this.details,
                elementOptions: {
                    title: 'Send an Email to This User',
                    'class': 'inlineBlock',
                    styles: {
                        border: '0px',
                        background: 'transparent ',
                        width: '20px',
                        height: '20px',
                        margin: '0px 2px'
                    },
                    events: {
                        'click': function () {
                            var address = this.selectedUser.email;
                            //open email interface
                        } .bind(this)
                    }
                }
            });

            contactData = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'Contact Information',
                    'class': 'userField'
                }
            });

            lastLogin = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'Last Login',
                    'class': 'userField'
                }
            });

            status = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'Status',
                    'class': 'userField inlineBlock'
                }
            });

            online = new Label({
                parent: this.details,
                elementOptions: {
                    title: 'online',
                    'class': 'userField inlineBlock'
                }
            });

            this.details.addControls([name, email, lastLogin, sendEmail, contactData, status, online]);

            this.panel.addEvent('resize', function () {
                var directorySize = this.directory.getDimensions(this.panel),
                detailsSize = this.details.getDimensions(this.panel),
                width = detailsSize.maxWidth - directorySize.actualWidth;
                if (!isNaN(directorySize.maxHeight) && directorySize.maxHeight > 0) {
                    this.directory.set('height', directorySize.maxHeight);
                    this.details.set('height', detailsSize.maxHeight);
                }
                if (!isNaN(width) && width > 0) {
                    this.details.set('width', width);
                }
            } .bind(this));

            this.addEvents({
                afterHide: function () {
                    if (!this.minimized) {
                        var windowPreview = Controls.Dock.panel.findControlByName(this.id);
                        if (windowPreview) {
                            windowPreview.hide();
                        }
                    }
                },
                afterShow: function () {
                    this.fireEvent('resize');
                    var windowPreview = Controls.Dock.panel.findControlByName(this.id);
                    if (windowPreview) {
                        windowPreview.show();
                    }
                },
                userCreated: function (user) {
                    if (user instanceof User) {
                        this.directory.addControl(user);
                        this.rendered = false;
                    }
                },
                userSelected: function (user) {
                    if (user !== this.selectedUser) {
                        if (this.selectedUser && this.selectedUser.element) {
                            this.selectedUser.element.removeClass('selected');
                        }
                        this.selectedUser = user;
                        name.element.set('html', user.firstName + ' ' + user.lastName);
                        lastLogin.element.set('html', user.lastLogin ? user.lastLogin : 'Never');
                        email.element.set('html', user.email);
                        contactData.element.set('html', user.contactData);
                        status.element.set('html', user.active ? 'Active' : 'Inactive');
                        //user online status will be added with the messageHub
                    }
                }
            });
        },
        //Methods
        close: function () {
            this.fireEvent('beforeClose');
            this.fireEvent('close');
            this.hide(); //Like the Task manager, we'll only hide this, not dispose of it.
            this.fireEvent('afterClose');
            ASTI.Controls.Dock.fireEvent('windowDestroyed', this);
        },
        getUser: function (userId, callback) {
            try {
                var user = this.users[userId];
                if (!user) throw new Error();
                Function.from(callback).pass(user).call();
            } catch (E) {
                ASTIService.InvokeMethod('ChipsGetUserByUserId',
                {
                    'userId': userId,
                    'sessionToken': Application.currentUser.token
                },
                function (result) {
                    if (result && result.error) ASTI.Controls.UserManager.users[userId] = false;
                    ASTI.Controls.UserManager.users[userId] = result || u;
                    Function.from(callback).pass(result).call();
                });
            }
        }
    }),

    //----------------
    //The User Control
    //----------------
    //A control to provide utilities and display system alerts and updates. 

    User = Controls.User = new Class({
        Extends: Button,
        options: {
            user: nil,
            elementOptions: {
                'class': 'user'
            }
        },
        //Fields
        online: false,
        loggedIn: false,
        token: nil,
        firstName: nil,
        lastName: nil,
        userName: nil,
        email: nil,
        contactData: nil,
        initialize: function (options) {
            options = options || {};
            options.parent = Controls.UserManager; //Even if another parent is provided, it doesn't mater.  This will always be a child of the user manager.
            var self = this;
            if (options.user) {
                self = Object.merge(self, options.user);
                options.user = nil; delete options.user;
            }
            this.parent(options);

            if (Controls.UserManager) {
                Controls.UserManager.fireEvent('userCreated', self);
            }
            this.addEvents({
                'afterRender': function () {
                    self.element.set('html', self.firstName + ' ' + self.lastName);
                    self.element.addEvent('click', function () {
                        this.addClass('selected');
                        if (Controls.UserManager) {
                            Controls.UserManager.fireEvent('userSelected', self);
                        }
                    });
                }
            });
        },
        //Methods
        refresh: function (callback) {
            callback = Function.from(callback);
            var self = this;
            ASTIService.GetUser(this, function (physical) { //where physical is the user or user session returned from the service request
                if (physical.error) {
                    //send alert to the alert panel
                    self.logout();
                }
                var user = physical.User || physical;
                if (self.token && !self.token === physical.loginToken) return self.logout();
                self = Object.merge(self, user);
                callback.delay(0, callback, physical);
            });
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
            return win.Application.UserIsCurrentUser(this);
        },
        login: function (username, password) {
            username = username.toLowerCase();
            if (this.isCurrentUser()) return this.refresh.call();
            this.username = username;
            var self = this;
            ASTIService.InvokeMethod('ChipsLoginUser', { Username: username, Password: password }, function (userSession) {
                if (!userSession || userSession.error || !userSession.User) {
                    var loginResponse = d.id('loginResponse'); //needs to utilize the Event Manager control
                    if (userSession.status !== 500 && userSession.status !== 200) loginResponse.set('text', Application.stringResources.noConnection);
                    else loginResponse.set('text', userSession.Message || Application.stringResources.error);
                    return;
                };
                self.token = userSession.loginToken;
                self = Object.merge(self, userSession.User);
                self.loggedIn = true;
                Cookie.write('login', self.token);
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

    Controls.UserManager = new UserManager();
    Controls.UserManager.addEvent('afterRender:once', Controls.UserManager.hide);
    Controls.UserManager.render(true);

})(window, window.screen, document, document.body, MooTools, document.id, null, undefined);