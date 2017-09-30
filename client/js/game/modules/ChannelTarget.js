
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

            this.effectArray = [];

            var applyData = function() {
                this.applyTargetData(this.pipeObj.buildConfig()[this.id]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CHANNEL_TARGETS', 'TARGETS', applyData, this.id);
        };

        ChannelTarget.prototype.applyTargetData = function(config) {
            this.config = config;
        };

        ChannelTarget.prototype.setRemove = function(bool) {
            this.remove = bool;
        };

        ChannelTarget.prototype.sampleModuleState = function(module, state, enable) {
            //   if (isNaN(state.getValue())) state.setValue(0);

            this.state = state;
            if (typeof(ModuleCallbacks[this.config.callback]) !== 'function') {
                console.log("Bad callback", this.config.callback, ModuleCallbacks);
                return;
            }
            ModuleCallbacks[this.config.callback](module, this, enable);

        };

        ChannelTarget.prototype.removeEffectTarget = function() {
            this.setRemove(true);
            this.state.setValue(0);
            this.pipeObj.removePipelineObject();
        };

        return ChannelTarget
    });