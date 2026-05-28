import { useState, useRef, useEffect } from 'preact/hooks';
import type { Category, ExtensionConfig } from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/constants';
import type { TabProps } from '../App';
import styles from './CategoriesTab.module.css';

export function CategoriesTab({ config, onChange, onSave, onToast }: TabProps) {
    const [selectedId, setSelectedId] = useState<string | null>(
        config.categories[0]?.id ?? null,
    );
    const catListRef = useRef<HTMLDivElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const focusLastRule = useRef(false);

    const selectedCat = config.categories.find(c => c.id === selectedId) ?? null;

    // --- Category CRUD ---

    function addCategory(): void {
        const cat: Category = { id: uniqueId('cat'), name: '', rules: [] };
        onChange(prev => ({ ...prev, categories: [...prev.categories, cat] }));
        setSelectedId(cat.id);
    }

    function deleteCategory(): void {
        if (!selectedCat) return;
        const label = selectedCat.name || 'šo kategoriju';
        if (!confirm(`Dzēst "${label}"?`)) return;
        const idx = config.categories.findIndex(c => c.id === selectedId);
        const next = config.categories.filter(c => c.id !== selectedId);
        setSelectedId(next[idx]?.id ?? next[idx - 1]?.id ?? null);
        onChange(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== selectedId) }));
    }

    function updateCategoryName(name: string): void {
        onChange(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === selectedId ? { ...c, name } : c),
        }));
    }

    function addRule(): void {
        if (!selectedCat) return;
        onChange(prev => ({
            ...prev,
            categories: prev.categories.map(c =>
                c.id === selectedId ? { ...c, rules: [...c.rules, { keyword: '' }] } : c,
            ),
        }));
        focusLastRule.current = true;
    }

    function updateRule(idx: number, keyword: string): void {
        onChange(prev => ({
            ...prev,
            categories: prev.categories.map(c =>
                c.id === selectedId
                    ? { ...c, rules: c.rules.map((r, i) => i === idx ? { keyword } : r) }
                    : c,
            ),
        }));
    }

    function deleteRule(idx: number): void {
        onChange(prev => ({
            ...prev,
            categories: prev.categories.map(c =>
                c.id === selectedId
                    ? { ...c, rules: c.rules.filter((_, i) => i !== idx) }
                    : c,
            ),
        }));
    }

    // --- Drag & drop ---

    function handleDragStart(e: DragEvent): void {
        (e.currentTarget as HTMLElement).classList.add(styles.dragging!);
    }

    function handleDragEnd(e: DragEvent): void {
        (e.currentTarget as HTMLElement).classList.remove(styles.dragging!);
        const list = catListRef.current;
        if (!list) return;
        const newOrder = Array.from(list.querySelectorAll<HTMLElement>('[data-cat-id]'))
            .map(el => el.dataset['catId'])
            .filter((id): id is string => !!id);
        const byId = new Map(config.categories.map(c => [c.id, c]));
        onChange(prev => ({
            ...prev,
            categories: newOrder.map(id => byId.get(id)).filter((c): c is Category => !!c),
        }));
    }

    function handleDragOver(e: DragEvent): void {
        e.preventDefault();
        const list = catListRef.current;
        if (!list) return;
        const dragging = list.querySelector<HTMLElement>(`.${styles.catItem}.${styles.dragging}`);
        if (!dragging) return;
        const after = getDragAfterElement(list, e.clientY, `.${styles.catItem}:not(.${styles.dragging})`);
        if (after === null) list.appendChild(dragging);
        else list.insertBefore(dragging, after);
    }

    // --- Import / export ---

    async function handleImport(file: File): Promise<void> {
        if (!confirm('Importēt aizvietos visu pašreizējo konfigurāciju. Turpināt?')) return;
        try {
            const text = await file.text();
            const next = normalizeImportedConfig(JSON.parse(text) as unknown);
            onChange(() => next);
            await onSave();
            window.location.reload();
        } catch {
            onToast('Neizdevās importēt — nederīgs JSON', 'error');
        }
    }

    return (
        <div>
            <h1>Kategorijas</h1>
            <p class="lead">
                Pielāgo kategorijas un atslēgvārdus, pēc kuriem produkti tiek grupēti.
                Secība ir svarīga — produkti tiek saskaņoti no augšas uz leju.
            </p>
            <div class={styles.toolbar}>
                <div class={styles.actions}>
                    <button class="btn btn-primary" onClick={addCategory}>+ Pievienot kategoriju</button>
                </div>
                <div class={styles.actions}>
                    <button class="btn btn-ghost" onClick={() => importInputRef.current?.click()}>
                        Importēt JSON
                    </button>
                    <input
                        type="file"
                        accept="application/json,.json"
                        hidden
                        ref={importInputRef}
                        onChange={e => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) void handleImport(file);
                            (e.target as HTMLInputElement).value = '';
                        }}
                    />
                    <button class="btn btn-ghost" onClick={() => exportConfigAsJson(config)}>
                        Eksportēt JSON
                    </button>
                    <button class="btn btn-primary" onClick={() => void onSave()}>Saglabāt</button>
                </div>
            </div>
            <div class={styles.catLayout}>
                <div class={styles.catList} ref={catListRef} onDragOver={handleDragOver}>
                    {config.categories.length === 0
                        ? (
                            <div class="muted" style="padding:16px;text-align:center">
                                Vēl nav nevienas kategorijas.
                            </div>
                        )
                        : config.categories.map(cat => (
                            <div
                                key={cat.id}
                                class={`${styles.catItem}${cat.id === selectedId ? ` ${styles.active}` : ''}`}
                                draggable={true}
                                data-cat-id={cat.id}
                                onClick={() => setSelectedId(cat.id)}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <span class={styles.dragHandle} aria-hidden="true">≡</span>
                                <span class={styles.catName}>{cat.name || 'Bez nosaukuma'}</span>
                                <span class={styles.catCount}>{cat.rules.length}</span>
                            </div>
                        ))
                    }
                </div>
                <div class={styles.catDetail}>
                    {selectedCat
                        ? (
                            <CategoryDetail
                                key={selectedId!}
                                cat={selectedCat}
                                focusLastRule={focusLastRule}
                                onNameChange={updateCategoryName}
                                onDelete={deleteCategory}
                                onAddRule={addRule}
                                onUpdateRule={updateRule}
                                onDeleteRule={deleteRule}
                            />
                        )
                        : (
                            <div class={styles.empty}>
                                Izvēlies kategoriju no saraksta vai izveido jaunu, lai sāktu rediģēšanu.
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

// --- CategoryDetail sub-component ---
// key={selectedId} on the parent causes it to fully remount on category switch,
// so autoFocus fires correctly for the name input each time.

interface DetailProps {
    cat: Category;
    focusLastRule: { current: boolean };
    onNameChange: (name: string) => void;
    onDelete: () => void;
    onAddRule: () => void;
    onUpdateRule: (idx: number, keyword: string) => void;
    onDeleteRule: (idx: number) => void;
}

function CategoryDetail({
    cat,
    focusLastRule,
    onNameChange,
    onDelete,
    onAddRule,
    onUpdateRule,
    onDeleteRule,
}: DetailProps) {
    const ruleListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (focusLastRule.current && ruleListRef.current) {
            focusLastRule.current = false;
            const inputs = ruleListRef.current.querySelectorAll<HTMLInputElement>('input');
            inputs[inputs.length - 1]?.focus();
        }
    });

    return (
        <>
            <div class={styles.catDetailHeader}>
                <input
                    class="input"
                    type="text"
                    value={cat.name}
                    placeholder="Kategorijas nosaukums"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onInput={e => onNameChange((e.target as HTMLInputElement).value)}
                />
                <button class="btn btn-danger" onClick={onDelete}>Dzēst</button>
            </div>
            <h2>Atslēgvārdi</h2>
            <p class="muted" style="margin:0">
                Produkts pieder šai kategorijai, ja tā nosaukumā ir kaut viens no šiem
                atslēgvārdiem (reģistrjutības nav).
            </p>
            <div class={styles.ruleList} ref={ruleListRef}>
                {cat.rules.length === 0
                    ? <div class="muted">Vēl nav neviena atslēgvārda.</div>
                    : cat.rules.map((rule, i) => (
                        <div key={i} class={styles.ruleRow}>
                            <input
                                class="input"
                                type="text"
                                value={rule.keyword}
                                placeholder="Piem., piens"
                                onInput={e => onUpdateRule(i, (e.target as HTMLInputElement).value)}
                            />
                            <button
                                class="btn btn-danger btn-icon"
                                title="Dzēst atslēgvārdu"
                                aria-label="Dzēst atslēgvārdu"
                                onClick={() => onDeleteRule(i)}
                            >
                                ×
                            </button>
                        </div>
                    ))
                }
            </div>
            <button class="btn btn-ghost" style="margin-top:12px" onClick={onAddRule}>
                + Pievienot atslēgvārdu
            </button>
        </>
    );
}

