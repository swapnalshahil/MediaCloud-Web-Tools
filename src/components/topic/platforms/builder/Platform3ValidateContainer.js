import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import withIntlForm from '../../../common/hocs/IntlForm';
import withAsyncData from '../../../common/hocs/AsyncDataContainer';
import AppButton from '../../../common/AppButton';
import StoryFeedbackRow from '../../../common/StoryFeedbackRow';
import { goToCreatePlatformStep, fetchStoriesByPlatformQuery } from '../../../../actions/topicActions';
import { formatTopicPlatformPreviewQuery } from '../../../util/topicUtil';

const NUM_TO_SHOW = 30;
const VALIDATION_CUTOFF = 0.9;

const localMessages = {
  warningTitle: { id: 'topic.modify.validate.warningTitle', defaultMessage: 'Relevance Low' },
  warning: { id: 'topic.modify.validate.warning',
    defaultMessage: 'It seems that not enough of the stories are relevant to the topic you\'re researching. We recommend at least 90% of stories from the list presented must be relevant for the topic to work well. We suggest going back to your query and try either changing the search terms (to narrow in a bit more), your time period (to focus around any key events), or media sources (to specify media from the place you care about). If you\'re unable to generate relevant stories after that, please feel free to reach us at support@mediacloud.org for help.' },
  randomStory: { id: 'topic.modify.validate.randomStory', defaultMessage: 'Random Story' },
  usefulStory: { id: 'topic.modify.validate.randomStory', defaultMessage: 'Is this Relevant?' },
  prev: { id: 'topic.modify.warning.prev', defaultMessage: 'back to preview' },
  next: { id: 'topic.modify.warning.next', defaultMessage: 'review and confirm' },
  warningIgnore: { id: 'topic.modify.warning.warningIgnore', defaultMessage: 'Ignore and {mode} Topic Anyway' },
  warningOk: { id: 'topic.modify.warning.warningOk', defaultMessage: 'I\'ll edit my seed query' },
};

class Platform3ValidateContainer extends React.Component {
  state = {
    matchCount: 0,
    warningOpen: false,
  };

  handleWarningOk = () => {
    const { handleEditSeedQueryRequest } = this.props;
    this.setState({ warningOpen: false });
    handleEditSeedQueryRequest();
  }

  handleWarningIgnore = () => {
    const { handleNextStep } = this.props;
    handleNextStep();
  }

  handleYesClick = (options, prevSelection) => {
    if (prevSelection === options.match) {
      this.setState(prevState => ({ matchCount: prevState.matchCount - 1 }));
    } else {
      this.setState(prevState => ({ matchCount: prevState.matchCount + 1 }));
    }
  }

  handleNoClick = (options, prevSelection) => {
    if (prevSelection === options.match) {
      this.setState(prevState => ({ matchCount: prevState.matchCount - 1 }));
    }
  }

  handleConfirm = () => {
    const { handleNextStep, total } = this.props;
    if (this.state.matchCount >= (VALIDATION_CUTOFF * total)) {
      handleNextStep();
    } else {
      this.setState({ warningOpen: true });
    }
  }

