"use strict";

define([
        'PipelineAPI',
        'worker/grid/GridSector',
        'worker/grid/PatchPool',
        'worker/grid/DynamicPatch'
 //   'EffectAPI'
    ],
    function(
        PipelineAPI,
        GridSector,
        PatchPool,
        DynamicPatch
    //    EffectAPI
    ) {



        var tempVec = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();

        var ActivationGridSystem = function(sysIndex, gridSysData, gridMasterData, simState) {

            this.simulationState = simState;
            this.systemIndex = sysIndex;
            
            this.lastX = -100000;
            this.lastZ = -100000;

            this.gridSysData = gridSysData;
            
            this.lastChecked = 0;

            this.config = gridMasterData;

            this.indexOffset = 0;

            this.sectorPool = [];

            this.activePatches = [];
            this.patchPool = new PatchPool(this);
            this.generateActivationGrid(simState)

        };


        ActivationGridSystem.prototype.conf = function() {
            return this.config[this.systemIndex]
        };

        ActivationGridSystem.prototype.createPatch = function() {
            return new DynamicPatch(this.simulationState, this.systemIndex, this.config, this.gridSysData)
        };


        ActivationGridSystem.prototype.generateActivationGrid = function(simulationState) {

            this.indexOffset = Math.floor(this.conf().rows_n_columns/ 2);
            
            for (var i = 0; i < this.conf().rows_n_columns * this.conf().rows_n_columns; i++) {
                this.patchPool.generatePatch(this);
            }

            for (var i = 0; i < this.conf().rows_n_columns; i++) {
                for (var j = 0; j < this.conf().rows_n_columns; j++) {
                    var patch = new GridSector(simulationState, this.systemIndex, this.indexOffset, i, j, this.config, this.conf().visible_range);
                    this.sectorPool.push(patch);
                }
            }
        };



        ActivationGridSystem.prototype.updateSectorPositions = function(posVec3) {
            for (var i = 0; i < this.sectorPool.length; i++) {
                this.sectorPool[i].positionSectorAroundCenter(this.lastX - this.indexOffset, this.lastZ - this.indexOffset);
            }
        };

        ActivationGridSystem.prototype.positionBeneathCamera = function(posVec3) {
            tempVec2.copy(posVec3);

            var posX = Math.floor(tempVec2.x / this.conf().sector_size);
            var posZ = Math.floor(tempVec2.z / this.conf().sector_size);
            
            if (this.lastX !== posX || this.lastZ !== posZ) {
                this.lastX = posX;
                this.lastZ = posZ;
                this.updateSectorPositions(posVec3);
            }
        };

        ActivationGridSystem.prototype.getPatch = function() {

            if (!this.patchPool.length) {
                return new DynamicPatch(this.systemIndex, this.config, this.gridSysData);
            } else {
               return this.patchPool.pop()
            }

        };

        ActivationGridSystem.prototype.updateGridSystem = function(posVec3) {

            if (!posVec3) return;
            
            this.positionBeneathCamera(posVec3);

            this.sectorPool[this.lastChecked % this.sectorPool.length].checkVisibility(this.activePatches, this.patchPool, posVec3);

            this.lastChecked++;

            for (var i = 0; i < this.activePatches.length; i++) {
                this.activePatches[i].checkSectorVisibility(this.sectorPool, this.activePatches, this.patchPool);
            }
        };

        return ActivationGridSystem;

    });