
"use strict";

define(['game/worker/physics/AmmoVehicleProcessor'
    ],
    function(
        AmmoVehicleProcessor
    ) {

        var wheelsMat = [
            [-1,  0.9,    1],[1, 0.9,     1],
            [-1, -0.9,    1],[1,-0.9,     1]
        ];

        var steerMat = [
            1, 1,
            0, 0
        ];

        var brakeMat = [
            0.2,0.2,
            1  ,1
        ];

        var transmissionMat = [
            1,1,
            0,0
        ];

        var transmissionYawMat = [
            0,0,
            0,0
        ];

        var AmmoVehicle = function(physicsWorld, bodyParams, pos, quat) {

            var width       = bodyParams.width      || 1.5;
            var length      = bodyParams.length     || 3.1;
            var height      = bodyParams.height     || 1.1;
            var clearance   = bodyParams.clearance  || 0.2;
            var mass        = bodyParams.mass       || 0;

            var wOpts = bodyParams.wheelOptions || {};

            var DISABLE_DEACTIVATION = 4;

            var chassisWidth = width;
            var chassisHeight = height;
            var chassisLength = length;
            var massVehicle = mass;

            var wheelMatrix = bodyParams.wheelMatrix || wheelsMat;

            var steerMatrix = bodyParams.steerMatrix || steerMat;
            var brakeMatrix = bodyParams.brakeMatrix || brakeMat;
            var transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
            var transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;


            var friction = 1000;
            var suspensionStiffness = wOpts.suspensionStiffness || 17;
            var suspensionDamping = 2.3;
            var suspensionCompression = 4.4;
            var suspensionRestLength = wOpts.suspensionLength || 0.6;
            var rollInfluence = wOpts.rollInfluence  || 0.1;
            var radius = wOpts.radius || 0.5;

            // Chassis
            var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 0, 0);
            geometry.calculateLocalInertia(massVehicle, localInertia);
            var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
            body.setActivationState(DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody(body);
            //    var chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

            // Raycast Vehicle
            var tuning = new Ammo.btVehicleTuning();
            var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
            var vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);

            vehicle.setCoordinateSystem(0, 1, 2);
            physicsWorld.addAction(vehicle);

            // Wheels
            var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
            var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

            function addWheel(i) {

                pos = new Ammo.btVector3(width * wheelMatrix[i][0], -clearance*wheelMatrix[i][2], length * wheelMatrix[i][1]);

                var isFront = false;
                if (i === 0 || i === 1) {
                    isFront = true;
                }
                var wheelInfo = vehicle.addWheel(
                    pos,
                    wheelDirectionCS0,
                    wheelAxleCS,
                    suspensionRestLength,
                    radius,
                    tuning,
                    isFront);

                wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
                wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
                wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
                wheelInfo.set_m_frictionSlip(friction);
                wheelInfo.set_m_rollInfluence(rollInfluence);

            }

            for (var i = 0; i < wheelMatrix.length; i++) {
                addWheel(i);
            }

            var dynamic = {
                gearIndex:  {state:0},
                clutch:     {state:0},
                rpm:        {state:0},
                brake:      {state:0},
                brakeCommand:{state:0}
            };

            this.body = body;
            this.vehicle = vehicle;

            this.processor = new AmmoVehicleProcessor(vehicle, bodyParams, dynamic);
        };


    return AmmoVehicle;

});



