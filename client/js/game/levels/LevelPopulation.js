
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

    var count = 0;

        var LevelPopulation = function(dataKey, ready) {

            count++;
            this.id = dataKey+'_'+count;

            this.dataKey = dataKey;
            this.populationIds = [];

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('POPULATION_DATA', 'POPULATIONSS', applyData, dataKey);
        };

        LevelPopulation.prototype.applyData = function (config, ready) {
            this.config = config;
            ready(this)
        };

        LevelPopulation.prototype.registerPopulationActor = function (actor) {
            this.populationIds.push(actor.id);
        };

        LevelPopulation.prototype.getSpawnCount = function () {

            var min = this.config.amount.min || 1;
            var max = this.config.amount.max || 1;

            return min + Math.round(Math.random() * (max - min));

        };

        LevelPopulation.prototype.getPopulationSpawnConfig = function () {
            return this.config.actors[Math.floor(Math.random() * this.config.actors.length)];
        };

        LevelPopulation.prototype.despawnLevelPopulation = function () {

        };


        LevelPopulation.prototype.removeLevelPopulation = function () {
            this.pipeObj.removePipelineObject();
        };

        return LevelPopulation
    });