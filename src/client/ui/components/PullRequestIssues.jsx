require('./index.css'); // huh?

var React = require('react'),
    api = require('../helpers/api'),
    flux = require('../state/flux'),
    actions = require('../state/actions'),
    _ = require('lodash'),
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

    this._findJiraIssues().forEach(function(issue) {
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

  _findJiraIssues: function() {
    var matches = [],
        results = [];

    var unique = function(array){
      return array.filter(function(el, index, arr) {
        return index === arr.indexOf(el);
      });
    };

    var grepForIssueNumber = function(text) {
      return text.match(/(CA\-[\d]+)/g) || [];
    };

    // look in the issue title
    document.querySelectorAll('div.discussion-timeline-actions')
    matches = grepForIssueNumber(document.querySelectorAll('.js-issue-title')[0].textContent);
    if (matches.length) {
      results = results.concat(matches);
    }

    // the second occurance of a branch listing
    matches = grepForIssueNumber(document.querySelectorAll('.current-branch')[1].textContent);
    if (matches.length) {
      results = results.concat(matches);
    }

    // timeline commits
    var messages = document.querySelectorAll('.timeline-commits a.message');

    // friggin querySelectorAll returns a NodeList
    for (var i = 0; i < messages.length; ++i) {
      matches = grepForIssueNumber(messages[i].textContent);
      if (matches.length) {
        results = results.concat(matches);
      }
    }

    return unique(results);
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
