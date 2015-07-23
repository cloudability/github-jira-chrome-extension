// The options page

var React = require('react'),
    flux = require('./state/flux'),
    actions = require('./state/actions'),
    _ = require('lodash');


var Options = React.createClass({

  mixins: [flux.ReactMixin],

  getDataBindings: function() {
    return {
      options: ['options']
    }
  },

  componentWillMount: function() {

    flux.dispatch(actions.options.hydrate, this.state.options);

  },

  _renderOptions: function(name) {
    return this.state.options.toJS().map(function(option, i) {
      return (
        <div key={ i } style={{ marginLeft: 10 }}>
          <label htmlFor={ option.name }>{ option.text }</label>:
          <input type="text" id={ option.name } placeholder={ option.placeholder } value={ option.value } />
        </div>
      );
    });
  },

  _onSave: function(e) {
    e.preventDefault();
    console.log('save');
  },

  // hrmf, this closes the actual tab
  _close: function() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.remove(tabs[0].id, function() { });
    });
  },

  render: function() {
    return (
      <div>
        <form>
          { this._renderOptions() }
        </form>
        <button type="submit" onClick={ this._onSave }>Save</button>
      </div>
    );
  }
});

React.render(<Options />, document.getElementById('contents'));
