
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/levels/LevelPopulation'
    ],
    function(
        evt,
        PipelineObject,
        LevelPopulation
    ) {

        var GameLevel = function(levelId, dataKey, ready) {

            this.id = levelId;
            this.dataKey = dataKey;
            this.actor = null;

            this.populations = [];
            this.terrains = [];

            this.terrain = null;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('LEVEL_DATA', 'LEVELS', applyData);
        };

        GameLevel.prototype.applyData = function (config, ready) {
            this.config = config;
            ready(this)
        };

        GameLevel.prototype.createLevelPopulations = function(onReady) {

            var dataReady = function(population) {
                this.populations.push(population);
                onReady(population);
            }.bind(this);

            for (var i = 0; i < this.config.populations.length; i++) {
                 new LevelPopulation(this.config.populations[i], dataReady);

            }
        };

        GameLevel.prototype.getLevelPopulations = function () {
            return this.populations;
        };

        GameLevel.prototype.addLevelTerrainActor = function (actor) {
            this.terrains.push(actor);
        };



        GameLevel.prototype.removeGameLevel = function () {
            this.pipeObj.removePipelineObject();
        };

        return GameLevel
    });