// --- Utilities ---

function uniqueId(prefix = 'id'): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDragAfterElement(container: HTMLElement, y: number, candidateSelector: string): HTMLElement | null {
    const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(candidateSelector),
    );
    let best: { offset: number; el: HTMLElement | null } = {
        offset: Number.NEGATIVE_INFINITY,
        el: null,
    };
    for (const el of candidates) {
        const box = el.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > best.offset) best = { offset, el };
    }
    return best.el;
}

function exportConfigAsJson(config: ExtensionConfig): void {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '4restaurant-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeImportedConfig(raw: unknown): ExtensionConfig {
    if (!raw || typeof raw !== 'object') throw new Error('Expected JSON object');
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
                        return {
                            keyword: typeof rule['keyword'] === 'string' ? rule['keyword'] : '',
                        };
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
            totalColumn: typeof dcRaw['totalColumn'] === 'string'
                ? dcRaw['totalColumn']
                : DEFAULT_CONFIG.dynamicColumns.totalColumn,
            mealColumns: Array.isArray(dcRaw['mealColumns'])
                ? dcRaw['mealColumns'].filter((m: unknown): m is string => typeof m === 'string')
                : [...DEFAULT_CONFIG.dynamicColumns.mealColumns],
        },
        fileNames: {
            excel: typeof fnRaw['excel'] === 'string'
                ? fnRaw['excel']
                : DEFAULT_CONFIG.fileNames.excel,
            horizon: typeof fnRaw['horizon'] === 'string'
                ? fnRaw['horizon']
                : DEFAULT_CONFIG.fileNames.horizon,
        },
    };
}
