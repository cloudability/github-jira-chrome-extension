var React = require('react');

module.exports = React.createClass({

  propTypes: {
    onClick: React.PropTypes.func.isRequired
  },

  render: function() {
    return (
      <div className="opaque-overlay" onClick={ this.props.onClick }>
        <div style={{ margin: '0 auto', display: 'table', height: '100%' }}>
          { /* <span className="octicon octicon-pencil" /> */ }
        </div>
      </div>
    );
  }
});
