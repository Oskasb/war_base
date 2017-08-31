
"use strict";

define([
        'worker/physics/AmmoVehicle',
        'three/ThreeModelLoader'
    ],
    function(
        AmmoVehicle,
        ThreeModelLoader
    ) {

        var threeVec;
        var threeEuler;
        var threeEuler2;
        var threeObj;
        var threeObj2;

        var MATHVec3;

        var Ammo;

        var AmmoFunctions = function(ammo) {
            Ammo = ammo;
            MATHVec3 = new MATH.Vec3();
            threeVec = new THREE.Vector3();
            threeObj = new THREE.Object3D();
            threeObj2 = new THREE.Object3D();
            threeQuat = new THREE.Quaternion();
            threeEuler = new THREE.Euler(0, 0, 0, 'XZY');
            threeEuler2 = new THREE.Euler();
            this.calcVec = new CANNON.Vec3();
            this.calcVec2 = new CANNON.Vec3();
            ThreeModelLoader.loadData();
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
        MODEL.PhysicsMaxSubSteps = 1;
        MODEL.SpatialTolerance = 1;
        MODEL.AngularVelocityTolerance = 1;
        MODEL.TemporalTolerance = 1;

        AmmoFunctions.prototype.updatePhysicalWorld = function(world, currentTime) {


            if(lastTime !== undefined){
                var dt = (currentTime - lastTime);

                remaining = dt + remaining;

                while (remaining >= 0) {

                //    world.step(MODEL.PhysicsStepTime, dt, MODEL.PhysicsMaxSubSteps);

                    physicsWorld.stepSimulation(MODEL.PhysicsStepTime , MODEL.PhysicsMaxSubSteps, MODEL.PhysicsStepTime);
                    //   doStep(world, fixedTimeStep, dt, maxSubSteps) ;

                    remaining -= MODEL.PhysicsStepTime;
                }

            }
            //   console.log("Sphere xyz position: "+ sphereBody.position.x +' _ '+ sphereBody.position.y+' _ '+ sphereBody.position.z);
            lastTime = currentTime;

        };


        function createTerrainShape(data, sideSize, terrainMaxHeight, terrainMinHeight) {

            var terrainWidthExtents = sideSize;
            var terrainDepthExtents = sideSize;
            var terrainWidth = Math.sqrt(data.length);
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
        //    for (var j = 0; j < terrainWidth; j++) {
                for (var i = 0; i < data.length; i++) {
                    // write 32-bit float data to memory
                    Ammo.HEAPF32[ammoHeightData + p2 >> 2] = data[i];
                    p++;
                    // 4 bytes/float
                    p2 += 4;
                }
        //    }
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
            heightFieldShape.setMargin(0.05);
            return heightFieldShape;
        }

        function createTerrainMeshShape(buffer, sideSize, terrainMaxHeight, terrainMinHeight) {

            var terrainWidthExtents = sideSize;
            var terrainDepthExtents = sideSize;
            var terrainWidth = Math.sqrt(buffer.length / 3);
            var terrainDepth = terrainWidth;

            // Creates the heightfield physics shape
            var heightFieldShape = createTriMeshFromBuffer(buffer);
            // Set horizontal scale
            var scaleX = terrainWidthExtents / ( terrainWidth - 1 );
            var scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
            heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX*2, 1, scaleZ*2));
        //    heightFieldShape.setMargin(0.0);
            return heightFieldShape;
        }

        AmmoFunctions.prototype.createPhysicalTerrain = function(world, data, totalSize, posx, posz, minHeight, maxHeight) {

            var terrainMaxHeight = maxHeight;
            var terrainMinHeight = minHeight;

            var heightDiff = maxHeight-minHeight;

            var restitution =  0.2;
            var damping     =  0.9;
            var friction    =  0.9;

        //    console.log("Ground Matrix: ", data.length)

            var groundShape = createTerrainShape( data, totalSize, terrainMaxHeight, terrainMinHeight );
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            // Shifts the terrain, since bullet re-centers it on its bounding box.
            groundTransform.setOrigin( new Ammo.btVector3(posx, minHeight + (heightDiff) * 0.5 ,posz) );
            var groundMass = 0;
            var groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
            var groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
            var groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );

            groundBody.setRestitution(restitution);
            groundBody.setFriction(friction);
            groundBody.setDamping(damping, damping);

            world.addRigidBody( groundBody );

            return groundBody;
        };


        AmmoFunctions.prototype.addPhysicalActor = function(world, actor) {
            var conf = actor.physicalPiece.config;
            var shapeKey = conf.shape;

            var position = actor.piece.rootObj3D.position;
            var quaternion = actor.piece.rootObj3D.quaternion;

            var rigidBody;

            if (shapeKey === "mesh") {
                rigidBody = this.createMeshBody(world, conf.rigid_body, position, quaternion);
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


            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(transform);

            var localInertia = new Ammo.btVector3(0, 0, 0);
            geometry.calculateLocalInertia(mass, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
            var body = new Ammo.btRigidBody(rbInfo);


            return body;

        }

        function ammoBoxShape(w, h, l) {
            return new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));
        }

        function ammoCylinderShape(w, h, l) {
            return new Ammo.btCylinderShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 1));
        }

        function createConvexHullFromBuffer(buffer) {
            var btConvexHullShape = new Ammo.btConvexHullShape();
            var _vec3_1 = new Ammo.btVector3(0,0,0);
            var _vec3_2 = new Ammo.btVector3(0,0,0);
            var _vec3_3 = new Ammo.btVector3(0,0,0);
            for (var i = 0; i < buffer.length; i+=9 ) {
                _vec3_1.setX(buffer[i+0]);
                _vec3_1.setY(buffer[i+1]);
                _vec3_1.setZ(buffer[i+2]);
                _vec3_2.setX(buffer[i+3]);
                _vec3_2.setY(buffer[i+4]);
                _vec3_2.setZ(buffer[i+5]);
                _vec3_3.setX(buffer[i+6]);
                _vec3_3.setY(buffer[i+7]);
                _vec3_3.setZ(buffer[i+8]);

                btConvexHullShape.addPoint(_vec3_1,true);
                btConvexHullShape.addPoint(_vec3_2,true);
                btConvexHullShape.addPoint(_vec3_3,true);
            }
            return btConvexHullShape;
        }

        function createTriMeshFromBuffer(buffer) {
            var triangle_mesh = new Ammo.btTriangleMesh;
            var _vec3_1 = new Ammo.btVector3(0,0,0);
            var _vec3_2 = new Ammo.btVector3(0,0,0);
            var _vec3_3 = new Ammo.btVector3(0,0,0);
            for (var i = 0; i < buffer.length; i+=9 ) {
                _vec3_1.setX(buffer[i+0]);
                _vec3_1.setY(buffer[i+1]);
                _vec3_1.setZ(buffer[i+2]);
                _vec3_2.setX(buffer[i+3]);
                _vec3_2.setY(buffer[i+4]);
                _vec3_2.setZ(buffer[i+5]);
                _vec3_3.setX(buffer[i+6]);
                _vec3_3.setY(buffer[i+7]);
                _vec3_3.setZ(buffer[i+8]);
                triangle_mesh.addTriangle(
                    _vec3_1,
                    _vec3_2,
                    _vec3_3,
                    true
                );
            }
            return new Ammo.btBvhTriangleMeshShape( triangle_mesh, true, true );
        }


        function createMeshShape(model_id, convex) {

            var modelPool = ThreeModelLoader.getModelPool();

            var mesh = modelPool[model_id][0];

            console.log("Load mesh", mesh)


            if (mesh.shape) {
                return mesh.shape;
            }

            var geometry = mesh.geometry;

            if (convex) {
                mesh.shape = createConvexHullFromBuffer(geometry.attributes.position.array);
            } else {
                mesh.shape = createTriMeshFromBuffer(geometry.attributes.position.array);
            }



            console.log("Load mesh", mesh.shape);

            return mesh.shape;

        }

        AmmoFunctions.prototype.createMeshBody = function(world, bodyParams, pos, quat) {
            var args = bodyParams.args;

            threeVec.copy(pos);

            var heightOffset = 0;

            var mass = bodyParams.mass;

            var friction = bodyParams.friction || 2.9;

            var shape = createMeshShape(bodyParams.model_id, bodyParams.convex);

        //    heightOffset = args[2] / 2;


            if (!mass) {
                heightOffset = 0;
            }

            threeVec.y += heightOffset;

            shape.setMargin(0.05);

            var body = createBody(shape, threeVec, quat, mass, friction);

            world.addRigidBody(body);
            //    body.setActivationState(DISABLE_DEACTIVATION);
            return body;

        };

        AmmoFunctions.prototype.createPrimitiveBody = function(world, bodyParams, pos, quat) {
            var args = bodyParams.args;

            threeVec.copy(pos);

            var shape;
            var heightOffset;

            var mass = bodyParams.mass || 0;
            var restitution = bodyParams.restitution || 0.5;
            var damping = bodyParams.damping || 0.5;
            var friction = bodyParams.friction || 2.9;


            if (bodyParams.shape === 'Cylinder') {
                heightOffset = args[2] / 2;

                shape = ammoCylinderShape(args[0], args[1], args[2]);

            }

            if (bodyParams.shape === 'Box') {
                heightOffset = args[1];
                shape = ammoBoxShape(args[0], args[2], args[1]);
            //    shape = new CANNON[bodyParams.shape](new CANNON.Vec3(args[2],args[0],args[1]));

            }

            if (!mass) {
                heightOffset = 0;
            }

            threeVec.y += heightOffset;

            var body = createBody(shape, threeVec, quat, mass, friction);


            body.setRestitution(restitution);
            body.setFriction(friction);
            body.setDamping(damping, damping);

            world.addRigidBody(body);
        //    body.setActivationState(DISABLE_DEACTIVATION);
            return body;

        };



        return AmmoFunctions;

    });



