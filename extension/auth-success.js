const BACKEND_URL = 'http://localhost:8080/api';

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
        // Store tokens in Chrome storage
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
                console.log('Profile stored');

                // Try to send message to opener window
                if (window.opener) {
                    console.log('Sending message to opener window');
                    window.opener.postMessage({
                        type: 'auth-success',
                        user: profile,
                        accessToken,
                        idToken
                    }, BACKEND_URL);
                }

                // Close this window and open the main popup
                setTimeout(() => {
                    window.close();
                    chrome.action.openPopup();
                }, 1000);
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