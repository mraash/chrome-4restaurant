import { CATEGORIES } from '../data/categories';

interface ProductRow {
    element: HTMLTableRowElement;
    code: string;
    name: string;
}

type CategoryRule = string | [string, string];
type CategoryMap = Record<string, CategoryRule[]>;

export function sortTable(): void {
    const table    = findProductTable();
    const headerTr = getHeaderRow(table);
    const rows     = extractRows(table, headerTr);
    clearPreviousGroups(table);
    const grouped  = groupRows(rows, CATEGORIES);
    render(table, headerTr, grouped);
}

function normalize(str: string): string {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findProductTable(): HTMLTableElement {
    const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));
    const matches = tables.filter(tbl => {
        let header: HTMLTableRowElement | undefined;
        if (tbl.tHead && tbl.tHead.rows[0] && tbl.tHead.rows[0].cells.length) {
            header = tbl.tHead.rows[0];
        } else {
            header = Array.from(tbl.tBodies[0].rows).find(r => r.cells.length);
        }
        if (!header) return false;
        const texts = Array.from(header.cells).map(c => normalize(c.textContent ?? ''));
        return texts.includes('kods') && texts.includes('nosaukums');
    });
    if (matches.length !== 1) {
        throw new Error(`[Sorter] Expected exactly one product table, found ${matches.length}`);
    }
    return matches[0];
}

function getHeaderRow(table: HTMLTableElement): HTMLTableRowElement {
    if (table.tHead && table.tHead.rows[0] && table.tHead.rows[0].cells.length) {
        return table.tHead.rows[0];
    }
    const candidate = Array.from(table.tBodies[0].rows).find(r => r.cells.length);
    if (!candidate) {
        throw new Error('[Sorter] Table has no header row');
    }
    return candidate;
}

function extractRows(table: HTMLTableElement, headerRow: HTMLTableRowElement): ProductRow[] {
    const headerCells = Array.from(headerRow.cells);
    const codeIdx = headerCells.findIndex(c => normalize(c.textContent ?? '') === 'kods');
    const nameIdx = headerCells.findIndex(c => normalize(c.textContent ?? '') === 'nosaukums');
    if (codeIdx === -1 || nameIdx === -1) {
        throw new Error('[Sorter] Could not locate "Kods" / "Nosaukums" columns');
    }
    return Array.from(table.tBodies[0].rows)
        .filter(row => row !== headerRow)
        .map(row => ({
            element: row,
            code: row.cells[codeIdx]?.textContent?.trim() ?? '',
            name: row.cells[nameIdx]?.textContent?.trim() ?? ''
        }));
}

function clearPreviousGroups(table: HTMLTableElement): void {
    table.querySelectorAll('tr.group').forEach(el => el.remove());
}

function groupRows(rows: ProductRow[], categories: CategoryMap): [string, ProductRow[]][] {
    const result: [string, ProductRow[]][] = [];
    for (const [catName, rules] of Object.entries(categories)) {
        const matched: ProductRow[] = [];
        rows = rows.filter(r => {
            const hit = matchesCategory(r, rules);
            if (hit) matched.push(r);
            return !hit;
        });
        matched.sort((a, b) => a.name.localeCompare(b.name, 'lv'));
        result.push([catName, matched]);
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'lv'));
    result.push(['Bez kategorias', rows]);
    return result;
}

function matchesCategory(row: ProductRow, rules: CategoryRule[]): boolean {
    for (const rule of rules) {
        if (typeof rule === 'string') {
            if (normalize(row.name) === normalize(rule)) {
                return true;
            }
        } else {
            const [code, name] = rule;
            if (row.code === code && normalize(row.name) === normalize(name)) {
                return true;
            }
        }
    }
    return false;
}

function render(
    table: HTMLTableElement,
    headerRow: HTMLTableRowElement,
    grouped: [string, ProductRow[]][]
): void {
    const tbody   = table.tBodies[0];
    const colSpan = headerRow.cells.length;
    tbody.replaceChildren();
    tbody.appendChild(headerRow); // keep original header at top
    grouped.forEach(([cat, rows]) => {
        const divider = document.createElement('tr');
        divider.className = 'group';
        const cell = document.createElement('td');
        cell.colSpan = colSpan;
        cell.textContent = cat;
        cell.style.background = '#eee';
        cell.style.fontWeight = '600';
        cell.style.textAlign = 'center';
        cell.style.padding = '1px';
        divider.appendChild(cell);
        tbody.appendChild(divider);
        rows.forEach(r => tbody.appendChild(r.element));
    });
}
