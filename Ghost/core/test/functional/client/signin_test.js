// # Signin Test
// Test that signin works, including testing our spam prevention mechanisms

/*globals CasperTest, casper, url, user, falseUser */

CasperTest.begin('Ghost admin will load login page', 3, function suite(test) {
    CasperTest.Routines.signout.run(test);
    casper.thenOpenAndWaitForPageLoad('signin', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/signin\/$/, 'We should be presented with the signin page.');

        casper.then(function testLink() {
            var link = this.evaluate(function (selector) {
                return document.querySelector(selector).getAttribute('href');
            }, '.forgotten-password');

            casper.echoConcise('LINK' + link);
            test.assert(link === '/ghost/forgotten/', 'Has correct forgotten password link');
        });
    });
}, true);

// Note, this test applies to a global redirect, which sends us to the standard admin.
// Once Ember becomes the standard admin, this test should still pass.
CasperTest.begin('Redirects login to signin', 2, function suite(test) {
    CasperTest.Routines.signout.run(test);
    casper.start(url + 'ghost/login/', function testRedirect(response) {
        test.assertEqual(response.status, 200, 'Response status should be 200.');
        test.assertUrlMatch(/ghost\/signin\//, 'Should be redirected to /signin/.');
    });
}, true);

CasperTest.begin('Login limit is in place', 4, function suite(test) {
    CasperTest.Routines.signout.run(test);

    casper.thenOpenAndWaitForPageLoad('signin', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/signin\/$/, 'Landed on the correct URL');
    });

    casper.waitForOpaque('.login-box',
        function then() {
            this.fillAndSave('#login', falseUser);
        },
        function onTimeout() {
            test.fail('Sign in form didn\'t fade in.');
        });

    casper.wait(2100, function doneWait() {
        this.fillAndSave('#login', falseUser);
    });

    casper.waitForText('remaining', function onSuccess() {
        test.assert(true, 'The login limit is in place.');
        test.assertSelectorDoesntHaveText('.notification-error', '[object Object]');
    }, function onTimeout() {
        test.assert(false, 'We did not trip the login limit.');
    });
}, true);

CasperTest.begin('Can login to Ghost', 5, function suite(test) {
    CasperTest.Routines.signout.run(test);

    casper.thenOpenAndWaitForPageLoad('signin', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/signin\/$/, 'Landed on the correct URL');
    });

    casper.waitForOpaque('.login-box', function then() {
        this.fillAndSave('#login', user);
    });

    casper.wait(2000);

    casper.waitForResource(/posts/, function testForDashboard() {
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
        test.assertExists('.global-nav', 'Global admin header is present');
        test.assertExists('.manage', 'We\'re now on content');
    }, function onTimeOut() {
        test.fail('Failed to signin');
    });
}, true);

CasperTest.begin('Authenticated user is redirected', 8, function suite(test) {
    CasperTest.Routines.signout.run(test);

    casper.thenOpenAndWaitForPageLoad('signin', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/signin\/$/, 'Landed on the correct URL');
    });

    casper.waitForOpaque('.login-box', function then() {
        this.fillAndSave('#login', user);
    });

    casper.wait(2000);

    casper.waitForResource(/posts/, function testForDashboard() {
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
        test.assertExists('.global-nav', 'Global admin header is present');
        test.assertExists('.manage', 'We\'re now on content');
    }, function onTimeOut() {
        test.fail('Failed to signin');
    });

    casper.thenOpenAndWaitForPageLoad('signin-authenticated', function testTitleAndUrl() {
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
        test.assertExists('.global-nav', 'Global admin header is present');
        test.assertExists('.manage', 'We\'re now on content');
    }, function onTimeOut() {
        test.fail('Failed to redirect');
    });
}, true);

CasperTest.begin('Ensure email field form validation', 3, function suite(test) {
    CasperTest.Routines.signout.run(test);

    casper.thenOpenAndWaitForPageLoad('signin', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/signin\/$/, 'Landed on the correct URL');
    });

    casper.waitForOpaque('.js-login-box',
        function then() {
            this.fillAndSave('form.login-form', {
                identification: 'notanemail'
            });
        },
        function onTimeout() {
            test.fail('Login form didn\'t fade in.');
        });

    casper.waitForSelectorTextChange('.notification-error', function onSuccess() {
        test.assertSelectorHasText('.notification-error', 'Invalid Email');
    }, function onTimeout() {
        test.fail('Email validation error did not appear');
    }, 2000);
}, true);
