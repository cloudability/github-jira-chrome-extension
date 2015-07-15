var React = require('react'),
    Title = require('./Title.jsx'),
    Status = require('./Status.jsx'),
    Assignee = require('./Assignee.jsx'),
    ActionButtons = require('./ActionButtons.jsx');

var Map = require('immutable').Map,
    api = require('../helpers/api'),
    flux = require('../state/flux'),
    actions = require('../state/actions');

module.exports = React.createClass({

  propTypes: {
    issue: React.PropTypes.object.isRequired,
    onRefresh: React.PropTypes.func
  },

  _onRefresh: function(e) {
    var key = this.props.issue.get('key'),
        id = this.props.issue.get('id'),
        url = 'https://cloudability.atlassian.net/rest/api/2/issue/' + key + '?expand=transitions'

    e.preventDefault();

    flux.dispatch(actions.issues.update, this.props.issue.merge({ '_loading': true }));

    api.get(url, function(err, res) {

      flux.dispatch(actions.issues.set, Map(res.body));

    }.bind(this));

  },

  _loadingOverlay: function() {
    if (this.props.issue.get('_loading')) {
      return (
        <div className="spinner-background">
          <div className="spinner-container">
            <div style={{ margin: '0 auto', display: 'table', height: '100%' }}>
              <span className="spinner-icon octicon mega-octicon octicon-hourglass rotate-me" />
            </div>
          </div>
        </div>
      );
    }
  },

  render: function() {
    var issue = this.props.issue;

    return (
      <div className="jira merge-pr">
        <div className="branch-action branch-action-state-clean js-mergable-state">
          <span className="mega-octicon octicon-git-pull-request branch-action-icon" />
          <div className="branch-action-body">

            { this._loadingOverlay() }

            <div className="status">
              <div className="table-row">
                <div className="table-cell">
                  <Title issue={ issue } />
                </div>
                <Assignee issue={ issue } />
                <div className="table-cell">
                  <Status issue={ issue } />
                </div>
                <div className="table-cell">
                  <button type="button" onClick={ this._onRefresh } className="octicon octicon-sync btn minibutton" />
                </div>
              </div>
              <div className="table-row">
                <span className="issue-title">{ issue.toJS().fields.summary }</span>
              </div>
            </div>

            <ActionButtons issue={ issue } />

          </div><!-- /.branch-action-body -->
        </div><!-- /.branch-action -->
      </div>
    );
  }
});
