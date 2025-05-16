const BACKEND_URL = 'http://localhost:8080/api';

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
    // Check authentication state
    chrome.storage.local.get(['access_token', 'userProfile'], function (result) {
        if (!result.access_token) {
            // If not authenticated, show login page
            window.location.href = 'login.html';
            return;
        }

        // If authenticated, show main content
        setupTabs();
        displaySavedUrls();
        displaySavedCredentials();
        displayUserProfile(result.userProfile);

        // Setup event listeners
        setupEventListeners();
    });
});

function displayUserProfile(profile) {
    const profileSection = document.getElementById('profile-section');
    if (profileSection && profile) {
        profileSection.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${profile.picture || 'default-avatar.png'}" alt="Profile" class="w-10 h-10 rounded-full">
                    <div>
                        <p class="font-medium">${profile.firstName} ${profile.lastName}</p>
                        <p class="text-sm text-gray-400">${profile.email}</p>
                    </div>
                </div>
                <button id="logout-button" class="text-sm text-red-400 hover:text-red-300">
                    Logout
                </button>
            </div>
        `;

        // Add logout handler
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getToken()}`,
                'Content-Type': 'application/json',
            },
        });

        // Clear local storage
        await chrome.storage.local.remove(['access_token', 'id_token', 'userProfile']);

        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
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