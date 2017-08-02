chrome.contextMenus.create({
 title: "Add calendar event",
 contexts:["selection"],  // ContextType
});

chrome.contextMenus.onClicked.addListener(
  function(info, tab) {
    var selection = info.selectionText;
    chrome.tabs.create({
            url: chrome.extension.getURL('index.html'),
            active: false
        }, function(tab) {
            // After the tab has been created, open a window to inject the tab
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                width: 500,
                height: 450
            });
        });

    chrome.extension.onMessage.addListener(
        function (request, sender, sendResponse) {
        //send the selection back as response
        sendResponse({"selection":selection});
        //remove listener so that further events go to the right place
        chrome.extension.onMessage.removeListener(arguments.callee);
    });

});
