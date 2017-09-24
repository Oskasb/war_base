"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'ThreeAPI',
        'worker/physics/AmmoAPI',
        'worker/terrain/TerrainFunctions',
        'worker/simulation/ActivityFilter',
        'worker/simulation/SimulationMonitor'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        ThreeAPI,
        AmmoAPI,
        TerrainFunctions,
        ActivityFilter,
        SimulationMonitor
    ) {

        var actors = [];
        var levels = [];
        var attacks = [];
        var activationGrid;
        var time = 0;

        var physicsApi;

        var calcVec = new THREE.Vector3();
        var calcObj = new THREE.Object3D();

        var SimulationState = function(protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.selectionActivatedActorId = null;
            this.controlledActorId = null;

            physicsApi = new AmmoAPI();
            this.terrainFunctions = new TerrainFunctions(physicsApi);
            this.simulationOperations = new SimulationOperations(this.terrainFunctions);

            this.activityFilter = new ActivityFilter();

            this.simulationMonitor = new SimulationMonitor();

            ThreeAPI.initThreeScene();
        };

        SimulationState.prototype.addLevel = function(options, ready) {

            physicsApi.initPhysics();

            ThreeAPI.initThreeScene();

            var levelBuilt = function(level) {
                levels.push(level);
                ready({dataKey:level.dataKey, levelId:level.id, config:level.config});
            }.bind(this);

            //
            this.simulationOperations.buildLevel(options, levelBuilt);
            //

        };


        SimulationState.prototype.registerActiveAttack = function(attack) {
            attack.generateAttackMessage();
            attacks.push(attack);
        };

        SimulationState.prototype.removeActiveAttack = function(attack) {
            attack.generateAttackEndMessage();
            attack.returnToPool();
            attacks.splice(attacks.indexOf(attack), 1);

        };


        SimulationState.prototype.attachActorRigidBody = function(actor) {
            physicsApi.setupPhysicalActor(actor);
        };

        SimulationState.prototype.detatchActor = function(actor) {
            actors.splice(actors.indexOf(actor), 1)
        };


        SimulationState.prototype.activateActor = function(actor) {


            ThreeAPI.addToScene(actor.piece.rootObj3D);

            if (actor.body) {
                physicsApi.includeBody(actor.body);
                physicsApi.triggerPhysicallyActive(actor)
            }

            actor.setActivationState(ENUMS.PieceActivationStates.HIDDEN);

            if (actors.indexOf(actor) === -1) {
                actors.push(actor);
            }

            var res = {dataKey:actor.dataKey, actorId:actor.id};
            postMessage(['executeDeployActor', res]);

        };



        var buildIt = function(actor, px, py, pz, nx, ny, nz, rotY, cb, simState) {


            var elevation = 0;
            var normalFactor = 3.14;
            actor.piece.rootObj3D.quaternion.set(0, 0, 0, 1);

            if (actor.physicalPiece) {
                var groungInf = actor.physicalPiece.config.ground_influence;
                if (groungInf) {
                    elevation = groungInf.elevation;
                    normalFactor *= groungInf.normal_factor;

                    if (groungInf.rotate_y) {
                        actor.piece.rootObj3D.rotateY(groungInf.rotate_y[0]*Math.PI +  Math.PI * Math.random() * (groungInf.rotate_y[1] - groungInf.rotate_y[0]));
                    }
                }
            }

            actor.piece.getPos().set(px, py+elevation, pz);

            calcVec.set(nx, ny, nz);

            actor.piece.rootObj3D.rotateX(calcVec.z * normalFactor);
            actor.piece.rootObj3D.rotateZ(-calcVec.x * normalFactor);


            simState.attachActorRigidBody(actor);
            cb(actor);


        };

        var attachCompanions = function(actor, px, py, pz, nx, ny, nz, rotY, respond, _this, companion_actors, index) {
            var companionActors = companion_actors;

            if (companionActors) {

                var i = index;
                if (i === companionActors.length) {
                    return;
                }

                var companionBuilt = function(companionActor) {

                    var offset = companionActors[i].offset;

                    i++;

                    companionActor.setIsCompanion( true);

                    buildIt(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, rotY, respond, _this);
                    attachCompanions(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, rotY, respond, _this, companionActor.config.companion_actors, i);
                };

                _this.simulationOperations.buildActor({dataKey:companionActors[i].dataKey}, companionBuilt);
            }
        };

        SimulationState.prototype.generateActor = function(actorId, pos, normal, facing, onOk) {

            var px = pos.x;
            var py = pos.y;
            var pz = pos.z;
            var nx = normal.x;
            var ny = normal.y;
            var nz = normal.z;

            var rotY = facing || 0;

            var respond = onOk;
            var _this = this;


            var actorBuilt = function(actor) {
                var comps =  actor.config.companion_actors;
                if (comps) {
                    for (var i = 0; i < comps.length; i++) {
                        attachCompanions(actor, px, py, pz, nx, ny, nz, rotY, respond, _this, actor.config.companion_actors, i);
                    }
                }

                actor.setIsCompanion(false);
                buildIt(actor, px, py, pz, nx, ny, nz, rotY, respond, _this)
            };

            this.simulationOperations.buildActor({dataKey:actorId}, actorBuilt);

        };

        SimulationState.prototype.setActivationGrid = function(grid) {
            activationGrid = grid;
        };

        SimulationState.prototype.getGridSystemIdAtPos = function(pos) {
            return "basic_grassland";
        };

        SimulationState.prototype.despawnActor = function(actor) {

            var onOk = function(aId) {
                postMessage(['executeRemoveActor', aId]);
            };

            this.deactivateActorId(actor.id, onOk);

        };

        SimulationState.prototype.spawnActor = function(options, ready) {

            var actorBuilt = function(actor) {
                this.simulationOperations.getRandomPointOnTerrain(actor.piece.rootObj3D.position, levels);

                if (actors.indexOf(actor) !== -1) {
                    console.log("Double add actor fail");
                } else {
                    this.attachActorRigidBody(actor);
                //    physicsApi.triggerPhysicallyActive(actor)
                }

                ThreeAPI.addToScene(actor.piece.rootObj3D);

                if (actor.body) {
                    physicsApi.includeBody(actor.body);
                }

                actor.setActivationState(ENUMS.PieceActivationStates.VISIBLE);

                if (actors.indexOf(actor) === -1) {
                    actors.push(actor);
                }

                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);
        };

        SimulationState.prototype.setSelectionActivatedActorId = function(actorId, onOk) {
            var actor;
            if (this.selectionActivatedActorId !== actorId) {
                actor = this.getActorById(this.selectionActivatedActorId);

                if (!actor) {
                } else {
                    actor.piece.getCombatStatus().notifyActivationDeactivate();
                }
            }

            this.selectionActivatedActorId = actorId;

            if (actorId) {
                actor = this.getActorById(actorId);

                if (!actor) {
                    console.log("Cant select missing actor!");
                } else {
                    actor.piece.getCombatStatus().notifySelectedActivation();
                }
            }

            onOk(actorId);
        };

        SimulationState.prototype.getSelectionActivatedActor = function() {
            return this.getActorById(this.selectionActivatedActorId);
        };

        SimulationState.prototype.setControlledActorId = function(actorId, onOk) {
            this.controlledActorId = actorId;
            onOk(actorId);
        };

        SimulationState.prototype.getControlledActor = function() {
            return this.getActorById(this.controlledActorId)
        };

        SimulationState.prototype.getActors = function() {
            return actors;
        };

        SimulationState.prototype.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id == actorId) {
                    return actors[i];
                }
            }
            //    console.log("No actor by id:", actorId, actors);
        };

        SimulationState.prototype.getLevels = function() {
            return levels;
        };

        SimulationState.prototype.getLevelById = function(leveId) {
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].id === leveId) {
                    return levels[i];
                }
            }
            console.log("No level by id:", leveId, actors);
        };

        SimulationState.prototype.deactivateActorId = function(actorId, cb) {

            var actor = this.getActorById(actorId);

            if (actorId === this.controlledActorId) {
                this.controlledActorId = null;
            }

            if (actor.body) {
                physicsApi.disableActorPhysics(actor);
            }

            actor.setActivationState(ENUMS.PieceActivationStates.HIDDEN);
            this.updateActorFrame(actor, 0);
            ThreeAPI.removeFromScene(actor.piece.rootObj3D);

            this.detatchActor(actor);

            if (typeof(cb) === 'function') {
                cb(actorId);
            }

        };

        SimulationState.prototype.removeActorFromSimulation = function(actor) {
            this.detatchActor(actor);
            //    actors.splice(actors.indexOf(actor), 1);
            ThreeAPI.removeFromScene(actor.piece.rootObj3D);
            //    this.protocolSystem.removeProtocol(actor);
            actor.piece.removeGamePiece();
            actor.removeGameActor();
        };



        SimulationState.prototype.removeLevel = function(levelId, cb) {

            var level = this.getLevelById(levelId);
            levels.splice(levels.indexOf(level), 1);

            cb(levelId);
        };

        SimulationState.prototype.getTerrainHeightAtPos = function(posVec3, tempVec3) {
            return this.simulationOperations.getHeightAtPos(posVec3, levels, tempVec3);
        };

        SimulationState.prototype.cleanupSimulationState = function(cb) {

            while (actors.length) {
                this.removeActorFromSimulation(actors.pop());
            }

            activationGrid.createActivationGrid(this);

            physicsApi.cleanupPhysics(cb);
        };

        SimulationState.prototype.attachTerrainActorToLevel = function(levelId, actorId, cb) {
            var level = this.getLevelById(levelId);
            var actor = this.getActorById(actorId);

            if (actor && level) {
                level.addLevelTerrainActor(actor);
            } else {
                cb({levelActorError:{actorId:actorId, levelId:levelId}});
                console.log("Fail connectinr actor to level", actorId, levelId);
            };

            var terrainOpts = this.simulationOperations.getActorTerrainOptions(actor);

            console.log("OPTS", terrainOpts);

            var terrain = this.terrainFunctions.createTerrain(terrainOpts);

            level.addTerrainToLevel(terrain);

            var buffers = this.terrainFunctions.getTerrainBuffers(terrain);

            terrain.array1d = buffers[4];
            var terrainBody = this.terrainFunctions.addTerrainToPhysics(terrainOpts, terrain.array1d, 0, 0);

            physicsApi.includeBody(terrainBody);
            actor.setPhysicsBody(terrainBody);

            //    time += 0.04;
            //    physicsApi.updatePhysicsSimulation(time);

            //    this.updateActorFrame(actor, 0.02);
            this.activityFilter.notifyActorActiveState(actor, true);
            cb([JSON.stringify({actorId:actorId, levelId:levelId}), buffers]);
        };


        SimulationState.prototype.selectNearbyHostileActor = function(position) {

            var outOfRange = 999;

            var nearestDistance = outOfRange;
            var distance = nearestDistance;

            var selectedTarget = null;

            for (var i = 0; i < actors.length; i++) {

                if (actors[i].config.alignment === 'hostile' && actors[i].isVisible()) {

                    distance = Math.sqrt(actors[i].piece.getPos().distanceToSquared(position));
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        selectedTarget = actors[i];
                    }
                }
            }

            return selectedTarget;
        };


        SimulationState.prototype.checkActorInRangeFromPosition = function(actor, range, position) {

            if (actor.piece.getPos().distanceTo(position) < range) {
                return actor;
            }

        };

        SimulationState.prototype.applyForceToSimulationActor = function(impactForce, actor, randomize) {
            this.activityFilter.notifyActorActiveState(actor, true);
            physicsApi.applyForceToActor(impactForce, actor, randomize);

        };

        SimulationState.prototype.registerAttackHit = function(targetActor, attack, normal) {
            this.removeActiveAttack(attack);
            if (!targetActor) {
                console.log("No target actor for hit");
                targetActor = {};
                targetActor.id = 'unknown'
                // return;
            }
            attack.registerAttackHit(targetActor.id, normal);
            attack.generateAttackHitMessage();

            attack.applyHitDamageToTargetActor(targetActor, 1);



            var aoeRange = attack.getAreaEffectRange();

            if (aoeRange) {
                var aoeDmgFactor = attack.getAreaEffectDamageFactor();

                for (var i = 0; i < actors.length; i++) {

                    var splashHitActor = this.checkActorInRangeFromPosition(actors[i], aoeRange, attack.getImpactPoint());
                    if (splashHitActor) {

                        if (actors[i].piece.getCombatStatus()) {
                            attack.applyHitDamageToTargetActor(splashHitActor, aoeDmgFactor);
                        }

                        this.applyForceToSimulationActor(attack.getAreaDamageForce(splashHitActor), splashHitActor, 0.3);
                        this.activityFilter.notifyActorActiveState(splashHitActor, true);
                    }
                }
            } else {
                this.applyForceToSimulationActor(attack.getImpactForce(), targetActor, 0.5);
            }


            this.activityFilter.notifyActorActiveState(targetActor, true);
        };

        SimulationState.prototype.updateAttackFrame = function(attack, tpf) {

            var steps = 20;
            var stepTime = tpf / steps;


            //    var hit = this.simulationOperations.castPhysicsRay(this, physicsApi, attack, tpf);

            if (hit) {
                return;
            }

            for (var i = 0; i < steps; i++) {
                if (attack.duration + stepTime + tpf < 0) {
                    this.removeActiveAttack(attack);
                    return;
                } else {
                    attack.applyFrame(stepTime);

                    var hit = this.simulationOperations.checkActorProximity(this, this.getActors(), attack);

                    if (hit) {
                        i = steps;
                        return;
                    }

                    attack.advanceFrame(stepTime, physicsApi.getYGravity());
                }
            }

        };

        SimulationState.prototype.getGravityConstant = function() {
            return physicsApi.getYGravity()
        };


        SimulationState.prototype.updateActorFrame = function(actor, tpf) {

            var initState = actor.piece.getPieceActivationState();
            this.protocolSystem.applyProtocolToActorState(actor, tpf);

            if (!actor.body) {
                return;
            }

            if (initState === ENUMS.PieceActivationStates.INACTIVE) {
                actor.piece.updatePieceStates(tpf);
                actor.piece.updatePieceSlots(tpf, this);
                this.protocolSystem.updateActorSendProtocol(actor, tpf);
                return;
            }

            var combatStatus = actor.piece.getCombatStatus();

            if (combatStatus) {
                combatStatus.tickCombatStatus();
                if (combatStatus.getCombatState()) {
                    actor.escalateActivationState();
                    physicsApi.triggerPhysicallyActive(actor);
                    this.activityFilter.notifyActorActiveState(actor, true);

                    if (initState < ENUMS.PieceActivationStates.ACTIVE) {
                        actor.escalateActivationState();
                    }
                } else {

                    if (actor.isEngaged()) {
                        actor.deescalateActivationState();
                        this.activityFilter.notifyActorActiveState(actor, true);
                    } else {

                        var range = this.checkActorInRangeFromPosition(actor, activateRange + actor.piece.boundingSize, playerPos);

                        if (range === actor) {
                            this.activityFilter.notifyActorActiveState(actor, true);
                            physicsApi.triggerPhysicallyActive(actor)
                            if (initState < ENUMS.PieceActivationStates.VISIBLE) {
                                actor.escalateActivationState();
                            }
                        } else {
                            this.activityFilter.notifyActorActiveState(actor, physicsApi.isPhysicallyActive(actor));
                            physicsApi.triggerPhysicallyRelaxed(actor)
                        }

                    }
                }
            }


            if (this.activityFilter.getActorExpectActive(actor)) {

                pieceUpdates++;
                actor.piece.rootObj3D.updateMatrixWorld();

                actor.piece.updatePieceStates(tpf);
                actor.piece.updatePieceSlots(tpf, this);
           //     actor.piece.updatePieceVisuals(tpf);


            //    actor.piece.updateGamePiece(tpf, time, this);
                actor.samplePhysicsState();
                this.protocolSystem.updateActorSendProtocol(actor, tpf);

                var integrity = this.simulationOperations.checkActorIntegrity(actor, levels);

                if (!integrity) {
                    //        this.simulationOperations.positionActorOnTerrain(actors[i], levels);
                }
            } else {

                var range = this.checkActorInRangeFromPosition(actor, visibleRange + actor.piece.boundingSize, playerPos);

                if (range === actor) {
                    if (initState !== ENUMS.PieceActivationStates.VISIBLE) {
                        actor.piece.setPieceActivationState(ENUMS.PieceActivationStates.VISIBLE);

                        if (initState !== actor.piece.getPieceActivationState()) {
                        //    physicsApi.triggerPhysicallyActive(actor)
                            actor.piece.updatePieceStates(tpf);
                            actor.piece.updatePieceSlots(tpf, this);
                            pieceUpdates++;
                        } else {

                        }
                        actor.samplePhysicsState();
                        physicsApi.triggerPhysicallyRelaxed(actor);
                        this.protocolSystem.updateActorSendProtocol(actor, tpf);
                    }
                } else {
                    if (actor.isHidden()) {
                    //    actor.deescalateActivationState();
                        if (initState !== actor.piece.getPieceActivationState()) {
                        //    physicsApi.triggerPhysicallyActive(actor);
                            actor.piece.updatePieceStates(tpf);
                            actor.piece.updatePieceSlots(tpf, this);
                            actor.samplePhysicsState();
                            pieceUpdates++;
                        }
                        this.protocolSystem.updateActorSendProtocol(actor, tpf);
                        physicsApi.triggerPhysicallyRelaxed(actor)
                    }
                }

            }

            if (initState === actor.piece.getPieceActivationState()) {
                actor.piece.framesAtState ++;
            } else {
                actor.piece.framesAtState = 0;
            }

        };

        var activationStates = new Array(ENUMS.PieceActivationStates.ENGAGED + 3);

        var pieceUpdates;
        var activateRange = 20;
        var visibleRange = 1650;
        var playerPos = new THREE.Vector3();

        SimulationState.prototype.updateState = function(tpf) {

            for (var i = -2; i < activationStates.length-2; i++) {
                activationStates[i] = 0;
            }

            pieceUpdates = 0;

            if (levels.length) {

                ThreeAPI.getScene().updateMatrixWorld();
                time += tpf;

                physicsApi.updatePhysicsSimulation(time);

                if (this.controlledActorId) {
                    playerPos.copy(this.getActorById(this.controlledActorId).piece.getPos());
                }

                for (var i = 0; i < attacks.length; i++) {
                    this.updateAttackFrame(attacks[i], tpf);
                }

                for ( i = 0; i < actors.length; i++) {

                    activationStates[actors[i].piece.pieceActivationState] ++;

                    if (!actors[i].isInactive()) {
                        this.updateActorFrame(actors[i], tpf);
                    }
                }
            }

            this.monitorWorkerStatus();

            this.activityFilter.updateFramesInactive();

        };


        SimulationState.prototype.monitorWorkerStatus = function() {

            var status = physicsApi.fetchPhysicsStatus();

            this.simulationMonitor.monitorKeyValue('FILTRD_OUT', this.activityFilter.countFilteredActors());
            this.simulationMonitor.monitorKeyValue('ACTORS', actors.length);
            this.simulationMonitor.monitorKeyValue('BODIES', status.bodyCount);
            this.simulationMonitor.monitorKeyValue('UPDATED', pieceUpdates);
            this.simulationMonitor.monitorKeyValue('ATTACKS', attacks.length);

            for (var i = -2; i < activationStates.length-2; i++) {
                this.simulationMonitor.monitorKeyValue('STATE_'+i, activationStates[i]);
            }

            postMessage(['executeMonitorWorker',  this.simulationMonitor.getMonitorValues()]);
        };


        return SimulationState;

    });

