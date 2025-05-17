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