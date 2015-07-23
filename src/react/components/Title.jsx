var React = require('react');

module.exports = React.createClass({

  propTypes: {
    issue: React.PropTypes.object.isRequired
  },

  render: function() {
    return (
      <h2>
        <a href={ "https://cloudability.atlassian.net/browse/" + this.props.issue.get('key') } target="_blank">
          { this.props.issue.get('key') }
        </a>
      </h2>
    );
  }
});
