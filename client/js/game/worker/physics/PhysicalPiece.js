
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {



        var threeObj = new THREE.Object3D();
        var threeObj2 = new THREE.Object3D();

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
        PhysicalPiece.prototype.sampleBody = function(body) {
            
            threeObj.quaternion.x = body.quaternion.x;
            threeObj.quaternion.y = body.quaternion.z;
            threeObj.quaternion.z = body.quaternion.y;
            threeObj.quaternion.w = body.quaternion.w;

            threeObj.position.set(body.position.x, body.position.z, body.position.y);

        };

        PhysicalPiece.prototype.sampleState = function (body, piece) {

            this.sampleBody(body);

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