// Backend URLs for different environments
const PRODUCTION_BACKEND_URL = 'https://api.fortisafe.live/api';
const LOCAL_BACKEND_URL = 'http://localhost:8080/api';

// Set this to false to use local backend, true to use production
const USE_PRODUCTION = true;

// The active backend URL based on environment setting
const BACKEND_URL = USE_PRODUCTION ? PRODUCTION_BACKEND_URL : LOCAL_BACKEND_URL;
const BACKEND_ORIGIN = USE_PRODUCTION ? 'https://api.fortisafe.live' : 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Auth success page loaded');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const idToken = urlParams.get('id_token');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('URL params:', {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        error,
        errorDescription
    });

    if (error) {
        showError(`Authentication failed: ${errorDescription || error}`);
        return;
    }

    if (accessToken && idToken) {
        console.log('Processing tokens...');
        // Store tokens in Chrome storage first
        chrome.storage.local.set({
            access_token: accessToken,
            id_token: idToken
        }, async function () {
            try {
                console.log('Fetching user profile...');
                // Get user profile
                const profile = await getUserProfile(accessToken);
                console.log('Profile received:', profile);

                // Store user profile
                await chrome.storage.local.set({ userProfile: profile });
                console.log('Profile stored in chrome.storage.local');

                // Send message to runtime with more detailed data
                console.log('Sending auth-success message to runtime');
                chrome.runtime.sendMessage({
                    type: 'auth-success',
                    data: {
                        user: profile,
                        accessToken,
                        idToken
                    }
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.warn("Auth-success message sending failed or no listener:", chrome.runtime.lastError.message);

                        // If we can't send the message, at least try to open the popup
                        try {
                            chrome.action.openPopup();
                        } catch (e) {
                            console.error("Failed to open popup:", e);
                        }
                    } else {
                        console.log("Auth-success message acknowledged by listener:", response);
                    }

                    // Close this window
                    console.log('Closing auth-success window.');
                    window.close();
                });
            } catch (error) {
                console.error('Failed to get user profile:', error);
                showError('Failed to get user profile. Please try again.');
            }
        });
    } else {
        console.error('No tokens found in URL');
        showError('No authentication tokens found. Please try logging in again.');
    }
});

async function getUserProfile(token) {
    try {
        console.log('Making profile request to:', `${BACKEND_URL}/auth/profile`);
        const response = await fetch(`${BACKEND_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Profile request failed:', response.status, response.statusText);
            throw new Error('Failed to get user profile');
        }

        const profile = await response.json();
        console.log('Profile response:', profile);
        return profile;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        throw error;
    }
}

function showError(message) {
    console.error('Showing error:', message);
    const messageElements = document.querySelectorAll('.message');
    messageElements.forEach(element => {
        element.textContent = message;
        element.style.color = '#ef4444'; // red-500
    });
    document.querySelector('.spinner').style.display = 'none';
}