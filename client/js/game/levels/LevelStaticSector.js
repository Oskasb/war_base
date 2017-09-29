
"use strict";


define([
        'PipelineObject',
        'game/levels/LevelPopulation'
    ],
    function(
        PipelineObject,
        LevelPopulation
    ) {

        var count = 0;

        var tempVec = new THREE.Vector3();

        var LevelStaticSector = function(row, column, minX, minZ, sizeX, sizeZ, populationKey, sectorReady) {

            count++;
            this.row = row;
            this.column = column;

            this.sizeX = sizeX;
            this.minX = minX;
            this.maxX = this.minX + sizeX;

            this.sizeZ = sizeZ;
            this.minZ = minZ;
            this.maxZ = this.minX + sizeZ;

            var populationData = function(pop) {
                this.population = pop;
                sectorReady(this);
            }.bind(this);

            new LevelPopulation(populationKey, populationData);
        };


        LevelStaticSector.prototype.activateSectorPopulation = function (spawnCallback) {

            var spawnCount = this.population.getSpawnCount();

            for (var i = 0; i < spawnCount; i++) {
                var spawnConf = this.population.getPopulationSpawnConfig();
                tempVec.set(this.minX, 0, this.minZ);

                if (spawnConf.spread_xz) {
                    tempVec.x += Math.random() * spawnConf.spread_xz[0] * this.sizeX + this.sizeX / 2 * ( 1 - spawnConf.spread_xz[0]);
                    tempVec.z += Math.random() * spawnConf.spread_xz[1] * this.sizeZ + this.sizeZ / 2 * ( 1 - spawnConf.spread_xz[1])
                }

                var facing = (Math.random()-0.5)*2;

                if (this.population.config.offsets) {
                    var offsets = this.population.config.offsets[i];

                    if (offsets) {
                        if (offsets.pos_xz) {
                            tempVec.x += offsets.pos_xz[0] * this.sizeX;
                            tempVec.z += offsets.pos_xz[1] * this.sizeZ;
                        }

                        if (typeof(offsets.rotation_y) === 'number') {
                            facing = offsets.rotation_y;
                        }
                    }
                }


                spawnCallback(tempVec, facing, spawnConf);
            }
        };


        return LevelStaticSector
    });