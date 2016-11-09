import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import OrderedWordCloud from '../../vis/OrderedWordCloud';
import { fetchSourceTopWords } from '../../../actions/sourceActions';
import composeAsyncContainer from '../../common/AsyncContainer';
import DataCard from '../../common/DataCard';
import messages from '../../../resources/messages';
import composeHelpfulContainer from '../../common/HelpfulContainer';
import { DownloadButton } from '../../common/IconButton';

const localMessages = {
  title: { id: 'source.summary.topWords.title', defaultMessage: 'Top Words' },
  intro: { id: 'source.summary.topWords.info',
    defaultMessage: '<p>This wordcloud shows you the most commonly used words in this source (based on a sample of sentences). Click a word to load a Dashboard search showing you how the this source writes about it.</p>' },
  helpTitle: { id: 'source.summary.sentenceCount.help.title', defaultMessage: 'About Top Words' },
};

class SourceTopWordsContainer extends React.Component {

  downloadCsv = () => {
    const { source } = this.props;
    const url = `/api/sources/${source.media_id}/words/wordcount.csv`;
    window.location = url;
  }
  render() {
    const { words, handleWordClick, helpButton } = this.props;
    const { formatMessage } = this.props.intl;
    return (
      <DataCard>
        <div className="actions">
          <DownloadButton tooltip={formatMessage(messages.download)} onClick={this.downloadCsv} />
        </div>
        <h2>
          <FormattedMessage {...localMessages.title} />
          {helpButton}
        </h2>
        <OrderedWordCloud words={words} onWordClick={handleWordClick} />
      </DataCard>
    );
  }
}

SourceTopWordsContainer.propTypes = {
  // from parent
  source: React.PropTypes.object.isRequired,
  // from state
  fetchStatus: React.PropTypes.string.isRequired,
  words: React.PropTypes.array,
  // from dispatch
  asyncFetch: React.PropTypes.func.isRequired,
  handleWordClick: React.PropTypes.func.isRequired,
  // from composition
  intl: React.PropTypes.object.isRequired,
  helpButton: React.PropTypes.node.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.sources.selected.details.sourceDetailsReducer.topWords.fetchStatus,
  words: state.sources.selected.details.sourceDetailsReducer.topWords.list.wordcounts,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  asyncFetch: () => {
    dispatch(fetchSourceTopWords(ownProps.source.media_id));
  },
  handleWordClick: (word) => {
    const { source } = ownProps;
    const searchStr = `${word.stem}*`;
    const url = `https://dashboard.mediacloud.org/#query/["${searchStr}"]/[{"sources":[${source.media_id}]}]/["${source.health.start_date.substring(0, 10)}"]/["${source.health.end_date.substring(0, 10)}"]/[{"uid":3,"name":"${source.name}","color":"55868A"}]`;
    window.open(url, '_blank');
  },
});

export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(
      composeHelpfulContainer(localMessages.helpTitle, [localMessages.intro, messages.wordcloudHelpText])(
        composeAsyncContainer(
          SourceTopWordsContainer
        )
      )
    )
  );
