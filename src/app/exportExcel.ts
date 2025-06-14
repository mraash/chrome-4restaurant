import * as XLSX from 'xlsx-js-style';

function collapseEmptyLines(arr: string[]): string[] {
    const result: string[] = [];
    let lastWasEmpty = false;
    for (const line of arr) {
        if (line === '') {
            if (!lastWasEmpty) {
                result.push(line);
                lastWasEmpty = true;
            }
        } else {
            result.push(line);
            lastWasEmpty = false;
        }
    }
    // Trim empty lines at the beginning and end
    while (result[0] === '') result.shift();
    while (result[result.length - 1] === '') result.pop();
    return result;
}

// Helper that walks the DOM after the product table and collects visible text lines (including <br> line breaks)
function collectLinesAfterTable(tbl: HTMLTableElement): string[] {
    const lines: string[] = [];

    // Walk to the next node in document order, skipping the whole subtree of the current node
    const nextNode = (node: Node | null): Node | null => {
        if (!node) return null;
        if (node.nextSibling) return node.nextSibling;
        let parent = node.parentNode;
        while (parent) {
            if (parent.nextSibling) return parent.nextSibling;
            parent = parent.parentNode;
        }
        return null;
    };

    // Extract visible text from a node (recursively for element nodes)
    const pushTextFromNode = (node: Node): void => {
        if (node.nodeType === Node.TEXT_NODE) {
            const txt = (node.textContent || '').trim();
            if (txt) lines.push(txt);
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'BR') {
                lines.push('');
                return;
            }
            const segments = el.innerText.split(/\n/);
            segments.forEach(seg => {
                const cleaned = seg.trim();
                if (cleaned || seg === '') {
                    // preserve empty segments as explicit blank lines
                    lines.push(cleaned);
                }
            });
        }
    };

    let cursor: Node | null = nextNode(tbl);
    while (cursor) {
        pushTextFromNode(cursor);
        cursor = nextNode(cursor);
    }

    return lines;
}

export function exportFullPageToExcel(): void {
    const body = document.body;
    const elements = Array.from(body.children);
    let beforeTable: string[] = [];
    let afterTable: string[] = [];
    let table: HTMLTableElement | null = null;
    let foundTable = false;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.tagName === 'TABLE' && !foundTable) {
            // Look for a table whose header contains "Kods" and "Nosaukums"
            const header = el.querySelector('tr');
            if (header) {
                const texts = Array.from(header.cells).map(c => c.textContent?.trim().toLowerCase());
                if (texts.includes('kods') && texts.includes('nosaukums')) {
                    table = el as HTMLTableElement;
                    foundTable = true;
                    continue;
                }
            }
        }
        if (!foundTable) {
            beforeTable.push(el.textContent?.trim() || '');
            if (el.tagName === 'H2') {
                beforeTable.push('');
            }
        }
    }

    // Collect everything that appears in the document *after* the product table (footer, signatures, etc.)
    afterTable = table ? collectLinesAfterTable(table) : [];

    beforeTable = collapseEmptyLines(beforeTable);
    afterTable = collapseEmptyLines(afterTable);

    // Build data array for Excel
    const ws_data: any[] = [];
    beforeTable.forEach(line => { ws_data.push([line]); });
    if (beforeTable.length) ws_data.push([]); // one blank row between page headers and the table
    let headerColCount = 0;
    // Store merges for category rows
    const merges: any[] = [];

    if (table) {
        // Add table header
        const headerRow = table.querySelector('tr');
        if (headerRow) {
            const headerCells = Array.from(headerRow.cells).map(c => c.textContent?.trim() || '');
            ws_data.push(headerCells);
            headerColCount = headerCells.length;
        }

        // Add table rows (including category divider rows with merge)
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, idx) => {
            if (idx === 0) return; // skip original header since it was already added

            const isCategoryRow = (row as HTMLElement).classList.contains('group');

            if (isCategoryRow) {
                // Category divider: merge across the entire table width
                const title = row.cells[0]?.textContent?.trim() || '';
                const rowData: string[] = Array(headerColCount).fill('');
                rowData[0] = title;
                const currentRowIndex = ws_data.length;
                merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: Math.max(0, headerColCount - 1) } });
                ws_data.push(rowData);
            } else {
                const cells = Array.from(row.cells).map(c => c.textContent?.trim() || '');
                if (cells.length) ws_data.push(cells);
            }
        });
    }
    if (afterTable.length) ws_data.push([]); // one blank row between the table and the footer
    afterTable.forEach(line => { ws_data.push([line]); });

    // Export to Excel
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    if (merges.length) {
        (ws as any)['!merges'] = merges;
        // Center text in merged title cells
        merges.forEach(m => {
            const cellAddress = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
            const cell = (ws as any)[cellAddress];
            if (cell) {
                cell.s = cell.s || {};
                cell.s.alignment = {
                    ...(cell.s.alignment ?? {}),
                    horizontal: 'center',
                    vertical: 'center'
                };
                cell.s.font = {
                    ...(cell.s.font ?? {}),
                    bold: true
                };
            }
        });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, 'full-report.xlsx');
} 