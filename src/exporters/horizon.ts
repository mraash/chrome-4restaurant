import { SEPARATOR_ROW_CLASS } from '../shared/constants';
import { findProductTable, readLayout } from '../content/table';
import { getConfig } from '../shared/storage';
import { downloadBlob } from './download';

export interface HorizonOptions {
    includeQuantities: boolean;
}

interface HorizonRow {
    code: string;
    quantity: number | null;
}

const HEADERS = ['Tips', 'Kods', 'Svītrkods', 'Daudzums'] as const;

/**
 * Builds a 4-column .xls file for Horizon import: `Tips | Kods | Svītrkods | Daudzums`.
 *
 * Output is SpreadsheetML 2003 (XML inside an .xls extension). Excel and most Latvian
 * accounting imports (including Horizon) accept this format.
 *
 * Skips category separator rows and rows with no product code. `Tips` and `Svītrkods` are
 * always empty; `Daudzums` is the total quantity (or empty in the codes-only variant).
 */
export async function exportHorizon(options: HorizonOptions): Promise<void> {
    const table = findProductTable();
    if (!table) {
        console.warn('[4Restaurant] Product table not found — cannot export');
        return;
    }
    const layout = readLayout(table);
    if (!layout) return;

    const config = await getConfig();
    const kodsIdx = layout.headerIndex.get('Kods');
    if (kodsIdx === undefined) {
        console.warn('[4Restaurant] "Kods" column not found in product table');
        return;
    }
    const totalIdx = layout.headerIndex.get(config.dynamicColumns.totalColumn);

    const rows: HorizonRow[] = [];
    for (const tr of layout.bodyRows) {
        if (tr.classList.contains(SEPARATOR_ROW_CLASS)) continue;
        const code = (tr.cells[kodsIdx]?.textContent ?? '').trim();
        if (!code) continue;

        let quantity: number | null = null;
        if (options.includeQuantities && totalIdx !== undefined) {
            quantity = parseNumber(tr.cells[totalIdx]?.textContent);
        }
        rows.push({ code, quantity });
    }

    const xml = buildSpreadsheetML(rows, options.includeQuantities);
    downloadBlob(xml, `${config.fileNames.horizon}.xls`, 'application/vnd.ms-excel');
}

function parseNumber(s: string | undefined | null): number | null {
    if (s == null) return null;
    const trimmed = s.trim().replace(/\s+/g, '').replace(',', '.');
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}

function buildSpreadsheetML(rows: HorizonRow[], includeQty: boolean): string {
    const out: string[] = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<?mso-application progid="Excel.Sheet"?>');
    out.push(
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
        + ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    );
    out.push('  <Worksheet ss:Name="Horizon">');
    out.push('    <Table>');

    out.push('      <Row>');
    for (const h of HEADERS) {
        out.push(`        <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`);
    }
    out.push('      </Row>');

    for (const row of rows) {
        out.push('      <Row>');
        // Tips — always empty
        out.push('        <Cell><Data ss:Type="String"></Data></Cell>');
        // Kods — product code
        out.push(`        <Cell><Data ss:Type="String">${escapeXml(row.code)}</Data></Cell>`);
        // Svītrkods — always empty
        out.push('        <Cell><Data ss:Type="String"></Data></Cell>');
        // Daudzums — number, or empty
        if (includeQty && row.quantity !== null) {
            out.push(`        <Cell><Data ss:Type="Number">${row.quantity}</Data></Cell>`);
        } else {
            out.push('        <Cell><Data ss:Type="String"></Data></Cell>');
        }
        out.push('      </Row>');
    }

    out.push('    </Table>');
    out.push('  </Worksheet>');
    out.push('</Workbook>');
    return out.join('\n');
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
