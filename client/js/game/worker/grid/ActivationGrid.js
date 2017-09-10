"use strict";

define([
        'PipelineAPI',
        'worker/grid/ActivationGridSystem'
    ],
    function(
        PipelineAPI,
        ActivationGridSystem
    ) {

    var gridSysData;
    var gridMasterData;

        var ActivationGrid = function(ready) {

            this.gridSystems = null;

            var gridSys = function(src, data) {
                gridSysData = [];
                for (var i = 0; i < data.length; i++) {
                    gridSysData[data[i].id] = data[i].data;
                }
                console.log("Grid Ready");
                ready()
            };

            var gridMaster = function(src, data) {
                gridMasterData = [];
                for (var i = 0; i < data.length; i++) {
                    gridMasterData[i] = data[i];
                }

                PipelineAPI.subscribeToCategoryKey('PHYSICS_DATA', 'GRID_SYSTEMS', gridSys);
            };

            PipelineAPI.subscribeToCategoryKey('PHYSICS_DATA', 'GRID_MASTER', gridMaster);
        };


        ActivationGrid.prototype.createActivationGrid = function(simulationState) {
            this.gridSystems = [];
            for (var i = 0; i < gridMasterData.length; i++) {
                console.log("Add Grid System", gridMasterData[i]);
                this.gridSystems.push(new ActivationGridSystem(i, gridSysData, gridMasterData, simulationState));
            }
        };


        ActivationGrid.prototype.updateActivationGrid = function(posVec3) {
            for (var i = 0; i < this.gridSystems.length; i++) {
                this.gridSystems[i].updateGridSystem(posVec3);
            }
        };


        return ActivationGrid;

    });

