'use strict';

// message the web accessible script that pushState happened
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  chrome.tabs.sendMessage(details.tabId, {onHistoryStateUpdated: true}, function(response) {
    if (response && response.heardOnHistoryStateUpdated === true) {
      // nothing, here for fun *shrug* weeeeeeee
    }
  });
});
