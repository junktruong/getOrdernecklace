// Background script
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Example: Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle messages here
    console.log('Received message:', request);
});