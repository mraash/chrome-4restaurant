interface SignatureReplacement {
    source: string;
    target: string;
}

const SIGNATURE_REPLACEMENTS: SignatureReplacement[] = [
    { source: 'Virtuves vadītāja', target: 'Pārtikas noliktavas prečzinis' },
    { source: 'Valdes priekšsēdētājs', target: 'Virtuves vadītāja' }
];

type ReplacementState = Set<string>;

const createState = (): ReplacementState =>
    new Set(SIGNATURE_REPLACEMENTS.map(rep => rep.source));

function runReplacements(value: string, state: ReplacementState): string {
    let result = value;
    for (const { source, target } of SIGNATURE_REPLACEMENTS) {
        if (!state.has(source)) continue;
        const hasSource = result.includes(source);
        const hasTarget = result.includes(target);
        if (!hasSource && hasTarget) {
            state.delete(source); // already rewritten earlier in DOM
            continue;
        }
        if (hasSource) {
            result = result.replace(source, target);
            state.delete(source);
        }
    }
    return result;
}

export function applySignatureReplacementsToLines(lines: string[]): string[] {
    const state = createState();
    return lines.map(line => runReplacements(line, state));
}

export function updateSignatureLabelsAfterTable(table: HTMLTableElement): void {
    const state = createState();

    const applyToNode = (node: Node | null): void => {
        if (!node || state.size === 0) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const original = node.textContent ?? '';
            const updated = runReplacements(original, state);
            if (updated !== original) {
                node.textContent = updated;
            }
            return;
        }
        let child = node.firstChild;
        while (child && state.size > 0) {
            applyToNode(child);
            child = child.nextSibling;
        }
    };

    let cursor: Node | null = table;
    while (cursor && state.size > 0) {
        cursor = nextAfter(cursor);
        if (cursor) {
            applyToNode(cursor);
        }
    }
}

function nextAfter(node: Node | null): Node | null {
    if (!node) return null;
    if (node.nextSibling) return node.nextSibling;
    return nextAfter(node.parentNode);
}
