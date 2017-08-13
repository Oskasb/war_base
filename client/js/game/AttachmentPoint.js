
"use strict";


define([
        'ThreeAPI'
    ],
    function(
        ThreeAPI
    ) {

        var AttachmentPoint = function(apData) {
            this.id = apData.id;
            this.object3D = ThreeAPI.createRootObject();
            this.updateData(apData)
        };

        AttachmentPoint.prototype.updateData = function (apData) {
            ThreeAPI.transformModel(
                this.object3D,
                apData.transform.pos[0], apData.transform.pos[1], apData.transform.pos[2],
                apData.transform.rot[0], apData.transform.rot[1], apData.transform.rot[2]
            )
        };

        AttachmentPoint.prototype.getPosition = function () {
            return this.object3D.position;
        };

        AttachmentPoint.prototype.visualiseAttachmentPoint = function (bool) {
            if (bool) {
                this.debugModel = ThreeAPI.loadDebugBox(0.2, 0.2, 0.2, 'yellow');
                this.debugModel.material.color.r = 1;
                this.debugModel.material.color.g = 1;
                this.debugModel.material.color.b = 0.5;

                ThreeAPI.addChildToObject3D(this.debugModel, this.object3D);
            } else if (this.debugModel) {
                ThreeAPI.disposeModel(this.debugModel);
                this.debugModel = null;
            }
        };


        AttachmentPoint.prototype.getRotation = function () {
            return this.object3D.rotation;
        };

        AttachmentPoint.prototype.attachChildToPoint = function (childObj3d) {
            ThreeAPI.addChildToObject3D(childObj3d, this.object3D)
        };

        AttachmentPoint.prototype.attachToParent = function (parentObj3d) {
            ThreeAPI.addChildToObject3D(this.object3D, parentObj3d)
        };

        AttachmentPoint.prototype.detatchAttachmentPoint = function () {
            this.visualiseAttachmentPoint(false);
            ThreeAPI.disposeModel(this.object3D)
        };
        
        return AttachmentPoint
    });