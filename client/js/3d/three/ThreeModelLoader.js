"use strict";

define([
        'PipelineAPI',
        'PipelineObject',
        '3d/three/ThreeInstanceBufferModel',
        '3d/three/ThreeTerrain'],
    function(
        PipelineAPI,
        PipelineObject,
        ThreeInstanceBufferModel,
        ThreeTerrain
    ) {


        var modelPool = {};

        var activeModels = {};

        var contentUrl = function(url) {
            return 'content'+url.slice(1);
        };

        var saveJsonUrl = function(json, url) {
            var shiftUrl = url.slice(1);
            PipelineAPI.saveJsonFileOnServer(json, shiftUrl)
        };

        var poolMesh = function(id, mesh, count) {
            var poolCount = count || 3;

            if (!modelPool[id]) {
                modelPool[id] = [];
            }

            for (var i = 0; i < poolCount; i++) {
                var clone = mesh.clone();
                clone.userData.poolId = id;

                if (typeof(clone) === 'Group') {
                    if (clone.animations.length) {

                    }

                    clone.mixer = new THREE.AnimationMixer( clone );
                    var action = clone.mixer.clipAction( clone.animations[ 0 ] );
                    action.play();
                }

                clone.frustumCulled = false;
                modelPool[id].push(clone);
            }

        //    console.log("CACHE MESH", [id, modelPool, clone, mesh]);
        };

        var cacheMesh = function(id, mesh, pool) {

            PipelineAPI.setCategoryKeyValue('THREE_MODEL', id, mesh);
            poolMesh(id, mesh, pool)
        };

        var loadFBX = function(modelId, pool) {

            var fbx;

            console.log("load fbx:", modelId,  modelList[modelId].url+'.FBX')

            var err = function(e, x) {
                console.log("FBX ERROR:", e, x);
            }

            var prog = function(p, x) {
                console.log("FBX PROGRESS:", p, x);
            }

            var loader = new THREE.FBXLoader();
            //   loader.options.convertUpAxis = true;
            loader.load( modelList[modelId].url+'.FBX', function ( model ) {
                console.log("FBX LOADED: ",model);

                cacheMesh(modelId, model, pool);
                console.log("Model Pool:", modelPool);
            }, prog, err);
        };

        var loadCollada = function(modelId, pool) {

            var dae;

            var loader = new THREE.ColladaLoader();
            loader.options.convertUpAxis = true;
            loader.load( modelList[modelId].url+'.DAE', function ( collada ) {
                dae = collada.scene;

                dae.traverse( function ( child ) {

                    if ( child instanceof THREE.Mesh ) {
                        child.parent.remove(child);
                        console.log(child)
                        child.rotation.x = Math.PI;
                        child.needsUpdate = true;
                        cacheMesh(modelId, child, pool);
                    }
                } );
            });
        };



        var getMesh = function(object, id, cb) {

            if ( object instanceof THREE.Mesh ) {
                cb(object, id);
            }

            if (typeof(object.traverse) != 'function') {
                console.log("No Traverse function", object);
                return;
            }

            object.traverse( function ( child ) {
            //    object.remove(child);

                if ( child instanceof THREE.Mesh ) {
                    //    var geom = child.geometry;
                    //    child.geometry = geom;
                    //    geom.uvsNeedUpdate = true;
                    //    console.log("Obj Mesh: ", child);
                    cb(child, id);
                }
            });
        };

        var LoadObj = function(modelId, pool) {

            var loader = new THREE.OBJLoader();

            var loadUrl = function(url, id, meshFound) {
                loader.load(url, function ( object ) {

                    getMesh(object, id, meshFound)
                });
            };

            var uv2Found = function(uv2mesh, mid) {
                var meshObj = PipelineAPI.readCachedConfigKey('THREE_MODEL', mid);

        //        console.log(meshObj, uv2mesh, uv2mesh.geometry.attributes.uv);
                meshObj.geometry.addAttribute('uv2',  uv2mesh.geometry.attributes.uv);
                uv2mesh.geometry.dispose();
                uv2mesh.material.dispose();
                cacheMesh(mid, meshObj, pool);
            };

            var modelFound = function(child, mid) {
                PipelineAPI.setCategoryKeyValue('THREE_MODEL', mid, child);

                if (modelList[modelId].urluv2) {
                    loadUrl(modelList[modelId].urluv2+'.obj', modelId, uv2Found)
                } else {
                    cacheMesh(mid, child, pool);
                }
            };

            loadUrl(modelList[modelId].url+'.obj', modelId, modelFound)

        };

        var modelList = {};

        var ThreeModelLoader = function() {

        };

        ThreeModelLoader.createObject3D = function() {
            return new THREE.Object3D();
        };

        ThreeModelLoader.getModelList = function() {
            return modelList;
        };

        ThreeModelLoader.loadModelId = function(id) {

            if (!modelList[id]) {
                console.warn("No model in list by id:", id, modelList);
            }

            switch ( modelList[id].format )	{

                case 'dae':
                    loadCollada(id, modelList[id].pool);
                    break;

                case 'fbx':
                    loadFBX(id, modelList[id].pool);
                    break;

                default:
                    LoadObj(id, modelList[id].pool);
                    break;
            }

        };


        ThreeModelLoader.loadData = function(TAPI) {

            ThreeTerrain.loadData(TAPI);

            var modelListLoaded = function(scr, data) {
            //    console.log("Models updated:", data);
                for (var i = 0; i < data.length; i++){
                    modelList[data[i].id] = data[i];
                    ThreeModelLoader.loadModelId(data[i].id);
                }
            };

            new PipelineObject("MODELS", "THREE", modelListLoaded);
            new PipelineObject("MODELS", "THREE_BUILDINGS", modelListLoaded);
        };


        ThreeModelLoader.createObject3D = function() {
            return new THREE.Object3D();
        };


        var transformModel = function(trf, model) {
            model.position.x = trf.pos[0];
            model.position.y = trf.pos[1];
            model.position.z = trf.pos[2];
            model.rotation.x = trf.rot[0]*Math.PI;
            model.rotation.y = trf.rot[1]*Math.PI;
            model.rotation.z = trf.rot[2]*Math.PI;
            model.scale.x =    trf.scale[0];
            model.scale.y =    trf.scale[1];
            model.scale.z =    trf.scale[2];

        };

        var setup;

        var attachAsynchModel = function(modelId, rootObject) {


            var attachModel = function(model) {

                    transformModel(modelList[modelId].transform, model);

                    if (model.material) {
                        if (model.material.userData.animMat) {
                            rootObject.add(model);
                            return;
                        }

                        var attachMaterial = function(src, data) {
                            model.material = data;
                            rootObject.add(model);
                        };
                        new PipelineObject('THREE_MATERIAL', modelList[modelId].material, attachMaterial);

                    } else {


                    //    var root = new THREE.Object3D();
                    //    root.add(model)
                    //    setup.addToScene(root);

                        for (var i = 0; i < model.children.length; i++) {
                            setup.addToScene(model.children[i])
                        }


                        rootObject.add(model);
                    }


            };

        //    ThreeModelLoader.loadModelId(modelId);

            ThreeModelLoader.fetchPooledMeshModel(modelId, attachModel);
        };



        ThreeModelLoader.loadThreeMeshModel = function(applies, rootObject, ThreeSetup) {

            setup = ThreeSetup;


            attachAsynchModel(applies, rootObject);
            return rootObject;
        };

        var queueFetch = function(id, cb) {
            var mId = id;
            var fCb = cb;

            setTimeout(function() {
                ThreeModelLoader.fetchPooledMeshModel(mId, fCb)
            }, 500)
        };


        ThreeModelLoader.fetchPooledMeshModel = function(id, cb) {


            if (!modelPool[id]) {
                console.log("Queue Fetch", id, modelPool);
                queueFetch(id, cb);
                return;
            }

            var applyModel = function(src, data) {
                var mesh;

                if (!modelPool[src].length) {
                    console.log("Increase Model Pool", id);
                    mesh = data.clone();
                    mesh.userData.poolId = src;
                } else {
                    mesh = modelPool[src].pop()
                }

                if (mesh.pipeObj) {
                    mesh.pipeObj.removePipelineObject();
                }

                mesh.pipeObj = pipeObj;

                cb(mesh)

            };

            var pipeObj = new PipelineObject('THREE_MODEL', id, applyModel);

        };


        var getPoolEntry = function(object, id, cb) {

            if (!object) {
                console.log("Bad object", id);
            }

            if ( object.userData.poolId) {
                cb(object, id);
            }

            if (typeof(object.traverse) != 'function') {
                console.log("No Traverse function", object);
                return;
            }

            object.traverse( function ( child ) {
                //    object.remove(child);

                if ( child.userData.poolId ) {
                    //    var geom = child.geometry;
                    //    child.geometry = geom;
                    //    geom.uvsNeedUpdate = true;
                    //    console.log("Obj Mesh: ", child);
                    cb(child, id);
                }
            });
        };


        ThreeModelLoader.returnModelToPool = function(model) {

            var meshFound = function(mesh) {

                if (!mesh) console.log("Try return nothing to the pool", model);

                if (mesh.parent) {
                    mesh.parent.remove(mesh);
                }
                if (!mesh.userData.poolId) {
                    console.log("Missing Pool ID on Mesh", mesh);
                    mesh.geometry.dispose();
                    return;
                }

                if (!mesh.pipeObj) {
                    console.log("No pipe on mesh", mesh)
                } else {
                    mesh.pipeObj.removePipelineObject();
                }

                modelPool[mesh.userData.poolId].push(mesh);
            };

            if (!model.userData.poolId) {
                //        console.log("Shave scrap objects from mesh before returning it...");
                getPoolEntry(model, null, meshFound)
            } else {
                meshFound(model);
            }
        };

        ThreeModelLoader.disposeHierarchy = function(model) {

            var meshFound = function(mesh) {
                mesh.geometry.dispose();
            };

            if (!model.geometry) {
                getMesh(model, null, meshFound)
            } else {
                meshFound(model);
            }
        };

        var material1 = new THREE.MeshBasicMaterial( { color: 0xff00ff, wireframe: true, fog:false } );
        var material2 = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true, fog:false } );

        var materials = {
            yellow : new THREE.MeshBasicMaterial( { color: 0xffff88, wireframe: true, fog:false } ),
            red    : new THREE.MeshBasicMaterial( { color: 0xff5555, wireframe: true, fog:false } ),
            blue    : new THREE.MeshBasicMaterial({ color: 0x5555ff, wireframe: true, fog:false } )
        }

        ThreeModelLoader.loadThreeDebugBox = function(sx, sy, sz, colorName) {

            var geometry;

            geometry = new THREE.BoxBufferGeometry( sx || 1, sy || 1, sz || 1);

            return new THREE.Mesh( geometry, materials[colorName] || material1 );
        };

        ThreeModelLoader.loadThreeModel = function(sx, sy, sz) {

            var geometry;

            geometry = new THREE.SphereBufferGeometry( sx, 10, 10);

            return new THREE.Mesh( geometry, material2 );
        };

        ThreeModelLoader.loadThreeQuad = function(sx, sy) {

            var geometry;

            geometry = new THREE.PlaneBufferGeometry( sx || 1, sy || 1, 1 ,1);
            material2 = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

            return new THREE.Mesh( geometry, material2 );
        };

        ThreeModelLoader.loadGroundMesh = function(applies, array1d, rootObject, ThreeSetup, partsReady) {
            ThreeTerrain.loadTerrain(applies, array1d, rootObject, ThreeSetup, partsReady);
            return rootObject;
        };

        ThreeModelLoader.removeGroundMesh = function(pos) {
            var terrain = ThreeTerrain.getThreeTerrainByPosition(pos);
            if (!terrain) {
                console.log("No terrain found at position", pos);
                return;
            }
            ThreeTerrain.removeTerrainFromIndex(terrain);
        };


        ThreeModelLoader.terrainVegetationAt = function(pos, nmStore) {
            return ThreeTerrain.terrainVegetationIdAt(pos, nmStore);
        };

        ThreeModelLoader.getHeightFromTerrainAt = function(pos, normalStore) {
            return ThreeTerrain.getThreeHeightAt(pos, normalStore);
        };

        ThreeModelLoader.attachInstancedModelTo3DObject = function(modelId, rootObject, ThreeSetup) {

        };

        ThreeModelLoader.applyMaterialToMesh = function(material, model) {
            model.material = material;
        };

        ThreeModelLoader.getPooledModelCount = function() {
            var pool = 0;
            for (var key in modelPool) {
                pool += modelPool[key].length;
            }
            return pool;
        };

        return ThreeModelLoader;
    });