import ExcelJS, { type Borders, type Worksheet } from 'exceljs';
import { SEPARATOR_ROW_CLASS, SIGNATURE_DONE_MARKER } from '../shared/constants';
import { findProductTable, readLayout, type TableLayout } from '../content/table';
import { createSignatureSwapper } from '../content/signature-replace';
import { getConfig } from '../shared/storage';
import type { ExtensionConfig } from '../shared/types';
import { downloadBlob } from './download';

export async function exportExcel(): Promise<void> {
    const table = findProductTable();
    if (!table) {
        console.warn('[4Restaurant] Product table not found — cannot export');
        return;
    }
    const layout = readLayout(table);
    if (!layout) return;

    const config = await getConfig();
    const headerSegments = extractHeaderSegments(table);
    const footerLines = extractFooterLines(table);

    // If signatures are already swapped in the page DOM, the footer text is already correct.
    // Otherwise, apply the swaps to the export text only — leave the page untouched.
    const swap
        = document.body.dataset[SIGNATURE_DONE_MARKER] === '1'
            ? (s: string) => s
            : createSignatureSwapper();
    const swappedFooter = footerLines.map(swap);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pieprasījums');

    configureColumns(ws, layout);
    writeHeader(ws, headerSegments);
    ws.addRow([]);
    writeTable(ws, layout, config);
    ws.addRow([]);
    writeFooter(ws, swappedFooter);

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(
        buffer,
        `${config.fileNames.excel}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
}

// ---------- DOM extraction ----------

/** Collects header text segments — every element/text node above the product table. */
function extractHeaderSegments(table: HTMLTableElement): string[] {
    const body = table.ownerDocument.body;
    const segments: string[] = [];
    for (const node of Array.from(body.childNodes)) {
        if (node === table) break;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (el.tagName === 'BR' || el.tagName === 'TABLE') continue;
            const text = normalize(el.textContent);
            if (text) segments.push(text);
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = normalize(node.nodeValue);
            if (text) segments.push(text);
        }
    }
    return segments;
}

/** Collects footer text as a sequence of lines, treating `<br><br>` as one blank line between groups. */
function extractFooterLines(table: HTMLTableElement): string[] {
    const body = table.ownerDocument.body;
    let html = '';
    let pastTable = false;
    for (const node of Array.from(body.childNodes)) {
        if (node === table) {
            pastTable = true;
            continue;
        }
        if (!pastTable) continue;
        if (node.nodeType === Node.ELEMENT_NODE) {
            html += (node as Element).outerHTML;
        } else if (node.nodeType === Node.TEXT_NODE) {
            html += node.nodeValue ?? '';
        }
    }
    const text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(div|p|h[1-6])>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"');

    const rawLines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim());
    while (rawLines.length > 0 && rawLines[0] === '') rawLines.shift();
    while (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') rawLines.pop();

    // Collapse consecutive blanks into a single blank line.
    const out: string[] = [];
    let prevBlank = false;
    for (const line of rawLines) {
        const blank = line === '';
        if (blank && prevBlank) continue;
        out.push(line);
        prevBlank = blank;
    }
    return out;
}

function normalize(s: string | null | undefined): string {
    return (s ?? '').replace(/\s+/g, ' ').trim();
}

function parseNumber(s: string | undefined | null): number | null {
    if (s == null) return null;
    const trimmed = s.trim().replace(/\s+/g, '').replace(',', '.');
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}

// ---------- Worksheet writers ----------

function configureColumns(ws: Worksheet, layout: TableLayout): void {
    for (let i = 0; i < layout.headers.length; i++) {
        const header = layout.headers[i] ?? '';
        let width = 12;
        if (header === 'Nosaukums') width = 30;
        else if (header === 'Kods') width = 10;
        else if (header === 'Mērvienība') width = 12;
        else if (header === 'Piezīmes') width = 16;
        else if (header.length > 8) width = Math.max(12, header.length + 2);
        ws.getColumn(i + 1).width = width;
    }
}

function writeHeader(ws: Worksheet, segments: string[]): void {
    // First 5 segments follow a specific layout with blank rows between logical groups.
    // The 3rd segment (document title) is bold.
    const layout: Array<{ idx: number; bold?: boolean } | null> = [
        { idx: 0 },
        { idx: 1 },
        null,
        { idx: 2, bold: true },
        { idx: 3 },
        null,
        { idx: 4 },
    ];

    for (const slot of layout) {
        if (slot === null) {
            ws.addRow([]);
            continue;
        }
        const seg = segments[slot.idx];
        if (seg === undefined) {
            ws.addRow([]);
            continue;
        }
        const row = ws.addRow([seg]);
        if (slot.bold) row.getCell(1).font = { bold: true };
    }

    for (let i = 5; i < segments.length; i++) {
        ws.addRow([segments[i]]);
    }
}

function writeTable(ws: Worksheet, layout: TableLayout, config: ExtensionConfig): void {
    const cols = layout.headers.length;
    const totalIdx = layout.headerIndex.get(config.dynamicColumns.totalColumn);

    // Active meal column indices in CONFIG order — only columns that actually exist in the table.
    const mealColIdxs: number[] = [];
    for (const name of config.dynamicColumns.mealColumns) {
        const idx = layout.headerIndex.get(name);
        if (idx !== undefined) mealColIdxs.push(idx);
    }

    // --- Header row (bold + borders) ---
    const headerRow = ws.addRow(layout.headers);
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: 'middle' };
        cell.border = thinBorders();
    });

    // --- Body rows (data + separators) ---
    for (const tr of layout.bodyRows) {
        if (tr.classList.contains(SEPARATOR_ROW_CLASS)) {
            writeSeparatorRow(ws, tr, cols);
        } else {
            writeDataRow(ws, tr, layout, totalIdx, mealColIdxs);
        }
    }
}

function writeSeparatorRow(ws: Worksheet, tr: HTMLTableRowElement, cols: number): void {
    const name = tr.dataset['category'] ?? normalize(tr.textContent);
    const row = ws.addRow([name]);
    const rowNum = row.number;
    ws.mergeCells(rowNum, 1, rowNum, cols);
    const cell = ws.getCell(rowNum, 1);
    cell.value = name;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Borders need to be set on each underlying cell of the merged range.
    for (let c = 1; c <= cols; c++) {
        ws.getCell(rowNum, c).border = thinBorders();
    }
}

function writeDataRow(
    ws: Worksheet,
    tr: HTMLTableRowElement,
    layout: TableLayout,
    totalIdx: number | undefined,
    mealColIdxs: number[],
): void {
    const cols = layout.headers.length;
    const cellTexts = Array.from(tr.cells, c => normalize(c.textContent));

    const totalNum = totalIdx !== undefined ? parseNumber(cellTexts[totalIdx]) : null;
    const origMeals: Array<number | null> = mealColIdxs.map(idx => parseNumber(cellTexts[idx]));

    const row = ws.addRow([]);
    const rowNum = row.number;

    for (let i = 0; i < cols; i++) {
        const cell = row.getCell(i + 1);

        if (totalIdx !== undefined && i === totalIdx && totalNum !== null) {
            cell.value = totalNum;
        } else if (
            totalIdx !== undefined
            && totalNum !== null
            && mealColIdxs.includes(i)
            && mealColIdxs.length > 0
        ) {
            const pos = mealColIdxs.indexOf(i);
            const isLast = pos === mealColIdxs.length - 1;
            const totalRef = `${ws.getColumn(totalIdx + 1).letter}${rowNum}`;

            if (isLast) {
                if (mealColIdxs.length === 1) {
                    cell.value = { formula: totalRef };
                } else {
                    const otherRefs = mealColIdxs
                        .slice(0, -1)
                        .map(idx => `${ws.getColumn(idx + 1).letter}${rowNum}`);
                    cell.value = { formula: `${totalRef}-SUM(${otherRefs.join(',')})` };
                }
            } else {
                const orig = origMeals[pos] ?? 0;
                const fraction = totalNum !== 0 ? orig / totalNum : 0;
                cell.value = { formula: `ROUND(${totalRef}*${fraction.toFixed(10)},3)` };
            }
        } else {
            cell.value = cellTexts[i] ?? '';
        }

        cell.border = thinBorders();
    }
}

function writeFooter(ws: Worksheet, lines: string[]): void {
    for (const line of lines) {
        ws.addRow([line]);
    }
}

function thinBorders(): Partial<Borders> {
    const thin = { style: 'thin' as const };
    return { top: thin, bottom: thin, left: thin, right: thin };
}
