var React = require('react');

module.exports = React.createClass({

  propTypes: {
    issue: React.PropTypes.object.isRequired
  },

  _statusClassNames: function(issue) {
    var classes = ['current-state'];

    if (issue.fields.status && issue.fields.status.statusCategory) {
      classes.push(issue.fields.status.statusCategory.colorName);
    }

    return classes.join(' ');
  },

  render: function() {
    var issue = this.props.issue.toJS();

    return (
      <strong>
        <span className={ this._statusClassNames(issue) }>{ issue.fields.status.name }</span>
      </strong>
    );

  }
});
