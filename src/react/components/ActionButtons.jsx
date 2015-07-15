var React = require('react'),
    OpaqueOverlay = require('./OpaqueOverlay.jsx'),
    api = require('../helpers/api'),
    flux = require('../state/flux'),
    actions = require('../state/actions'),
    Map = require('immutable').Map;

module.exports = React.createClass({

  propTypes: {
    issue: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {
      opaque: false
    }
  },

  _buttonClick: function(transitionId, e) {
    var postUrl = 'https://cloudability.atlassian.net/rest/api/2/issue/'+ this.props.issue.get('id') +'/transitions',
        getUrl = 'https://cloudability.atlassian.net/rest/api/2/issue/' + this.props.issue.get('id') + '?expand=transitions';

    e.preventDefault();

    flux.dispatch(actions.issues.update, this.props.issue.merge({ '_loading': true }));

    api.post(postUrl, { transition: { id: transitionId }}, function(err, res) {

      api.get(getUrl, function(err, res) {

        flux.dispatch(actions.issues.set, Map(res.body));

      });
    });
  },

  _overlayClick: function(e) {
    e.preventDefault();

    this.setState({ opaque: false });
  },

  render: function() {
    var issue = this.props.issue.toJS(),
        transitions = issue.transitions || [];

    return (
      <div className="button-container">
        { (this.state.opaque) ? <OpaqueOverlay onClick={ this._overlayClick } /> : '' }
        {transitions.map(function(transition, i) {
          return (
            <button key={ i } type="button" onClick={ this._buttonClick.bind(this, transition.id) } className="btn btn-sm minibutton primary merge-branch-action">
              { transition.name }
            </button>
          );
        }, this)}

        <div className="clearfix" />
      </div>
    );
  }
});
