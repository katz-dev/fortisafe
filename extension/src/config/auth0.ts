export const AUTH0_CONFIG = {
    domain: 'dev-fortisafe.us.auth0.com',
    clientId: 'YOUR_AUTH0_CLIENT_ID', // Replace with your Auth0 client ID
    audience: 'https://dev-fortisafe.us.auth0.com/api/v2/',
    redirectUri: 'chrome-extension://__MSG_@@extension_id__/index.html',
    scope: 'openid profile email'
}; 