import styleBody from 'ghost/mixins/style-body';
import loadingIndicator from 'ghost/mixins/loading-indicator';

var ForgottenRoute = Ember.Route.extend(styleBody, loadingIndicator, {
    classNames: ['ghost-forgotten']
});

export default ForgottenRoute;
