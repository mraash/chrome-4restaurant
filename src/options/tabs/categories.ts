import { DEFAULT_CONFIG } from '../../shared/constants';
import type { Category, ExtensionConfig } from '../../shared/types';
import type { State } from '../types';
import { escapeHtml, showToast, uniqueId } from '../ui';

interface UiState {
    selectedId: string | null;
}

export function renderCategoriesTab(
    root: HTMLElement,
    state: State,
    save: () => Promise<void>,
): void {
    const ui: UiState = { selectedId: state.config.categories[0]?.id ?? null };

    render();

    function render(): void {
        root.innerHTML = `
      <h1>Kategorijas</h1>
      <p class="lead">Pielāgo kategorijas un atslēgvārdus, pēc kuriem produkti tiek grupēti. Secība ir svarīga — produkti tiek saskaņoti no augšas uz leju.</p>
      <div class="toolbar">
        <div class="actions">
          <button class="btn btn-primary" data-action="add-category">+ Pievienot kategoriju</button>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" data-action="import">Importēt JSON</button>
          <button class="btn btn-ghost" data-action="export">Eksportēt JSON</button>
          <button class="btn btn-primary" data-action="save">Saglabāt</button>
        </div>
      </div>
      <input type="file" accept="application/json,.json" hidden data-import-input>
      <div class="cat-layout">
        <div class="cat-list" data-cat-list>${renderList()}</div>
        <div class="cat-detail" data-cat-detail>${renderDetail()}</div>
      </div>
    `;
        bind();
    }

    function renderList(): string {
        if (state.config.categories.length === 0) {
            return `<div class="muted" style="padding:16px;text-align:center">Vēl nav nevienas kategorijas.</div>`;
        }
        return state.config.categories
            .map(
                cat => `
        <div class="cat-item${cat.id === ui.selectedId ? ' active' : ''}"
             draggable="true"
             data-cat-id="${escapeHtml(cat.id)}">
          <span class="drag-handle" aria-hidden="true">≡</span>
          <span class="cat-name">${escapeHtml(cat.name || 'Bez nosaukuma')}</span>
          <span class="cat-count" data-count>${cat.rules.length}</span>
        </div>`,
            )
            .join('');
    }

    function renderDetail(): string {
        const cat = currentCategory();
        if (!cat) {
            return `<div class="empty">Izvēlies kategoriju no saraksta vai izveido jaunu, lai sāktu rediģēšanu.</div>`;
        }
        return `
      <div class="cat-detail-header">
        <input class="input" type="text" value="${escapeHtml(cat.name)}" placeholder="Kategorijas nosaukums" data-cat-name autofocus>
        <button class="btn btn-danger" data-action="delete-category">Dzēst</button>
      </div>
      <h2>Atslēgvārdi</h2>
      <p class="muted" style="margin:0">Produkts pieder šai kategorijai, ja tā nosaukumā ir kaut viens no šiem atslēgvārdiem (reģistrjutības nav).</p>
      <div class="rule-list" data-rule-list>
        ${renderRules(cat)}
      </div>
      <button class="btn btn-ghost" data-action="add-rule" style="margin-top:12px">+ Pievienot atslēgvārdu</button>
    `;
    }

    function renderRules(cat: Category): string {
        if (cat.rules.length === 0) {
            return `<div class="muted">Vēl nav neviena atslēgvārda.</div>`;
        }
        return cat.rules
            .map(
                (rule, i) => `
        <div class="rule-row" data-rule-index="${i}">
          <input class="input" type="text" value="${escapeHtml(rule.keyword)}" placeholder="Piem., piens" data-rule-input>
          <button class="btn btn-danger btn-icon" data-action="delete-rule" title="Dzēst atslēgvārdu" aria-label="Dzēst atslēgvārdu">×</button>
        </div>`,
            )
            .join('');
    }

    function currentCategory(): Category | undefined {
        return state.config.categories.find(c => c.id === ui.selectedId);
    }

    function bind(): void {
        bindToolbar();
        bindList();
        bindDetail();
    }

    function bindToolbar(): void {
        root.querySelector<HTMLButtonElement>('[data-action="add-category"]')?.addEventListener('click', () => {
            const cat: Category = { id: uniqueId('cat'), name: '', rules: [] };
            state.config.categories.push(cat);
            ui.selectedId = cat.id;
            render();
            focusNameInput();
        });

        root.querySelector<HTMLButtonElement>('[data-action="save"]')?.addEventListener('click', () => {
            void save();
        });

        root.querySelector<HTMLButtonElement>('[data-action="export"]')?.addEventListener('click', () => {
            exportConfigAsJson(state.config);
        });

        const importInput = root.querySelector<HTMLInputElement>('[data-import-input]');
        root.querySelector<HTMLButtonElement>('[data-action="import"]')?.addEventListener('click', () => {
            importInput?.click();
        });
        importInput?.addEventListener('change', () => {
            const file = importInput.files?.[0];
            if (file) void handleImport(file);
            importInput.value = '';
        });
    }

    function bindList(): void {
        const list = root.querySelector<HTMLElement>('[data-cat-list]');
        if (!list) return;

        list.querySelectorAll<HTMLElement>('.cat-item').forEach((item) => {
            item.addEventListener('click', () => {
                const id = item.dataset['catId'];
                if (!id) return;
                ui.selectedId = id;
                render();
            });

            item.addEventListener('dragstart', () => {
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                commitDragOrder(list);
            });
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = list.querySelector<HTMLElement>('.cat-item.dragging');
            if (!dragging) return;
            const after = getDragAfterElement(list, (e as DragEvent).clientY);
            if (after === null) {
                list.appendChild(dragging);
            } else {
                list.insertBefore(dragging, after);
            }
        });
    }

    function bindDetail(): void {
        const detail = root.querySelector<HTMLElement>('[data-cat-detail]');
        if (!detail) return;

        const nameInput = detail.querySelector<HTMLInputElement>('[data-cat-name]');
        nameInput?.addEventListener('input', () => {
            const cat = currentCategory();
            if (!cat) return;
            cat.name = nameInput.value;
            updateListItemName(cat);
        });

        detail.querySelector<HTMLButtonElement>('[data-action="delete-category"]')?.addEventListener('click', () => {
            const cat = currentCategory();
            if (!cat) return;
            const label = cat.name || 'šo kategoriju';
            if (!confirm(`Dzēst "${label}"?`)) return;
            const idx = state.config.categories.findIndex(c => c.id === cat.id);
            state.config.categories.splice(idx, 1);
            ui.selectedId = state.config.categories[idx]?.id ?? state.config.categories[idx - 1]?.id ?? null;
            render();
        });

        detail.querySelector<HTMLButtonElement>('[data-action="add-rule"]')?.addEventListener('click', () => {
            const cat = currentCategory();
            if (!cat) return;
            cat.rules.push({ keyword: '' });
            const ruleList = detail.querySelector<HTMLElement>('[data-rule-list]');
            if (ruleList) {
                ruleList.innerHTML = renderRules(cat);
                bindRules(detail);
                updateListItemCount(cat);
                focusLastRuleInput();
            }
        });

        bindRules(detail);
    }

    function bindRules(detail: HTMLElement): void {
        detail.querySelectorAll<HTMLElement>('.rule-row').forEach((row) => {
            const idx = Number(row.dataset['ruleIndex']);
            const input = row.querySelector<HTMLInputElement>('[data-rule-input]');
            const deleteBtn = row.querySelector<HTMLButtonElement>('[data-action="delete-rule"]');

            input?.addEventListener('input', () => {
                const cat = currentCategory();
                if (!cat || !cat.rules[idx]) return;
                cat.rules[idx].keyword = input.value;
            });

            deleteBtn?.addEventListener('click', () => {
                const cat = currentCategory();
                if (!cat) return;
                cat.rules.splice(idx, 1);
                const ruleList = detail.querySelector<HTMLElement>('[data-rule-list]');
                if (ruleList) {
                    ruleList.innerHTML = renderRules(cat);
                    bindRules(detail);
                    updateListItemCount(cat);
                }
            });
        });
    }

    function updateListItemName(cat: Category): void {
        const item = root.querySelector<HTMLElement>(`.cat-item[data-cat-id="${cssEscape(cat.id)}"] .cat-name`);
        if (item) item.textContent = cat.name || 'Bez nosaukuma';
    }

    function updateListItemCount(cat: Category): void {
        const item = root.querySelector<HTMLElement>(`.cat-item[data-cat-id="${cssEscape(cat.id)}"] [data-count]`);
        if (item) item.textContent = String(cat.rules.length);
    }

    function commitDragOrder(list: HTMLElement): void {
        const newOrder = Array.from(list.querySelectorAll<HTMLElement>('.cat-item'))
            .map(el => el.dataset['catId'])
            .filter((id): id is string => Boolean(id));
        const byId = new Map(state.config.categories.map(c => [c.id, c]));
        state.config.categories = newOrder
            .map(id => byId.get(id))
            .filter((c): c is Category => Boolean(c));
    }

    async function handleImport(file: File): Promise<void> {
        if (!confirm('Importēt aizvietos visu pašreizējo konfigurāciju. Turpināt?')) return;
        try {
            const text = await file.text();
            const raw = JSON.parse(text) as unknown;
            const next = normalizeConfig(raw);
            state.config = next;
            await save();
            // Full reload so all tabs reflect the imported state with their existing render-on-init flow.
            window.location.reload();
        } catch (err: unknown) {
            console.error('[4Restaurant] Import failed:', err);
            showToast('Neizdevās importēt — nederīgs JSON', 'error');
        }
    }

    function focusNameInput(): void {
        root.querySelector<HTMLInputElement>('[data-cat-name]')?.focus();
    }

    function focusLastRuleInput(): void {
        const inputs = root.querySelectorAll<HTMLInputElement>('.rule-row [data-rule-input]');
        inputs[inputs.length - 1]?.focus();
    }
}

function getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
    const candidates = Array.from(container.querySelectorAll<HTMLElement>('.cat-item:not(.dragging)'));
    let closest: { offset: number; element: HTMLElement | null } = {
        offset: Number.NEGATIVE_INFINITY,
        element: null,
    };
    for (const el of candidates) {
        const box = el.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            closest = { offset, element: el };
        }
    }
    return closest.element;
}

function exportConfigAsJson(config: ExtensionConfig): void {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '4restaurant-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeConfig(raw: unknown): ExtensionConfig {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Expected a JSON object at the top level');
    }
    const obj = raw as Record<string, unknown>;

    const categories: Category[] = Array.isArray(obj['categories'])
        ? obj['categories'].map((c: unknown): Category => {
                const cat = (c ?? {}) as Record<string, unknown>;
                return {
                    id: typeof cat['id'] === 'string' && cat['id'] ? cat['id'] : uniqueId('cat'),
                    name: typeof cat['name'] === 'string' ? cat['name'] : '',
                    rules: Array.isArray(cat['rules'])
                        ? cat['rules'].map((r: unknown) => {
                                const rule = (r ?? {}) as Record<string, unknown>;
                                return { keyword: typeof rule['keyword'] === 'string' ? rule['keyword'] : '' };
                            })
                        : [],
                };
            })
        : [];

    const dcRaw = (obj['dynamicColumns'] ?? {}) as Record<string, unknown>;
    const fnRaw = (obj['fileNames'] ?? {}) as Record<string, unknown>;

    return {
        categories,
        dynamicColumns: {
            totalColumn:
        typeof dcRaw['totalColumn'] === 'string' ? dcRaw['totalColumn'] : DEFAULT_CONFIG.dynamicColumns.totalColumn,
            mealColumns: Array.isArray(dcRaw['mealColumns'])
                ? dcRaw['mealColumns'].filter((m: unknown): m is string => typeof m === 'string')
                : [...DEFAULT_CONFIG.dynamicColumns.mealColumns],
        },
        fileNames: {
            excel: typeof fnRaw['excel'] === 'string' ? fnRaw['excel'] : DEFAULT_CONFIG.fileNames.excel,
            horizon: typeof fnRaw['horizon'] === 'string' ? fnRaw['horizon'] : DEFAULT_CONFIG.fileNames.horizon,
        },
    };
}

/** Minimal CSS.escape polyfill for the few selectors built from category IDs. */
function cssEscape(s: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
    return s.replace(/["\\]/g, '\\$&');
}
