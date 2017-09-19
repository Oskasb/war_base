"use strict";


define([], function() {

    var count = 0;

    var startKey = 'executeAttackStart';
    var hitKey = 'executeAttackHit';
    var endKey = 'executeAttackEnd';

    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();

    var SimulatedHit = function() {

        this.minBaseDamage = 0;
        this.maxBaseDamage = 0;
        this.critChance = 0;
        this.armorPenetrationProbability = 0;
        this.armorPenetration = 0;
        this.armorShred = 0;
        this.isCrit = 0;

        this.impactForce = 0;
        this.areaDamageRange = 0;
        this.areaDamageFactor = 0;

    };

    SimulatedHit.prototype.applyDamageOptions = function(dmgOpts) {
        this.minBaseDamage                  = dmgOpts.min_base_damage           || 1;
        this.maxBaseDamage                  = dmgOpts.max_base_damage           || 1;
        this.critChance                     = dmgOpts.critical_hit_probability  || 0;
        this.armorPenetrationProbability    = dmgOpts.penetration_probability   || 0;
        this.armorPenetration               = dmgOpts.armor_penetration         || 0;
        this.armorShredProbability          = dmgOpts.armor_shred_probability   || 0;
        this.armorShred                     = dmgOpts.armor_shred               || 0;

        this.impactForce                    = dmgOpts.impact_dorce              || 0;
        this.areaDamageRange                = dmgOpts.area_damage_range         || 0;
        this.areaDamageFactor               = dmgOpts.area_damage_factor        || 0;

    };

    SimulatedHit.prototype.getOnHitCalculatedDamage = function() {
        this.isCrit = 0;
        if (Math.random() < this.critChance) {
            this.isCrit = 1;
        }
        var damage = this.minBaseDamage + Math.floor(Math.random()*(this.maxBaseDamage - this.minBaseDamage));

        return damage + this.minBaseDamage*this.isCrit;

    };

    SimulatedHit.prototype.getCalculatedArmorPenetration = function() {
        var pen = this.isCrit;
        if (Math.random() < this.armorPenetrationProbability) {
            pen += 1;
        }
        return this.armorPenetration*pen;
    };

    SimulatedHit.prototype.getCalculatedArmorShred = function() {
        var pen = 0;
        if (Math.random() < this.armorShredProbability) {
            pen = 1;
        }
        return this.armorShred*pen;
    };


    var SimulatedAttack = function(key, attackPool) {
        count++;

        this.nr = count;

        this.expandingPool = attackPool;
        this.dataKey = key;
        this.duration = 0;
        this.pos = new THREE.Vector3();
        this.vel = new THREE.Vector3();
        this.frameVelocity = new THREE.Vector3();
        this.hitNormal = new THREE.Vector3();

        this.onHitFx = '';
        this.hitDamage = 0;
        this.simulatedHit = new SimulatedHit();

        this.onStartFx = '';

        this.damage = {};

        this.weaponOptions = {};
        this.targetId = '';
        this.weaponIndex = 0;
        this.hostSlotIndex = 0;
        this.sourcePieceId = '';
        this.messageBuffer = [];
        this.message = ['', this.messageBuffer];

    };


    SimulatedAttack.prototype.initiateAttack = function(sourcePieceId, hostSlotIndex, weaponIndex, posVec2, velVec3, duration, weaponOptions, targetId) {
        this.hitNormal.set(0, 0, 0);
        this.simulatedHit.applyDamageOptions(weaponOptions.damage);
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
        this.hitDamage = 0;
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

    SimulatedAttack.prototype.registerAttackHit = function(targetActorId, hitNormal) {
        this.hitNormal.copy(hitNormal);
        this.message[0] = hitKey;
        this.populateMessate(hitNormal);
        this.messageBuffer[0] = targetActorId;
        postMessage(this.message);
    };

    SimulatedAttack.prototype.generateAttackHitMessage = function(targetActorId, hitNormal) {
        this.hitNormal.copy(hitNormal);
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

    SimulatedAttack.prototype.applyHitDamageToTargetActor = function(actor) {
        var combatStatus = actor.piece.getCombatStatus();
        if (!combatStatus) {
            console.log("Actor missing combat status.. cant hit it!");
            return;
        }

        var dmg              = this.simulatedHit.getOnHitCalculatedDamage();
        var penetration      = this.simulatedHit.getCalculatedArmorPenetration();
        var shred            = this.simulatedHit.getCalculatedArmorShred();

        combatStatus.applyHitValues(dmg, penetration, shred);
    };

    SimulatedAttack.prototype.getAreaEffectRange = function(store) {
        return this.simulatedHit.areaDamageRange;
    };

    SimulatedAttack.prototype.getImpactPoint = function(store) {
        store = store || tempVec;
        store.copy(this.pos);
    };

    SimulatedAttack.prototype.getImpactForce = function(store) {
        store = store || tempVec;
        store.copy(this.hitNormal);
        store.multiplyScalar(this.simulatedHit.impactForce);
    };

    SimulatedAttack.prototype.returnToPool = function() {
        this.expandingPool.returnToExpandingPool(this);
    };

    return SimulatedAttack;

});