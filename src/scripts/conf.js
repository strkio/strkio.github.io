var config =
  module.exports = {
    /**
     * @see https://developer.github.com/v3/oauth
     */
    clientId: '7f3283b134502ed9f6af',
    /**
     * Used to exchange "code" for the OAuth (access) token.
     * @see https://github.com/prose/gatekeeper
     */
    gatekeeperURL: 'http://gk.strk.io'
  };

if (__DEV__) {
  config.clientId = 'd9cf5576c8eca83dc074';
  config.gatekeeperURL = 'http://localhost-8000.herokuapp.com';
}
