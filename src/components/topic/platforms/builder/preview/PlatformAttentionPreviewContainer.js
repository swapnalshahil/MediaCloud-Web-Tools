import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { formValueSelector } from 'redux-form';
import withAsyncData from '../../../../common/hocs/AsyncDataContainer';
import { fetchAttentionByPlatformQuery } from '../../../../../actions/topicActions';
import DataCard from '../../../../common/DataCard';
import { getBrandDarkColor } from '../../../../../styles/colors';
import AttentionOverTimeChart from '../../../../vis/AttentionOverTimeChart';
import withDescription from '../../../../common/hocs/DescribedDataCard';

const formSelector = formValueSelector('platform');

const localMessages = {
  title: { id: 'topic.create.preview.attention.title', defaultMessage: 'Attention Over Time' },
  descriptionIntro: { id: 'topic.summary.splitStoryCount.help.title', defaultMessage: 'The attention over time to your issue can vary. If you see a predominantly flat line here with no attention, consider going back and changing the start and end dates for your topic.' },
  helpText: { id: 'media.splitStoryCount.help.text',
    defaultMessage: '<p>This chart shows you the amount of content over time that match your topic query. This a good preview of the attention paid to your topic on this platform.</p>',
  },
};

const PlatformAttentionPreviewContainer = (props) => {
  const { total, counts, selectedPlatform } = props;
  return (
    <DataCard>
      <h2>
        <FormattedMessage {...localMessages.title} />
      </h2>
      <AttentionOverTimeChart
        lineColor={getBrandDarkColor()}
        total={total}
        series={[{
          id: 0,
          name: selectedPlatform.platform,
          color: getBrandDarkColor(),
          data: counts.map(c => [c.date, c.count]),
          showInLegend: false,
        }]}
        height={250}
      />
    </DataCard>
  );
};

PlatformAttentionPreviewContainer.propTypes = {
  // from composition chain
  intl: PropTypes.object.isRequired,
  // from parent
  topic: PropTypes.object.isRequired,
  query: PropTypes.string.isRequired,
  formatPlatformChannelData: PropTypes.func, // will be pass the formValues, and should return a string suitable for upload to server
  // from state
  total: PropTypes.number,
  counts: PropTypes.array,
  fetchStatus: PropTypes.string.isRequired,
  selectedPlatform: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  topic: state.topics.selected.info,
  fetchStatus: state.topics.selected.platforms.preview.matchingAttention.fetchStatus,
  total: state.topics.selected.platforms.preview.matchingAttention.total,
  counts: state.topics.selected.platforms.preview.matchingAttention.counts,
  formValues: formSelector(state, 'media', 'query'),
  selectedPlatform: state.topics.selected.platforms.selected,
});

const fetchAsyncData = (dispatch, { topic, formValues, selectedPlatform, formatPlatformChannelData }) => {
  // call the fetcher the parent passed in to fetch the data we want to show
  dispatch(fetchAttentionByPlatformQuery(topic.topics_id, {
    platform_type: selectedPlatform.platform,
    platform_query: formValues.query,
    platform_source: selectedPlatform.source,
    platform_channel: formatPlatformChannelData ? JSON.stringify(formatPlatformChannelData(formValues)) : JSON.stringify(formValues),
    start_date: topic.start_date,
    end_date: topic.end_date,
  }));
};

export default
injectIntl(
  connect(mapStateToProps)(
    withDescription(localMessages.descriptionIntro, localMessages.helpText)(
      withAsyncData(fetchAsyncData, ['query'])(
        PlatformAttentionPreviewContainer
      )
    )
  )
);