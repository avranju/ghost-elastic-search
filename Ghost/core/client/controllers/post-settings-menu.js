/* global moment */
import {parseDateString, formatDate} from 'ghost/utils/date-formatting';
import SlugGenerator from 'ghost/models/slug-generator';
import boundOneWay from 'ghost/utils/bound-one-way';

var PostSettingsMenuController = Ember.ObjectController.extend({
    //State for if the user is viewing a tab's pane.
    needs: 'application',

    isViewingSubview: Ember.computed('controllers.application.showRightOutlet', function (key, value) {
        // Not viewing a subview if we can't even see the PSM
        if (!this.get('controllers.application.showRightOutlet')) {
            return false;
        }
        if (arguments.length > 1) {
            return value;
        }
        return false;
    }),
    selectedAuthor: null,
    initializeSelectedAuthor: function () {
        var self = this;

        return this.get('author').then(function (author) {
            self.set('selectedAuthor', author);
            return author;
        });
    }.observes('model'),

    changeAuthor: function () {
        var author = this.get('author'),
            selectedAuthor = this.get('selectedAuthor'),
            model = this.get('model'),
            self = this;
        //return if nothing changed
        if (selectedAuthor.get('id') === author.get('id')) {
            return;
        }
        model.set('author', selectedAuthor);

        //if this is a new post (never been saved before), don't try to save it
        if (this.get('isNew')) {
            return;
        }

        model.save().catch(function (errors) {
            self.showErrors(errors);
            self.set('selectedAuthor', author);
            model.rollback();
        });
    }.observes('selectedAuthor'),
    authors: Ember.computed(function () {
        //Loaded asynchronously, so must use promise proxies.
        var deferred = {};

        deferred.promise = this.store.find('user', {limit: 'all'}).then(function (users) {
            return users.rejectBy('id', 'me').sortBy('name');
        }).then(function (users) {
            return users.filter(function (user) {
                return user.get('active');
            });
        });

        return Ember.ArrayProxy
            .extend(Ember.PromiseProxyMixin)
            .create(deferred);
    }),
    /**
     * The placeholder is the published date of the post,
     * or the current date if the pubdate has not been set.
     */
    publishedAtPlaceholder: Ember.computed('publishedAtValue', function () {
        var pubDate = this.get('published_at');
        if (pubDate) {
            return formatDate(pubDate);
        }
        return formatDate(moment());
    }),
    publishedAtValue: boundOneWay('published_at', formatDate),

    slugValue: boundOneWay('slug'),
    //Lazy load the slug generator for slugPlaceholder
    slugGenerator: Ember.computed(function () {
        return SlugGenerator.create({
            ghostPaths: this.get('ghostPaths'),
            slugType: 'post'
        });
    }),
    //Requests slug from title
    generateSlugPlaceholder: function () {
        var self = this,
            title = this.get('titleScratch');

        this.get('slugGenerator').generateSlug(title).then(function (slug) {
            self.set('slugPlaceholder', slug);
        });
    },

    metaTitleScratch: boundOneWay('meta_title'),
    metaDescriptionScratch: boundOneWay('meta_description'),

    seoTitle: Ember.computed('titleScratch', 'metaTitleScratch', function () {
        var metaTitle = this.get('metaTitleScratch') || '';

        return metaTitle.length > 0 ? metaTitle : this.get('titleScratch');
    }),

    seoDescription: Ember.computed('scratch', 'metaDescriptionScratch', function () {
        var metaDescription = this.get('metaDescriptionScratch') || '',
            el,
            html = '',
            placeholder;

        if (metaDescription.length > 0) {
            placeholder = metaDescription;
        } else {
            el = $('.rendered-markdown');

            // Get rendered markdown
            if (!_.isUndefined(el) && el.length > 0) {
                html = el.clone();
                html.find('.image-uploader').remove();
                html = html[0].innerHTML;
            }

            // Strip HTML
            placeholder = $('<div />', { html: html }).text();
            // Replace new lines and trim
            placeholder = placeholder.replace(/\n+/g, ' ').trim();
        }

        if (placeholder.length > 156) {
            // Limit to 156 characters
            placeholder = placeholder.substring(0,156).trim();
            placeholder = Ember.Handlebars.Utils.escapeExpression(placeholder);
            placeholder = new Ember.Handlebars.SafeString(placeholder + '&hellip;');
        }

        return placeholder;
    }),

    seoSlug: Ember.computed('slug', 'slugPlaceholder', function () {
        return this.get('slug') ? this.get('slug') : this.get('slugPlaceholder');
    }),

    // observe titleScratch, keeping the post's slug in sync
    // with it until saved for the first time.
    addTitleObserver: function () {
        if (this.get('isNew')) {
            this.addObserver('titleScratch', this, 'titleObserver');
        }
    }.observes('model'),
    titleObserver: function () {
        if (this.get('isNew') && !this.get('title')) {
            Ember.run.debounce(this, 'generateSlugPlaceholder', 700);
        }
    },
    slugPlaceholder: Ember.computed(function (key, value) {
        var slug = this.get('slug');

        //If the post has a slug, that's its placeholder.
        if (slug) {
            return slug;
        }

        //Otherwise, it's whatever value was set by the
        //  slugGenerator (below)
        if (arguments.length > 1) {
            return value;
        }
        //The title will stand in until the actual slug has been generated
        return this.get('titleScratch');
    }),

    showErrors: function (errors) {
        errors = Ember.isArray(errors) ? errors : [errors];
        this.notifications.showErrors(errors);
    },
    showSuccess: function (message) {
        this.notifications.showSuccess(message);
    },
    actions: {
        togglePage: function () {
            var self = this;

            this.toggleProperty('page');
            // If this is a new post.  Don't save the model.  Defer the save
            // to the user pressing the save button
            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },

        toggleFeatured: function () {
            var self = this;

            this.toggleProperty('featured');
            // If this is a new post.  Don't save the model.  Defer the save
            // to the user pressing the save button
            if (this.get('isNew')) {
                return;
            }

            this.get('model').save(this.get('saveOptions')).catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },
        /**
         * triggered by user manually changing slug
         */
        updateSlug: function (newSlug) {
            var slug = this.get('slug'),
                self = this;

            newSlug = newSlug || slug;

            newSlug = newSlug && newSlug.trim();

            // Ignore unchanged slugs or candidate slugs that are empty
            if (!newSlug || slug === newSlug) {
                // reset the input to its previous state
                this.set('slugValue', slug);

                return;
            }

            this.get('slugGenerator').generateSlug(newSlug).then(function (serverSlug) {
                // If after getting the sanitized and unique slug back from the API
                // we end up with a slug that matches the existing slug, abort the change
                if (serverSlug === slug) {
                    return;
                }

                // Because the server transforms the candidate slug by stripping
                // certain characters and appending a number onto the end of slugs
                // to enforce uniqueness, there are cases where we can get back a
                // candidate slug that is a duplicate of the original except for
                // the trailing incrementor (e.g., this-is-a-slug and this-is-a-slug-2)

                // get the last token out of the slug candidate and see if it's a number
                var slugTokens = serverSlug.split('-'),
                    check = Number(slugTokens.pop());

                // if the candidate slug is the same as the existing slug except
                // for the incrementor then the existing slug should be used
                if (_.isNumber(check) && check > 0) {
                    if (slug === slugTokens.join('-') && serverSlug !== newSlug) {
                        self.set('slugValue', slug);

                        return;
                    }
                }

                self.set('slug', serverSlug);

                if (self.hasObserverFor('titleScratch')) {
                    self.removeObserver('titleScratch', self, 'titleObserver');
                }

                // If this is a new post.  Don't save the model.  Defer the save
                // to the user pressing the save button
                if (self.get('isNew')) {
                    return;
                }

                return self.get('model').save();
            }).catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },

        /**
         * Parse user's set published date.
         * Action sent by post settings menu view.
         * (#1351)
         */
        setPublishedAt: function (userInput) {
            var errMessage = '',
                newPublishedAt = parseDateString(userInput),
                publishedAt = this.get('published_at'),
                self = this;

            if (!userInput) {
                //Clear out the published_at field for a draft
                if (this.get('isDraft')) {
                    this.set('published_at', null);
                }
                return;
            }

            // Validate new Published date
            if (!newPublishedAt.isValid()) {
                errMessage = 'Published Date must be a valid date with format: ' +
                    'DD MMM YY @ HH:mm (e.g. 6 Dec 14 @ 15:00)';
            }
            if (newPublishedAt.diff(new Date(), 'h') > 0) {
                errMessage = 'Published Date cannot currently be in the future.';
            }

            //If errors, notify and exit.
            if (errMessage) {
                this.showErrors(errMessage);
                return;
            }

            // Do nothing if the user didn't actually change the date
            if (publishedAt && publishedAt.isSame(newPublishedAt)) {
                return;
            }

            //Validation complete
            this.set('published_at', newPublishedAt);

            // If this is a new post.  Don't save the model.  Defer the save
            // to the user pressing the save button
            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },

        setMetaTitle: function (metaTitle) {
            var self = this,
                currentTitle = this.get('meta_title') || '';

            // Only update if the title has changed
            if (currentTitle === metaTitle) {
                return;
            }

            this.set('meta_title', metaTitle);

            // If this is a new post.  Don't save the model.  Defer the save
            // to the user pressing the save button
            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
            });
        },

        setMetaDescription: function (metaDescription) {
            var self = this,
                currentDescription = this.get('meta_description') || '';

            // Only update if the description has changed
            if (currentDescription === metaDescription) {
                return;
            }

            this.set('meta_description', metaDescription);

            // If this is a new post.  Don't save the model.  Defer the save
            // to the user pressing the save button
            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
            });
        },

        setCoverImage: function (image) {
            var self = this;

            this.set('image', image);

            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },

        clearCoverImage: function () {
            var self = this;

            this.set('image', '');

            if (this.get('isNew')) {
                return;
            }

            this.get('model').save().catch(function (errors) {
                self.showErrors(errors);
                self.get('model').rollback();
            });
        },

        showSubview: function () {
            this.set('isViewingSubview', true);
        },

        closeSubview: function () {
            this.set('isViewingSubview', false);
        }
    }
});

export default PostSettingsMenuController;
