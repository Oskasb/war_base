"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'worker/simulation/SimulationProcessor',
        'worker/simulation/SimulationUtils',
        'worker/simulation/AggroProcessor',
        'ThreeAPI',
        'worker/physics/AmmoAPI',
        'worker/terrain/TerrainFunctions',
        'worker/simulation/ActivityFilter',
        'worker/simulation/SimulationMonitor'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        SimulationProcessor,
        SimulationUtils,
        AggroProcessor,
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

        var SimulationState = function(protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.selectionActivatedActorId = null;
            this.controlledActorId = null;

            physicsApi = new AmmoAPI();
            this.terrainFunctions = new TerrainFunctions(physicsApi);
            this.simulationOperations = new SimulationOperations(this.terrainFunctions);
            this.aggroProcessor = new AggroProcessor();

            this.activityFilter = new ActivityFilter();

            this.simulationMonitor = new SimulationMonitor();

            this.simulationUtils = new SimulationUtils(this, physicsApi);

            this.simulationProcessor = new SimulationProcessor(this, physicsApi);

            ThreeAPI.initThreeScene();
        };

        SimulationState.prototype.addLevel = function(options, ready) {
            this.simulationUtils.initSimulationLevel(options, ready);
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
            this.simulationUtils.activateSimulationActor(actor);
        };


        SimulationState.prototype.generateActor = function(actorId, pos, normal, facing, onOk) {

            this.simulationUtils.generateSimulationActor(actorId, pos, normal, facing, onOk)
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
            this.simulationUtils.spawnSimulationActor(options, ready)
        };


        SimulationState.prototype.setSelectionActivatedActorId = function(actorId, onOk) {
            this.simulationUtils.simulationSelectionActivatedActorId(actorId, onOk)
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
                if (levels[i].id === leveId) {3
                    return levels[i];
                }
            }
            console.log("No level by id:", leveId, actors);
        };

        SimulationState.prototype.deactivateActorId = function(actorId, cb) {
            this.simulationUtils.deactivateSimulationActorId(actorId, cb);
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
            this.simulationUtils.attachSimulationTerrainActorToLevel(levelId, actorId, cb);
        };


        SimulationState.prototype.selectNearbyHostileActor = function(piece, position) {
            return this.aggroProcessor.selectNearbyOpponent(piece, actors, position)
        };


        SimulationState.prototype.checkActorInRangeFromPosition = function(actor, range, position) {
            if (actor.piece.getPos().distanceTo(position) < range) {
                return actor;
            }
        };

        SimulationState.prototype.applyBodyForceAndTorque = function(forceVec, body, offset) {
            physicsApi.applyForceAndTorqueToBody(forceVec, body, offset);
        };

        SimulationState.prototype.applyForceToSimulationActor = function(impactForce, actor, randomize) {
            this.activityFilter.notifyActorActiveState(actor, true);
            physicsApi.applyForceToActor(impactForce, actor, randomize);
        };

        SimulationState.prototype.registerAttackHit = function(targetActor, attack, normal) {
            this.simulationUtils.registerSimulationAttackHit(targetActor, attack, normal);
        };

        SimulationState.prototype.updateAttackFrame = function(attack, tpf) {
            this.simulationProcessor.processAttackFrame(attack, tpf);
        };

        SimulationState.prototype.getGravityConstant = function() {
            return physicsApi.getYGravity()
        };

        SimulationState.prototype.updateActiveActor = function(actor, tpf) {
            pieceUpdates++;
            this.simulationProcessor.processActiveActorFrame(actor, tpf);
        };

        SimulationState.prototype.updateStaticActor = function(actor, tpf) {
            pieceUpdates++;
            this.simulationProcessor.processStaticActorFrame(actor, tpf);
        };

        SimulationState.prototype.updateActorFrame = function(actor, tpf) {
            this.simulationProcessor.processActorFrame(actor, playerPos, tpf, visibleRange, activateRange);
        };

        var activationStates = new Array(ENUMS.PieceActivationStates.ENGAGED + 3);

        var pieceUpdates;
        var activateRange = 25;
        var visibleRange = 1725;
        var playerPos = new THREE.Vector3();

        SimulationState.prototype.updateState = function(tpf) {

            for (var i = -2; i < activationStates.length-2; i++) {
                activationStates[i] = 0;
            }

            pieceUpdates = 0;

            if (levels.length) {
                time += tpf;
                this.simulationProcessor.processLevelFrame(time, tpf, attacks, playerPos, activationStates);
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

