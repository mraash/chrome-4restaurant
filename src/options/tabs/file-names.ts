import type { State } from '../types';
import { escapeHtml } from '../ui';

export function renderFileNamesTab(
    root: HTMLElement,
    state: State,
    save: () => Promise<void>,
): void {
    const fn = state.config.fileNames;
    root.innerHTML = `
    <h1>Failu nosaukumi</h1>
    <p class="lead">Eksportēto failu nosaukumi (bez paplašinājuma — tas tiek pievienots automātiski).</p>

    <div class="field-row">
      <label for="excel-name">Excel eksports</label>
      <div>
        <input class="input" id="excel-name" type="text" value="${escapeHtml(fn.excel)}" data-field="excel">
        <div class="field-hint">.xlsx tiks pievienots automātiski</div>
      </div>
    </div>

    <div class="field-row">
      <label for="horizon-name">Horizon eksports</label>
      <div>
        <input class="input" id="horizon-name" type="text" value="${escapeHtml(fn.horizon)}" data-field="horizon">
        <div class="field-hint">.xls tiks pievienots automātiski (abi Horizon varianti izmanto vienu un to pašu nosaukumu)</div>
      </div>
    </div>

    <div class="save-bar">
      <button class="btn btn-primary" data-action="save">Saglabāt</button>
    </div>
  `;

    root.querySelector<HTMLInputElement>('[data-field="excel"]')?.addEventListener('input', (e) => {
        state.config.fileNames.excel = (e.target as HTMLInputElement).value;
    });

    root.querySelector<HTMLInputElement>('[data-field="horizon"]')?.addEventListener('input', (e) => {
        state.config.fileNames.horizon = (e.target as HTMLInputElement).value;
    });

    root.querySelector<HTMLButtonElement>('[data-action="save"]')?.addEventListener('click', () => {
        void save();
    });
}
