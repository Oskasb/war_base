"use strict";


define([

], function()
{


    var notifyStatus = function(store, value, dataKey) {
        if (!store[dataKey]) {
            store[dataKey] = {}
        }
        store[dataKey].dirty = store[dataKey].value !== value;
        store[dataKey].key = dataKey;
        store[dataKey].value = value
    };

    var listData = function(list, data) {
        var i = 0;
        for (var key in data) {
            list[i] = data[key];
            i++;
        }
    };

    var SimulationMonitor = function() {
        this.monitorValues = [];
        this.sendStatus = {}
        this.entries = {"SIMULATION WORKER": ''};
    };


    SimulationMonitor.prototype.monitorKeyValue = function(key, value) {
        this.entries[key] = value;
    };


    SimulationMonitor.prototype.notifyActorActiveState = function(actor, state) {

    };

    SimulationMonitor.prototype.getMonitorValues = function() {

        for (var key in this.entries) {
            notifyStatus(this.sendStatus, this.entries[key], key)
        }

        listData(this.monitorValues, this.sendStatus);

        return this.monitorValues;

    };


    return SimulationMonitor;

});