import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import LoadingSpinner from '../../common/LoadingSpinner';
import { TOPIC_SNAPSHOT_STATE_COMPLETED, TOPIC_SNAPSHOT_STATE_QUEUED, TOPIC_SNAPSHOT_STATE_RUNNING,
  TOPIC_SNAPSHOT_STATE_ERROR, TOPIC_SNAPSHOT_STATE_CREATED_NOT_QUEUED } from '../../../reducers/topics/selected/snapshots';
import TopicVersionQueuedStatusContainer from './homepages/TopicVersionQueuedStatusContainer';
import TopicVersionErrorStatusContainer from './homepages/TopicVersionErrorStatusContainer';
import TopicVersionRunningStatusContainer from './homepages/TopicVersionRunningStatusContainer';
import TopicVersionTooBigStatusContainer from './homepages/TopicVersionTooBigStatusContainer';
import TopicVersionCreatedStatusContainer from './homepages/TopicVersionCreatedStatusContainer';
import * as fetchConstants from '../../../lib/fetchConstants';
import { filteredLinkTo } from '../../util/location';
import { VERSION_ERROR, VERSION_ERROR_EXCEEDED, VERSION_CREATING, VERSION_QUEUED, VERSION_RUNNING,
  VERSION_READY } from '../../../lib/topicFilterUtil';
import { getCurrentVersionFromSnapshot } from '../../../lib/topicVersionUtil';
import { topicStartSpider } from '../../../actions/topicActions';
import { LEVEL_ERROR } from '../../common/Notice';
import { addNotice, updateFeedback } from '../../../actions/appActions';

const localMessages = {
  startedGenerating: { id: 'topic.created.startedGenerating', defaultMessage: 'We started generating this version' },
  generationFailed: { id: 'topic.created.generationFailed', defaultMessage: 'Sorry, but we weren\'t able to start generating this version.' },
};

/**
 * This decides which topic version homepage to show, based on the version and topic state
 */
class TopicVersionContainer extends React.Component {
  determineVersionStatus(snapshot, topic) {
    const stateToUse = snapshot ? snapshot.state : topic.state;
    const { snapshotCount } = this.props;
    switch (stateToUse) {
      case TOPIC_SNAPSHOT_STATE_ERROR:
        if (topic.message && topic.message.indexOf('exceeds topic max') > -1) {
          return VERSION_ERROR_EXCEEDED;
        }
        return VERSION_ERROR;
      case TOPIC_SNAPSHOT_STATE_CREATED_NOT_QUEUED:
        return VERSION_CREATING;
      case TOPIC_SNAPSHOT_STATE_QUEUED:
        return VERSION_QUEUED;
      case TOPIC_SNAPSHOT_STATE_RUNNING:
        if (snapshotCount === 0) {
          return VERSION_RUNNING;
        }
        // also evaluate another kind of error like VERSION_RUNNING_ERROR
        return VERSION_RUNNING;
      case TOPIC_SNAPSHOT_STATE_COMPLETED:
        return VERSION_READY;
      default:
        return 0;
      // case ? return VERSION_CANCELLED:
    }
  }

