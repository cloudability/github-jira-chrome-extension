require('../index.css');

var React = require('react'),
    PullRequestIssues = require('./components/PullRequestIssues.jsx');

var appendAndRenderToTimeline = function() {
  var timeline = document.querySelectorAll('div.discussion-timeline-actions');
  var reactNode = document.getElementById('react-timeline-container');

  if (timeline.length) {

    // TODO:
    // react complaining that the nodes are valid but unequal when
    // attempting to re-render. Guessing githubs ajax rendering the reason?
    if (reactNode) {
      reactNode.parentElement.removeChild(reactNode);
    }

    var div = document.createElement('div');
    div.setAttribute('id', 'react-timeline-container');
    timeline[0].appendChild(div);

    React.render(<PullRequestIssues />, document.getElementById('react-timeline-container'));
  }
}

appendAndRenderToTimeline();

// pushstate navigation; message passing to/from our background running script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.onHistoryStateUpdated === true) {

    sendResponse({ heardOnHistoryStateUpdated: true });

    appendAndRenderToTimeline();
  }
});


// we're on the comparison page which has the 'create pull request button'
// auto-fill the PR title
if (window.location.search === '?expand=1') {
  require('./helpers/pullrequest').titleFill();
}
