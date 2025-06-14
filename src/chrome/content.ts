import { sortTable } from '../app/sortTable';
import { exportFullPageToExcel } from '../app/exportExcel';

chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === 'SORT_BY_CATEGORY') {
        try {
            sortTable();
        } catch (err) {
            console.error(err);
            alert('Sorting error — see console for details.');
        }
    }
    if (msg?.type === 'EXPORT_TO_EXCEL') {
        try {
            exportFullPageToExcel();
        } catch (err) {
            console.error(err);
            alert('Export error — see console for details.');
        }
    }
});
