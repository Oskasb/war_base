"use strict";

define([
        'ui/particle/functions/GuiRenderer'
    ],
    function(
        GuiRenderer
    ) {

        var guiRenderer;
        var GameAPI;

        var defaultGuySystems = [
            "gui_system_combat",
            "gui_system_interaction"
        ];

        var GuiAPI = function() {

        };

        GuiAPI.initGui = function(gameApi) {
            GameAPI = gameApi;
            guiRenderer = new GuiRenderer(GameAPI);
            GuiAPI.activateDefaultGuiSystems();
        };

        GuiAPI.activateDefaultGuiSystems = function() {

            for (var i = 0; i < defaultGuySystems.length; i++) {
                GuiAPI.activateGuiSystem(defaultGuySystems[i])
            }

        };

        GuiAPI.activateGuiSystem = function(systemId) {
            guiRenderer.activateGuiSystemId(systemId);
        };

        GuiAPI.deactivateGuiSystem = function(systemId) {
            guiRenderer.deactivateGuiSystemId(systemId);
        };

        GuiAPI.updateGui = function() {
            guiRenderer.requestCameraMatrixUpdate();
            guiRenderer.updateGuiRenderer();
        };

        return GuiAPI;

    });