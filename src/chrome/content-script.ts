import { groupProducts } from '../content/group-products';
import { replaceSignatures } from '../content/signature-replace';
import { exportExcel } from '../exporters/excel';
import { exportHorizon } from '../exporters/horizon';
import type { RuntimeMessage, RuntimeResponse } from '../shared/types';

// Guard against double-registration when the service worker injects this script on demand
// (after extension reload) and the manifest also injects it on a subsequent page reload.
type ContentGlobal = { __fourRestaurantContentLoaded?: boolean };
const g = globalThis as unknown as ContentGlobal;
if (!g.__fourRestaurantContentLoaded) {
    g.__fourRestaurantContentLoaded = true;

    chrome.runtime.onMessage.addListener(
        (message: RuntimeMessage, _sender, sendResponse: (response: RuntimeResponse) => void) => {
            handle(message)
                .then(() => sendResponse({ ok: true }))
                .catch((err: unknown) => {
                    console.error('[4Restaurant]', err);
                    sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
                });
            return true;
        },
    );
}

async function handle(message: RuntimeMessage): Promise<void> {
    switch (message.action) {
        case 'group-products':
            await groupProducts();
            replaceSignatures();
            return;
        case 'export-excel':
            await exportExcel();
            return;
        case 'export-horizon-with-quantity':
            await exportHorizon({ includeQuantities: true });
            return;
        case 'export-horizon-codes-only':
            await exportHorizon({ includeQuantities: false });
            return;
    }
}
