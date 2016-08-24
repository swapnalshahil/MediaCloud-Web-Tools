import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import composeAsyncContainer from '../../common/AsyncContainer';
import { fetchTopicTopStories, sortTopicTopStories } from '../../../actions/topicActions';
import DataCard from '../../common/DataCard';
import ExploreButton from '../../common/ExploreButton';
import StoryTable from '../StoryTable';

const localMessages = {
  title: { id: 'topic.summary.topStories.title', defaultMessage: 'Top Stories' },
};

const NUM_TO_SHOW = 10;

class StoriesSummaryContainer extends React.Component {
  componentWillReceiveProps(nextProps) {
    const { filters, sort, fetchData } = this.props;
    if ((nextProps.filters.timespanId !== filters.timespanId) ||
        (nextProps.sort !== sort)) {
      fetchData(nextProps);
    }
  }
  onChangeSort = (newSort) => {
    const { sortData } = this.props;
    sortData(newSort);
  };
  render() {
    const { stories, sort, topicId } = this.props;
    return (
      <DataCard>
        <div className="actions">
          <ExploreButton linkTo={`/topics/${topicId}/stories`} />
        </div>
        <h2><FormattedMessage {...localMessages.title} /></h2>
        <StoryTable stories={stories} topicId={topicId} onChangeSort={this.onChangeSort} sortedBy={sort} />
      </DataCard>
    );
  }
}

StoriesSummaryContainer.propTypes = {
  // from context
  intl: React.PropTypes.object.isRequired,
  // from parent
  topicId: React.PropTypes.number.isRequired,
  filters: React.PropTypes.object.isRequired,
  // from dispatch
  fetchData: React.PropTypes.func.isRequired,
  sortData: React.PropTypes.func.isRequired,
  // from state
  fetchStatus: React.PropTypes.string.isRequired,
  sort: React.PropTypes.string.isRequired,
  stories: React.PropTypes.array,
};

const mapStateToProps = (state) => ({
  fetchStatus: state.topics.selected.summary.topStories.fetchStatus,
  sort: state.topics.selected.summary.topStories.sort,
  stories: state.topics.selected.summary.topStories.stories,
});

const mapDispatchToProps = (dispatch) => ({
  fetchData: (props) => {
    const params = {
      ...props.filters,
      sort: props.sort,
      limit: NUM_TO_SHOW,
    };
    dispatch(fetchTopicTopStories(props.topicId, params));
  },
  sortData: (sort) => {
    dispatch(sortTopicTopStories(sort));
  },
});

function mergeProps(stateProps, dispatchProps, ownProps) {
  return Object.assign({}, stateProps, dispatchProps, ownProps, {
    asyncFetch: () => {
      dispatchProps.fetchData(ownProps);
    },
  });
}

export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps, mergeProps)(
      composeAsyncContainer(
        StoriesSummaryContainer
      )
    )
  );
