var Nuclear = require('nuclear-js'),
    actions = require('../state/actions');

module.exports = new Nuclear.Store({
  getInitialState: function() {
    return Nuclear.toImmutable([{
      id: 'subdomain',
      name: 'subdomain',
      text: 'Subdomain',
      placeholder: 'companyname',
      value: '',
      optionGroup: 'jira'
    }, {
      id: 'urlPaths',
      name: 'urlPaths',
      text: 'Url Paths',
      placeholder: 'github-org-name',
      value: '',
      optionGroup: 'github'
    }]);
  },

  initialize: function() {

    /*
    this.on(actions.options.clear, function(state) {
      return state.clear();
    });

    this.on(actions.options.set, function(state, payload) {
      return state.set(payload.get('id'), payload);
    });
    */

    this.on(actions.options.hydrate, function(state, payload) {
      // this should be a reflection of the initial state
      var options = state.toJS();

      var saved = _(options).each().map(function(obj) {
        var thing = {};
        thing[obj.id] = obj.value;
        return thing;
      }).value()

      // set the intial option values to whatever is in the storage
      saved.forEach(function(prop) {
        chrome.storage.sync.get(prop, function(stuff) {
          console.log('get cb', stuff);
        });

      });


    });

    this.on(actions.options.update, function(state, payload) {
      return state.update(payload.get('id'), function() {
        return payload;
      });
    });

  }
});
