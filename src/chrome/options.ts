import type { State } from '../options/types';
import { renderCategoriesTab } from '../options/tabs/categories';
import { renderDynamicColumnsTab } from '../options/tabs/dynamic-columns';
import { renderFileNamesTab } from '../options/tabs/file-names';
import { showToast } from '../options/ui';
import { getConfig, setConfig } from '../shared/storage';

async function init(): Promise<void> {
    const config = await getConfig();
    const state: State = { config };

    bindTabs();
    bindVersion();

    const save = async (): Promise<void> => {
        try {
            await setConfig(state.config);
            showToast('Saglabāts');
        } catch (err: unknown) {
            console.error('[4Restaurant] Save failed:', err);
            showToast('Kļūda saglabājot', 'error');
        }
    };

    renderCategoriesTab(panel('categories'), state, save);
    renderDynamicColumnsTab(panel('dynamic-columns'), state, save);
    renderFileNamesTab(panel('file-names'), state, save);
}

function bindTabs(): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset['tab'];
            if (!id) return;
            document.querySelectorAll<HTMLButtonElement>('.tab').forEach((t) => {
                const active = t.dataset['tab'] === id;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            document.querySelectorAll<HTMLElement>('.panel').forEach((p) => {
                p.classList.toggle('active', p.id === `tab-${id}`);
            });
        });
    });
}

function bindVersion(): void {
    const el = document.querySelector<HTMLElement>('[data-version]');
    if (!el) return;
    const version = chrome.runtime?.getManifest?.().version ?? '';
    el.textContent = version ? `v${version}` : '';
}

function panel(id: string): HTMLElement {
    const el = document.getElementById(`tab-${id}`);
    if (!el) throw new Error(`Panel not found: ${id}`);
    return el;
}

void init();
