var React = require('react');

module.exports = React.createClass({

  propTypes: {
    issue: React.PropTypes.object.isRequired
  },

  render: function() {
    var assignee, avatarUrl,
        issue = this.props.issue.toJS();

    // assignee stuffs
    if (issue.fields.assignee) {

      assignee = issue.fields.assignee.displayName;
      avatarUrl = issue.fields.assignee.avatarUrls['24x24'];

    } else if (issue.fields.assignee === null) {
      assignee = 'Unassigned';
      avatarUrl = 'https://cloudability.atlassian.net/secure/useravatar?size=small&avatarId=10123';

    }

    return (
      <div className="table-cell assignee">
        <img src={ avatarUrl } />{ assignee }
      </div>
    );
  }
});
