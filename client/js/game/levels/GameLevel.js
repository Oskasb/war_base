
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

            this.actors = [];
            this.terrains = [];

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

        GameLevel.prototype.addLevelActor = function (actor) {
            this.actors.push(actor);
        };

        GameLevel.prototype.addLevelTerrainActor = function (actor) {
            this.terrains.push(actor);
        };

        GameLevel.prototype.applyData = function (config, ready) {
            this.config = config;
            ready(this)
        };

        GameLevel.prototype.removeGameLevel = function () {
            this.pipeObj.removePipelineObject();
        };

        return GameLevel
    });