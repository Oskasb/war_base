"use strict";



require([
    'application/SystemDetector',
    'application/ButtonEventDispatcher',
    'application/ControlStateDispatcher',
    'application/AnalyticsWrapper',
    'ui/GameScreen'
], function(
    SystemDetector,
    ButtonEventDispatcher,
    ControlStateDispatcher,
    AnalyticsWrapper,
    GameScreen
) {

    var init = function() {
        new SystemDetector();
        new ButtonEventDispatcher();
        new ControlStateDispatcher();
        GameScreen.registerAppContainer(document.body);
    };

    setTimeout(function() {
        init();
    }, 0)

});
