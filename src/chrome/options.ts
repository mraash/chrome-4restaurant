import type { CategoryMap, ExportSettings, FileNameSettings } from '../types/data';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/categories';
import { DEFAULT_FILE_NAME_SETTINGS, normalizeFileNameSettings } from '../app/fileNames';

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
    totalColumn: '',
    mealColumns: []
};
const DEFAULT_MEAL_COLUMNS_TO_CLEAR = [
    ['brokastis', 'pusdienas', 'launags', 'vakariņas'],
    ['brokastis', 'pusdienas', 'vakariņas', 'otrās vakariņas']
];

let currentCategories: CategoryMap = {};
let currentExportSettings: ExportSettings = {
    ...DEFAULT_EXPORT_SETTINGS,
    mealColumns: [...DEFAULT_EXPORT_SETTINGS.mealColumns]
};
let currentFileNameSettings: FileNameSettings = { ...DEFAULT_FILE_NAME_SETTINGS };
let categoryOrder: string[] = [];
let activeCategoryName: string | null = null;
let draggedCategoryName: string | null = null;

function isDefaultMealColumns(mealColumns: string[]): boolean {
    return DEFAULT_MEAL_COLUMNS_TO_CLEAR.some(defaultColumns =>
        mealColumns.length === defaultColumns.length
            && mealColumns.every((col, index) => col === defaultColumns[index])
    );
}

function normalizeExportSettings(settings: Partial<ExportSettings> | undefined): ExportSettings {
    const totalColumn = settings?.totalColumn || '';
    const mealColumns = Array.isArray(settings?.mealColumns) ? settings.mealColumns : [];
    const shouldClearDefaults = totalColumn === 'kopā' && isDefaultMealColumns(mealColumns);

    return {
        totalColumn: shouldClearDefaults ? DEFAULT_EXPORT_SETTINGS.totalColumn : totalColumn,
        mealColumns: shouldClearDefaults ? [...DEFAULT_EXPORT_SETTINGS.mealColumns] : mealColumns
    };
}

// Navigation
const navCategoriesBtn = document.getElementById('nav-categories') as HTMLButtonElement;
const navExportColsBtn = document.getElementById('nav-export-cols') as HTMLButtonElement;
const navFileNamesBtn = document.getElementById('nav-file-names') as HTMLButtonElement;
const tabCategories = document.getElementById('tab-categories') as HTMLElement;
const tabExportCols = document.getElementById('tab-export-cols') as HTMLElement;
const tabFileNames = document.getElementById('tab-file-names') as HTMLElement;

// Categories Tab Elements
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const saveCategoriesBtn = document.getElementById('save-categories-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

const addCategoryBtn = document.getElementById('add-category-btn') as HTMLButtonElement;
const categoryListEl = document.getElementById('category-list') as HTMLUListElement;
const categoryDetailsEl = document.getElementById('category-details') as HTMLDivElement;
const noSelectionEl = document.getElementById('no-selection') as HTMLDivElement;

const categoryNameInput = document.getElementById('category-name-input') as HTMLInputElement;
const deleteCategoryBtn = document.getElementById('delete-category-btn') as HTMLButtonElement;
const newProductInput = document.getElementById('new-product-input') as HTMLInputElement;
const addProductBtn = document.getElementById('add-product-btn') as HTMLButtonElement;
const productListEl = document.getElementById('product-list') as HTMLUListElement;

// Export Cols Tab Elements
const saveExportColsBtn = document.getElementById('save-export-cols-btn') as HTMLButtonElement;
const totalColInput = document.getElementById('total-col-input') as HTMLInputElement;
const newMealColInput = document.getElementById('new-meal-col-input') as HTMLInputElement;
const addMealColBtn = document.getElementById('add-meal-col-btn') as HTMLButtonElement;
const mealColList = document.getElementById('meal-col-list') as HTMLUListElement;

// File Names Tab Elements
const saveFileNamesBtn = document.getElementById('save-file-names-btn') as HTMLButtonElement;
const excelFilenameInput = document.getElementById('excel-filename-input') as HTMLInputElement;
const horizonFilenameInput = document.getElementById('horizon-filename-input') as HTMLInputElement;

const statusMessage = document.getElementById('status-message') as HTMLDivElement;

async function init() {
    const data = await chrome.storage.local.get(['customCategories', 'exportSettings', 'categoryOrder', 'fileNameSettings']);
    if (data.customCategories) {
        currentCategories = data.customCategories;
    } else {
        currentCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    
    if (data.categoryOrder && Array.isArray(data.categoryOrder)) {
        categoryOrder = data.categoryOrder;
    } else {
        categoryOrder = Object.keys(currentCategories);
    }
    
    if (data.exportSettings) {
        currentExportSettings = normalizeExportSettings(data.exportSettings);
    }

    if (data.fileNameSettings) {
        currentFileNameSettings = normalizeFileNameSettings(data.fileNameSettings);
    }
    
    renderCategories();
    renderExportSettings();
    renderFileNameSettings();
    setupEventListeners();
}

// --- Navigation ---
function switchTab(tabId: 'categories' | 'export' | 'files') {
    navCategoriesBtn.classList.toggle('active', tabId === 'categories');
    navExportColsBtn.classList.toggle('active', tabId === 'export');
    navFileNamesBtn.classList.toggle('active', tabId === 'files');
    tabCategories.style.display = tabId === 'categories' ? '' : 'none';
    tabExportCols.style.display = tabId === 'export' ? '' : 'none';
    tabFileNames.style.display = tabId === 'files' ? '' : 'none';

    saveCurrentCategoryName();
    syncExportSettingsInputs();
    syncFileNameSettingsInputs();
    if (tabId !== 'categories') {
        renderCategories();
    }
    window.scrollTo({ top: 0, left: 0 });
}

// --- Categories Logic ---
function renderCategories() {
    categoryListEl.innerHTML = '';
    
    // Sync order with current categories
    let categories = categoryOrder.filter(cat => currentCategories[cat] !== undefined);
    for (const cat of Object.keys(currentCategories)) {
        if (!categories.includes(cat)) categories.push(cat);
    }
    categoryOrder = categories;
    
    if (activeCategoryName && !categories.includes(activeCategoryName)) {
        activeCategoryName = null;
    }
    
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.textContent = cat;
        li.draggable = true;
        
        if (cat === activeCategoryName) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            if (activeCategoryName !== cat) {
                saveCurrentCategoryName();
            }
            activeCategoryName = cat;
            renderCategories();
            renderCategoryDetails();
        });
        
        // Drag & Drop events
        li.addEventListener('dragstart', (e) => {
            draggedCategoryName = cat;
            setTimeout(() => li.classList.add('dragging'), 0);
        });
        
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            draggedCategoryName = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
        
        li.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            if (draggedCategoryName && draggedCategoryName !== cat) {
                li.classList.add('drag-over');
            }
        });
        
        li.addEventListener('dragleave', () => {
            li.classList.remove('drag-over');
        });
        
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            li.classList.remove('drag-over');
            if (draggedCategoryName && draggedCategoryName !== cat) {
                reorderCategories(draggedCategoryName, cat);
            }
        });
        
        categoryListEl.appendChild(li);
    });
    
    renderCategoryDetails();
}

