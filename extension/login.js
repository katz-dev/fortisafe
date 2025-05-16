const BACKEND_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const signupLink = document.getElementById('signup-link');
    const errorMessage = document.getElementById('error-message');

    // Check if user is already logged in
    chrome.storage.local.get(['access_token', 'userProfile'], function (result) {
        if (result.access_token) {
            // Verify token and get user profile
            getUserProfile(result.access_token)
                .then(() => {
                    // If successful, redirect to main popup
                    window.location.href = 'popup.html';
                })
                .catch(() => {
                    // If token is invalid, clear it
                    chrome.storage.local.remove(['access_token', 'id_token', 'userProfile']);
                });
        }
    });

    // Listen for messages from the Auth0 callback
    window.addEventListener('message', function (event) {
        console.log('Received message:', event.data);
        // Verify the origin of the message
        if (event.origin !== BACKEND_URL) {
            console.log('Invalid origin:', event.origin);
            return;
        }

        if (event.data.type === 'auth-success') {
            console.log('Auth success received:', event.data);
            const { user, accessToken, idToken } = event.data;

            // Store tokens and user data
            chrome.storage.local.set({
                access_token: accessToken,
                id_token: idToken,
                userProfile: user
            }, function () {
                console.log('Stored auth data, redirecting to popup');
                // Redirect to main popup
                window.location.href = 'popup.html';
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
            `${BACKEND_URL}/auth/login?client=extension`,
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