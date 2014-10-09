import MobileContentView from 'ghost/views/mobile/content-view';
/**
 * All settings views other than the index should inherit from this base class.
 * It ensures that the correct screen is showing when a mobile user navigates
 * to a `settings.someRouteThatIsntIndex` route.
 */

var SettingsContentBaseView = MobileContentView.extend({
    tagName: 'section',
    classNames: ['settings-content', 'js-settings-content', 'fade-in']
});

export default SettingsContentBaseView;
