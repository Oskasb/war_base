"use strict";


define([], function() {


    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();
    var calcObj = new THREE.Object3D();

    var applyWeaponState = function(weapon, state) {
        weapon.setupDynamicState(state.id, state.targetValue);
    };


    var WeaponControlUtils = function() {

    };

    var callFireWeapon = function(dynamic, module, weaponOptions) {

        var fxCallbacks = module.visualModule.getEffectCallbacks();

        if (!fxCallbacks.createPassiveTemporalEffect) return;

        var duration = dynamic.duraion;

        calcVec.set(dynamic.fromX, dynamic.fromY, dynamic.fromZ);
        calcVec2.set(dynamic.toX, dynamic.toY, dynamic.toZ);

        calcVec2.subVectors(calcVec2, calcVec);
        calcObj.lookAt(calcVec2);

        var fxId = weaponOptions.particle_effect_id;

        fxCallbacks.createPassiveTemporalEffect(
            fxId,
            calcVec,
            calcVec2,
            0,
            calcObj.quaternion,
            duration
        );

        console.log("Call Fire Weapon", [dynamic, weaponOptions]);

    };


    WeaponControlUtils.callWeaponTriggerActive = function(module, target, enable) {
        var weapons = module.weapons;

        var state = target.state;

        for (var i = 0; i < weapons.length; i++) {
            weapons[i].applyWeaponTrigger(state.targetValue, module, callFireWeapon);
        }

    };

    WeaponControlUtils.callWeaponBulletSetup = function(module, target, enable) {
        var weapons = module.weapons;

        var state = target.state;

        for (var i = 0; i < weapons.length; i++) {
            applyWeaponState(weapons[i], state)
        }

    };

    WeaponControlUtils.callWeaponBulletActivate = function(module, target, enable) {

        var weapons = module.weapons;

        var state = target.state;
        for (var i = 0; i < weapons.length; i++) {
        //    weapons[i].activateWeaponFrame(state.targetValue);
        }

    };


    return WeaponControlUtils;

});