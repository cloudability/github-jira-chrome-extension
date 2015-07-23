var Nuclear = require('nuclear-js'),
    actions = require('../state/actions');

module.exports = new Nuclear.Store({
  getInitialState: function() {
    return Nuclear.toImmutable({});
  },

  initialize: function() {

    this.on(actions.issues.clear, function(state) {
      return state.clear();
    });

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
