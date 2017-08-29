
"use strict";


define([

    ],
    function(

    ) {

        var drive_train = {
            "rpm_min":200,
            "rpm_max":2500,
            "gears":[120, 40, 20, 12, 3, 2, 1],
            "enginePower": 1000,
            "brake"      : 800
        };

        var dyn = {
            gearIndex:  {state:0},
            clutch:     {state:0},
            rpm:        {state:0},
            brake:      {state:0},
            brakeCommand:{state:0}
        };

        var ammoQuat;
        var quat = new THREE.Quaternion();
        var vec3 = new THREE.Vector3();

        var propertyMap = {
            deltaRotation:{key:'transform', funcName:'getRotation', delta:true },
            rotation:     {key:'transform', funcName:'getRotation', delta:false}
        };


        var InfoParser = function(info, transform) {
            this.info = info;
            this.transform = transform;
            this.value = 0;
        };

        InfoParser.prototype.getValue = function(property) {

            var prop = propertyMap[property];

            this[prop.key][prop.funcName](ammoQuat);

            quat.x = ammoQuat.x();
            quat.y = ammoQuat.y();
            quat.z = ammoQuat.z();
            quat.w = ammoQuat.w();

            vec3.set(0, 0, 1);
            vec3.applyQuaternion(quat);

            var value = vec3.x;

            if (prop.delta) {
                this.value = value - this.value;
            } else {
                this.value = value;
            }

            return this.value;
        };


        var AmmoVehicleProcessor = function(vehicle, bodyParams, dynamic) {

            ammoQuat = new Ammo.btQuaternion(0, 0, 0, 1);



            var numWheels = vehicle.getNumWheels();

            this.wheelInfos = [];

            for (var i = 0; i < numWheels; i++) {
                var info = vehicle.getWheelInfo(i);
                var transform =vehicle.getWheelTransformWS(i);
                this.wheelInfos.push(new InfoParser(info, transform));
            }


            this.driveTrain = bodyParams.drive_train || drive_train;
            this.wheelMatrix = bodyParams.wheelMatrix || wheelsMat;
            this.steerMatrix = bodyParams.steerMatrix || steerMat;
            this.brakeMatrix = bodyParams.brakeMatrix || brakeMat;
            this.transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
            this.transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;

            this.dynamic = dynamic || dyn;



            this.controls = {};

            this.lastInputState = 0;
            this.gearIndex = 0;

            this.lastbrakeState = 0;
            this.framelWheelRotation = 0;
            this.brakeCommand = 0;
        };






        AmmoVehicleProcessor.prototype.sampleControlState = function(piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };

        AmmoVehicleProcessor.prototype.determineRpm = function(dynamic, driveTrain, accelerateIntent) {

            var gears = driveTrain.gears;

            var transmissionScale = 0.001;

            var gearFactor = Math.abs(gears[this.gearIndex] * this.framelWheelRotation) * transmissionScale;


            var minRpm = driveTrain.rpm_min+1;
            var rpmSpan = driveTrain.rpm_max - minRpm;


            var revUpFrameLimit = 0.001 * rpmSpan;

            var maxRpm = minRpm + rpmSpan * 0.55 + rpmSpan* 0.45 * accelerateIntent;

            var targetRpm = gearFactor * maxRpm ;

            var clutch = 1-dynamic.clutch.state;

            if (accelerateIntent > 0) {
            //    targetRpm = Math.clamp(targetRpm, minRpm, dynamic.rpm.state * driveTrain.rpm_max + revUpFrameLimit);

                targetRpm = Math.clamp(targetRpm + clutch * revUpFrameLimit, minRpm, driveTrain.rpm_max) ;
            } else {
                targetRpm = Math.clamp((targetRpm - clutch * revUpFrameLimit*2), minRpm, maxRpm) ;
            }

            if (targetRpm > dynamic.rpm.state * driveTrain.rpm_max) {

            } else {

            }

            dynamic.rpm.state = targetRpm / driveTrain.rpm_max;

        };

        AmmoVehicleProcessor.prototype.determineGearIndex = function(dynamic, driveTrain, brake) {
            var gears = driveTrain.gears;
            dynamic.clutch.state = 0;

            var rpm = dynamic.rpm.state * driveTrain.rpm_max;


            var gearModulation = 1 // 0.8 - 0.2 * (driveTrain.rpm_max - driveTrain.rpm_min) * (gears.length - this.gearIndex) / gears.length * driveTrain.rpm_max;

            if (rpm * gearModulation < driveTrain.rpm_min + Math.random() * driveTrain.rpm_min * 0.1 + brake * driveTrain.rpm_max) {

                dynamic.clutch.state = 1;

                if (this.gearIndex === 0) {

                } else {
                    this.gearIndex--;
                }

            } else if (rpm * gearModulation > driveTrain.rpm_max - Math.random() * driveTrain.rpm_max*0.1) {
                if (this.gearIndex === gears.length - 1) {

                } else {
                    dynamic.clutch.state = 1;
                    this.gearIndex++
                }
            }
            dynamic.gearIndex.state = this.gearIndex;

        };

        AmmoVehicleProcessor.prototype.determineBrakeState = function(dynamic, speedInputState, driveTrain) {
        //    if ()

            var wheelBrake = speedInputState*this.framelWheelRotation;

            var brakeState = MATH.clamp(wheelBrake, 0, 1);

            if (wheelBrake > 0) {
                this.brakeCommand = 1;
            }

            dynamic.brake.state = brakeState;
            dynamic.brakeCommand.state = this.brakeCommand;
            this.lastbrakeState = MATH.clamp(brakeState*this.brakeCommand + this.brakeCommand * 0.5, 0, 1);
        };

        AmmoVehicleProcessor.prototype.determineForwardState = function(speedInputState) {
            if (speedInputState === 0) {
                return this.lastInputState;
            }

            var sameDir = speedInputState * this.lastInputState;
            var forward = speedInputState;

            if (sameDir > 0) {
                if (Math.abs(forward) > Math.abs(this.lastInputState)) {
                    this.brakeCommand = 0;
                }
            } else {
                this.brakeCommand = 1;
            }

            this.lastInputState = forward;

            return forward;
        };


        var getWheelInfo = function(vehicle) {
            return vehicle.getWheelInfo();
        };


        AmmoVehicleProcessor.prototype.applyControlState = function(target, controls) {

            var driveTrain = this.driveTrain;

            var dynamic = this.dynamic;

            var speedInputState = controls.forward_state + controls.reverse_state;

            var accelerateIntent = this.determineForwardState(speedInputState);


            this.determineBrakeState(dynamic, accelerateIntent, driveTrain);

            this.determineRpm(dynamic, driveTrain, accelerateIntent);

            this.determineGearIndex(dynamic, driveTrain, dynamic.brake.state);

            var yaw_state = controls.yaw_state + controls.steer_reverse;

            var powerState = accelerateIntent * driveTrain.enginePower * driveTrain.gears[dynamic.gearIndex.state] * dynamic.rpm.state;

            this.framelWheelRotation = 0;

            var numWheels = target.getNumWheels();


            for (var i = 0; i < numWheels; i++) {
                var info = target.getWheelInfo(i);
                var yawFactor = this.transmissionYawMatrix[i] * yaw_state;
                target.applyEngineForce(powerState * this.transmissionMatrix[i] + powerState * yawFactor , i);
                target.setBrake(this.lastbrakeState * this.brakeMatrix[i] * driveTrain.brake, i);
                target.setSteeringValue(yaw_state* this.steerMatrix[i], i);
                this.framelWheelRotation += this.wheelInfos[i].getValue('deltaRotation');
            }

            this.lastbrakeState = 0;

        };

        AmmoVehicleProcessor.prototype.interpretVehicleState = function(param, key, property) {

            if (param === "wheelInfos") {
                return this.wheelInfos[key].getValue(property);
            }

            return this[param][key][property];
        };


        AmmoVehicleProcessor.prototype.applyFeedbackMap = function(target, piece, feedback) {
                var param =         feedback.param;
                var key =           feedback.key;
                var property =      feedback.property;
                var targetStateId = feedback.stateid;
                var factor =        feedback.factor;
                var state =         piece.getPieceStateByStateId(targetStateId);
                state.value =       this.interpretVehicleState(param, key, property) * factor;
        };

        //  var speed = vehicle.getCurrentSpeedKmHour();

        AmmoVehicleProcessor.prototype.sampleVehicle = function(target, piece, feedbackMap) {

            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(target, piece, feedbackMap[i]);
            }

        };

        AmmoVehicleProcessor.prototype.sampleState = function (body, piece, config) {

            var controlMap = config.control_map;
            var feedbackMap = config.feedback_map;

            var target = piece[config.shape];

            this.sampleControlState(piece, controlMap);
            this.applyControlState(target, this.controls);

            if (feedbackMap) {
                this.sampleVehicle(target, piece, feedbackMap);
            }

        };

        return AmmoVehicleProcessor
    });