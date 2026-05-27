import { DEFAULT_CATEGORIES } from '../data/default-categories';
import type { ExtensionConfig } from './types';

export const STORAGE_KEY = 'config';

export const DEFAULT_CONFIG: ExtensionConfig = {
    categories: DEFAULT_CATEGORIES,
    dynamicColumns: {
        totalColumn: 'Kopā',
        mealColumns: ['1. Brokastis', '2. Pusdienas', '3. Vakariņas', '4. Otrās vakariņas'],
    },
    fileNames: {
        excel: 'Pieprasījums',
        horizon: '_nor',
    },
};

/**
 * Signature label swaps applied after grouping AND in the Excel export footer.
 * Each entry fires at most once per run; idempotency is enforced via a body marker.
 */
export const SIGNATURE_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
    ['Virtuves vadītāja', 'Pārtikas noliktavas prečzinis'],
    ['Valdes priekšsēdētājs', 'Virtuves vadītāja'],
];

export const SIGNATURE_DONE_MARKER = 'fourRestaurantSig';
export const SEPARATOR_ROW_CLASS = 'four-restaurant-separator';
/** Default name for the bucket holding products that don't match any category. */
export const CATCHALL_CATEGORY_NAME = 'Pārējie';

export interface ContextMenuDef {
    id: 'group-products' | 'export-excel' | 'export-horizon-with-quantity' | 'export-horizon-codes-only';
    title: string;
}

export const CONTEXT_MENU_ITEMS: ReadonlyArray<ContextMenuDef> = [
    { id: 'group-products', title: 'Apstrādāt produktu pieprasījumu' },
    { id: 'export-excel', title: 'Eksportēt uz Excel' },
    { id: 'export-horizon-with-quantity', title: 'Eksportēt uz Horizon failu (produkti + daudzums)' },
    { id: 'export-horizon-codes-only', title: 'Eksportēt uz Horizon failu (produkti)' },
];
