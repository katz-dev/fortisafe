// Background script for Form Data Saver extension
// This script runs in the background

console.log('Form Data Saver extension background script loaded');

// Initialize storage if needed
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.get(['savedUrls', 'savedCredentials', 'captureEnabled'], function (data) {
        if (!data.savedUrls) {
            chrome.storage.sync.set({ 'savedUrls': [] });
        }

        if (!data.savedCredentials) {
            chrome.storage.sync.set({ 'savedCredentials': [] });
        }

        if (data.captureEnabled === undefined) {
            chrome.storage.sync.set({ 'captureEnabled': false });
        }
    });

    // Create parent context menu
    chrome.contextMenus.create({
        id: "fortisafe-menu",
        title: "FortiSafe",
        contexts: ["editable"]
    });

    // Create submenu items
    chrome.contextMenus.create({
        id: "select-password",
        parentId: "fortisafe-menu",
        title: "Select Password",
        contexts: ["editable"]
    });

    chrome.contextMenus.create({
        id: "select-password-current-site",
        parentId: "fortisafe-menu",
        title: "Select Password for Current Site",
        contexts: ["editable"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "select-password" || info.menuItemId === "select-password-current-site") {
        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                // Send message to content script to show password selector
                chrome.tabs.sendMessage(currentTab.id, {
                    action: "showPasswordSelector",
                    targetElementId: info.targetElementId,
                    filterCurrentSite: info.menuItemId === "select-password-current-site"
                });
            }
        });
    }
});

// Listen for copy credential requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyToClipboard') {
        try {
            navigator.clipboard.writeText(request.text).then(() => {
                sendResponse({ success: true });
            }).catch(err => {
                console.error('Failed to copy:', err);
                sendResponse({ success: false, error: err.message });
            });
            return true; // Will respond asynchronously
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true;
});