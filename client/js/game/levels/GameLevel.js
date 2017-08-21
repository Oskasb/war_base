
"use strict";


define([
        'Events',
        'PipelineObject'
    ],
    function(
        evt,
        PipelineObject
    ) {

        var GameLevel = function(levelId, dataKey, ready) {

            this.id = levelId;
            this.dataKey = dataKey;
            this.actor = null;

            this.terrainOpts = null;
            this.terrain = null;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('LEVEL_DATA', 'LEVELS', applyData);
        };

        GameLevel.prototype.setTerrainOptions = function (opts) {
            this.terrainOpts = opts;
        };

        GameLevel.prototype.setLevelActor = function (actor) {
            if (this.actor) this.actor.removeGameActor();
            this.actor = actor;
        };

        GameLevel.prototype.applyData = function (config, ready) {
            this.config = config;
            ready(this)
        };

        GameLevel.prototype.removeGameLevel = function () {
            this.pipeObj.removePipelineObject();
            if (this.actor) {
                this.actor.removeGameActor();
            }
        };

        return GameLevel
    });