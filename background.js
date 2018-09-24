// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var COLLECTION_URI = "https://www.designbold.com/collection/"
var dfDocumentType = "";
browser.storage.local.set({
    defaultDocumentType:  'blog-graphic'
});

browser.browserAction.onClicked.addListener((activeTab) => {
    let segment = browser.storage.local.get("defaultDocumentType");

    function onGot(item) {
        dfDocumentType = item.defaultDocumentType;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    segment.then(onGot, onError);

    let creating = browser.tabs.create({
        url: COLLECTION_URI + dfDocumentType
    });
});

var lastTabId;

// Remove context menus for a given tab, if needed
function removeContextMenus(tabId){
    if(lastTabId === tabId) browser.menus.removeAll();
}

/*
Called when the item has been created, or when creation failed due to an error.
We'll just log success/failure here.
*/
function onCreated() {
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
}

/*
Called when the item has been removed.
We'll just log success here.
*/
function onRemoved() {
    console.log("Item removed successfully");
}

/*
Called when there was an error.
We'll just log the error here.
*/
function onError(error) {
    console.log(`Error: ${error}`);
}

// chrome.contextMenus onclick handlers:
// Khi bấm chuột phải vào ảnh và chọn design with design bold
var clickHandlers = {
    startDesignTool : function(info, tab) {

        var image_src = info.srcUrl;
        let localStorage = browser.storage.local.get({
            defaultDocumentType: 'blog-graphic',
        });
        console.log("startDesignTool");
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
        removeContextMenus(tab.id);
    }
};

browser.runtime.onConnect.addListener(function(port) {
    if (!port.sender.tab || port.name != 'contextMenus') {
        // Unexpected / unknown port, do not interfere with it
        return;
    }
    var tabId = port.sender.tab.id;
    port.onDisconnect.addListener(function() {
        removeContextMenus(tabId);
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
            }, onCreated);
        }
        else if (action == "remove"){
        }

        browser.menus.onClicked.addListener(function(info, tab) {
            if (info.menuItemId == "designbold-context-menu" && action == "create") {
                clickHandlers.startDesignTool(info, tab);
            }else if (info.menuItemId == "designbold-context-menu" && action == "remove"){
                var removing = browser.menus.remove(info.menuItemId);
                removing.then(onRemoved, onError);
            }
        });

    });
});

// When a tab is removed, check if it added any context menu entries. If so, remove it
browser.tabs.onRemoved.addListener(removeContextMenus);