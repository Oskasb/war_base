
"use strict";


define([
        'PipelineObject',
        'game/modules/ModuleCallbacks',
        'PipelineAPI'
    ],
    function(
        PipelineObject,
        ModuleCallbacks,
        PipelineAPI
    ) {

        var cameraFunctions;

        var CameraControl = function(dataKey, ready) {

            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CAMERA_DATA', 'CONTROLS', applyData);

            var camFuncs = function(src, data) {
                cameraFunctions = data;
            };

            new PipelineAPI.subscribeToCategoryKey('CAMERA_DATA', 'CAMERA', camFuncs);

        };

        CameraControl.prototype.applyData = function(config) {
            this.config = config;
        };

        CameraControl.prototype.sampleTargetState = function(rootObj3d, pieceStates) {

            cameraFunctions[this.config.cameraFunction](rootObj3d, this.config.params)
        };

        CameraControl.prototype.removeCameraControls = function() {
            this.pipeObj.removePipelineObject();
        };

        return CameraControl
    });