  render() {
    const { children, topicInfo, goToCreateNewVersion, fetchStatusSnapshot, fetchStatusInfo,
      setSideBarContent, currentVersionId, filters, selectedSnapshot, handleSnapshotGenerate } = this.props;
    // show a big error if there is one to show
    const currentVersionNum = getCurrentVersionFromSnapshot(topicInfo, currentVersionId);
    let contentToShow = children; // has a filters renderer in it - show if a completed topic
    const childrenWithExtraProp = React.Children.map(children, child => React.cloneElement(child, { setSideBarContent }));
    contentToShow = childrenWithExtraProp;
    const versionStatus = this.determineVersionStatus(selectedSnapshot, topicInfo);
    const latestJob = selectedSnapshot ? selectedSnapshot.snapshotJobs[0] : topicInfo.spiderJobs[0];
    if (versionStatus === VERSION_CREATING) {
      contentToShow = (
        <TopicVersionCreatedStatusContainer
          topic={topicInfo}
          snapshot={selectedSnapshot || { note: currentVersionNum }}
          job={latestJob}
          onSnapshotGenerate={handleSnapshotGenerate}
          goToCreateNewVersion={() => goToCreateNewVersion(topicInfo, filters)}
        />
      );
    } else if (versionStatus === VERSION_QUEUED) {
      contentToShow = (
        <TopicVersionQueuedStatusContainer
          topic={topicInfo}
          snapshot={selectedSnapshot || { note: currentVersionNum }}
          job={latestJob}
          goToCreateNewVersion={() => goToCreateNewVersion(topicInfo, filters)}
        />
      );
    } if (versionStatus === VERSION_RUNNING) {
      contentToShow = (
        <TopicVersionRunningStatusContainer
          topic={topicInfo}
          snapshot={selectedSnapshot || { note: currentVersionNum }}
          job={latestJob}
        />
      );
    } else if (versionStatus === VERSION_ERROR_EXCEEDED) { // we know this is not the ideal location nor ideal test but it addresses an immediate need for our admins
      contentToShow = (
        <TopicVersionTooBigStatusContainer
          topic={topicInfo}
          snapshot={selectedSnapshot || { note: currentVersionNum }}
          job={latestJob}
          goToCreateNewVersion={() => goToCreateNewVersion(topicInfo, filters)}
        />
      );
    } else if (versionStatus === VERSION_ERROR) {
      contentToShow = (
        <TopicVersionErrorStatusContainer
          topic={topicInfo}
          snapshot={selectedSnapshot || { note: currentVersionNum }}
          job={latestJob}
          goToCreateNewVersion={() => goToCreateNewVersion(topicInfo, filters)}
        />
      );
    } else if (fetchStatusInfo !== fetchConstants.FETCH_SUCCEEDED
      && fetchStatusSnapshot !== fetchConstants.FETCH_SUCCEEDED) {
      // complete
      contentToShow = <LoadingSpinner />;
    }
    return contentToShow;
  }
}

TopicVersionContainer.propTypes = {
  // from context
  intl: PropTypes.object.isRequired,
  children: PropTypes.node,
  location: PropTypes.object.isRequired,
  topicId: PropTypes.number.isRequired,
  // from dispatch
  handleSnapshotGenerate: PropTypes.func.isRequired,
  goToCreateNewVersion: PropTypes.func,
  // from state
  filters: PropTypes.object.isRequired,
  fetchStatus: PropTypes.string.isRequired,
  fetchStatusInfo: PropTypes.string,
  fetchStatusSnapshot: PropTypes.string,
  topicInfo: PropTypes.object,
  selectedSnapshot: PropTypes.object,
  needsNewSnapshot: PropTypes.bool.isRequired,
  snapshotCount: PropTypes.number.isRequired,
  setSideBarContent: PropTypes.func,
  currentVersionId: PropTypes.number,
};

const mapStateToProps = (state, ownProps) => ({
  filters: state.topics.selected.filters,
  fetchStatus: state.topics.selected.info.fetchStatus,
  fetchStatusInfo: state.topics.selected.info.fetchStatus,
  topicInfo: state.topics.selected.info,
  topicId: parseInt(ownProps.params.topicId, 10),
  selectedSnapshot: state.topics.selected.snapshots.selected,
  currentVersionId: parseInt(ownProps.location.query.snapshotId, 10),
  needsNewSnapshot: state.topics.selected.needsNewSnapshot,
  snapshotCount: state.topics.selected.snapshots.list.length,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  goToCreateNewVersion: (topicInfo, filters) => {
    const url = `/topics/${topicInfo.topics_id}/update`;
    dispatch(push(filteredLinkTo(url, filters)));
  },
  handleSnapshotGenerate: (topicId, snapshotId) => {
    dispatch(topicStartSpider(topicId, { snapshotId }))
      .then((results) => {
        if ((results.statusCode && results.statusCode !== 200) || results.error) {
          dispatch(addNotice({ message: localMessages.generationFailed, details: results.message || results.error, level: LEVEL_ERROR }));
        } else {
          dispatch(updateFeedback({ open: true, message: ownProps.intl.formatMessage(localMessages.startedGenerating) }));
        }
      });
  },
});

export default
injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(
    TopicVersionContainer
  )
);
