import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { toggleMedia, selectMedia, selectMediaPickerQueryArgs, resetMediaPickerSources, resetMediaPickerCollections, resetMetadataShortlist } from '../../../actions/systemActions';
import { PICK_SOURCE_AND_COLLECTION, PICK_FEATURED } from '../../../lib/explorerUtil';
import * as fetchConstants from '../../../lib/fetchConstants';
import AllMediaSearchResultsContainer from './results/AllMediaSearchResultsContainer';
import FeaturedFavoriteGeoSearchResultsContainer from './results/FeaturedFavoriteGeoSearchResultsContainer';
import { VALID_COLLECTION_IDS } from '../../../lib/tagUtil';

class MediaPickerResultsContainer extends React.Component {
  UNSAFE_componentWillMount() {
    this.correlateSelection(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.selectedMediaQueryType !== this.props.selectedMediaQueryType) {
      this.updateMediaQuery({ type: nextProps.selectedMediaQueryType, tags: {}, keyword: '' });
    }
    if (nextProps.selectedMedia !== this.props.selectedMedia
      // if the results have changed from a keyword entry, we need to update the UI
      || (nextProps.sourceResults && nextProps.sourceResults.lastFetchSuccess !== this.props.sourceResults.lastFetchSuccess)
      || (nextProps.collectionResults && nextProps.collectionResults.lastFetchSuccess !== this.props.collectionResults.lastFetchSuccess)) {
      this.correlateSelection(nextProps);
    }
  }

  updateMediaQuery(values) {
    const { updateMediaQuerySelection } = this.props;
    updateMediaQuerySelection(values, { mediaKeyword: this.props.selectedMediaQueryKeyword });
  }

  correlateSelection(whichProps) {
    let whichList = {};
    if (whichProps.selectedMediaQueryType === undefined) return 0;
    switch (whichProps.selectedMediaQueryType) {
      case PICK_FEATURED: // this case is handled in FeaturedFavoriteGeo...Container
        whichList = whichProps.collectionResults.list;
        break;
      case PICK_SOURCE_AND_COLLECTION:
        whichList = [].concat(whichProps.sourceResults.list).concat(whichProps.collectionResults.list);
        break;
      default:
        break;
    }
    // if selected media has changed, update current results
    if (whichProps.selectedMedia
      // we can't be sure we have received results yet
      && whichList && whichList.length > 0) {
      // sync up selectedMedia and push to result sets.
      whichList.map((m) => {
        const mediaIndex = whichProps.selectedMedia.findIndex(q => q.id === m.id);
        if (mediaIndex < 0) {
          this.props.toggleConcurrency(m, false);
        } else if (mediaIndex >= 0) {
          this.props.toggleConcurrency(m, true);
        }
        return m;
      });
    }
    return 0;
  }

  render() {
    const { viewOnly, selectedMediaQueryType, toggleConcurrency, updateMediaQuerySelection, handleToggleSelected } = this.props;
    let content = null;
    const whichMedia = {};
    whichMedia.fetchStatus = null;
    switch (selectedMediaQueryType) {
      case PICK_SOURCE_AND_COLLECTION:
        content = (
          <AllMediaSearchResultsContainer
            whichTagSet={VALID_COLLECTION_IDS}
            onToggleSelected={handleToggleSelected}
            handleMediaConcurrency={toggleConcurrency}
            updateMediaQuerySelection={updateMediaQuerySelection}
            viewOnly={viewOnly}
          />
        );
        break;
      case PICK_FEATURED:
        content = (
          <FeaturedFavoriteGeoSearchResultsContainer
            whichTagSet={VALID_COLLECTION_IDS}
            handleMediaConcurrency={toggleConcurrency}
            onToggleSelected={handleToggleSelected}
            viewOnly={viewOnly}
          />
        );
        break;
      default:
        break;
    }
    return (
      <div className="select-media-container">
        {content}
      </div>
    );
  }
}

MediaPickerResultsContainer.propTypes = {
  intl: PropTypes.object.isRequired,
  toggleConcurrency: PropTypes.func.isRequired,
  handleToggleSelected: PropTypes.func.isRequired,
  updateMediaQuerySelection: PropTypes.func.isRequired,
  selectedMediaQueryType: PropTypes.number,
  selectedMediaQueryKeyword: PropTypes.string,
  resetComponents: PropTypes.func.isRequired,
  featured: PropTypes.object,
  favoritedCollections: PropTypes.object,
  favoritedSources: PropTypes.object,
  collectionResults: PropTypes.object,
  sourceResults: PropTypes.object,
  selectedMedia: PropTypes.array,
  viewOnly: PropTypes.bool,
};

const mapStateToProps = state => ({
  fetchStatus: (state.system.mediaPicker.sourceQueryResults.fetchStatus === fetchConstants.FETCH_SUCCEEDED || state.system.mediaPicker.collectionQueryResults.fetchStatus === fetchConstants.FETCH_SUCCEEDED || state.system.mediaPicker.favoritedCollections.fetchStatus === fetchConstants.FETCH_SUCCEEDED) ? fetchConstants.FETCH_SUCCEEDED : fetchConstants.FETCH_INVALID,
  selectedMedia: state.system.mediaPicker.selectMedia.list,
  selectedMediaQueryType: state.system.mediaPicker.selectMediaQuery ? state.system.mediaPicker.selectMediaQuery.args.type : null,
  selectedMediaQueryKeyword: state.system.mediaPicker.selectMediaQuery ? state.system.mediaPicker.selectMediaQuery.args.mediaKeyword : null,
  collectionResults: state.system.mediaPicker.collectionQueryResults,
  featured: state.system.mediaPicker.featured ? state.system.mediaPicker.featured : null,
  sourceResults: state.system.mediaPicker.sourceQueryResults,
  favoritedCollections: state.system.mediaPicker.favoritedCollections ? state.system.mediaPicker.favoritedCollections : null,
  favoritedSources: state.system.mediaPicker.favoritedSources ? state.system.mediaPicker.favoritedSources : null,
});

const mapDispatchToProps = dispatch => ({
  updateMediaQuerySelection: (values) => {
    if (values) {
      dispatch(selectMediaPickerQueryArgs(values));
    }
  },
  toggleConcurrency: (selectedMedia, onOrOff) => {
    if (selectedMedia) {
      dispatch(toggleMedia({ selectedMedia, setSelected: onOrOff })); // for search results selectedMedia >> results
    }
  },
  handleToggleSelected: (selectedMedia) => {
    if (selectedMedia) {
      dispatch(selectMedia(selectedMedia));
    }
  },
  resetComponents: () => {
    dispatch(resetMediaPickerSources());
    dispatch(resetMediaPickerCollections());
    dispatch(resetMetadataShortlist());
  },
});

export default
injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(
    MediaPickerResultsContainer
  )
);
