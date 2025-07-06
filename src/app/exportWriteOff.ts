import * as XLSX from 'xlsx-js-style';

function findProductTable(): HTMLTableElement {
    const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));
    for (const tbl of tables) {
        const header = tbl.querySelector('tr');
        if (!header) continue;
        const cells = Array.from(header.cells).map(c => normalize(c.textContent ?? ''));
        if (cells.includes('kods') && cells.includes('nosaukums')) return tbl;
    }
    throw new Error('[WriteOff] Product table not found');
}

function parseNum(str: string): number {
    const cleaned = str.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isFinite(val) ? val : 0;
}

export function exportWriteOff(): void {
    const tbl = findProductTable();
    const headerCells = Array.from(tbl.querySelector('tr')!.cells);
    const idxCode = headerCells.findIndex(c => normalize(c.textContent ?? '') === 'kods');
    const idxTotal = headerCells.findIndex(c => normalize(c.textContent ?? '') === 'kopā');
    if (idxCode === -1 || idxTotal === -1) throw new Error('[WriteOff] Required columns not found');

    const data: any[][] = [];
    // Header row required by target system: Tips | Kods | Svītrkods | Daudzums
    data.push(['Tips', 'Kods', 'Svītrkods', 'Daudzums']);
    const rows = tbl.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        if (idx === 0) return; // skip header
        if ((row as HTMLElement).classList.contains('group')) return; // skip category dividers
        const cells = Array.from(row.cells);
        const code = cells[idxCode]?.textContent?.trim() ?? '';
        const totalStr = cells[idxTotal]?.textContent?.trim() ?? '';
        const total = parseNum(totalStr);
        if (!code) return;
        data.push(['', code, '', total]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WriteOff');
    XLSX.writeFile(wb, 'Write-off.xls', { bookType: 'xls' });
}

export function exportWriteOffNoQuantity(): void {
    const tbl = findProductTable();
    const headerCells = Array.from(tbl.querySelector('tr')!.cells);
    const idxCode = headerCells.findIndex(c => normalize(c.textContent ?? '') === 'kods');
    if (idxCode === -1) throw new Error('[WriteOff] Code column not found');

    const data: any[][] = [];
    // Header row required by target system: Tips | Kods | Svītrkods | Daudzums
    data.push(['Tips', 'Kods', 'Svītrkods', 'Daudzums']);
    const rows = tbl.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        if (idx === 0) return; // skip header
        if ((row as HTMLElement).classList.contains('group')) return; // skip category dividers
        const cells = Array.from(row.cells);
        const code = cells[idxCode]?.textContent?.trim() ?? '';
        if (!code) return;
        data.push(['', code, '', '']); // Leave quantity empty
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WriteOff');
    XLSX.writeFile(wb, 'Write-off-products.xls', { bookType: 'xls' });
}

function normalize(str: string): string {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
} 