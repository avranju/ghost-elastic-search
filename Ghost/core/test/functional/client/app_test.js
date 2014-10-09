// # App Test
// Tests that the general layout & functionality of global admin components is correct

/*globals CasperTest, casper, newUser */

CasperTest.begin('Admin navigation bar is correct', 28, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('root', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
    });

    casper.then(function testNavItems() {
        var logoHref = this.getElementAttribute('.ghost-logo', 'href'),
            contentHref = this.getElementAttribute('.nav-content', 'href'),
            editorHref = this.getElementAttribute('.nav-new', 'href'),
            settingsHref = this.getElementAttribute('.nav-settings', 'href');

        // Logo
        test.assertExists('.ghost-logo', 'Ghost logo home page link exists');
        test.assertEquals(logoHref, '/', 'Ghost logo link href is correct');

        // Content
        test.assertExists('.nav-content', 'Content nav item exists');
        test.assertSelectorHasText('.nav-content', 'Content', 'Content nav item has correct text');
        test.assertEquals(contentHref, '/ghost/', 'Content href is correct');
        test.assertExists('.nav-content.active', 'Content nav item is not marked active');

        // Editor
        test.assertExists('.nav-new', 'Editor nav item exists');
        test.assertSelectorHasText('.nav-new', 'New Post', 'Editor nav item has correct text');
        test.assertEquals(editorHref, '/ghost/editor/', 'Editor href is correct');
        test.assertDoesntExist('.nav-new.active', 'Editor nav item is not marked active');

        // Settings
        test.assertExists('.nav-settings', 'Settings nav item exists');
        test.assertSelectorHasText('.nav-settings', 'Settings', 'Settings nav item has correct text');
        test.assertEquals(settingsHref, '/ghost/settings/', 'Settings href is correct');
        test.assertDoesntExist('.nav-settings.active', 'Settings nav item is marked active');
    });

    casper.then(function testUserMenuNotVisible() {
        test.assertExists('.user-menu', 'User menu nav item exists');
        test.assertNotExists('.user-menu .dropdown.open', 'User menu should not be visible');
    });

    casper.thenClick('.user-menu .nav-label');
    casper.waitForSelector('.user-menu .dropdown.open', function then() {
        var profileHref = this.getElementAttribute('.user-menu-profile', 'href'),
            helpHref = this.getElementAttribute('.user-menu-support', 'href'),
            signoutHref = this.getElementAttribute('.user-menu-signout', 'href');

        test.assertVisible('.user-menu .dropdown-menu', 'User menu should be visible');

        test.assertExists('.user-menu-profile', 'Profile menu item exists');
        test.assertSelectorHasText('.user-menu-profile', 'Your Profile',
            'Profile menu item has correct text');
        test.assertEquals(profileHref, '/ghost/settings/users/' + newUser.slug + '/', 'Profile href is correct');

        test.assertExists('.user-menu-support', 'Help menu item exists');
        test.assertSelectorHasText('.user-menu-support', 'Help / Support', 'Help menu item has correct text');
        test.assertEquals(helpHref, 'http://support.ghost.org/', 'Help href is correct');

        test.assertExists('.user-menu-signout', 'Sign Out menu item exists');
        test.assertSelectorHasText('.user-menu-signout', 'Sign Out', 'Signout menu item has correct text');
        test.assertEquals(signoutHref, '/ghost/signout/', 'Sign Out href is correct');
    }, casper.failOnTimeout(test, 'WaitForSelector .user-menu .dropdown failed'));
});

CasperTest.begin('Can transition to the editor and back', 6, function suite(test) {
    casper.thenOpenAndWaitForPageLoad('root', function testTitleAndUrl() {
        test.assertTitle('Ghost Admin', 'Ghost admin has no title');
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
    });

    casper.thenTransitionAndWaitForScreenLoad('editor', function testTransitionToEditor() {
        test.assertUrlMatch(/ghost\/editor\/$/, 'Landed on the correct URL');
        test.assertExists('.entry-markdown', 'Ghost editor is present');
        test.assertExists('.entry-preview', 'Ghost preview is present');
    });

    casper.thenTransitionAndWaitForScreenLoad('content', function testTransitionToContent() {
        test.assertUrlMatch(/ghost\/\d+\/$/, 'Landed on the correct URL');
    });
});
