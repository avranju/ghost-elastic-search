import PaginationControllerMixin from 'ghost/mixins/pagination-controller';

function publishedAtCompare(item1, item2) {
    var published1 = item1.get('published_at'),
        published2 = item2.get('published_at');

    if (!published1 && !published2) {
        return 0;
    }

    if (!published1 && published2) {
        return -1;
    }

    if (!published2 && published1) {
        return 1;
    }

    return Ember.compare(published1.valueOf(), published2.valueOf());
}


var PostsController = Ember.ArrayController.extend(PaginationControllerMixin, {
    // this will cause the list to re-sort when any of these properties change on any of the models
    sortProperties: ['status', 'published_at', 'updated_at'],

    // override Ember.SortableMixin
    //
    // this function will keep the posts list sorted when loading individual/bulk
    // models from the server, even if records in between haven't been loaded.
    // this can happen when reloading the page on the Editor or PostsPost routes.
    //
    // a custom sort function is needed in order to sort the posts list the same way the server would:
    //     status: ASC
    //     published_at: DESC
    //     updated_at: DESC
    orderBy: function (item1, item2) {
        var updated1 = item1.get('updated_at'),
            updated2 = item2.get('updated_at'),
            statusResult,
            updatedAtResult,
            publishedAtResult;

        // when `updated_at` is undefined, the model is still
        // being written to with the results from the server
        if (item1.get('isNew') || !updated1) {
            return -1;
        }

        if (item2.get('isNew') || !updated2) {
            return 1;
        }

        statusResult = Ember.compare(item1.get('status'), item2.get('status'));
        updatedAtResult = Ember.compare(updated1.valueOf(), updated2.valueOf());
        publishedAtResult = publishedAtCompare(item1, item2);

        if (statusResult === 0) {
            if (publishedAtResult === 0) {
                // This should be DESC
                return updatedAtResult * -1;
            }
            // This should be DESC
            return publishedAtResult * -1;
        }

        return statusResult;
    },

    init: function () {
        //let the PaginationControllerMixin know what type of model we will be paginating
        //this is necesariy because we do not have access to the model inside the Controller::init method
        this._super({'modelType': 'post'});

    },

    actions: {
        resetContentPreview: function () {
            $('.content-list').removeAttr('style');
            $('.content-preview').removeAttr('style');
        },

        showContentPreview: function () {
            $('.content-list').animate({right: '100%', left: '-100%', 'margin-right': '15px'}, 300);
            $('.content-preview').animate({right: '0', left: '0', 'margin-left': '0'}, 300);
        },

        hideContentPreview: function () {
            $('.content-list').animate({right: '0', left: '0', 'margin-right': '0'}, 300);
            $('.content-preview').animate({right: '-100%', left: '100%', 'margin-left': '15px'}, 300);
        },
    }
});

export default PostsController;
