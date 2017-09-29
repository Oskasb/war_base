
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/levels/LevelStaticSector'
    ],
    function(
        evt,
        PipelineObject,
        LevelStaticSector
    ) {

        var GameLevel = function(levelId, dataKey, ready) {

            this.id = levelId;
            this.dataKey = dataKey;
            this.actor = null;

            this.populations = [];
            this.terrains = [];

            this.terrainActors = [];

            this.staticGridSectors = [];

            this.minX = 0;
            this.maxX = 0;
            this.minZ = 0;
            this.maxZ = 0;
            this.size = 0;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('LEVEL_DATA', 'LEVELS', applyData, dataKey);
        };

        GameLevel.prototype.applyData = function (config, ready) {
            this.config = config;
            this.sectorConf = config.static_sectors;
            this.edges = this.sectorConf.edge_populations;
            ready(this)
        };

        GameLevel.prototype.createLevelPopulations = function(onReady) {

        };

        GameLevel.prototype.updateStaticDimensions = function () {

            for (var i =0; i < this.terrainActors.length; i++) {
                var pos = this.terrainActors[i].piece.getPos();
                var size = this.terrains[i].opts.xSize;
                console.log("Level Pos: ", i, pos);
                console.log("Level Terrain: ", i, this.terrains[i]);
                console.log("Terrain Size: ", size);
                this.size = size;
                this.minX = pos.x - size/2;
                this.maxX = pos.x + size/2;
                this.minZ = pos.z - size/2;
                this.maxZ = pos.z + size/2;
            }

            console.log("Level: ", this);

        };

        GameLevel.prototype.getSecorCornerEdgePopulationKey = function() {
            return this.edges.corner[Math.floor(Math.random() * this.edges.corner.length)];
        };

        GameLevel.prototype.getSecorColumnEdgePopulationKey = function() {
            return this.edges.column[Math.floor(Math.random() * this.edges.column.length)];
        };

        GameLevel.prototype.getSecorRowEdgePopulationKey = function() {
            return this.edges.row[Math.floor(Math.random() * this.edges.row.length)];
        };

        GameLevel.prototype.getSecorDefaultPopulationKey = function() {
            return this.sectorConf.default_populations[Math.floor(Math.random() * this.sectorConf.default_populations.length)];
        };

        GameLevel.prototype.getSecorPopulationKey = function(row, column) {

            if (row === 0 || row === this.sectorConf.rows-1) {

                if (column === 0 || column === this.sectorConf.columns-1) {
                    return this.getSecorCornerEdgePopulationKey();
                }

                return this.getSecorRowEdgePopulationKey();
            }

            if (column === 0 || column === this.sectorConf.columns-1) {
                return this.getSecorColumnEdgePopulationKey();
            }

            return this.getSecorDefaultPopulationKey();
        };

        GameLevel.prototype.generateStaticSectors = function (sectorReady) {

            var sectorSizeX = this.size / this.sectorConf.columns;
            var sectorSizeZ = this.size / this.sectorConf.rows;

            for (var i = 0; i < this.sectorConf.rows; i++) {
                this.staticGridSectors[i] = [];
                for (var j = 0; j < this.sectorConf.columns; j++) {
                    this.staticGridSectors[i][j] = new LevelStaticSector(i, j, this.minX + sectorSizeX * i, this.minZ + sectorSizeZ * j, sectorSizeX, sectorSizeZ, this.getSecorPopulationKey(i, j), sectorReady);
                }
            }

            console.log("Static Sectors:", this.staticGridSectors);

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