function reorderCategories(draggedName: string, targetName: string) {
    const draggedIdx = categoryOrder.indexOf(draggedName);
    const targetIdx = categoryOrder.indexOf(targetName);
    
    if (draggedIdx === -1 || targetIdx === -1) return;
    
    categoryOrder.splice(draggedIdx, 1);
    
    const insertIdx = categoryOrder.indexOf(targetName);
    
    // If dragging downwards, insert after the target. If upwards, insert before.
    if (draggedIdx < targetIdx) {
        categoryOrder.splice(insertIdx + 1, 0, draggedName);
    } else {
        categoryOrder.splice(insertIdx, 0, draggedName);
    }
    
    renderCategories();
}

function saveCurrentCategoryName() {
    if (!activeCategoryName) return;
    const newName = categoryNameInput.value.trim();
    if (newName && newName !== activeCategoryName) {
        // Rename in map
        currentCategories[newName] = currentCategories[activeCategoryName];
        delete currentCategories[activeCategoryName];
        
        // Rename in order array
        const idx = categoryOrder.indexOf(activeCategoryName);
        if (idx !== -1) {
            categoryOrder[idx] = newName;
        }
        
        activeCategoryName = newName;
    }
}

function renderCategoryDetails() {
    if (!activeCategoryName) {
        noSelectionEl.style.display = 'flex';
        categoryDetailsEl.style.display = 'none';
        return;
    }
    
    noSelectionEl.style.display = 'none';
    categoryDetailsEl.style.display = 'flex';
    categoryNameInput.value = activeCategoryName;
    productListEl.innerHTML = '';
    
    const rules = currentCategories[activeCategoryName] || [];
    rules.forEach((rule, index) => {
        const li = document.createElement('li');
        const text = typeof rule === 'string' ? rule : `${rule[0]} - ${rule[1]}`;
        
        const span = document.createElement('span');
        span.textContent = text;
        li.appendChild(span);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-product';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        delBtn.title = 'Dzēst produktu';
        delBtn.addEventListener('click', () => {
            currentCategories[activeCategoryName!].splice(index, 1);
            renderCategoryDetails();
        });
        
        li.appendChild(delBtn);
        productListEl.appendChild(li);
    });
}

// --- Export Cols Logic ---
function renderExportSettings() {
    totalColInput.value = currentExportSettings.totalColumn || '';
    mealColList.innerHTML = '';
    
    currentExportSettings.mealColumns.forEach((col, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = col;
        li.appendChild(span);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-product';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        delBtn.title = 'Dzēst kolonnu';
        delBtn.addEventListener('click', () => {
            currentExportSettings.mealColumns.splice(index, 1);
            renderExportSettings();
        });
        li.appendChild(delBtn);
        mealColList.appendChild(li);
    });
}

function syncExportSettingsInputs() {
    currentExportSettings.totalColumn = totalColInput.value.trim();
}

