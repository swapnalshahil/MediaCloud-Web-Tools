import React from 'react';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { push } from 'react-router-redux';
import { Grid } from 'react-flexbox-grid/lib';
import composeIntlForm from '../../common/IntlForm';
import SourceOrCollectionChip from '../../common/SourceOrCollectionChip';
import messages from '../../../resources/messages';
import { createTopic, goToCreateTopicStep } from '../../../actions/topicActions';
import { updateFeedback, addNotice } from '../../../actions/appActions';
import AppButton from '../../common/AppButton';
import { hasPermissions, PERMISSION_TOPIC_ADMIN } from '../../../lib/auth';
import { LEVEL_ERROR, WarningNotice } from '../../common/Notice';
import { MAX_RECOMMENDED_STORIES, MIN_RECOMMENDED_STORIES } from '../../../lib/formValidators';

const localMessages = {
  title: { id: 'topic.create.confirm.title', defaultMessage: 'Step 3: Confirm Your New Topic' },
  name: { id: 'topic.create.confirm.name', defaultMessage: 'Name' },
  description: { id: 'topic.create.confirm.description', defaultMessage: 'Description' },
  state: { id: 'topic.create.state', defaultMessage: 'Not yet saved.' },
  storyCount: { id: 'topic.create.story.count', defaultMessage: 'Seed Stories' },
  topicSaved: { id: 'topic.create.saved', defaultMessage: 'We saved your new Topic.' },
  topicNotSaved: { id: 'topic.create.notSaved', defaultMessage: 'That didn\'t work!' },
  feedback: { id: 'topic.create.feedback', defaultMessage: 'Successfully created your new topic!' },
  createTopic: { id: 'topic.create', defaultMessage: 'Create Topic' },
  notEnoughStories: { id: 'topic.create.notenough', defaultMessage: "Sorry, we can't save this topic because you need a minimum of 500 seed stories." },
  tooManyStories: { id: 'topic.create.toomany', defaultMessage: "Sorry, we can't save this topic because you need to select less than 100K seed stories." },
};

const TopicCreate3ConfirmContainer = (props) => {
  const { formValues, finishStep, handlePreviousStep, storyCount } = props;
  const { formatMessage } = props.intl;

  let sourcesAndCollections = [];
  sourcesAndCollections = formValues.sourcesAndCollections.filter(s => s.media_id).map(s => s.media_id);
  sourcesAndCollections.concat(formValues.sourcesAndCollections.filter(s => s.tags_id).map(s => s.tags_id));
  return (
    <Grid className="topic-container">
      <h2>
        <FormattedMessage {...localMessages.title} />
      </h2>
      <WarningNotice ><FormattedMessage {...localMessages.state} /></WarningNotice >
      <p>
        <b><FormattedMessage {...localMessages.name} /></b>: {formValues.name}
        <br />
        <b><FormattedMessage {...localMessages.description} /></b>: {formValues.description}
      </p>
      <p>
        <b><FormattedMessage {...messages.topicPublicProp} /></b>: { formValues.is_public ? formatMessage(messages.yes) : formatMessage(messages.no) }
        <br />
        <b><FormattedMessage {...messages.topicStartDateProp} /></b>: {formValues.start_date}
        <br />
        <b><FormattedMessage {...messages.topicEndDateProp} /></b>: {formValues.end_date}
        <br />
        <b><FormattedMessage {...localMessages.storyCount} /></b>: {storyCount}
      </p>
      <p>
        <b><FormattedHTMLMessage {...messages.topicQueryProp} /></b>: <code>{formValues.solr_seed_query}</code>
      </p>
      <p>
        <b><FormattedHTMLMessage {...messages.topicSourceCollectionsProp} /></b>:
      </p>
      {formValues.sourcesAndCollections.map(object => <SourceOrCollectionChip key={object.tags_id || object.media_id} object={object} />)}
      <br />
      <AppButton flat label={formatMessage(messages.previous)} onClick={() => handlePreviousStep()} />
      &nbsp; &nbsp;
      <AppButton type="submit" label={formatMessage(localMessages.createTopic)} primary onClick={() => finishStep()} />
    </Grid>
  );
};

