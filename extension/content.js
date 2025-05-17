// Content script for Form Data Saver extension
// This script runs on all web pages

console.log('Form Data Saver content script loaded on: ' + window.location.href);

// Flag to track if credential capture is enabled
let captureEnabled = false;

// Add this at the top of the file after the initial console.log
let recentlySavedCredentials = new Set();
const DEBOUNCE_TIME = 2000; // 2 seconds

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "enableCapture") {
        captureEnabled = true;
        setupFormListeners();
        console.log('Credential capture enabled');
    } else if (message.action === "disableCapture") {
        captureEnabled = false;
        removeFormListeners();
        console.log('Credential capture disabled');
    }
});

// Check storage to see if capture is enabled
chrome.storage.sync.get('captureEnabled', function (data) {
    captureEnabled = data.captureEnabled || false;
    if (captureEnabled) {
        setupFormListeners();
    }
});

// Track form elements with listeners
let formsWithListeners = [];

// Set up listeners for form submissions
function setupFormListeners() {
    // Remove any existing listeners first to avoid duplicates
    removeFormListeners();

    // Find all forms on the page
    const forms = document.querySelectorAll('form');

    forms.forEach(function (form) {
        // Add submit event listener to each form
        form.addEventListener('submit', captureFormData);
        formsWithListeners.push({ form: form, listener: captureFormData });
    });

    // Also set up listeners for input fields that might not be in forms
    setupInputFieldListeners();
}

// Remove form listeners
function removeFormListeners() {
    formsWithListeners.forEach(function (item) {
        item.form.removeEventListener('submit', item.listener);
    });
    formsWithListeners = [];

    // Also remove input field listeners
    removeInputFieldListeners();
}

// Track input elements with listeners
let inputsWithListeners = [];

// Set up listeners for password and username input fields
function setupInputFieldListeners() {
    // Find all password fields
    const passwordFields = document.querySelectorAll('input[type="password"]');

    passwordFields.forEach(function (passwordField) {
        // Find related username field (typically the input field before the password)
        let usernameField = findUsernameField(passwordField);

        if (usernameField) {
            // Add blur event listeners (when user clicks away from the field)
            const captureFunction = function () {
                if (captureEnabled && passwordField.value && usernameField.value) {
                    saveCredentials(usernameField.value, passwordField.value);
                }
            };

            passwordField.addEventListener('blur', captureFunction);
            inputsWithListeners.push({ input: passwordField, listener: captureFunction });
        }
    });
}

// Remove input field listeners
function removeInputFieldListeners() {
    inputsWithListeners.forEach(function (item) {
        item.input.removeEventListener('blur', item.listener);
    });
    inputsWithListeners = [];
}

// Try to find a username field related to a password field
function findUsernameField(passwordField) {
    // Look for a nearby input field that might be for the username
    // Common username field types
    const usernameTypes = ['text', 'email', 'tel'];

    // Try to find the form containing the password field
    const form = passwordField.closest('form');

    if (form) {
        // Find all potential username inputs in the form
        const inputs = form.querySelectorAll('input');

        // Check inputs that come before the password field
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i] === passwordField) break;

            const type = inputs[i].type.toLowerCase();
            if (usernameTypes.includes(type)) {
                return inputs[i];
            }
        }
    }

    // If no form or no username field found in form, try other methods
    // Look for an input before the password field
    let prevInput = passwordField.previousElementSibling;
    while (prevInput) {
        if (prevInput.tagName === 'INPUT') {
            const type = prevInput.type.toLowerCase();
            if (usernameTypes.includes(type)) {
                return prevInput;
            }
        }
        prevInput = prevInput.previousElementSibling;
    }

    // Look for input with common username/email id/name attributes
    const usernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[name="login"]',
        'input[name="user"]',
        'input[id="username"]',
        'input[id="email"]',
        'input[id="login"]',
        'input[id="user"]'
    ];

    for (const selector of usernameSelectors) {
        const input = document.querySelector(selector);
        if (input) return input;
    }

    return null;
}

