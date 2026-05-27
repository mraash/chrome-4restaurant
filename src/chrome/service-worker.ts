import { CONTEXT_MENU_ITEMS } from '../shared/constants';
import type { ContextMenuAction, RuntimeMessage } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        for (const item of CONTEXT_MENU_ITEMS) {
            chrome.contextMenus.create({
                id: item.id,
                title: item.title,
                contexts: ['page', 'frame', 'selection'],
                documentUrlPatterns: ['file:///*'],
            });
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;
    const action = info.menuItemId as ContextMenuAction;
    const message: RuntimeMessage = { action };
    void deliver(tab.id, message);
});

async function deliver(tabId: number, message: RuntimeMessage): Promise<void> {
    try {
        await chrome.tabs.sendMessage(tabId, message);
        return;
    } catch {
    // No content script on this tab — usually because the page was open before the
    // extension was (re)loaded. Inject it on demand and retry.
    }
    const injected = await injectContentScripts(tabId);
    if (!injected) return;
    try {
        await chrome.tabs.sendMessage(tabId, message);
    } catch (err: unknown) {
        console.error('[4Restaurant] Delivery failed even after injecting content script:', err);
    }
}

async function injectContentScripts(tabId: number): Promise<boolean> {
    const files = (chrome.runtime.getManifest().content_scripts ?? [])
        .flatMap(cs => cs.js ?? [])
        .filter((f): f is string => typeof f === 'string');
    if (files.length === 0) return false;
    try {
        await chrome.scripting.executeScript({ target: { tabId }, files });
        return true;
    } catch (err: unknown) {
        console.error('[4Restaurant] chrome.scripting.executeScript failed:', err);
        return false;
    }
}
