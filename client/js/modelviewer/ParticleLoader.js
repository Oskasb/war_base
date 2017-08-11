"use strict";


define([
        'Events',
        'PipelineAPI',
        'ui/dom/DomSelectList'
    ],
    function(
        evt,
        PipelineAPI,
        DomSelectList
    ) {

        var panels = {};
        var panelStates = {};
        var loadedModels = {};
        var rootModels = {};
        var stateData;

        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3(0, 0.1, 0);

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.PARTICLE_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"particleloaderbutton",
                container:"main_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'PARTICLE LIST'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {PARTICLE_LOADER:true});
            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});
            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {PARTICLE_LOADER:false});
            }, 1000);

        }

        var ParticleLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.togglePanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.PARTICLE_LOADER, apply);

            addButton();
        };

        var effectData = {
            effect:'',
            pos:new THREE.Vector3(),
            vel:new THREE.Vector3()
        };

        var emitEffect = function(effectId, pos, vel) {
            effectData.effect = effectId;
            effectData.pos.set(pos.x, pos.y, pos.z);
            effectData.vel.set(vel.x, vel.y, vel.z);
            evt.fire(evt.list().GAME_EFFECT, effectData);
        };

        ParticleLoader.prototype.loadModel = function(id, value) {

            if (value === true) {
                console.log("Load Particle: ", id, value);

                var emitIt = function() {
                    if (Math.random() < 10.1) {
                        calcVec.x = 20 * (Math.random()-0.5);
                        calcVec.y = 20 * (Math.random()-0.5);
                        calcVec.z = 20 * (Math.random()-0.5);
                        calcVec2.copy(calcVec);
                        calcVec2.multiplyScalar(2*Math.random())
                        emitEffect(pId, calcVec, calcVec2);
                    }
                };

                if (!loadedModels[id]) {
                    loadedModels[id] = [];
                }

                loadedModels[id].push(emitIt);

                var pId = id;

                evt.on(evt.list().CLIENT_TICK, loadedModels[id][0]);

            } else {

                if (loadedModels[id]) {
                    evt.removeListener(evt.list().CLIENT_TICK, loadedModels[id].pop());
                }
            }
        };

        ParticleLoader.prototype.togglePanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_PARTICLES;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadModel(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            if (value) {
                console.log("Configs: ", PipelineAPI.getCachedConfigs());
                var list = PipelineAPI.getCachedConfigs().PARTICLE_EFFECTS.THREE;
                var dataList = {};

                for (var i = 0; i < list.length; i++) {
                    dataList[list[i].id] = list[i];
                }

                console.log("Particles:", dataList);

                panels[src] = new DomSelectList(category, dataList, stateData, buttonFunc);

            } else if (panels[src]) {

                panels[src].removeSelectList();
                delete panels[src];

            }

            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }
        };

        return ParticleLoader;
    });