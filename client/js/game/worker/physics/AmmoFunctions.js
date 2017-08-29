
"use strict";

define([
        'worker/physics/AmmoVehicle'
    ],
    function(
        AmmoVehicle
    ) {

        var threeVec;
        var threeEuler;
        var threeEuler2;
        var threeObj;
        var threeObj2;

        var MATHVec3;

        var AmmoFunctions = function() {
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

        var DISABLE_DEACTIVATION = 4;
        var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);

        var materialDynamic, materialStatic, materialInteractive;

        var currentTime;

        var groundMaterial;
        var propMaterial;
        var chassisMaterial;
        var propGroundContactMaterial;
        var groundPropContactMaterial;
        var chassisGroundContactMaterial;

        var threeQuat;

        // Physics variables
        var collisionConfiguration;
        var dispatcher;
        var broadphase;
        var solver;
        var physicsWorld;


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


        AmmoFunctions.prototype.createPhysicalWorld = function() {

            collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
            physicsWorld.setGravity( new Ammo.btVector3( 0, -9.82, 0 ) );

            return physicsWorld;
        };


        var remaining = 0;
        var MODEL = {};

        MODEL.PhysicsStepTime = 0.01;
        MODEL.PhysicsMaxSubSteps = 10;
        MODEL.SpatialTolerance = 1;
        MODEL.AngularVelocityTolerance = 1;
        MODEL.TemporalTolerance = 1;

        AmmoFunctions.prototype.updatePhysicalWorld = function(world, currentTime) {


            if(lastTime !== undefined){
                var dt = (currentTime - lastTime);

                remaining = dt + remaining;

            //    while (remaining >= 0) {

                //    world.step(MODEL.PhysicsStepTime, dt, MODEL.PhysicsMaxSubSteps);

                    physicsWorld.stepSimulation(dt , MODEL.PhysicsMaxSubSteps, MODEL.PhysicsStepTime);
                    //   doStep(world, fixedTimeStep, dt, maxSubSteps) ;

             //       remaining -= MODEL.PhysicsStepTime*MODEL.PhysicsMaxSubSteps;
             //   }

            }
            //   console.log("Sphere xyz position: "+ sphereBody.position.x +' _ '+ sphereBody.position.y+' _ '+ sphereBody.position.z);
            lastTime = currentTime;

        };


        function createTerrainShape(data, sideSize, terrainMaxHeight, terrainMinHeight) {

            var terrainWidthExtents = sideSize;
            var terrainDepthExtents = sideSize;
            var terrainWidth = data.length;
            var terrainDepth = terrainWidth;
            var terrainHalfWidth = terrainWidth / 2;
            var terrainHalfDepth = terrainDepth / 2;

            var heightScale = 1;
            // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
            var upAxis = 1;
            // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
            var hdt = "PHY_FLOAT";
            // Set this to your needs (inverts the triangles)
            var flipQuadEdges = false;
            // Creates height data buffer in Ammo heap
            var ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);
            // Copy the javascript height data array to the Ammo one.
            var p = 0;
            var p2 = 0;
            for (var j = 0; j < terrainWidth; j++) {
                for (var i = 0; i < terrainDepth; i++) {
                    // write 32-bit float data to memory
                    Ammo.HEAPF32[ammoHeightData + p2 >> 2] = data[i][j];
                    p++;
                    // 4 bytes/float
                    p2 += 4;
                }
            }
            // Creates the heightfield physics shape
            var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
                terrainWidth,
                terrainDepth,
                ammoHeightData,
                heightScale,
                terrainMinHeight,
                terrainMaxHeight,
                upAxis,
                hdt,
                flipQuadEdges
            );
            // Set horizontal scale
            var scaleX = terrainWidthExtents / ( terrainWidth - 1 );
            var scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
            heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, 1, scaleZ));
            heightFieldShape.setMargin(0.01);
            return heightFieldShape;
        }

        AmmoFunctions.prototype.createPhysicalTerrain = function(world, data, totalSize, posx, posz, minHeight, maxHeight) {

            var terrainMaxHeight = maxHeight;
            var terrainMinHeight = minHeight;

            console.log("Ground Matrix: ", data.length)

            var groundShape = createTerrainShape( data, totalSize, terrainMaxHeight, terrainMinHeight );
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            // Shifts the terrain, since bullet re-centers it on its bounding box.
            groundTransform.setOrigin( new Ammo.btVector3(posx, minHeight + (maxHeight-minHeight) * 0.5 ,posz) );
            var groundMass = 0;
            var groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
            var groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
            var groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
            world.addRigidBody( groundBody );

            return groundBody;
        };

        AmmoFunctions.prototype.addPhysicalActor = function(world, actor) {
            var conf = actor.physicalPiece.config;
            var shapeKey = conf.shape;

            var position = actor.piece.rootObj3D.position;
            var quaternion = actor.piece.rootObj3D.quaternion;

            var rigidBody;

            if (shapeKey === "terrain") {
                return;
            }

            if (shapeKey === "primitive") {
                rigidBody = this.createPrimitiveBody(world, conf.rigid_body, position, quaternion);
            }

            if (shapeKey === "vehicle") {
                var ammoVehicle = new AmmoVehicle(world, conf.rigid_body, position, quaternion);

                actor.piece.processor = ammoVehicle.processor;
                rigidBody = ammoVehicle.body;
                actor.piece.vehicle = ammoVehicle.vehicle;
            }

            actor.setPhysicsBody(rigidBody);
            return actor;

        };


        function createBody(geometry, pos, quat, mass, friction) {

            if(!mass) mass = 0;
            if(!friction) friction = 1;

            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(transform);

            var localInertia = new Ammo.btVector3(0, 0, 0);
            geometry.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
            var body = new Ammo.btRigidBody(rbInfo);

            body.setFriction(friction);
            //body.setRestitution(.9);
            //body.setDamping(0.2, 0.2);
            return body;

        }

        function ammoBoxShape(w, l, h) {
            return new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));
        }

        function ammoCylinderShape(w, l, h) {
            return new Ammo.btCylinderShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));
        }

        AmmoFunctions.prototype.createPrimitiveBody = function(world, bodyParams, pos, quat) {
            var args = bodyParams.args;

            threeVec.copy(pos);

            var shape;
            var heightOffset;

            var mass = bodyParams.mass;

            var friction = bodyParams.friction || 0.5;


            if (!mass) {
                heightOffset = 0;
            }

            if (bodyParams.shape === 'Cylinder') {
                heightOffset = args[2] / 2;

                shape = ammoCylinderShape(args[0], args[1], args[2]);

            }

            if (bodyParams.shape === 'Box') {
                heightOffset = args[1];
                shape = ammoBoxShape(args[0], args[1], args[2]);
            //    shape = new CANNON[bodyParams.shape](new CANNON.Vec3(args[2],args[0],args[1]));

            }

            threeVec.y += heightOffset;

            var body = createBody(shape, threeVec, quat, mass, friction);

            world.addRigidBody(body);
        //    body.setActivationState(DISABLE_DEACTIVATION);
            return body;

        };



        return AmmoFunctions;

    });



