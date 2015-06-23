var React = require('react'),
    PullRequestIssues = require('components/PullRequestIssues.jsx');

var timeline = document.querySelectorAll('div.discussion-timeline-actions')[0],
    // container for our stuffs
    div = document.createElement('div');

if (timeline) {
  timeline.appendChild(div);
  React.render(<PullRequestIssues />, div);
} else {
  console.warn('Its being stupid');
}


// TODO: fucking pushstate navigation... *sigh*
