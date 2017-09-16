"use strict";


define([], function() {

    var count = 0;

    var startKey = 'executeAttackStart';
    var hitKey = 'executeAttackHit';
    var endKey = 'executeAttackEnd';

    var SimulatedAttack = function(key, attackPool) {
        count++;

        this.nr = count;

        this.expandingPool = attackPool;
        this.dataKey = key;
        this.duration = 0;
        this.pos = new THREE.Vector3();
        this.vel = new THREE.Vector3();
        this.frameVelocity = new THREE.Vector3();

        this.onHitFx = '';
        this.hitDamage = 0;
        this.onStartFx = '';

        this.weaponOptions = {};
        this.targetId = '';
        this.weaponIndex = 0;
        this.hostSlotIndex = 0;
        this.sourcePieceId = '';
        this.messageBuffer = [];
        this.message = ['', this.messageBuffer];

    };


    SimulatedAttack.prototype.initiateAttack = function(sourcePieceId, hostSlotIndex, weaponIndex, posVec2, velVec3, duration, weaponOptions, targetId) {
        this.hostSlotIndex = hostSlotIndex;
        this.sourcePieceId = sourcePieceId;
        this.weaponIndex = weaponIndex;
        this.pos.copy(posVec2);
        this.vel.copy(velVec3);
        this.duration = duration;
        this.weaponOptions = weaponOptions;
        this.bulletFxId = weaponOptions.particle_effect_id;
        this.onStartFx = weaponOptions.on_attack_module_effect_id;
        this.onHitFx = weaponOptions.on_hit_module_effect_id;
        this.hitDamage = weaponOptions.on_hit_damage;
        this.targetId = targetId;
    };


    SimulatedAttack.prototype.populateMessate = function(normal) {
        this.messageBuffer[0] = this.sourcePieceId;
        this.messageBuffer[1] = this.nr;
        this.messageBuffer[2] = this.hostSlotIndex;
        this.messageBuffer[3] = this.weaponIndex;
        this.messageBuffer[4] = this.onStartFx;
        this.messageBuffer[5] = this.onHitFx;
        this.messageBuffer[6] = this.hitDamage;
        this.messageBuffer[7] = this.pos.x;
        this.messageBuffer[8] = this.pos.y;
        this.messageBuffer[9] = this.pos.z;
        this.messageBuffer[10] = this.vel.x;
        this.messageBuffer[11] = this.vel.y;
        this.messageBuffer[12] = this.vel.z;
        this.messageBuffer[13] = normal.x;
        this.messageBuffer[14] = normal.y;
        this.messageBuffer[15] = normal.z;
        this.messageBuffer[16] = this.bulletFxId;
    };


    SimulatedAttack.prototype.generateAttackMessage = function() {
        this.message[0] = startKey;
        this.populateMessate(this.vel);
        postMessage(this.message);
    };

    SimulatedAttack.prototype.generateAttackHitMessage = function(targetActorId, hitNormal) {
        this.message[0] = hitKey;
        this.populateMessate(hitNormal);
        this.messageBuffer[0] = targetActorId;
        postMessage(this.message);
    };

    SimulatedAttack.prototype.generateAttackEndMessage = function() {
        this.message[0] = endKey;
        this.populateMessate(this.vel);
        postMessage(this.message);
    };

    SimulatedAttack.prototype.applyFrame = function(tpf) {
        this.frameVelocity.copy(this.vel);
        this.frameVelocity.multiplyScalar(tpf);
    };

    SimulatedAttack.prototype.advanceFrame = function(tpf, gravity) {
        this.pos.addVectors(this.pos, this.frameVelocity);
        this.vel.y += this.weaponOptions.gravity_factor * gravity * tpf;
        this.duration -= tpf;
    };

    SimulatedAttack.prototype.returnToPool = function() {
        this.expandingPool.returnToExpandingPool(this);
    };

    return SimulatedAttack;

});