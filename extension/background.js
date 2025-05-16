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
});