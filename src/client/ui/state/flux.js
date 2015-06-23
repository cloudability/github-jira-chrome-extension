var Nuclear = require('nuclear-js'),
    actions = require('./actions');

var issuesStore = new Nuclear.Store({
  getInitialState: function() {
    return Nuclear.toImmutable({});
  },

  initialize: function() {

    this.on(actions.issues.set, function(state, payload) {
      return state.set(payload.get('id'), payload);
    });

    this.on(actions.issues.update, function(state, payload) {
      return state.update(payload.get('id'), function() {
        return payload;
      });
    });

  }
});

var reactor = new Nuclear.Reactor();

 reactor.registerStores({
   issues: issuesStore
 });

module.exports = reactor;
