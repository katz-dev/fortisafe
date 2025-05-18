// Content script for Form Data Saver extension
// This script runs on all web pages

console.log('Form Data Saver content script loaded on: ' + window.location.href);

// Flag to track if credential capture is enabled
let captureEnabled = false;

// Add this at the top of the file after the initial console.log
let recentlySavedCredentials = new Set();
const DEBOUNCE_TIME = 2000; // 2 seconds

// Add this after the initial console.log
let lastPasswordCheck = {};

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
            const captureFunction = async function () {
                if (captureEnabled && passwordField.value && usernameField.value) {
                    const website = getMainUrl(window.location.href);
                    // Check for password changes before saving
                    await checkPasswordChange(website, usernameField.value);
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
    // Remove any existing notification first
    const existing = document.getElementById('fortisafe-save-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'fortisafe-save-notification';
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
        console.log('Credential save cancelled by user');
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
function showCombinedNotification(website, isDuplicate, hasChanged) {
    // Only show notification if password has changed
    if (!hasChanged) {
        return;
    }

    const notification = document.createElement('div');
    notification.id = 'fortisafe-credential-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
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
            <strong>Password Change Detected!</strong>
        </div>
        <div style="margin-bottom: 10px;">
            The password for ${website} has been updated since your last login.
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="update-password" style="
                background: #4299e1;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
            ">Update Password</button>
            <button id="dismiss-notification" style="
                background: #4a5568;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
            ">Dismiss</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Add event listener for update password button
    document.getElementById('update-password').addEventListener('click', async () => {
        const button = document.getElementById('update-password');
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span> Updating...';
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';

        try {
            const accessToken = await new Promise((resolve) => {
                chrome.storage.local.get(['access_token'], (result) => {
                    resolve(result.access_token);
                });
            });

            if (!accessToken) {
                throw new Error('No access token found');
            }

            // Get the current password from the active password field
            const passwordField = document.querySelector('input[type="password"]');
            if (!passwordField) {
                throw new Error('No password field found');
            }

            const response = await fetch(`http://localhost:8080/api/passwords/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    website,
                    username: document.querySelector('input[type="text"], input[type="email"]')?.value,
                    password: passwordField.value
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update password');
            }

            // Show success message
            notification.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #48bb78;">Password Updated Successfully!</strong>
                </div>
                <div style="margin-bottom: 10px;">
                    Your password has been updated in the vault.
                </div>
            `;

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 5000);

        } catch (error) {
            console.error('Error updating password:', error);
            button.innerHTML = 'Update Failed';
            button.style.background = '#f56565';

            // Show error message
            notification.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #f56565;">Update Failed</strong>
                </div>
                <div style="margin-bottom: 10px;">
                    ${error.message}
                </div>
                <button id="dismiss-notification" style="
                    background: #4a5568;
                    color: white;
                    border: none;
                    padding: 5px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Dismiss</button>
            `;

            document.getElementById('dismiss-notification').addEventListener('click', () => {
                document.body.removeChild(notification);
            });
        }
    });

    document.getElementById('dismiss-notification').addEventListener('click', () => {
        document.body.removeChild(notification);
    });

    // Add spinner style
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Auto-remove after 30 seconds if not dismissed
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 30000);
}

// Update checkForDuplicateCredentials to handle duplicates silently
async function checkForDuplicateCredentials(website, username, currentPassword) {
    try {
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.error('No access token found');
            return { isDuplicate: false, hasChanged: false };
        }

        // Check for duplicates
        const duplicateResponse = await fetch(`http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!duplicateResponse.ok) {
            throw new Error(`HTTP error! status: ${duplicateResponse.status}`);
        }

        const { exists } = await duplicateResponse.json();

        // If credentials exist, check for password changes
        if (exists) {
            const changeResponse = await fetch(`http://localhost:8080/api/passwords/check-password-change?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}&currentPassword=${encodeURIComponent(currentPassword)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!changeResponse.ok) {
                throw new Error(`HTTP error! status: ${changeResponse.status}`);
            }

            const changeData = await changeResponse.json();

            // Only show notification if password has changed
            if (changeData.hasChanged) {
                showCombinedNotification(website, true, true);
            }

            return {
                isDuplicate: true,
                hasChanged: changeData.hasChanged,
                lastUpdated: changeData.lastUpdated
            };
        }

        return { isDuplicate: false, hasChanged: false };
    } catch (error) {
        console.error('Error checking credentials:', error);
        return { isDuplicate: false, hasChanged: false };
    }
}

// Update the sendCredentialsToBackend function
async function sendCredentialsToBackend(credentials) {
    try {
        // Get access token
        const accessToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (!accessToken) {
            console.error('Authentication required: No access token found');
            return {
                success: false,
                error: 'Authentication required. Please log in to save credentials.'
            };
        }

        // Get the main domain for the website field
        const website = getMainUrl(credentials.url);

        // Check for duplicates first
        const duplicateCheckUrl = `http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(credentials.username)}`;

        const duplicateCheckResponse = await fetch(duplicateCheckUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!duplicateCheckResponse.ok) {
            throw new Error(`Duplicate check failed (${duplicateCheckResponse.status}): ${duplicateCheckResponse.statusText}`);
        }

        const { exists } = await duplicateCheckResponse.json();

        if (exists) {
            console.log(`Credential already exists for ${website} with username ${credentials.username}`);
            return {
                success: false,
                error: 'These credentials already exist in your vault'
            };
        }

        // Prepare the data for saving
        const passwordData = {
            website: website,
            url: credentials.url,
            username: credentials.username,
            password: credentials.password,
            lastUpdated: new Date().toISOString(),
            notes: 'Saved by FortiSafe extension',
            tags: ['extension', 'auto-capture']
        };

        // Send the password to the backend
        console.log(`Saving credentials for ${website}...`);
        const saveResponse = await fetch('http://localhost:8080/api/passwords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            throw new Error(`Save failed (${saveResponse.status}): ${errorData.message || saveResponse.statusText}`);
        }

        console.log(`Credentials for ${website} saved successfully!`);
        return {
            success: true,
            message: `Credentials for ${website} saved successfully!`
        };
    } catch (error) {
        console.error('Error sending credentials to backend:', error);
        return {
            success: false,
            error: `Failed to save: ${error.message || 'Unknown error'}`
        };
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
        const accessToken = await getAccessToken();

        // Get the main domain for the website field
        const website = getMainUrl(url);

        try {
            // Check for duplicates and password changes
            const { isDuplicate, hasChanged } = await checkForDuplicateCredentials(website, username, password);

            if (isDuplicate) {
                console.log('Duplicate credentials found in MongoDB');
                return; // Exit silently if duplicate
            }

            // If not a duplicate, show confirmation notification
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

                if (accessToken) {
                    // Try to save to backend
                    const result = await sendCredentialsToBackend(credentials);
                    if (result.success) {
                        // Add to recently saved set
                        recentlySavedCredentials.add(credentialKey);
                        // Remove after debounce time
                        setTimeout(() => {
                            recentlySavedCredentials.delete(credentialKey);
                        }, DEBOUNCE_TIME);

                        // Show success notification
                        showSaveResultNotification(true, url);
                    } else {
                        // Show error notification
                        showSaveResultNotification(false, url, result.error);
                        // Store in pending credentials
                        storeInPendingCredentials(credentials);
                    }
                } else {
                    // No access token, store in pending credentials
                    storeInPendingCredentials(credentials);
                    showSaveResultNotification(false, url, 'Stored in pending credentials. Please login to save to vault.');
                }
            });
        } catch (error) {
            console.error('Error in saveCredentials:', error);
            // Store in pending credentials on error
            storeInPendingCredentials({
                url: url,
                username: username,
                password: password,
                timestamp: new Date().toISOString()
            });
            showSaveResultNotification(false, url, 'Error saving credentials. Stored in pending.');
        }
    });
}

// Helper function to store credentials in pending storage
function storeInPendingCredentials(credentials) {
    chrome.storage.sync.get('pendingCredentials', function (data) {
        let pendingCredentials = data.pendingCredentials || [];
        pendingCredentials.push(credentials);
        chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials });
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

// Update the loadPasswords function to handle password import
async function loadPasswords(container, searchInput, filterCurrentSite = false) {
    container.innerHTML = '';

    try {
        // Get access token
        const accessToken = await getAccessToken();

        // Fetch passwords from backend
        const response = await fetch('http://localhost:8080/api/passwords', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch passwords');
        }

        const passwords = await response.json();
        const searchTerm = searchInput.value.toLowerCase();
        const currentHostname = window.location.hostname;

        // Filter passwords based on search and current site if needed
        let filteredPasswords = passwords;

        if (filterCurrentSite) {
            filteredPasswords = passwords.filter(p =>
                p.website.toLowerCase().includes(currentHostname.toLowerCase())
            );
        }

        if (searchTerm) {
            filteredPasswords = filteredPasswords.filter(p =>
                p.website.toLowerCase().includes(searchTerm) ||
                p.username.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredPasswords.length === 0) {
            container.innerHTML = '<p style="color: #e0e0ff; text-align: center;">No passwords found</p>';
            return;
        }

        // Create password items
        filteredPasswords.forEach(password => {
            const item = document.createElement('div');
            item.style.cssText = `
                background: rgba(49, 46, 129, 0.3);
                border: 1px solid rgba(99, 102, 241, 0.2);
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            item.innerHTML = `
                <div style="color: #e0e0ff; font-weight: 500;">${password.website}</div>
                <div style="color: #a5b4fc; font-size: 14px;">${password.username}</div>
            `;

            item.onmouseover = () => {
                item.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
            };

            item.onmouseout = () => {
                item.style.backgroundColor = 'rgba(49, 46, 129, 0.3)';
            };

            item.onclick = async () => {
                try {
                    // Decrypt password
                    const decryptResponse = await fetch(`http://localhost:8080/api/passwords/${password._id}/decrypt`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (!decryptResponse.ok) {
                        throw new Error('Failed to decrypt password');
                    }

                    const { password: decryptedPassword } = await decryptResponse.json();

                    // Find the active password input field
                    const activeElement = document.activeElement;
                    let targetElement = null;

                    if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'password') {
                        targetElement = activeElement;
                    } else {
                        // If no active element or not a password field, find the nearest password field
                        const passwordFields = document.querySelectorAll('input[type="password"]');
                        if (passwordFields.length > 0) {
                            targetElement = passwordFields[0];
                        }
                    }

                    if (targetElement) {
                        // Fill the password field
                        targetElement.value = decryptedPassword;

                        // Trigger necessary events
                        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                        targetElement.dispatchEvent(new Event('change', { bubbles: true }));

                        // Try to find and fill username field if it exists
                        const form = targetElement.closest('form');
                        if (form) {
                            const usernameField = form.querySelector('input[type="text"], input[type="email"]');
                            if (usernameField) {
                                usernameField.value = password.username;
                                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }

                        // Show success notification
                        showImportSuccessNotification();
                    } else {
                        throw new Error('No password field found');
                    }

                    // Remove the selector
                    document.getElementById('fortisafe-password-selector').remove();
                } catch (error) {
                    console.error('Error importing password:', error);
                    showImportErrorNotification(error.message);
                }
            };

            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading passwords:', error);
        container.innerHTML = '<p style="color: #e0e0ff; text-align: center;">Error loading passwords</p>';
    }
}

// Add notification functions
function showImportSuccessNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = 'Password imported successfully!';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function showImportErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = `Error: ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Update the createPasswordSelector function to handle filtering
function createPasswordSelector(filterCurrentSite = false) {
    const selector = document.createElement('div');
    selector.id = 'fortisafe-password-selector';
    selector.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a2e;
        border: 1px solid #4f46e5;
        border-radius: 8px;
        padding: 16px;
        z-index: 999999;
        min-width: 300px;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
        background: #6366f1;
        border: 2px solid #fff;
        color: #fff;
        font-size: 2.2rem;
        font-weight: bold;
        border-radius: 50%;
        box-shadow: 0 4px 18px 2px rgba(99,102,241,0.25), 0 0 0 2px #fff;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
        z-index: 10001;
        outline: none;
    `;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = '#4f46e5';
        closeBtn.style.color = '#fff';
        closeBtn.style.boxShadow = '0 8px 28px 4px rgba(99,102,241,0.35), 0 0 0 2px #fff';
        closeBtn.style.transform = 'scale(1.08)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = '#6366f1';
        closeBtn.style.color = '#fff';
        closeBtn.style.boxShadow = '0 4px 18px 2px rgba(99,102,241,0.25), 0 0 0 2px #fff';
        closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => selector.remove();
    selector.appendChild(closeBtn);

    // Add Escape key handler to close selector
    function escKeyHandler(e) {
        if (e.key === 'Escape') {
            selector.remove();
            document.removeEventListener('keydown', escKeyHandler);
        }
    }
    document.addEventListener('keydown', escKeyHandler);

    // Add title
    const title = document.createElement('h3');
    title.textContent = filterCurrentSite ? 'Select Password for Current Site' : 'Select Password';
    title.style.cssText = `
        color: #e0e0ff;
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
    `;
    selector.appendChild(title);

    // Add search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search websites...';
    searchInput.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 12px;
        background: rgba(42, 40, 64, 0.7);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 6px;
        color: #e0e0ff;
        font-size: 14px;
    `;
    selector.appendChild(searchInput);

    // Add password list container
    const passwordList = document.createElement('div');
    passwordList.id = 'fortisafe-password-list';
    passwordList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    selector.appendChild(passwordList);

    // Add to page
    document.body.appendChild(selector);

    // Load passwords with initial filter
    loadPasswords(passwordList, searchInput, filterCurrentSite);

    // Add search functionality
    searchInput.addEventListener('input', (e) => {
        loadPasswords(passwordList, searchInput, filterCurrentSite);
    });

    return selector;
}

// Update the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showPasswordSelector') {
        createPasswordSelector(message.filterCurrentSite);
    }
});

// Improve access token retrieval with better error handling
async function getAccessToken() {
    try {
        // First try chrome.storage.local
        const chromeToken = await new Promise((resolve) => {
            chrome.storage.local.get(['access_token'], (result) => {
                resolve(result.access_token);
            });
        });

        if (chromeToken) {
            return chromeToken;
        }

        // No token found
        console.error('No access token found in any storage location');
        return null;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        return null;
    }
}

// Update functions that use access token
async function checkForDuplicateCredentials(website, username, currentPassword) {
    try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
            console.error('No access token found');
            return { isDuplicate: false, hasChanged: false };
        }

        // Check for duplicates
        const duplicateResponse = await fetch(`http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!duplicateResponse.ok) {
            throw new Error(`HTTP error! status: ${duplicateResponse.status}`);
        }

        const { exists } = await duplicateResponse.json();

        // If credentials exist, check for password changes
        if (exists) {
            const changeResponse = await fetch(`http://localhost:8080/api/passwords/check-password-change?website=${encodeURIComponent(website)}&username=${encodeURIComponent(username)}&currentPassword=${encodeURIComponent(currentPassword)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!changeResponse.ok) {
                throw new Error(`HTTP error! status: ${changeResponse.status}`);
            }

            const changeData = await changeResponse.json();

            // Only show notification if password has changed
            if (changeData.hasChanged) {
                showCombinedNotification(website, true, true);
            }

            return {
                isDuplicate: true,
                hasChanged: changeData.hasChanged,
                lastUpdated: changeData.lastUpdated
            };
        }

        return { isDuplicate: false, hasChanged: false };
    } catch (error) {
        console.error('Error checking credentials:', error);
        return { isDuplicate: false, hasChanged: false };
    }
}

async function sendCredentialsToBackend(credentials) {
    try {
        // Get access token
        const accessToken = await getAccessToken();

        if (!accessToken) {
            console.error('Authentication required: No access token found');
            return {
                success: false,
                error: 'Authentication required. Please log in to save credentials.'
            };
        }

        // Get the main domain for the website field
        const website = getMainUrl(credentials.url);

        // Check for duplicates first
        const duplicateCheckUrl = `http://localhost:8080/api/passwords/check-duplicate?website=${encodeURIComponent(website)}&username=${encodeURIComponent(credentials.username)}`;

        const duplicateCheckResponse = await fetch(duplicateCheckUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!duplicateCheckResponse.ok) {
            throw new Error(`Duplicate check failed (${duplicateCheckResponse.status}): ${duplicateCheckResponse.statusText}`);
        }

        const { exists } = await duplicateCheckResponse.json();

        if (exists) {
            console.log(`Credential already exists for ${website} with username ${credentials.username}`);
            return {
                success: false,
                error: 'These credentials already exist in your vault'
            };
        }

        // Prepare the data for saving
        const passwordData = {
            website: website,
            url: credentials.url,
            username: credentials.username,
            password: credentials.password,
            lastUpdated: new Date().toISOString(),
            notes: 'Saved by FortiSafe extension',
            tags: ['extension', 'auto-capture']
        };

        // Send the password to the backend
        console.log(`Saving credentials for ${website}...`);
        const saveResponse = await fetch('http://localhost:8080/api/passwords', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json().catch(() => ({}));
            throw new Error(`Save failed (${saveResponse.status}): ${errorData.message || saveResponse.statusText}`);
        }

        console.log(`Credentials for ${website} saved successfully!`);
        return {
            success: true,
            message: `Credentials for ${website} saved successfully!`
        };
    } catch (error) {
        console.error('Error sending credentials to backend:', error);
        return {
            success: false,
            error: `Failed to save: ${error.message || 'Unknown error'}`
        };
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
        const accessToken = await getAccessToken();

        // Get the main domain for the website field
        const website = getMainUrl(url);

        try {
            // Check for duplicates and password changes
            const { isDuplicate, hasChanged } = await checkForDuplicateCredentials(website, username, password);

            if (isDuplicate) {
                console.log('Duplicate credentials found in MongoDB');
                return; // Exit silently if duplicate
            }

            // If not a duplicate, show confirmation notification
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

                if (accessToken) {
                    // Try to save to backend
                    const result = await sendCredentialsToBackend(credentials);
                    if (result.success) {
                        // Add to recently saved set
                        recentlySavedCredentials.add(credentialKey);
                        // Remove after debounce time
                        setTimeout(() => {
                            recentlySavedCredentials.delete(credentialKey);
                        }, DEBOUNCE_TIME);

                        // Show success notification
                        showSaveResultNotification(true, url);
                    } else {
                        // Show error notification
                        showSaveResultNotification(false, url, result.error);
                        // Store in pending credentials
                        storeInPendingCredentials(credentials);
                    }
                } else {
                    // No access token, store in pending credentials
                    storeInPendingCredentials(credentials);
                    showSaveResultNotification(false, url, 'Stored in pending credentials. Please login to save to vault.');
                }
            });
        } catch (error) {
            console.error('Error in saveCredentials:', error);
            // Store in pending credentials on error
            storeInPendingCredentials({
                url: url,
                username: username,
                password: password,
                timestamp: new Date().toISOString()
            });
            showSaveResultNotification(false, url, 'Error saving credentials. Stored in pending.');
        }
    });
}

// Helper function to store credentials in pending storage
function storeInPendingCredentials(credentials) {
    chrome.storage.sync.get('pendingCredentials', function (data) {
        let pendingCredentials = data.pendingCredentials || [];
        pendingCredentials.push(credentials);
        chrome.storage.sync.set({ 'pendingCredentials': pendingCredentials });
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

// Update the loadPasswords function to handle password import
async function loadPasswords(container, searchInput, filterCurrentSite = false) {
    container.innerHTML = '';

    try {
        // Get access token
        const accessToken = await getAccessToken();

        // Fetch passwords from backend
        const response = await fetch('http://localhost:8080/api/passwords', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch passwords');
        }

        const passwords = await response.json();
        const searchTerm = searchInput.value.toLowerCase();
        const currentHostname = window.location.hostname;

        // Filter passwords based on search and current site if needed
        let filteredPasswords = passwords;

        if (filterCurrentSite) {
            filteredPasswords = passwords.filter(p =>
                p.website.toLowerCase().includes(currentHostname.toLowerCase())
            );
        }

        if (searchTerm) {
            filteredPasswords = filteredPasswords.filter(p =>
                p.website.toLowerCase().includes(searchTerm) ||
                p.username.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredPasswords.length === 0) {
            container.innerHTML = '<p style="color: #e0e0ff; text-align: center;">No passwords found</p>';
            return;
        }

        // Create password items
        filteredPasswords.forEach(password => {
            const item = document.createElement('div');
            item.style.cssText = `
                background: rgba(49, 46, 129, 0.3);
                border: 1px solid rgba(99, 102, 241, 0.2);
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            item.innerHTML = `
                <div style="color: #e0e0ff; font-weight: 500;">${password.website}</div>
                <div style="color: #a5b4fc; font-size: 14px;">${password.username}</div>
            `;

            item.onmouseover = () => {
                item.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
            };

            item.onmouseout = () => {
                item.style.backgroundColor = 'rgba(49, 46, 129, 0.3)';
            };

            item.onclick = async () => {
                try {
                    // Decrypt password
                    const decryptResponse = await fetch(`http://localhost:8080/api/passwords/${password._id}/decrypt`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (!decryptResponse.ok) {
                        throw new Error('Failed to decrypt password');
                    }

                    const { password: decryptedPassword } = await decryptResponse.json();

                    // Find the active password input field
                    const activeElement = document.activeElement;
                    let targetElement = null;

                    if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'password') {
                        targetElement = activeElement;
                    } else {
                        // If no active element or not a password field, find the nearest password field
                        const passwordFields = document.querySelectorAll('input[type="password"]');
                        if (passwordFields.length > 0) {
                            targetElement = passwordFields[0];
                        }
                    }

                    if (targetElement) {
                        // Fill the password field
                        targetElement.value = decryptedPassword;

                        // Trigger necessary events
                        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                        targetElement.dispatchEvent(new Event('change', { bubbles: true }));

                        // Try to find and fill username field if it exists
                        const form = targetElement.closest('form');
                        if (form) {
                            const usernameField = form.querySelector('input[type="text"], input[type="email"]');
                            if (usernameField) {
                                usernameField.value = password.username;
                                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                                usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }

                        // Show success notification
                        showImportSuccessNotification();
                    } else {
                        throw new Error('No password field found');
                    }

                    // Remove the selector
                    document.getElementById('fortisafe-password-selector').remove();
                } catch (error) {
                    console.error('Error importing password:', error);
                    showImportErrorNotification(error.message);
                }
            };

            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading passwords:', error);
        container.innerHTML = '<p style="color: #e0e0ff; text-align: center;">Error loading passwords</p>';
    }
}

// Add notification functions
function showImportSuccessNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = 'Password imported successfully!';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function showImportErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    notification.textContent = `Error: ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Update the createPasswordSelector function to handle filtering
function createPasswordSelector(filterCurrentSite = false) {
    const selector = document.createElement('div');
    selector.id = 'fortisafe-password-selector';
    selector.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a2e;
        border: 1px solid #4f46e5;
        border-radius: 8px;
        padding: 16px;
        z-index: 999999;
        min-width: 300px;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
        background: #6366f1;
        border: 2px solid #fff;
        color: #fff;
        font-size: 2.2rem;
        font-weight: bold;
        border-radius: 50%;
        box-shadow: 0 4px 18px 2px rgba(99,102,241,0.25), 0 0 0 2px #fff;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
        z-index: 10001;
        outline: none;
    `;
    closeBtn.onmouseover = () => {
        closeBtn.style.background = '#4f46e5';
        closeBtn.style.color = '#fff';
        closeBtn.style.boxShadow = '0 8px 28px 4px rgba(99,102,241,0.35), 0 0 0 2px #fff';
        closeBtn.style.transform = 'scale(1.08)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = '#6366f1';
        closeBtn.style.color = '#fff';
        closeBtn.style.boxShadow = '0 4px 18px 2px rgba(99,102,241,0.25), 0 0 0 2px #fff';
        closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => selector.remove();
    selector.appendChild(closeBtn);

    // Add Escape key handler to close selector
    function escKeyHandler(e) {
        if (e.key === 'Escape') {
            selector.remove();
            document.removeEventListener('keydown', escKeyHandler);
        }
    }
    document.addEventListener('keydown', escKeyHandler);

    // Add title
    const title = document.createElement('h3');
    title.textContent = filterCurrentSite ? 'Select Password for Current Site' : 'Select Password';
    title.style.cssText = `
        color: #e0e0ff;
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
    `;
    selector.appendChild(title);

    // Add search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search websites...';
    searchInput.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 12px;
        background: rgba(42, 40, 64, 0.7);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 6px;
        color: #e0e0ff;
        font-size: 14px;
    `;
    selector.appendChild(searchInput);

    // Add password list container
    const passwordList = document.createElement('div');
    passwordList.id = 'fortisafe-password-list';
    passwordList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    selector.appendChild(passwordList);

    // Add to page
    document.body.appendChild(selector);

    // Load passwords with initial filter
    loadPasswords(passwordList, searchInput, filterCurrentSite);

    // Add search functionality
    searchInput.addEventListener('input', (e) => {
        loadPasswords(passwordList, searchInput, filterCurrentSite);
    });

    return selector;
}

// Update the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showPasswordSelector') {
        createPasswordSelector(message.filterCurrentSite);
    }
});

// Add this function to check for password changes
async function checkPasswordChange(website, username) {
    try {
        const lastChecked = lastPasswordCheck[`${website}-${username}`] || new Date(0).toISOString();

        const response = await fetch(`${process.env.API_URL}/passwords/check-password-change`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                website,
                username,
                lastChecked
            })
        });

        if (!response.ok) {
            throw new Error('Failed to check password change');
        }

        const data = await response.json();

        if (data.hasChanged) {
            showPasswordChangeNotification(website);
        }

        // Update last check time
        lastPasswordCheck[`${website}-${username}`] = new Date().toISOString();

        return data.hasChanged;
    } catch (error) {
        console.error('Error checking password change:', error);
        return false;
    }
}

function showPasswordChangeNotification(website) {
    const notification = document.createElement('div');
    notification.id = 'fortisafe-password-change-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f56565;
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
            <strong>Password Change Detected!</strong>
        </div>
        <div style="margin-bottom: 10px;">
            The password for ${website} has been updated since your last login.
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="dismiss-notification" style="
                background: #4a5568;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
            ">Dismiss</button>
        </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('dismiss-notification').addEventListener('click', () => {
        document.body.removeChild(notification);
    });
}

// Add this function to show copy result notification
function showCopyResultNotification(success, text) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${success ? '#10b981' : '#f56565'};
        color: white;
        padding: 10px 15px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const icon = success ?
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

    notification.innerHTML = `
        ${icon}
        <span>${success ? `${text} copied to clipboard!` : `Failed to copy ${text}`}</span>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 2000);
}