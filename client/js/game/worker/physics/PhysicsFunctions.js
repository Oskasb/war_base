
"use strict";

define([        'game/worker/physics/VehicleProcessor'
    ],
    function(
        VehicleProcessor
    ) {

        var threeVec;
        var threeEuler;
        var threeEuler2;
        var threeObj;
        var threeObj2;

        var MATHVec3;

        var PhysicsFunctions = function() {
            MATHVec3 = new MATH.Vec3();
            threeVec = new THREE.Vector3();
            threeObj = new THREE.Object3D();
            threeObj2 = new THREE.Object3D();
            threeQuat = new THREE.Quaternion();
            threeEuler = new THREE.Euler(0, 0, 0, 'XZY');
            threeEuler2 = new THREE.Euler();
            this.calcVec = new CANNON.Vec3();
            this.calcVec2 = new CANNON.Vec3();
        };

        var lastTime;

        var currentTime;

        var groundMaterial;
        var propMaterial;
        var chassisMaterial;
        var propGroundContactMaterial;
        var groundPropContactMaterial;
        var chassisGroundContactMaterial;

        var threeQuat;


        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 5;
// Global settings
        var settings = {
            stepFrequency: 60,
            quatNormalizeSkip: 2,
            quatNormalizeFast: true,
            gx: 0,
            gy: 0,
            gz: 0,
            iterations: 3,
            tolerance: 0.0001,
            k: 1e6,
            d: 3,
            scene: 0,
            paused: false,
            rendermode: "solid",
            constraints: false,
            contacts: false,  // Contact points
            cm2contact: false, // center of mass to contact points
            normals: false, // contact normals
            axes: false, // "local" frame axes
            particleSize: 0.1,
            shadows: false,
            aabbs: false,
            profiling: false,
            maxSubSteps:3
        };


        PhysicsFunctions.prototype.createPhysicalWorld = function() {

            var world = new CANNON.World();

            world.broadphase = new CANNON.SAPBroadphase(world);

            //  world.broadphase = new CANNON.NaiveBroadphase();

            world.defaultContactMaterial.friction = 0.0;
            world.defaultContactMaterial.contactEquationStiffness = 100000000;
            world.defaultContactMaterial.restitution = 0.0;

            groundMaterial = new CANNON.Material("groundMaterial");
            chassisMaterial = new CANNON.Material("chassisMaterial");
            propMaterial = new CANNON.Material("propMaterial");

            chassisGroundContactMaterial = new CANNON.ContactMaterial(chassisMaterial, groundMaterial, {
                friction: 0.0,
                restitution: 0.0,
                contactEquationStiffness: 5000000
            });

            propGroundContactMaterial = new CANNON.ContactMaterial(propMaterial, groundMaterial, {
                friction: 0.8,
                restitution: 0.85,
                contactEquationStiffness: 10000000000
            });

            groundPropContactMaterial = new CANNON.ContactMaterial(groundMaterial, propMaterial,  {
                friction: 0.05,
                restitution: 0.01,
                contactEquationStiffness: 1000000000
            });

            // We must add the contact materials to the world
            world.addContactMaterial(propGroundContactMaterial);
            world.addContactMaterial(groundPropContactMaterial);
            world.addContactMaterial(chassisGroundContactMaterial);

            world.gravity.set(0,  0, -9.82); // m/s²

            fixedTimeStep = 1.0 / 120.0; // seconds
            maxSubSteps = 3;


            function makeSureNotZero(vec){
                if(vec.x===0.0){
                    vec.x = 1e-6;
                }3
                if(vec.y===0.0){
                    vec.y = 1e-6;
                }
                if(vec.z===0.0){
                    vec.z = 1e-6;
                }
            }

            return world;
        };

        var orders = [
            'XYZ',
            'YXZ',
            'ZXY',
            'ZYX',
            'YZX',
            'XZY'
        ];

        PhysicsFunctions.prototype.applyBodyToSpatial = function(piece) {


            var body = piece.physics.body;

            if (!body) {
                console.log("No body on", piece.id);
                return;

            } else {
                //    console.log(body.position.x, body.position.z, body.position.y)
            }


            threeObj.setRotationFromQuaternion(body.quaternion);
            //   threeObj.rotateY(Math.PI*0.5);

            threeObj.rotation.setFromQuaternion(
                body.quaternion,
                orders[0]
            );


            var angY = -MATH.addAngles(threeObj.rotation.z, -Math.PI*0.5);
            var angX = -threeObj.rotation.x * Math.cos(angY) +threeObj.rotation.y * Math.sin(angY); // -MATH.addAngles(threeObj.rotation.x*Math.sin(threeObj.rotation.z), 0);// ) * Math.cos(threeObj.rotation.y) - (Math.sin(threeObj.rotation.z) * Math.cos(threeObj.rotation.y*Math.PI));
            var angZ = -threeObj.rotation.y // + threeObj.rotation.x * Math.sin(angY) ;


            piece.spatial.setPosXYZ(body.position.x,                 body.position.z, body.position.y);

            piece.spatial.fromAngles(angX,angY, angZ);

            piece.spatial.setVelocity(body.velocity.x,              body.velocity.z, body.velocity.y);

            piece.spatial.setRotVelAngles(body.angularVelocity.x,   -body.angularVelocity.z, -body.angularVelocity.y);

        };

        var remaining = 0;

        var doStep = function(world, fixed, dt, maxSteps) {
            world.step(world, fixed, dt, maxSteps)
        };

        var MODEL = {};

        MODEL.PhysicsStepTime = 0.01;
        MODEL.PhysicsMaxSubSteps = 1;
        MODEL.SpatialTolerance = 1;
        MODEL.AngularVelocityTolerance = 1;
        MODEL.TemporalTolerance = 1;

        PhysicsFunctions.prototype.updatePhysicalWorld = function(world, currentTime) {


            if(lastTime !== undefined){
                var dt = (currentTime - lastTime);

                remaining = dt + remaining;

                while (remaining >= 0) {

                    world.step(MODEL.PhysicsStepTime, dt, MODEL.PhysicsMaxSubSteps);

                    //   doStep(world, fixedTimeStep, dt, maxSubSteps) ;

                    remaining -= MODEL.PhysicsStepTime*MODEL.PhysicsMaxSubSteps;
                }

            }
            //   console.log("Sphere xyz position: "+ sphereBody.position.x +' _ '+ sphereBody.position.y+' _ '+ sphereBody.position.z);
            lastTime = currentTime;

        };



        PhysicsFunctions.prototype.createPhysicalTerrain = function(world, data, totalSize, posx, posz, minHeight, maxHeight) {

            //   console.log("POS:",  posx, posz, totalSize, minHeight)
            var matrix = data;

            var hfShape = new CANNON.Heightfield(matrix, {
                elementSize: ((totalSize) / (data.length-1))
            });
            var hfBody = new CANNON.Body({
                mass: 0,
                material: groundPropContactMaterial
            });
            hfBody.addShape(hfShape);
            hfBody.position.set(posx, posz, minHeight);
            return hfBody;
        };

        PhysicsFunctions.prototype.addPhysicalActor = function(world, actor) {
            var conf = actor.physicalPiece.config;
            var shapeKey = conf.shape;

            var position = actor.piece.rootObj3D.position;

            var rigidBody;

            if (shapeKey === "terrain") {
                return;
            }

            if (shapeKey === "primitive") {
                rigidBody = this.createPrimitiveBody(world, conf.rigid_body, position);
            }

            if (shapeKey === "vehicle") {
                rigidBody = this.createVehicle(world, conf.rigid_body, position);
                actor.piece.processor = new VehicleProcessor(rigidBody.vehicle.drive_train, rigidBody.vehicle.dynamic);
            }

            actor.setPhysicsBody(rigidBody);

            return actor;

        };

        PhysicsFunctions.prototype.createPrimitiveBody = function(world, bodyParams, pos) {
            var args = bodyParams.args;

            var shape
            var halfHeight

            if (bodyParams.shape === 'Cylinder') {
                shape = new CANNON[bodyParams.shape](args[0],args[1],args[2],args[3]);
                halfHeight = args[2] / 2
            }

            if (bodyParams.shape === 'Box') {
                shape = new CANNON[bodyParams.shape](new CANNON.Vec3(args[2],args[0],args[1]));
                halfHeight = args[1]
            }

            var heightOffset = halfHeight;
            var material = propGroundContactMaterial;
            var mass = bodyParams.mass;

            var allowSleep = true;

            var sleepSpeedLimit = 0.5;
            var sleepTimeLimit = 5;


            if (!mass) {
                heightOffset = 0;
                material = groundPropContactMaterial;
                allowSleep = false;
            }

            var body = {
                mass: mass, // kg
                position: new CANNON.Vec3(pos.x, pos.z, pos.y+heightOffset), // m
                shape: shape,
                material:material,
                allowSleep:allowSleep,
                sleepSpeedLimit:sleepSpeedLimit,
                sleepTimeLimit:sleepTimeLimit
            };

            var ridigBody = new CANNON.Body(body);
            world.addBody(ridigBody);
            return ridigBody;


        };




        PhysicsFunctions.prototype.createVehicle = function(world, bodyParams, pos) {

            var vehicle;

            var width       = bodyParams.width      || 1.5;
            var length      = bodyParams.length     || 3.1;
            var height      = bodyParams.height     || 1.1;
            var clearance   = bodyParams.clearance  || 0.2;
            var mass        = bodyParams.mass       || 0;

            var chassisShape;
            chassisShape = new CANNON.Box(new CANNON.Vec3(length, width, height));
            var chassisBody = new CANNON.Body({
                mass: mass ,
                material: chassisGroundContactMaterial,
                linearDamping: 0.05
            });
            chassisBody.addShape(chassisShape);
            chassisBody.position.set(pos.x, pos.z, pos.y+height+clearance + 0.5);
            chassisBody.angularVelocity.set(0, 0, 0.01);

            // Create the vehicle
            vehicle = new CANNON.RaycastVehicle({
                chassisBody: chassisBody
            });

            chassisBody.vehicle = vehicle;

            vehicle.drive_train = bodyParams.drive_train || {};
            vehicle.dynamic = {
                gearIndex:  {state:0},
                clutch:     {state:0},
                rpm:        {state:0},
                brake:      {state:0},
                brakeCommand:{state:0}
            };

            vehicle.addToWorld(world);

            var wOpts = bodyParams.wheelOptions || {};

            var options = {
                radius: wOpts.radius || 0.5,
                directionLocal: new CANNON.Vec3(0, 0, -1),
                suspensionStiffness: wOpts.suspensionStiffness || 17,
                suspensionRestLength: wOpts.suspensionLength || 0.6,
                frictionSlip: wOpts.frictionSlip || 4.8,
                dampingRelaxation: wOpts.dampening / 2 || 1.81,
                dampingCompression: wOpts.dampening    || 2.5,
                maxSuspensionForce: wOpts.maxSuspensionForce || 148000,
                rollInfluence:  wOpts.rollInfluence    || 0.1,
                axleLocal: new CANNON.Vec3(0, -1, 0),
                chassisConnectionPointLocal: new CANNON.Vec3(width/2, length/1.7, height*0.05),
                maxSuspensionTravel: wOpts.suspensionLength || 0.6,
                customSlidingRotationalSpeed: 0,
                useCustomSlidingRotationalSpeed: false
            };

            length -= options.radius;

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

            var wheelMatrix = bodyParams.wheelMatrix || wheelsMat;

            var steerMatrix = bodyParams.steerMatrix || steerMat;
            var brakeMatrix = bodyParams.brakeMatrix || brakeMat;
            var transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
            var transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;

            for (var i = 0; i < wheelMatrix.length; i++) {
                options.chassisConnectionPointLocal.set(length * wheelMatrix[i][1], width * wheelMatrix[i][0], -clearance*wheelMatrix[i][2]);
                vehicle.addWheel(options);
                vehicle.wheelInfos[i].steerFactor           = steerMatrix[i]            || 0;
                vehicle.wheelInfos[i].brakeFactor           = brakeMatrix[i]            || 1;
                vehicle.wheelInfos[i].transmissionFactor    = transmissionMatrix[i]     || 1;
                vehicle.wheelInfos[i].transmissionYawMatrix = transmissionYawMatrix[i]  || 1;
                vehicle.setBrake(vehicle.wheelInfos[i].brakeFactor*vehicle.wheelInfos[i].brakeFactor, i);
            }

            return chassisBody;

        };

        return PhysicsFunctions;

    });



