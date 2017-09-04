"use strict";

define([
        'game/GameActor',
        'game/levels/GameLevel'

    ],
    function(
        GameActor,
        GameLevel
    ) {

        var count = 0;
        var calcVec = new THREE.Vector3();

        var SimulationOperations = function(terrainFunctions) {
            this.terrainFunctions = terrainFunctions;
        };

        SimulationOperations.prototype.buildLevel = function(options, ready) {
            count++
            new GameLevel('level_'+count, options.dataKey, ready);
        };

        SimulationOperations.prototype.buildActor = function(options, ready) {
            count++
            new GameActor('actor_'+count, options.dataKey, ready);
        };

        SimulationOperations.prototype.getActorTerrainOptions = function(actor) {
            for (var i = 0; i < actor.piece.pieceSlots.length; i++) {
                var mod = actor.piece.pieceSlots[i].module;
                if (mod.config.terrain) {
                    return mod.config.options;
                }
            }
            console.log("No terrain options on actor:", actor);
        };


        var checkPositionWithin = function(pos, terrainModel, parentObj) {

            var pPosx = parentObj.position.x;
            var pPosz = parentObj.position.z;

            if (parentObj.parent) {

                pPosx += parentObj.parent.position.x;
                pPosz += parentObj.parent.position.z;

                if (parentObj.parent.parent) {
                    pPosx += parentObj.parent.parent.position.x;
                    pPosz += parentObj.parent.parent.position.z;
                }

            } else {
        //        console.log("No Parent object for Terrain root", terrainModel);
            }


            var size = terrainModel.opts.xSize;
            pPosx += size/2;
            pPosz += size/2;

            if (pPosx <= pos.x && pPosx + size >= pos.x) {
                if (pPosz <= pos.z && pPosz + size >= pos.z) {
                    return true;
                }
            }
            return false;
        };

        SimulationOperations.prototype.checkPosIsWithinLevelTerrain = function(vec3, level) {


            for (var i = 0; i < level.terrains.length; i++) {
                if (checkPositionWithin(vec3, level.terrains[i], level.terrainActors[i].piece.rootObj3D)) {
                    return i;
                }
            }

            return false;
        };

        SimulationOperations.prototype.terrainHeightAtPos = function(terrain, vec3, rootObj3D, normalStore) {
            return this.terrainFunctions.getTerrainHeightAt(terrain, vec3, rootObj3D, normalStore);
        };

        SimulationOperations.prototype.randomTerrainSetPosVec3 = function(vec3, terrain, rootObj3D, normalStore) {

            var size = terrain.opts.xSize;
            var height = (terrain.opts.maxHeight - terrain.opts.minHeight);

            size *= 0.8;

            vec3.copy(rootObj3D.position);
            vec3.x += Math.random()*size  - size/2;
            vec3.z += Math.random()*size  - size/2;

            vec3.y = this.terrainHeightAtPos(terrain, vec3, rootObj3D, normalStore);

        };

        SimulationOperations.prototype.getRandomPointOnTerrain = function(vec3, levels, normalStore) {
            for (var i = 0; i < levels.length; i++) {
                var index = this.checkPosIsWithinLevelTerrain(vec3, levels[i]);
                if (typeof(index) === 'number') {
                    this.randomTerrainSetPosVec3(vec3, levels[i].terrains[index], levels[i].terrainActors[index].piece.rootObj3D, normalStore);
                    return;
                };
            }
            console.log("No Terrain for Pos", vec3);
        };

        SimulationOperations.prototype.getLevelForPosition = function(vec3, levels) {

            for (var i = 0; i < levels.length; i++) {
                var index = this.checkPosIsWithinLevelTerrain(vec3, levels[i]);
                if (typeof(index) === 'number') {
                    return levels[i];
                }
            }
        };

        SimulationOperations.prototype.getHeightAtPos = function(pos, levels, normalStore) {

            calcVec.copy(pos);
            calcVec.x += 1000;
            calcVec.z += 1000;

            var level = this.getLevelForPosition(calcVec , levels);

            if (!level) return pos.y;

            var terrainIndex  = this.checkPosIsWithinLevelTerrain(calcVec, level);

            return this.terrainHeightAtPos(level.terrains[terrainIndex], pos, level.terrainActors[terrainIndex].piece.rootObj3D, normalStore);

        };

        SimulationOperations.prototype.checkActorIntegrity = function(actor, levels) {

            if (actor.physicalPiece) {
                var mass = actor.physicalPiece.config.rigid_body.mass;
                if (!mass) return true;
            }

            var pos = actor.piece.rootObj3D.position;

            calcVec.copy(pos);
            calcVec.x += 1000;
            calcVec.z += 1000;

            var level = this.getLevelForPosition(calcVec , levels);


            if (!level) {
                if (Math.random() < 0.1) {
                    console.log("Actor not on level", calcVec);
                    this.positionActorRandomOnTerrain(actor, levels)
                }
                return;
            } else {
                for (var i = 0; i < level.terrainActors.length; i++) {
                    if (level.terrainActors[i] === actor) {
                        return true;
                    }
                }
            }


            var terrainIndex  = this.checkPosIsWithinLevelTerrain(calcVec, level);

            var terrainHeight = this.terrainHeightAtPos(level.terrains[terrainIndex], pos, level.terrainActors[terrainIndex].piece.rootObj3D);

            if (terrainHeight > pos.y) {
                if (Math.random() < 0.1) {
                    console.log("Actor beneath level terrain")
                    pos.y = terrainHeight +2;
                    this.setActorPosition(actor, pos)
                }
                return;
            }

            return true;
        };

        SimulationOperations.prototype.setActorPosition = function(actor, pos) {
            actor.forcePosition(pos);
        };

        SimulationOperations.prototype.positionActorRandomOnTerrain = function(actor, levels) {
            var pos = actor.piece.rootObj3D.position;
            pos.x = 1000;
            pos.z = 1000;
            this.getRandomPointOnTerrain(pos, levels);
            pos.y += 10;
            actor.forcePosition(pos);
        };

        return SimulationOperations;

    });

