import type { TabProps } from '../App';

export function FileNamesTab({ config, onChange, onSave }: TabProps) {
    const fn = config.fileNames;

    return (
        <div>
            <h1>Failu nosaukumi</h1>
            <p class="lead">
                Eksportēto failu nosaukumi (bez paplašinājuma — tas tiek pievienots automātiski).
            </p>

            <div class="field-row">
                <label for="excel-name">Excel eksports</label>
                <div>
                    <input
                        class="input"
                        id="excel-name"
                        type="text"
                        value={fn.excel}
                        onInput={e => onChange(prev => ({
                            ...prev,
                            fileNames: {
                                ...prev.fileNames,
                                excel: (e.target as HTMLInputElement).value,
                            },
                        }))}
                    />
                    <div class="field-hint">.xlsx tiks pievienots automātiski</div>
                </div>
            </div>

            <div class="field-row">
                <label for="horizon-name">Horizon eksports</label>
                <div>
                    <input
                        class="input"
                        id="horizon-name"
                        type="text"
                        value={fn.horizon}
                        onInput={e => onChange(prev => ({
                            ...prev,
                            fileNames: {
                                ...prev.fileNames,
                                horizon: (e.target as HTMLInputElement).value,
                            },
                        }))}
                    />
                    <div class="field-hint">
                        .xls tiks pievienots automātiski (abi Horizon varianti izmanto vienu un to pašu nosaukumu)
                    </div>
                </div>
            </div>

            <div class="save-bar">
                <button class="btn btn-primary" onClick={() => void onSave()}>Saglabāt</button>
            </div>
        </div>
    );
}
