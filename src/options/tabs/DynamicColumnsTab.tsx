import { useRef, useEffect } from 'preact/hooks';
import type { TabProps } from '../App';
import styles from './DynamicColumnsTab.module.css';

export function DynamicColumnsTab({ config, onChange, onSave }: TabProps) {
    const dc = config.dynamicColumns;
    const mealListRef = useRef<HTMLDivElement>(null);
    const prevMealCount = useRef(dc.mealColumns.length);

    useEffect(() => {
        const current = dc.mealColumns.length;
        if (current > prevMealCount.current && mealListRef.current) {
            const inputs = mealListRef.current.querySelectorAll<HTMLInputElement>('input');
            inputs[inputs.length - 1]?.focus();
        }
        prevMealCount.current = current;
    });

    function addMeal(): void {
        onChange(prev => ({
            ...prev,
            dynamicColumns: {
                ...prev.dynamicColumns,
                mealColumns: [...prev.dynamicColumns.mealColumns, ''],
            },
        }));
    }

    function updateMeal(idx: number, value: string): void {
        onChange(prev => ({
            ...prev,
            dynamicColumns: {
                ...prev.dynamicColumns,
                mealColumns: prev.dynamicColumns.mealColumns.map((m, i) => i === idx ? value : m),
            },
        }));
    }

    function deleteMeal(idx: number): void {
        onChange(prev => ({
            ...prev,
            dynamicColumns: {
                ...prev.dynamicColumns,
                mealColumns: prev.dynamicColumns.mealColumns.filter((_, i) => i !== idx),
            },
        }));
    }

    return (
        <div>
            <h1>Dinamiskās kolonnas</h1>
            <p class="lead">
                Kolonnu nosaukumi, kas tiek izmantoti proporcionālajai dalīšanai Excel eksportā.
                Pēdējā maltītes kolonna saņem bilances formulu, lai summa precīzi sakrīt ar kopējo daudzumu.
            </p>

            <div class="field-row">
                <label for="total-col">"Kopā" kolonnas nosaukums</label>
                <div>
                    <input
                        class="input"
                        id="total-col"
                        type="text"
                        value={dc.totalColumn}
                        onInput={e => onChange(prev => ({
                            ...prev,
                            dynamicColumns: {
                                ...prev.dynamicColumns,
                                totalColumn: (e.target as HTMLInputElement).value,
                            },
                        }))}
                    />
                    <div class="field-hint">
                        Tabulas galvenes virsraksts, kura vērtība tiek izmantota proporciju aprēķinam.
                    </div>
                </div>
            </div>

            <div class="field-row">
                <label>Maltīšu kolonnas</label>
                <div>
                    <div class={styles.mealList} ref={mealListRef}>
                        {dc.mealColumns.length === 0
                            ? <div class="muted">Nav nevienas maltītes kolonnas.</div>
                            : dc.mealColumns.map((name, i) => (
                                <div key={i} class={styles.mealRow}>
                                    <input
                                        class="input"
                                        type="text"
                                        value={name}
                                        placeholder="Piem., 1. Brokastis"
                                        onInput={e => updateMeal(i, (e.target as HTMLInputElement).value)}
                                    />
                                    <button
                                        class="btn btn-danger btn-icon"
                                        title="Dzēst kolonnu"
                                        aria-label="Dzēst kolonnu"
                                        onClick={() => deleteMeal(i)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                    <button class="btn btn-ghost" style="margin-top:8px" onClick={addMeal}>
                        + Pievienot kolonnu
                    </button>
                    <div class="field-hint">
                        Secība atbilst tabulas kolonnu secībai. Pēdējā kolonna saņem bilances formulu.
                    </div>
                </div>
            </div>

            <div class="save-bar">
                <button class="btn btn-primary" onClick={() => void onSave()}>Saglabāt</button>
            </div>
        </div>
    );
}
