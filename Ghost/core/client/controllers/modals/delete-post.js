var DeletePostController = Ember.Controller.extend({
    actions: {
        confirmAccept: function () {
            var self = this,
                model = this.get('model');

            // definitely want to clear the data store and post of any unsaved, client-generated tags
            model.updateTags();

            model.destroyRecord().then(function () {
                self.get('popover').closePopovers();
                self.transitionToRoute('posts.index');
                self.notifications.showSuccess('Your post has been deleted.', { delayed: true });
            }, function () {
                self.notifications.showError('Your post could not be deleted. Please try again.');
            });

        },

        confirmReject: function () {
            return false;
        }
    },
    confirm: {
        accept: {
            text: 'Delete',
            buttonClass: 'btn btn-red'
        },
        reject: {
            text: 'Cancel',
            buttonClass: 'btn btn-default btn-minor'
        }
    }
});

export default DeletePostController;