// Capture form data when a form is submitted
function captureFormData(event) {
    if (!captureEnabled) return;

    // Get the form from the event
    const form = event.target;

    // Look for password fields in the form
    const passwordField = form.querySelector('input[type="password"]');

    if (passwordField) {
        // Find a username field
        const usernameField = findUsernameField(passwordField);

        if (usernameField && passwordField.value && usernameField.value) {
            saveCredentials(usernameField.value, passwordField.value);
        }
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

// Add this after the initial console.log
function showConfirmationNotification(username, url, callback) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d3748;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        max-width: 300px;
    `;

    notification.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>Save credentials for ${url}?</strong>
        </div>
        <div style="margin-bottom: 10px; color: #a0aec0;">
            Username: ${username}
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="confirm-save" style="
                background: #4299e1;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
            ">Save</button>
            <button id="cancel-save" style="
                background: #4a5568;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
            ">Cancel</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('confirm-save').addEventListener('click', () => {
        document.body.removeChild(notification);
        callback(true);
    });

    document.getElementById('cancel-save').addEventListener('click', () => {
        document.body.removeChild(notification);
        callback(false);
    });

    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
            callback(false);
        }
    }, 30000);
}

// Add this function to check for duplicates
async function checkForDuplicateCredentials(website, username) {
    try {
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.error('No access token found');
            return false;
        }

        const response = await fetch('http://localhost:8080/api/passwords', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const passwords = await response.json();
        return passwords.some(pwd =>
            pwd.website === website && pwd.username === username
        );
    } catch (error) {
        console.error('Error checking for duplicates:', error);
        return false;
    }
}

// Update the sendCredentialsToBackend function
async function sendCredentialsToBackend(credentials) {
    try {
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.error('No access token found');
            return { success: false, error: 'No access token found' };
        }

        // Get the main domain for the website field
        const website = getMainUrl(credentials.url);

        // Check for duplicates first using the new endpoint
        const duplicateCheckResponse = await fetch(
            `http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(credentials.username)}`,
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
            return { success: false, error: 'Duplicate credentials found' };
        }

        // Prepare the data according to the DTO
        const passwordData = {
            website: website,
            url: credentials.url,
            username: credentials.username,
            password: credentials.password,
            lastUpdated: new Date().toISOString(),
            notes: 'Saved by FortiSafe extension',
            tags: ['extension']
        };

        const response = await fetch('http://localhost:8080/api/passwords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(passwordData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending credentials to backend:', error);
        return { success: false, error: error.message };
    }
}

// Update the saveCredentials function
async function saveCredentials(username, password) {
    // Get the URL from local storage
    chrome.storage.local.get(['currentUrl'], async function (data) {
        const url = data.currentUrl || window.location.href;

        // Create a unique key for these credentials
        const credentialKey = `${url}-${username}-${password}`;

        // Check if we recently saved these exact credentials
        if (recentlySavedCredentials.has(credentialKey)) {
            console.log('Skipping duplicate credential save');
            return;
        }

        // Get access token
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.log('No access token found, storing in pending credentials');
            // Store in pending credentials
            chrome.storage.sync.get('pendingCredentials', function (data) {
                let pendingCredentials = data.pendingCredentials || [];
                pendingCredentials.push({
                    url: url,
                    username: username,
                    password: password,
                    timestamp: new Date().toISOString()
                });
                chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials });
            });
            return;
        }

        // Get the main domain for the website field
        const website = getMainUrl(url);

        try {
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
                console.log('Duplicate credentials found, skipping save');
                return;
            }

            // Show confirmation notification
            showConfirmationNotification(username, url, async (confirmed) => {
                if (!confirmed) {
                    console.log('Credential save cancelled by user');
                    return;
                }

                const credentials = {
                    url: url,
                    username: username,
                    password: password,
                    timestamp: new Date().toISOString()
                };

                // Try to save to backend
                const result = await sendCredentialsToBackend(credentials);

                if (result.success) {
                    // Add to recently saved set
                    recentlySavedCredentials.add(credentialKey);
                    // Remove after debounce time
                    setTimeout(() => {
                        recentlySavedCredentials.delete(credentialKey);
                    }, DEBOUNCE_TIME);

                    // Save to local storage as backup
                    chrome.storage.sync.get('savedCredentials', function (data) {
                        let savedCredentials = data.savedCredentials || [];
                        savedCredentials.push(credentials);
                        chrome.storage.sync.set({ 'savedCredentials': savedCredentials });
                    });
                } else {
                    console.error('Failed to save credentials:', result.error);
                }
            });
        } catch (error) {
            console.error('Error checking for duplicates:', error);
            // Store in pending credentials on error
            chrome.storage.sync.get('pendingCredentials', function (data) {
                let pendingCredentials = data.pendingCredentials || [];
                pendingCredentials.push({
                    url: url,
                    username: username,
                    password: password,
                    timestamp: new Date().toISOString()
                });
                chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials });
            });
        }
    });
}

// Add this function to show save result notification
function showSaveResultNotification(success, url, errorMessage = '') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${success ? '#48bb78' : '#f56565'};
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        max-width: 300px;
    `;

    notification.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>${success ? 'Credentials saved successfully!' : 'Failed to save credentials'}</strong>
        </div>
        <div style="margin-bottom: 10px; color: #a0aec0;">
            ${success ? `Saved for ${url}` : errorMessage}
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

function renderPendingCredentials() {
    chrome.storage.sync.get('pendingCredentials', function (data) {
        const pending = data.pendingCredentials || [];
        const container = document.getElementById('pending-credentials-list');
        container.innerHTML = '';
        pending.forEach((cred, idx) => {
            const div = document.createElement('div');
            div.innerHTML = `
                Website: ${cred.url}<br>
                Username: ${cred.username}<br>
                Password: ••••••<br>
                <button data-idx="${idx}">Save</button>
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