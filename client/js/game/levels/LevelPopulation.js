
"use strict";


define([
        'Events',
        'PipelineObject'
    ],
    function(
        evt,
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

        LevelPopulation.prototype.getPoplationActorConfig = function () {
            return this.config.actors;
        };

        LevelPopulation.prototype.despawnLevelPopulation = function () {

        };


        LevelPopulation.prototype.removeLevelPopulation = function () {
            this.pipeObj.removePipelineObject();
        };

        return LevelPopulation
    });