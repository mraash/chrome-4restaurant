import { CATCHALL_CATEGORY_NAME, SEPARATOR_ROW_CLASS } from '../shared/constants';
import { getConfig } from '../shared/storage';
import type { Category } from '../shared/types';
import { findProductTable, readLayout } from './table';

const LV_COLLATOR = new Intl.Collator('lv-LV', { sensitivity: 'base' });

/**
 * Groups the product table rows by category and sorts within each group.
 *
 * Idempotent — running it again on an already-grouped table flattens the existing
 * separator rows first and then re-groups, so the final state always reflects the
 * current configuration.
 */
export async function groupProducts(): Promise<void> {
    const table = findProductTable();
    if (!table) {
        console.warn('[4Restaurant] Product table not found on this page');
        return;
    }

    removeExistingSeparators(table);

    const layout = readLayout(table);
    if (!layout) return;

    const nameIdx = layout.headerIndex.get('Nosaukums');
    if (nameIdx === undefined) {
        console.warn('[4Restaurant] "Nosaukums" column not found in product table');
        return;
    }

    const config = await getConfig();
    const colspan = layout.headers.length;

    const buckets = new Map<string, HTMLTableRowElement[]>();
    for (const cat of config.categories) buckets.set(cat.id, []);
    const catchall: HTMLTableRowElement[] = [];

    for (const row of layout.bodyRows) {
        const productName = (row.cells[nameIdx]?.textContent ?? '').trim();
        const cat = categorize(productName, config.categories);
        if (cat) {
            buckets.get(cat.id)!.push(row);
        } else {
            catchall.push(row);
        }
    }

    const sortByName = (a: HTMLTableRowElement, b: HTMLTableRowElement): number =>
        LV_COLLATOR.compare(
            (a.cells[nameIdx]?.textContent ?? '').trim(),
            (b.cells[nameIdx]?.textContent ?? '').trim(),
        );
    for (const rows of buckets.values()) rows.sort(sortByName);
    catchall.sort(sortByName);

    for (const cat of config.categories) {
        const rows = buckets.get(cat.id);
        if (!rows || rows.length === 0) continue;
        layout.tbody.appendChild(createSeparator(cat.name || 'Bez nosaukuma', colspan));
        for (const row of rows) layout.tbody.appendChild(row);
    }
    if (catchall.length > 0) {
        layout.tbody.appendChild(createSeparator(CATCHALL_CATEGORY_NAME, colspan));
        for (const row of catchall) layout.tbody.appendChild(row);
    }
}

/** Returns the first category matching the product name, or `null` for the catch-all bucket. */
function categorize(productName: string, categories: Category[]): Category | null {
    const lower = productName.toLowerCase();
    for (const cat of categories) {
        for (const rule of cat.rules) {
            const kw = rule.keyword.trim();
            if (kw && lower.includes(kw.toLowerCase())) {
                return cat;
            }
        }
    }
    return null;
}

function removeExistingSeparators(table: HTMLTableElement): void {
    table.querySelectorAll(`tr.${SEPARATOR_ROW_CLASS}`).forEach(r => r.remove());
}

function createSeparator(name: string, colspan: number): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = SEPARATOR_ROW_CLASS;
    tr.dataset['category'] = name;
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.style.fontWeight = 'bold';
    td.style.textAlign = 'center';
    td.style.background = '#f0f0f0';
    td.style.padding = '2px 8px';
    td.style.lineHeight = '1.2';
    td.textContent = name;
    tr.appendChild(td);
    return tr;
}
