chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sort-by-category',
    title: 'Kategorizēt pieprasījumu tabulu',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-to-excel',
    title: 'Eksportēt uz Excel',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-write-off',
    title: 'Exportēt uz Horizon failu (produkti + daudzums)',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-write-off-no-quantity',
    title: 'Exportēt uz Horizon failu (produkti)',
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
  if (info.menuItemId === 'export-write-off' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'EXPORT_WRITE_OFF' });
  }
  if (info.menuItemId === 'export-write-off-no-quantity' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'EXPORT_WRITE_OFF_NO_QUANTITY' });
  }
});
