// Backend URLs for different environments
const PRODUCTION_BACKEND_URL = 'https://api.fortisafe.live/api';
const LOCAL_BACKEND_URL = 'http://localhost:8080/api';

// Set this to false to use local backend, true to use production
const USE_PRODUCTION = false;

// The active backend URL based on environment setting
const BACKEND_URL = USE_PRODUCTION ? PRODUCTION_BACKEND_URL : LOCAL_BACKEND_URL;
const BACKEND_ORIGIN = USE_PRODUCTION ? 'https://api.fortisafe.live' : 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const signupLink = document.getElementById('signup-link');
    const errorMessage = document.getElementById('error-message');

    // Clear any existing session data when opening the login page
    chrome.storage.local.remove(['access_token', 'id_token', 'userProfile']);

    // Listen for messages from the Auth0 callback
    window.addEventListener('message', function (event) {
        console.log('Received message:', event.data);
        // Verify the origin of the message
        if (event.origin !== BACKEND_ORIGIN) {
            console.log('Invalid origin:', event.origin);
            return;
        }

        if (event.data.type === 'auth-success') {
            console.log('Auth success received:', event.data);
            const { user } = event.data;
            const accessToken = user.accessToken;
            const idToken = user.idToken;

            // Store tokens in Chrome storage
            chrome.storage.local.set({
                access_token: accessToken,
                id_token: idToken
            }, async function () {
                console.log('Tokens stored in chrome.storage.local');
                try {
                    console.log('Fetching user profile with token:', accessToken);
                    // Fetch user profile using accessToken
                    const profile = await getUserProfile(accessToken);
                    console.log('Fetched user profile:', profile);
                    // Store user profile in Chrome storage
                    await chrome.storage.local.set({ userProfile: profile });
                    console.log('User profile stored in chrome.storage.local');
                    // Redirect to main popup
                    window.location.href = 'popup.html';
                } catch (error) {
                    console.error('Failed to fetch or store user profile:', error);
                    showError('Failed to fetch user profile after login.');
                }
            });
        }
    });

    loginButton.addEventListener('click', function () {
        // Open Auth0 login in a popup window
        const width = 500;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const popup = window.open(
            `${BACKEND_URL}/auth/login?client=extension&prompt=login&max_age=0&auth_type=reauthenticate`,
            'Auth0 Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Check if popup was blocked
        if (!popup) {
            showError('Please allow popups for this extension');
        }

        // Listen for popup close
        const checkPopup = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkPopup);
                // Check if we have tokens after popup closes
                chrome.storage.local.get(['access_token'], function (result) {
                    if (result.access_token) {
                        window.location.href = 'popup.html';
                    }
                });
            }
        }, 500);
    });

    signupLink.addEventListener('click', function (e) {
        e.preventDefault();
        // Open signup in a new tab
        chrome.tabs.create({ url: `${BACKEND_URL}/auth/login?client=extension` });
    });
});

async function getUserProfile(token) {
    try {
        console.log('Fetching user profile with token:', token);
        const response = await fetch(`${BACKEND_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Profile fetch failed:', response.status, response.statusText);
            throw new Error('Failed to get user profile');
        }

        const profile = await response.json();
        console.log('Received profile:', profile);

        // Store user profile in Chrome storage
        await chrome.storage.local.set({ userProfile: profile });

        return profile;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        throw error;
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
} 