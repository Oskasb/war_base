"use strict";


define([
        'Events',
        'PipelineAPI',
        'PipelineObject',
        'ThreeAPI',
        'ui/dom/DomSelectList',
        'ui/dom/DomPanel',
        'ui/GameScreen',
        'game/GameModule',
        'game/PieceState'
    ],
    function(
        evt,
        PipelineAPI,
        PipelineObject,
        ThreeAPI,
        DomSelectList,
        DomPanel,
        GameScreen,
        GameModule,
        PieceState
    ) {

        var panel;

        var loadedModules = [];

        var ModuleStateViewer = function() {

        };


        ModuleStateViewer.viewPieceStates = function(piece, bool) {

            for (var i = 0; i < piece.pieceSlots.length; i++) {
                ModuleStateViewer.toggleModuleStateViewer(piece.pieceSlots[i].module, bool)
            }

        };

        ModuleStateViewer.toggleModuleStateViewer = function(mod, bool) {

            if (bool) {
                if (loadedModules.indexOf(mod) === -1) {
                    loadedModules.push(mod);
                }
            } else {
                if (loadedModules.indexOf(mod) !== -1) {
                    loadedModules.splice(loadedModules.indexOf(mod));
                }
            }

            var mouseState = PipelineAPI.readCachedConfigKey('POINTER_STATE', 'mouseState');

            function addModuleBox(module) {

                var modState = {};

                var tweakStates = [];

                var dataKeys = [];
                var buttonKeys = [];
                var val = 0;
                var clear = 1;


                var samplePointer = function() {

                    if (mouseState.action[0]) {
                        val = mouseState.dragDistance[1] * 0.001;
                        clear = 1;
                    } else {
                        val = 0;
                    }

                    if (mouseState.action[0] && mouseState.action[1]) {
                        clear = 0;
                    }3

                    for (var i = 0; i < tweakStates.length; i++) {
                        tweakStates[i].setValue((tweakStates[i].getValue() + val) * clear);
                    }

                }

                module.debugPipes = [];
                var dataCat = "MODULE_DEBUG_"+module.id;
                for (var i = 0; i < module.moduleChannels.length; i++) {
                    dataKeys[i] = module.moduleChannels[i].state.id;


                    var interactionCallback = function(buttonKey, data) {

                        var id = buttonKeys[buttonKey];

                        if (data) {
                            tweakStates.push(module.getPieceStateById(id));
                            evt.on(evt.list().CLIENT_TICK, samplePointer)
                        } else {
                            tweakStates.splice(tweakStates.indexOf(module.getPieceStateById(id), 1));
                            evt.removeListener(evt.list().CLIENT_TICK, samplePointer)
                        }

                    };

                //    if (typeof(PipelineAPI.getCachedConfigs()[dataCat]) === 'undefined') {

                    //    if (typeof(PipelineAPI.getCachedConfigs()[dataCat]['button_'+dataKeys[i]]) === 'undefined') {

                            module.debugPipes.push(new PipelineObject(dataCat, 'button_' + dataKeys[i], interactionCallback));

                            PipelineAPI.setCategoryKeyValue(dataCat, 'button_' + dataKeys[i], false);

                            modState[dataKeys[i]] = module.state;
                            buttonKeys['button_' + dataKeys[i]] = dataKeys[i]
                    //    }
                 //   } else {
                 //       console.log("Already added state sampler..", 'button_'+dataKeys[i])
                 //   }

                }


                var idconf = {
                    id:"module_id"+module.id,
                    container:"dev_monitor_container",
                    data:{
                        style:["data_list_container"],
                        dataField:{
                            dataKeys:dataKeys,
                            dataCategory:dataCat,
                            button:{
                               id:"panel_button"
                            }
                        }
                    }
                };

                panel.addContainedElement(idconf);
                panel.updateLayout()
            //    evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});
            }

            if (bool) {
                addModuleBox(mod);
            } else {
                var container = {
                    id:"module_id"+mod.id
                };

                for (var i = 0; i < mod.debugPipes.length; i++) {
                    mod.debugPipes[i].removePipelineObject();
                }

                panel.removeContainedElement(container)
            }

        };

        var tick = function(e) {

            for (var key in loadedModules) {
                if (loadedModules[key].length) {
                    var mod = loadedModules[key][0];

                    var dataCat = "MODULE_DEBUG_"+mod.id;

                    for (var i = 0; i < mod.moduleChannels.length; i++) {
                        PipelineAPI.setCategoryKeyValue(dataCat, mod.moduleChannels[i].state.id, mod.moduleChannels[i].state.getValueRunded(100));
                    }

                    loadedModules[key][0].sampleModuleFrame(true);
                }
            }
        };

        ModuleStateViewer.toggleStateViewer = function(value) {

            var src = 'state_viewer';

        //    console.log("toggleStateViewer: ", value);

            if (value) {
                panel = new DomPanel(GameScreen.getElement(), src);
                evt.on(evt.list().CLIENT_TICK, tick);
            } else {
                if (panel) panel.removeGuiPanel();
                evt.removeListener(evt.list().CLIENT_TICK, tick);
            }

        };

        return ModuleStateViewer;
    });