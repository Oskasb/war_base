"use strict";


define([], function() {

    var count = 0;

    var SimulatedAttack = function(key, attackPool) {
        count++

        this.nr = key+'_'+count;

        this.expandingPool = attackPool;
        this.dataKey = key;
        this.duration = 0;
        this.pos = new THREE.Vector3();
        this.vel = new THREE.Vector3();
        this.frameVelocity = new THREE.Vector3();
        this.weaponOptions = null;
        this.targetId = null;
    };


    SimulatedAttack.prototype.initiateAttack = function(posVec2, velVec3, duration, weaponOptions, targetId) {
        this.pos.copy(posVec2);
        this.vel.copy(velVec3);
        this.duration = duration;
        this.weaponOptions = weaponOptions;
        this.targetId = targetId;
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