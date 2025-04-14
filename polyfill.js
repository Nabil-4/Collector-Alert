// polyfill.js
window.browser = window.browser || window.chrome;

// Polyfill pour browser.action
if (window.chrome && chrome.action && !browser.action) {
  browser.action = {
    setBadgeText: (details) => chrome.action.setBadgeText(details),
    setBadgeBackgroundColor: (details) => chrome.action.setBadgeBackgroundColor(details)
  };
}