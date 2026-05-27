import { DEFAULT_CONFIG, STORAGE_KEY } from './constants';
import type { ExtensionConfig } from './types';

export async function getConfig(): Promise<ExtensionConfig> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<ExtensionConfig> | undefined;
    return mergeWithDefaults(stored);
}

export async function setConfig(config: ExtensionConfig): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY]: config });
}

export function onConfigChanged(callback: (config: ExtensionConfig) => void): void {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        const change = changes[STORAGE_KEY];
        if (!change) return;
        callback(mergeWithDefaults(change.newValue as Partial<ExtensionConfig> | undefined));
    });
}

function mergeWithDefaults(stored: Partial<ExtensionConfig> | undefined): ExtensionConfig {
    if (!stored) return structuredClone(DEFAULT_CONFIG);
    return {
        categories: stored.categories ?? structuredClone(DEFAULT_CONFIG.categories),
        dynamicColumns: {
            ...DEFAULT_CONFIG.dynamicColumns,
            ...stored.dynamicColumns,
        },
        fileNames: {
            ...DEFAULT_CONFIG.fileNames,
            ...stored.fileNames,
        },
    };
}
