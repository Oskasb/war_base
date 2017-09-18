"use strict";


define([
    'EffectsAPI',
    'game/modules/ModuleEffectCreator'

], function(
    EffectsAPI,
    ModuleEffectCreator
) {

    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();
    var calcObj = new THREE.Object3D();

    var activeAttacks = {};

    var CombatFeedbackFunctions = function() {

    };

    var generateBullet = function(weapon, fromVec, normalVec, bulletFxId, store) {

        calcVec2.copy(normalVec);

        calcVec2.normalize();

        calcObj.lookAt(calcVec2);

        calcVec2.multiplyScalar(weapon.weaponOptions.velocity);

        return ModuleEffectCreator.createPassiveEffect(
            bulletFxId,
            fromVec,
            normalVec,
            0,
            calcObj.quaternion,
            store
        );

        //    console.log("Call Fire Weapon", [dynamic, weaponOptions]);

    };

    CombatFeedbackFunctions.prototype.registerAttackStart = function(attackId, piece, slotIdx, weaponIdx, posVec, normalVec, moduleEffectId, bulletFxId) {

        var slot = piece.getSlotByIndex(slotIdx);

        var module = slot.getModule();

        var weapons = module.weapons;

        var weapon = weapons[weaponIdx];

    //  var state = target.state;

        weapon.getMuzzlePosition(module, calcVec);


    //    weapon.applyWeaponTrigger(state, module, callFireWeapon);
        ModuleEffectCreator.createTemporaryPassiveEffect(moduleEffectId, calcVec, normalVec);

        if (!activeAttacks[attackId]) {
            activeAttacks[attackId] = [];
        }

        generateBullet(weapon, calcVec, normalVec, bulletFxId, activeAttacks[attackId]);
    };

    CombatFeedbackFunctions.prototype.registerAttackHit = function(attackId, actor, posVec, normalVec, damage, moduleEffectId) {
        ModuleEffectCreator.createTemporaryPassiveEffect(moduleEffectId, posVec, normalVec);
        this.registerAttackEnd(attackId);
    };


    CombatFeedbackFunctions.prototype.registerAttackEnd = function(attackId) {
        ModuleEffectCreator.removeModuleStaticEffect(activeAttacks[attackId])
    };

    CombatFeedbackFunctions.prototype.getActiveAttackCount = function() {
        var count = 0;

        for (var key in activeAttacks) {
            count++;
        }

        return count;
    };

    return CombatFeedbackFunctions;

});