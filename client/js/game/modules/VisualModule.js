"use strict";


define([
        'ThreeAPI',
        'GameAPI'
    ],
    function(
        ThreeAPI,
        GameAPI
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

                this.module.transform.pos[0] = this.data.options.terrain_size / 2;
                this.module.transform.pos[1] = this.data.options.max_height   / 2;
                this.module.transform.pos[2] = this.data.options.terrain_size / 2;

                this.module.transform.size[0] = this.data.options.terrain_size;
                this.module.transform.size[1] = this.data.options.max_height  ;
                this.module.transform.size[2] = this.data.options.terrain_size;

                var onData = function(resData) {
                    this.model = ThreeAPI.loadGround(this.data.options, resData, ThreeAPI.createRootObject());
                    this.rootObj.add(this.model);
                }.bind(this);

                GameAPI.createTerrain(this.data.options, onData);
            }

        };

        VisualModule.prototype.transformObj = function(obj3d, transform) {
            ThreeAPI.transformModel(
                obj3d,
                transform.pos[0], transform.pos[1], transform.pos[2],
                transform.rot[0], transform.rot[1], transform.rot[2]
            )
        };

        VisualModule.prototype.addModuleDebugBox = function() {

            var trnsf = this.module.getTransform();
            this.debugModel = ThreeAPI.loadDebugBox(trnsf.size[0], trnsf.size[1], trnsf.size[2]);
            this.debugRoot  = ThreeAPI.loadDebugBox(0.1, 0.1, 0.1, 'blue');

            ThreeAPI.addChildToObject3D(this.debugModel, this.rootObj);

            ThreeAPI.addChildToObject3D(this.debugRoot, this.rootObj);
            this.transformObj(this.debugModel, trnsf);
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