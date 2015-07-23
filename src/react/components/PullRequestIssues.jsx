var React = require('react'),
    api = require('../helpers/api'),
    findJiraIssues = require('../helpers/pullrequest').findJiraIssues,
    flux = require('../state/flux'),
    actions = require('../state/actions'),
    JiraIssue = require('./JiraIssue.jsx'),
    Map = require('immutable').Map;

module.exports = React.createClass({
  mixins: [flux.ReactMixin],

  getDataBindings: function() {
    return {
      issues: ['issues']
    }
  },

  componentWillMount: function() {

    flux.dispatch(actions.issues.clear);

    findJiraIssues().forEach(function(issue) {
      this._loadIssue(issue);
    }.bind(this));
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return this.state.issues !== nextState.issues;
  },

  _loadIssue: function(key, id) {
    var url = 'https://cloudability.atlassian.net/rest/api/2/issue/' + key + '?expand=transitions'

    api.get(url, function(err, res) {

      flux.dispatch(actions.issues.set, Map(res.body));

    }.bind(this));
  },

  _jiraIssues: function() {

    return this.state.issues
      .sortBy(function(issue) {
        return issue.get('key');
      })
      .map(function(issue, i) {

        return <JiraIssue key={ i } issue={ issue } />;

      }.bind(this));
  },

  render: function() {
    if (this.state.issues) {

      return (
        <div>
          { this._jiraIssues() }
        </div>
      );

    } else {
      return (<div />);
    }
  }
});
