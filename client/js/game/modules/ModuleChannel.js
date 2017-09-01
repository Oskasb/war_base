
"use strict";


define([
        'Events',
        'PipelineObject',

        'game/modules/ChannelTarget'
    ],
    function(
        evt,
        PipelineObject,

        ChannelTarget
    ) {

        var ModuleChannel = function(channelData, ready) {
            this.id = channelData.channelid;
            this.stateid = channelData.stateid;
            this.init = channelData.init;
            this.dimensions = channelData.dimensions || 1;
            this.state;
            this.targets = [];
            this.target = {};

            this.age = 0;

            var applyChannelData = function() {
                this.applyChannelData(this.pipeObj.buildConfig()[this.id]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('MODULE_CHANNELS', 'CHANNELS', applyChannelData);
        };

        ModuleChannel.prototype.applyChannelData = function (config) {
            this.targets = [];
            var _this = this;

            for (var i = 0; i < config.targets.length; i++) {
                var ready = function(ctarget) {
                    _this.targets.push(ctarget)
                };
                new ChannelTarget(config.targets[i], ready);
            }

        };

        ModuleChannel.prototype.attachPieceState = function (pieceState) {
            this.state = pieceState;
        };


        ModuleChannel.prototype.updateChannelState = function (module) {
            if (this.state) {
                for (var i = 0; i < this.targets.length; i++) {
                    this.targets[i].sampleModuleState(module, this.state);
                }
            }
        };

        ModuleChannel.prototype.removeModuleChannel = function () {
            this.pipeObj.removePipelineObject();
        };

        return ModuleChannel
    });