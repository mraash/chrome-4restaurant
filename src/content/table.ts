/**
 * Locates the product requisition table on the current page.
 * Heuristic: a <table> whose <th> headers include both "Kods" and "Nosaukums".
 */
export function findProductTable(): HTMLTableElement | null {
    for (const table of document.querySelectorAll('table')) {
        const headerTexts = Array.from(table.querySelectorAll('th'), th => (th.textContent ?? '').trim());
        if (headerTexts.includes('Kods') && headerTexts.includes('Nosaukums')) {
            return table;
        }
    }
    return null;
}

export interface TableLayout {
    table: HTMLTableElement;
    tbody: HTMLTableSectionElement;
    headerRow: HTMLTableRowElement;
    headers: string[];
    /** Index of each header by trimmed text. */
    headerIndex: Map<string, number>;
    /** Rows after the header row (includes separator rows once grouping has run). */
    bodyRows: HTMLTableRowElement[];
}

export function readLayout(table: HTMLTableElement): TableLayout | null {
    const tbody = table.tBodies[0];
    if (!tbody) return null;
    const rows = Array.from(tbody.rows);
    const headerRow = rows.find(r => r.querySelector('th'));
    if (!headerRow) return null;
    const headers = Array.from(headerRow.cells, c => (c.textContent ?? '').trim());
    const headerIndex = new Map<string, number>();
    headers.forEach((h, i) => headerIndex.set(h, i));
    const bodyRows = rows.filter(r => r !== headerRow);
    return { table, tbody, headerRow, headers, headerIndex, bodyRows };
}
