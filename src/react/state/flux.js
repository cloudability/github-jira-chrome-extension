var Nuclear = require('nuclear-js'),
    actions = require('./actions'),
    issuesStore = require('../stores/issues'),
    optionsStore = require('../stores/options');

var reactor = new Nuclear.Reactor();

 reactor.registerStores({
   issues: issuesStore,
   options: optionsStore
 });

module.exports = reactor;
