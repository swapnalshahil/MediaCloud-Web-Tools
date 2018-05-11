import logging
from flask import jsonify, request, Response
import flask_login
import json
from mediacloud.api import MediaCloud

from server import app
import server.util.csv as csv
import server.util.tags as tag_util
from server.util.request import api_error_handler
from server.views.explorer import parse_as_sample, parse_query_with_args_and_sample_search,\
    parse_query_with_keywords, load_sample_searches, file_name_for_download
import server.views.explorer.apicache as apicache

logger = logging.getLogger(__name__)


@app.route('/api/explorer/stories/sample', methods=['GET'])
@flask_login.login_required
@api_error_handler
def api_explorer_story_sample():
    solr_q, solr_fq = parse_query_with_keywords(request.args)
 
    story_sample_result = apicache.random_story_list(solr_q, solr_fq, 50)
    return jsonify(story_sample_result)  


@app.route('/api/explorer/demo/stories/sample', methods=['GET'])
@api_error_handler
def api_explorer_demo_story_sample():
    search_id = int(request.args['search_id']) if 'search_id' in request.args else None
    
    if search_id not in [None, -1]:
        sample_searches = load_sample_searches()
        current_search = sample_searches[search_id]['queries']
        solr_query = parse_query_with_args_and_sample_search(request.args, current_search)
    else:
        solr_query = parse_query_with_keywords(request.args)
 
    story_sample_result = apicache.random_story_list(solr_query, 50)
    return jsonify(story_sample_result)  


@app.route('/api/explorer/stories/samples.csv', methods=['POST'])
def explorer_stories_csv():
    filename = u'stories'
    data = request.form
    if 'searchId' in data:
        solr_q, solr_fq = parse_as_sample(data['searchId'], data['index'])
        filename = filename  # don't have this info + current_query['q']
        # for demo users we only download 100 random stories (ie. not all matching stories)
        return _stream_story_list_csv(filename, solr_q, solr_fq, 100, MediaCloud.SORT_RANDOM, 1)
    else:
        query_object = json.loads(data['q'])
        solr_q, solr_fq = parse_query_with_keywords(query_object)
        filename = file_name_for_download(query_object['label'], filename)
        # now page through all the stories and download them
        return _stream_story_list_csv(filename, solr_q, solr_fq)


def _stream_story_list_csv(filename, q, fq, stories_per_page=500, sort=MediaCloud.SORT_PROCESSED_STORIES_ID,
                           page_limit=None):
    props = ['stories_id', 'publish_date', 'title', 'url', 'language', 'ap_syndicated',
             'themes', 'media_id', 'media_name', 'media_url',
             'media_pub_country', 'media_pub_state', 'media_language', 'media_about_country',
             'media_media_type']
    timestamped_filename = csv.safe_filename(filename)
    headers = {
        "Content-Disposition": "attachment;filename=" + timestamped_filename
    }
    return Response(_story_list_by_page_as_csv_row(q, fq, stories_per_page, sort, 5, props),
                    mimetype='text/csv; charset=utf-8', headers=headers)


# generator you can use to handle a long list of stories row by row (one row per story)
def _story_list_by_page_as_csv_row(q, fq, stories_per_page, sort, page_limit, props):
    yield u','.join(props) + u'\n'  # first send the column names
    for page in _story_list_by_page(q, fq, stories_per_page, sort, page_limit):
        for story in page:
            cleaned_row = csv.dict2row(props, story)
            row_string = u','.join(cleaned_row) + u'\n'
            yield row_string


# generator you can use to do something for each page of story results
def _story_list_by_page(q, fq, stories_per_page, sort, page_limit=None):
    last_processed_stories_id = 0  # download oldest first
    page_count = 0
    media_cache = {}  # media_id => media object
    while True:
        if (page_limit is not None) and (page_count >= page_limit):
            break
        story_page = apicache.story_list_page(q, fq, last_processed_stories_id, stories_per_page, sort)
        for s in story_page:
            # add in media metadata to the story (from lazy cache)
            media_id = s['media_id']
            if media_id not in media_cache:
                media = apicache.media(media_id)
                media_cache[media_id] = media
            media = media_cache[media_id]
            for k, v in media['metadata'].iteritems():
                s[u'media_{}'.format(k)] = v['label'] if v is not None else None
            # and add in the story metadata too
            for k, v in s['metadata'].iteritems():
                s[u'story_{}'.format(k)] = v['tag'] if v is not None else None

            story_tag_ids = [t['tags_id'] for t in s['story_tags']]
            # add in the names of any themes
            if tag_util.NYT_LABELER_1_0_0_TAG_ID in story_tag_ids:
                        s['themes'] = ", ".join([t['tag'] for t in s['story_tags']
                                                if t['tag_sets_id'] == tag_util.NYT_LABELS_TAG_SET_ID])
        yield story_page
        if len(story_page) < stories_per_page:  # this is the last page so bail out
            break
        last_processed_stories_id = story_page[-1]['processed_stories_id']
        page_count += 1


@app.route('/api/explorer/story/count', methods=['GET'])
@flask_login.login_required
@api_error_handler
def api_explorer_story_count():
    solr_q, solr_fq = parse_query_with_keywords(request.args)
    story_count_result = apicache.story_count(solr_q, solr_fq)
    return jsonify(story_count_result)  


@app.route('/api/explorer/demo/story/count', methods=['GET'])
@api_error_handler
def api_explorer_demo_story_count():
    search_id = int(request.args['search_id']) if 'search_id' in request.args else None
    if search_id not in [None, -1]:
        sample_searches = load_sample_searches()
        current_search = sample_searches[search_id]['queries']
        solr_q, solr_fq = parse_query_with_args_and_sample_search(request.args, current_search)
    else:
        solr_q, solr_fq = parse_query_with_keywords(request.args)

    story_count_result = apicache.story_count(solr_q, solr_fq)
    # maybe check admin role before we run this?
    return jsonify(story_count_result)  # give them back new data, so they can update the client


@app.route('/api/explorer/stories/count.csv', methods=['POST'])
def explorer_story_count_csv():
    filename = u'story-count'
    story_count_results = []
    data = request.form
    if 'searchId' in data:
        # TODO: don't load this query twice because that is kind of dumb
        solr_q, solr_fq = parse_as_sample(data['searchId'], data['index'])
        filename = filename  # don't have this info + current_query['q']
        sample_searches = load_sample_searches()
        query_object = sample_searches[data['searchId']]['queries'][data['index']]
        label = query_object['label']
    else:
        query_object = json.loads(data['q'])
        solr_q, solr_fq = parse_query_with_keywords(query_object)
        label = query_object['label']
        filename = file_name_for_download(label, filename)
    # sentence count needs dates to be sent explicitly -TODO check what has priority
    story_count = apicache.story_count(solr_q, solr_fq)
    story_count_results.append({'query': label, 'count': story_count['count']})
    props = ['query', 'count']
    return csv.stream_response(story_count_results, props, filename)
