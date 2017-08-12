
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/modules/ModuleCallbacks'
    ],
    function(
        evt,
        PipelineObject,
        ModuleCallbacks
    ) {

        var ModuleChannel = function(channelData, ready) {
            this.id = channelData.id;
            this.init = channelData.init;
            this.state = {};
            this.target = {};

            this.age = 0;

            var applyChannelData = function() {
                this.applyChannelData(this.pipeObj.buildConfig()[this.id]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('MODULE_CHANNELS', 'CHANNELS', applyChannelData);
        };

        ModuleChannel.prototype.applyChannelData = function (config) {

            for (var key in config.state) {
                this.state[key] = config.state[key]
            }
            this.state.value = this.init || this.state.value;

            for (var key in config.target) {
                this.target[key] = config.target[key]
            }
        };



        ModuleChannel.prototype.updateChannelState = function (module, tpf) {

            if (Math.random() < 0.2) {
                this.age += tpf;
            }

            this.state.value = MATH.clamp(Math.sin(this.age) * 5,this.state.min, this.state.max);

            ModuleCallbacks[this.target.callback](module, this.target, this.state)

        };

        return ModuleChannel
    });