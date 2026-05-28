import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { ExtensionConfig } from '../shared/types';
import { getConfig, setConfig as persistConfig } from '../shared/storage';
import { CategoriesTab } from './tabs/CategoriesTab';
import { DynamicColumnsTab } from './tabs/DynamicColumnsTab';
import { FileNamesTab } from './tabs/FileNamesTab';
import styles from './App.module.css';

type TabId = 'categories' | 'dynamic-columns' | 'file-names';

export type OnChange = (updater: (prev: ExtensionConfig) => ExtensionConfig) => void;

export interface TabProps {
    config: ExtensionConfig;
    onChange: OnChange;
    onSave: () => Promise<void>;
    onToast: (msg: string, kind?: 'success' | 'error') => void;
}

const TABS: Array<{ id: TabId; label: string }> = [
    { id: 'categories', label: 'Kategorijas' },
    { id: 'dynamic-columns', label: 'Dinamiskās kolonnas' },
    { id: 'file-names', label: 'Failu nosaukumi' },
];

interface ToastState {
    message: string;
    kind: 'success' | 'error';
    id: number;
}

export function App() {
    const [config, setConfig] = useState<ExtensionConfig | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('categories');
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>();
    const [version, setVersion] = useState('');

    useEffect(() => {
        void getConfig().then(setConfig);
        const v = chrome.runtime?.getManifest?.().version ?? '';
        if (v) setVersion(`v${v}`);
    }, []);

    const updateConfig: OnChange = useCallback(
        (updater) => setConfig(prev => (prev ? updater(prev) : prev)),
        [],
    );

    function showToast(message: string, kind: 'success' | 'error' = 'success'): void {
        clearTimeout(toastTimer.current);
        setToast({ message, kind, id: Date.now() });
        toastTimer.current = setTimeout(() => setToast(null), 2200);
    }

    async function save(): Promise<void> {
        if (!config) return;
        try {
            await persistConfig(config);
            showToast('Saglabāts');
        } catch (err: unknown) {
            console.error('[4Restaurant] Save failed:', err);
            showToast('Kļūda saglabājot', 'error');
        }
    }

    if (!config) return null;

    const tabProps: TabProps = { config, onChange: updateConfig, onSave: save, onToast: showToast };

    return (
        <div class={styles.app}>
            <aside class={styles.sidebar}>
                <div class={styles.brand}>
                    <div class={styles.brandMark} aria-hidden="true" />
                    <div class={styles.brandName}>4Restaurant</div>
                </div>
                <nav class={styles.tabs} role="tablist">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            class={`${styles.tab}${activeTab === tab.id ? ` ${styles.active}` : ''}`}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
                <div class={styles.sidebarFooter}>
                    {version && <span class={styles.version}>{version}</span>}
                </div>
            </aside>
            <main class={styles.content}>
                {activeTab === 'categories' && <CategoriesTab {...tabProps} />}
                {activeTab === 'dynamic-columns' && <DynamicColumnsTab {...tabProps} />}
                {activeTab === 'file-names' && <FileNamesTab {...tabProps} />}
                {toast && (
                    <div key={toast.id} class={`toast${toast.kind === 'error' ? ' error' : ''}`}>
                        {toast.message}
                    </div>
                )}
            </main>
        </div>
    );
}
