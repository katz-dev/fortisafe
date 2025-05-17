const BACKEND_URL = 'http://localhost:8080/api';
const BACKEND_ORIGIN = 'http://localhost:8080';

// Function to get the current active tab URL
function getCurrentTabUrl(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
            callback(tabs[0].url, tabs[0].id);
        } else {
            callback(null, null);
        }
    });
}

// Load saved data when popup opens
document.addEventListener('DOMContentLoaded', async function () {
    console.log('[DEBUG] DOMContentLoaded');
    // Listen for messages from the Auth0 callback
    window.addEventListener('message', function (event) {
        console.log('[DEBUG] Received message:', event.data, 'from origin:', event.origin);
        // Verify the origin of the message
        if (event.origin !== BACKEND_ORIGIN) {
            console.log('[DEBUG] Invalid origin:', event.origin, 'Expected:', BACKEND_ORIGIN);
            return;
        }

        if (event.data.type === 'auth-success') {
            console.log('[DEBUG] Auth success received:', event.data);
            const { user } = event.data;
            const accessToken = user.accessToken;
            const idToken = user.idToken;

            // Store tokens in localStorage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('id_token', idToken);
            console.log('[DEBUG] Tokens stored in localStorage:', { accessToken, idToken });
            // Fetch and store user profile
            (async () => {
                try {
                    console.log('[DEBUG] Fetching user profile with token:', accessToken);
                    const profile = await getUserProfile(accessToken);
                    console.log('[DEBUG] Fetched user profile:', profile);
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                    console.log('[DEBUG] User profile stored in localStorage');
                    window.location.reload();
                } catch (error) {
                    console.error('[DEBUG] Failed to fetch or store user profile:', error);
                    showError('Failed to fetch user profile after login.');
                }
            })();
        }
    });

    // Elements
    const loginCard = document.getElementById('login-card');
    const dashboardCard = document.getElementById('dashboard-card');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const signupLinkLogin = document.getElementById('signup-link-login');
    const dashboardProfilePic = document.getElementById('dashboard-profile-pic');
    const dashboardProfileName = document.getElementById('dashboard-profile-name');
    const dashboardProfileEmail = document.getElementById('dashboard-profile-email');

    // Helper: Show/hide cards
    function showLoginCard() {
        loginCard.style.display = '';
        dashboardCard.style.display = 'none';
    }
    function showDashboardCard() {
        loginCard.style.display = 'none';
        dashboardCard.style.display = '';
        displaySavedUrls();
        displaySavedCredentials();
    }

    // Helper: update dashboard profile fields
    function updateDashboardProfile(userProfile) {
        if (!userProfile) return;
        // Try to get from top-level, then from nested user/auth0Profile
        const picture = userProfile.picture || (userProfile.auth0Profile && userProfile.auth0Profile.picture) || '';
        const name = userProfile.name || userProfile.nickname ||
            (userProfile.user && (userProfile.user.firstName + ' ' + userProfile.user.lastName)) ||
            (userProfile.auth0Profile && userProfile.auth0Profile.name) || '';
        const email = userProfile.email ||
            (userProfile.user && userProfile.user.email) ||
            (userProfile.auth0Profile && userProfile.auth0Profile.email) || '';

        if (picture) {
            dashboardProfilePic.src = picture;
            dashboardProfilePic.style.display = '';
        } else {
            dashboardProfilePic.style.display = 'none';
        }
        dashboardProfileName.textContent = name;
        dashboardProfileEmail.textContent = email;
    }

    // Check login state and fetch profile if needed
    let access_token = localStorage.getItem('access_token');
    let userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    if (access_token && !userProfile) {
        // Try to fetch profile using the token
        try {
            userProfile = await getUserProfile(access_token);
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            updateDashboardProfile(userProfile);
        } catch (e) {
            // Token invalid or fetch failed, log out
            localStorage.removeItem('access_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('userProfile');
            showLoginCard();
            return;
        }
    }
    if (access_token && userProfile) {
        // Show dashboard card
        showDashboardCard();
        updateDashboardProfile(userProfile);
    } else {
        // Show login card
        showLoginCard();
    }

    // Login button
    if (loginBtn) {
        loginBtn.onclick = function () {
            const width = 500;
            const height = 600;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            const popup = window.open(
                `${BACKEND_URL}/auth/login?client=extension`,
                'Auth0 Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );
            if (!popup) {
                alert('Please allow popups for this extension');
            }
        };
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.onclick = function () {
            localStorage.removeItem('access_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('userProfile');
            showLoginCard();
        };
    }

    // Signup link
    if (signupLinkLogin) {
        signupLinkLogin.onclick = function (e) {
            e.preventDefault();
            window.open(`${BACKEND_URL}/auth/login?client=extension`, '_blank');
        };
    }

    // Setup event listeners
    setupEventListeners();
});

// Add listener for messages from auth-success.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[DEBUG] Message received in popup.js:', message);
    if (message.type === 'auth-success') {
        console.log('[DEBUG] Auth success message received:', message.data);
        const { user, accessToken, idToken } = message.data;

        // Store tokens and profile (similar to how it was planned before)
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('userProfile', JSON.stringify(user));

        // Also store in chrome.storage.local for persistence across extension contexts if needed
        chrome.storage.local.set({
            access_token: accessToken,
            id_token: idToken,
            userProfile: user
        }, () => {
            console.log('[DEBUG] Tokens and profile stored in chrome.storage.local from popup');
        });

        // Close the Auth0 popup window
        // We need the 'popup' variable from the scope where window.open was called.
        // This event listener is outside that scope. We need to make 'popup' accessible here or handle closing differently.
        // For now, we assume auth-success.js closes itself. If not, this needs addressing.
        // The auth-success.js was modified to call window.close()

        console.log('[DEBUG] Reloading popup window after auth success');
        window.location.reload();

        // Acknowledge the message
        sendResponse({ status: "success", message: "Popup received auth details and is reloading." });
        return true; // Indicates that sendResponse will be called asynchronously (although we call it sync here)
    }
});

// Display saved URLs in the popup
function displaySavedUrls() {
    const urlList = document.getElementById('url-list');
    urlList.innerHTML = '';

    chrome.storage.sync.get('savedUrls', function (data) {
        const savedUrls = data.savedUrls || [];

        if (savedUrls.length === 0) {
            urlList.innerHTML = '<p class="text-center text-gray-400 my-2">No URLs saved yet.</p>';
            return;
        }

        savedUrls.forEach(function (url, index) {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';

            // Create a clickable link
            const urlLink = document.createElement('a');
            urlLink.href = '#';
            urlLink.className = 'url-link';
            urlLink.textContent = url;
            urlLink.title = url;
            urlLink.addEventListener('click', function () {
                chrome.tabs.create({ url: url });
            });

            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'X';
            deleteBtn.title = 'Delete URL';
            deleteBtn.addEventListener('click', function () {
                deleteUrl(index);
            });

            urlItem.appendChild(urlLink);
            urlItem.appendChild(deleteBtn);
            urlList.appendChild(urlItem);
        });
    });
}

// Delete a single URL
function deleteUrl(index) {
    chrome.storage.sync.get('savedUrls', function (data) {
        let savedUrls = data.savedUrls || [];
        savedUrls.splice(index, 1);

        chrome.storage.sync.set({ 'savedUrls': savedUrls }, function () {
            displaySavedUrls();
        });
    });
}

// Display saved credentials in the popup
function displaySavedCredentials() {
    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    chrome.storage.sync.get('savedCredentials', function (data) {
        const savedCredentials = data.savedCredentials || [];

        if (savedCredentials.length === 0) {
            credentialsList.innerHTML = '<p class="text-center text-gray-400 my-2">No credentials saved yet.</p>';
            return;
        }

        savedCredentials.forEach(function (credential, index) {
            const credentialItem = document.createElement('div');
            credentialItem.className = 'credential-item';

            // Create credential info
            const credentialInfo = document.createElement('div');
            credentialInfo.className = 'w-full';

            // Show the website
            const website = document.createElement('div');
            website.className = 'credential-details';
            website.innerHTML = `<strong>Website:</strong> <span class="text-blue-400">${credential.url}</span>`;

            // Show the username
            const username = document.createElement('div');
            username.className = 'credential-details';
            username.innerHTML = `<strong>Username:</strong> ${credential.username}`;

            // Show the password (masked)
            const password = document.createElement('div');
            password.className = 'credential-details flex items-center';
            password.innerHTML = `<strong>Password:</strong> <span class="password-text">${'•'.repeat(credential.password.length)}</span>`;

            // Show password toggle
            const showPassword = document.createElement('button');
            showPassword.textContent = 'Show';
            showPassword.className = 'text-xs bg-indigo-800 hover:bg-indigo-700 px-2 py-1 rounded ml-2';
            showPassword.addEventListener('click', function () {
                const passwordText = password.querySelector('.password-text');
                if (this.textContent === 'Show') {
                    passwordText.textContent = credential.password;
                    this.textContent = 'Hide';
                } else {
                    passwordText.textContent = '•'.repeat(credential.password.length);
                    this.textContent = 'Show';
                }
            });

            password.appendChild(showPassword);

            credentialInfo.appendChild(website);
            credentialInfo.appendChild(username);
            credentialInfo.appendChild(password);

            // Add timestamp if available
            if (credential.timestamp) {
                const timestamp = document.createElement('div');
                timestamp.className = 'credential-details text-xs text-gray-400';
                const date = new Date(credential.timestamp);
                timestamp.textContent = `Saved on: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                credentialInfo.appendChild(timestamp);
            }

            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flex justify-end w-full mt-2';

            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'X';
            deleteBtn.title = 'Delete credential';
            deleteBtn.addEventListener('click', function () {
                deleteCredential(index);
            });

            buttonsContainer.appendChild(deleteBtn);

            credentialItem.appendChild(credentialInfo);
            credentialItem.appendChild(buttonsContainer);
            credentialsList.appendChild(credentialItem);
        });
    });
}

// Setup tabs functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.style.opacity = 0;
            });

            // Add active class to clicked button
            this.classList.add('active');

            // Show corresponding content
            const tabId = this.id.replace('-tab', '-content');
            const activeContent = document.getElementById(tabId);
            activeContent.classList.remove('hidden');

            // Fade in animation
            setTimeout(() => {
                activeContent.style.opacity = 1;
            }, 10);
        });
    });

    // Initialize the first tab as visible
    document.querySelectorAll('.tab-content').forEach(content => {
        if (!content.classList.contains('hidden')) {
            content.style.opacity = 1;
        } else {
            content.style.opacity = 0;
        }
    });
}

function displayUserProfile(profile) {
    const profileSection = document.getElementById('profile-section');
    if (profileSection && profile) {
        // Ensure profile.user and profile.auth0Profile exist
        const userDetails = profile.user || {};
        const auth0Details = profile.auth0Profile || {};

        console.log('[DEBUG] Displaying user profile with new structure:', profile);
        profileSection.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${auth0Details.picture || 'default-avatar.png'}" alt="Profile" class="w-10 h-10 rounded-full border-2 border-indigo-500">
                    <div>
                        <p class="font-medium">${userDetails.firstName || auth0Details.given_name || 'N/A'} ${userDetails.lastName || auth0Details.family_name || ''}</p>
                        <p class="text-sm text-gray-400">${userDetails.email || auth0Details.email || 'No email'}</p>
                    </div>
                </div>
                <button id="logout-button" class="text-sm text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer">
                    Logout
                </button>
            </div>
        `;

        // Add logout handler
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    console.log('[DEBUG] Logout button clicked');
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('userProfile');
    console.log('[DEBUG] Cleared tokens and user profile from localStorage');
    // Reload popup to show login button
    // Clear local storage
    chrome.storage.local.remove(['access_token', 'id_token', 'userProfile'], function () {
        console.log('[DEBUG] Cleared tokens and user profile from chrome.storage.local');
        // Reload popup to show login button
        window.location.reload();
    });
}

async function getUserProfile(token) {
    try {
        console.log('[DEBUG] Fetching user profile with token:', token);
        const response = await fetch(`${BACKEND_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error('[DEBUG] Profile fetch failed:', response.status, response.statusText);
            throw new Error('Failed to get user profile');
        }
        const profile = await response.json();
        console.log('[DEBUG] Profile fetch response:', profile);
        return profile;
    } catch (error) {
        console.error('[DEBUG] Error in getUserProfile:', error);
        throw error;
    }
}

function showError(message) {
    console.error('[DEBUG] showError:', message);
    alert(message);
}

async function getToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['access_token'], function (result) {
            resolve(result.access_token);
        });
    });
}

// Save a URL to Chrome storage
function saveUrl(url) {
    chrome.storage.sync.get('savedUrls', function (data) {
        let savedUrls = data.savedUrls || [];

        // Check if URL already exists
        if (!savedUrls.includes(url)) {
            savedUrls.push(url);
            chrome.storage.sync.set({ 'savedUrls': savedUrls }, function () {
                displaySavedUrls();
            });
        } else {
            alert('This URL is already saved!');
        }
    });
}

// Clear all URLs button
document.getElementById('clear-all-urls').addEventListener('click', function () {
    chrome.storage.sync.set({ 'savedUrls': [] }, function () {
        displaySavedUrls();
    });
});

// Enable credential capture button
document.getElementById('enable-capture').addEventListener('click', function () {
    const button = document.getElementById('enable-capture');

    getCurrentTabUrl(function (url, tabId) {
        if (tabId) {
            if (button.textContent === "Enable Credential Capture") {
                chrome.storage.sync.set({ 'captureEnabled': true }, function () {
                    chrome.tabs.sendMessage(tabId, { action: "enableCapture" });
                    button.textContent = "Disable Credential Capture";
                    button.style.backgroundColor = "#f44336";
                });
            } else {
                chrome.storage.sync.set({ 'captureEnabled': false }, function () {
                    chrome.tabs.sendMessage(tabId, { action: "disableCapture" });
                    button.textContent = "Enable Credential Capture";
                    button.style.backgroundColor = "#4285f4";
                });
            }
        }
    });
});

// Clear all credentials button
document.getElementById('clear-all-credentials').addEventListener('click', function () {
    chrome.storage.sync.set({ 'savedCredentials': [] }, function () {
        displaySavedCredentials();
    });
});

// Check if capture is enabled
chrome.storage.sync.get('captureEnabled', function (data) {
    if (data.captureEnabled) {
        const button = document.getElementById('enable-capture');
        button.textContent = "Disable Credential Capture";
        button.style.backgroundColor = "#f44336";
    }
});

// Login button and sign up link event listeners
const loginButton = document.getElementById('login-button');
const signupLink = document.getElementById('signup-link');

if (loginButton) {
    loginButton.addEventListener('click', function () {
        console.log('Login button clicked');
        // TODO: Implement login functionality, possibly by opening a new tab to the login page
        // Example: chrome.tabs.create({url: 'YOUR_LOGIN_PAGE_URL'});
    });
}

if (signupLink) {
    signupLink.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default link behavior
        console.log('Sign up link clicked');
        // TODO: Implement sign-up functionality, possibly by opening a new tab to the sign-up page
        // Example: chrome.tabs.create({url: 'YOUR_SIGNUP_PAGE_URL'});
    });
}

// Setup event listeners
function setupEventListeners() {
    // Save URL button
    document.getElementById('save-url').addEventListener('click', function () {
        getCurrentTabUrl(function (url) {
            if (url) {
                saveUrl(url);
            }
        });
    });

    // Clear all URLs button
    document.getElementById('clear-all-urls').addEventListener('click', function () {
        chrome.storage.sync.set({ 'savedUrls': [] }, function () {
            displaySavedUrls();
        });
    });

    // Enable credential capture button
    document.getElementById('enable-capture').addEventListener('click', function () {
        const button = document.getElementById('enable-capture');

        getCurrentTabUrl(function (url, tabId) {
            if (tabId) {
                if (button.textContent === "Enable Credential Capture") {
                    chrome.storage.sync.set({ 'captureEnabled': true }, function () {
                        chrome.tabs.sendMessage(tabId, { action: "enableCapture" });
                        button.textContent = "Disable Credential Capture";
                        button.style.backgroundColor = "#f44336";
                    });
                } else {
                    chrome.storage.sync.set({ 'captureEnabled': false }, function () {
                        chrome.tabs.sendMessage(tabId, { action: "disableCapture" });
                        button.textContent = "Enable Credential Capture";
                        button.style.backgroundColor = "#4285f4";
                    });
                }
            }
        });
    });

    // Clear all credentials button
    document.getElementById('clear-all-credentials').addEventListener('click', function () {
        chrome.storage.sync.set({ 'savedCredentials': [] }, function () {
            displaySavedCredentials();
        });
    });

    // Check if capture is enabled
    chrome.storage.sync.get('captureEnabled', function (data) {
        if (data.captureEnabled) {
            const button = document.getElementById('enable-capture');
            button.textContent = "Disable Credential Capture";
            button.style.backgroundColor = "#f44336";
        }
    });

    // Login button and sign up link event listeners
    const loginButton = document.getElementById('login-button');
    const signupLink = document.getElementById('signup-link');

    if (loginButton) {
        loginButton.addEventListener('click', function () {
            console.log('Login button clicked');
            // TODO: Implement login functionality, possibly by opening a new tab to the login page
            // Example: chrome.tabs.create({url: 'YOUR_LOGIN_PAGE_URL'});
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default link behavior
            console.log('Sign up link clicked');
            // TODO: Implement sign-up functionality, possibly by opening a new tab to the sign-up page
            // Example: chrome.tabs.create({url: 'YOUR_SIGNUP_PAGE_URL'});
        });
    }
}