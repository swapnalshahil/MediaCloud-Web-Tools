import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { fetchStoryImages } from '../../../actions/storyActions';
import withAsyncData from '../hocs/AsyncDataContainer';
import withHelp from '../hocs/HelpfulContainer';
import DataCard from '../DataCard';

const localMessages = {
  title: { id: 'story.images.title', defaultMessage: 'Images' },
};

const StoryImages = ({ topImage }) => (
  <DataCard className="story-images-container">
    <h2><FormattedMessage {...localMessages.title} /></h2>
    {topImage && (
      <img alt="top" src="topImage" width="100%" />
    )}
  </DataCard>
);

StoryImages.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  helpButton: PropTypes.node.isRequired,
  // from parent
  storyId: PropTypes.number.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  allImages: PropTypes.array.isRequired,
  topImage: PropTypes.string,
};

const mapStateToProps = state => ({
  fetchStatus: state.story.reddit.fetchStatus,
  allImages: state.story.images.all,
  topImage: state.story.images.top,
});

const fetchAsyncData = (dispatch, { storyId }) => dispatch(fetchStoryImages(storyId));

export default
injectIntl(
  connect(mapStateToProps)(
    withHelp(localMessages.helpTitle, localMessages.helpIntro)(
      withAsyncData(fetchAsyncData, ['storyId'])(
        StoryImages
      )
    )
  )
);