  render = () => {
    const { handlePreviousStep, stories, mode, currentPlatform } = this.props;
    const { formatMessage } = this.props.intl;

    return (
      <Grid>
        <h1>{currentPlatform}</h1>
        <br />
        <Row start="lg" className="topic-modify-sample-story-table">
          <Col lg={12}>
            <Row start="lg" className="topic-modify-sample-story-table-header">
              <Col lg={8} className="topic-modify-story-title-col">
                <b><FormattedMessage {...localMessages.randomStory} /></b>
              </Col>
              <Col lg={4} className="topic-modify-match-col">
                <b><FormattedMessage {...localMessages.usefulStory} /></b>
              </Col>
            </Row>
          </Col>
          <Col lg={12}>
            <Row start="lg" className="topic-modify-sample-story-container">
              <Col lg={12}>
                {stories.map(story => (
                  <StoryFeedbackRow
                    key={story.stories_id}
                    story={story}
                    maxTitleLength={85}
                    handleYesClick={this.handleYesClick}
                    handleNoClick={this.handleNoClick}
                  />
                ))}
              </Col>
            </Row>
          </Col>
        </Row>
        <br />
        <Row>
          <Col lg={12} md={12} sm={12}>
            <AppButton label={formatMessage(localMessages.prev)} onClick={() => handlePreviousStep()} />
            &nbsp; &nbsp;
            <AppButton
              type="submit"
              label={formatMessage(localMessages.next)}
              primary
              onClick={() => this.handleConfirm(mode)}
            />
          </Col>
        </Row>
        <Dialog
          disableBackdropClick
          disableEscapeKeyDown
          aria-labelledby="confirmation-dialog-title"
          open={this.state.warningOpen}
          onClose={this.handleWarningOk}
        >
          <DialogTitle id="confirmation-dialog-title">
            <FormattedMessage {...localMessages.warningTitle} />
          </DialogTitle>
          <DialogContent>
            <p>
              <FormattedMessage {...localMessages.warning} />
            </p>
          </DialogContent>
          <DialogActions>
            <AppButton label={formatMessage(localMessages.warningIgnore, { mode })} onClick={this.handleWarningIgnore}>
              <FormattedMessage {...localMessages.warningIgnore} values={{ mode }} />
            </AppButton>
            <AppButton label={formatMessage(localMessages.warningOk)} onClick={this.handleWarningOk} primary>
              <FormattedMessage {...localMessages.warningOk} />
            </AppButton>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  }
}

Platform3ValidateContainer.propTypes = {
  // from parent
  location: PropTypes.object.isRequired,
  currentStepText: PropTypes.object,
  mode: PropTypes.string, // .isRequired,
  handlePreviousStep: PropTypes.func,
  handleNextStep: PropTypes.func, // .isRequired,
  // form composition
  intl: PropTypes.object.isRequired,
  // from state
  // platforms: PropTypes.array.isRequired,
  topicId: PropTypes.number.isRequired,
  currentTopicQuery: PropTypes.object,
  currentPlatform: PropTypes.string,
  currentQuery: PropTypes.string,
  fetchStatus: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  stories: PropTypes.array.isRequired,
  // from dispatch
  handleEditSeedQueryRequest: PropTypes.func.isRequired,
  // from form
  formData: PropTypes.object,
};

const mapStateToProps = state => ({
  currentStep: state.topics.selected.platforms.preview.workflow.currentStep,
  fetchStatus: state.topics.selected.platforms.preview.matchingStories.fetchStatus,
  total: state.topics.selected.platforms.preview.matchingStories.total,
  stories: state.topics.selected.platforms.preview.matchingStories.list,
  currentTopicQuery: state.topics.selected.info,
  currentPlatform: state.form.platform.values.currentPlatform,
  currentQuery: state.form.platform.values.query,
});

const mapDispatchToProps = dispatch => ({
  handleEditSeedQueryRequest: () => {
    dispatch(goToCreatePlatformStep(0));
  },
  handlePreviousStep: () => {
    dispatch(goToCreatePlatformStep(1));
  },
  handleNextStep: () => {
    dispatch(goToCreatePlatformStep(3));
  },
});

const fetchAsyncData = (dispatch, { topicId, currentTopicQuery, currentPlatform, currentQuery }) => {
  const infoForQuery = {
    ...formatTopicPlatformPreviewQuery(currentTopicQuery, currentPlatform, currentQuery, 'medicloud'), // TODO
    limit: NUM_TO_SHOW,
  };
  dispatch(fetchStoriesByPlatformQuery(topicId, { ...infoForQuery }));
};

export default
injectIntl(
  withIntlForm(
    connect(mapStateToProps, mapDispatchToProps)(
      withAsyncData(fetchAsyncData)(
        Platform3ValidateContainer
      )
    )
  )
);
