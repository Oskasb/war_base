
"use strict";


define([
        'PipelineObject',
        'game/modules/ModuleCallbacks'
    ],
    function(
        PipelineObject,
        ModuleCallbacks
    ) {

        var CameraControl = function(targetData, ready) {
            this.id = targetData.targetid;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.id]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CAMERA_DATA', 'CONTROLS', applyData);
        };

        CameraControl.prototype.applyData = function(config) {
            this.config = config;
        };

        CameraControl.prototype.sampleModuleState = function(module, state, tpf, time) {
            //   if (isNaN(state.getValue())) state.setValue(0);
            this.state = state;
            ModuleCallbacks[this.config.callback](module, this)
        };


        return CameraControl
    });