// --- File Names Logic ---
function renderFileNameSettings() {
    excelFilenameInput.value = currentFileNameSettings.excelRequest;
    horizonFilenameInput.value = currentFileNameSettings.horizonWriteOff;
}

function syncFileNameSettingsInputs() {
    currentFileNameSettings = normalizeFileNameSettings({
        excelRequest: excelFilenameInput.value,
        horizonWriteOff: horizonFilenameInput.value
    });
}

async function saveAllToStorage() {
    saveCurrentCategoryName();
    syncExportSettingsInputs();
    syncFileNameSettingsInputs();
    await chrome.storage.local.set({ 
        customCategories: currentCategories,
        exportSettings: currentExportSettings,
        fileNameSettings: currentFileNameSettings,
        categoryOrder: categoryOrder
    });
    showStatus('Iestatījumi veiksmīgi saglabāti!', 'success');
}

// --- Event Listeners ---
function setupEventListeners() {
    // Navigation
    navCategoriesBtn.addEventListener('click', () => switchTab('categories'));
    navExportColsBtn.addEventListener('click', () => switchTab('export'));
    navFileNamesBtn.addEventListener('click', () => switchTab('files'));

    // Categories
    addCategoryBtn.addEventListener('click', () => {
        saveCurrentCategoryName();
        let i = 1;
        let newName = `Jauna Kategorija`;
        while (currentCategories[newName]) {
            newName = `Jauna Kategorija ${i}`;
            i++;
        }
        currentCategories[newName] = [];
        categoryOrder.push(newName);
        activeCategoryName = newName;
        renderCategories();
        categoryNameInput.focus();
    });
    
    deleteCategoryBtn.addEventListener('click', () => {
        if (!activeCategoryName) return;
        if (confirm(`Vai tiešām vēlaties dzēst kategoriju "${activeCategoryName}"?`)) {
            delete currentCategories[activeCategoryName];
            categoryOrder = categoryOrder.filter(c => c !== activeCategoryName);
            activeCategoryName = null;
            renderCategories();
        }
    });
    
    categoryNameInput.addEventListener('change', () => {
        saveCurrentCategoryName();
        renderCategories();
    });
    
    addProductBtn.addEventListener('click', () => {
        if (!activeCategoryName) return;
        const val = newProductInput.value.trim();
        if (val) {
            currentCategories[activeCategoryName].push(val);
            newProductInput.value = '';
            renderCategoryDetails();
            newProductInput.focus();
        }
    });
    
    newProductInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProductBtn.click();
    });
    
    saveCategoriesBtn.addEventListener('click', saveAllToStorage);
    saveExportColsBtn.addEventListener('click', saveAllToStorage);
    saveFileNamesBtn.addEventListener('click', saveAllToStorage);
    
    // Export Settings
    totalColInput.addEventListener('change', syncExportSettingsInputs);
    excelFilenameInput.addEventListener('change', syncFileNameSettingsInputs);
    horizonFilenameInput.addEventListener('change', syncFileNameSettingsInputs);
    
    addMealColBtn.addEventListener('click', () => {
        const val = newMealColInput.value.trim();
        if (val && !currentExportSettings.mealColumns.includes(val)) {
            currentExportSettings.mealColumns.push(val);
            newMealColInput.value = '';
            renderExportSettings();
            newMealColInput.focus();
        }
    });
    
    newMealColInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMealColBtn.click();
    });

    // Import / Export
    exportBtn.addEventListener('click', () => {
        saveCurrentCategoryName();
        syncExportSettingsInputs();
        syncFileNameSettingsInputs();
        
        const dataStr = JSON.stringify({
            categories: currentCategories,
            exportSettings: currentExportSettings,
            fileNameSettings: currentFileNameSettings,
            categoryOrder: categoryOrder
        }, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `4restaurant_iestatijumi_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    importBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string);
                
                if (parsed.categories || parsed.exportSettings || parsed.fileNameSettings || parsed.categoryOrder) {
                    if (parsed.categories) currentCategories = parsed.categories;
                    if (parsed.exportSettings) currentExportSettings = normalizeExportSettings(parsed.exportSettings);
                    if (parsed.fileNameSettings) currentFileNameSettings = normalizeFileNameSettings(parsed.fileNameSettings);
                    if (parsed.categoryOrder) {
                        categoryOrder = parsed.categoryOrder;
                    } else {
                        categoryOrder = Object.keys(currentCategories);
                    }
                } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    currentCategories = parsed;
                } else {
                    throw new Error("Nepareizs formāts");
                }
                
                activeCategoryName = null;
                renderCategories();
                renderExportSettings();
                renderFileNameSettings();
                showStatus('Iestatījumi veiksmīgi importēti! Neaizmirstiet saglabāt.', 'success');
            } catch (err) {
                showStatus('Kļūda importējot failu: nederīgs formāts.', 'error');
            }
            fileInput.value = '';
        };
        reader.readAsText(file);
    });
}

function showStatus(msg: string, type: 'success'|'error') {
    statusMessage.textContent = msg;
    statusMessage.className = `toast status-${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
