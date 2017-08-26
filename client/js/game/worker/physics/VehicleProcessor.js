
"use strict";


define([

    ],
    function(

    ) {

        var drive_train = {
            "rpm_min":200,
            "rpm_max":4000,
            "gears":[100, 33, 10, 3, 1],
            "torque"     : 125000,
            "enginePower": 5000000,
            "brake"      : 8
        };

        var dyn = {
            gearIndex:  {state:0},
            clutch:     {state:0},
            rpm:        {state:0},
            brake:      {state:1}
        };

        var VehicleProcessor = function(conf) {
            this.controls = {};

            this.lastYawState = 0;
            this.lastThrottleState = 0;
            this.gearIndex = 0;
            this.lastbrakeState = 0;
            this.framelWheelRotation = 0;
        };



        VehicleProcessor.prototype.sampleControlState = function(target, piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };

        VehicleProcessor.prototype.determineRpm = function(dynamic, driveTrain) {

            var gears = driveTrain.gears;
            dynamic.rpm.state = MATH.clamp(Math.abs(gears[this.gearIndex] * this.framelWheelRotation * 60),
                driveTrain.rpm_min+1,
                driveTrain.rpm_max-1
            ) / driveTrain.rpm_max;

        };

        VehicleProcessor.prototype.determineGearIndex = function(dynamic, driveTrain) {
            var gears = driveTrain.gears;
            dynamic.clutch.state = 0;

            var rpm = dynamic.rpm.state * driveTrain.rpm_max

            if (rpm < driveTrain.rpm_min + Math.random() * driveTrain.rpm_min * 0.2) {
                if (this.gearIndex === 0) {
                    dynamic.clutch.state = 1;
                } else {
                    dynamic.clutch.state = 1;
                    this.gearIndex--;
                }

            } else if (rpm > driveTrain.rpm_max - Math.random() * driveTrain.rpm_min) {
                if (this.gearIndex === gears.length - 1) {

                } else {
                    dynamic.clutch.state = 1;
                    this.gearIndex++
                }
            }
            dynamic.gearIndex.state = this.gearIndex;

        };

        VehicleProcessor.prototype.determineBrakeState = function(dynamic, speedInputState, driveTrain) {
            dynamic.brake.state = MATH.clamp(speedInputState*this.framelWheelRotation*driveTrain.brake, 0, driveTrain.brake) / driveTrain.brake;
        };


        VehicleProcessor.prototype.applyControlState = function(target, controls) {

            var driveTrain = target.drive_train || drive_train;

            var dynamic = target.dynamic;

            var speedInputState = controls.forward_state + controls.reverse_state;

            this.determineBrakeState(dynamic, speedInputState, driveTrain);

            this.determineRpm(dynamic, driveTrain);

            this.determineGearIndex(dynamic, driveTrain);

            var yaw_state = controls.yaw_state + controls.steer_reverse;

            var throttle_state = speedInputState * driveTrain.enginePower * driveTrain.gears[dynamic.gearIndex.state];



            var brake_state = dynamic.brake.state;



            this.framelWheelRotation = 0;

            for (var i = 0; i < target.wheelInfos.length; i++) {
                var info = target.wheelInfos[i];
                var yawFactor = info.transmissionYawMatrix * yaw_state;
                target.applyEngineForce(throttle_state * info.transmissionFactor + throttle_state * yawFactor , i);
                target.setBrake(brake_state * info.brakeFactor * driveTrain.brake, i);
                target.setSteeringValue(yaw_state* info.steerFactor, i);
                this.framelWheelRotation += info.deltaRotation;
            }

            this.lastYawState = yaw_state;
            this.lastThrottleState = throttle_state;
            this.lastbrakeState = 0;

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