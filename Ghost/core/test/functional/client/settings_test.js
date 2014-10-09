// # Settings Test
// Test the various tabs on the settings page

/*globals CasperTest, casper */

// These classes relate to elements which only appear when a given tab is loaded.
// These are used to check that a switch to a tab is complete, or that we are on the right tab.
var generalTabDetector = '.settings-content form#settings-general',
    usersTabDetector = '.settings-content .settings-users';

CasperTest.begin('Settings screen is correct', 15, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/general\/$/, 'Landed on the correct URL');
    });

    casper.then(function testViews() {
        test.assertExists('.settings', 'Settings main view is present');
        test.assertExists('.settings-menu', 'Settings menu is present');
        test.assertExists('.settings-menu-general a', 'General link is present');
        test.assertExists('.settings-menu-users a', 'Users link is present');
        test.assertNotExists('.settings-menu-apps a', 'Apps link is present');
        test.assertExists('.settings', 'Settings main view is present');
        test.assertExists('.settings-content', 'Settings content view is present');
        test.assertExists(generalTabDetector, 'Form is present');
        test.assertSelectorHasText('.page-title', 'General', 'Title is "General"');
    });

    casper.then(function testSwitchingTabs() {
        casper.thenClick('.settings-menu-users a');
        casper.waitForSelector(usersTabDetector, function then() {
            // assert that the right menu item is active
            test.assertExists('.settings-menu-users.active a', 'Users link is active');
            test.assertDoesntExist('.settings-menu-general.active a', 'General link is not active');
        }, casper.failOnTimeout(test, 'waitForSelector `usersTabDetector` timed out'));

        casper.thenClick('.settings-menu-general a');
        casper.waitForSelector(generalTabDetector, function then() {
            // assert that the right menu item is active
            test.assertExists('.settings-menu-general.active a', 'General link is active');
            test.assertDoesntExist('.settings-menu-users.active a', 'User link is not active');
        }, casper.failOnTimeout(test, 'waitForSelector `generalTabDetector` timed out'));
    });
});

// ## General settings tests
CasperTest.begin('General settings pane is correct', 8, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.general', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/general\/$/, 'Landed on the correct URL');
    });

    function assertImageUploaderModalThenClose() {
        test.assertSelectorHasText('.description', 'Add image');
        casper.click('#modal-container .js-button-accept');
        casper.waitForSelector('.notification-success', function onSuccess() {
            test.assert(true, 'Got success notification');
        }, casper.failOnTimeout(test, 'No success notification'));
    }

    // Ensure image upload modals display correctly

    // Test Blog Logo Upload Button
    casper.waitForSelector('.js-modal-logo', function () {
        casper.click('.js-modal-logo');
    });

    casper.waitForSelector('#modal-container .modal-content .js-drop-zone .description',
        assertImageUploaderModalThenClose, casper.failOnTimeout(test, 'No upload logo modal container appeared'));

    // Test Blog Cover Upload Button
    casper.waitForSelector('.js-modal-cover', function () {
        casper.click('.js-modal-cover');
    });

    casper.waitForSelector('#modal-container .modal-content .js-drop-zone .description',
        assertImageUploaderModalThenClose, casper.failOnTimeout(test, 'No upload cover modal container appeared'));

    function handleSettingsRequest(requestData) {
        // make sure we only get requests from the user pane
        if (requestData.url.indexOf('users/') !== -1) {
            test.fail('Saving a settings pane triggered the user pane to save');
        }
    }

    casper.then(function listenForRequests() {
        casper.on('resource.requested', handleSettingsRequest);
    });

    // Ensure can save
    casper.waitForSelector('header .btn-blue').then(function () {
        casper.thenClick('header .btn-blue').waitFor(function successNotification() {
            return this.evaluate(function () {
                return document.querySelectorAll('.js-bb-notification section').length > 0;
            });
        }, function doneWaiting() {
            test.pass('Waited for notification');
        }, casper.failOnTimeout(test, 'Saving the general pane did not result in a notification'));
    });

    casper.then(function checkSettingsWereSaved() {
        casper.removeListener('resource.requested', handleSettingsRequest);
    });

    casper.waitForSelector('.notification-success', function onSuccess() {
        test.assert(true, 'Got success notification');
    }, casper.failOnTimeout(test, 'No success notification :('));
});

