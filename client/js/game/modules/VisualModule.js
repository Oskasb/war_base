"use strict";


define([
        'ThreeAPI',
        'game/modules/ModuleEffectCreator'
    ],
    function(
        ThreeAPI,
        ModuleEffectCreator
    ) {

        var VisualModule = function(module) {
            this.module = module;
            this.rootObj = ThreeAPI.createRootObject();
            this.staticEffect = null;
            this.dynamicEffect = null;
            this.model;
        };


        VisualModule.prototype.setModuleData = function(data) {
            this.data = data;
            if (this.data.model) {
                if (this.model) {
                    ThreeAPI.removeModel(this.model);
                }
                this.model = ThreeAPI.loadMeshModel(this.data.model, ThreeAPI.createRootObject());
                this.rootObj.add(this.model);
            }

            if (this.data.terrain) {
                this.model = ThreeAPI.loadGround(this.data.options, null, ThreeAPI.createRootObject());
                this.rootObj.add(this.model);
            }

        };


        VisualModule.prototype.transformObj = function(obj3d, data) {
            ThreeAPI.transformModel(
                obj3d,
                data.transform.pos[0], data.transform.pos[1], data.transform.pos[2],
                data.transform.rot[0], data.transform.rot[1], data.transform.rot[2]
            )
        };


        VisualModule.prototype.attachEffects = function() {

            if (this.applies.spawn_effect) {
            //    console.log("Spawn Vel:", this.piece.spatial.vel.data)
                ModuleEffectCreator.createPositionEffect(this.piece.spatial.pos, this.applies.spawn_effect, this.transform, this.piece.spatial.vel);
            }

            if (this.applies.static_effect) {
                if (!this.staticEffect) {
                    this.staticEffect = ModuleEffectCreator.createModuleStaticEffect(this.applies.static_effect, this.piece.spatial.pos, this.transform, this.piece.spatial.vel);
                }
            }

        };

        VisualModule.prototype.attachDynamicEffects = function() {


            if (this.applies.dynamic_effect) {
                if (!this.dynamicEffect) {
                    this.dynamicEffect = ModuleEffectCreator.createModuleStaticEffect(this.applies.dynamic_effect, this.piece.spatial.pos, this.transform);
                }
            }
        };

        VisualModule.prototype.detatchEffects = function() {

            if (this.staticEffect) {
                ModuleEffectCreator.removeModuleStaticEffect(this.staticEffect);
                this.staticEffect = null;
            }

            if (this.dynamicEffect) {
                ModuleEffectCreator.removeModuleStaticEffect(this.dynamicEffect);
                this.dynamicEffect = null;
            }
        };


        VisualModule.prototype.addModuleDebugBox = function() {

            var trnsf = this.module.getTransform();
            this.debugModel = ThreeAPI.loadDebugBox(trnsf.size[0], trnsf.size[1], trnsf.size[2]);
            this.debugRoot  = ThreeAPI.loadDebugBox(0.1, 0.1, 0.1, 'blue');

            ThreeAPI.addChildToObject3D(this.debugModel, this.rootObj);

            ThreeAPI.addChildToObject3D(this.debugRoot, this.rootObj);
            this.transformObj(this.debugModel, this.data);
        };

        VisualModule.prototype.removeModuleDebugBox = function() {
            if (this.debugModel) {
                this.rootObj.remove(this.debugModel);
            }
            if (this.debugRoot) {
                this.rootObj.remove(this.debugRoot);
            }
        };

        VisualModule.prototype.getParentObject3d = function() {
            return this.parentObject3d;
        };

        VisualModule.prototype.attachToParent = function(parentObject3d) {

            ThreeAPI.addChildToObject3D(this.rootObj, parentObject3d);
            this.parentObject3d = parentObject3d;
        };

        VisualModule.prototype.removeVisualModule = function() {

            this.detatchEffects();
            if (this.model) {
                //    ThreeAPI.removeModel(this.model);
                this.rootObj.remove(this.model)
            }
            ThreeAPI.disposeModel(this.rootObj);
        };


        VisualModule.prototype.updateVisualModule = function(stateValue) {

        };

        return VisualModule;

    });