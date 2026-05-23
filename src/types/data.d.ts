export type CategoryRule = string | [string, string];
export type CategoryMap = Record<string, CategoryRule[]>;

export interface ExportSettings {
    totalColumn: string;
    mealColumns: string[];
}

export interface FileNameSettings {
    excelRequest: string;
    horizonWriteOff: string;
}
