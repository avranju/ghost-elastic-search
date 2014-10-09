/*globals describe, before, beforeEach, afterEach, it */
/*jshint expr:true*/
var testUtils       = require('../../utils'),
    should          = require('should'),
    sequence        = require('../../../server/utils/sequence'),
    _               = require('lodash'),

    // Stuff we are testing
    PostModel       = require('../../../server/models/post').Post,
    DataGenerator   = testUtils.DataGenerator,
    context         = testUtils.context.owner;

describe('Post Model', function () {
    // Keep the DB clean

    describe('Single author posts', function () {
        before(testUtils.teardown);
        afterEach(testUtils.teardown);
        beforeEach(testUtils.setup('owner', 'posts', 'apps'));

        before(function () {
            should.exist(PostModel);
        });

        function extractFirstPost(posts) {
            return _.filter(posts, {id: 1})[0];
        }

        function checkFirstPostData(firstPost) {
            should.not.exist(firstPost.author_id);
            firstPost.author.should.be.an.Object;
            firstPost.fields.should.be.an.Array;
            firstPost.tags.should.be.an.Array;
            firstPost.author.name.should.equal(DataGenerator.Content.users[0].name);
            firstPost.fields[0].key.should.equal(DataGenerator.Content.app_fields[0].key);
            firstPost.created_at.should.be.an.instanceof(Date);
            firstPost.created_by.should.be.an.Object;
            firstPost.updated_by.should.be.an.Object;
            firstPost.published_by.should.be.an.Object;
            firstPost.created_by.name.should.equal(DataGenerator.Content.users[0].name);
            firstPost.updated_by.name.should.equal(DataGenerator.Content.users[0].name);
            firstPost.published_by.name.should.equal(DataGenerator.Content.users[0].name);
            firstPost.tags[0].name.should.equal(DataGenerator.Content.tags[0].name);
        }

        it('can findAll', function (done) {
            PostModel.findAll().then(function (results) {
                should.exist(results);
                results.length.should.be.above(1);

                done();
            }).catch(done);
        });

        it('can findAll, returning all related data', function (done) {
            PostModel.findAll({include: ['author_id', 'fields', 'tags', 'created_by', 'updated_by', 'published_by']})
                .then(function (results) {
                    should.exist(results);
                    results.length.should.be.above(0);
                    var posts = results.models.map(function (model) {
                        return model.toJSON();
                    });

                    // the first post in the result is not always the post at
                    // position 0 in the fixture data so we need to use extractFirstPost
                    // to get the post with id: 1
                    checkFirstPostData(extractFirstPost(posts));

                    done();
                }).catch(done);
        });

        it('can findPage (default)', function (done) {
            PostModel.findPage().then(function (results) {
                should.exist(results);

                results.meta.pagination.page.should.equal(1);
                results.meta.pagination.limit.should.equal(15);
                results.meta.pagination.pages.should.equal(1);
                results.posts.length.should.equal(4);

                done();
            }).catch(done);
        });

        it('can findPage, returning all related data', function (done) {
            PostModel.findPage({include: ['author_id', 'fields', 'tags', 'created_by', 'updated_by', 'published_by']})
                .then(function (results) {
                    should.exist(results);

                    results.meta.pagination.page.should.equal(1);
                    results.meta.pagination.limit.should.equal(15);
                    results.meta.pagination.pages.should.equal(1);
                    results.posts.length.should.equal(4);

                    // the first post in the result is not always the post at
                    // position 0 in the fixture data so we need to use extractFirstPost
                    // to get the post with id: 1
                    checkFirstPostData(extractFirstPost(results.posts));

                    done();
                }).catch(done);
        });

        it('can findOne', function (done) {
            var firstPost;

            PostModel.findPage().then(function (results) {
                should.exist(results);
                should.exist(results.posts);
                results.posts.length.should.be.above(0);
                firstPost = results.posts[0];

                return PostModel.findOne({slug: firstPost.slug});
            }).then(function (found) {
                should.exist(found);
                found.attributes.title.should.equal(firstPost.title);

                done();
            }).catch(done);
        });

        it('can findOne, returning all related data', function (done) {
            var firstPost;
            // TODO: should take author :-/
            PostModel.findOne({}, {include: ['author_id', 'fields', 'tags', 'created_by', 'updated_by', 'published_by']})
                .then(function (result) {
                    should.exist(result);
                    firstPost = result.toJSON();

                    checkFirstPostData(firstPost);

                    done();
                }).catch(done);
        });

        it('can edit', function (done) {
            var firstPost = 1;

            PostModel.findOne({id: firstPost}).then(function (results) {
                var post;
                should.exist(results);
                post = results.toJSON();
                post.id.should.equal(firstPost);
                post.title.should.not.equal('new title');

                return PostModel.edit({title: 'new title'}, _.extend(context, {id: firstPost}));
            }).then(function (edited) {
                should.exist(edited);
                edited.attributes.title.should.equal('new title');

                done();
            }).catch(done);
        });

        it('can add, defaults are all correct', function (done) {
            var createdPostUpdatedDate,
                newPost = testUtils.DataGenerator.forModel.posts[2],
                newPostDB = testUtils.DataGenerator.Content.posts[2];

            PostModel.add(newPost, context).then(function (createdPost) {
                return new PostModel({id: createdPost.id}).fetch();
            }).then(function (createdPost) {
                should.exist(createdPost);
                createdPost.has('uuid').should.equal(true);
                createdPost.get('status').should.equal('draft');
                createdPost.get('title').should.equal(newPost.title, 'title is correct');
                createdPost.get('markdown').should.equal(newPost.markdown, 'markdown is correct');
                createdPost.has('html').should.equal(true);
                createdPost.get('html').should.equal(newPostDB.html);
                createdPost.get('slug').should.equal(newPostDB.slug + '-2');
                (!!createdPost.get('featured')).should.equal(false);
                (!!createdPost.get('page')).should.equal(false);
                createdPost.get('language').should.equal('en_US');
                // testing for nulls
                (createdPost.get('image') === null).should.equal(true);
                (createdPost.get('meta_title') === null).should.equal(true);
                (createdPost.get('meta_description') === null).should.equal(true);

                createdPost.get('created_at').should.be.above(new Date(0).getTime());
                createdPost.get('created_by').should.equal(1);
                createdPost.get('author_id').should.equal(1);
                createdPost.has('author').should.equal(false);
                createdPost.get('created_by').should.equal(createdPost.get('author_id'));
                createdPost.get('updated_at').should.be.above(new Date(0).getTime());
                createdPost.get('updated_by').should.equal(1);
                should.equal(createdPost.get('published_at'), null);
                should.equal(createdPost.get('published_by'), null);

                createdPostUpdatedDate = createdPost.get('updated_at');

                // Set the status to published to check that `published_at` is set.
                return createdPost.save({status: 'published'}, context);
            }).then(function (publishedPost) {
                publishedPost.get('published_at').should.be.instanceOf(Date);
                publishedPost.get('published_by').should.equal(1);
                publishedPost.get('updated_at').should.be.instanceOf(Date);
                publishedPost.get('updated_by').should.equal(1);
                publishedPost.get('updated_at').should.not.equal(createdPostUpdatedDate);

                done();
            }).catch(done);
        });

        it('can add, with previous published_at date', function (done) {
            var previousPublishedAtDate = new Date(2013, 8, 21, 12);

            PostModel.add({
                status: 'published',
                published_at: previousPublishedAtDate,
                title: 'published_at test',
                markdown: 'This is some content'
            }, context).then(function (newPost) {
                should.exist(newPost);
                new Date(newPost.get('published_at')).getTime().should.equal(previousPublishedAtDate.getTime());

                done();
            }).catch(done);
        });

        it('can trim title', function (done) {
            var untrimmedCreateTitle = '  test trimmed create title  ',
                untrimmedUpdateTitle = '  test trimmed update title  ',
                newPost = {
                    title: untrimmedCreateTitle,
                    markdown: 'Test Content'
                };

            PostModel.add(newPost, context).then(function (createdPost) {
                return new PostModel({id: createdPost.id}).fetch();
            }).then(function (createdPost) {
                should.exist(createdPost);
                createdPost.get('title').should.equal(untrimmedCreateTitle.trim());

                return createdPost.save({title: untrimmedUpdateTitle}, context);
            }).then(function (updatedPost) {
                updatedPost.get('title').should.equal(untrimmedUpdateTitle.trim());

                done();
            }).catch(done);
        });

        it('can generate a non conflicting slug', function (done) {
            // Create 12 posts with the same title
            sequence(_.times(12, function (i) {
                return function () {
                    return PostModel.add({
                        title: 'Test Title',
                        markdown: 'Test Content ' + (i + 1)
                    }, context);
                };
            })).then(function (createdPosts) {
                // Should have created 12 posts
                createdPosts.length.should.equal(12);

                // Should have unique slugs and contents
                _(createdPosts).each(function (post, i) {
                    var num = i + 1;

                    // First one has normal title
                    if (num === 1) {
                        post.get('slug').should.equal('test-title');
                        return;
                    }

                    post.get('slug').should.equal('test-title-' + num);
                    post.get('markdown').should.equal('Test Content ' + num);
                });

                done();
            }).catch(done);
        });

        it('can generate slugs without duplicate hyphens', function (done) {
            var newPost = {
                title: 'apprehensive  titles  have  too  many  spaces—and m-dashes  —  –  and also n-dashes  ',
                markdown: 'Test Content 1'
            };

            PostModel.add(newPost, context).then(function (createdPost) {
                createdPost.get('slug').should.equal('apprehensive-titles-have-too-many-spaces-and-m-dashes-and-also-n-dashes');

                done();
            }).catch(done);
        });

        it('can generate a safe slug when a reserved keyword is used', function (done) {
            var newPost = {
                title: 'rss',
                markdown: 'Test Content 1'
            };

            PostModel.add(newPost, context).then(function (createdPost) {
                createdPost.get('slug').should.not.equal('rss');
                done();
            });
        });

        it('can generate slugs without non-ascii characters', function (done) {
            var newPost = {
                title: 'भुते धडकी भरवणारा आहेत',
                markdown: 'Test Content 1'
            };

            PostModel.add(newPost, context).then(function (createdPost) {
                createdPost.get('slug').should.equal('bhute-dhddkii-bhrvnnaaraa-aahet');
                done();
            }).catch(done);
        });

        it('detects duplicate slugs before saving', function (done) {
            var firstPost = {
                    title: 'First post',
                    markdown: 'First content 1'
                },
                secondPost = {
                    title: 'Second post',
                    markdown: 'Second content 1'
                };

            // Create the first post
            PostModel.add(firstPost, context)
                .then(function (createdFirstPost) {
                    // Store the slug for later
                    firstPost.slug = createdFirstPost.get('slug');

                    // Create the second post
                    return PostModel.add(secondPost, context);
                }).then(function (createdSecondPost) {
                    // Store the slug for comparison later
                    secondPost.slug = createdSecondPost.get('slug');

                    // Update with a conflicting slug from the first post
                    return createdSecondPost.save({
                        slug: firstPost.slug
                    }, context);
                }).then(function (updatedSecondPost) {
                    // Should have updated from original
                    updatedSecondPost.get('slug').should.not.equal(secondPost.slug);
                    // Should not have a conflicted slug from the first
                    updatedSecondPost.get('slug').should.not.equal(firstPost.slug);

                    return PostModel.findOne({
                        id: updatedSecondPost.id,
                        status: 'all'
                    });
                }).then(function (foundPost) {
                    // Should have updated from original
                    foundPost.get('slug').should.not.equal(secondPost.slug);
                    // Should not have a conflicted slug from the first
                    foundPost.get('slug').should.not.equal(firstPost.slug);

                    done();
                }).catch(done);
        });

        it('can destroy', function (done) {
            // We're going to try deleting post id 1 which also has tag id 1
            var firstItemData = {id: 1};

            // Test that we have the post we expect, with exactly one tag
            PostModel.findOne(firstItemData).then(function (results) {
                var post;
                should.exist(results);
                post = results.toJSON();
                post.id.should.equal(firstItemData.id);
                post.tags.should.have.length(2);
                post.tags[0].should.equal(firstItemData.id);

                // Destroy the post
                return PostModel.destroy(firstItemData);
            }).then(function (response) {
                var deleted = response.toJSON();

                deleted.tags.should.be.empty;
                should.equal(deleted.author, undefined);

                // Double check we can't find the post again
                return PostModel.findOne(firstItemData);
            }).then(function (newResults) {
                should.equal(newResults, null);

                done();
            }).catch(done);
        });

        it('can findPage, with various options', function (done) {
            testUtils.fixtures.insertMorePosts().then(function () {
                return testUtils.fixtures.insertMorePostsTags();
            }).then(function () {
                return PostModel.findPage({page: 2});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(2);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(4);
                paginationResult.posts.length.should.equal(15);

                return PostModel.findPage({page: 5});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(5);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(4);
                paginationResult.posts.length.should.equal(0);

                return PostModel.findPage({limit: 30});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(30);
                paginationResult.meta.pagination.pages.should.equal(2);
                paginationResult.posts.length.should.equal(30);

                // Test both boolean formats
                return PostModel.findPage({limit: 10, staticPages: true});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(10);
                paginationResult.meta.pagination.pages.should.equal(1);
                paginationResult.posts.length.should.equal(1);

                // Test both boolean formats
                return PostModel.findPage({limit: 10, staticPages: '1'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(10);
                paginationResult.meta.pagination.pages.should.equal(1);
                paginationResult.posts.length.should.equal(1);

                return PostModel.findPage({limit: 10, page: 2, status: 'all'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.pages.should.equal(11);

                done();
            }).catch(done);
        });

        it('can findPage for tag, with various options', function (done) {
            testUtils.fixtures.insertMorePosts().then(function () {
                return testUtils.fixtures.insertMorePostsTags();
            }).then(function () {
                // Test tag filter
                return PostModel.findPage({page: 1, tag: 'bacon'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(1);
                paginationResult.meta.filters.tags[0].name.should.equal('bacon');
                paginationResult.meta.filters.tags[0].slug.should.equal('bacon');
                paginationResult.posts.length.should.equal(2);

                return PostModel.findPage({page: 1, tag: 'kitchen-sink'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(1);
                paginationResult.meta.filters.tags[0].name.should.equal('kitchen sink');
                paginationResult.meta.filters.tags[0].slug.should.equal('kitchen-sink');
                paginationResult.posts.length.should.equal(2);

                return PostModel.findPage({page: 1, tag: 'injection'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(1);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(2);
                paginationResult.meta.filters.tags[0].name.should.equal('injection');
                paginationResult.meta.filters.tags[0].slug.should.equal('injection');
                paginationResult.posts.length.should.equal(15);

                return PostModel.findPage({page: 2, tag: 'injection'});
            }).then(function (paginationResult) {
                paginationResult.meta.pagination.page.should.equal(2);
                paginationResult.meta.pagination.limit.should.equal(15);
                paginationResult.meta.pagination.pages.should.equal(2);
                paginationResult.meta.filters.tags[0].name.should.equal('injection');
                paginationResult.meta.filters.tags[0].slug.should.equal('injection');
                paginationResult.posts.length.should.equal(10);

                done();
            }).catch(done);
        });

        it('can NOT findPage for a page that overflows the datatype', function (done) {
            PostModel.findPage({page: 5700000000055345439587894375457849375284932759842375894372589243758947325894375894275894275894725897432859724309})
                .then(function (paginationResult) {
                    should.exist(paginationResult.meta);

                    paginationResult.meta.pagination.page.should.be.a.Number;

                    done();
                }).catch(done);
        });
    });

    describe('Multiauthor Posts', function () {
        before(testUtils.teardown);
        afterEach(testUtils.teardown);
        beforeEach(testUtils.setup('posts:mu'));

        before(function () {
            should.exist(PostModel);
        });

        it('can destroy multiple posts by author', function (done) {
            // We're going to delete all posts by user 1
            var authorData = {id: 1};

            PostModel.findAll().then(function (found) {
                // There are 50 posts to begin with
                found.length.should.equal(50);
                return PostModel.destroyByAuthor(authorData);
            }).then(function (results) {
                // User 1 has 13 posts in the database
                results.length.should.equal(13);
                return PostModel.findAll();
            }).then(function (found) {
                // Only 37 should remain
                found.length.should.equal(37);
                done();
            }).catch(done);
        });
    });

    // disabling sanitization until we can implement a better version
    // it('should sanitize the title', function (done) {
    //    new PostModel().fetch().then(function (model) {
    //        return model.set({'title': "</title></head><body><script>alert('blogtitle');</script>"}).save();
    //    }).then(function (saved) {
    //        saved.get('title').should.eql("&lt;/title&gt;&lt;/head>&lt;body&gt;[removed]alert&#40;'blogtitle'&#41;;[removed]");
    //        done();
    //    }).catch(done);
    // });
});
