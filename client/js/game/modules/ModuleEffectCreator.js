"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI',
        'EffectsAPI'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI,
        EffectsAPI
    ) {

        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();
        var calcVec3 = new THREE.Vector3();
        var calcQuat = new THREE.Quaternion();
        var threeObj = new THREE.Object3D();
        var zeroVec = new THREE.Vector3();

        var calcObj = new THREE.Object3D();

        var maxGroundContactDistance = 0.5;

        var maxActiveGroundPrints = 2000;

        var maxGeometryEffetcs = 1000;

        var groundprints = [];
        var geometryEffects = [];


        var effectData = {
            effect:'',
            pos:new THREE.Vector3(),
            vel:new THREE.Vector3()
        };

        var emitEffect = function(effectId, pos, vel) {
            effectData.effect = effectId;
            effectData.pos.set(pos.x, pos.y, pos.z);
            effectData.vel.set(vel.x, vel.y, vel.z);
            evt.fire(evt.list().GAME_EFFECT, effectData);
        };

        var onQuitActiveLevel = function() {
            while (groundprints.length) {
                EffectsAPI.returnPassiveEffect(groundprints.pop())
            }
            while (geometryEffects.length) {
                EffectsAPI.returnPassiveEffect(geometryEffects.pop())
            }
        }


        evt.on(evt.list().QUIT_ACTIVE_LEVEL, onQuitActiveLevel);

        var posFromTransform = function(pos, transform, storeVec3) {
            storeVec3.set(pos.x+ transform.pos[0], pos.y + transform.pos[1], pos.z + transform.pos[2]);
        };

        var sizeFromTransform = function(transform, storeVec3) {
            storeVec3.set(transform.size[0], transform.size[1],  transform.size[2]);
        };

        var ModuleEffectCreator = function() {

        };

        var pre = 0;

        ModuleEffectCreator.setupModuleTransform = function(calcVec, transform, calcQuat, stateValue, velStore, posStore) {

            posStore.x = transform.size[0]*Math.random() - transform.size[0]*0.5;
            posStore.y = transform.size[1]*Math.random() - transform.size[1]*0.5;
            posStore.z = transform.size[2]*Math.random() - transform.size[2]*0.5;

            posStore.applyQuaternion(calcQuat);

            velStore.addVectors(calcVec, posStore);

            //    posStore.x = piece.spatial.vel.getX() * - stateValue*0.15 + Math.random()*0.02 - 0.01;
            //    posStore.y = piece.spatial.vel.getY() + Math.abs(stateValue);
            //    posStore.z = piece.spatial.vel.getZ() * - stateValue*0.15 + Math.random()*0.02 - 0.01;

            velStore.x += posStore.x*0.02;
            velStore.z += posStore.z*0.02;

        };


        ModuleEffectCreator.createActiveEffect = function(effectId, posVec, velVec) {
            emitEffect(effectId, posVec, velVec)
            //    evt.fire(evt.list().GAME_EFFECT, {effect:effectId, pos:posVec, vel:velVec});
        };


        ModuleEffectCreator.createModuleModelEffect = function(piece, model, remove_effect, transform) {

            if (!model.matrixWorld) {
                return;
            }

            if (!remove_effect) {
                var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', 'default_remove_effect');
            } else {
                var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', remove_effect);
            }

            calcVec.setFromMatrixPosition( model.matrixWorld );
        //    model.getWorldQuaternion(calcQuat);
            calcQuat.setFromRotationMatrix(model.matrixWorld);


            if (!calcVec.x) return;
            if (!piece.spatial.pos.data) return;

            for (var i = 0; i < fx.length; i++) {
                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.setupModuleTransform(piece, calcVec, transform, calcQuat, 1, calcVec2, calcVec3);

                    ModuleEffectCreator.createActiveEffect(fx[i].particle_effects[j].id, calcVec2, calcVec3)
                }
            }
        };

        ModuleEffectCreator.createPositionEffect = function(pos, effectId, transform, vel) {

            if (!effectId) {
                var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', 'default_remove_effect');
            } else {
                var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', effectId);
            }

            posFromTransform(pos, transform, calcVec);

            if (!vel) {
                calcVec2.set(0, 5, 0);
            } else {
                calcVec2.set(vel.data[0], vel.data[1], vel.data[2]);
            }

            for (var i = 0; i < fx.length; i++) {
                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.createActiveEffect(fx[i].particle_effects[j].id, calcVec, calcVec2);
                }
            }
        };


        ModuleEffectCreator.createModuleApplyEmitEffect = function(model, emit_effect, transform, stateValue, glueToGround) {

            var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', emit_effect);

            if (!model.matrixWorld) {
                console.log("No model matrix world?");
                return;
            }

            calcVec.setFromMatrixPosition( model.matrixWorld );
            calcQuat.setFromRotationMatrix(model.matrixWorld);


            for (var i = 0; i < fx.length; i++) {

                if (!fx[i].particle_effects) {
                    console.log("Bad FX: ", fx)
                    return;
                }

                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.setupModuleTransform(calcVec, transform, calcQuat, stateValue, calcVec2, calcVec3);

                    if (glueToGround) {
                        pre = calcVec2.y;
                        ThreeAPI.setYbyTerrainHeightAt(calcVec2);
                        if (Math.abs(pre - calcVec2.y) > maxGroundContactDistance) {
                            return;
                        }
                        calcVec2.y += 0.1;
                    }

                    ModuleEffectCreator.createActiveEffect(fx[i].particle_effects[j].id, calcVec2, calcVec3)
                }
            }
        };


        ModuleEffectCreator.addGrundPrintEmitEffect = function(model, emit_effect, transform, stateValue, glueToGround) {

            var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', emit_effect);


            calcVec.setFromMatrixPosition( model.matrixWorld );
            calcQuat.setFromRotationMatrix(model.matrixWorld);

            if (!calcVec.x) return;

            for (var i = 0; i < fx.length; i++) {

                if (!fx[i].particle_effects) {
                    console.log("Bad FX: ", fx)
                    return;
                }

                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.setupModuleTransform(calcVec, transform, calcQuat, stateValue, calcVec2, calcVec3);

                    if (glueToGround) {
                        pre = calcVec2.y;
                        ThreeAPI.setYbyTerrainHeightAt(calcVec2, calcVec);
                        if (Math.abs(pre - calcVec2.y) > maxGroundContactDistance) {
                            return;
                        }
                        calcVec2.y += 0.01+Math.random()*0.1;
                        threeObj.lookAt(calcVec);
                        //    calcQuat.setFromAxisAngle(calcVec, 1);
                    }

                    //    calcVec3.set(0, 0, 0);

                    ModuleEffectCreator.createPassiveEffect(fx[i].particle_effects[j].id, calcVec2, zeroVec, zeroVec, threeObj.quaternion, groundprints);
                }
            }

            while (groundprints.length > maxActiveGroundPrints) {
                if (Math.random() < 0.2) {
                    EffectsAPI.returnPassiveEffect(groundprints.shift());
                } else {
                    EffectsAPI.returnPassiveEffect(groundprints.splice(Math.floor(groundprints.length*0.5*Math.random()), 1)[0]);
                }
            }
        };


        ModuleEffectCreator.createModuleStaticEffect = function(fxArray, effectId, transform, scale) {

            sizeFromTransform(transform, calcVec2);

            if (scale) {
                calcVec2.multiplyScalar(scale);
            }

            var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', effectId);

            calcVec3.set(0, 0, 0);

            for (var i = 0; i < fx.length; i++) {

                if (!fx[i].particle_effects) {
                    console.log("Bad FX: ", fx)
                    return;
                }

                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.createPassiveEffect(fx[i].particle_effects[j].id, calcVec, calcVec3, calcVec2, null, fxArray);
                }
            }

            return fxArray;
        };


        ModuleEffectCreator.addGeometryEffect = function(model, effectId, transform, stateValue, glueToGround) {

            //    posFromTransform(pos, transform, calcVec);
            sizeFromTransform(transform, calcVec2);

            calcVec.setFromMatrixPosition( model.matrixWorld );

            var fx = PipelineAPI.readCachedConfigKey('MODULE_EFFECTS', effectId);

            for (var i = 0; i < fx.length; i++) {

                if (!fx[i].particle_effects) {
                    console.log("Bad FX: ", fx)
                    return;
                }

                for (var j = 0; j < fx[i].particle_effects.length; j++) {
                    ModuleEffectCreator.createPassiveEffect(fx[i].particle_effects[j].id, calcVec, zeroVec, calcVec2, glueToGround, geometryEffects);
                }
            }

            while (geometryEffects.length > maxGeometryEffetcs) {
                if (Math.random() < 0.2) {
                    EffectsAPI.returnPassiveEffect(geometryEffects.shift());
                } else {
                    EffectsAPI.returnPassiveEffect(geometryEffects.splice(Math.floor(geometryEffects.length*0.5*Math.random()), 1)[0]);
                }
            }

        };

        ModuleEffectCreator.animate_texture = function(visualModule, target) {
            var config = target.config;
            var value = target.state.getValue();
            var cumulative = config.cumulative || 0;
            var factor = config.factor || 1;
            var offsetx = config.offsetxy[0];
            var offsety = config.offsetxy[1];
            var x = value * offsetx * factor;
            var y = value * offsety * factor;

            ThreeAPI.animateModelTexture(visualModule.model, x, y,cumulative);
        };

        ModuleEffectCreator.module_emit_effect = function(visualModule, target) {
            if (Math.random() < target.state.getValue()) {
                ModuleEffectCreator.createModuleApplyEmitEffect(
                    visualModule.model || visualModule.rootObj,
                    target.config.module_effect,
                    visualModule.module.transform,
                    target.state.getValue(),
                    target.config.glue_to_ground
                )
            }
        };



        ModuleEffectCreator.module_ground_print_effect = function(visualModule, target) {
            if (Math.random() < target.state.getValue()) {
                ModuleEffectCreator.addGrundPrintEmitEffect(
                    visualModule.model || visualModule.rootObj,
                    target.config.module_effect,
                    visualModule.module.transform,
                    target.state.getValue(),
                    target.config.glue_to_ground
                )
            }
        };

        var callFireWeapon = function(dynamic, module, weaponOptions) {

            var fxCallbacks = module.visualModule.getEffectCallbacks();


            var duration = dynamic.travelTime.state;

            calcVec.set(dynamic.fromX.state, dynamic.fromY.state, dynamic.fromZ.state);
            calcVec2.set(dynamic.toX.state, dynamic.toY.state, dynamic.toZ.state);

            calcVec2.subVectors(calcVec2, calcVec);

            calcVec2.normalize();

            calcObj.lookAt(calcVec2);

            calcVec2.multiplyScalar(weaponOptions.velocity);

            var fxId = weaponOptions.particle_effect_id;

            fxCallbacks.createPassiveTemporalEffect(
                fxId,
                calcVec,
                calcVec2,
                0,
                calcObj.quaternion,
                duration
            );

        //    console.log("Call Fire Weapon", [dynamic, weaponOptions]);

        };


        ModuleEffectCreator.module_weapon_emit_bullet_effect = function(visualModule, target, tpf) {

            var module = visualModule.module;

            var weapons = module.weapons;

            var state = target.state;

            if (state.targetValue === 1) {

            //    console.log("Fire")

                for (var i = 0; i < weapons.length; i++) {
                    weapons[i].applyWeaponTrigger(state.targetValue, module, callFireWeapon);
                }

            //    state.targetValue = 0;

            }

        };


        ModuleEffectCreator.module_static_state_effect = function(visualModule, target, tpf) {

            if (target.effectArray.length) {
                ModuleEffectCreator.updateEffect(
                    target.effectArray,
                    visualModule.model || visualModule.rootObj,
                    target.state.getValue(),
                    tpf
                )
            } else {
                if (target.state.getValue() !== 0) {

                    target.effectArray =  ModuleEffectCreator.createModuleStaticEffect(
                        target.effectArray,
                        target.config.module_effect,
                        visualModule.module.transform,
                        target.config.scale
                    )

                }
            }

            if (target.effectArray) {
                if (target.state.getValue() === 0 || target.remove) {
                    ModuleEffectCreator.removeModuleStaticEffect(target.effectArray)
                }
            }

        };


        ModuleEffectCreator.createPassiveEffect = function(fxId, pos, vel, size, quat, store) {

            var fx = EffectsAPI.requestPassiveEffect(fxId, pos, vel, size, quat);

            if (!fx) {
                console.log("effect pool dry:", fxId)
            } else {
                store.push(fx);
            }
        };

        ModuleEffectCreator.createPassiveTemporalEffect = function(fxId, pos, vel, size, quat, duration) {
            EffectsAPI.requestTemporaryPassiveEffect(fxId, pos, vel, size, quat, duration);
        };


        ModuleEffectCreator.removeModuleStaticEffect = function(fxArray) {

            while (fxArray.length) {
                EffectsAPI.returnPassiveEffect(fxArray.pop())
            }

        };

        ModuleEffectCreator.remove_module_static_effect = function(fxArray) {
            this.removeModuleStaticEffect(fxArray);
        };

        ModuleEffectCreator.updateEffect = function(fxArray, model, state, tpf) {

            model.updateMatrixWorld(true);
            calcVec.setFromMatrixPosition( model.matrixWorld );

            for (var i = 0; i < fxArray.length; i++) {
                EffectsAPI.updateEffectPosition(fxArray[i], calcVec, state, 0);
            }
        };


        return ModuleEffectCreator;

    });