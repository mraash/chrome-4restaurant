import type { State } from '../types';
import { escapeHtml } from '../ui';

export function renderDynamicColumnsTab(
    root: HTMLElement,
    state: State,
    save: () => Promise<void>,
): void {
    render();

    function render(): void {
        const dc = state.config.dynamicColumns;
        root.innerHTML = `
      <h1>Dinamiskās kolonnas</h1>
      <p class="lead">Kolonnu nosaukumi, kas tiek izmantoti proporcionālajai dalīšanai Excel eksportā. Pēdējā maltītes kolonna saņem bilances formulu, lai summa precīzi sakrīt ar kopējo daudzumu.</p>

      <div class="field-row">
        <label for="total-col">"Kopā" kolonnas nosaukums</label>
        <div>
          <input class="input" id="total-col" type="text" value="${escapeHtml(dc.totalColumn)}" data-field="total">
          <div class="field-hint">Tabulas galvenes virsraksts, kura vērtība tiek izmantota proporciju aprēķinam.</div>
        </div>
      </div>

      <div class="field-row">
        <label>Maltīšu kolonnas</label>
        <div>
          <div class="meal-list" data-meal-list>${renderMeals()}</div>
          <button class="btn btn-ghost" data-action="add-meal" style="margin-top:8px">+ Pievienot kolonnu</button>
          <div class="field-hint">Secība atbilst tabulas kolonnu secībai. Pēdējā kolonna saņem bilances formulu.</div>
        </div>
      </div>

      <div class="save-bar">
        <button class="btn btn-primary" data-action="save">Saglabāt</button>
      </div>
    `;
        bind();
    }

    function renderMeals(): string {
        const meals = state.config.dynamicColumns.mealColumns;
        if (meals.length === 0) {
            return `<div class="muted">Nav nevienas maltītes kolonnas.</div>`;
        }
        return meals
            .map(
                (name, i) => `
        <div class="meal-row" data-meal-index="${i}">
          <input class="input" type="text" value="${escapeHtml(name)}" placeholder="Piem., 1. Brokastis" data-meal-input>
          <button class="btn btn-danger btn-icon" data-action="delete-meal" title="Dzēst kolonnu" aria-label="Dzēst kolonnu">×</button>
        </div>`,
            )
            .join('');
    }

    function bind(): void {
        root.querySelector<HTMLInputElement>('[data-field="total"]')?.addEventListener('input', (e) => {
            state.config.dynamicColumns.totalColumn = (e.target as HTMLInputElement).value;
        });

        root.querySelector<HTMLButtonElement>('[data-action="add-meal"]')?.addEventListener('click', () => {
            state.config.dynamicColumns.mealColumns.push('');
            const list = root.querySelector<HTMLElement>('[data-meal-list]');
            if (list) {
                list.innerHTML = renderMeals();
                bindMeals();
                focusLastMealInput();
            }
        });

        root.querySelector<HTMLButtonElement>('[data-action="save"]')?.addEventListener('click', () => {
            void save();
        });

        bindMeals();
    }

    function bindMeals(): void {
        root.querySelectorAll<HTMLElement>('.meal-row').forEach((row) => {
            const idx = Number(row.dataset['mealIndex']);
            const input = row.querySelector<HTMLInputElement>('[data-meal-input]');
            const del = row.querySelector<HTMLButtonElement>('[data-action="delete-meal"]');

            input?.addEventListener('input', () => {
                state.config.dynamicColumns.mealColumns[idx] = input.value;
            });

            del?.addEventListener('click', () => {
                state.config.dynamicColumns.mealColumns.splice(idx, 1);
                const list = root.querySelector<HTMLElement>('[data-meal-list]');
                if (list) {
                    list.innerHTML = renderMeals();
                    bindMeals();
                }
            });
        });
    }

    function focusLastMealInput(): void {
        const inputs = root.querySelectorAll<HTMLInputElement>('.meal-row [data-meal-input]');
        inputs[inputs.length - 1]?.focus();
    }
}
