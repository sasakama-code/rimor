// Mock UserProfile component for testing
const React = require('react');

class UserProfile extends React.Component {
  render() {
    return React.createElement('div', { className: 'user-profile' }, 
      React.createElement('h1', null, this.props.name),
      React.createElement('p', null, this.props.email)
    );
  }
}

module.exports = UserProfile;
module.exports.default = UserProfile;