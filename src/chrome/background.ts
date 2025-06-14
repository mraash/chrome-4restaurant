chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sort-by-category',
    title: 'Sort by category',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-to-excel',
    title: 'Export to excel',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sort-by-category' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'SORT_BY_CATEGORY' });
  }
  if (info.menuItemId === 'export-to-excel' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'EXPORT_TO_EXCEL' });
  }
});
