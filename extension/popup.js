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

// Add function to fetch credentials from backend
async function fetchBackendCredentials() {
    try {
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.error('No access token found');
            return [];
        }

        const response = await fetch('http://localhost:8080/api/passwords', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching credentials from backend:', error);
        return [];
    }
}

// Modify displaySavedCredentials function
async function displaySavedCredentials() {
    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    try {
        // Get credentials from all sources
        const [localCredentials, backendCredentials, pendingCredentials] = await Promise.all([
            new Promise((resolve) => {
                chrome.storage.sync.get('savedCredentials', function (data) {
                    resolve(data.savedCredentials || []);
                });
            }),
            fetchBackendCredentials(),
            new Promise((resolve) => {
                chrome.storage.sync.get('pendingCredentials', function (data) {
                    resolve(data.pendingCredentials || []);
                });
            })
        ]);

        // Show pending credentials first if any exist
        if (pendingCredentials.length > 0) {
            const pendingSection = document.createElement('div');
            pendingSection.className = 'pending-section mb-4';
            pendingSection.innerHTML = '<h3 class="text-yellow-400 mb-2">Pending Credentials</h3>';

            pendingCredentials.forEach((cred, idx) => {
                const pendingItem = document.createElement('div');
                pendingItem.className = 'credential-item bg-yellow-900/20 mb-2 p-2 rounded';
                pendingItem.innerHTML = `
                    <div class="credential-details">
                        <strong>Website:</strong> <span class="text-blue-400">${cred.url}</span>
                    </div>
                    <div class="credential-details">
                        <strong>Username:</strong> ${cred.username}
                    </div>
                    <div class="credential-details">
                        <strong>Password:</strong> ••••••
                    </div>
                    <div class="text-xs text-yellow-400 mt-1">
                        Waiting to be saved to your vault
                    </div>
                    <button class="save-pending-btn mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm" data-idx="${idx}">
                        Save Now
                    </button>
                `;
                pendingSection.appendChild(pendingItem);
            });

            credentialsList.appendChild(pendingSection);
        }

        // Show local credentials section if there are any
        if (localCredentials.length > 0) {
            const localSection = document.createElement('div');
            localSection.className = 'local-section mb-4';
            localSection.innerHTML = '<h3 class="text-orange-400 mb-2">Local Credentials</h3>';

            localCredentials.forEach((credential, index) => {
                const credentialItem = document.createElement('div');
                credentialItem.className = 'credential-item bg-orange-900/20 mb-2 p-2 rounded';

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

                // Add action buttons
                const actionButtons = document.createElement('div');
                actionButtons.className = 'flex gap-2 mt-2';

                // Check duplicate button
                const checkDuplicateBtn = document.createElement('button');
                checkDuplicateBtn.className = 'check-duplicate-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm';
                checkDuplicateBtn.textContent = 'Check Duplicate';
                checkDuplicateBtn.addEventListener('click', async () => {
                    try {
                        const accessToken = await getToken();
                        if (!accessToken) {
                            alert('Please login first');
                            return;
                        }

                        const website = getMainUrl(credential.url);
                        const response = await fetch(
                            `${BACKEND_URL}/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(credential.username)}`,
                            {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                }
                            }
                        );

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const { exists } = await response.json();
                        if (exists) {
                            alert('These credentials already exist in your vault.');
                        } else {
                            alert('No duplicate found. You can save these credentials to your vault.');
                        }
                    } catch (error) {
                        console.error('Error checking duplicate:', error);
                        alert('Failed to check for duplicates. Please try again.');
                    }
                });

                // Save to MongoDB button
                const saveToMongoBtn = document.createElement('button');
                saveToMongoBtn.className = 'save-to-mongo-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm';
                saveToMongoBtn.textContent = 'Save to Vault';
                saveToMongoBtn.addEventListener('click', async () => {
                    try {
                        const accessToken = await getToken();
                        if (!accessToken) {
                            alert('Please login first');
                            return;
                        }

                        const website = getMainUrl(credential.url);
                        const response = await fetch(`${BACKEND_URL}/passwords`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            body: JSON.stringify({
                                website: website,
                                username: credential.username,
                                password: credential.password,
                                lastUpdated: new Date().toISOString(),
                                notes: 'Saved from local storage',
                                tags: ['local']
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        alert('Credentials saved to vault successfully!');
                        // Refresh the display
                        displaySavedCredentials();
                    } catch (error) {
                        console.error('Error saving to MongoDB:', error);
                        alert('Failed to save credentials. Please try again.');
                    }
                });

                actionButtons.appendChild(checkDuplicateBtn);
                actionButtons.appendChild(saveToMongoBtn);

                credentialItem.appendChild(credentialInfo);
                credentialItem.appendChild(actionButtons);
                localSection.appendChild(credentialItem);
            });

            credentialsList.appendChild(localSection);
        }

        // Show saved credentials section if there are any
        if (backendCredentials.length > 0) {
            const savedSection = document.createElement('div');
            savedSection.className = 'saved-section';
            savedSection.innerHTML = '<h3 class="text-green-400 mb-2">Saved Credentials</h3>';

            backendCredentials.forEach(function (credential) {
                const credentialItem = document.createElement('div');
                credentialItem.className = 'credential-item bg-indigo-900/20 mb-2 p-2 rounded';

                // Create credential info
                const credentialInfo = document.createElement('div');
                credentialInfo.className = 'w-full';

                // Show the website
                const website = document.createElement('div');
                website.className = 'credential-details';
                website.innerHTML = `<strong>Website:</strong> <span class="text-blue-400">${credential.website}</span>`;

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
                if (credential.lastUpdated) {
                    const timestamp = document.createElement('div');
                    timestamp.className = 'credential-details text-xs text-gray-400';
                    const date = new Date(credential.lastUpdated);
                    timestamp.textContent = `Saved on: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    credentialInfo.appendChild(timestamp);
                }

                credentialItem.appendChild(credentialInfo);
                savedSection.appendChild(credentialItem);
            });

            credentialsList.appendChild(savedSection);
        }

        if (localCredentials.length === 0 && backendCredentials.length === 0 && pendingCredentials.length === 0) {
            credentialsList.innerHTML = '<p class="text-center text-gray-400 my-2">No credentials saved yet.</p>';
        }

        // Add event listeners for pending credential save buttons
        document.querySelectorAll('.save-pending-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const idx = this.getAttribute('data-idx');
                savePendingCredential(idx);
            });
        });

    } catch (error) {
        console.error('Error displaying credentials:', error);
        credentialsList.innerHTML = '<p class="text-center text-red-400 my-2">Error loading credentials.</p>';
    }
}

// Helper function to get main domain from URL
function getMainUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        console.error('Error parsing URL:', error);
        return url;
    }
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
    // Add manual save button handler
    const manualSaveBtn = document.getElementById('manual-save-btn');
    if (manualSaveBtn) {
        manualSaveBtn.addEventListener('click', saveManualPassword);
    }

    // Add enter key handlers for manual save form
    const manualForm = document.getElementById('manual-save-form');
    if (manualForm) {
        const inputs = manualForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    saveManualPassword();
                }
            });
        });
    }

    // Setup website suggestions
    setupWebsiteSuggestions();

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

    // Add toggle button for manual save form
    const toggleManualBtn = document.getElementById('toggle-manual-form');
    if (toggleManualBtn && manualForm) {
        toggleManualBtn.addEventListener('click', function () {
            if (manualForm.style.display === 'none' || manualForm.style.display === '') {
                manualForm.style.display = 'block';
                toggleManualBtn.textContent = '− Hide Credential Form';
            } else {
                manualForm.style.display = 'none';
                toggleManualBtn.textContent = '+ Add Credential';
            }
        });
    }
}

// Add this function to handle manual password saving
async function saveManualPassword() {
    const website = document.getElementById('manual-website').value.trim();
    const username = document.getElementById('manual-username').value.trim();
    const password = document.getElementById('manual-password').value.trim();

    if (!website || !username || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const accessToken = await getToken();
        if (!accessToken) {
            alert('Please login first');
            return;
        }

        // Check for duplicates first
        const duplicateCheckResponse = await fetch(
            `http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!duplicateCheckResponse.ok) {
            throw new Error(`HTTP error! status: ${duplicateCheckResponse.status}`);
        }

        const { exists } = await duplicateCheckResponse.json();
        if (exists) {
            alert('These credentials already exist in your password vault.');
            return;
        }

        // Try to save to backend
        const response = await fetch('http://localhost:8080/api/passwords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                website: website,
                username: username,
                password: password,
                lastUpdated: new Date().toISOString(),
                notes: 'Saved manually via FortiSafe extension',
                tags: ['manual']
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Save to local storage
        chrome.storage.sync.get('savedCredentials', function (data) {
            let savedCredentials = data.savedCredentials || [];
            savedCredentials.push({
                url: website,
                username: username,
                password: password,
                timestamp: new Date().toISOString()
            });
            chrome.storage.sync.set({ 'savedCredentials': savedCredentials }, function () {
                // Clear the form
                document.getElementById('manual-website').value = '';
                document.getElementById('manual-username').value = '';
                document.getElementById('manual-password').value = '';
                // Refresh the display
                displaySavedCredentials();
                // Show success message
                alert('Password saved successfully!');
            });
        });

    } catch (error) {
        console.error('Error saving password:', error);
        alert('Failed to save password. Please try again.');
    }
}

// Add function to handle website suggestions
function setupWebsiteSuggestions() {
    const websiteInput = document.getElementById('manual-website');
    const suggestionsDiv = document.getElementById('website-suggestions');

    if (!websiteInput || !suggestionsDiv) return;

    // Common website domains
    const commonWebsites = [
        'google.com',
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'github.com',
        'amazon.com',
        'netflix.com',
        'spotify.com',
        'microsoft.com',
        'apple.com',
        'yahoo.com',
        'outlook.com',
        'gmail.com',
        'hotmail.com'
    ];

    // Get saved websites from credentials
    function getSavedWebsites() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('savedCredentials', function (data) {
                const savedCredentials = data.savedCredentials || [];
                const websites = new Set(savedCredentials.map(cred => cred.url));
                resolve(Array.from(websites));
            });
        });
    }

    // Show suggestions
    async function showSuggestions(input) {
        const value = input.toLowerCase();
        if (!value) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        const savedWebsites = await getSavedWebsites();
        const allWebsites = [...new Set([...commonWebsites, ...savedWebsites])];

        const matches = allWebsites.filter(website =>
            website.toLowerCase().includes(value)
        );

        if (matches.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        suggestionsDiv.innerHTML = matches.map(website => `
            <div class="suggestion-item" style="padding:0.5rem; cursor:pointer; color:#e0e0ff; hover:background:#2a2840;">
                ${website}
            </div>
        `).join('');

        suggestionsDiv.style.display = 'block';

        // Add click handlers
        const items = suggestionsDiv.getElementsByClassName('suggestion-item');
        Array.from(items).forEach(item => {
            item.addEventListener('click', () => {
                websiteInput.value = item.textContent.trim();
                suggestionsDiv.style.display = 'none';
            });
        });
    }

    // Event listeners
    websiteInput.addEventListener('input', (e) => {
        showSuggestions(e.target.value);
    });

    websiteInput.addEventListener('focus', () => {
        if (websiteInput.value) {
            showSuggestions(websiteInput.value);
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!websiteInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

async function savePendingCredential(idx) {
    chrome.storage.sync.get('pendingCredentials', async function (data) {
        let pendingCredentials = data.pendingCredentials || [];
        const cred = pendingCredentials[idx];

        // 1. Get access token
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        // 2. Fetch all credentials from backend
        const response = await fetch('http://localhost:8080/api/passwords', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const allCreds = await response.json();

        // 3. Check for duplicate (by website and username)
        const exists = allCreds.some(c =>
            c.website === cred.url && c.username === cred.username
        );
        if (exists) {
            alert('Credential already exists in backend.');
            // Optionally remove from pending
            pendingCredentials.splice(idx, 1);
            chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials }, renderPendingCredentials);
            return;
        }

        // 4. Save to backend
        const saveResp = await fetch('http://localhost:8080/api/passwords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                website: cred.url,
                username: cred.username,
                password: cred.password,
                lastUpdated: new Date().toISOString()
            })
        });

        if (saveResp.ok) {
            // Remove from pending
            pendingCredentials.splice(idx, 1);
            chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials }, renderPendingCredentials);
            alert('Credential saved to backend!');
        } else {
            alert('Failed to save credential.');
        }
    });
}

function renderPendingCredentials() {
    chrome.storage.sync.get('pendingCredentials', function (data) {
        const pending = data.pendingCredentials || [];
        const container = document.getElementById('pending-credentials-list');
        container.innerHTML = '';
        pending.forEach((cred, idx) => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div>
                    <strong>Website:</strong> ${cred.url}<br>
                    <strong>Username:</strong> ${cred.username}<br>
                    <strong>Password:</strong> ••••••<br>
                    <span style="color: orange;">Pending Save</span>
                    <button data-idx="${idx}">Save</button>
                </div>
            `;
            container.appendChild(div);
        });
        // Add event listeners for save buttons
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function () {
                const idx = this.getAttribute('data-idx');
                savePendingCredential(idx);
            });
        });
    });
}