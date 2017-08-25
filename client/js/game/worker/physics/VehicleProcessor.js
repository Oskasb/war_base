
"use strict";


define([

    ],
    function(

    ) {

        var VehicleProcessor = function() {
            this.controls = {};
        };

        VehicleProcessor.prototype.sampleControlState = function(target, piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };


        VehicleProcessor.prototype.applyControlState = function(target, controls) {

            var yaw_state = controls.yaw_state + controls.steer_reverse;
            var throttle_state = controls.forward_state + controls.reverse_state ;
            var brake_state = controls.brake_state;
            var forward = 1;


            for (var i = 0; i < target.wheelInfos.length; i++) {
                var info = target.wheelInfos[i];
                var yawFactor = info.transmissionYawMatrix * yaw_state;
                target.applyEngineForce(throttle_state * info.transmissionFactor + throttle_state * yawFactor , i);
                target.setBrake(brake_state * info.brakeFactor, i);
                target.setSteeringValue(yaw_state*forward * info.steerFactor, i);
            }
        };

        VehicleProcessor.prototype.applyFeedbackMap = function(target, piece, feedback) {
                var param =         feedback.param;
                var key =           feedback.key;
                var property =      feedback.property;
                var targetStateId = feedback.stateid;
                var factor =        feedback.factor;
                var state =         piece.getPieceStateByStateId(targetStateId);
                state.value =       target[param][key][property]*factor;
        };

        VehicleProcessor.prototype.sampleVehicle = function(target, piece, feedbackMap) {

            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(target, piece, feedbackMap[i]);
            }

        };

        VehicleProcessor.prototype.sampleState = function (body, piece, config) {

            var controlMap = config.control_map;
            var feedbackMap = config.feedback_map;

            var target = body[config.shape];

            this.sampleControlState(target, piece, controlMap);
            this.applyControlState(target, this.controls);

            if (feedbackMap) {
                this.sampleVehicle(body[config.shape], piece, feedbackMap);
            }

        };

        return VehicleProcessor
    });