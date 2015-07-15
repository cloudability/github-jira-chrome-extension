var api = require('./api');

// try to auto-fill the pull request title
var titleFill = function() {
  var url = '',
      issues = findJiraIssues();

  if (issues.length === 1) {
    var url = 'https://cloudability.atlassian.net/rest/api/2/issue/' + issues[0] + '?expand=transitions'

    api.get(url, function(err, res) {

      document.getElementById('pull_request_title').value = issues[0] + ' - ' + res.body.fields.summary;

    });
  }

};


// search the page for JIRA issues, return unique array of strings
var findJiraIssues = function() {
  var matches = [],
      results = [],
      messages = [],
      timelineActions = [],
      currentBranch = [];

  var unique = function(array){
    return array.filter(function(el, index, arr) {
      return index === arr.indexOf(el);
    });
  };

  var grepForIssueNumber = function(text) {
    return text.match(/(CA\-[\d]+)/g) || [];
  };

  // look in the issue title
  timelineActions = document.querySelectorAll('div.discussion-timeline-actions')
  if (timelineActions.length) {

    matches = grepForIssueNumber(document.querySelectorAll('.js-issue-title')[0].textContent);
    if (matches.length) {

      results = results.concat(matches);
    }
  }

  currentBranch = document.querySelectorAll('.current-branch');
  if (currentBranch.length) {

    // the second occurance of a branch listing
    matches = grepForIssueNumber(currentBranch[1].textContent);
    if (matches.length) {
      results = results.concat(matches);
    }
  }

  // timeline commits
  messages = document.querySelectorAll('.timeline-commits a.message');

  // friggin querySelectorAll returns a NodeList
  for (var i = 0; i < messages.length; ++i) {
    matches = grepForIssueNumber(messages[i].textContent);
    if (matches.length) {
      results = results.concat(matches);
    }
  }

  return unique(results);
};


module.exports = {
  titleFill: titleFill,
  findJiraIssues: findJiraIssues
};
