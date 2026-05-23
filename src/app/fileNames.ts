import type { FileNameSettings } from '../types/data';

export const DEFAULT_FILE_NAME_SETTINGS: FileNameSettings = {
    excelRequest: 'report',
    horizonWriteOff: 'writeoff'
};

function normalizeBaseFileName(fileName: string | undefined, fallback: string): string {
    return fileName?.trim().replace(/^\.+/, '') || fallback;
}

export function normalizeFileNameSettings(settings: Partial<FileNameSettings> | undefined): FileNameSettings {
    return {
        excelRequest: normalizeBaseFileName(settings?.excelRequest, DEFAULT_FILE_NAME_SETTINGS.excelRequest),
        horizonWriteOff: normalizeBaseFileName(settings?.horizonWriteOff, DEFAULT_FILE_NAME_SETTINGS.horizonWriteOff)
    };
}

export function appendExtension(fileName: string, extension: string): string {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    const trimmed = fileName.trim();
    return `${trimmed}${ext}`;
}