// ## General settings validations tests
CasperTest.begin('General settings validation is correct', 6, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.general', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/general\/$/, 'Landed on the correct URL');
    });

    // Ensure general blog title field length validation
    casper.fillAndSave('form#settings-general', {
        'general[title]': new Array(152).join('a')
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'too long');
    }, casper.failOnTimeout(test, 'Blog title length error did not appear'), 2000);

    casper.thenClick('.js-bb-notification .close');

    // Ensure general blog description field length validation
    casper.fillAndSave('form#settings-general', {
        'general[description]': new Array(202).join('a')
    });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'too long');
    }, casper.failOnTimeout(test, 'Blog description length error did not appear'));

    casper.thenClick('.js-bb-notification .close');

    // Check postsPerPage autocorrect
    casper.fillAndSave('form#settings-general', {
        'general[postsPerPage]': 'notaninteger'
    });

    casper.then(function checkSlugInputValue() {
        test.assertField('general[postsPerPage]', '5');
    });

    casper.fillAndSave('form#settings-general', {
        'general[postsPerPage]': '1001'
    });

    casper.then(function checkSlugInputValue() {
        test.assertField('general[postsPerPage]', '5');
    });
});

CasperTest.begin('Users screen is correct', 9, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.general');
    casper.thenTransitionAndWaitForScreenLoad('settings.users', function canTransition() {
        test.assert(true, 'Can transition to users screen from settings.general');
        test.assertUrlMatch(/ghost\/settings\/users\/$/, 'settings.users transitions to correct url');
    });
    casper.then(function usersScreenHasContent() {
        test.assertSelectorHasText('.settings-users .object-list .object-list-title', 'Active users');
        test.assertExists('.settings-users .object-list .object-list-item', 'Has an active user');
        test.assertSelectorHasText('.settings-users .object-list-item .name', 'Test User');
        test.assertExists('.settings-users .object-list-item .role-label.owner', 'First user has owner role displayed');

        test.assertExists('.page-actions .btn-green', 'Add user button is on page.');
    });
    casper.thenClick('.page-actions .btn-green');
    casper.waitForOpaque('.invite-new-user .modal-content', function then() {
        test.assertEval(function testOwnerRoleNotAnOption() {
            var options = document.querySelectorAll('.invite-new-user select#new-user-role option'),
                i = 0;
            for (; i < options.length; i = i + 1) {
                if (options[i].text === 'Owner') {
                    return false;
                }
            }
            return true;
        }, '"Owner" is not a role option for new users');
    });
    // role options get loaded asynchronously; give them a chance to come in
    casper.waitForSelector('.invite-new-user select#new-user-role option', function then() {
        test.assertEval(function authorIsSelectedByDefault() {
            var options = document.querySelectorAll('.invite-new-user select#new-user-role option'),
                i = 0;
            for (; i < options.length; i = i + 1) {
                if (options[i].selected) {
                    return options[i].text === 'Author';
                }
            }
            return false;
        }, 'The "Author" role is selected by default when adding a new user');
    });
});
// ### User settings tests
CasperTest.begin('Can save settings', 7, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost Admin title is GhostAdmin');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'settings.users.user has correct URL');
    });

    function handleUserRequest(requestData) {
        // make sure we only get requests from the user pane
        if (requestData.url.indexOf('settings/') !== -1) {
            test.fail('Saving the user pane triggered another settings pane to save');
        }
    }

    function handleSettingsRequest(requestData) {
        // make sure we only get requests from the user pane
        if (requestData.url.indexOf('users/') !== -1) {
            test.fail('Saving a settings pane triggered the user pane to save');
        }
    }

    casper.then(function listenForRequests() {
        casper.on('resource.requested', handleUserRequest);
    });

    casper.thenClick('.btn-blue');
    casper.waitFor(function successNotification() {
        return this.evaluate(function () {
            return document.querySelectorAll('.js-bb-notification section').length > 0;
        });
    }, function doneWaiting() {
        test.pass('Waited for notification');
    }, casper.failOnTimeout(test, 'Saving the user pane did not result in a notification'));

    casper.then(function checkUserWasSaved() {
        casper.removeListener('resource.requested', handleUserRequest);
    });

    casper.waitForSelector('.notification-success', function onSuccess() {
        test.assert(true, 'Got success notification');
    }, casper.failOnTimeout(test, 'No success notification :('));

    casper.thenClick('.settings-menu-general a').then(function testTransitionToGeneral() {
        casper.waitForSelector(generalTabDetector, function then() {
            casper.on('resource.requested', handleSettingsRequest);
            test.assertEval(function testGeneralIsActive() {
                return document.querySelector('.settings-menu-general').classList.contains('active');
            }, 'general tab is marked active');
        },
        casper.failOnTimeout(test, 'waitForSelector `usersTabDetector` timed out'));
    });

    casper.thenClick('.btn-blue').waitFor(function successNotification() {
        return this.evaluate(function () {
            return document.querySelectorAll('.js-bb-notification section').length > 0;
        });
    }, function doneWaiting() {
        test.pass('Waited for notification');
    }, casper.failOnTimeout(test, 'Saving the general pane did not result in a notification'));

    casper.then(function checkSettingsWereSaved() {
        casper.removeListener('resource.requested', handleSettingsRequest);
    });

    casper.waitForSelector('.notification-success', function onSuccess() {
        test.assert(true, 'Got success notification');
    }, casper.failOnTimeout(test, 'No success notification :('));

    CasperTest.beforeDone(function () {
        casper.removeListener('resource.requested', handleUserRequest);
        casper.removeListener('resource.requested', handleSettingsRequest);
    });
});

