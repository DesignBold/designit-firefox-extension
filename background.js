// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var COLLECTION_URI = "https://www.designbold.com/collection/"

browser.browserAction.onClicked.addListener((activeTab) => {
    let option = browser.storage.local.get({
        defaultDocumentType: "blog-graphic"
    });
    function onGot(item){
        let creating = browser.tabs.create({
            url: COLLECTION_URI + item.defaultDocumentType
        });
    }
    function onError(error) {
        console.log(`Error: ${error}`);
    }
    option.then(onGot, onError);
});

// Remove context menus for a given tab, if needed
function removeContextMenus(tabId){
    function onRemoved() {
        console.log("Item removed successfully");
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var removing = browser.menus.remove(tabId);
    removing.then(onRemoved, onError);
}

// chrome.contextMenus onclick handlers:
var clickHandlers = {
    startDesignTool : function(info, tab) {

        var image_src = info.srcUrl;
        let localStorage = browser.storage.local.get({
            defaultDocumentType: 'blog-graphic',
        });
        function onGot(items) {
            var document_type = items.defaultDocumentType;
            browser.tabs.executeScript(tab.id,{
                code : 'var designboldframe = document.getElementById("designbold-extension-iframe");var data= {action:"#db#design-button#start_design_tool",image:"'+image_src+'",param:{doc_type:"'+document_type+'"}};designboldframe.contentWindow.postMessage(data,"*");designboldframe.style.display="block";'
            },function(){

            });
        }

        function onError(error) {
            console.log(`Error: ${error}`);
        }

        localStorage.then(onGot, onError);
        // Example: Remove contextmenus for context
        removeContextMenus("designbold-context-menu");
    }
};

browser.runtime.onConnect.addListener(function(port) {
    if (!port.sender.tab || port.name != 'contextMenus') {
        // Unexpected / unknown port, do not interfere with it
        return;
    }
    var tabId = port.sender.tab.id;
    port.onDisconnect.addListener(function() {
        removeContextMenus("designbold-context-menu");
    });
    // Whenever a message is posted, expect that it's identical to type
    // createProperties of chrome.contextMenus.create, except for onclick.
    // "onclick" should be a string which maps to a predefined function
    port.onMessage.addListener(function(data) {
        var action = data.action;
        if (action == 'create'){
            browser.menus.create({
                id: 'designbold-context-menu',
                title: browser.i18n.getMessage('openContextMenuTitle'),
                contexts: ["image"],
            });
        }
        else if (action == "remove"){
            removeContextMenus("designbold-context-menu");
        }

        browser.menus.onClicked.addListener(function(info, tab) {
            if (info.menuItemId == "designbold-context-menu" && action == "create") {
                clickHandlers.startDesignTool(info, tab);
            }
        });

    });
});

// When a tab is removed, check if it added any context menu entries. If so, remove it
browser.tabs.onRemoved.addListener(removeContextMenus);