chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sort-by-category',
    title: 'Apstr\u0101d\u0101t produktu piepras\u012bjumu',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-to-excel',
    title: 'Eksport\u0113t uz Excel',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-write-off',
    title: 'Eksport\u0113t uz Horizon failu (produkti + daudzums)',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'export-write-off-no-quantity',
    title: 'Eksport\u0113t uz Horizon failu (produkti)',
    contexts: ['page']
  });
});

const CONTENT_SCRIPT_VERSION = 'file-name-settings-v1';

async function ensureContentScript(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING_CONTENT_SCRIPT_V2' });
    if (response?.version === CONTENT_SCRIPT_VERSION) return;
  } catch {
    // No compatible content script is active in this tab yet.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function sendCommand(tabId: number, type: string) {
  await ensureContentScript(tabId);
  await chrome.tabs.sendMessage(tabId, { type });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'sort-by-category') {
    sendCommand(tab.id, 'SORT_BY_CATEGORY_V2').catch(console.error);
  }
  if (info.menuItemId === 'export-to-excel') {
    sendCommand(tab.id, 'EXPORT_TO_EXCEL_V2').catch(console.error);
  }
  if (info.menuItemId === 'export-write-off') {
    sendCommand(tab.id, 'EXPORT_WRITE_OFF_V2').catch(console.error);
  }
  if (info.menuItemId === 'export-write-off-no-quantity') {
    sendCommand(tab.id, 'EXPORT_WRITE_OFF_NO_QUANTITY_V2').catch(console.error);
  }
});
