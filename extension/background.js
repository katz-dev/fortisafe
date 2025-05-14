// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REGISTRATION_FORM_DETECTED') {
        // Create notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Registration Form Detected',
            message: `Found registration data on ${new URL(message.data.url).hostname}`,
            priority: 2
        });

        // Log the data (for testing)
        console.log('Registration Form Data:', message.data);
    }
}); 