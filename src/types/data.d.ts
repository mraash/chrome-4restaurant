export type CategoryRule = string | [string, string];
export type CategoryMap = Record<string, CategoryRule[]>;

export interface ExportSettings {
    totalColumn: string;
    mealColumns: string[];
}