CasperTest.begin('User settings screen resets all whitespace slug to original value', 3, function suite(test) {
    var slug;

    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function setSlugToAllWhitespace() {
        slug = casper.getElementInfo('#user-slug').attributes.value;

        casper.fillSelectors('.user-profile', {
            '#user-slug': '   '
        }, false);
    });

    casper.thenClick('body');

    casper.then(function checkSlugInputValue() {
        casper.wait(250);
        test.assertField('user', slug);
    });
});

CasperTest.begin('User settings screen change slug handles duplicate slug', 4, function suite(test) {
    var slug;

    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function changeSlug() {
        slug = casper.getElementInfo('#user-slug').attributes.value;

        casper.fillSelectors('.user-profile', {
            '#user-slug': slug + '!'
        }, false);
    });

    casper.thenClick('body');

    casper.waitForResource(/\/slugs\/user\//, function testGoodResponse(resource) {
        test.assert(resource.status < 400);
    });

    casper.then(function checkSlugInputValue() {
        test.assertField('user', slug);
    });
});

CasperTest.begin('User settings screen validates email', 6, function suite(test) {
    var email, brokenEmail;

    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function setEmailToInvalid() {
        email = casper.getElementInfo('#user-email').attributes.value;
        brokenEmail = email.replace('.', '-');

        casper.fillSelectors('.user-profile', {
            '#user-email': brokenEmail
        }, false);
    });

    casper.thenClick('.btn-blue');

    casper.waitForResource('/users/');

    casper.waitForSelector('.notification-error', function onSuccess() {
        test.assert(true, 'Got error notification');
        test.assertSelectorDoesntHaveText('.notification-error', '[object Object]');
    }, casper.failOnTimeout(test, 'No error notification :('));

    casper.then(function resetEmailToValid() {
        casper.fillSelectors('.user-profile', {
            '#user-email': email
        }, false);
    });

    casper.thenClick('.page-actions .btn-blue');

    casper.waitForResource(/users/);

    casper.waitForSelector('.notification-success', function onSuccess() {
        test.assert(true, 'Got success notification');
        test.assertSelectorDoesntHaveText('.notification-success', '[object Object]');
    }, casper.failOnTimeout(test, 'No success notification :('));
});

// TODO: user needs to be loaded whenever it is edited (multi user)
CasperTest.begin('User settings screen shows remaining characters for Bio properly', 4, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    function getRemainingBioCharacterCount() {
        return casper.getHTML('.word-count');
    }

    casper.then(function checkCharacterCount() {
        test.assert(getRemainingBioCharacterCount() === '200', 'Bio remaining characters is 200');
    });

    casper.then(function setBioToValid() {
        casper.fillSelectors('.user-profile', {
            '#user-bio': 'asdf\n' // 5 characters
        }, false);
    });

    casper.then(function checkCharacterCount() {
        test.assert(getRemainingBioCharacterCount() === '195', 'Bio remaining characters is 195');
    });
});

CasperTest.begin('Ensure user bio field length validation', 3, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function setBioToInvalid() {
        this.fillSelectors('form.user-profile', {
            '#user-bio': new Array(202).join('a')
        });
    });

    casper.thenClick('.page-actions .btn-blue');

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'is too long');
    }, casper.failOnTimeout(test, 'Bio field length error did not appear', 2000));
});

CasperTest.begin('Ensure user url field validation', 3, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function setWebsiteToInvalid() {
        this.fillSelectors('form.user-profile', {
            '#user-website': 'notaurl'
        });
    });

    casper.thenClick('.page-actions .btn-blue');

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'not a valid url');
    }, casper.failOnTimeout(test, 'Url validation error did not appear', 2000));
});

CasperTest.begin('Ensure user location field length validation', 3, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('settings.users.user', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/settings\/users\/test-user\/$/, 'Ghost doesn\'t require login this time');
    });

    casper.then(function setLocationToInvalid() {
        this.fillSelectors('form.user-profile', {
            '#user-location': new Array(1002).join('a')
        });
    });

    casper.thenClick('.page-actions .btn-blue');

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'is too long');
    }, casper.failOnTimeout(test, 'Location field length error did not appear', 2000));
});
