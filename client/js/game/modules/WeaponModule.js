
"use strict";


define([
        'PipelineObject',
        'game/SimulatedAttack',
        'application/ExpandingPool'

    ],
    function(
        PipelineObject,
        SimulatedAttack,
        ExpandingPool
    ) {

    var velVec = new THREE.Vector3();
    var aimVec = new THREE.Vector3();
    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();
    var tempObj3D = new THREE.Object3D();
    var outOfRange;

        var nearestDistance;

        var dynamic = {
            fromX:           {state:0},
            fromY:           {state:0},
            fromZ:           {state:0},
            toX:             {state:0},
            toY:             {state:0},
            toZ:             {state:0},
            travelTime:      {state:0},
            triggerCommand:  {state:0},
            activateCommand: {state:0}
        };

        var createAttack = function(key, callback) {
            callback(new SimulatedAttack(key, attackPool));
        };

        var attackPool = new ExpandingPool('weapon_attack', createAttack);



        var WeaponModule = function(dataKey, ready, index) {

            this.weaponIndex = index;

            this.dynamic = {
                fromX:           {state:0},
                fromY:           {state:0},
                fromZ:           {state:0},
                toX:             {state:0},
                toY:             {state:0},
                toZ:             {state:0},
                travelTime:      {state:0},
                triggerCommand:  {state:0},
                activateCommand: {state:0}
            };

            this.dataKey = dataKey;

            this.selectedTarget = null;
            this.targetFocusTime = 0;
            this.cooldownCountdown = 0;

            this.activationFrame = 0;

            var applyChannelData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('WEAPON_DATA', 'WEAPONS', applyChannelData, this.dataKey);
        };

        WeaponModule.prototype.getStateKeyForStateId = function (stateId) {
            for (var i = 0; i < this.feedbackMap.length; i++) {
                if (this.feedbackMap[i].stateid === stateId) {
                    return this.feedbackMap[i].key;
                }
            }
        };

        WeaponModule.prototype.applyWeaponTrigger = function(state, module, callFireWeapon) {
            if (this.dynamic.activateCommand.state) {

            }
        };

        WeaponModule.prototype.setupDynamicState = function (stateId, value) {
            var stateKay = this.getStateKeyForStateId(stateId);
            this.dynamic[stateKay].state = value;

        };


        WeaponModule.prototype.applyData = function (config) {
            this.config = config;
            this.stateMap = config.state_map;
            this.feedbackMap = config.feedback_map;
            this.weaponOptions = config.weapon.options;
        };

        WeaponModule.prototype.setSelectedTarget = function (selectedTarget) {
            this.dynamic.activateCommand.state = 0;
            this.dynamic.triggerCommand.state = 0;
            this.targetFocusTime = 0;
            this.selectedTarget = selectedTarget;
        };

        WeaponModule.prototype.getMuzzlePosition = function (module, vec3) {
            module.getObjec3D().updateMatrixWorld();
            var ap = module.getAttachmentPointById(this.weaponOptions.muzzle_attachment_point_id);
            var muzzleModule = ap.getAttachedModule();

            vec3.setFromMatrixPosition( muzzleModule.getObjec3D().matrixWorld );
        };

        var distance;

        WeaponModule.prototype.aimAtTargetActor = function(module, targetActor) {

            this.getMuzzlePosition(module, tempObj3D.position);

            distance = Math.sqrt(targetActor.piece.getPos().distanceToSquared(tempObj3D.position));

            aimVec.set(0, 0, 1);

            module.getObjec3D().getWorldQuaternion( tempObj3D.quaternion );

            aimVec.applyQuaternion(tempObj3D.quaternion);


        //    aimVec.copy(targetActor.piece.getPos());

                tempVec2.set(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
                tempVec2.normalize();
                tempVec2.multiplyScalar(Math.random() * this.weaponOptions.bullet_spread);


            aimVec.x += tempVec2.x;
            aimVec.y += tempVec2.y;
            aimVec.z += tempVec2.z;

            aimVec.multiplyScalar(this.weaponOptions.range);

        //    module.getObjec3D().parent.worldToLocal( aimVec );
        //    module.getObjec3D().lookAt( aimVec );
        };



        WeaponModule.prototype.setupAttack = function(sourcePoieceId, hostSlotIndex, weaponIndex, pos, vel, duration, weaponOptions, targetId, callback) {

            var getAttack = function(attack) {
                attack.initiateAttack(sourcePoieceId, hostSlotIndex, weaponIndex, pos, vel, duration, weaponOptions, targetId);
                callback(attack);
            };

            attackPool.getFromExpandingPool(getAttack);
        };


        WeaponModule.prototype.generateActiveBullet = function(sourcePiece, module, simulationState) {

            var fromVec = tempObj3D.position;


        //    aimVec.copy(this.selectedTarget.piece.getPos());
            aimVec.x += fromVec.x;
            aimVec.y += fromVec.y;
            aimVec.z += fromVec.z;

            this.dynamic.fromX.state = fromVec.x;
            this.dynamic.fromY.state = fromVec.y;
            this.dynamic.fromZ.state = fromVec.z;

            this.dynamic.toX.state = aimVec.x;
            this.dynamic.toY.state = aimVec.y;
            this.dynamic.toZ.state = aimVec.z;

            this.dynamic.travelTime.state = this.weaponOptions.range / this.weaponOptions.velocity;
            this.dynamic.activateCommand.state = 1;

            velVec.subVectors(aimVec, fromVec);

            velVec.normalize();

            tempVec.copy(velVec);
            tempVec.multiplyScalar(-this.weaponOptions.recoil_force);

            simulationState.applyForceToSimulationActor(tempVec, sourcePiece.getActor(), 0.15);

            velVec.multiplyScalar(this.weaponOptions.velocity);

            var onReady = function(attack) {
                simulationState.registerActiveAttack(attack);
            };

            this.setupAttack(sourcePiece.id, module.getHostSlotIndex(), this.weaponIndex , fromVec, velVec, this.dynamic.travelTime.state, this.weaponOptions, this.selectedTarget.id, onReady)

        };


        WeaponModule.prototype.determineBulletActivate = function(sourcePiece, target, module, simulationState) {

            if (this.cooldownCountdown <= 0) {

                this.aimAtTargetActor(module, target);

                if (distance < this.weaponOptions.range) {
                    this.generateActiveBullet(sourcePiece, module, simulationState);
                    this.cooldownCountdown = this.weaponOptions.cooldown;
                    this.activationFrame = 1;
                }

            } else {

            }

            if (this.activationFrame !== 1) {
                this.dynamic.activateCommand.state = 0;
            }

            this.activationFrame--;

        };

        WeaponModule.prototype.determineTriggerState = function(sourcePiece, target, module, simulationState) {

            if (this.targetFocusTime > this.weaponOptions.focus_time) {
                this.dynamic.triggerCommand.state = 1;
                this.determineBulletActivate(sourcePiece, target, module, simulationState)
            } else {
                this.dynamic.triggerCommand.state = 0;
            }

        };

        WeaponModule.prototype.sampleState = function(targetActor, module) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = module.getPieceStateById(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = module.getObjec3D()[param][axis];
                state.value = value;
            }
        };

        WeaponModule.prototype.clearFeedbackMap = function(module, feedback) {
            var targetStateId = feedback.stateid;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       0;
        };

        WeaponModule.prototype.interpretWeaponState = function(param, key, property) {
            return this[param][key][property];
        };

        WeaponModule.prototype.applyFeedbackMap = function(module, feedback) {
            var param =         feedback.param;
            var key =           feedback.key;
            var property =      feedback.property;
            var targetStateId = feedback.stateid;
            var factor =        feedback.factor;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       this.interpretWeaponState(param, key, property) * factor;
        };

        WeaponModule.prototype.applyFeedback = function(module, feedbackMap) {
            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(module, feedbackMap[i]);
            }
        };



        WeaponModule.prototype.updateWeaponState = function(sourcePiece, target, simulationState, module, tpf) {
            if (!this.config) return;

            if (target) {
                if (target === this.lastTarget) {
                    this.targetFocusTime += tpf;
                } else {
                    this.setSelectedTarget(target);
                }

            //    this.aimAtTargetActor(target);
                this.determineTriggerState(sourcePiece, target, module, simulationState);

            }

            this.cooldownCountdown -= tpf;

            this.sampleState(target, module);

            this.applyFeedback(module, this.feedbackMap);

            this.lastTarget = target;
        };

        WeaponModule.prototype.removeWeaponModule = function () {
            this.pipeObj.removePipelineObject();
        };

        return WeaponModule
    });