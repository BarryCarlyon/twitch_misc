// all extension need onAuthorized
window.Twitch.ext.onAuthorized(auth => {
});

// onChanged will recieve the configuration
// but only when first called/extension is loaded
window.Twitch.ext.configuration.onChanged(() => {
    var global_config = window.Twitch.ext.configuration.global;
    if (global_config && global_config.content) {
        try {
            global_config.content = JSON.parse(global_config.content);
            configureExtension(global_config.content);
        } catch (e) {
            // this accounts for JSON parse errors
            // just in case
        }
    }
});

// setup a listen on the global pubsub topic
window.Twitch.ext.listen('global', function (topic, contentType, message) {
    try {
        message = JSON.parse(message);
    } catch (e) {
        // this accounts for JSON parse errors
        // just in case
        return;
    }

    // check that it's the expected event
    if (message.event == 'configure') {
        configureExtension(message.data);
    }
});

// central function to accept the config from whichever source
function configureExtension(the_config) {
    // do whatever you want with your config
    // (re)build the extension
}
