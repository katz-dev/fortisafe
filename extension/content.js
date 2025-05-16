// Content script for Form Data Saver extension
// This script runs on all web pages

console.log('Form Data Saver content script loaded on: ' + window.location.href);

// Flag to track if credential capture is enabled
let captureEnabled = false;

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

// Save credentials to storage
function saveCredentials(username, password) {
    chrome.storage.sync.get('savedCredentials', function (data) {
        let savedCredentials = data.savedCredentials || [];

        // Add the new credentials
        savedCredentials.push({
            url: window.location.href,
            username: username,
            password: password,
            timestamp: new Date().toISOString()
        });

        // Save to storage
        chrome.storage.sync.set({ 'savedCredentials': savedCredentials });

        console.log('Credentials saved for: ' + window.location.href);
    });
}