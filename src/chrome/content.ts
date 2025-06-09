import { sortTable } from '../app/sortTable';

chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === 'SORT_BY_CATEGORY') {
        try {
            sortTable();
        } catch (err) {
            console.error(err);
            alert('Sorting error — see console for details.');
        }
    }
});
