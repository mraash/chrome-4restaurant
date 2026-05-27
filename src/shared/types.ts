export interface CategoryRule {
    /** Keyword matched against product name (case-insensitive, contains-match). */
    keyword: string;
}

export interface Category {
    id: string;
    name: string;
    rules: CategoryRule[];
}

export interface DynamicColumns {
    /** Header text of the "total quantity" column. */
    totalColumn: string;
    /** Header texts of meal columns whose values become proportional formulas in the Excel export. */
    mealColumns: string[];
}

export interface FileNames {
    /** Base name (without extension) for the Excel export. */
    excel: string;
    /** Base name (without extension) for the Horizon export. */
    horizon: string;
}

export interface ExtensionConfig {
    categories: Category[];
    dynamicColumns: DynamicColumns;
    fileNames: FileNames;
}

export type ContextMenuAction
    = | 'group-products'
        | 'export-excel'
        | 'export-horizon-with-quantity'
        | 'export-horizon-codes-only';

export interface RuntimeMessage {
    action: ContextMenuAction;
}

export interface RuntimeResponse {
    ok: boolean;
    error?: string;
}
