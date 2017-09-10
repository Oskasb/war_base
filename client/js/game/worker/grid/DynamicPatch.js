"use strict";

define([
        'ThreeAPI',
        'PipelineAPI'
        //   'EffectAPI'
    ],
    function(
        ThreeAPI,
        PipelineAPI
        //    EffectAPI
    ) {


        var zeroVec = new THREE.Vector3();
        var tempVec = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();
        var tempVec3 = new THREE.Vector3();

        var debug = false;

        var plantData = {
            "id":"test_plant"
        };


        var DynamicPatch = function(simState, sysIndex, config, gridSysData) {

            this.simulationState = simState;
            this.skipCount = 0;

            this.config = config;
            this.enabled = false;
            this.systemIndex = sysIndex;

            this.gridSysData = gridSysData;

            this.actorWeights = [];

            this.indexX = 'none';
            this.indexZ = 'none';

            this.requestedEntries = 0;
            this.spawnedEntries = [];

        };


        DynamicPatch.prototype.size = function() {
            return this.conf().sector_size;
        };

        DynamicPatch.prototype.conf = function() {
            return this.config[this.systemIndex]
        };



        DynamicPatch.prototype.enablePatch = function(ix, iz, x, z) {

            if (this.enabled) {
                console.log("DynamicPatch ALREADY TAKEN!");
                return;
            }

            this.enabled = true;

            this.indexX = ix;
            this.indexZ = iz;

            this.posX = x;
            this.posZ = z;

        };

        DynamicPatch.prototype.despawnPatchCount = function(count) {

            for (var i = 0; i < count; i++) {
                if (this.spawnedEntries.length) {
                    this.simulationState.despawnActor(this.spawnedEntries.pop());
                } else {
                    return;
                }
            }
        };

        DynamicPatch.prototype.getFramePlantCount = function() {
            return (this.conf().actor_count - this.skipCount) / this.conf().spawn_frames;
        };

        DynamicPatch.prototype.disablePatch = function(activePatches, patchPool) {

            if (this.spawnedEntries.length) {
                this.despawnPatchCount(this.getFramePlantCount())
            } else {
                this.skipCount = 0;
                var patch = activePatches.splice(activePatches.indexOf(this), 1)[0];
                patchPool.push(patch);

                if (!this.enabled) {
                    console.log("Already disabled...");
                    return;
                }

                this.enabled = false;
                this.indexX = 'none';
                this.indexZ = 'none';
            }

            if (this.debugging) {
                this.debugRemove();
            }

        };


        DynamicPatch.prototype.getContent = function(sysId) {
            return this.gridSysData[sysId][this.systemIndex].patch_content;
        };



        var checkSlope = function(normal, min, max) {
            return min < 1 - normal.y && max >= 1 - normal.y
        };

        var checkElevation = function(pos, min, max) {
            return min < pos.y && max >= pos.y
        };

        DynamicPatch.prototype.plantIdBySystemAndNormal = function(sysId, pos, normal) {

            var actors = this.getContent(sysId);

            var totalWeight = 0;

            for (var i = 0; i < actors.length; i++) {

                var probability = actors[i].probability || 1;
                this.actorWeights[i] = 0;

                if (Math.random() < probability) {
                    if (checkSlope(normal, actors[i].slope.min, actors[i].slope.max) && checkElevation(pos, actors[i].elevation.min, actors[i].elevation.max)) {
                        this.actorWeights[i] = 1;
                        totalWeight++
                    }
                }

            }

            if (!totalWeight) return null;

            var seed = totalWeight * Math.random();

            for (i = 0; i < actors.length; i++) {
                if (this.actorWeights[i] * (i+1) > seed) {
                    return actors[i].id
                }
            }
            console.log("Bad patch by normal lookup");

        };




        DynamicPatch.prototype.spawnPatchActor = function(pos) {

            tempVec2.x = 0;
            tempVec2.y = 0;
            tempVec2.z = 0;

            if (!pos.x) return;

            var entryId = this.plantIdBySystemAndNormal(this.simulationState.getGridSystemIdAtPos(pos), pos, tempVec3);

            if (!entryId) {
                this.skipCount ++;
                return;
            }

            var onOk = function(res) {
        //        this.requestedEntries--;
                this.spawnedEntries.push(res.actorId);
            }.bind(this);

            tempVec.copy(pos);
        //    this.requestedEntries++;
            this.simulationState.generateActor(entryId, tempVec, tempVec2, onOk);


        };


        DynamicPatch.prototype.doPopulate = function(count) {


            for (var i = 0; i < count; i++) {

                tempVec.x = this.posX + this.size() * Math.random() - 0.5;
                tempVec.y = 1;
                tempVec.z = this.posZ + this.size() * Math.random() - 0.5;
                tempVec.y = this.simulationState.getTerrainHeightAtPos(tempVec, tempVec3);
                this.spawnPatchActor(tempVec, plantData)
            }
        };

        DynamicPatch.prototype.checkSectorVisibility = function(sectorPool, activePatches, patchPool) {

            for (var i = 0; i < sectorPool.length; i++) {
                if (sectorPool[i].indexX === this.indexX && sectorPool[i].indexZ === this.indexZ) {
                    if (this.requestedEntries + this.spawnedEntries.length < this.conf().actor_count) {
                        this.doPopulate(this.getFramePlantCount());
                    }
                    return                     
                }
            }

            this.disablePatch(activePatches, patchPool);
        };


        DynamicPatch.prototype.applyPatchDebug = function(bool) {

        };

        DynamicPatch.prototype.clearPatch = function() {
            while (this.spawnedEntries.length) {
                this.simulationState.despawnActor(this.spawnedEntries.pop());
            }
        };

        return DynamicPatch;

    });