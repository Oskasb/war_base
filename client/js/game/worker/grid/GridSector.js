"use strict";

define([

    ],
    function(

    ) {
        
        var calcVec = new THREE.Vector3();

        var outside = 99999999;
        var debug = false;
        

        var GridSector = function(simState, sysIndex, indexOffset, row, column, config, visible_range) {

            this.simulationState = simState;
            this.visibilityRange = visible_range;
            this.systemIndex = sysIndex;
            this.config = config;

            this.isOutside = false;

            this.indexOffset = indexOffset;
            this.isVisible = false;

            this.row = row;
            this.column = column;

            this.indexX = row;
            this.indexZ = column;

            this.posX = 0;
            this.posY = 0;
            this.posZ = 0;

        };


        GridSector.prototype.size = function() {
            return this.conf().sector_size;
        };

        GridSector.prototype.conf = function() {
            return this.config[this.systemIndex]
        };



        GridSector.prototype.positionSectorAroundCenter = function(indexX, indexZ) {

            this.isVisible = false;

            this.indexX = indexX+this.row;
            this.indexZ = indexZ+this.column;
            this.setSectorPosition(this.indexX * this.size(), this.indexZ * this.size());

        };

        GridSector.prototype.setSectorPosition = function(x, z) {

            this.posX = x;
            this.posZ = z;

            calcVec.x = this.posX;
            calcVec.y = outside;
            calcVec.z = this.posZ;

            this.posY = this.simulationState.getTerrainHeightAtPos(calcVec);

            this.isOutside = this.posY === outside;

        };


        GridSector.prototype.checkForActivePatch = function(activePatches, patchPool) {

            for (var i = 0; i < activePatches.length; i++) {
                if (activePatches[i].posX === this.posX && activePatches[i].posZ === this.posZ) {
                    return activePatches[i];
                }
            }

        };



        GridSector.prototype.enableGridSector = function(activePatches, patchPool) {

            var activePatch = this.checkForActivePatch(activePatches);

            if (activePatch) {
                return;
            }

            var patch = patchPool.shift();

            if (!patch) {
                console.log("bad patch!", patchPool, this.indexX, this.indexZ);
                return;
            } else {
           //     console.log("ENABLE patch!", patchPool.length, this.indexX, this.indexZ);
            }

            activePatches.push(patch);

            patch.enablePatch(this.indexX, this.indexZ, this.posX, this.posZ, this.size());
            
        };

        GridSector.prototype.checkVisibility = function(activePatches, patchPool, posVec3) {

            var visible = false;

            calcVec.x = this.posX;
            calcVec.y = posVec3.y;
            calcVec.z = this.posZ;

            if (!this.isOutside) {

                var distance = Math.sqrt(posVec3.distanceToSquared(calcVec));

                if (distance < this.visibilityRange) {
                    visible = true;
                }

                if (visible && !this.isVisible) {
                    this.enableGridSector(activePatches, patchPool);
                }

            }

            this.isVisible = visible;
        };

        return GridSector;

    });