
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {




        var threeObj = new THREE.Object3D();

        var PhysicalPiece = function(hostId, dataKey, ready) {

            this.id = hostId+'_physical';
            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PHYSICS_DATA', 'PHYSICAL', applyData);
        };

        PhysicalPiece.prototype.applyData = function (config, ready) {
            this.config = config;
            this.stateMap = config.state_map;
            ready();
        };

        var orders = [
            'XYZ',
            'YXZ',
            'ZXY',
            'ZYX',
            'YZX',
            'XZY'
        ];
//
        var sampleBody = function(body) {


            if (!body) {
                console.log("No body on", piece.id);
                return;

            } else {
            //        console.log(body.position.x, body.position.z, body.position.y)
            }


            threeObj.quaternion.x = body.quaternion.x;
            threeObj.quaternion.y = body.quaternion.y;
            threeObj.quaternion.x = body.quaternion.x;
            threeObj.quaternion.w = body.quaternion.w;

            threeObj.setRotationFromQuaternion(body.quaternion);
            //   threeObj.rotateY(Math.PI*0.5);
/*
            threeObj.rotation.setFromQuaternion(
                body.quaternion,
                orders[0]
            );

            var angY = -MATH.addAngles(threeObj.rotation.z, -Math.PI*0.5);
            var angX = -threeObj.rotation.x * Math.cos(angY) +threeObj.rotation.y * Math.sin(angY); // -MATH.addAngles(threeObj.rotation.x*Math.sin(threeObj.rotation.z), 0);// ) * Math.cos(threeObj.rotation.y) - (Math.sin(threeObj.rotation.z) * Math.cos(threeObj.rotation.y*Math.PI));
            var angZ = -threeObj.rotation.y; // + threeObj.rotation.x * Math.sin(angY) ;
*/
            threeObj.position.set(body.position.x,                 body.position.z, body.position.y);

        //    threeObj.rotation.x = angX;
        //    threeObj.rotation.y = angY;
        //    threeObj.rotation.x = angZ;
        };

        PhysicalPiece.prototype.sampleState = function (body, piece) {

            sampleBody(body);

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = piece.getPieceStateByStateId(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = threeObj[param][axis];
                state.value = value;
            }
        };

        return PhysicalPiece
    });