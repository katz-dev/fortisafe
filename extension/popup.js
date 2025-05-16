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
document.addEventListener('DOMContentLoaded', function () {
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

    // Check authentication state
    const access_token = localStorage.getItem('access_token');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    console.log('[DEBUG] Checking authentication state:', { access_token, userProfile });
    if (!access_token) {
        // If not authenticated, show login button
        document.getElementById('profile-section').innerHTML = '';
        document.getElementById('go-login-section').classList.remove('hidden');
        document.getElementById('go-login-button').addEventListener('click', function () {
            console.log('[DEBUG] Go to Login button clicked');
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
            } else {
                console.log('[DEBUG] Auth0 login popup opened');
            }
            // Listen for popup close
            const checkPopup = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkPopup);
                    console.log('[DEBUG] Auth0 login popup closed');
                    // Check if we have tokens after popup closes
                    const access_token = localStorage.getItem('access_token');
                    console.log('[DEBUG] After popup close, access_token:', access_token);
                    if (access_token) {
                        window.location.reload();
                    }
                }
            }, 500);
        });
        return;
    } else {
        document.getElementById('go-login-section').classList.add('hidden');
    }

    // If authenticated, show main content
    console.log('[DEBUG] User is authenticated, showing main content');
    setupTabs();
    displaySavedUrls();
    displaySavedCredentials();
    displayUserProfile(userProfile);

    // Setup event listeners
    setupEventListeners();

    // Persistent logout button
    document.getElementById('persistent-logout-button').addEventListener('click', function () {
        console.log('[DEBUG] Persistent logout button clicked');
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('userProfile');
        console.log('[DEBUG] Cleared tokens and user profile from localStorage (persistent logout)');
        window.location.reload();
    });
});

function displayUserProfile(profile) {
    const profileSection = document.getElementById('profile-section');
    if (profileSection && profile) {
        console.log('[DEBUG] Displaying user profile:', profile);
        profileSection.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${profile.picture || 'default-avatar.png'}" alt="Profile" class="w-10 h-10 rounded-full">
                    <div>
                        <p class="font-medium">${profile.firstName} ${profile.lastName}</p>
                        <p class="text-sm text-gray-400">${profile.email}</p>
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

// Setup tabs functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Add active class to clicked button
            this.classList.add('active');

            // Show corresponding content
            const tabId = this.id.replace('-tab', '-content');
            document.getElementById(tabId).classList.remove('hidden');
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

// Display saved URLs in the popup
function displaySavedUrls() {
    const urlList = document.getElementById('url-list');
    urlList.innerHTML = '';

    chrome.storage.sync.get('savedUrls', function (data) {
        const savedUrls = data.savedUrls || [];

        if (savedUrls.length === 0) {
            urlList.innerHTML = '<p>No URLs saved yet.</p>';
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
            credentialsList.innerHTML = '<p>No credentials saved yet.</p>';
            return;
        }

        savedCredentials.forEach(function (credential, index) {
            const credentialItem = document.createElement('div');
            credentialItem.className = 'credential-item';

            // Create credential info
            const credentialInfo = document.createElement('div');

            // Show the website
            const website = document.createElement('div');
            website.className = 'credential-details';
            website.innerHTML = `<strong>Website:</strong> ${credential.url}`;

            // Show the username
            const username = document.createElement('div');
            username.className = 'credential-details';
            username.innerHTML = `<strong>Username:</strong> ${credential.username}`;

            // Show the password (masked)
            const password = document.createElement('div');
            password.className = 'credential-details';
            password.innerHTML = `<strong>Password:</strong> ${'•'.repeat(credential.password.length)}`;

            // Show password toggle
            const showPassword = document.createElement('button');
            showPassword.textContent = 'Show';
            showPassword.style.fontSize = '10px';
            showPassword.style.padding = '2px 5px';
            showPassword.style.marginLeft = '5px';
            showPassword.addEventListener('click', function () {
                if (this.textContent === 'Show') {
                    password.innerHTML = `<strong>Password:</strong> ${credential.password}`;
                    this.textContent = 'Hide';
                } else {
                    password.innerHTML = `<strong>Password:</strong> ${'•'.repeat(credential.password.length)}`;
                    this.textContent = 'Show';
                }
            });

            password.appendChild(showPassword);

            credentialInfo.appendChild(website);
            credentialInfo.appendChild(username);
            credentialInfo.appendChild(password);

            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'X';
            deleteBtn.style.alignSelf = 'flex-start';
            deleteBtn.addEventListener('click', function () {
                deleteCredential(index);
            });

            credentialItem.appendChild(credentialInfo);
            credentialItem.appendChild(deleteBtn);
            credentialsList.appendChild(credentialItem);
        });
    });
}

// Delete a single credential
function deleteCredential(index) {
    chrome.storage.sync.get('savedCredentials', function (data) {
        let savedCredentials = data.savedCredentials || [];
        savedCredentials.splice(index, 1);

        chrome.storage.sync.set({ 'savedCredentials': savedCredentials }, function () {
            displaySavedCredentials();
        });
    });
}

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