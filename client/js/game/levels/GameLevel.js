
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

            this.terrainActors = [];

            this.minX = 0;
            this.maxX = 0;
            this.minZ = 0;
            this.maxZ = 0;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('LEVEL_DATA', 'LEVELS', applyData, dataKey);
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

        GameLevel.prototype.updateStaticDimensions = function () {

            for (var i =0; i < this.terrainActors.length; i++) {
                var pos = this.terrainActors[i].piece.getPos();
                var size = this.terrains[i].opts.xSize;
                console.log("Level Pos: ", i, pos);
                console.log("Level Terrain: ", i, this.terrains[i]);
                console.log("Terrain Size: ", size);

                this.minX = pos.x - size/2;
                this.maxX = pos.x + size/2;
                this.minZ = pos.z - size/2;
                this.maxZ = pos.z + size/2;
            }

            console.log("Level: ", this);

        };


        GameLevel.prototype.generateStaticSectors = function () {


            console.log("Level: ", this);


        };

        GameLevel.prototype.getLevelPopulations = function () {
            return this.populations;
        };

        GameLevel.prototype.addTerrainToLevel = function (terrain) {
            this.terrains.push(terrain);
        };

        GameLevel.prototype.addLevelTerrainActor = function (actor) {
            this.terrainActors.push(actor);
        };



        GameLevel.prototype.removeGameLevel = function () {
            this.pipeObj.removePipelineObject();
        };

        return GameLevel
    });