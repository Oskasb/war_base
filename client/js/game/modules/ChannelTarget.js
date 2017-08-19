
"use strict";


define([
        'PipelineObject',
        'game/modules/ModuleCallbacks'
    ],
    function(
        PipelineObject,
        ModuleCallbacks
    ) {

        var ChannelTarget = function(targetData, ready) {
            this.id = targetData.targetid;

            var applyData = function() {
                this.applyTargetData(this.pipeObj.buildConfig()[this.id]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CHANNEL_TARGETS', 'TARGETS', applyData);
        };

        ChannelTarget.prototype.applyTargetData = function(config) {
            this.config = config;
        };

        ChannelTarget.prototype.sampleModuleState = function(module, state, tpf, time) {
         //   if (isNaN(state.getValue())) state.setValue(0);
            this.state = state;
            ModuleCallbacks[this.config.callback](module, this)
        };


        return ChannelTarget
    });