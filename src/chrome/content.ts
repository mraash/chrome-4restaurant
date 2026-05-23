import { sortTable } from '../app/sortTable';
import { exportFullPageToExcel } from '../app/exportExcel';

const CONTENT_SCRIPT_VERSION = 'file-name-settings-v1';
const state = window as typeof window & { __restaurantContentScriptVersion?: string };

if (state.__restaurantContentScriptVersion !== CONTENT_SCRIPT_VERSION) {
    state.__restaurantContentScriptVersion = CONTENT_SCRIPT_VERSION;

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'PING_CONTENT_SCRIPT_V2') {
        sendResponse({ version: CONTENT_SCRIPT_VERSION });
        return;
    }
    if (msg?.type === 'SORT_BY_CATEGORY_V2') {
        sortTable().catch(err => {
            console.error(err);
            alert('Sorting error - see console for details.');
        });
    }
    if (msg?.type === 'EXPORT_TO_EXCEL_V2') {
        exportFullPageToExcel().catch(err => {
            console.error(err);
            alert('Export error - see console for details.');
        });
    }
    if (msg?.type === 'EXPORT_WRITE_OFF_V2') {
        import('../app/exportWriteOff').then(mod => {
            mod.exportWriteOff().catch(err => {
                console.error(err);
                alert('Write-off export error - see console for details.');
            });
        });
    }
    if (msg?.type === 'EXPORT_WRITE_OFF_NO_QUANTITY_V2') {
        import('../app/exportWriteOff').then(mod => {
            mod.exportWriteOffNoQuantity().catch(err => {
                console.error(err);
                alert('Write-off export (no quantity) error - see console for details.');
            });
        });
    }
    });
}
