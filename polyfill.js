// polyfill.js
(function () {
  if (!window.browser) {
    window.browser = window.chrome || {};
  }

  if (!window.browser.action) {
    if (window.chrome && window.chrome.action) {
      window.browser.action = window.chrome.action;
    } else if (window.chrome && window.chrome.browserAction) {
      window.browser.action = window.chrome.browserAction;
    }
  }
})();