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

// Add this function to decrypt a password
async function decryptPassword(passwordId) {
    try {
        const token = await getToken();
        if (!token) {
            throw new Error('No access token found');
        }

        const response = await fetch(`${BACKEND_URL}/passwords/${passwordId}/decrypt`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.password;
    } catch (error) {
        console.error('Error decrypting password:', error);
        throw error;
    }
}

// Modify the displaySavedCredentials function to show decrypted passwords
async function displaySavedCredentials() {
    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    try {
        const token = await getToken();
        if (!token) {
            showError('Please login to view your credentials');
            return;
        }

        const response = await fetch(`${BACKEND_URL}/passwords`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const passwords = await response.json();

        if (passwords.length === 0) {
            credentialsList.innerHTML = '<p class="text-center text-gray-400 my-2">No saved credentials yet.</p>';
            return;
        }

        for (const password of passwords) {
            const credentialItem = document.createElement('div');
            credentialItem.className = 'credential-item bg-white rounded-lg shadow p-4 mb-4';

            // Create a container for the credential details
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'credential-details';

            // Website
            const websiteDiv = document.createElement('div');
            websiteDiv.className = 'mb-2';
            websiteDiv.innerHTML = `<strong>Website:</strong> ${password.website}`;
            detailsContainer.appendChild(websiteDiv);

            // Username
            const usernameDiv = document.createElement('div');
            usernameDiv.className = 'mb-2';
            usernameDiv.innerHTML = `<strong>Username:</strong> ${password.username}`;
            detailsContainer.appendChild(usernameDiv);

            // Password (initially hidden)
            const passwordDiv = document.createElement('div');
            passwordDiv.className = 'mb-2';
            passwordDiv.innerHTML = `<strong>Password:</strong> <span class="password-text">••••••••</span>`;
            detailsContainer.appendChild(passwordDiv);

            // Add buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flex gap-2 mt-2';

            // Show/Hide Password button
            const showPasswordBtn = document.createElement('button');
            showPasswordBtn.className = 'show-password-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600';
            showPasswordBtn.textContent = 'Show Password';
            showPasswordBtn.onclick = async () => {
                try {
                    const decryptedPassword = await decryptPassword(password._id);
                    const passwordText = passwordDiv.querySelector('.password-text');
                    if (passwordText.textContent === '••••••••') {
                        passwordText.textContent = decryptedPassword;
                        showPasswordBtn.textContent = 'Hide Password';
                    } else {
                        passwordText.textContent = '••••••••';
                        showPasswordBtn.textContent = 'Show Password';
                    }
                } catch (error) {
                    showError('Failed to decrypt password');
                }
            };
            buttonsContainer.appendChild(showPasswordBtn);

            // Copy Password button
            const copyPasswordBtn = document.createElement('button');
            copyPasswordBtn.className = 'copy-password-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600';
            copyPasswordBtn.textContent = 'Copy Password';
            copyPasswordBtn.onclick = async () => {
                try {
                    const decryptedPassword = await decryptPassword(password._id);
                    await navigator.clipboard.writeText(decryptedPassword);
                    copyPasswordBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyPasswordBtn.textContent = 'Copy Password';
                    }, 2000);
                } catch (error) {
                    showError('Failed to copy password');
                }
            };
            buttonsContainer.appendChild(copyPasswordBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-credential-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = async () => {
                if (confirm('Are you sure you want to delete this credential?')) {
                    try {
                        const response = await fetch(`${BACKEND_URL}/passwords/${password._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        // Remove the credential item from the UI
                        credentialItem.remove();

                        // If no credentials left, show the empty message
                        if (credentialsList.children.length === 0) {
                            credentialsList.innerHTML = '<p class="text-center text-gray-400 my-2">No saved credentials yet.</p>';
                        }
                    } catch (error) {
                        showError('Failed to delete credential');
                    }
                }
            };
            buttonsContainer.appendChild(deleteBtn);

            // Add all elements to the credential item
            credentialItem.appendChild(detailsContainer);
            credentialItem.appendChild(buttonsContainer);
            credentialsList.appendChild(credentialItem);
        }
    } catch (error) {
        console.error('Error fetching credentials:', error);
        showError('Failed to load credentials');
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
    const manualSaveForm = document.getElementById('manual-save-form');
    const manualCancelBtn = document.getElementById('manual-cancel-btn');

    if (toggleManualBtn) {
        toggleManualBtn.addEventListener('click', () => {
            manualSaveForm.style.display = manualSaveForm.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (manualCancelBtn) {
        manualCancelBtn.addEventListener('click', () => {
            // Clear the form fields
            document.getElementById('manual-website').value = '';
            document.getElementById('manual-username').value = '';
            document.getElementById('manual-password').value = '';
            // Hide the form
            manualSaveForm.style.display = 'none';
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
    try {
        // Get access token
        const accessToken = await getToken();
        if (!accessToken) {
            alert('Please login first');
            return;
        }

        // Get pending credentials
        const pendingCredentials = await new Promise((resolve) => {
            chrome.storage.sync.get('pendingCredentials', (data) => {
                resolve(data.pendingCredentials || []);
            });
        });

        if (!pendingCredentials[idx]) {
            console.error('Pending credential not found');
            return;
        }

        const cred = pendingCredentials[idx];
        const website = getMainUrl(cred.url);

        // Check for duplicates first
        const duplicateCheckResponse = await fetch(
            `${BACKEND_URL}/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(cred.username)}`,
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
            alert('These credentials already exist in your vault.');
            // Remove from pending since it's already in the vault
            pendingCredentials.splice(idx, 1);
            chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials }, () => {
                displaySavedCredentials();
            });
            return;
        }

        // Save to backend
        const saveResponse = await fetch(`${BACKEND_URL}/passwords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                website: website,
                username: cred.username,
                password: cred.password,
                lastUpdated: new Date().toISOString(),
                notes: 'Saved from pending credentials',
                tags: ['pending']
            })
        });

        if (!saveResponse.ok) {
            throw new Error(`HTTP error! status: ${saveResponse.status}`);
        }

        // Remove from pending credentials
        pendingCredentials.splice(idx, 1);
        chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials }, () => {
            // Also remove from local saved credentials if it exists there
            chrome.storage.sync.get('savedCredentials', (data) => {
                let savedCredentials = data.savedCredentials || [];
                savedCredentials = savedCredentials.filter(c =>
                    !(c.url === cred.url && c.username === cred.username)
                );
                chrome.storage.sync.set({ 'savedCredentials': savedCredentials }, () => {
                    displaySavedCredentials();
                });
            });
        });

        alert('Credential saved to vault successfully!');
    } catch (error) {
        console.error('Error saving pending credential:', error);
        alert('Failed to save credential. Please try again.');
    }
}

// Add function to handle saving local credentials to MongoDB
async function saveLocalCredentialToMongo(credential) {
    try {
        const accessToken = await getToken();
        if (!accessToken) {
            alert('Please login first');
            return false;
        }

        const website = getMainUrl(credential.url);

        // Check for duplicates first
        const duplicateCheckResponse = await fetch(
            `${BACKEND_URL}/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(credential.username)}`,
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
            alert('These credentials already exist in your vault.');
            return false;
        }

        // Save to backend
        const saveResponse = await fetch(`${BACKEND_URL}/passwords`, {
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

        if (!saveResponse.ok) {
            throw new Error(`HTTP error! status: ${saveResponse.status}`);
        }

        // Remove from local saved credentials
        chrome.storage.sync.get('savedCredentials', (data) => {
            let savedCredentials = data.savedCredentials || [];
            savedCredentials = savedCredentials.filter(c =>
                !(c.url === credential.url && c.username === credential.username)
            );
            chrome.storage.sync.set({ 'savedCredentials': savedCredentials });
        });

        return true;
    } catch (error) {
        console.error('Error saving local credential to MongoDB:', error);
        alert('Failed to save credential. Please try again.');
        return false;
    }
}