import React from 'react';
import Link from 'react-router/lib/Link';
import { injectIntl } from 'react-intl';
import { getBrandDarkColor } from '../../styles/colors';
import messages from '../../resources/messages';

class ExploreButton extends React.Component {

  handleClick = (event) => {
    const { onClick } = this.props;
    event.preventDefault();
    if (onClick) {
      onClick();
    }
  }

  render() {
    const { linkTo, onClick } = this.props;
    const { formatMessage } = this.props.intl;
    const linkTarget = linkTo || formatMessage(messages.explore);
    const clickHandler = (onClick) ? this.handleClick : null;
    return (
      <Link to={linkTarget} onClick={clickHandler} name={formatMessage(messages.explore)}>
        <div className="app-icon app-icon-explore" style={{ backgroundColor: getBrandDarkColor() }}>
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="9.477px" height="6.601px" viewBox="0 0 9.477 6.601" enableBackground="new 0 0 9.477 6.601" xmlSpace="preserve">
            <g>
              <g>
                <g>
                  <path fill="#FFFFFF" d="M338.381,315.433c-0.252,0-0.463-0.211-0.463-0.463v-0.187c-0.034-1.011,0.648-1.449,1.146-1.769 c0.539-0.346,0.842-0.574,0.842-1.189c0-0.783-0.573-1.288-1.458-1.288c-0.21,0.008-1.196,0.118-1.196,1.28 c0,0.253-0.211,0.463-0.464,0.463s-0.463-0.21-0.463-0.463c0-1.711,1.382-2.19,2.106-2.207h0.008c1.408,0,2.393,0.91,2.393,2.215 c0,1.155-0.732,1.627-1.264,1.973c-0.496,0.32-0.732,0.497-0.715,0.96c0,0.009,0,0.009,0,0.017v0.195 C338.844,315.229,338.634,315.433,338.381,315.433z" />
                </g>
              </g>
              <g>
                <circle fill="#FFFFFF" cx="338.423" cy="316.679" r="0.531" />
              </g>
            </g>
            <g>
              <g>
                <g>
                  <path fill="#FFFFFF" d="M6.6,0.185l2.691,2.672c0.07,0.07,0.126,0.158,0.156,0.258c0.006,0.02,0.012,0.041,0.016,0.061 c0.008,0.041,0.014,0.082,0.014,0.127c0,0.105-0.025,0.203-0.074,0.291c-0.01,0.018-0.02,0.035-0.031,0.053 C9.36,3.663,9.348,3.681,9.334,3.696C9.32,3.714,9.307,3.731,9.291,3.743L6.6,6.417c-0.247,0.244-0.65,0.244-0.896,0 c-0.248-0.248-0.248-0.645,0-0.891l1.609-1.596H0.635C0.283,3.931,0,3.647,0,3.302c0-0.348,0.283-0.631,0.635-0.631h6.678 L5.701,1.075c-0.246-0.246-0.246-0.645,0-0.891C5.949-0.062,6.352-0.062,6.6,0.185z" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </Link>
    );
  }

}

ExploreButton.propTypes = {
  onClick: React.PropTypes.func,
  linkTo: React.PropTypes.func,
  intl: React.PropTypes.object.isRequired,
};

export default injectIntl(ExploreButton);
