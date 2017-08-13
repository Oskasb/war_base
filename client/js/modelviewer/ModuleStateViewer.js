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


        var ModuleStateViewer = function() {

        };


        ModuleStateViewer.viewPieceStates = function(piece) {

            for (var i = 0; i < piece.pieceSlots.length; i++) {
                ModuleStateViewer.toggleModuleStateViewer(piece.pieceSlots[i].module, true)
            }

        };

        ModuleStateViewer.toggleModuleStateViewer = function(mod, bool) {

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


        ModuleStateViewer.toggleStateViewer = function(value) {

            var src = 'state_viewer';

            if (value) {
                console.log("toggleStateViewer: ", value);
                panel = new DomPanel(GameScreen.getElement(), src);
            } else if (panel) {
                panel.removeGuiPanel();
            }

        };

        return ModuleStateViewer;
    });