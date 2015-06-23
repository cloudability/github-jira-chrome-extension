var Nuclear = require('nuclear-js');

module.export = new Nuclear.Store({
  getInitialState: function() {
    return Nuclear.toImmutable({});
  },

  initialize: function() {

    this.on('update', function(state, payload) {
      return state.set(payload.id, payload);
    });

    this.on('create', function(state, payload) {
      return state.set(payload.id, payload);
    });

  }
});