TopicCreate3ConfirmContainer.propTypes = {
  // from parent

  initialValues: React.PropTypes.object,
  // form context
  intl: React.PropTypes.object.isRequired,
  handleCreateTopic: React.PropTypes.func.isRequired,
  submitting: React.PropTypes.bool,
  // from state
  formValues: React.PropTypes.object.isRequired,
  // from dispatch
  finishStep: React.PropTypes.func.isRequired,
  handlePreviousStep: React.PropTypes.func.isRequired,
  storyCount: React.PropTypes.number,
};

const mapStateToProps = state => ({
  formValues: state.form.topicForm.values,
  storyCount: state.topics.create.preview.matchingStoryCounts.count,
  user: state.user,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  handlePreviousStep: () => {
    dispatch(goToCreateTopicStep(1));
  },
  handleCreateTopic: (storyCount, user, values) => {
    if (storyCount > MIN_RECOMMENDED_STORIES &&
      (storyCount < MAX_RECOMMENDED_STORIES || hasPermissions(user, PERMISSION_TOPIC_ADMIN))) { // if proper range of seed stories
      const queryInfo = {
        name: values.name,
        description: values.description,
        start_date: values.start_date,
        end_date: values.end_date,
        solr_seed_query: values.solr_seed_query,
        max_iterations: values.max_iterations,
        ch_monitor_id: values.ch_monitor_id === undefined ? '' : values.ch_monitor_id,
        is_public: values.is_public === undefined ? false : values.is_public,
        twitter_topics_id: values.twitter_topics_id,
      };
      queryInfo.is_public = queryInfo.is_public ? 1 : 0;
      if ('sourcesAndCollections' in values) {
        queryInfo['sources[]'] = values.sourcesAndCollections.filter(s => s.media_id).map(s => s.media_id);
        queryInfo['collections[]'] = values.sourcesAndCollections.filter(s => s.tags_id).map(s => s.tags_id);
      } else {
        queryInfo['sources[]'] = '';
        queryInfo['collections[]'] = '';
      }
      dispatch(createTopic(queryInfo)).then((results) => {
        if (results.topics_id) {
          // let them know it worked
          dispatch(updateFeedback({ open: true, message: ownProps.intl.formatMessage(localMessages.feedback) }));
          dispatch(push(`/topics/${results.topics_id}/summary`));
        } else {
          dispatch(updateFeedback({ open: true, message: ownProps.intl.formatMessage(localMessages.failed) }));
        }
      });
    } else if (storyCount < MIN_RECOMMENDED_STORIES) {
      dispatch(updateFeedback({ open: true, message: ownProps.intl.formatMessage(localMessages.notEnoughStories) }));
      dispatch(addNotice({ level: LEVEL_ERROR, message: ownProps.intl.formatMessage(localMessages.notEnoughStories) }));
    } else if (storyCount > MAX_RECOMMENDED_STORIES) {
      dispatch(updateFeedback({ open: true, message: ownProps.intl.formatMessage(localMessages.tooManyStories) }));
      dispatch(addNotice({ level: LEVEL_ERROR, message: ownProps.intl.formatMessage(localMessages.tooManyStories) }));
    }
  },
});

function mergeProps(stateProps, dispatchProps, ownProps) {
  return Object.assign({}, stateProps, dispatchProps, ownProps, {
    finishStep: () => {
      dispatchProps.handleCreateTopic(stateProps.storyCount, stateProps.user, stateProps.formValues);
    },
  });
}

const reduxFormConfig = {
  form: 'topicForm',
  destroyOnUnmount: false,  // so the wizard works
};

export default
  injectIntl(
    composeIntlForm(
      reduxForm(reduxFormConfig)(
        connect(mapStateToProps, mapDispatchToProps, mergeProps)(
          TopicCreate3ConfirmContainer
        )
      )
    )
  );
